/**
 * POV Preview — listening mode only. The virtual camera begins at Listener.position and pointer drag changes yaw/pitch.
 * It does not edit Speaker positions or introduce game navigation.
 */
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";

type Props = { speakers: ClubSpeaker[]; listener: ClubListener; onLook: (deltaYaw: number, deltaPitch: number) => void };
const body: Record<SpeakerKind, [number, number, number]> = { sub: [1.5, .86, 1.16], woofer: [1.62, .72, .78], full: [.68, 1.76, .72], mid: [.7, .78, .66], high: [.78, .52, .68] };
const color: Record<SpeakerKind, string> = { sub: "#252622", woofer: "#2b2c27", full: "#30312b", mid: "#2a2b26", high: "#2d2e28" };
const world = (position: ClubSpeaker["position"]) => [(position.x - .5) * 13, position.z * 1.2, (position.y - .5) * 8] as const;

function CameraRig({ listener }: { listener: ClubListener }) {
  const { camera } = useThree();
  useEffect(() => { const x = (listener.position.x - .5) * 13; const y = .55 + listener.position.z * 1.1; const z = (listener.position.y - .5) * 8; const { yaw, pitch } = listener.orientation; const forward = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); camera.position.set(x, y, z); camera.lookAt(x + forward.x, y + forward.y, z + forward.z); }, [camera, listener]);
  return null;
}
function PovSpeaker({ speaker }: { speaker: ClubSpeaker }) { const [width, height, depth] = body[speaker.kind]; const [x, lift, z] = world(speaker.position); const driverCount = speaker.kind === "woofer" || speaker.kind === "full" ? 2 : 1; const activity = speaker.activity; return <group position={[x, height / 2 + lift, z]}><pointLight color="#e5c7a5" intensity={activity * 1.7} distance={3.4} decay={2} position={[0, 0, depth / 2 + .5]} /><mesh castShadow receiveShadow><boxGeometry args={[width, height, depth]} /><meshStandardMaterial color={color[speaker.kind]} roughness={.76} emissive="#c6a88a" emissiveIntensity={activity * .16} /></mesh><mesh position={[0, 0, depth / 2 + .018]}><boxGeometry args={[width * .82, height * .78, .035]} /><meshStandardMaterial color="#050604" roughness={.88} /></mesh>{Array.from({ length: driverCount }, (_, index) => <mesh key={index} position={[driverCount === 2 ? (index ? width * .19 : -width * .19) : 0, driverCount === 2 && speaker.kind === "full" ? (index ? height * .2 : -height * .2) : 0, depth / 2 + .05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[speaker.kind === "sub" ? .31 : .16, speaker.kind === "sub" ? .31 : .16, .05, 20]} /><meshStandardMaterial color="#090a08" roughness={.65} emissive="#e1c4a2" emissiveIntensity={activity * .55} /></mesh>)}</group>; }
function PovWorld({ speakers }: { speakers: ClubSpeaker[] }) { return <><fog attach="fog" args={["#050606", 8, 30]} /><ambientLight intensity={.24} /><directionalLight castShadow position={[-4, 8, 3]} intensity={.55} color="#958878" /><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[28, 22]} /><meshStandardMaterial color="#0b0c0b" roughness={.96} /></mesh><mesh position={[0, .12, -3.5]}><boxGeometry args={[1.8, .24, .58]} /><meshStandardMaterial color="#171814" roughness={.86} /></mesh>{speakers.map((speaker) => <PovSpeaker key={speaker.id} speaker={speaker} />)}<gridHelper args={[24, 24, "#1b1c19", "#111210"]} position={[0, .01, 0]} /></>; }

export default function PovPreview({ speakers, listener, onLook }: Props) {
  const dragging = useRef(false); const point = useRef({ x: 0, y: 0 });
  return <div className="pov-preview" onPointerDown={(event) => { dragging.current = true; point.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!dragging.current) return; onLook((event.clientX - point.current.x) * .007, (point.current.y - event.clientY) * .005); point.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={() => { dragging.current = false; }} onPointerLeave={() => { dragging.current = false; }}><Canvas shadows camera={{ fov: 58, position: [0, 1, 1] }} dpr={[1, 1.5]}><color attach="background" args={["#050606"]} /><CameraRig listener={listener} /><PovWorld speakers={speakers} /></Canvas><p>Drag to look around</p></div>;
}
