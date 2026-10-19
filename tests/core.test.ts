import { describe, expect, test } from "vitest";
import { createHash } from "node:crypto";
import { MAZES } from "../src/core/mazes";
import { validateMaze } from "../src/core/validation";
import {
  atHome,
  canOccupy,
  isWall,
  move,
  MOVE_SPEED,
  PLAYER_RADIUS,
} from "../src/core/movement";
import {
  Lantern,
  FLASH_MS,
  RECHARGE_MS,
  FLASH_RADIUS,
} from "../src/core/lantern";
import { Visibility, NORMAL_RADIUS } from "../src/core/visibility";
import { GameSession, formatTime } from "../src/core/session";
import { Records, RECORDS_KEY, type StoragePort } from "../src/core/records";
import { achievements } from "../src/core/achievements";
import { translations, translate } from "../src/ui/i18n";
import { loadPreferences, savePreferences } from "../src/ui/preferences";
import type { Maze, Point, RunRecord } from "../src/core/types";

export function solution(maze: Maze): Point[] {
  const start = {
    x: Math.floor(maze.entrance.x),
    y: Math.floor(maze.entrance.y),
  };
  const key = (p: Point) => `${p.x},${p.y}`;
  const queue = [start],
    parents = new Map<string, Point | null>([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === Math.floor(maze.home.x) && p.y === Math.floor(maze.home.y)) {
      const path = [];
      let at: Point | null = p;
      while (at) {
        path.unshift({ x: at.x + 0.5, y: at.y + 0.5 });
        at = parents.get(key(at))!;
      }
      return path;
    }
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const next = { x: p.x + dx, y: p.y + dy };
      if (!isWall(maze, next.x, next.y) && !parents.has(key(next))) {
        parents.set(key(next), p);
        queue.push(next);
      }
    }
  }
  return [];
}
function memory(): StoragePort {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}
const run = (ms: number, uses = 0, mazeId = "maze-1"): RunRecord => ({
  schemaVersion: 1,
  mazeId,
  playerName: "<b>Ada</b>",
  completionTimeMs: ms,
  lanternUses: uses,
  noLanternRun: uses === 0,
  completedAt: "2026-10-19T00:00:00Z",
});

