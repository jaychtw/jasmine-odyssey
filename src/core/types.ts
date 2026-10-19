/** World coordinates: x increases right, y increases down; one cell = 1 unit.
 * cells are row-major; # is a wall, . is floor. Positions refer to cell centers.
 * No renderer, browser, or engine types belong in the core. */
export type Point = { x: number; y: number };
export interface Maze {
  schemaVersion: 1;
  mazeId: string;
  nameKey: string;
  gridWidth: number;
  gridHeight: number;
  cells: readonly string[];
  entrance: Point;
  home: Point;
  objects: readonly WorldObject[];
  design: string;
}
export interface WorldObject {
  id: string;
  kind: "home";
  position: Point;
}
export type SessionStatus = "playing" | "paused" | "completed";
export interface RunRecord {
  schemaVersion: 1;
  mazeId: string;
  playerName: string;
  completionTimeMs: number;
  lanternUses: number;
  noLanternRun: boolean;
  completedAt: string;
}
export type Input = { x: number; y: number };
