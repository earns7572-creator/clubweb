/** Speaker yaw is radians around Three.js Y. A cabinet's physical front is local +Z. */
export const ROTATION_SNAP_RADIANS = Math.PI / 12;

export function normalizeYaw(yaw: number) {
  const wrapped = (yaw + Math.PI) % (Math.PI * 2);
  return (wrapped < 0 ? wrapped + Math.PI * 2 : wrapped) - Math.PI;
}

export function degreesToYaw(degrees: number) {
  return normalizeYaw((degrees * Math.PI) / 180);
}
export function yawToDegrees(yaw: number) {
  const fullTurn = Math.PI * 2;
  const degrees = Math.round(
    ((((yaw % fullTurn) + fullTurn) % fullTurn) * 180) / Math.PI
  );
  return degrees === 360 ? 0 : degrees;
}
export function snapYaw(yaw: number, step = ROTATION_SNAP_RADIANS) {
  return normalizeYaw(Math.round(yaw / step) * step);
}

export type ScreenPoint = { x: number; y: number };

/** Screen +Y points toward the cabinet's local +Z/front in the TOP camera. */
export function yawFromScreenPointer(
  center: ScreenPoint,
  pointer: ScreenPoint
) {
  return normalizeYaw(Math.atan2(pointer.x - center.x, pointer.y - center.y));
}

export function snappedYawFromScreenPointer(
  center: ScreenPoint,
  pointer: ScreenPoint
) {
  return snapYaw(yawFromScreenPointer(center, pointer));
}

/** Audio room axes match TOP: scene +X → audio +X, scene +Z → audio +Z. */
export function speakerOrientationToAudioOrientation(yaw: number) {
  return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
}
