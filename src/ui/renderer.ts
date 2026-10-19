import type { Maze } from "../core/types";
import type { GameSession } from "../core/session";
import { FLASH_RADIUS } from "../core/lantern";
import { NORMAL_RADIUS } from "../core/visibility";
const TILE = 48;
function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const c = canvas.getContext("2d");
  if (!c) throw new Error("canvas-unavailable");
  return c;
}
const circle = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) => {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
};
export function drawHome(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.fillStyle = "#d9bd8d";
  c.fillRect(-0.37, -0.18, 0.74, 0.57);
  c.fillStyle = "#8d6953";
  c.beginPath();
  c.moveTo(-0.49, -0.14);
  c.lineTo(0, -0.57);
  c.lineTo(0.49, -0.14);
  c.closePath();
  c.fill();
  c.strokeStyle = "#c09b6a";
  c.lineWidth = 0.055;
  c.stroke();
  c.fillStyle = "#765640";
  c.fillRect(-0.11, 0.07, 0.22, 0.33);
  c.fillStyle = "#ffe5a0";
  c.fillRect(-0.29, -0.06, 0.14, 0.17);
  c.fillRect(0.16, -0.06, 0.14, 0.17);
  c.fillStyle = "#c1a477";
  c.fillRect(0.2, -0.56, 0.1, 0.25);
  c.restore();
}
/** Original small character, drawn in world units. Her dress/body width is .8 cells. */
export function drawJasmine(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  walk = 0,
): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.save();
  c.scale(1, 0.35);
  circle(c, 0, 0.9, 0.36, "#223e3d55");
  c.restore();
  c.fillStyle = "#493f37";
  c.fillRect(-0.23, 0.22 + walk, 0.15, 0.19);
  c.fillRect(0.1, 0.22 - walk, 0.15, 0.19);
  c.fillStyle = "#d79075";
  c.beginPath();
  c.moveTo(-0.22, -0.13);
  c.lineTo(0.22, -0.13);
  c.lineTo(0.4, 0.29);
  c.quadraticCurveTo(0, 0.43, -0.4, 0.29);
  c.closePath();
  c.fill();
  c.strokeStyle = "#f2cfaa";
  c.lineWidth = 0.12;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-0.24, -0.05);
  c.lineTo(-0.37, 0.14);
  c.moveTo(0.24, -0.05);
  c.lineTo(0.45, 0.09);
  c.stroke();
  circle(c, 0, -0.3, 0.31, "#443930");
  circle(c, 0, -0.29, 0.25, "#f3d2ad");
  c.fillStyle = "#493a31";
  c.beginPath();
  c.arc(0, -0.32, 0.29, Math.PI, Math.PI * 2);
  c.lineTo(0.28, -0.2);
  c.quadraticCurveTo(0.05, -0.22, 0.05, -0.4);
  c.quadraticCurveTo(-0.09, -0.24, -0.27, -0.25);
  c.closePath();
  c.fill();
  c.strokeStyle = "#e4bd6b";
  c.lineWidth = 0.045;
  c.beginPath();
  c.arc(0, -0.35, 0.26, 3.5, 5.9);
  c.stroke();
  circle(c, -0.085, -0.27, 0.02, "#493d35");
  circle(c, 0.095, -0.27, 0.02, "#493d35");
  circle(c, -0.16, -0.18, 0.045, "#dfa28a");
  circle(c, 0.17, -0.18, 0.045, "#dfa28a");
  c.strokeStyle = "#aa7961";
  c.lineWidth = 0.018;
  c.beginPath();
  c.arc(0.01, -0.19, 0.05, 0, Math.PI);
  c.stroke();
  c.strokeStyle = "#805e3a";
  c.lineWidth = 0.035;
  c.strokeRect(0.39, 0.12, 0.18, 0.24);
  c.fillStyle = "#ffe1a0";
  c.fillRect(0.405, 0.14, 0.15, 0.2);
  c.fillStyle = "#a67b44";
  c.fillRect(0.37, 0.1, 0.22, 0.04);
  c.fillRect(0.38, 0.35, 0.21, 0.035);
  c.strokeStyle = "#a67b44";
  c.beginPath();
  c.arc(0.48, 0.1, 0.07, Math.PI, 0);
  c.stroke();
  c.restore();
}
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private terrain = document.createElement("canvas");
  private fog = document.createElement("canvas");
  private mask = document.createElement("canvas");
  private lastRevision = -1;
  private observer: ResizeObserver;
  private lastPosition = { x: -1, y: -1 };
  constructor(
    private canvas: HTMLCanvasElement,
    private maze: Maze,
  ) {
    this.ctx = context(canvas);
    this.terrain.width = this.mask.width = maze.gridWidth * TILE;
    this.terrain.height = this.mask.height = maze.gridHeight * TILE;
    this.drawTerrain();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }
  destroy(): void {
    this.observer.disconnect();
  }
  private resize(): void {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const box = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(box.width * dpr);
    this.canvas.height = Math.round(box.height * dpr);
  }
  private drawTerrain(): void {
    const c = context(this.terrain);
    c.fillStyle = "#577158";
    c.fillRect(0, 0, this.terrain.width, this.terrain.height);
    for (let y = 0; y < this.maze.gridHeight; y++)
      for (let x = 0; x < this.maze.gridWidth; x++) {
        const left = x * TILE,
          top = y * TILE,
          seed = (x * 73 + y * 137) % 101;
        if (this.maze.cells[y][x] === "#") {
          c.fillStyle = "#3b5a47";
          c.fillRect(left, top, TILE, TILE);
          circle(c, left + 22, top + 27, 24, "#355541");
          circle(c, left + 13, top + 20, 15, seed % 2 ? "#48694c" : "#426548");
          circle(c, left + 32, top + 15, 18, seed % 3 ? "#4a6b4d" : "#527253");
          circle(c, left + 32, top + 35, 16, "#3b5e45");
          c.strokeStyle = "#75906a66";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(left + 21, top + 37);
          c.lineTo(left + 21, top + 20);
          c.moveTo(left + 21, top + 28);
          c.lineTo(left + 29, top + 23);
          c.stroke();
        } else {
          c.fillStyle = (x + y) % 2 ? "#b9ba94" : "#b5b790";
          c.fillRect(left, top, TILE, TILE);
          circle(
            c,
            left + 9 + (seed % 15),
            top + 8 + (seed % 29),
            1.4,
            "#8c9c79",
          );
          c.fillStyle = "#d2c8a4";
          c.fillRect(left + 32, top + 31, 3, 2);
          if (seed % 5 === 0) {
            c.strokeStyle = "#8ca17a";
            c.lineWidth = 1.4;
            c.beginPath();
            c.moveTo(left + 5, top + 42);
            c.lineTo(left + 7, top + 35);
            c.lineTo(left + 9, top + 41);
            c.stroke();
          }
        }
      }
    // A welcoming world object, independent of the maze's collision geometry.
    for (const object of this.maze.objects)
      if (object.kind === "home") {
        const x = object.position.x * TILE,
          y = object.position.y * TILE;
        const glow = c.createRadialGradient(x, y, 0, x, y, TILE * 0.8);
        glow.addColorStop(0, "#ffe1a044");
        glow.addColorStop(1, "#ffe1a000");
        c.fillStyle = glow;
        c.fillRect(x - TILE, y - TILE, TILE * 2, TILE * 2);
        drawHome(c, x, y, TILE * 0.88);
      }
    const e = this.maze.entrance;
    c.strokeStyle = "#74896c";
    c.lineWidth = 1.5;
    c.setLineDash([3, 4]);
    c.beginPath();
    c.arc(e.x * TILE, e.y * TILE, TILE * 0.32, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }
  draw(session: GameSession, reduced: boolean): void {
    const c = this.ctx,
      w = this.canvas.width,
      h = this.canvas.height;
    if (!w || !h) return;
    c.clearRect(0, 0, w, h);
    c.drawImage(this.terrain, 0, 0, w, h);
    const vis = session.visibility;
    if (this.lastRevision !== vis.revision) {
      this.fog.width = vis.width;
      this.fog.height = vis.height;
      const f = context(this.fog),
        data = f.createImageData(vis.width, vis.height);
      for (let i = 0; i < vis.exploredAreas.length; i++) {
        data.data[i * 4] = 17;
        data.data[i * 4 + 1] = 33;
        data.data[i * 4 + 2] = 38;
        data.data[i * 4 + 3] = vis.exploredAreas[i] ? 155 : 255;
      }
      f.putImageData(data, 0, 0);
      this.lastRevision = vis.revision;
    }
    const mask = context(this.mask),
      mw = this.mask.width,
      mh = this.mask.height;
    mask.globalCompositeOperation = "source-over";
    mask.clearRect(0, 0, mw, mh);
    mask.imageSmoothingEnabled = true;
    mask.drawImage(this.fog, 0, 0, mw, mh);
    const flashing = session.lantern.flashing(session.elapsedTimeMs);
    const radius = (flashing ? FLASH_RADIUS : NORMAL_RADIUS) * TILE;
    const px = session.playerPosition.x * TILE,
      py = session.playerPosition.y * TILE;
    const gradient = mask.createRadialGradient(
      px,
      py,
      radius * 0.7,
      px,
      py,
      radius,
    );
    gradient.addColorStop(0, "#000");
    gradient.addColorStop(1, "#0000");
    mask.globalCompositeOperation = "destination-out";
    mask.fillStyle = gradient;
    mask.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    c.drawImage(this.mask, 0, 0, w, h);
    c.save();
    c.scale(w / mw, h / mh);
    if (!reduced) {
      const glow = c.createRadialGradient(
        px + 14,
        py + 8,
        0,
        px + 14,
        py + 8,
        flashing ? radius : 40,
      );
      glow.addColorStop(0, flashing ? "#ffe4a035" : "#ffe4a023");
      glow.addColorStop(1, "#ffe4a000");
      c.fillStyle = glow;
      c.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }
    const moving =
      Math.hypot(
        session.playerPosition.x - this.lastPosition.x,
        session.playerPosition.y - this.lastPosition.y,
      ) > 0.001;
    const walk =
      !reduced && moving && session.sessionStatus === "playing"
        ? Math.sin(session.elapsedTimeMs / 85) * 0.04
        : 0;
    drawJasmine(c, px, py, TILE, walk);
    c.restore();
    this.lastPosition = { ...session.playerPosition };
  }
}
