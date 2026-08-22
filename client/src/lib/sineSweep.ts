export const SWEEP_START_HZ = 20;
export const SWEEP_END_HZ = 20_000;
export const SWEEP_LEG_DURATION_SECONDS = 13;
export const SWEEP_SCHEDULE_LEGS = 512;

export function sweepLegTarget(index: number) {
  return index % 2 === 0 ? SWEEP_END_HZ : SWEEP_START_HZ;
}
