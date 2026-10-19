import type { Maze, Point } from "./types";
import { canOccupy, isWall } from "./movement";
/** Shared startup/test validation. Invalid geometry never starts a timed run. */
export function validateMaze(maze: Maze): string[] {
  const errors: string[] = [];
  if (
    !maze ||
    maze.schemaVersion !== 1 ||
    !Number.isInteger(maze.gridWidth) ||
    !Number.isInteger(maze.gridHeight) ||
    maze.gridWidth < 3 ||
    maze.gridHeight < 3 ||
    !Array.isArray(maze.cells) ||
    maze.cells.length !== maze.gridHeight ||
    maze.cells.some(
      (row) =>
        typeof row !== "string" ||
        row.length !== maze.gridWidth ||
        /[^.#]/.test(row),
    )
  )
    return ["invalid-grid"];
  for (let y = 0; y < maze.gridHeight; y++)
    for (let x = 0; x < maze.gridWidth; x++) {
      if (
        (x === 0 ||
          y === 0 ||
          x === maze.gridWidth - 1 ||
          y === maze.gridHeight - 1) &&
        !isWall(maze, x, y)
      )
        errors.push("open-boundary");
    }
  if (!canOccupy(maze, maze.entrance) || !canOccupy(maze, maze.home))
    return [...errors, "blocked-endpoint"];
  const seen = new Set<string>();
  const queue: Point[] = [
    { x: Math.floor(maze.entrance.x), y: Math.floor(maze.entrance.y) },
  ];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      key = `${p.x},${p.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = p.x + dx,
        y = p.y + dy;
      if (!isWall(maze, x, y) && !seen.has(`${x},${y}`)) queue.push({ x, y });
    }
  }
  if (!seen.has(`${Math.floor(maze.home.x)},${Math.floor(maze.home.y)}`))
    errors.push("unreachable-home");
  const floors = maze.cells
    .join("")
    .split("")
    .filter((c) => c === ".").length;
  if (seen.size !== floors) errors.push("disconnected-floor");
  return [...new Set(errors)];
}
