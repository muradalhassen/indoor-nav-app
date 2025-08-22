import React, { useRef, useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import PF from 'pathfinding';
import { tableMap } from '../utils/mapCoordinates';

export default function MapViewer({ file, highlight, tableNumber }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [pageHeight, setPageHeight] = useState(window.innerHeight * 0.8);

  const ORIGINAL_WIDTH = 1000;
  const ORIGINAL_HEIGHT = 1400;
  const scale = containerWidth / ORIGINAL_WIDTH;

  const scaledX = highlight ? highlight.x * scale : null;
  const scaledY = highlight ? highlight.y * scale : null;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setPageHeight(window.innerHeight * 0.8);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPath = () => {
    if (!highlight || !tableNumber) return [];

    // Choose start point based on table number range
    const startPoint = tableNumber >= 151 && tableNumber <= 294
      ? { x: 963, y: 35 }  // Table 111 for tables 151-294
      : { x: 34, y: 239 }; // Table 000 for tables 1-150

    const RADIUS_CM = 10;
    const PIXELS_PER_CM = 1;
    const RADIUS_PIXELS = RADIUS_CM * PIXELS_PER_CM;

    // Create a very restrictive grid that ONLY uses major pathways
    const grid = new PF.Grid(1000, 1400);
    
    // Define ONLY the major walkways - no small gaps between tables
    const majorWalkways = [
      // Major horizontal corridors (wide openings only)
      { x1: 0, y1: 0, x2: 1000, y2: 60 },      // Top perimeter (wide)
      { x1: 0, y1: 250, x2: 1000, y2: 270 },   // Major middle corridor
      { x1: 0, y1: 470, x2: 1000, y2: 1400 },  // Bottom area (wide)
      
      // Major vertical corridors (biggest gaps only)
      { x1: 0, y1: 0, x2: 60, y2: 1400 },      // Left perimeter (wide)
      { x1: 940, y1: 0, x2: 1000, y2: 1400 },  // Right perimeter (wide)
      { x1: 400, y1: 0, x2: 520, y2: 1400 },   // Major center corridor (big gap)
      { x1: 630, y1: 0, x2: 720, y2: 1400 },   // Another major center corridor
    ];

    // Start with everything blocked
    for (let x = 0; x < 1000; x++) {
      for (let y = 0; y < 1400; y++) {
        grid.setWalkableAt(x, y, false);
      }
    }

    // Only mark the major walkways as walkable
    majorWalkways.forEach(({ x1, y1, x2, y2 }) => {
      for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
          if (x >= 0 && x < 1000 && y >= 0 && y < 1400) {
            grid.setWalkableAt(x, y, true);
          }
        }
      }
    });

    // Create connection paths from start/end to nearest major walkway
    const connectToWalkway = (point) => {
      // Find the nearest major walkway and create a direct connection
      let nearestWalkway = null;
      let minDistance = Infinity;
      
      majorWalkways.forEach((walkway) => {
        // Calculate distance to this walkway
        const centerX = (walkway.x1 + walkway.x2) / 2;
        const centerY = (walkway.y1 + walkway.y2) / 2;
        const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestWalkway = walkway;
        }
      });
      
      if (nearestWalkway) {
        // Create a straight line connection to the nearest walkway
        const targetX = Math.max(nearestWalkway.x1, Math.min(nearestWalkway.x2, point.x));
        const targetY = Math.max(nearestWalkway.y1, Math.min(nearestWalkway.y2, point.y));
        
        // Draw line from point to walkway
        const steps = Math.max(Math.abs(targetX - point.x), Math.abs(targetY - point.y));
        for (let i = 0; i <= steps; i++) {
          const x = Math.round(point.x + (targetX - point.x) * (i / steps));
          const y = Math.round(point.y + (targetY - point.y) * (i / steps));
          if (x >= 0 && x < 1000 && y >= 0 && y < 1400) {
            grid.setWalkableAt(x, y, true);
          }
        }
      }
    };

    // Connect start and end points to major walkways
    connectToWalkway(startPoint);
    connectToWalkway(highlight);

    // Use Dijkstra finder for better pathfinding through defined walkways
    const finder = new PF.DijkstraFinder();
    const rawPath = finder.findPath(
      startPoint.x,
      startPoint.y,
      highlight.x,
      highlight.y,
      grid.clone()  // Clone the grid as pathfinding modifies it
    );

    console.log('Pathfinding:', {
      start: startPoint,
      end: highlight,
      pathLength: rawPath.length,
      tableNumber
    });

    return rawPath.map(([x, y]) => ({ x, y }));
  };

  const pathPoints = getPath();
  const polylinePoints = pathPoints
    .map(({ x, y }) => `${x * scale},${y * scale}`)
    .join(' ');

  console.log('Path rendering:', {
    pathPointsCount: pathPoints.length,
    polylinePoints: polylinePoints.substring(0, 100) + '...',
    scale
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        maxWidth: '100%',
        height: pageHeight,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Document file={file}>
        <Page pageNumber={1} width={containerWidth} />
      </Document>

      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${containerWidth}px`,
          height: `${pageHeight}px`,
          pointerEvents: 'none',
        }}
      >
        {/* Starting Point - Dynamic based on table range */}
        {tableNumber && (
          <>
            <circle 
              cx={tableNumber >= 151 && tableNumber <= 294 ? 963 * scale : 34 * scale} 
              cy={tableNumber >= 151 && tableNumber <= 294 ? 35 * scale : 239 * scale} 
              r={6} 
              fill="green" 
              opacity="0.8" 
            />
            <text 
              x={tableNumber >= 151 && tableNumber <= 294 ? 963 * scale : 34 * scale} 
              y={tableNumber >= 151 && tableNumber <= 294 ? 35 * scale - 12 : 239 * scale - 12} 
              textAnchor="middle" 
              fontSize="12" 
              fill="green" 
              fontWeight="bold"
            >
              START
            </text>
          </>
        )}

        {/* Highlighted Table */}
        {highlight && (
          <>
            <circle cx={scaledX} cy={scaledY} r={8} fill="red" opacity="0.6" />
            <text 
              x={scaledX} 
              y={scaledY - 12} 
              textAnchor="middle" 
              fontSize="12" 
              fill="red" 
              fontWeight="bold"
            >
              {tableNumber}
            </text>
          </>
        )}

        {/* Debug: Show MAJOR walkways only (change false to true to see walkways) */}
        {false && tableNumber && (
          <>
            {/* Major horizontal corridors */}
            <rect x={0} y={0} width={containerWidth} height={60 * scale} fill="lightblue" opacity="0.3" />
            <rect x={0} y={250 * scale} width={containerWidth} height={20 * scale} fill="lightblue" opacity="0.3" />
            <rect x={0} y={470 * scale} width={containerWidth} height={(1400 - 470) * scale} fill="lightblue" opacity="0.3" />
            
            {/* Major vertical corridors */}
            <rect x={0} y={0} width={60 * scale} height={pageHeight} fill="lightgreen" opacity="0.3" />
            <rect x={940 * scale} y={0} width={60 * scale} height={pageHeight} fill="lightgreen" opacity="0.3" />
            <rect x={400 * scale} y={0} width={120 * scale} height={pageHeight} fill="lightgreen" opacity="0.3" />
            <rect x={630 * scale} y={0} width={90 * scale} height={pageHeight} fill="lightgreen" opacity="0.3" />
          </>
        )}

        {/* Path following walkways */}
        {pathPoints.length > 0 && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="blue"
            strokeWidth="4"
            strokeDasharray="8,4"
            opacity="0.9"
          />
        )}
      </svg>

      {/* Developer Coordinate Tool */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const originalX = Math.round(clickX / scale);
          const originalY = Math.round(clickY / scale);
          console.log(`Clicked PDF at: x=${originalX}, y=${originalY}`);
          alert(`x: ${originalX}, y: ${originalY}`);
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: containerWidth,
          height: pageHeight,
          zIndex: 10,
          cursor: 'crosshair',
        }}
      />
    </div>
  );
}
