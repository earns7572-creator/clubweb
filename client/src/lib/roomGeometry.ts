export type RoomMetrics = Readonly<{ width: number; depth: number }>;

export const DESKTOP_ROOM_METERS: RoomMetrics = { width: 13, depth: 8 };
export const MOBILE_PORTRAIT_ROOM_METERS: RoomMetrics = { width: 8.4, depth: 14 };

export function roomMetricsForViewport(width: number, height: number): RoomMetrics {
  return width < 760 && height >= width ? MOBILE_PORTRAIT_ROOM_METERS : DESKTOP_ROOM_METERS;
}
