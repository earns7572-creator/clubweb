/** Speaker yaw is radians around Three.js Y. A cabinet's physical front is local +Z. */
export const ROTATION_SNAP_RADIANS = Math.PI / 12;

export function normalizeYaw(yaw: number) {
  const wrapped = (yaw + Math.PI) % (Math.PI * 2);
  return (wrapped < 0 ? wrapped + Math.PI * 2 : wrapped) - Math.PI;
}

export function degreesToYaw(degrees: number) { return normalizeYaw(degrees * Math.PI / 180); }
export function yawToDegrees(yaw: number) { return Math.round(normalizeYaw(yaw) * 180 / Math.PI); }
export function snapYaw(yaw: number, step = ROTATION_SNAP_RADIANS) { return normalizeYaw(Math.round(yaw / step) * step); }

/** Audio room axes match TOP: scene +X → audio +X, scene +Z → audio +Z. */
export function speakerOrientationToAudioOrientation(yaw: number) {
  return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
}
