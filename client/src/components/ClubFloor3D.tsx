/**
 * TOP View / lightweight layout editing: no realtime shadow maps or contact shadows.
 * Floor, grid and cabinet edges provide efficient idle readability; activity lighting remains separate.
 */
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import type { ClubListener, ClubSpeaker, Position3D } from "@/hooks/useClubAudio";
import { SpeakerMiniature, speakerBlueprints } from "@/components/SpeakerMiniature";

type Point = { x: number; y: number };
type DragTarget = { type: "speaker"; id: string } | { type: "listener" } | null;
type Props = { speakers: ClubSpeaker[]; listener: ClubListener; selectedSpeakerId: string; sourceColor?: string; signalActive?: boolean; canRemove: boolean; onSpeakerSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMove: (id: string, position: Point) => void; onListenerMove: (position: Point) => void };

const roomWidth = 13; const roomDepth = 8;
const toWorld = (point: Pick<Position3D, "x" | "y">): [number, number, number] => [(point.x - .5) * roomWidth, 0, (point.y - .5) * roomDepth];
const toPoint = (position: THREE.Vector3): Point => ({ x: Math.max(.07, Math.min(.93, position.x / roomWidth + .5)), y: Math.max(.07, Math.min(.93, position.z / roomDepth + .5)) });
function SpeakerObject({ speaker, selected, canRemove, onRemove, onSelect, onDragStart, onDragMove, onDragEnd }: { speaker: ClubSpeaker; selected: boolean; canRemove: boolean; onRemove: () => void; onSelect: () => void; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: () => void }) {
  const style = speakerBlueprints[speaker.kind]; const [width, height, depth] = style.body; const [x, , z] = toWorld(speaker.position); const lift = speaker.position.z * .68;
  return <group position={[x, height / 2 + lift, z]} onPointerDown={(event) => { event.stopPropagation(); onSelect(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(); }}>
    {lift > .02 && <mesh position={[0, -height / 2 - lift / 2, 0]}><boxGeometry args={[.022, lift, .022]} /><meshStandardMaterial color="#242520" roughness={.9} /></mesh>}
    {selected && <mesh position={[0, -height / 2 - lift + .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(width, depth) * .7, Math.max(width, depth) * .715, 40]} /><meshBasicMaterial color="#c6c3b8" transparent opacity={.15} side={THREE.DoubleSide} /></mesh>}
    {selected && canRemove && <Html position={[width / 2 + .12, height / 2 + .14, depth / 2]} center transform sprite><button className="cabinet-remove" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRemove(); }} aria-label={`Remove ${speaker.kind} speaker`}>×</button></Html>}
    <SpeakerMiniature kind={speaker.kind} activity={speaker.activity} selected={selected} idleVisible />
  </group>;
}

function ListenerObject({ listener, onDragStart, onDragMove, onDragEnd }: { listener: ClubListener; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: () => void }) { const [x, , z] = toWorld(listener.position); return <group position={[x, .14, z]} onPointerDown={(event) => { event.stopPropagation(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(); }}><mesh position={[0, -.126, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.38, .39, 48]} /><meshBasicMaterial color="#a69f91" transparent opacity={.12} side={THREE.DoubleSide} /></mesh><mesh><cylinderGeometry args={[.16, .22, .16, 20]} /><meshStandardMaterial color="#22231f" roughness={.64} /></mesh><mesh position={[0, .19, 0]}><sphereGeometry args={[.115, 18, 16]} /><meshStandardMaterial color="#bbb4a6" emissive="#6d665c" emissiveIntensity={.16} roughness={.72} /></mesh></group>; }

function ResponsiveFloorCamera() { const { camera, size } = useThree(); useEffect(() => { const orthographic = camera as THREE.OrthographicCamera; orthographic.position.set(0, 14, 3.2); orthographic.zoom = size.width < 760 ? 46 : 92; orthographic.lookAt(0, 0, 0); orthographic.updateProjectionMatrix(); }, [camera, size.width]); return null; }

function RoomScene(props: Props) {
  const drag = useRef<DragTarget>(null); const update = (event: ThreeEvent<PointerEvent>) => { if (!drag.current) return; const point = toPoint(event.point); if (drag.current.type === "speaker") props.onSpeakerMove(drag.current.id, point); else props.onListenerMove(point); }; const stop = () => { drag.current = null; };
  return <><ambientLight intensity={.9} /><hemisphereLight args={["#c1bdb0", "#090a08", .74]} /><directionalLight position={[4, 9, 5]} intensity={1.05} color="#ded0ba" /><mesh rotation={[-Math.PI / 2, 0, 0]} onPointerMove={update} onPointerUp={stop}><planeGeometry args={[roomWidth * 1.9, roomDepth * 1.9]} /><meshStandardMaterial color="#282a24" roughness={.98} /></mesh><Grid args={[roomWidth, roomDepth]} cellSize={roomWidth / 12} cellThickness={.15} cellColor="#61635a" sectionSize={roomWidth} sectionThickness={.19} sectionColor="#7a7b70" fadeDistance={30} fadeStrength={1.2} position={[0, .012, 0]} /><group position={[0, .09, -3.3]}><mesh><boxGeometry args={[1.75, .18, .55]} /><meshStandardMaterial color="#3a3c34" roughness={.86} /></mesh><mesh position={[0, .095, 0]}><boxGeometry args={[1.45, .014, .34]} /><meshStandardMaterial color="#969181" roughness={.9} /></mesh></group><mesh position={[0, .02, -.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.22, .227, 36]} /><meshBasicMaterial color={props.signalActive ? "#d64b35" : "#a09f94"} transparent opacity={props.signalActive ? .35 : .35} side={THREE.DoubleSide} /></mesh><mesh position={[0, .045, -.7]}><sphereGeometry args={[.065, 20, 16]} /><meshStandardMaterial color={props.signalActive ? "#d64b35" : "#9b9a8f"} emissive={props.signalActive ? "#8f2e22" : "#3a3b34"} emissiveIntensity={props.signalActive ? .3 : .2} roughness={.62} /></mesh>{props.speakers.map((speaker) => <SpeakerObject key={speaker.id} speaker={speaker} selected={speaker.id === props.selectedSpeakerId} canRemove={props.canRemove} onRemove={() => props.onSpeakerRemove(speaker.id)} onSelect={() => props.onSpeakerSelect(speaker.id)} onDragStart={() => { drag.current = { type: "speaker", id: speaker.id }; }} onDragMove={update} onDragEnd={stop} />)}<ListenerObject listener={props.listener} onDragStart={() => { drag.current = { type: "listener" }; }} onDragMove={update} onDragEnd={stop} /></>;
}

export default function ClubFloor3D(props: Props) { return <div className="club-floor-3d"><Canvas orthographic camera={{ position: [0, 14, 3.2], zoom: 92 }} dpr={[1, 1.25]} gl={{ antialias: true, alpha: true }}><color attach="background" args={["#050606"]} /><ResponsiveFloorCamera /><RoomScene {...props} /></Canvas><div className="spatial-stage-anchor"><i />stage</div><div className="spatial-scale-anchor"><i />0&nbsp;&nbsp;&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;&nbsp;6 m</div></div>; }
