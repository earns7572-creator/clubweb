/**
 * POV Preview — listening mode only. The virtual camera begins at Listener.position and pointer drag changes yaw/pitch.
 * It does not edit Speaker positions or introduce game navigation.
 */
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";
import { SpeakerMiniature, speakerBlueprints } from "@/components/SpeakerMiniature";

type Props = { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>>; listener: ClubListener; onLook: (deltaYaw: number, deltaPitch: number) => void };
const world = (position: ClubSpeaker["position"]) => [(position.x - .5) * 13, position.z * 1.2, (position.y - .5) * 8] as const;

function CameraRig({ listener }: { listener: ClubListener }) {
  const { camera, invalidate } = useThree();
  useEffect(() => { const x = (listener.position.x - .5) * 13; const y = .55 + listener.position.z * 1.1; const z = (listener.position.y - .5) * 8; const { yaw, pitch } = listener.orientation; const forward = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); camera.position.set(x, y, z); camera.lookAt(x + forward.x, y + forward.y, z + forward.z); invalidate(); }, [camera, invalidate, listener]);
  return null;
}
function PovSpeaker({ speaker, activity }: { speaker: ClubSpeaker; activity: number }) { const [, height] = speakerBlueprints[speaker.kind].body; const [x, lift, z] = world(speaker.position); return <group position={[x, height / 2 + lift, z]}><SpeakerMiniature kind={speaker.kind} activity={activity} /></group>; }
function PovWorld({ speakers, activityBySpeaker }: { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>> }) { return <><fog attach="fog" args={["#050606", 8, 30]} /><ambientLight intensity={.24} /><directionalLight position={[-4, 8, 3]} intensity={.55} color="#958878" /><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[28, 22]} /><meshStandardMaterial color="#0b0c0b" roughness={.96} /></mesh><mesh position={[0, .12, -3.5]}><boxGeometry args={[1.8, .24, .58]} /><meshStandardMaterial color="#171814" roughness={.86} /></mesh>{speakers.map((speaker) => <PovSpeaker key={speaker.id} speaker={speaker} activity={activityBySpeaker[speaker.id] ?? 0} />)}<gridHelper args={[24, 24, "#1b1c19", "#111210"]} position={[0, .01, 0]} /></>; }

export default function PovPreview({ speakers, activityBySpeaker, listener, onLook }: Props) {
  const dragging = useRef(false); const point = useRef({ x: 0, y: 0 }); const pending = useRef({ yaw: 0, pitch: 0 }); const frame = useRef<number | null>(null);
  const flushLook = () => { frame.current = null; const { yaw, pitch } = pending.current; pending.current = { yaw: 0, pitch: 0 }; if (yaw || pitch) onLook(yaw, pitch); };
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  return <div className="pov-preview" onPointerDown={(event) => { dragging.current = true; point.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!dragging.current) return; pending.current.yaw += (event.clientX - point.current.x) * .007; pending.current.pitch += (point.current.y - event.clientY) * .005; point.current = { x: event.clientX, y: event.clientY }; if (frame.current === null) frame.current = requestAnimationFrame(flushLook); }} onPointerUp={() => { dragging.current = false; if (frame.current !== null) { cancelAnimationFrame(frame.current); flushLook(); } }} onPointerLeave={() => { dragging.current = false; }}><Canvas frameloop="demand" camera={{ fov: 58, position: [0, 1, 1] }} dpr={[1, 1.25]}><color attach="background" args={["#050606"]} /><CameraRig listener={listener} /><PovWorld speakers={speakers} activityBySpeaker={activityBySpeaker} /></Canvas><p>Drag to look around</p></div>;
}
