import type { Language } from "./i18n";
import type { StoragePort } from "../core/records";
export interface Preferences {
  language: Language;
  sound: boolean;
  reduced: boolean;
  playerName: string;
}
export const PREFERENCES_KEY = "jasmine-odyssey.preferences.v1";
export function loadPreferences(storage?: StoragePort): Preferences {
  const defaults: Preferences = {
    language: "en",
    sound: false,
    reduced:
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    playerName: "",
  };
  try {
    const saved = JSON.parse(storage?.getItem(PREFERENCES_KEY) ?? "null");
    if (!saved || saved.schemaVersion !== 1) return defaults;
    return {
      language: saved.language === "zh-TW" ? "zh-TW" : "en",
      sound: saved.sound === true,
      reduced:
        typeof saved.reduced === "boolean" ? saved.reduced : defaults.reduced,
      playerName:
        typeof saved.playerName === "string"
          ? saved.playerName.slice(0, 24)
          : "",
    };
  } catch {
    return defaults;
  }
}
export function savePreferences(
  prefs: Preferences,
  storage?: StoragePort,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ schemaVersion: 1, ...prefs }),
    );
    return true;
  } catch {
    return false;
  }
}
