/* Club Craft POV rule: phone motion changes camera look and HRTF orientation through a throttled absolute callback; bass vibration remains visual only. */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ClubListener, ClubSpeaker } from "@/hooks/useClubAudio";
import { useDeviceLook, type DeviceLookPose } from "@/hooks/useDeviceLook";
import { calculateBassPressure, vibrationFromPressure } from "@/lib/bassPressure";
import { SpeakerMiniature } from "@/components/SpeakerMiniature";
import type { SurfaceTone } from "@/components/ClubFloor3D";
import { createStackResolver } from "@/lib/speakerStacking";
import { listenerEarHeightMeters } from "@/lib/spatialCoordinates";
import type { SpeakerBandActivityMap } from "@/lib/bandActivity";
import { swipeLookDelta } from "@/lib/povLook";
import { blockDimensions, createBlockResolver, type SupportBlock } from "@/lib/blockSupport";

type Props = { speakers: ClubSpeaker[]; blocks: SupportBlock[]; activityBySpeaker: Readonly<Record<string, number>>; lowActivityBySpeaker: Readonly<Record<string, number>>; bandActivityBySpeaker: SpeakerBandActivityMap; listener: ClubListener; surfaceTone: SurfaceTone; onLook: (deltaYaw: number, deltaPitch: number) => void; onLookAbsolute: (yaw: number, pitch: number) => void };
const world = (position: Pick<ClubSpeaker["position"], "x" | "y">) => [(position.x - .5) * 13, 0, (position.y - .5) * 8] as const;
const povPalette: Record<SurfaceTone, { background: string; floor: string; edge: string; shadow: string; ambient: number; directional: number; light: string }> = {
  paper: { background: "#f6f4ee", floor: "#e6e5de", edge: "#bab9b1", shadow: "#4b4d48", ambient: .72, directional: 1.04, light: "#fffaf0" },
  sand: { background: "#e9e1d4", floor: "#ddd5c8", edge: "#afa594", shadow: "#514c43", ambient: .70, directional: 1.0, light: "#fff5e4" },
  slate: { background: "#dde0dd", floor: "#d0d5d1", edge: "#a4aca6", shadow: "#414842", ambient: .72, directional: 1.04, light: "#f4faf6" },
  night: { background: "#050606", floor: "#101210", edge: "#343934", shadow: "#000000", ambient: .20, directional: .46, light: "#dfe8df" },
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
function PovSpeaker({ speaker, activity, bandActivity, centerY, xy }: { speaker: ClubSpeaker; activity: number; bandActivity: SpeakerBandActivityMap[string] | undefined; centerY: number; xy: { x: number; y: number } }) { const [x, , z] = world(xy); const ref = useRef<THREE.Group>(null); useEffect(() => { ref.current?.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } }); }, []); return <group ref={ref} position={[x, centerY, z]} rotation={[0, speaker.orientation?.yaw ?? 0, 0]}><SpeakerMiniature kind={speaker.kind} modelId={speaker.modelId} activity={activity} bandActivity={bandActivity} glowStrength={1.45} cabinetColor={speaker.cabinetColor} /></group>; }
function PovWorld({ speakers, blocks, activityBySpeaker, bandActivityBySpeaker, surfaceTone }: { speakers: ClubSpeaker[]; blocks: SupportBlock[]; activityBySpeaker: Readonly<Record<string, number>>; bandActivityBySpeaker: SpeakerBandActivityMap; surfaceTone: SurfaceTone }) { const surface = povPalette[surfaceTone]; const stackResolver = createStackResolver(speakers); const blockResolver = createBlockResolver(blocks); return <><ambientLight intensity={surface.ambient} /><directionalLight castShadow position={[-4, 13, 3]} intensity={surface.directional} color={surface.light} shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} /><mesh position={[0, -.08, 0]} receiveShadow><boxGeometry args={[14.04, .16, 8.8]} /><meshStandardMaterial color={surface.edge} roughness={.96} metalness={0} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[14.04, 8.8]} /><meshStandardMaterial color={surface.floor} roughness={.98} metalness={0} /></mesh><ContactShadows position={[0, .012, 0]} opacity={.16} scale={14} blur={2.4} far={3.4} color={surface.shadow} frames={1} />{blocks.map((block) => { const [x, , z] = world(blockResolver.getXY(block)); const dimensions = blockDimensions(block); return <group key={block.id} position={[x, blockResolver.getCenterMeters(block), z]} rotation={[0, block.orientation?.yaw ?? 0, 0]}><mesh castShadow receiveShadow><boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} /><meshStandardMaterial color="#858781" roughness={.93} metalness={0} /></mesh><mesh castShadow receiveShadow position={[0, dimensions.height / 2 + .012, 0]}><boxGeometry args={[dimensions.width * .94, .024, dimensions.depth * .94]} /><meshStandardMaterial color="#969892" roughness={.96} metalness={0} /></mesh></group>; })}{speakers.map((speaker) => <PovSpeaker key={speaker.id} speaker={speaker} activity={activityBySpeaker[speaker.id] ?? 0} bandActivity={bandActivityBySpeaker[speaker.id]} centerY={stackResolver.getCenterMeters(speaker)} xy={stackResolver.getXY(speaker)} />)}</>; }

