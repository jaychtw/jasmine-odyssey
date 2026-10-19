import { test, expect, type Page } from "@playwright/test";
import { MAZES } from "../../src/core/mazes";
import type { Maze, Point } from "../../src/core/types";

type Snapshot = {
  mazeId: string;
  position: Point;
  elapsedTimeMs: number;
  status: string;
  lanternUses: number;
  cooldown: number;
  flashing: boolean;
  exploredCount: number;
};
const snapshot = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __jasmineSnapshot: Snapshot }).__jasmineSnapshot,
  );
function path(maze: Maze): Point[] {
  const key = (p: Point) => `${p.x},${p.y}`;
  const start = {
    x: Math.floor(maze.entrance.x),
    y: Math.floor(maze.entrance.y),
  };
  const queue = [start],
    parent = new Map<string, Point | null>([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === Math.floor(maze.home.x) && p.y === Math.floor(maze.home.y)) {
      let at: Point | null = p;
      const result = [];
      while (at) {
        result.unshift({ x: at.x + 0.5, y: at.y + 0.5 });
        at = parent.get(key(at))!;
      }
      return result;
    }
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (maze.cells[n.y]?.[n.x] === "." && !parent.has(key(n))) {
        parent.set(key(n), p);
        queue.push(n);
      }
    }
  }
  return [];
}
async function start(page: Page, index = 0) {
  await page.goto("/");
  if ((await page.locator("html").getAttribute("lang")) === "zh-TW")
    await page.getByRole("button", { name: "EN", exact: true }).click();
  await page
    .getByRole("button", { name: "Into the forest", exact: true })
    .click();
  await page.locator(`[data-action="play"][data-maze="${index}"]`).click();
  await expect(page.locator("#maze-canvas")).toBeVisible();
}
async function walkHome(page: Page, index = 0) {
  const route = path(MAZES[index]);
  // Collapse collinear tiles into corridor endpoints. These are actual held keys,
  // observed through a read-only probe; no position/time/visibility mutation.
  const corners = route.filter(
    (p, i) =>
      i === 0 ||
      i === route.length - 1 ||
      (route[i - 1].x !== route[i + 1].x && route[i - 1].y !== route[i + 1].y),
  );
  for (const target of corners.slice(1)) {
    const state = await snapshot(page);
    if (state.status === "completed") break;
    const dx = target.x - state.position.x,
      dy = target.y - state.position.y;
    const axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    const sign = (axis === "x" ? dx : dy) > 0 ? 1 : -1;
    const key =
      axis === "x"
        ? sign > 0
          ? "ArrowRight"
          : "ArrowLeft"
        : sign > 0
          ? "ArrowDown"
          : "ArrowUp";
    await page.keyboard.down(key);
    await page.waitForFunction(
      ({ target, axis, sign }) => {
        const s = (window as unknown as { __jasmineSnapshot: Snapshot })
          .__jasmineSnapshot;
        return (
          s.status === "completed" ||
          (s.position[axis] - target[axis]) * sign >= -0.025
        );
      },
      { target, axis, sign },
      { timeout: 10000, polling: "raf" },
    );
    await page.keyboard.up(key);
  }
}
test("title, selector, settings, and both languages are usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Jasmine’s Odyssey", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/title-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "繁中", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await expect(
    page.getByRole("heading", { name: "寧寧要回家", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Sound", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("switch", { name: "Gentle light", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Gentle light", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Into the forest", exact: true })
    .click();
  await expect(page.locator(".maze-card")).toHaveCount(10);
  await page.screenshot({
    path: "test-results/selector-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("real keyboard movement, lantern timing, language preservation, and pause confirmations", async ({
  page,
}) => {
  await start(page);
  const initial = await snapshot(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowRight");
  expect((await snapshot(page)).position.x).toBeGreaterThan(
    initial.position.x + 0.4,
  );
  await page.keyboard.press("Space");
  await expect(page.locator("#use-count")).toHaveText("1");
  const lit = await snapshot(page);
  expect(lit.flashing).toBe(true);
  expect(lit.exploredCount).toBeGreaterThan(initial.exploredCount);
  await page.keyboard.press("Space");
  expect((await snapshot(page)).lanternUses).toBe(1);
  await page.getByRole("button", { name: "繁中", exact: true }).click();
  const zh = await snapshot(page);
  expect(zh.mazeId).toBe(lit.mazeId);
  expect(zh.exploredCount).toBeGreaterThanOrEqual(lit.exploredCount);
  expect(zh.lanternUses).toBe(1);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.waitForTimeout(1100);
  expect((await snapshot(page)).flashing).toBe(false);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await snapshot(page);
  await page.waitForTimeout(300);
  expect((await snapshot(page)).elapsedTimeMs).toBe(paused.elapsedTimeMs);
  await page
    .getByRole("button", { name: "Restart", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A little breather" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Keep wandering", exact: true })
    .click();
  await page.waitForTimeout(300);
  expect((await snapshot(page)).elapsedTimeMs).toBeGreaterThan(
    paused.elapsedTimeMs,
  );
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await page.getByRole("button", { name: "Start again", exact: true }).click();
  const reset = await snapshot(page);
  expect(reset.lanternUses).toBe(0);
  expect(reset.exploredCount).toBe(initial.exploredCount);
  expect(reset.position).toEqual(initial.position);
  await page.screenshot({
    path: "test-results/game-desktop.png",
    fullPage: true,
  });
});
test("complete a real keyboard journey, earn achievement, save a safe plain-text name, and persist records", async ({
  page,
}) => {
  await start(page);
  await walkHome(page);
  await expect(
    page.getByRole("heading", { name: "Home, sweet home." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No Lantern Run", exact: true }),
  ).toBeVisible();
  const end = await snapshot(page);
  await page.waitForTimeout(200);
  expect((await snapshot(page)).elapsedTimeMs).toBe(end.elapsedTimeMs);
  await page
    .getByLabel("Your display name")
    .fill("<img src=x onerror=alert(1)>");
  await page
    .getByRole("button", { name: "Save my journey", exact: true })
    .click();
  await expect(page.getByText("Journey saved", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/completion-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Another path", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Back to title", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Local records", exact: true })
    .click();
  await expect(page.locator(".player-name")).toHaveText(
    "<img src=x onerror=alert(1)>".slice(0, 24),
  );
  await expect(page.locator(".records-table img")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Local records", exact: true })
    .click();
  await expect(page.locator(".records-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear local records", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep my records", exact: true })
    .click();
  await expect(page.locator(".records-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear local records", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Clear all records", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "An unwritten chapter" }),
  ).toBeVisible();
});
test("backgrounding pauses and does not auto-resume", async ({ page }) => {
  await start(page);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("dialog")).toBeVisible();
  const before = await snapshot(page);
  await page.waitForTimeout(200);
  expect((await snapshot(page)).elapsedTimeMs).toBe(before.elapsedTimeMs);
  await page
    .getByRole("button", { name: "Keep wandering", exact: true })
    .click();
  expect((await snapshot(page)).status).toBe("playing");
});
test("phone touch movement, release, gentle light, and Traditional Chinese layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  const before = await snapshot(page);
  const right = page.getByRole("button", { name: "Move right", exact: true });
  const box = (await right.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 },
    ],
  });
  await page.waitForTimeout(280);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const after = await snapshot(page);
  expect(after.position.x).toBeGreaterThan(before.position.x + 0.5);
  await page.waitForTimeout(100);
  expect((await snapshot(page)).position).toEqual(after.position);
  await page.locator(".touch-lantern").click();
  expect((await snapshot(page)).lanternUses).toBe(1);
  await page.getByRole("button", { name: "繁中", exact: true }).click();
  await page.screenshot({
    path: "test-results/game-phone-zh.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "暫停", exact: true }).click();
  await page.getByRole("button", { name: "繼續冒險", exact: true }).click();
});
test("corrupt local storage is preserved and does not block play", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("jasmine-odyssey.records.v1", "{broken");
  });
  await start(page);
  await expect(page.getByText(/Saved records could not be read/)).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("jasmine-odyssey.records.v1"),
    ),
  ).toBe("{broken");
  await page.context().clearCookies();
});

test("denied browser storage keeps the game and records UI usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    });
  });
  await start(page);
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
  await page.keyboard.press("Space");
  expect((await snapshot(page)).lanternUses).toBe(1);
});
for (const index of [1, 2, 3, 4, 5, 6, 7, 8, 9])
  test(`curated maze ${index + 1}: real input reaches home with ${index % 2 ? "a flash" : "no lantern"}`, async ({
    page,
  }) => {
    await start(page, index);
    if (index % 2) await page.keyboard.press("Space");
    await walkHome(page, index);
    await expect(
      page.getByRole("heading", { name: "Home, sweet home.", exact: true }),
    ).toBeVisible();
    if (index % 2)
      await expect(
        page.getByRole("heading", { name: "No Lantern Run", exact: true }),
      ).toHaveCount(0);
    else
      await expect(
        page.getByRole("heading", { name: "No Lantern Run", exact: true }),
      ).toBeVisible();
  });

test("unsupported canvas explains the problem without an unhandled error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Into the forest", exact: true })
    .click();
  await page.locator('[data-action=play][data-maze="0"]').click();
  await expect(page.getByRole("alert")).toHaveText(
    /This browser cannot display the forest/,
  );
  expect((await snapshot(page)).status).toBe("paused");
});
test("short phone, tablet, and landscape controls fit without horizontal overflow", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await start(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "繁中", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const canvas = await page.locator("#maze-canvas").boundingBox();
    expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(viewport.height);
    if (viewport.width < 561 || viewport.height < 600) {
      const pad = await page.locator(".direction-pad").boundingBox();
      expect(pad!.y + pad!.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.screenshot({
      path: `test-results/layout-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
  }
});

test("unsupported optional audio explains the issue and leaves the game playable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: class {
        constructor() {
          throw new Error("unsupported");
        }
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect(
    page.getByText(
      "Sound is unavailable in this browser. Your adventure still works without it.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Into the forest", exact: true })
    .click();
  await page.locator('[data-action=play][data-maze="0"]').click();
  await page.keyboard.press("Space");
  expect((await snapshot(page)).lanternUses).toBe(1);
});