describe("the ten curated mazes", () => {
  test("are distinct, stable, bounded, entirely connected, and have reachable homes", () => {
    expect(MAZES).toHaveLength(10);
    const hashes = new Set(
      MAZES.map((m) =>
        createHash("sha256").update(m.cells.join("\n")).digest("hex"),
      ),
    );
    expect(hashes.size).toBe(10);
    expect([...hashes]).toEqual([
      "017afcb4b96aadf9befe471e593a721a0a49d74686148282f022539f6c3d7656",
      "a210a5c56b2f6d6426b84fd5289d688a3646c9c0b7d6086e37116abcb7115a47",
      "5a5ddb36f4f49ec728db79f07e9e3c147a7e37ca68c83bda5d72df6f2d9fc08c",
      "670dd8e6e52a40e3b63d76d77d6dd058b2f03a8aa4409722f158bc0bebfad434",
      "b1e49da14232c9004efc3566e521d18ef4c201dbb8cb3c1b474e640e7ca161ee",
      "f44c36e63974cd05d3afd4dc6ff6ebe9cb38526327ec7a41e55f41a23c64a3fc",
      "899944f35802336785a3198ee9ff968e026af2024afe04eda0012d26273148aa",
      "101c068584b58726c6c65edb1d3b215ea24ded90751da2a4a219ae828b7bfd0e",
      "89b1433a287d39d84bf997a28cf13234910f31b3b95ade5ad5dac2401c85df7c",
      "b1624878c1ccd5a35c29522e6b1b503a74b0c174f678127b7449687cc29740f0",
    ]);
    for (const maze of MAZES) {
      expect(validateMaze(maze), maze.mazeId).toEqual([]);
      const path = solution(maze);
      expect(path.length).toBeGreaterThan(15);
      expect(path.length).toBeLessThan(65);
      expect(Object.isFrozen(maze)).toBe(true);
      expect(Object.isFrozen(maze.cells)).toBe(true);
      expect(new GameSession(maze).maze.cells).toBe(
        new GameSession(maze).maze.cells,
      );
    }
  });
  for (const maze of MAZES)
    test(`${maze.mazeId} can be completed through real movement without a lantern`, () => {
      const session = new GameSession(maze),
        path = solution(maze);
      for (const waypoint of path.slice(1)) {
        let guard = 0;
        while (
          session.sessionStatus === "playing" &&
          Math.hypot(
            waypoint.x - session.playerPosition.x,
            waypoint.y - session.playerPosition.y,
          ) > 0.00001
        ) {
          expect(guard++).toBeLessThan(150);
          const dx = waypoint.x - session.playerPosition.x,
            dy = waypoint.y - session.playerPosition.y;
          const distance = Math.hypot(dx, dy);
          session.update(Math.min(1000 / 60, (distance / MOVE_SPEED) * 1000), {
            x: dx / distance,
            y: dy / distance,
          });
          expect(canOccupy(maze, session.playerPosition)).toBe(true);
        }
      }
      expect(session.sessionStatus).toBe("completed");
      expect(session.lanternUses).toBe(0);
      expect(
        achievements({ completed: true, lanternUses: session.lanternUses }),
      ).toEqual(["noLanternRun"]);
    });
  test("every wall edge prevents crossing; adjacent floor cells remain traversable", () => {
    for (const maze of MAZES)
      for (let y = 1; y < maze.gridHeight - 1; y++)
        for (let x = 1; x < maze.gridWidth - 1; x++) {
          if (isWall(maze, x, y)) continue;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const p = move(
              maze,
              { x: x + 0.5, y: y + 0.5 },
              { x: dx, y: dy },
              1 / MOVE_SPEED,
            );
            if (isWall(maze, x + dx, y + dy)) {
              const travel = Math.hypot(p.x - x - 0.5, p.y - y - 0.5);
              expect(travel).toBeLessThanOrEqual(0.5 - PLAYER_RADIUS + 0.001);
            } else {
              expect(p.x).toBeCloseTo(x + dx + 0.5, 6);
              expect(p.y).toBeCloseTo(y + dy + 0.5, 6);
            }
            expect(canOccupy(maze, p)).toBe(true);
          }
        }
  });
  test("invalid and disconnected definitions are rejected", () => {
    expect(validateMaze({ ...MAZES[0], cells: ["bad"] })).toContain(
      "invalid-grid",
    );
    expect(validateMaze({ ...MAZES[0], gridWidth: NaN })).toContain(
      "invalid-grid",
    );
    expect(validateMaze({ ...MAZES[0], home: { x: NaN, y: 1.5 } })).toContain(
      "blocked-endpoint",
    );
    const cells = MAZES[0].cells.map((row) => row.split(""));
    cells[1][7] = ".";
    expect(
      validateMaze({ ...MAZES[0], cells: cells.map((row) => row.join("")) }),
    ).toContain("disconnected-floor");
  });
});
const room: Maze = {
  schemaVersion: 1,
  mazeId: "test",
  nameKey: "test",
  gridWidth: 7,
  gridHeight: 7,
  cells: [
    "#######",
    "#.....#",
    "#.....#",
    "#.....#",
    "#.....#",
    "#.....#",
    "#######",
  ],
  entrance: { x: 3.5, y: 3.5 },
  home: { x: 5.5, y: 5.5 },
  objects: [],
  design: "test fixture",
};
describe("continuous movement", () => {
  test("diagonal and cardinal travel have equal speed", () => {
    const a = move(room, room.entrance, { x: 1, y: 0 }, 0.2),
      b = move(room, room.entrance, { x: 1, y: 1 }, 0.2);
    expect(Math.hypot(a.x - 3.5, a.y - 3.5)).toBeCloseTo(0.6, 8);
    expect(Math.hypot(b.x - 3.5, b.y - 3.5)).toBeCloseTo(0.6, 8);
  });
  test("speed is invariant at 30, 60, and 144 fps", () => {
    const positions = [30, 60, 144].map((fps) => {
      let p = { ...room.entrance };
      for (let i = 0; i < fps; i++)
        p = move(room, p, { x: 0, y: -1 }, 0.4 / fps);
      return p;
    });
    expect(positions[0].y).toBeCloseTo(positions[1].y, 8);
    expect(positions[1].y).toBeCloseTo(positions[2].y, 8);
  });
  test("large steps cannot tunnel and diagonal movement slides along a wall", () => {
    const p = move(room, { x: 1.3, y: 3.5 }, { x: -1, y: -1 }, 0.3);
    expect(p.x).toBeGreaterThanOrEqual(1 + PLAYER_RADIUS);
    expect(p.y).toBeLessThan(3.1);
    expect(move(room, room.entrance, { x: 1, y: 0 }, 10).x).toBeLessThan(
      6 - PLAYER_RADIUS + 0.01,
    );
    expect(canOccupy(room, { x: 0.9, y: 1.5 })).toBe(false);
  });
});
describe("lantern and persistent exploration", () => {
  test("one-second flash, five-second recharge from activation, only successful uses count", () => {
    const l = new Lantern();
    expect(l.ready(0)).toBe(true);
    expect(l.activate(0)).toBe(true);
    expect(l.flashing(FLASH_MS - 0.001)).toBe(true);
    expect(l.flashing(FLASH_MS)).toBe(false);
    expect(l.activate(100)).toBe(false);
    expect(l.activate(RECHARGE_MS - 0.001)).toBe(false);
    expect(l.uses).toBe(1);
    expect(l.ready(RECHARGE_MS)).toBe(true);
    expect(l.activate(RECHARGE_MS)).toBe(true);
    expect(l.uses).toBe(2);
    expect(l.progress(RECHARGE_MS + 2500)).toBe(0.5);
  });
  test("normal exploration is small, flash reveals beyond walls, explored areas persist", () => {
    const maze = MAZES[0],
      s = new GameSession(maze),
      p = s.playerPosition;
    const beyondWall = { x: p.x, y: p.y - 1.7 };
    expect(s.visibility.explored(beyondWall)).toBe(false);
    s.activateLantern();
    expect(s.visibility.explored(beyondWall)).toBe(true);
    s.update(1100, { x: 1, y: 0 });
    expect(s.lantern.flashing(s.elapsedTimeMs)).toBe(false);
    expect(s.visibility.explored(beyondWall)).toBe(true);
    const reset = new GameSession(maze);
    expect(reset.visibility.explored(beyondWall)).toBe(false);
    expect(reset.lanternUses).toBe(0);
    expect(reset.elapsedTimeMs).toBe(0);
    expect(reset.lanternCooldown).toBe(0);
  });
  test("movement during flash leaves a persistent sweep and radius is world-based", () => {
    const s = new GameSession(room),
      before = s.playerPosition.x;
    s.activateLantern();
    s.update(500, { x: -1, y: 0 });
    expect(s.playerPosition.x).toBeLessThan(before - 1);
    expect(s.visibility.explored({ x: 4.9, y: 3.5 })).toBe(true);
    expect(FLASH_RADIUS).toBe(2);
    expect(FLASH_RADIUS).toBeGreaterThan(NORMAL_RADIUS);
    const v = new Visibility(room);
    v.reveal({ x: 3.5, y: 3.5 }, NORMAL_RADIUS);
    expect(v.explored({ x: 5, y: 3.5 })).toBe(false);
  });
});
describe("session timing, suspension, home, achievements", () => {
  test("timer advances with millisecond precision, never pauses for lantern", () => {
    const s = new GameSession(room);
    s.update(1234.567, { x: 0, y: 0 });
    s.activateLantern();
    s.update(200.123, { x: 0, y: 0 });
    expect(s.elapsedTimeMs).toBeCloseTo(1434.69, 7);
    expect(formatTime(84359)).toBe("01:24.35");
  });
  test("pause freezes clock, position, exploration, and recharge; resume preserves them", () => {
    const s = new GameSession(room);
    s.activateLantern();
    s.update(100, { x: 0, y: 0 });
    s.pause();
    const count = s.visibility.exploredAreas.slice();
    s.update(50000, { x: 1, y: 1 });
    expect(s.elapsedTimeMs).toBeCloseTo(100);
    expect(s.playerPosition).toEqual(room.entrance);
    expect(s.visibility.exploredAreas).toEqual(count);
    expect(s.activateLantern()).toBe(false);
    s.resume();
    s.update(500, { x: 0, y: 0 });
    expect(s.elapsedTimeMs).toBeCloseTo(600);
  });
  test("entering home stops time and movement and awards exactly the zero-light achievement", () => {
    const m = { ...room, home: { x: 4.5, y: 3.5 } },
      s = new GameSession(m);
    s.update(2000, { x: 1, y: 0 });
    expect(s.sessionStatus).toBe("completed");
    expect(s.elapsedTimeMs).toBeCloseTo((1000 * (1 - 0.35)) / MOVE_SPEED, 7);
    expect(atHome(m, s.playerPosition)).toBe(true);
    const time = s.elapsedTimeMs,
      pos = { ...s.playerPosition };
    s.update(9999, { x: 1, y: 0 });
    expect(s.elapsedTimeMs).toBe(time);
    expect(s.playerPosition).toEqual(pos);
    expect(s.activateLantern()).toBe(false);
    expect(achievements({ completed: false, lanternUses: 0 })).toEqual([]);
    expect(achievements({ completed: true, lanternUses: 1 })).toEqual([]);
    expect(achievements({ completed: true, lanternUses: 0 })).toEqual([
      "noLanternRun",
    ]);
  });
});
describe("local leaderboards", () => {
  test("rank only by time, keep five per maze, and persist", () => {
    const store = memory(),
      r = new Records(store);
    for (const ms of [6000, 5000, 4000, 3000, 2000, 1000])
      r.add(run(ms, ms === 1000 ? 9 : 0));
    expect(r.list("maze-1").map((r) => r.completionTimeMs)).toEqual([
      1000, 2000, 3000, 4000, 5000,
    ]);
    expect(r.list("maze-1")[0].lanternUses).toBe(9);
    r.add(run(7000, 0, "maze-2"));
    expect(r.list("maze-2")).toHaveLength(1);
    expect(r.qualifies("maze-1", 5000)).toBe(false);
    expect(r.qualifies("maze-1", 4999)).toBe(true);
    expect(new Records(store).list("maze-1")).toEqual(r.list("maze-1"));
    r.clear();
    expect(new Records(store).list("maze-1")).toEqual([]);
    expect(new Records(store).list("maze-2")).toEqual([]);
  });
  test("ties retain arrival order and never use lantern count", () => {
    const r = new Records(memory());
    r.add(run(1000, 10));
    r.add({ ...run(1000), playerName: "B" });
    expect(r.list("maze-1").map((r) => r.playerName)).toEqual([
      "<b>Ada</b>",
      "B",
    ]);
  });
  test("corruption is reported and original data is preserved until an explicit clear", () => {
    const store = memory();
    store.setItem(RECORDS_KEY, "{broken");
    const r = new Records(store);
    expect(r.problem).toBe("corrupted");
    r.add(run(1000));
    expect(store.getItem(RECORDS_KEY)).toBe("{broken");
    expect(r.list("maze-1")).toHaveLength(1);
    r.clear();
    r.add(run(900));
    expect(new Records(store).list("maze-1")).toHaveLength(1);
  });
  test("unavailable storage and quota errors preserve playable in-memory records", () => {
    const r = new Records();
    expect(r.problem).toBe("unavailable");
    expect(r.add(run(1000))).toBe(true);
    expect(r.list("maze-1")).toHaveLength(1);
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    const q = new Records(broken);
    q.add(run(1000));
    expect(q.problem).toBe("unavailable");
    expect(q.list("maze-1")).toHaveLength(1);
  });
  test("rejects invalid times and inconsistent achievements", () => {
    const r = new Records(memory());
    expect(r.add(run(NaN))).toBe(false);
    expect(r.add(run(-1))).toBe(false);
    expect(r.add({ ...run(1000), noLanternRun: false })).toBe(false);
  });
});
describe("localization and preferences", () => {
  test("all strings exist in both languages with matching parameters", () => {
    expect(Object.keys(translations.en).sort()).toEqual(
      Object.keys(translations["zh-TW"]).sort(),
    );
    for (const key of Object.keys(
      translations.en,
    ) as (keyof typeof translations.en)[]) {
      expect(translations["zh-TW"][key].length).toBeGreaterThan(0);
      expect(translations.en[key].match(/\{\w+\}/g)).toEqual(
        translations["zh-TW"][key].match(/\{\w+\}/g),
      );
    }
    expect(translate("zh-TW", "title")).toBe("寧寧要回家");
    expect(translate("en", "recharge", { seconds: 3 })).toContain("3s");
  });
  test("English defaults and language, sound, and reduced effects persist", () => {
    const store = memory();
    expect(loadPreferences(store).language).toBe("en");
    const prefs = {
      language: "zh-TW" as const,
      sound: false,
      reduced: true,
      playerName: "寧寧",
    };
    savePreferences(prefs, store);
    expect(loadPreferences(store)).toEqual(prefs);
  });
});

