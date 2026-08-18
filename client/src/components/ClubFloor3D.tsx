/**
 * Physical Sound System UI: a quiet off-white architectural model with printed speaker objects.
 * This file owns visual material only; all selection, snapping, dragging, and audio callbacks remain unchanged.
 */
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import type { ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";

type Point = { x: number; y: number };
type DragTarget = { type: "speaker"; id: string } | { type: "listener" } | null;

type Props = {
  speakers: ClubSpeaker[];
  listener: Point;
  selectedSpeakerId: string;
  sourceColor?: string;
  onSpeakerSelect: (id: string) => void;
  onSpeakerMove: (id: string, position: Point) => void;
  onListenerMove: (position: Point) => void;
};

const roomWidth = 10;
const roomDepth = 8;
const toWorld = (point: Point): [number, number, number] => [(point.x - .5) * roomWidth, 0, (point.y - .5) * roomDepth];
const toPoint = (position: THREE.Vector3): Point => ({ x: Math.max(.07, Math.min(.93, position.x / roomWidth + .5)), y: Math.max(.07, Math.min(.93, position.z / roomDepth + .5)) });

const typeStyles: Record<SpeakerKind, { color: string; baffle: string; body: [number, number, number]; drivers: number[]; label: string; horn?: boolean }> = {
  sub: { color: "#343632", baffle: "#242622", body: [1.45, 1.02, 1.15], drivers: [0], label: "SUB" },
  woofer: { color: "#83847d", baffle: "#343631", body: [1.58, .82, .78], drivers: [-.42, .42], label: "WOOFER" },
  full: { color: "#e6e5dd", baffle: "#d7d6ce", body: [.72, 1.72, .72], drivers: [-.36, .36], label: "FULL" },
  mid: { color: "#aaa9a1", baffle: "#77776f", body: [.62, 1.18, .62], drivers: [0], label: "MID" },
  high: { color: "#c6c4bc", baffle: "#6b6c65", body: [.72, .7, .62], drivers: [0], label: "HIGH", horn: true },
};

function Driver({ y, depth, size, horn }: { y: number; depth: number; size: number; horn?: boolean }) {
  if (horn) return <group position={[0, y, depth / 2 + .07]} rotation={[Math.PI / 2, 0, 0]}><mesh><coneGeometry args={[size * 1.25, .26, 4]} /><meshStandardMaterial color="#292b27" roughness={.82} /></mesh><mesh position={[0, -.14, 0]}><cylinderGeometry args={[size * .25, size * .25, .02, 18]} /><meshStandardMaterial color="#090a08" /></mesh></group>;
  return <group position={[0, y, depth / 2 + .05]} rotation={[Math.PI / 2, 0, 0]}><mesh><cylinderGeometry args={[size, size, .08, 24]} /><meshStandardMaterial color="#252823" roughness={.66} metalness={.08} /></mesh><mesh position={[0, 0, .046]}><cylinderGeometry args={[size * .68, size * .68, .014, 24]} /><meshStandardMaterial color="#080a08" roughness={.52} /></mesh><mesh position={[0, 0, .06]}><cylinderGeometry args={[size * .15, size * .15, .018, 20]} /><meshStandardMaterial color="#565950" roughness={.78} /></mesh></group>;
}

function PrintedLayers({ width, height, depth }: { width: number; height: number; depth: number }) {
  return <group position={[0, 0, depth / 2 + .01]}>{Array.from({ length: Math.max(3, Math.floor(height / .16)) }, (_, index) => <mesh key={index} position={[0, -height / 2 + .11 + index * .16, 0]}><boxGeometry args={[width * .92, .012, .014]} /><meshStandardMaterial color="#5a5e56" transparent opacity={.17} /></mesh>)}</group>;
}

function SpeakerObject({ speaker, selected, onSelect, onDragStart, onDragMove, onDragEnd }: { speaker: ClubSpeaker; selected: boolean; onSelect: () => void; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: () => void }) {
  const style = typeStyles[speaker.kind];
  const [width, height, depth] = style.body;
  const [x, , z] = toWorld(speaker);
  const driverSize = speaker.kind === "sub" ? .36 : speaker.kind === "woofer" ? .22 : .18;
  return <group position={[x, height / 2, z]} onPointerDown={(event) => { event.stopPropagation(); onSelect(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(); }}>
    {selected && <mesh position={[0, -height / 2 + .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(width, depth) * .76, Math.max(width, depth) * .92, 40]} /><meshBasicMaterial color="#d65342" transparent opacity={.65} side={THREE.DoubleSide} /></mesh>}
    <RoundedBox args={[width, height, depth]} radius={.055} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={style.color} roughness={.74} metalness={.05} /></RoundedBox>
    <RoundedBox args={[width * .86, height * .82, .035]} position={[0, 0, depth / 2 + .021]} radius={.026} smoothness={2} castShadow><meshStandardMaterial color={style.baffle} roughness={.83} metalness={.04} /></RoundedBox>
    <PrintedLayers width={width} height={height} depth={depth} />
    {style.drivers.map((driverY) => <Driver key={driverY} y={driverY} depth={depth} size={driverSize} horn={style.horn} />)}
    <mesh position={[0, -height / 2 - .045, 0]} castShadow><boxGeometry args={[width * 1.08, .09, depth * 1.08]} /><meshStandardMaterial color={style.color} roughness={.78} /></mesh>
    <sprite position={[0, -height / 2 + .13, depth / 2 + .095]} scale={[.45, .11, 1]}><spriteMaterial color="#232620" /></sprite>
  </group>;
}

function ListenerObject({ listener, onDragStart, onDragMove, onDragEnd }: { listener: Point; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: () => void }) {
  const [x, , z] = toWorld(listener);
  return <group position={[x, .14, z]} onPointerDown={(event) => { event.stopPropagation(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(); }}>
    {[.72, 1.45, 2.18].map((radius, index) => <mesh key={radius} position={[0, -.126, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius - .012, radius + .012, 48]} /><meshBasicMaterial color={index === 0 ? "#d65342" : "#74766d"} transparent opacity={index === 0 ? .32 : .22} side={THREE.DoubleSide} /></mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.35, .42, 32]} /><meshBasicMaterial color="#d65342" transparent opacity={.8} side={THREE.DoubleSide} /></mesh>
    <mesh castShadow><cylinderGeometry args={[.19, .25, .2, 20]} /><meshStandardMaterial color="#d65342" roughness={.52} /></mesh>
    <mesh position={[0, .25, 0]} castShadow><sphereGeometry args={[.13, 18, 16]} /><meshStandardMaterial color="#f9f0e6" roughness={.68} /></mesh>
  </group>;
}

function RoomScene(props: Props) {
  const drag = useRef<DragTarget>(null);
  const updateFromEvent = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    const point = toPoint(event.point);
    if (drag.current.type === "speaker") props.onSpeakerMove(drag.current.id, point);
    else props.onListenerMove(point);
  };
  const stopDrag = () => { drag.current = null; };
  const selected = props.speakers.find((speaker) => speaker.id === props.selectedSpeakerId);
  const signalEnd = selected ? toWorld(selected) : [0, 0, 0];
  const listenerWorld = toWorld(props.listener);
  const sourcePoint = new THREE.Vector3(0, .06, -.7);
  const speakerPoint = new THREE.Vector3(signalEnd[0], .06, signalEnd[2]);
  const listenerPoint = new THREE.Vector3(listenerWorld[0], .06, listenerWorld[2]);

  return <>
    <ambientLight intensity={1.45} />
    <directionalLight castShadow position={[4, 8, 5]} intensity={1.35} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <directionalLight position={[-5, 4, -5]} intensity={.26} color="#e7ded1" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerMove={updateFromEvent} onPointerUp={stopDrag}><planeGeometry args={[roomWidth, roomDepth]} /><meshStandardMaterial color="#e7e6df" roughness={.96} /></mesh>
    <Grid args={[roomWidth, roomDepth]} cellSize={roomWidth / 12} cellThickness={.32} cellColor="#b7b7af" sectionSize={roomWidth} sectionThickness={.48} sectionColor="#74756f" fadeDistance={18} fadeStrength={1.3} position={[0, .012, 0]} />
    <group position={[0, .023, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.035, roomDepth * .92]} /><meshBasicMaterial color="#74756f" transparent opacity={.22} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth * .92, .035]} /><meshBasicMaterial color="#74756f" transparent opacity={.22} /></mesh></group>
    <mesh position={[0, 1.12, -roomDepth / 2]} receiveShadow><boxGeometry args={[roomWidth, 2.2, .18]} /><meshStandardMaterial color="#a4a39c" roughness={.93} /></mesh>
    <mesh position={[-roomWidth / 2, .82, 0]} rotation={[0, 0, -.12]}><boxGeometry args={[.2, 1.65, roomDepth]} /><meshStandardMaterial color="#b8b7b0" roughness={.94} /></mesh>
    <mesh position={[roomWidth / 2, .82, 0]} rotation={[0, 0, .12]}><boxGeometry args={[.2, 1.65, roomDepth]} /><meshStandardMaterial color="#b8b7b0" roughness={.94} /></mesh>
    <group position={[0, .23, -3.05]}><mesh castShadow><boxGeometry args={[1.9, .45, .68]} /><meshStandardMaterial color="#e0dfd7" roughness={.78} /></mesh>{[-.35, 0, .35].map((x) => <mesh key={x} position={[x, .02, .37]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.09, .09, .04, 16]} /><meshStandardMaterial color="#242622" /></mesh>)}</group>
    <mesh position={[0, .02, -.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.64, .67, 36]} /><meshBasicMaterial color={props.sourceColor ?? "#d65342"} transparent opacity={.46} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, .06, -.7]}><sphereGeometry args={[.12, 20, 16]} /><meshStandardMaterial color={props.sourceColor ?? "#d65342"} emissive={props.sourceColor ?? "#d65342"} emissiveIntensity={.22} /></mesh>
    {selected && <><mesh><tubeGeometry args={[new THREE.CatmullRomCurve3([sourcePoint, new THREE.Vector3(sourcePoint.x, .08, (sourcePoint.z + speakerPoint.z) / 2), speakerPoint]), 24, .022, 7, false]} /><meshBasicMaterial color="#d65342" transparent opacity={.86} /></mesh><mesh><tubeGeometry args={[new THREE.CatmullRomCurve3([speakerPoint, new THREE.Vector3((speakerPoint.x + listenerPoint.x) / 2, .04, (speakerPoint.z + listenerPoint.z) / 2), listenerPoint]), 24, .017, 6, false]} /><meshBasicMaterial color="#d65342" transparent opacity={.58} /></mesh><mesh position={[speakerPoint.x, .075, speakerPoint.z]}><sphereGeometry args={[.075, 16, 12]} /><meshBasicMaterial color="#d65342" /></mesh></>}
    {props.speakers.map((speaker) => <SpeakerObject key={speaker.id} speaker={speaker} selected={speaker.id === props.selectedSpeakerId} onSelect={() => props.onSpeakerSelect(speaker.id)} onDragStart={() => { drag.current = { type: "speaker", id: speaker.id }; }} onDragMove={updateFromEvent} onDragEnd={stopDrag} />)}
    <ListenerObject listener={props.listener} onDragStart={() => { drag.current = { type: "listener" }; }} onDragMove={updateFromEvent} onDragEnd={stopDrag} />
    <ContactShadows position={[0, .001, 0]} opacity={.34} scale={14} blur={2.8} far={6} />
    <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} target={[0, 0, -.3]} />
  </>;
}

export default function ClubFloor3D(props: Props) {
  return <div className="club-floor-3d"><Canvas shadows camera={{ position: [0, 10.5, 7.2], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}><color attach="background" args={["#e7e6df"]} /><RoomScene {...props} /></Canvas><div className="three-room-label north">N / ROOM AXIS</div><div className="three-room-label stage">STAGE / 0</div><div className="three-room-label scale">0M&nbsp;&nbsp; 3M&nbsp;&nbsp; 6M</div><div className="three-map-rule" aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</div><div className="three-room-hint">GRAB A CABINET · SPEAKERS SNAP TO GRID · MOVE ◎ YOU</div></div>;
}
