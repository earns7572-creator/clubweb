/* Club Craft POV rule: phone motion changes camera look and HRTF orientation through a throttled absolute callback; bass vibration remains visual only. */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ClubListener, ClubSpeaker } from "@/hooks/useClubAudio";
import { useDeviceLook, type DeviceLookPose } from "@/hooks/useDeviceLook";
import { calculateBassPressure, vibrationFromPressure } from "@/lib/bassPressure";
import { SpeakerMiniature } from "@/components/SpeakerMiniature";
import type { SurfaceTone } from "@/components/ClubFloor3D";
import { createStackResolver } from "@/lib/speakerStacking";
import { DjBooth } from "@/components/DjBooth";
import { listenerEarHeightMeters } from "@/lib/spatialCoordinates";

type Props = { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>>; lowActivityBySpeaker: Readonly<Record<string, number>>; listener: ClubListener; surfaceTone: SurfaceTone; isPlaying: boolean; onLook: (deltaYaw: number, deltaPitch: number) => void; onLookAbsolute: (yaw: number, pitch: number) => void };
const world = (position: Pick<ClubSpeaker["position"], "x" | "y">) => [(position.x - .5) * 13, 0, (position.y - .5) * 8] as const;
const povPalette: Record<SurfaceTone, { background: string; fog: string; floor: string; gridMajor: string; gridMinor: string; ambient: number; directional: number; light: string }> = {
  paper: { background: "#f6f4ee", fog: "#f0eee7", floor: "#d9d8d1", gridMajor: "#aaa9a1", gridMinor: "#c8c7bf", ambient: .78, directional: 1.05, light: "#fffaf0" },
  sand: { background: "#e9e1d4", fog: "#e4dbcc", floor: "#d2c7b7", gridMajor: "#9f927e", gridMinor: "#bdb1a0", ambient: .74, directional: 1.02, light: "#fff5e4" },
  slate: { background: "#dde0dd", fog: "#d7dcda", floor: "#c6ccca", gridMajor: "#909894", gridMinor: "#b1b9b5", ambient: .78, directional: 1.06, light: "#f4faf6" },
  night: { background: "#050606", fog: "#090b09", floor: "#0b0d0c", gridMajor: "#414741", gridMinor: "#202420", ambient: .24, directional: .42, light: "#dfe8df" },
};

function CameraRig({ listener, vibration, motionPose, onInvalidateReady }: { listener: ClubListener; vibration: number; motionPose: MutableRefObject<DeviceLookPose>; onInvalidateReady: (invalidate: () => void) => void }) {
  const { camera, invalidate } = useThree();
  const basePosition = useRef(new THREE.Vector3()); const baseQuaternion = useRef(new THREE.Quaternion()); const forward = useRef(new THREE.Vector3()); const lastLook = useRef({ yaw: Number.NaN, pitch: Number.NaN, x: Number.NaN, y: Number.NaN, z: Number.NaN }); const current = useRef(0); const offset = useRef(new THREE.Vector3()); const rotation = useRef(new THREE.Euler()); const rotationQuaternion = useRef(new THREE.Quaternion()); const reducedMotion = useRef(false);
  useEffect(() => { onInvalidateReady(invalidate); return () => onInvalidateReady(() => undefined); }, [invalidate, onInvalidateReady]);
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const apply = () => { reducedMotion.current = media.matches; invalidate(); }; apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply); }, [invalidate]);
  const syncBase = () => {
    const motion = motionPose.current;
    const yaw = motion.active ? motion.yaw : listener.orientation.yaw;
    const pitch = motion.active ? motion.pitch : listener.orientation.pitch;
    const x = (listener.position.x - .5) * 13; const y = listenerEarHeightMeters(listener.position.z); const z = (listener.position.y - .5) * 8;
    const last = lastLook.current;
    if (yaw === last.yaw && pitch === last.pitch && x === last.x && y === last.y && z === last.z) return;
    forward.current.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    camera.position.set(x, y, z); camera.lookAt(x + forward.current.x, y + forward.current.y, z + forward.current.z);
    basePosition.current.copy(camera.position); baseQuaternion.current.copy(camera.quaternion); lastLook.current = { yaw, pitch, x, y, z };
  };
  useEffect(() => { syncBase(); invalidate(); }, [listener, invalidate]);
  useEffect(() => { if (!reducedMotion.current && vibration > 0) invalidate(); }, [invalidate, vibration]);
  useFrame((state, delta) => {
    syncBase();
    const target = reducedMotion.current ? 0 : vibration;
    current.current = THREE.MathUtils.damp(current.current, target, target > current.current ? 15 : 11, delta);
    if (target === 0 && current.current < .004) { current.current = 0; camera.position.copy(basePosition.current); camera.quaternion.copy(baseQuaternion.current); return; }
    const intensity = current.current;
    if (intensity < .001) { camera.position.copy(basePosition.current); camera.quaternion.copy(baseQuaternion.current); return; }
    const t = state.clock.elapsedTime;
    offset.current.set(Math.sin(t * 51.7) * .012 * intensity, (Math.sin(t * 63.1) * .018 + Math.sin(t * 27.3) * .007) * intensity, Math.sin(t * 38.9) * .005 * intensity);
    rotation.current.set(Math.sin(t * 31.7) * .0022 * intensity, Math.sin(t * 43.1) * .0015 * intensity, Math.sin(t * 25.9) * .0009 * intensity);
    rotationQuaternion.current.setFromEuler(rotation.current);
    camera.position.copy(basePosition.current).add(offset.current);
    camera.quaternion.copy(baseQuaternion.current).multiply(rotationQuaternion.current);
    if (current.current > .001 || vibration > 0) invalidate();
  });
  return null;
}
function PovSpeaker({ speaker, activity, centerY, xy }: { speaker: ClubSpeaker; activity: number; centerY: number; xy: { x: number; y: number } }) { const [x, , z] = world(xy); return <group position={[x, centerY, z]} rotation={[0, speaker.orientation?.yaw ?? 0, 0]}><SpeakerMiniature kind={speaker.kind} modelId={speaker.modelId} activity={activity} glowStrength={1.45} /></group>; }
function PovWorld({ speakers, activityBySpeaker, surfaceTone, isPlaying }: { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>>; surfaceTone: SurfaceTone; isPlaying: boolean }) { const surface = povPalette[surfaceTone]; const stackResolver = createStackResolver(speakers); return <><fog attach="fog" args={[surface.fog, 8, 30]} /><ambientLight intensity={surface.ambient} /><directionalLight position={[-4, 8, 3]} intensity={surface.directional} color={surface.light} /><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[28, 22]} /><meshStandardMaterial color={surface.floor} roughness={.96} /></mesh><group position={[0, 0, -3.5]}><DjBooth active={isPlaying} tone={surfaceTone} /></group>{speakers.map((speaker) => <PovSpeaker key={speaker.id} speaker={speaker} activity={activityBySpeaker[speaker.id] ?? 0} centerY={stackResolver.getCenterMeters(speaker)} xy={stackResolver.getXY(speaker)} />)}<gridHelper args={[24, 24, surface.gridMajor, surface.gridMinor]} position={[0, .01, 0]} /></>; }

