import type { RunRecord } from "./types";
export const RECORDS_KEY = "jasmine-odyssey.records.v1";
export const RECORD_LIMIT = 5;
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type StorageProblem = "none" | "unavailable" | "corrupted";
function validRecord(r: unknown): r is RunRecord {
  if (!r || typeof r !== "object") return false;
  const v = r as RunRecord;
  return (
    v.schemaVersion === 1 &&
    /^maze-([1-9]|10)$/.test(v.mazeId) &&
    typeof v.playerName === "string" &&
    v.playerName.length <= 24 &&
    v.playerName.trim().length > 0 &&
    Number.isFinite(v.completionTimeMs) &&
    v.completionTimeMs > 0 &&
    Number.isInteger(v.lanternUses) &&
    v.lanternUses >= 0 &&
    typeof v.noLanternRun === "boolean" &&
    v.noLanternRun === (v.lanternUses === 0) &&
    typeof v.completedAt === "string"
  );
}
export class Records {
  private records: RunRecord[] = [];
  problem: StorageProblem = "none";
  constructor(private storage?: StoragePort) {
    if (!storage) {
      this.problem = "unavailable";
      return;
    }
    try {
      const raw = storage.getItem(RECORDS_KEY);
      if (raw === null) return;
      const data = JSON.parse(raw);
      if (
        !data ||
        data.schemaVersion !== 1 ||
        !Array.isArray(data.records) ||
        !data.records.every(validRecord)
      ) {
        this.problem = "corrupted";
        return;
      }
      this.records = data.records;
    } catch (e) {
      this.problem = e instanceof SyntaxError ? "corrupted" : "unavailable";
    }
  }
  list(mazeId: string): RunRecord[] {
    return this.records
      .filter((r) => r.mazeId === mazeId)
      .sort((a, b) => a.completionTimeMs - b.completionTimeMs)
      .slice(0, RECORD_LIMIT)
      .map((r) => ({ ...r }));
  }
  qualifies(mazeId: string, ms: number): boolean {
    const list = this.list(mazeId);
    return (
      list.length < RECORD_LIMIT || ms < list[list.length - 1].completionTimeMs
    );
  }
  add(record: RunRecord): boolean {
    if (
      !validRecord(record) ||
      !this.qualifies(record.mazeId, record.completionTimeMs)
    )
      return false;
    const list = [...this.list(record.mazeId), { ...record }]
      .sort((a, b) => a.completionTimeMs - b.completionTimeMs)
      .slice(0, RECORD_LIMIT);
    this.records = [
      ...this.records.filter((r) => r.mazeId !== record.mazeId),
      ...list,
    ];
    this.persist();
    return true;
  }
  private persist(): void {
    // Corrupt original data is preserved until the player explicitly clears it.
    if (this.problem === "corrupted") return;
    try {
      if (!this.storage) throw new Error("no-storage");
      this.storage.setItem(
        RECORDS_KEY,
        JSON.stringify({ schemaVersion: 1, records: this.records }),
      );
    } catch {
      this.problem = "unavailable";
    }
  }
  clear(): boolean {
    let persisted = true;
    try {
      if (!this.storage) throw new Error("no-storage");
      this.storage.removeItem(RECORDS_KEY);
      this.problem = "none";
    } catch {
      this.problem = "unavailable";
      persisted = false;
    }
    this.records = [];
    return persisted;
  }
}
