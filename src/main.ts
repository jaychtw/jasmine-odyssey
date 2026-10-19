import "./style.css";
import { MAZES } from "./core/mazes";
import { GameSession, formatTime } from "./core/session";
import { achievements } from "./core/achievements";
import { Records, type StoragePort } from "./core/records";
import { validateMaze } from "./core/validation";
import { translate, type TextKey, type Language } from "./ui/i18n";
import { loadPreferences, savePreferences } from "./ui/preferences";
import { Sound } from "./ui/audio";
import { Renderer } from "./ui/renderer";
import { forestArt, chapterArt, icon } from "./ui/art";
import type { RunRecord } from "./core/types";

const app = document.querySelector<HTMLDivElement>("#app")!;
let storage: StoragePort | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Play remains available without persistence. */
}
const records = new Records(storage);
const prefs = loadPreferences(storage);
const sound = new Sound();
sound.enabled = prefs.sound;
const t = (key: TextKey, params?: Record<string, string | number>) =>
  translate(prefs.language, key, params);
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const name = (n: number) => t(`maze${n}` as TextKey);
const num = (n: number) => String(n).padStart(2, "0");
let screen: "title" | "select" | "game" | "records" = "title";
let session: GameSession | undefined;
let renderer: Renderer | undefined;
let selectedRecordMaze = "maze-1";
let modal:
  | "settings"
  | "pause"
  | "restart"
  | "exit"
  | "complete"
  | "clear"
  | null = null;
