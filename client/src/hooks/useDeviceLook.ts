/* Club Craft motion rule: a permission-gated device pose controls visual look at a low rate and HRTF orientation at <=25 Hz, never position. */
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import type { ClubListener } from "@/hooks/useClubAudio";
import { getScreenOrientationDegrees, requestOrientationPermission, writeDeviceOrientationQuaternion, writeRelativeDeviceLook } from "@/lib/deviceOrientation";
import { recenterLookAnchor } from "@/lib/povLook";

export type MotionState = "off" | "requesting" | "active" | "denied" | "unsupported";
export type DeviceLookPose = { active: boolean; yaw: number; pitch: number };
export type DeviceLook = {
  state: MotionState;
  poseRef: MutableRefObject<DeviceLookPose>;
  enable: () => Promise<void>;
  disable: () => void;
  recenter: () => void;
  adjustCenter: (deltaYaw: number, deltaPitch: number) => void;
};

type Options = {
  listener: ClubListener;
  onLookAbsolute: (yaw: number, pitch: number) => void;
  onVisualUpdate: () => void;
};

const MAX_YAW_DELTA = Math.PI * .75;
const MAX_PITCH_DELTA = .95;
const MAX_PITCH = 1.12;
const SMOOTHING = .16;
const VISUAL_INTERVAL_MS = 1000 / 30;
const AUDIO_INTERVAL_MS = 1000 / 25;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const shortestAngleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function useDeviceLook({ listener, onLookAbsolute, onVisualUpdate }: Options): DeviceLook {
  const [state, setState] = useState<MotionState>("off");
  const stateRef = useRef<MotionState>("off");
  const listenerRef = useRef(listener);
  const onLookAbsoluteRef = useRef(onLookAbsolute);
  const onVisualUpdateRef = useRef(onVisualUpdate);
  const anchorRef = useRef({ yaw: listener.orientation.yaw, pitch: listener.orientation.pitch });
  const poseRef = useRef<DeviceLookPose>({ active: false, yaw: listener.orientation.yaw, pitch: listener.orientation.pitch });
  const baselineQuaternion = useRef<THREE.Quaternion | null>(null);
  const currentQuaternion = useRef(new THREE.Quaternion());
  const relativeQuaternion = useRef(new THREE.Quaternion());
  const relativeForward = useRef(new THREE.Vector3());
  const relativeLook = useRef({ yaw: 0, pitch: 0 });
  const lastVisualUpdate = useRef(0);
  const lastAudioUpdate = useRef(0);

  const setMotionState = useCallback((next: MotionState) => { stateRef.current = next; setState(next); }, []);
  useEffect(() => { listenerRef.current = listener; if (stateRef.current !== "active") { anchorRef.current = { ...listener.orientation }; poseRef.current = { active: false, ...listener.orientation }; } }, [listener]);
  useEffect(() => { onLookAbsoluteRef.current = onLookAbsolute; }, [onLookAbsolute]);
  useEffect(() => { onVisualUpdateRef.current = onVisualUpdate; }, [onVisualUpdate]);

  const publish = useCallback((now: number, force = false) => {
    if (force || now - lastVisualUpdate.current >= VISUAL_INTERVAL_MS) { lastVisualUpdate.current = now; onVisualUpdateRef.current(); }
    if (force || now - lastAudioUpdate.current >= AUDIO_INTERVAL_MS) { lastAudioUpdate.current = now; onLookAbsoluteRef.current(poseRef.current.yaw, poseRef.current.pitch); }
  }, []);

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (stateRef.current !== "active" || event.alpha === null || event.beta === null || event.gamma === null) return;
    writeDeviceOrientationQuaternion(currentQuaternion.current, event.alpha, event.beta, event.gamma, getScreenOrientationDegrees());
    if (!baselineQuaternion.current) { baselineQuaternion.current = currentQuaternion.current.clone(); poseRef.current = { active: true, ...anchorRef.current }; publish(performance.now(), true); return; }
    const relative = writeRelativeDeviceLook(relativeLook.current, baselineQuaternion.current, currentQuaternion.current, relativeQuaternion.current, relativeForward.current);
    const yawDelta = clamp(relative.yaw, -MAX_YAW_DELTA, MAX_YAW_DELTA);
    const pitchDelta = clamp(relative.pitch, -MAX_PITCH_DELTA, MAX_PITCH_DELTA);
    const targetYaw = anchorRef.current.yaw + yawDelta;
    const targetPitch = clamp(anchorRef.current.pitch + pitchDelta, -MAX_PITCH, MAX_PITCH);
    const current = poseRef.current;
    current.active = true;
    current.yaw += shortestAngleDelta(current.yaw, targetYaw) * SMOOTHING;
    current.pitch += (targetPitch - current.pitch) * SMOOTHING;
    publish(performance.now());
  }, [publish]);

  const disable = useCallback(() => {
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    baselineQuaternion.current = null;
    poseRef.current = { active: false, ...listenerRef.current.orientation };
    localStorage.setItem("club-craft-motion-enabled", "false");
    setMotionState("off");
    onVisualUpdateRef.current();
  }, [handleDeviceOrientation, setMotionState]);

  const enable = useCallback(async () => {
    if (stateRef.current === "active" || stateRef.current === "requesting") return;
    setMotionState("requesting");
    const permission = await requestOrientationPermission();
    if (permission === "unsupported") { setMotionState("unsupported"); return; }
    if (permission === "denied") { setMotionState("denied"); return; }
    anchorRef.current = { ...listenerRef.current.orientation };
    poseRef.current = { active: true, ...anchorRef.current };
    baselineQuaternion.current = null;
    lastVisualUpdate.current = 0;
    lastAudioUpdate.current = 0;
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
    localStorage.setItem("club-craft-motion-enabled", "true");
    setMotionState("active");
    onVisualUpdateRef.current();
  }, [handleDeviceOrientation, setMotionState]);

  const recenter = useCallback(() => {
    if (stateRef.current !== "active") return;
    if (baselineQuaternion.current) baselineQuaternion.current.copy(currentQuaternion.current);
    anchorRef.current = recenterLookAnchor(poseRef.current);
    publish(performance.now(), true);
  }, [publish]);

  const adjustCenter = useCallback((deltaYaw: number, deltaPitch: number) => {
    if (stateRef.current !== "active") return;
    anchorRef.current.yaw += deltaYaw;
    anchorRef.current.pitch = clamp(anchorRef.current.pitch + deltaPitch, -MAX_PITCH, MAX_PITCH);
    poseRef.current.yaw += deltaYaw;
    poseRef.current.pitch = clamp(poseRef.current.pitch + deltaPitch, -MAX_PITCH, MAX_PITCH);
    publish(performance.now(), true);
  }, [publish]);

  useEffect(() => () => { window.removeEventListener("deviceorientation", handleDeviceOrientation); }, [handleDeviceOrientation]);
  return { state, poseRef, enable, disable, recenter, adjustCenter };
}
