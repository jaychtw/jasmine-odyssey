import { PLAYER_WIDTH } from "./movement";
export const FLASH_MS = 1000;
export const RECHARGE_MS = 5000;
export const FLASH_RADIUS = PLAYER_WIDTH * 2.5;
export class Lantern {
  uses = 0;
  private activatedAt = -Infinity;
  activate(now: number): boolean {
    if (!this.ready(now)) return false;
    this.activatedAt = now;
    this.uses++;
    return true;
  }
  ready(now: number): boolean {
    return this.cooldown(now) === 0;
  }
  flashing(now: number): boolean {
    return now - this.activatedAt < FLASH_MS;
  }
  cooldown(now: number): number {
    return Math.max(0, RECHARGE_MS - (now - this.activatedAt));
  }
  progress(now: number): number {
    return 1 - this.cooldown(now) / RECHARGE_MS;
  }
}
