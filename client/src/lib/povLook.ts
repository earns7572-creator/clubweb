export type LookAnchor = { yaw: number; pitch: number };

const FULL_SWIPE_YAW_RADIANS = Math.PI * .6;
const FULL_SWIPE_PITCH_RADIANS = 1.04;

export function swipeLookDelta(deltaX: number, deltaY: number, viewportWidth: number, viewportHeight: number): LookAnchor {
  return {
    yaw: deltaX / Math.max(1, viewportWidth) * FULL_SWIPE_YAW_RADIANS,
    pitch: -deltaY / Math.max(1, viewportHeight) * FULL_SWIPE_PITCH_RADIANS,
  };
}

export function recenterLookAnchor(pose: LookAnchor): LookAnchor {
  return { yaw: pose.yaw, pitch: pose.pitch };
}
