import type { Input, Maze, Point } from "./types";
export const PLAYER_RADIUS = 0.28;
export const PLAYER_WIDTH = 0.8;
export const MOVE_SPEED = 3.0;
export function isWall(maze: Maze, x: number, y: number): boolean {
  return (
    x < 0 ||
    y < 0 ||
    x >= maze.gridWidth ||
    y >= maze.gridHeight ||
    maze.cells[y][x] === "#"
  );
}
/** Circle against tile AABBs. The same footprint is used at every frame rate. */
export function canOccupy(maze: Maze, p: Point): boolean {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  for (
    let y = Math.floor(p.y - PLAYER_RADIUS);
    y <= Math.floor(p.y + PLAYER_RADIUS);
    y++
  ) {
    for (
      let x = Math.floor(p.x - PLAYER_RADIUS);
      x <= Math.floor(p.x + PLAYER_RADIUS);
      x++
    ) {
      if (!isWall(maze, x, y)) continue;
      const dx = p.x - Math.max(x, Math.min(p.x, x + 1));
      const dy = p.y - Math.max(y, Math.min(p.y, y + 1));
      if (dx * dx + dy * dy < PLAYER_RADIUS * PLAYER_RADIUS - 1e-10)
        return false;
    }
  }
  return true;
}
/** Small substeps prevent tunnelling; independent axis resolution permits sliding. */
export function move(
  maze: Maze,
  position: Point,
  input: Input,
  seconds: number,
): Point {
  const length = Math.hypot(input.x, input.y);
  if (length === 0) return { ...position };
  const distance = Math.max(0, seconds) * MOVE_SPEED;
  const steps = Math.max(1, Math.ceil(distance / 0.08));
  const dx = ((input.x / Math.max(1, length)) * distance) / steps;
  const dy = ((input.y / Math.max(1, length)) * distance) / steps;
  const p = { ...position };
  for (let i = 0; i < steps; i++) {
    if (canOccupy(maze, { x: p.x + dx, y: p.y })) p.x += dx;
    if (canOccupy(maze, { x: p.x, y: p.y + dy })) p.y += dy;
  }
  return p;
}
export function atHome(maze: Maze, position: Point): boolean {
  return (
    Math.hypot(position.x - maze.home.x, position.y - maze.home.y) <=
    0.35 + 1e-9
  );
}

/** First intersection of a motion segment and the destination circle (0..1). */
export function homeEntryFraction(
  maze: Maze,
  from: Point,
  to: Point,
): number | null {
  if (atHome(maze, from)) return 0;
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const ox = from.x - maze.home.x,
    oy = from.y - maze.home.y;
  const a = dx * dx + dy * dy,
    b = 2 * (ox * dx + oy * dy),
    c = ox * ox + oy * oy - 0.35 * 0.35;
  const discriminant = b * b - 4 * a * c;
  if (a === 0 || discriminant < 0) return null;
  const entry = (-b - Math.sqrt(discriminant)) / (2 * a);
  return entry >= 0 && entry <= 1 ? entry : null;
}