let returnModal: "pause" | null = null;
let resumeAfterModal = false;
let saved = false;
let completionShown = false;
let completionName = prefs.playerName;
let lastFrame = performance.now();
let previouslyReady = true;
let lastStatus = "";
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const keys = new Set<string>();
const pointers = new Map<number, string>();
const persistPreferences = () => {
  if (!savePreferences(prefs, storage) && records.problem === "none")
    records.problem = "unavailable";
};
function notify(key: TextKey): void {
  const live = document.querySelector<HTMLElement>("#live");
  if (live) {
    live.textContent = t(key);
    live.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => live.classList.remove("visible"), 3600);
  }
}
function audio(event: "light" | "ready" | "home" | "achievement"): void {
  if (!sound.play(event)) notify("audioUnavailable");
}
function warning(): string {
  return records.problem === "none"
    ? ""
    : `<p class="storage-note" role="status">${icon("leaf")}${t(records.problem === "corrupted" ? "storageCorrupted" : "storageUnavailable")}</p>`;
}
function header(): string {
  return `<a class="skip" href="#main">${t("skip")}</a><header class="site-header"><button class="wordmark" data-action="brand">${icon("lantern")}<span>${t("brand")}</span></button>
    <div class="header-tools"><div class="language-switch" role="group" aria-label="${t("language")}"><button data-action="language" data-lang="en" lang="en" aria-pressed="${prefs.language === "en"}">EN</button><span aria-hidden="true">/</span><button data-action="language" data-lang="zh-TW" lang="zh-TW" aria-pressed="${prefs.language === "zh-TW"}">繁中</button></div><span class="tool-divider"></span><button class="icon-button sound-button" data-action="sound" aria-label="${t(prefs.sound ? "soundOff" : "soundOn")}" title="${t(prefs.sound ? "soundOff" : "soundOn")}">${icon(prefs.sound ? "sound" : "mute")}</button><button class="icon-button" data-action="settings" aria-label="${t("settings")}" title="${t("settings")}">${icon("settings")}</button></div></header>`;
}
function titleScreen(): string {
  return `<main id="main" class="title-page" tabindex="-1"><div class="hero-copy"><p class="eyebrow"><span></span>${t("edition")}</p><h1>${t("title")}</h1><p class="hero-subtitle">${t("subtitle")}</p><p class="hero-intro">${t("intro")}</p><div class="hero-actions"><button class="button primary large" data-action="select">${t("begin")}${icon("arrow")}</button><button class="text-button" data-action="records">${icon("trophy")}${t("viewRecords")}</button></div><div class="hero-caption">${icon("leaf")}<span>${t("tenMazes")}</span><i></i><span>${t("noRush")}</span></div></div><div class="hero-image">${forestArt()}<div class="illustration-stamp">${icon("star")}<span>01 — 10</span></div></div>
  <section class="feature-row"><article><span class="feature-icon">${icon("leaf")}</span><div><h2>${t("featureExplore")}</h2><p>${t("featureExploreBody")}</p></div></article><article><span class="feature-icon gold">${icon("lantern")}</span><div><h2>${t("featureLight")}</h2><p>${t("featureLightBody")}</p></div></article><article><span class="feature-icon clay">${icon("home")}</span><div><h2>${t("featureHome")}</h2><p>${t("featureHomeBody")}</p></div></article></section>${warning()}</main>`;
}
function selectScreen(): string {
  return `<main id="main" class="selection-page" tabindex="-1"><button class="text-button back-link" data-action="title">${icon("back")}${t("backTitle")}</button><div class="page-intro"><p class="eyebrow">${t("selectEyebrow")}</p><h1>${t("selectTitle")}</h1><p>${t("selectBody")}</p></div><div class="maze-grid">${MAZES.map(
    (maze, i) => {
      const best = records.list(maze.mazeId)[0],
        noLight = records.list(maze.mazeId).some((r) => r.noLanternRun);
      return `<button class="maze-card" data-action="play" data-maze="${i}" aria-label="${t("playMaze", { name: name(i + 1) })}"><div class="card-top"><span class="chapter-num">${num(i + 1)}</span>${noLight ? `<span class="small-achievement" title="${t("noLanternRun")}" aria-label="${t("noLanternRun")}">${icon("moon")}</span>` : icon("leaf", "card-leaf")}</div>${chapterArt(i + 1)}<h2>${name(i + 1)}</h2><p>${t(`mood${i + 1}` as TextKey)}</p><div class="card-bottom"><span>${best ? `${t("best")} <b>${formatTime(best.completionTimeMs)}</b>` : t("noRecord")}</span>${icon("arrow")}</div></button>`;
    },
  ).join(
    "",
  )}</div><p class="selection-note">${icon("star")}${t("unlocked")}<span>·</span>${t("noRush")}</p>${warning()}</main>`;
}
function gameScreen(): string {
  if (!session) return "";
  const i = MAZES.indexOf(session.maze) + 1;
  return `<main id="main" class="game-page" tabindex="-1"><div class="game-heading"><div><button class="text-button back-link" data-action="exit">${icon("back")}${t("anotherMaze")}</button><div class="game-title"><span class="chapter-tag">${num(i)}</span><h1>${name(i)}</h1></div></div><div class="game-actions"><button class="icon-button" data-action="restart" aria-label="${t("restart")}" title="${t("restart")}">${icon("restart")}</button><button class="button subtle pause-button" data-action="pause">${icon("pause")}<span>${t("pause")}</span></button></div></div>
  <div class="game-layout"><section class="game-board"><div class="board-hud"><div class="timer"><span>${t("elapsed")}</span><strong id="stopwatch">${formatTime(session.elapsedTimeMs)}</strong></div><div class="uses"><span>${t("uses")}</span><strong id="use-count">${session.lanternUses}</strong>${icon("lantern")}</div></div><div class="canvas-shell"><canvas id="maze-canvas" role="img" aria-label="${t("canvas")}" tabindex="0"></canvas><span class="board-corner tl"></span><span class="board-corner tr"></span><span class="board-corner bl"></span><span class="board-corner br"></span></div><div class="board-bottom"><div class="keyboard-hint"><div class="key-cluster"><kbd>↑</kbd><span><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span></div><span>${t("move")}<small>W A S D</small></span></div><button class="lantern-button" id="lantern-button" data-action="lantern" aria-label="${t("lantern")}"><span class="lantern-disc">${icon("lantern")}<svg class="charge-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg></span><span class="lantern-label"><b>${t("lantern")}</b><small id="lantern-status">${t("ready")}</small></span><kbd>${t("space")}</kbd></button></div></section>
  <aside class="field-notes"><p class="eyebrow">${t("fieldNotes")}</p><div class="notes-illustration">${icon("lantern")}<span>✧</span></div><h2>${t("lightTitle")}</h2><p>${t("lightBody")}</p><div class="light-facts"><span>${t("flashFact")}</span><span>${t("rechargeFact")}</span></div><div class="note-entry">${icon("leaf")}<div><h3>${t("memoryTitle")}</h3><p>${t("memoryBody")}</p></div></div><div class="note-entry">${icon("home")}<div><h3>${t("homeTitle")}</h3><p>${t("homeBody")}</p></div></div></aside></div>
  <div class="touch-controls"><div class="direction-pad" role="group" aria-label="${t("directions")}">${(["up", "left", "down", "right"] as const).map((d) => `<button class="direction ${d}" data-direction="${d}" aria-label="${t(d)}">${icon("back")}</button>`).join("")}<span class="pad-center">${icon("leaf")}</span></div><button class="touch-lantern" data-action="lantern" aria-label="${t("lantern")}">${icon("lantern")}<span>${t("lantern")}</span></button></div>${warning()}</main>`;
}
function table(mazeId: string): string {
  const list = records.list(mazeId);
  return list.length
    ? `<div class="table-scroll"><table class="records-table"><thead><tr><th scope="col">#</th><th scope="col">${t("recordName")}</th><th scope="col">${t("recordTime")}</th><th scope="col">${t("recordUses")}</th></tr></thead><tbody>${list.map((r, i) => `<tr><td><span class="rank rank-${i}">${num(i + 1)}</span></td><td><span class="player-name">${esc(r.playerName)}</span>${r.noLanternRun ? `<span class="record-achievement" title="${t("noLanternRun")}" aria-label="${t("noLanternRun")}">${icon("moon")}</span>` : ""}</td><td class="record-time">${formatTime(r.completionTimeMs)}</td><td>${r.lanternUses}${icon("lantern")}</td></tr>`).join("")}</tbody></table></div>`
    : `<div class="empty-records">${icon("leaf")}<h2>${t("emptyRecords")}</h2><p>${t("emptyRecordsBody")}</p><button class="button primary" data-action="play" data-maze="${Number(mazeId.split("-")[1]) - 1}">${t("begin")}${icon("arrow")}</button></div>`;
}
function recordsScreen(): string {
  return `<main id="main" class="records-page" tabindex="-1"><button class="text-button back-link" data-action="title">${icon("back")}${t("backTitle")}</button><div class="page-intro"><p class="eyebrow">${t("recordsEyebrow")}</p><h1>${t("recordsTitle")}</h1><p>${t("recordsBody")}</p></div><section class="records-panel"><div class="records-picker"><label for="record-maze">${t("recordsFor")}</label><select id="record-maze">${MAZES.map((m, i) => `<option value="${m.mazeId}" ${m.mazeId === selectedRecordMaze ? "selected" : ""}>${num(i + 1)} · ${name(i + 1)}</option>`).join("")}</select></div>${table(selectedRecordMaze)}</section>${warning()}<p class="local-notice">${t("localNotice")}</p><button class="text-button clear-button" data-action="clear">${t("clear")}</button></main>`;
}
function footer(): string {
  return `<footer class="site-footer"><span>${icon("leaf")}${t("footer")}</span><span>${t("version")}</span></footer>`;
}
function render(focusMain = false): void {
  lastStatus = "";
  const existingName = document.querySelector<HTMLInputElement>("#player-name");
  if (existingName) completionName = existingName.value;
  renderer?.destroy();
  renderer = undefined;
  document.documentElement.lang = prefs.language;
  document.title = t("title");
  document.body.classList.toggle("in-game", screen === "game");
  document.body.classList.toggle("reduced-effects", prefs.reduced);
  app.innerHTML = `${header()}${screen === "title" ? titleScreen() : screen === "select" ? selectScreen() : screen === "game" ? gameScreen() : recordsScreen()}${footer()}<div id="live" class="toast" role="status" aria-live="polite"></div><div id="dialog-root"></div>`;
  if (screen === "game" && session) {
    try {
      renderer = new Renderer(
        document.querySelector<HTMLCanvasElement>("#maze-canvas")!,
        session.maze,
      );
      renderer.draw(session, prefs.reduced);
      updateHUD();
    } catch {
      session.pause();
      const shell = document.querySelector(".canvas-shell");
      if (shell)
        shell.innerHTML = `<div class="render-error" role="alert">${icon("leaf")}<p>${t("renderError")}</p></div>`;
    }
  }
  if (modal) renderModal();
  if (focusMain && !modal)
    document
      .querySelector<HTMLElement>("#main")
      ?.focus({ preventScroll: true });
}
function renderModal(): void {
  const root = document.querySelector("#dialog-root")!;
  const previous = document.querySelector<HTMLDialogElement>("#game-dialog");
  previous?.close();
  if (!modal) {
    root.innerHTML = "";
    return;
  }
  let body = "",
    title = "";
  if (modal === "settings") {
    title = t("settings");
    body = `<p class="eyebrow">${t("howTo")}</p><h2 id="dialog-title">${title}</h2><div class="setting-row"><div><h3>${t("sound")}</h3><p>${t("soundBody")}</p></div><button class="toggle ${prefs.sound ? "active" : ""}" data-action="sound" role="switch" aria-checked="${prefs.sound}" aria-label="${t("sound")}"><span></span></button></div><div class="setting-row"><div><h3>${t("reduced")}</h3><p>${t("reducedBody")}</p></div><button class="toggle ${prefs.reduced ? "active" : ""}" data-action="reduced" role="switch" aria-checked="${prefs.reduced}" aria-label="${t("reduced")}"><span></span></button></div><div class="how-to"><p>${t("howToBody")}</p><p>${t("pauseNote")}</p></div><button class="button primary full" data-action="close-modal">${t("done")}</button>`;
  } else if (modal === "pause") {
    title = t("paused");
    body = `<span class="dialog-emblem">${icon("moon")}</span><h2 id="dialog-title">${title}</h2><p>${t("pausedBody")}</p><button class="button primary full" data-action="resume">${t("resume")}${icon("arrow")}</button><div class="dialog-link-row"><button class="text-button" data-action="restart">${icon("restart")}${t("restart")}</button><button class="text-button" data-action="exit">${t("exit")}</button></div>`;
  } else if (modal === "restart" || modal === "exit" || modal === "clear") {
    const action = modal;
    title = t(`${action}Title` as TextKey);
    body = `<span class="dialog-emblem">${icon(action === "clear" ? "trophy" : action === "restart" ? "restart" : "leaf")}</span><h2 id="dialog-title">${title}</h2><p>${t(`${action}Body` as TextKey)}</p><button class="button ${action === "clear" ? "danger" : "primary"} full" data-action="confirm-${action}">${t(`${action}Confirm` as TextKey)}</button><button class="text-button centered" data-action="cancel-confirm">${t(action === "clear" ? "keepRecords" : "cancel")}</button>`;
  } else if (modal === "complete" && session) {
    const noLight = achievements({
      completed: true,
      lanternUses: session.lanternUses,
    }).includes("noLanternRun");
    const qualifies = records.qualifies(session.mazeId, session.elapsedTimeMs);
    title = t("completeTitle");
    body = `<div class="home-medallion">${icon("home")}<span>✧</span></div><p class="eyebrow">${t("homeEyebrow")}</p><h2 id="dialog-title">${title}</h2><p class="congratulations">${t("complete")}</p><div class="result-stats"><div><span>${t("finalTime")}</span><strong>${formatTime(session.elapsedTimeMs)}</strong></div><div><span>${t("uses")}</span><strong>${session.lanternUses}${icon("lantern")}</strong></div></div>${noLight ? `<div class="achievement-banner">${icon("moon")}<div><h3>${t("noLanternRun")}</h3><p>${t("achievementBody")}</p></div>${icon("star")}</div>` : ""}
    ${saved ? `<div class="saved-record">${icon("check")}${t("saved")}</div>` : qualifies ? `<form id="record-form"><h3>${icon("trophy")}${t("qualify")}</h3><p>${t("qualifyBody")}</p><label for="player-name">${t("displayName")}</label><div class="name-input"><input id="player-name" name="playerName" maxlength="24" autocomplete="nickname" value="${esc(completionName || t("defaultName"))}"/><button class="button primary" type="submit">${t("saveRecord")}</button></div></form>` : `<p class="not-qualified">${t("notQualified")}</p>`}${warning()}<div class="completion-actions"><button class="button ${saved ? "primary" : "subtle"}" data-action="replay">${icon("restart")}${t("replay")}</button><button class="button subtle" data-action="select">${t("anotherMaze")}${icon("arrow")}</button></div>`;
  }
  root.innerHTML = `<dialog id="game-dialog" class="game-dialog ${modal === "complete" ? "completion-dialog" : ""}" aria-labelledby="dialog-title">${modal === "settings" ? `<button class="icon-button dialog-close" data-action="close-modal" aria-label="${t("close")}">${icon("close")}</button>` : ""}${body}</dialog>`;
  const d = document.querySelector<HTMLDialogElement>("#game-dialog")!;
  d.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (modal === "complete") return;
    if (modal === "restart" || modal === "exit" || modal === "clear")
      cancelConfirm();
    else closeModal();
  });
  d.showModal();
}
function clearInput(): void {
  keys.clear();
  pointers.clear();
  document
    .querySelectorAll(".direction.pressed")
    .forEach((e) => e.classList.remove("pressed"));
}
function changeScreen(next: typeof screen): void {
  clearInput();
  modal = null;
  screen = next;
  session = undefined;
  renderer?.destroy();
  renderer = undefined;
  render(true);
  window.scrollTo({ top: 0, behavior: "instant" });
}
function start(index: number): void {
  const maze = MAZES[index];
  if (!maze || validateMaze(maze).length) {
    notify("mazeError");
    return;
  }
  clearInput();
  session = new GameSession(maze);
  screen = "game";
  modal = null;
  saved = false;
  completionShown = false;
  previouslyReady = true;
  lastStatus = "";
  lastFrame = performance.now();
  completionName = prefs.playerName;
  render(true);
  window.scrollTo({ top: 0, behavior: "instant" });
}
function openModal(kind: typeof modal): void {
  if (!kind) return;
  clearInput();
  resumeAfterModal = session?.sessionStatus === "playing";
  returnModal = modal === "pause" ? "pause" : null;
  if (screen === "game") session?.pause();
  modal = kind;
  renderModal();
}
function closeModal(): void {
  const was = modal;
  modal = null;
  renderModal();
  if (session && (was === "pause" || resumeAfterModal)) {
    session.resume();
    lastFrame = performance.now();
  }
  clearInput();
  document
    .querySelector<HTMLElement>(screen === "game" ? "#maze-canvas" : "#main")
    ?.focus({ preventScroll: true });
}
function cancelConfirm(): void {
  if (returnModal === "pause") {
    modal = "pause";
    renderModal();
    return;
  }
  modal = null;
  renderModal();
  if (resumeAfterModal) session?.resume();
  lastFrame = performance.now();
  clearInput();
}
function activate(): void {
  if (modal || !session?.activateLantern()) return;
  audio("light");
  notify("lightUsed");
  previouslyReady = false;
  updateHUD();
}
function updateHUD(): void {
  if (!session) return;
  const clock = document.querySelector("#stopwatch");
  if (clock) clock.textContent = formatTime(session.elapsedTimeMs);
  const use = document.querySelector("#use-count");
  if (use) use.textContent = String(session.lanternUses);
  const isReady = session.lantern.ready(session.elapsedTimeMs),
    isFlash = session.lantern.flashing(session.elapsedTimeMs);
  const status = isFlash
    ? t("flash")
    : isReady
      ? t("ready")
      : t("recharge", { seconds: (session.lanternCooldown / 1000).toFixed(1) });
  const lamp = document.querySelector<HTMLElement>("#lantern-button");
  if (lamp) {
    lamp.classList.toggle("charging", !isReady);
    lamp.classList.toggle("flashing", isFlash);
    lamp.setAttribute("aria-disabled", String(!isReady));
    lamp.style.setProperty(
      "--charge",
      String(session.lantern.progress(session.elapsedTimeMs)),
    );
  }
  document.querySelectorAll<HTMLElement>(".touch-lantern").forEach((b) => {
    b.classList.toggle("charging", !isReady);
    b.setAttribute("aria-disabled", String(!isReady));
  });
  if (status !== lastStatus) {
    const label = document.querySelector("#lantern-status");
    if (label) label.textContent = status;
    lastStatus = status;
  }
  if (isReady && !previouslyReady) {
    audio("ready");
    notify("lightReady");
  }
  previouslyReady = isReady;
}
app.addEventListener("click", (event) => {
  const target = (event.target as Element).closest<HTMLElement>(
    "[data-action]",
  );
  if (!target) return;
  const action = target.dataset.action;
  if (action === "language") {
    const focusLang = target.dataset.lang as Language;
    prefs.language = focusLang;
    persistPreferences();
    lastStatus = "";
    render();
    document
      .querySelector<HTMLButtonElement>(`[data-lang="${focusLang}"]`)
      ?.focus({ preventScroll: true });
    return;
  }
  if (action === "sound") {
    prefs.sound = !prefs.sound;
    sound.enabled = prefs.sound;
    persistPreferences();
    render();
    if (prefs.sound) audio("ready");
    return;
  }
  if (action === "settings") {
    openModal("settings");
    return;
  }
  if (action === "reduced") {
    prefs.reduced = !prefs.reduced;
    persistPreferences();
    render();
    return;
  }
  if (action === "lantern") {
    activate();
    return;
  }
  if (action === "close-modal" || action === "resume") {
    closeModal();
    return;
  }
  if (action === "brand") {
    if (screen === "game" && session?.sessionStatus !== "completed") {
      openModal("exit");
    } else changeScreen("title");
    return;
  }
  if (action === "title") {
    changeScreen("title");
    return;
  }
  if (action === "select") {
    changeScreen("select");
    return;
  }
  if (action === "records") {
    changeScreen("records");
    return;
  }
  if (action === "play") {
    start(Number(target.dataset.maze));
    return;
  }
  if (action === "pause") {
    openModal("pause");
    return;
  }
  if (action === "restart") {
    openModal("restart");
    return;
  }
  if (action === "exit") {
    if (session?.sessionStatus === "completed") changeScreen("select");
    else openModal("exit");
    return;
  }
  if (action === "clear") {
    openModal("clear");
    return;
  }
  if (action === "cancel-confirm") {
    cancelConfirm();
    return;
  }
  if (action === "confirm-restart" || action === "replay") {
    if (session) start(MAZES.indexOf(session.maze));
    return;
  }
  if (action === "confirm-exit") {
    changeScreen("select");
    return;
  }
  if (action === "confirm-clear") {
    const persisted = records.clear();
    modal = null;
    render();
    notify(persisted ? "cleared" : "clearFailed");
    return;
  }
});
app.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;
  if (target.id === "record-maze") {
    selectedRecordMaze = target.value;
    render();
    document.querySelector<HTMLElement>("#record-maze")?.focus();
  }
});
app.addEventListener("input", (event) => {
  const e = event.target as HTMLInputElement;
  if (e.id === "player-name") completionName = e.value;
});
app.addEventListener("submit", (event) => {
  if ((event.target as HTMLElement).id !== "record-form" || !session) return;
  event.preventDefault();
  const playerName = completionName.trim().slice(0, 24) || t("defaultName");
  const record: RunRecord = {
    schemaVersion: 1,
    mazeId: session.mazeId,
    playerName,
    completionTimeMs: session.elapsedTimeMs,
    lanternUses: session.lanternUses,
    noLanternRun: session.lanternUses === 0,
    completedAt: new Date().toISOString(),
  };
  saved = records.add(record);
  prefs.playerName = playerName;
  persistPreferences();
  renderModal();
});
const movementKeys = [
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
];
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (screen !== "game" || !session) return;
  if (key === "escape" && !modal) {
    event.preventDefault();
    openModal("pause");
    return;
  }
  if (modal) return;
  if (movementKeys.includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) activate();
  }
});
window.addEventListener("keyup", (event) =>
  keys.delete(event.key.toLowerCase()),
);
app.addEventListener("pointerdown", (event) => {
  const target = (event.target as Element).closest<HTMLElement>(
    "[data-direction]",
  );
  if (!target || modal || screen !== "game") return;
  event.preventDefault();
  target.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, target.dataset.direction!);
  target.classList.add("pressed");
});
const release = (event: PointerEvent) => {
  pointers.delete(event.pointerId);
  (event.target as Element)
    ?.closest("[data-direction]")
    ?.classList.remove("pressed");
};
app.addEventListener("pointerup", release);
app.addEventListener("pointercancel", release);
app.addEventListener("lostpointercapture", release);
app.addEventListener("contextmenu", (event) => {
  if ((event.target as Element).closest(".touch-controls"))
    event.preventDefault();
});
function suspend(): void {
  clearInput();
  if (session?.sessionStatus === "playing") {
    session.pause();
    modal = "pause";
    resumeAfterModal = false;
    renderModal();
  }
}
window.addEventListener("blur", suspend);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) suspend();
  lastFrame = performance.now();
});
function frame(now: number): void {
  const delta = now - lastFrame;
  lastFrame = now;
  if (delta > 1000 && session?.sessionStatus === "playing") suspend();
  if (session && screen === "game") {
    const dirs = new Set([...pointers.values()]);
    const input = {
      x:
        Number(keys.has("arrowright") || keys.has("d") || dirs.has("right")) -
        Number(keys.has("arrowleft") || keys.has("a") || dirs.has("left")),
      y:
        Number(keys.has("arrowdown") || keys.has("s") || dirs.has("down")) -
        Number(keys.has("arrowup") || keys.has("w") || dirs.has("up")),
    };
    if (!modal) session.update(delta, input);
    renderer?.draw(session, prefs.reduced);
    updateHUD();
    if (session.sessionStatus === "completed" && !completionShown) {
      completionShown = true;
      clearInput();
      modal = "complete";
      audio("home");
      if (session.lanternUses === 0)
        setTimeout(() => audio("achievement"), 600);
      renderModal();
    }
  }
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
// A read-only development probe lets browser tests observe real keyboard/touch input.
// Vite removes this branch and its contents from the production build.
if (import.meta.env.DEV) {
  Object.defineProperty(window, "__jasmineSnapshot", {
    get: () =>
      session
        ? {
            mazeId: session.mazeId,
            position: { ...session.playerPosition },
            elapsedTimeMs: session.elapsedTimeMs,
            status: session.sessionStatus,
            lanternUses: session.lanternUses,
            cooldown: session.lanternCooldown,
            flashing: session.lantern.flashing(session.elapsedTimeMs),
            exploredCount: session.visibility.exploredAreas.reduce(
              (sum, v) => sum + v,
              0,
            ),
          }
        : null,
  });
}
