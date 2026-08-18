/**
 * Physical Sound System UI: a quiet off-white architectural model with printed speaker objects.
 * This file owns visual material only; all selection, snapping, dragging, and audio callbacks remain unchanged.
 */
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { ContactShadows, Grid, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import type { ClubListener, ClubSpeaker, Position3D, SpeakerKind } from "@/hooks/useClubAudio";

type Point = { x: number; y: number };
type DragTarget = { type: "speaker"; id: string } | { type: "listener" } | null;

type Props = {
  speakers: ClubSpeaker[];
  listener: ClubListener;
  selectedSpeakerId: string;
  sourceColor?: string;
  signalActive?: boolean;
  onSpeakerSelect: (id: string) => void;
  onSpeakerMove: (id: string, position: Point) => void;
  onListenerMove: (position: Point) => void;
};

const roomWidth = 13;
const roomDepth = 8;
const toWorld = (point: Pick<Position3D, "x" | "y">): [number, number, number] => [(point.x - .5) * roomWidth, 0, (point.y - .5) * roomDepth];
const toPoint = (position: THREE.Vector3): Point => ({ x: Math.max(.07, Math.min(.93, position.x / roomWidth + .5)), y: Math.max(.07, Math.min(.93, position.z / roomDepth + .5)) });

const typeStyles: Record<SpeakerKind, { color: string; baffle: string; body: [number, number, number]; drivers: Array<[number, number]>; label: string; horn?: boolean }> = {
  sub: { color: "#343632", baffle: "#242622", body: [1.55, .86, 1.2], drivers: [[0, 0]], label: "SUB" },
  woofer: { color: "#83847d", baffle: "#343631", body: [1.72, .72, .82], drivers: [[-.38, 0], [.38, 0]], label: "WOOFER" },
  full: { color: "#e6e5dd", baffle: "#d7d6ce", body: [.7, 1.78, .74], drivers: [[0, -.37], [0, .38]], label: "FULL" },
  mid: { color: "#aaa9a1", baffle: "#77776f", body: [.7, .74, .66], drivers: [[0, 0]], label: "MID" },
  high: { color: "#c6c4bc", baffle: "#6b6c65", body: [.76, .52, .68], drivers: [[0, 0]], label: "HIGH", horn: true },
};

function Driver({ x, y, depth, size, horn }: { x: number; y: number; depth: number; size: number; horn?: boolean }) {
  if (horn) return <group position={[x, y, depth / 2 + .07]} rotation={[Math.PI / 2, 0, 0]}><mesh><coneGeometry args={[size * 1.35, .28, 4]} /><meshStandardMaterial color="#292b27" roughness={.82} /></mesh><mesh position={[0, -.15, 0]}><cylinderGeometry args={[size * .23, size * .23, .02, 18]} /><meshStandardMaterial color="#090a08" /></mesh></group>;
  return <group position={[x, y, depth / 2 + .05]} rotation={[Math.PI / 2, 0, 0]}><mesh><cylinderGeometry args={[size, size, .08, 24]} /><meshStandardMaterial color="#252823" roughness={.66} metalness={.08} /></mesh><mesh position={[0, 0, .046]}><cylinderGeometry args={[size * .68, size * .68, .014, 24]} /><meshStandardMaterial color="#080a08" roughness={.52} /></mesh><mesh position={[0, 0, .06]}><cylinderGeometry args={[size * .15, size * .15, .018, 20]} /><meshStandardMaterial color="#565950" roughness={.78} /></mesh></group>;
}

function PrintedLayers({ width, height, depth }: { width: number; height: number; depth: number }) {
  return <group position={[0, 0, depth / 2 + .01]}>{Array.from({ length: Math.max(3, Math.floor(height / .16)) }, (_, index) => <mesh key={index} position={[0, -height / 2 + .11 + index * .16, 0]}><boxGeometry args={[width * .92, .012, .014]} /><meshStandardMaterial color="#5a5e56" transparent opacity={.17} /></mesh>)}</group>;
}

function SpeakerObject({ speaker, selected, onSelect, onDragStart, onDragMove, onDragEnd }: { speaker: ClubSpeaker; selected: boolean; onSelect: () => void; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: () => void }) {
  const style = typeStyles[speaker.kind];
  const [width, height, depth] = style.body;
  const [x, , z] = toWorld(speaker.position);
  const driverSize = speaker.kind === "sub" ? .37 : speaker.kind === "woofer" ? .21 : speaker.kind === "high" ? .2 : .18;
  const lift = speaker.position.z * .68;
  return <group position={[x, height / 2 + lift, z]} onPointerDown={(event) => { event.stopPropagation(); onSelect(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(); }}>
    {lift > .02 && <mesh position={[0, -height / 2 - lift / 2, 0]}><boxGeometry args={[.022, lift, .022]} /><meshStandardMaterial color="#696a63" roughness={.9} /></mesh>}
    {selected && <mesh position={[0, -height / 2 - lift + .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(width, depth) * .76, Math.max(width, depth) * .92, 40]} /><meshBasicMaterial color="#d65342" transparent opacity={.65} side={THREE.DoubleSide} /></mesh>}
    <RoundedBox args={[width, height, depth]} radius={.055} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={style.color} roughness={.74} metalness={.05} /></RoundedBox>
    <RoundedBox args={[width * .86, height * .82, .035]} position={[0, 0, depth / 2 + .021]} radius={.026} smoothness={2} castShadow><meshStandardMaterial color={style.baffle} roughness={.83} metalness={.04} /></RoundedBox>
    <PrintedLayers width={width} height={height} depth={depth} />
    {style.drivers.map(([driverX, driverY]) => <Driver key={`${driverX}-${driverY}`} x={driverX} y={driverY} depth={depth} size={driverSize} horn={style.horn} />)}
    <mesh position={[0, -height / 2 - .045, 0]} castShadow><boxGeometry args={[width * 1.08, .09, depth * 1.08]} /><meshStandardMaterial color={style.color} roughness={.78} /></mesh>
    <sprite position={[0, -height / 2 + .13, depth / 2 + .095]} scale={[.45, .11, 1]}><spriteMaterial color="#232620" /></sprite>
  </group>;
}

function ListenerObject({ listener, onDragStart, onDragMove, onDragEnd }: { listener: ClubListener; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: () => void }) {
  const [x, , z] = toWorld(listener.position);
  return <group position={[x, .14, z]} onPointerDown={(event) => { event.stopPropagation(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(); }}>
    <mesh position={[0, -.126, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.68, .695, 48]} /><meshBasicMaterial color="#777870" transparent opacity={.18} side={THREE.DoubleSide} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.28, .34, 32]} /><meshBasicMaterial color="#d65342" transparent opacity={.72} side={THREE.DoubleSide} /></mesh>
    <mesh castShadow><cylinderGeometry args={[.16, .22, .16, 20]} /><meshStandardMaterial color="#44453f" roughness={.64} /></mesh>
    <mesh position={[0, .19, 0]} castShadow><sphereGeometry args={[.115, 18, 16]} /><meshStandardMaterial color="#f3f1e9" roughness={.72} /></mesh>
  </group>;
}

function ResponsiveFloorCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const orthographic = camera as THREE.OrthographicCamera;
    orthographic.position.set(0, 14, 3.2);
    orthographic.zoom = size.width < 760 ? 46 : 92;
    orthographic.lookAt(0, 0, 0);
    orthographic.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
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
  const signalEnd = selected ? toWorld(selected.position) : [0, 0, 0];
  const listenerWorld = toWorld(props.listener.position);
  const sourcePoint = new THREE.Vector3(0, .06, -.7);
  const speakerPoint = new THREE.Vector3(signalEnd[0], .06, signalEnd[2]);
  const listenerPoint = new THREE.Vector3(listenerWorld[0], .06, listenerWorld[2]);

  return <>
    <ambientLight intensity={1.48} />
    <directionalLight castShadow position={[4, 9, 5]} intensity={1.18} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <directionalLight position={[-5, 6, -4]} intensity={.18} color="#e7ded1" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerMove={updateFromEvent} onPointerUp={stopDrag}><planeGeometry args={[roomWidth, roomDepth]} /><meshStandardMaterial color="#e9e8e1" roughness={.98} /></mesh>
    <Grid args={[roomWidth, roomDepth]} cellSize={roomWidth / 12} cellThickness={.48} cellColor="#b3b3ab" sectionSize={roomWidth} sectionThickness={.6} sectionColor="#808178" fadeDistance={30} fadeStrength={.8} position={[0, .012, 0]} />
    <group position={[0, .023, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.026, roomDepth * .92]} /><meshBasicMaterial color="#808179" transparent opacity={.16} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth * .92, .026]} /><meshBasicMaterial color="#808179" transparent opacity={.16} /></mesh></group>
    <group position={[0, .09, -3.3]}><mesh castShadow><boxGeometry args={[1.75, .18, .55]} /><meshStandardMaterial color="#d8d7cf" roughness={.86} /></mesh><mesh position={[0, .095, 0]}><boxGeometry args={[1.45, .014, .34]} /><meshStandardMaterial color="#b1b1a9" roughness={.9} /></mesh>{[-.35, 0, .35].map((x) => <mesh key={x} position={[x, .105, .2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.06, .06, .025, 16]} /><meshStandardMaterial color="#343630" /></mesh>)}</group>
    <mesh position={[0, .02, -.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.35, .37, 36]} /><meshBasicMaterial color={props.sourceColor ?? "#d65342"} transparent opacity={.32} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, .045, -.7]}><sphereGeometry args={[.09, 20, 16]} /><meshStandardMaterial color={props.sourceColor ?? "#d65342"} roughness={.58} /></mesh>
    {selected && props.signalActive && <><mesh><tubeGeometry args={[new THREE.CatmullRomCurve3([sourcePoint, new THREE.Vector3(sourcePoint.x, .08, (sourcePoint.z + speakerPoint.z) / 2), speakerPoint]), 24, .014, 7, false]} /><meshBasicMaterial color="#d65342" transparent opacity={.72} /></mesh><mesh><tubeGeometry args={[new THREE.CatmullRomCurve3([speakerPoint, new THREE.Vector3((speakerPoint.x + listenerPoint.x) / 2, .04, (speakerPoint.z + listenerPoint.z) / 2), listenerPoint]), 24, .011, 6, false]} /><meshBasicMaterial color="#d65342" transparent opacity={.42} /></mesh><mesh position={[speakerPoint.x, .075, speakerPoint.z]}><sphereGeometry args={[.055, 16, 12]} /><meshBasicMaterial color="#d65342" /></mesh></>}
    {props.speakers.map((speaker) => <SpeakerObject key={speaker.id} speaker={speaker} selected={speaker.id === props.selectedSpeakerId} onSelect={() => props.onSpeakerSelect(speaker.id)} onDragStart={() => { drag.current = { type: "speaker", id: speaker.id }; }} onDragMove={updateFromEvent} onDragEnd={stopDrag} />)}
    <ListenerObject listener={props.listener} onDragStart={() => { drag.current = { type: "listener" }; }} onDragMove={updateFromEvent} onDragEnd={stopDrag} />
    <ContactShadows position={[0, .001, 0]} opacity={.34} scale={14} blur={2.8} far={6} />
  </>;
}

export default function ClubFloor3D(props: Props) {
  return <div className="club-floor-3d"><Canvas orthographic shadows camera={{ position: [0, 14, 3.2], zoom: 92 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}><color attach="background" args={["#e9e8e1"]} /><ResponsiveFloorCamera /><RoomScene {...props} /></Canvas><div className="three-room-label north">N / floor axis</div><div className="three-room-label stage">stage reference</div><div className="three-room-label scale">0m&nbsp;&nbsp; 3m&nbsp;&nbsp; 6m</div><div className="three-map-rule" aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</div><div className="three-room-hint">Drag a cabinet or the listener</div></div>;
}
