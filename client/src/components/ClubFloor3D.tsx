/**
 * TOP View / continuous spatial placement: fixed drag plane, soft guide assistance,
 * no shadow maps or realtime spatial effects. Grid guides the eye, never hard-locks motion.
 */
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import type { ClubListener, ClubSpeaker, Position3D } from "@/hooks/useClubAudio";
import { SpeakerMiniature, speakerBlueprints } from "@/components/SpeakerMiniature";
import { placeWithSmartGuides, type ModifierState, type SmartGuideState, type SmartSnapState, type WorldPoint } from "@/lib/smartPlacement";

type Point = { x: number; y: number };
type DragTarget = { type: "speaker"; id: string; offset: Point; snap: SmartSnapState } | { type: "listener"; offset: Point } | null;
type PendingDrag = { raw: Point; modifiers: ModifierState } | null;
type Props = { speakers: ClubSpeaker[]; listener: ClubListener; selectedSpeakerId: string; sourceColor?: string; signalActive?: boolean; canRemove: boolean; onSpeakerSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMove: (id: string, position: Point) => void; onListenerMove: (position: Point) => void };

const roomWidth = 13;
const roomDepth = 8;
const roomBounds = { minX: .07, maxX: .93, minY: .07, maxY: .93 };
const floorDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragIntersection = new THREE.Vector3();
const guideLineMaterial = new THREE.MeshBasicMaterial({ color: "#d5cbb8", transparent: true, opacity: .24, depthWrite: false });
const guideRingMaterial = new THREE.MeshBasicMaterial({ color: "#d5cbb8", transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide });
const guideRing = new THREE.RingGeometry(.99, 1, 56);
const guideBox = new THREE.BoxGeometry(1, 1, 1);

const toWorld = (point: Pick<Position3D, "x" | "y">): [number, number, number] => [(point.x - .5) * roomWidth, 0, (point.y - .5) * roomDepth];
const toPoint = (position: THREE.Vector3): Point => ({ x: Math.max(roomBounds.minX, Math.min(roomBounds.maxX, position.x / roomWidth + .5)), y: Math.max(roomBounds.minY, Math.min(roomBounds.maxY, position.z / roomDepth + .5)) });
const pointerPointOnFloor = (event: ThreeEvent<PointerEvent>) => event.ray.intersectPlane(floorDragPlane, dragIntersection) ? toPoint(dragIntersection) : null;

function SpeakerObject({ speaker, selected, canRemove, onRemove, onSelect, onDragStart, onDragMove, onDragEnd }: { speaker: ClubSpeaker; selected: boolean; canRemove: boolean; onRemove: () => void; onSelect: () => void; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: (event: ThreeEvent<PointerEvent>) => void }) {
  const [width, height, depth] = speakerBlueprints[speaker.kind].body; const [x, , z] = toWorld(speaker.position); const lift = speaker.position.z * .68;
  return <group position={[x, height / 2 + lift, z]} onPointerDown={(event) => { event.stopPropagation(); onSelect(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(event); }}>
    {lift > .02 && <mesh position={[0, -height / 2 - lift / 2, 0]}><boxGeometry args={[.022, lift, .022]} /><meshStandardMaterial color="#242520" roughness={.9} /></mesh>}
    {selected && <mesh position={[0, -height / 2 - lift + .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(width, depth) * .7, Math.max(width, depth) * .715, 40]} /><meshBasicMaterial color="#c6c3b8" transparent opacity={.15} side={THREE.DoubleSide} /></mesh>}
    {selected && canRemove && <Html position={[width / 2 + .12, height / 2 + .14, depth / 2]} center transform sprite><button className="cabinet-remove" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRemove(); }} aria-label={`Remove ${speaker.kind} speaker`}>×</button></Html>}
    <SpeakerMiniature kind={speaker.kind} activity={speaker.activity} selected={selected} idleVisible />
  </group>;
}

