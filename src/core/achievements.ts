export interface AchievementContext {
  completed: boolean;
  lanternUses: number;
}
const conditions: Record<string, (run: AchievementContext) => boolean> = {
  noLanternRun: (run) => run.completed && run.lanternUses === 0,
};
export function achievements(run: AchievementContext): string[] {
  return Object.entries(conditions)
    .filter(([, condition]) => condition(run))
    .map(([id]) => id);
}