export default function PovPreview({ speakers, blocks, activityBySpeaker, lowActivityBySpeaker, bandActivityBySpeaker, listener, surfaceTone, onLook, onLookAbsolute }: Props) {
  const dragging = useRef(false); const point = useRef({ x: 0, y: 0 }); const pending = useRef({ yaw: 0, pitch: 0 }); const frame = useRef<number | null>(null); const invalidateRef = useRef<() => void>(() => undefined); const [coarsePointer, setCoarsePointer] = useState(false);
  const deviceLook = useDeviceLook({ listener, onLookAbsolute, onVisualUpdate: () => invalidateRef.current() });
  const bassPressure = calculateBassPressure(speakers, lowActivityBySpeaker, listener); const vibration = vibrationFromPressure(bassPressure);
  useEffect(() => { const media = window.matchMedia("(pointer: coarse)"); const apply = () => setCoarsePointer(media.matches); apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply); }, []);
  const flushLook = () => { frame.current = null; const { yaw, pitch } = pending.current; pending.current = { yaw: 0, pitch: 0 }; if (!yaw && !pitch) return; if (deviceLook.state === "active") deviceLook.adjustCenter(yaw, pitch); else onLook(yaw, pitch); };
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  const surface = povPalette[surfaceTone]; const motionActive = deviceLook.state === "active"; const instruction = motionActive ? "Move your phone to look" : coarsePointer ? "Swipe to look" : "Drag to look around";
  const finishDrag = () => { dragging.current = false; if (frame.current !== null) { cancelAnimationFrame(frame.current); flushLook(); } };
  return <div className={`pov-preview ${motionActive ? "motion-active" : ""}`} onPointerDown={(event) => { dragging.current = true; point.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!dragging.current) return; const bounds = event.currentTarget.getBoundingClientRect(); const delta = swipeLookDelta(event.clientX - point.current.x, event.clientY - point.current.y, bounds.width, bounds.height); pending.current.yaw += delta.yaw; pending.current.pitch += delta.pitch; point.current = { x: event.clientX, y: event.clientY }; if (frame.current === null) frame.current = requestAnimationFrame(flushLook); }} onPointerUp={finishDrag} onPointerCancel={finishDrag} onPointerLeave={finishDrag}><Canvas frameloop="demand" shadows camera={{ fov: 58, position: [0, 1, 1] }} dpr={(coarsePointer ? [1, 1.15] : [1, 1.25]) as [number, number]}><color attach="background" args={[surface.background]} /><CameraRig listener={listener} vibration={vibration} motionPose={deviceLook.poseRef} onInvalidateReady={(invalidate) => { invalidateRef.current = invalidate; }} /><PovWorld speakers={speakers} blocks={blocks} activityBySpeaker={activityBySpeaker} bandActivityBySpeaker={bandActivityBySpeaker} surfaceTone={surfaceTone} /></Canvas><p>{instruction}</p><div className="motion-controls" onPointerDown={(event) => event.stopPropagation()}><button className={`motion-toggle ${motionActive ? "active" : ""}`} onClick={() => { if (motionActive) deviceLook.disable(); else void deviceLook.enable(); }} disabled={deviceLook.state === "requesting"}><span>MOTION</span><b>{motionActive ? "ON" : deviceLook.state === "requesting" ? "…" : "OFF"}</b></button>{motionActive && <button className="motion-recenter" onClick={deviceLook.recenter}>RECENTER</button>}{(deviceLook.state === "denied" || deviceLook.state === "unsupported") && <small role="status">Motion access unavailable</small>}</div></div>;
}