export default function PovPreview({ speakers, activityBySpeaker, lowActivityBySpeaker, listener, surfaceTone, isPlaying, onLook, onLookAbsolute }: Props) {
  const dragging = useRef(false); const point = useRef({ x: 0, y: 0 }); const pending = useRef({ yaw: 0, pitch: 0 }); const frame = useRef<number | null>(null); const invalidateRef = useRef<() => void>(() => undefined); const [coarsePointer, setCoarsePointer] = useState(false);
  const deviceLook = useDeviceLook({ listener, onLookAbsolute, onVisualUpdate: () => invalidateRef.current() });
  const bassPressure = calculateBassPressure(speakers, lowActivityBySpeaker, listener); const vibration = vibrationFromPressure(bassPressure);
  useEffect(() => { const media = window.matchMedia("(pointer: coarse)"); const apply = () => setCoarsePointer(media.matches); apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply); }, []);
  const flushLook = () => { frame.current = null; const { yaw, pitch } = pending.current; pending.current = { yaw: 0, pitch: 0 }; if (!yaw && !pitch) return; if (deviceLook.state === "active") deviceLook.adjustCenter(yaw, pitch); else onLook(yaw, pitch); };
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  const surface = povPalette[surfaceTone]; const motionActive = deviceLook.state === "active"; const instruction = motionActive ? "Move your phone to look" : coarsePointer ? "Swipe to look" : "Drag to look around";
  return <div className={`pov-preview ${motionActive ? "motion-active" : ""}`} onPointerDown={(event) => { dragging.current = true; point.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!dragging.current) return; pending.current.yaw += (event.clientX - point.current.x) * .007; pending.current.pitch += (point.current.y - event.clientY) * .005; point.current = { x: event.clientX, y: event.clientY }; if (frame.current === null) frame.current = requestAnimationFrame(flushLook); }} onPointerUp={() => { dragging.current = false; if (frame.current !== null) { cancelAnimationFrame(frame.current); flushLook(); } }} onPointerCancel={() => { dragging.current = false; }} onPointerLeave={() => { dragging.current = false; }}><Canvas frameloop="demand" camera={{ fov: 58, position: [0, 1, 1] }} dpr={(coarsePointer ? [1, 1.15] : [1, 1.25]) as [number, number]}><color attach="background" args={[surface.background]} /><CameraRig listener={listener} vibration={vibration} motionPose={deviceLook.poseRef} onInvalidateReady={(invalidate) => { invalidateRef.current = invalidate; }} /><PovWorld speakers={speakers} activityBySpeaker={activityBySpeaker} surfaceTone={surfaceTone} isPlaying={isPlaying} /></Canvas><p>{instruction}</p><div className="motion-controls" onPointerDown={(event) => event.stopPropagation()}><button className={`motion-toggle ${motionActive ? "active" : ""}`} onClick={() => { if (motionActive) deviceLook.disable(); else void deviceLook.enable(); }} disabled={deviceLook.state === "requesting"}><span>MOTION</span><b>{motionActive ? "ON" : deviceLook.state === "requesting" ? "…" : "OFF"}</b></button>{motionActive && <button className="motion-recenter" onClick={deviceLook.recenter}>RECENTER</button>}{(deviceLook.state === "denied" || deviceLook.state === "unsupported") && <small role="status">Motion access unavailable</small>}</div></div>;
}