function ListenerObject({ listener, onDragStart, onDragMove, onDragEnd }: { listener: ClubListener; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: (event: ThreeEvent<PointerEvent>) => void }) { const [x, , z] = toWorld(listener.position); return <group position={[x, .14, z]} onPointerDown={(event) => { event.stopPropagation(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(event); }}><mesh position={[0, -.126, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.38, .39, 48]} /><meshBasicMaterial color="#a69f91" transparent opacity={.12} side={THREE.DoubleSide} /></mesh><mesh><cylinderGeometry args={[.16, .22, .16, 20]} /><meshStandardMaterial color="#22231f" roughness={.64} /></mesh><mesh position={[0, .19, 0]}><sphereGeometry args={[.115, 18, 16]} /><meshStandardMaterial color="#bbb4a6" emissive="#6d665c" emissiveIntensity={.16} roughness={.72} /></mesh></group>; }

function GuideLabel({ point, children }: { point: WorldPoint; children: string }) { const [x, , z] = toWorld(point); return <Html position={[x, .12, z]} center sprite><span className="smart-guide-label">{children}</span></Html>; }

function SmartGuides({ guides, listener }: { guides: SmartGuideState | null; listener: ClubListener }) {
  if (!guides) return null;
  const [listenerX, , listenerZ] = toWorld(listener.position);
  const distanceGuide = guides.distance;
  const from = distanceGuide ? toWorld(distanceGuide.from) : null;
  const to = distanceGuide ? toWorld(distanceGuide.to) : null;
  const dx = from && to ? to[0] - from[0] : 0;
  const dz = from && to ? to[2] - from[2] : 0;
  const length = Math.hypot(dx, dz);
  const midpoint = distanceGuide ? { x: (distanceGuide.from.x + distanceGuide.to.x) / 2, y: (distanceGuide.from.y + distanceGuide.to.y) / 2 } : null;
  return <group>
    {guides.x && <mesh geometry={guideBox} position={[(guides.x.value - .5) * roomWidth, .028, 0]} scale={[.015, .008, roomDepth * 1.06]} material={guideLineMaterial} />}
    {guides.y && <mesh geometry={guideBox} position={[0, .028, (guides.y.value - .5) * roomDepth]} scale={[roomWidth * 1.06, .008, .015]} material={guideLineMaterial} />}
    {guides.radial && <mesh geometry={guideRing} position={[listenerX, .026, listenerZ]} rotation={[-Math.PI / 2, 0, 0]} scale={[guides.radial.radiusMeters, guides.radial.radiusMeters, 1]} material={guideRingMaterial} />}
    {from && to && length > .08 && <mesh geometry={guideBox} position={[(from[0] + to[0]) / 2, .032, (from[2] + to[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]} scale={[length, .008, .014]} material={guideLineMaterial} />}
    {midpoint && distanceGuide && <GuideLabel point={midpoint}>{`${distanceGuide.equal ? "=" : ""}${distanceGuide.meters.toFixed(1)} m`}</GuideLabel>}
    {guides.radial && <GuideLabel point={{ x: listener.position.x + guides.radial.radiusMeters / roomWidth, y: listener.position.y }}>{"same distance"}</GuideLabel>}
  </group>;
}

function ResponsiveFloorCamera() { const { camera, size } = useThree(); useEffect(() => { const orthographic = camera as THREE.OrthographicCamera; orthographic.position.set(0, 14, 3.2); orthographic.zoom = size.width < 760 ? 46 : 92; orthographic.lookAt(0, 0, 0); orthographic.updateProjectionMatrix(); }, [camera, size.width]); return null; }

function RoomScene(props: Props) {
  const { camera, size } = useThree(); const drag = useRef<DragTarget>(null); const pending = useRef<PendingDrag>(null); const frame = useRef<number | null>(null); const [guides, setGuides] = useState<SmartGuideState | null>(null);
  const pointerTarget = (event: ThreeEvent<PointerEvent>) => event.target as (EventTarget & { setPointerCapture?: (pointerId: number) => void; releasePointerCapture?: (pointerId: number) => void }) | null;
  const worldPerPixel = () => { const orthographic = camera as THREE.OrthographicCamera; const width = Math.abs(orthographic.right - orthographic.left) / Math.max(1, orthographic.zoom); return width / Math.max(1, size.width); };
  const applyPending = () => {
    frame.current = null; const active = drag.current; const movement = pending.current; pending.current = null; if (!active || !movement) return;
    const raw = { x: movement.raw.x + active.offset.x, y: movement.raw.y + active.offset.y };
    if (active.type === "listener") { setGuides(null); props.onListenerMove({ x: Math.max(roomBounds.minX, Math.min(roomBounds.maxX, raw.x)), y: Math.max(roomBounds.minY, Math.min(roomBounds.maxY, raw.y)) }); return; }
    const pixelWorld = worldPerPixel();
    const result = placeWithSmartGuides({ raw, draggedId: active.id, speakers: props.speakers.map((speaker) => ({ id: speaker.id, point: { x: speaker.position.x, y: speaker.position.y } })), listener: { x: props.listener.position.x, y: props.listener.position.y }, bounds: roomBounds, scale: { x: roomWidth, y: roomDepth }, enter: { x: pixelWorld * 8 / roomWidth, y: pixelWorld * 8 / roomDepth }, release: { x: pixelWorld * 13 / roomWidth, y: pixelWorld * 13 / roomDepth }, radialEnterMeters: pixelWorld * 8, radialReleaseMeters: pixelWorld * 13, modifiers: movement.modifiers, previous: active.snap });
    active.snap = result.snap; setGuides(result.guides); props.onSpeakerMove(active.id, result.point);
  };
  const queue = () => { if (frame.current === null) frame.current = requestAnimationFrame(applyPending); };
  const start = (target: DragTarget, event: ThreeEvent<PointerEvent>) => { pointerTarget(event)?.setPointerCapture?.(event.pointerId); pending.current = null; setGuides(null); drag.current = target; };
  const move = (event: ThreeEvent<PointerEvent>) => { if (!drag.current) return; const point = pointerPointOnFloor(event); if (!point) return; pending.current = { raw: point, modifiers: { alt: event.nativeEvent.altKey, shift: event.nativeEvent.shiftKey } }; queue(); };
  const stop = (event: ThreeEvent<PointerEvent>) => { if (frame.current !== null) { cancelAnimationFrame(frame.current); applyPending(); } pointerTarget(event)?.releasePointerCapture?.(event.pointerId); pending.current = null; drag.current = null; setGuides(null); };
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  return <><ambientLight intensity={.9} /><hemisphereLight args={["#c1bdb0", "#090a08", .74]} /><directionalLight position={[4, 9, 5]} intensity={1.05} color="#ded0ba" /><mesh rotation={[-Math.PI / 2, 0, 0]} onPointerMove={move} onPointerUp={stop}><planeGeometry args={[roomWidth * 1.9, roomDepth * 1.9]} /><meshStandardMaterial color="#282a24" roughness={.98} /></mesh><Grid args={[roomWidth, roomDepth]} cellSize={.5} cellThickness={.07} cellColor="#383a34" sectionSize={1} sectionThickness={.13} sectionColor="#6f7068" fadeDistance={30} fadeStrength={1.2} position={[0, .012, 0]} /><group position={[0, .09, -3.3]}><mesh><boxGeometry args={[1.75, .18, .55]} /><meshStandardMaterial color="#3a3c34" roughness={.86} /></mesh><mesh position={[0, .095, 0]}><boxGeometry args={[1.45, .014, .34]} /><meshStandardMaterial color="#969181" roughness={.9} /></mesh></group><mesh position={[0, .02, -.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.22, .227, 36]} /><meshBasicMaterial color={props.signalActive ? "#d64b35" : "#a09f94"} transparent opacity={.35} side={THREE.DoubleSide} /></mesh><mesh position={[0, .045, -.7]}><sphereGeometry args={[.065, 20, 16]} /><meshStandardMaterial color={props.signalActive ? "#d64b35" : "#9b9a8f"} emissive={props.signalActive ? "#8f2e22" : "#3a3b34"} emissiveIntensity={props.signalActive ? .3 : .2} roughness={.62} /></mesh><SmartGuides guides={guides} listener={props.listener} />{props.speakers.map((speaker) => <SpeakerObject key={speaker.id} speaker={speaker} selected={speaker.id === props.selectedSpeakerId} canRemove={props.canRemove} onRemove={() => props.onSpeakerRemove(speaker.id)} onSelect={() => props.onSpeakerSelect(speaker.id)} onDragStart={(event) => { const point = pointerPointOnFloor(event); if (!point) return; start({ type: "speaker", id: speaker.id, offset: { x: speaker.position.x - point.x, y: speaker.position.y - point.y }, snap: {} }, event); }} onDragMove={move} onDragEnd={stop} />)}<ListenerObject listener={props.listener} onDragStart={(event) => { const point = pointerPointOnFloor(event); if (!point) return; start({ type: "listener", offset: { x: props.listener.position.x - point.x, y: props.listener.position.y - point.y } }, event); }} onDragMove={move} onDragEnd={stop} /></>;
}

export default function ClubFloor3D(props: Props) { return <div className="club-floor-3d"><Canvas orthographic camera={{ position: [0, 14, 3.2], zoom: 92 }} dpr={[1, 1.25]} gl={{ antialias: true, alpha: true }}><color attach="background" args={["#050606"]} /><ResponsiveFloorCamera /><RoomScene {...props} /></Canvas><div className="spatial-stage-anchor"><i />stage</div><div className="spatial-scale-anchor"><i />0&nbsp;&nbsp;&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;&nbsp;6 m</div></div>; }
