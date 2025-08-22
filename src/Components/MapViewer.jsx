import React, { useRef, useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { tableMap } from '../utils/mapCoordinates';

export default function MapViewer({ file, highlight, tableNum }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [pageHeight, setPageHeight] = useState(window.innerHeight * 0.8);

  const ORIGINAL_WIDTH = 1000;
  const ORIGINAL_HEIGHT = 1400;

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

  const scale = containerWidth / ORIGINAL_WIDTH;
  const scaledX = highlight ? highlight.x * scale : null;
  const scaledY = highlight ? highlight.y * scale : null;

  const getPolylinePath = () => {
    if (!highlight || !tableNum) return [];

    const tableNumber = parseInt(tableNum);

    // Set proper starting point for the line
    const startPoint =
      tableNumber <= 150
        ? { x: 34, y: 239 } // Checkpoint 000
        : { x: 963, y: 36 }; // Checkpoint 111 (you said 36 not 35)

    return [startPoint, highlight];
  };

  const polylinePoints = getPolylinePath()
    .map(point => `${point.x * scale},${point.y * scale}`)
    .join(' ');

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

      {highlight && (
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
          {/* Red highlight circle */}
          <circle
            cx={scaledX}
            cy={scaledY}
            r={8}
            fill="red"
            opacity="0.6"
          />

          {/* Blue dotted polyline path */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="blue"
            strokeWidth="3"
            strokeDasharray="5,4"
            opacity="0.8"
          />
        </svg>
      )}

      {/* Dev tool: click to get raw coordinates */}
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
