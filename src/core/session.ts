import type { Input, Maze, Point, SessionStatus } from "./types";
import { homeEntryFraction, move } from "./movement";
import { Lantern, FLASH_RADIUS } from "./lantern";
import { Visibility, NORMAL_RADIUS } from "./visibility";
export class GameSession {
  readonly schemaVersion = 1;
  readonly mazeId: string;
  playerPosition: Point;
  elapsedTimeMs = 0;
  sessionStatus: SessionStatus = "playing";
  readonly lantern = new Lantern();
  readonly visibility: Visibility;
  constructor(readonly maze: Maze) {
    this.mazeId = maze.mazeId;
    this.playerPosition = { ...maze.entrance };
    this.visibility = new Visibility(maze);
    this.reveal();
  }
  get lanternCooldown(): number {
    return this.lantern.cooldown(this.elapsedTimeMs);
  }
  get lanternUses(): number {
    return this.lantern.uses;
  }
  activateLantern(): boolean {
    if (
      this.sessionStatus !== "playing" ||
      !this.lantern.activate(this.elapsedTimeMs)
    )
      return false;
    this.reveal();
    return true;
  }
  pause(): void {
    if (this.sessionStatus === "playing") this.sessionStatus = "paused";
  }
  resume(): void {
    if (this.sessionStatus === "paused") this.sessionStatus = "playing";
  }
  private reveal(): void {
    this.visibility.reveal(
      this.playerPosition,
      this.lantern.flashing(this.elapsedTimeMs) ? FLASH_RADIUS : NORMAL_RADIUS,
    );
  }
  /** Bounded movement slices with exact segment/circle entry stop time. */
  update(deltaMs: number, input: Input): void {
    if (
      !Number.isFinite(deltaMs) ||
      deltaMs <= 0 ||
      this.sessionStatus !== "playing"
    )
      return;
    let remaining = deltaMs;
    while (remaining > 0.00001 && this.sessionStatus === "playing") {
      const step = Math.min(1000 / 120, remaining);
      const previous = this.playerPosition;
      const next = move(this.maze, previous, input, step / 1000);
      const entry = homeEntryFraction(this.maze, previous, next);
      const fraction = entry ?? 1;
      this.playerPosition = {
        x: previous.x + (next.x - previous.x) * fraction,
        y: previous.y + (next.y - previous.y) * fraction,
      };
      this.elapsedTimeMs += step * fraction;
      this.reveal();
      if (entry !== null) this.sessionStatus = "completed";
      remaining -= step;
    }
  }
}
export function formatTime(ms: number): string {
  const centiseconds = Math.floor(ms / 10);
  return `${Math.floor(centiseconds / 6000)
    .toString()
    .padStart(
      2,
      "0",
    )}:${Math.floor(centiseconds / 100) % 60 < 10 ? "0" : ""}${Math.floor(centiseconds / 100) % 60}.${(centiseconds % 100).toString().padStart(2, "0")}`;
}
