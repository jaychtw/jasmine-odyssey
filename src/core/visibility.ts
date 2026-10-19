import type { Maze, Point } from "./types";
export const NORMAL_RADIUS = 1.05;
export const FOG_RESOLUTION = 8;
/** Subcell exploration retains actual circular reveals, including through walls. */
export class Visibility {
  readonly width: number;
  readonly height: number;
  readonly exploredAreas: Uint8Array;
  revision = 0;
  constructor(maze: Maze) {
    this.width = maze.gridWidth * FOG_RESOLUTION;
    this.height = maze.gridHeight * FOG_RESOLUTION;
    this.exploredAreas = new Uint8Array(this.width * this.height);
  }
  reveal(position: Point, radius: number): void {
    const r = FOG_RESOLUTION;
    let changed = false;
    for (
      let y = Math.max(0, Math.floor((position.y - radius) * r));
      y < Math.min(this.height, Math.ceil((position.y + radius) * r));
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor((position.x - radius) * r));
        x < Math.min(this.width, Math.ceil((position.x + radius) * r));
        x++
      ) {
        if (
          Math.hypot((x + 0.5) / r - position.x, (y + 0.5) / r - position.y) >
          radius
        )
          continue;
        const index = y * this.width + x;
        if (!this.exploredAreas[index]) {
          this.exploredAreas[index] = 1;
          changed = true;
        }
      }
    }
    if (changed) this.revision++;
  }
  explored(point: Point): boolean {
    const x = Math.floor(point.x * FOG_RESOLUTION),
      y = Math.floor(point.y * FOG_RESOLUTION);
    return (
      x >= 0 &&
      y >= 0 &&
      x < this.width &&
      y < this.height &&
      this.exploredAreas[y * this.width + x] === 1
    );
  }
}
