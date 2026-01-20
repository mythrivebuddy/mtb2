// Each area has 51 weeks × 6 days × 3 actions
const TOTAL_PROGRAM_ACTIONS_PER_AREA = 918;

export type MakeoverProgressRow = {
  identityDone: boolean | null;
  actionDone: boolean | null;
  winLogged: boolean | null;
};

/**
 * Calculates aggregated Area Progress against FULL program duration.
 * Progress reaches 100% ONLY if all actions till program end are completed.
 */
export function calculateAreaProgress(
  progressRows: MakeoverProgressRow[]
): number {
  const completedActions = progressRows.reduce((sum, row) => {
    return (
      sum +
      Number(row.identityDone) +
      Number(row.actionDone) +
      Number(row.winLogged)
    );
  }, 0);

  const progress = Math.floor(
    (completedActions / TOTAL_PROGRAM_ACTIONS_PER_AREA) * 100
  );

  return Math.min(100, progress);
}