describe("flash utility at curated decision points", () => {
  for (const maze of MAZES)
    test(`${maze.mazeId} has junctions where a flash uncovers useful extra floor`, () => {
      let useful = 0;
      for (let y = 1; y < maze.gridHeight - 1; y++)
        for (let x = 1; x < maze.gridWidth - 1; x++) {
          if (isWall(maze, x, y)) continue;
          const exits = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].filter(([dx, dy]) => !isWall(maze, x + dx, y + dy)).length;
          if (exits < 3) continue;
          const normal = new Visibility(maze),
            flash = new Visibility(maze),
            p = { x: x + 0.5, y: y + 0.5 };
          normal.reveal(p, NORMAL_RADIUS);
          flash.reveal(p, FLASH_RADIUS);
          let extraFloor = 0;
          for (let yy = 0; yy < flash.height; yy++)
            for (let xx = 0; xx < flash.width; xx++) {
              const i = yy * flash.width + xx;
              if (
                flash.exploredAreas[i] &&
                !normal.exploredAreas[i] &&
                !isWall(maze, Math.floor(xx / 8), Math.floor(yy / 8))
              )
                extraFloor++;
            }
          if (extraFloor >= 64) useful++;
        }
      expect(useful).toBeGreaterThanOrEqual(2);
    });
});

test("well-formed JSON with an invalid records schema is treated as corruption", () => {
  for (const data of [
    "null",
    "[]",
    "{}",
    '{"schemaVersion":99,"records":[]}',
    '{"schemaVersion":1,"records":[{}]}',
  ]) {
    const store = memory();
    store.setItem(RECORDS_KEY, data);
    const r = new Records(store);
    expect(r.problem).toBe("corrupted");
    r.add(run(900));
    expect(store.getItem(RECORDS_KEY)).toBe(data);
  }
});
