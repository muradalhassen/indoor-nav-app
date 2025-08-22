import PF from 'pathfinding';

const RADIUS_CM = 10;
const PIXELS_PER_CM = 1; // Adjust based on your scale
const RADIUS_PIXELS = RADIUS_CM * PIXELS_PER_CM;

export const findPath = (start, end) => {
  const grid = new PF.Grid(500, 500); // Define your grid size

  // Mark the radius around each point as an obstacle
  const markObstacles = (points) => {
    points.forEach(({ x, y }) => {
      for (let dx = -RADIUS_PIXELS; dx <= RADIUS_PIXELS; dx++) {
        for (let dy = -RADIUS_PIXELS; dy <= RADIUS_PIXELS; dy++) {
          if (dx * dx + dy * dy <= RADIUS_PIXELS * RADIUS_PIXELS) {
            grid.setWalkableAt(x + dx, y + dy, false);
          }
        }
      }
    });
  };

  markObstacles([{ x: 34, y: 239 }]); // Example points

  const finder = new PF.AStarFinder();
  return finder.findPath(start.x, start.y, end.x, end.y, grid);
};
