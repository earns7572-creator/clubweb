/* Club Craft TOP rule: physical stack columns are resolved from data; the drag preview is only a subtle placement affordance. */
/* Club Craft TOP rule: the named Listener avatar remains an easy drag target, while the DJ booth is decorative only. */
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClubListener, ClubSpeaker, Position3D } from "@/hooks/useClubAudio";
import { SpeakerMiniature, speakerBlueprints } from "@/components/SpeakerMiniature";
import { placeWithSmartGuides, type ModifierState, type SmartGuideState, type SmartSnapState, type WorldPoint } from "@/lib/smartPlacement";
import { createStackResolver, findStackCandidate, isWithinStackFootprint, type StackCandidate } from "@/lib/speakerStacking";
import { SimpleHumanAvatar } from "@/components/SimpleHumanAvatar";
import { DjBooth } from "@/components/DjBooth";
import { snapYaw } from "@/lib/speakerOrientation";
import { getSpeakerModel } from "@/lib/speakerModels";
import SoundFieldLayer from "@/components/SoundFieldLayer";

type Point = { x: number; y: number };
type SpeakerDrag = { type: "speaker"; id: string; offset: Point; snap: SmartSnapState; candidateParentId: string | null; lastPoint: Point | null };
type RotationDrag = { type: "rotation"; id: string };
type DragTarget = SpeakerDrag | RotationDrag | { type: "listener"; offset: Point } | null;
type PendingDrag = { raw: Point; modifiers: ModifierState } | null;
export type SurfaceTone = "paper" | "sand" | "slate" | "night";
type Props = { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>>; listener: ClubListener; selectedSpeakerId: string; sourceColor?: string; signalActive?: boolean; surfaceTone: SurfaceTone; canRemove: boolean; onSpeakerSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMove: (id: string, position: Point) => void; onSpeakerRotate?: (id: string, yaw: number) => void; onSpeakerStack: (id: string, parentId: string) => void; onSpeakerDetach: (id: string, position: Point) => void; onListenerMove: (position: Point) => void; onListenerNameChange: (name: string) => void };

const roomWidth = 13;
const roomDepth = 8;
const roomBounds = { minX: .07, maxX: .93, minY: .07, maxY: .93 };
const floorDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragIntersection = new THREE.Vector3();
const guideLineMaterial = new THREE.MeshBasicMaterial({ color: "#d5cbb8", transparent: true, opacity: .24, depthWrite: false });
const guideRingMaterial = new THREE.MeshBasicMaterial({ color: "#d5cbb8", transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide });
const guideRing = new THREE.RingGeometry(.99, 1, 56);
const guideBox = new THREE.BoxGeometry(1, 1, 1);
const surfacePalette: Record<SurfaceTone, { background: string; floor: string; minorGrid: string; majorGrid: string; stage: string; stageTop: string; sky: string; ground: string }> = {
  paper: { background: "#f6f4ee", floor: "#e9e7df", minorGrid: "#d4d2c9", majorGrid: "#aaa9a0", stage: "#706f68", stageTop: "#cbc7ba", sky: "#f4f1e8", ground: "#9e9f98" },
  sand: { background: "#e9e1d4", floor: "#ded4c4", minorGrid: "#cbc0af", majorGrid: "#9d927f", stage: "#6c665c", stageTop: "#c8bda9", sky: "#eee6da", ground: "#a49b8d" },
  slate: { background: "#dde0dd", floor: "#d2d6d2", minorGrid: "#bcc1bc", majorGrid: "#929993", stage: "#616862", stageTop: "#b6bdb6", sky: "#e7eae7", ground: "#8c948d" },
  night: { background: "#050606", floor: "#0b0d0c", minorGrid: "#242824", majorGrid: "#464d46", stage: "#111310", stageTop: "#282d28", sky: "#111511", ground: "#020302" },
};

const toWorld = (point: Pick<Position3D, "x" | "y">): [number, number, number] => [(point.x - .5) * roomWidth, 0, (point.y - .5) * roomDepth];
const toPoint = (position: THREE.Vector3): Point => ({ x: Math.max(roomBounds.minX, Math.min(roomBounds.maxX, position.x / roomWidth + .5)), y: Math.max(roomBounds.minY, Math.min(roomBounds.maxY, position.z / roomDepth + .5)) });
const pointerPointOnFloor = (event: ThreeEvent<PointerEvent>) => event.ray.intersectPlane(floorDragPlane, dragIntersection) ? toPoint(dragIntersection) : null;

function SpeakerObject({ speaker, activity, selected, canRemove, centerY, xy, onRemove, onSelect, onDragStart, onDragMove, onDragEnd, onRotateStart, onRotateMove, onRotateEnd }: { speaker: ClubSpeaker; activity: number; selected: boolean; canRemove: boolean; centerY: number; xy: Point; onRemove: () => void; onSelect: () => void; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: (event: ThreeEvent<PointerEvent>) => void; onRotateStart: (event: ThreeEvent<PointerEvent>) => void; onRotateMove: (event: ThreeEvent<PointerEvent>) => void; onRotateEnd: (event: ThreeEvent<PointerEvent>) => void }) {
  const modelBody = getSpeakerModel(speaker.modelId, speaker.kind).body; const [width, height, depth] = [modelBody.width, modelBody.height, modelBody.depth]; const handleY = height / 2 + .22; const handleZ = depth / 2 + Math.max(.34, depth * .18);
  const [x, , z] = toWorld(xy);
  return <group position={[x, centerY, z]} onPointerDown={(event) => { event.stopPropagation(); onSelect(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(event); }}>
    {selected && <mesh position={[0, -height / 2 + .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(width, depth) * .7, Math.max(width, depth) * .715, 40]} /><meshBasicMaterial color="#c6c3b8" transparent opacity={.15} side={THREE.DoubleSide} /></mesh>}
    {selected && canRemove && <Html position={[width / 2 + .12, height / 2 + .14, depth / 2]} center transform sprite><button className="cabinet-remove" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRemove(); }} aria-label={`Remove ${speaker.kind} speaker`}>×</button></Html>}
    <group rotation={[0, speaker.orientation?.yaw ?? 0, 0]}><SpeakerMiniature kind={speaker.kind} modelId={speaker.modelId} activity={activity} selected={selected} idleVisible />{selected && <group position={[0, handleY, handleZ]} onPointerDown={(event) => { event.stopPropagation(); onRotateStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onRotateMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onRotateEnd(event); }}><mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.46, 32]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.25, .278, 32]} /><meshBasicMaterial color="#c6b48d" transparent opacity={.98} depthWrite={false} side={THREE.DoubleSide} /></mesh><mesh position={[0, -.012, -.29]}><boxGeometry args={[.042, .024, .38]} /><meshBasicMaterial color="#c6b48d" transparent opacity={.98} /></mesh><mesh position={[0, -.012, -.08]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[.105, .17, 3]} /><meshBasicMaterial color="#e7d7ae" transparent opacity={1} /></mesh><Html position={[0, .05, .35]} center sprite pointerEvents="none"><span className="speaker-rotate-label">TURN</span></Html></group>}</group>
  </group>;
}

function ListenerNameTag({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(name);
  useEffect(() => { if (!editing) setDraft(name); }, [editing, name]);
  const commit = () => { onChange(draft.trim().slice(0, 24) || "Listener"); setEditing(false); };
  const cancel = () => { setDraft(name); setEditing(false); };
  return <Html position={[0, 1.63, 0]} center sprite><span className="listener-name-anchor" onPointerDown={(event) => event.stopPropagation()}>{editing ? <input className="listener-name-input" autoFocus value={draft} maxLength={24} aria-label="Listener name" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); } if (event.key === "Escape") { event.preventDefault(); cancel(); } }} onBlur={commit} /> : <button className="listener-name-tag" onClick={() => setEditing(true)} aria-label={`Edit listener name: ${name}`}>{name}</button>}</span></Html>;
}

function ListenerObject({ listener, onNameChange, onDragStart, onDragMove, onDragEnd }: { listener: ClubListener; onNameChange: (name: string) => void; onDragStart: (event: ThreeEvent<PointerEvent>) => void; onDragMove: (event: ThreeEvent<PointerEvent>) => void; onDragEnd: (event: ThreeEvent<PointerEvent>) => void }) {
  const [x, , z] = toWorld(listener.position);
  return <group position={[x, 0, z]} onPointerDown={(event) => { event.stopPropagation(); onDragStart(event); }} onPointerMove={(event) => { event.stopPropagation(); onDragMove(event); }} onPointerUp={(event) => { event.stopPropagation(); onDragEnd(event); }}><mesh position={[0, .015, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.38, .39, 48]} /><meshBasicMaterial color="#a69f91" transparent opacity={.12} side={THREE.DoubleSide} /></mesh><mesh position={[0, .8, 0]}><cylinderGeometry args={[.32, .32, 1.6, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh><group rotation={[0, listener.orientation.yaw, 0]}><SimpleHumanAvatar variant="listener" /></group><ListenerNameTag name={listener.name} onChange={onNameChange} /></group>;
}

function GuideLabel({ point, children }: { point: WorldPoint; children: string }) { const [x, , z] = toWorld(point); return <Html position={[x, .12, z]} center sprite><span className="smart-guide-label">{children}</span></Html>; }
function SmartGuides({ guides, listener }: { guides: SmartGuideState | null; listener: ClubListener }) {
  if (!guides) return null;
  const [listenerX, , listenerZ] = toWorld(listener.position); const distanceGuide = guides.distance; const from = distanceGuide ? toWorld(distanceGuide.from) : null; const to = distanceGuide ? toWorld(distanceGuide.to) : null; const dx = from && to ? to[0] - from[0] : 0; const dz = from && to ? to[2] - from[2] : 0; const length = Math.hypot(dx, dz); const midpoint = distanceGuide ? { x: (distanceGuide.from.x + distanceGuide.to.x) / 2, y: (distanceGuide.from.y + distanceGuide.to.y) / 2 } : null;
  return <group>{guides.x && <mesh geometry={guideBox} position={[(guides.x.value - .5) * roomWidth, .028, 0]} scale={[.015, .008, roomDepth * 1.06]} material={guideLineMaterial} />}{guides.y && <mesh geometry={guideBox} position={[0, .028, (guides.y.value - .5) * roomDepth]} scale={[roomWidth * 1.06, .008, .015]} material={guideLineMaterial} />}{guides.radial && <mesh geometry={guideRing} position={[listenerX, .026, listenerZ]} rotation={[-Math.PI / 2, 0, 0]} scale={[guides.radial.radiusMeters, guides.radial.radiusMeters, 1]} material={guideRingMaterial} />}{from && to && length > .08 && <mesh geometry={guideBox} position={[(from[0] + to[0]) / 2, .032, (from[2] + to[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]} scale={[length, .008, .014]} material={guideLineMaterial} />}{midpoint && distanceGuide && <GuideLabel point={midpoint}>{`${distanceGuide.equal ? "=" : ""}${distanceGuide.meters.toFixed(1)} m`}</GuideLabel>}{guides.radial && <GuideLabel point={{ x: listener.position.x + guides.radial.radiusMeters / roomWidth, y: listener.position.y }}>same distance</GuideLabel>}</group>;
}
function StackPreview({ candidate, dragged, resolver }: { candidate: StackCandidate | null; dragged: ClubSpeaker | undefined; resolver: ReturnType<typeof createStackResolver> }) {
  if (!candidate || !dragged) return null;
  const parent = resolver.byId.get(candidate.parentId); if (!parent) return null;
  const [width, height, depth] = speakerBlueprints[dragged.kind].body; const [x, , z] = toWorld(resolver.getXY(parent)); const centerY = resolver.getBottomMeters(parent) + speakerBlueprints[parent.kind].body[1] + height / 2;
  return <group position={[x, centerY, z]}><mesh><boxGeometry args={[width, height, depth]} /><meshBasicMaterial color="#b8aa91" transparent opacity={.12} wireframe /></mesh><Html position={[0, height / 2 + .14, 0]} center sprite><span className="smart-guide-label">STACK</span></Html></group>;
}
function ResponsiveFloorCamera() { const { camera, size, invalidate } = useThree(); useEffect(() => { const orthographic = camera as THREE.OrthographicCamera; orthographic.position.set(0, 14, 3.2); orthographic.zoom = size.width < 760 ? 46 : 92; orthographic.lookAt(0, 0, 0); orthographic.updateProjectionMatrix(); invalidate(); }, [camera, invalidate, size.width]); return null; }

function RoomScene(props: Props) {
  const { camera, size, invalidate } = useThree(); const drag = useRef<DragTarget>(null); const pending = useRef<PendingDrag>(null); const frame = useRef<number | null>(null); const [guides, setGuides] = useState<SmartGuideState | null>(null); const [stackCandidate, setStackCandidate] = useState<StackCandidate | null>(null); const stackResolver = useMemo(() => createStackResolver(props.speakers), [props.speakers]); const surface = surfacePalette[props.surfaceTone];
  const pointerTarget = (event: ThreeEvent<PointerEvent>) => event.target as (EventTarget & { setPointerCapture?: (pointerId: number) => void; releasePointerCapture?: (pointerId: number) => void }) | null;
  const worldPerPixel = () => { const orthographic = camera as THREE.OrthographicCamera; return Math.abs(orthographic.right - orthographic.left) / Math.max(1, orthographic.zoom) / Math.max(1, size.width); };
  const applyPending = () => {
    frame.current = null; const active = drag.current; const movement = pending.current; pending.current = null; if (!active || !movement) return;
    if (active.type === "rotation") { const speaker = stackResolver.byId.get(active.id); if (!speaker) return; const xy = stackResolver.getXY(speaker); const yaw = movement.modifiers.shift ? snapYaw(Math.atan2(movement.raw.x - xy.x, movement.raw.y - xy.y)) : Math.atan2(movement.raw.x - xy.x, movement.raw.y - xy.y); if (props.onSpeakerRotate) props.onSpeakerRotate(active.id, yaw); else window.dispatchEvent(new CustomEvent("club-craft:speaker-rotate", { detail: { id: active.id, yaw } })); invalidate(); return; }
    const raw = { x: movement.raw.x + active.offset.x, y: movement.raw.y + active.offset.y };
    if (active.type === "listener") { setGuides(null); props.onListenerMove({ x: Math.max(roomBounds.minX, Math.min(roomBounds.maxX, raw.x)), y: Math.max(roomBounds.minY, Math.min(roomBounds.maxY, raw.y)) }); invalidate(); return; }
    const dragged = stackResolver.byId.get(active.id); if (!dragged) return; active.lastPoint = raw;
    const currentParent = dragged.stackParentId ? stackResolver.byId.get(dragged.stackParentId) : undefined;
    const candidate = currentParent && isWithinStackFootprint(currentParent, raw, props.speakers) ? { parentId: currentParent.id, score: 0 } : findStackCandidate({ dragged, point: raw, speakers: props.speakers, previousParentId: active.candidateParentId });
    active.candidateParentId = candidate?.parentId ?? null; setStackCandidate(candidate);
    if (candidate) { setGuides(null); invalidate(); return; }
    const pixelWorld = worldPerPixel(); const result = placeWithSmartGuides({ raw, draggedId: active.id, speakers: props.speakers.map((speaker) => ({ id: speaker.id, point: stackResolver.getXY(speaker) })), listener: { x: props.listener.position.x, y: props.listener.position.y }, bounds: roomBounds, scale: { x: roomWidth, y: roomDepth }, enter: { x: pixelWorld * 8 / roomWidth, y: pixelWorld * 8 / roomDepth }, release: { x: pixelWorld * 13 / roomWidth, y: pixelWorld * 13 / roomDepth }, radialEnterMeters: pixelWorld * 8, radialReleaseMeters: pixelWorld * 13, modifiers: movement.modifiers, previous: active.snap });
    active.snap = result.snap; setGuides(result.guides); if (dragged.stackParentId) props.onSpeakerDetach(active.id, result.point); else props.onSpeakerMove(active.id, result.point); invalidate();
  };
  const queue = () => { if (frame.current === null) frame.current = requestAnimationFrame(applyPending); };
  const start = (target: DragTarget, event: ThreeEvent<PointerEvent>) => { pointerTarget(event)?.setPointerCapture?.(event.pointerId); pending.current = null; setGuides(null); setStackCandidate(null); drag.current = target; invalidate(); };
  const move = (event: ThreeEvent<PointerEvent>) => { if (!drag.current) return; const point = pointerPointOnFloor(event); if (!point) return; pending.current = { raw: point, modifiers: { alt: event.nativeEvent.altKey, shift: event.nativeEvent.shiftKey } }; queue(); };
  const stop = (event: ThreeEvent<PointerEvent>) => { if (frame.current !== null) { cancelAnimationFrame(frame.current); applyPending(); } const active = drag.current; if (active?.type === "speaker") { const dragged = stackResolver.byId.get(active.id); if (active.candidateParentId && active.candidateParentId !== dragged?.stackParentId) props.onSpeakerStack(active.id, active.candidateParentId); else if (!active.candidateParentId && dragged?.stackParentId && active.lastPoint) props.onSpeakerDetach(active.id, active.lastPoint); } pointerTarget(event)?.releasePointerCapture?.(event.pointerId); pending.current = null; drag.current = null; setGuides(null); setStackCandidate(null); invalidate(); };
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  const activeSpeaker = drag.current?.type === "speaker" ? stackResolver.byId.get(drag.current.id) : undefined;
  return <><ambientLight intensity={1.08} /><hemisphereLight args={[surface.sky, surface.ground, .82]} /><directionalLight position={[4, 9, 5]} intensity={1.12} color="#fffaf0" /><mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={() => props.onSpeakerSelect("")} onPointerMove={move} onPointerUp={stop}><planeGeometry args={[roomWidth * 1.9, roomDepth * 1.9]} /><meshStandardMaterial color={surface.floor} roughness={.98} /></mesh><SoundFieldLayer speakers={props.speakers} activityBySpeaker={props.activityBySpeaker} roomWidth={roomWidth} roomDepth={roomDepth} hazeColor={surface.majorGrid} /><Grid args={[roomWidth, roomDepth]} cellSize={.5} cellThickness={.07} cellColor={surface.minorGrid} sectionSize={1} sectionThickness={.13} sectionColor={surface.majorGrid} fadeDistance={30} fadeStrength={1.2} position={[0, .012, 0]} /><group position={[0, .05, -3.3]}><DjBooth active={Boolean(props.signalActive)} tone={props.surfaceTone} /></group><mesh position={[0, .02, -.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.22, .227, 36]} /><meshBasicMaterial color={props.signalActive ? "#d64b35" : "#8a8982"} transparent opacity={.35} side={THREE.DoubleSide} /></mesh><mesh position={[0, .045, -.7]}><sphereGeometry args={[.065, 20, 16]} /><meshStandardMaterial color={props.signalActive ? "#d64b35" : "#777770"} emissive={props.signalActive ? "#8f2e22" : "#393a35"} emissiveIntensity={props.signalActive ? .3 : .2} roughness={.62} /></mesh><SmartGuides guides={guides} listener={props.listener} /><StackPreview candidate={stackCandidate} dragged={activeSpeaker} resolver={stackResolver} />{props.speakers.map((speaker) => <SpeakerObject key={speaker.id} speaker={speaker} activity={props.activityBySpeaker[speaker.id] ?? 0} selected={speaker.id === props.selectedSpeakerId} canRemove={props.canRemove} centerY={stackResolver.getCenterMeters(speaker)} xy={stackResolver.getXY(speaker)} onRemove={() => props.onSpeakerRemove(speaker.id)} onSelect={() => props.onSpeakerSelect(speaker.id)} onDragStart={(event) => { const point = pointerPointOnFloor(event); if (!point) return; const xy = stackResolver.getXY(speaker); start({ type: "speaker", id: speaker.id, offset: { x: xy.x - point.x, y: xy.y - point.y }, snap: {}, candidateParentId: null, lastPoint: null }, event); }} onDragMove={move} onDragEnd={stop} onRotateStart={(event) => start({ type: "rotation", id: speaker.id }, event)} onRotateMove={move} onRotateEnd={stop} />)}<ListenerObject listener={props.listener} onNameChange={props.onListenerNameChange} onDragStart={(event) => { const point = pointerPointOnFloor(event); if (!point) return; start({ type: "listener", offset: { x: props.listener.position.x - point.x, y: props.listener.position.y - point.y } }, event); }} onDragMove={move} onDragEnd={stop} /></>;
}

export default function ClubFloor3D(props: Props) { const surface = surfacePalette[props.surfaceTone]; return <div className="club-floor-3d"><Canvas frameloop="demand" orthographic camera={{ position: [0, 14, 3.2], zoom: 92 }} dpr={[1, 1.25]} gl={{ antialias: true, alpha: true }}><color attach="background" args={[surface.background]} /><ResponsiveFloorCamera /><RoomScene {...props} /></Canvas><div className="spatial-stage-anchor"><i />stage</div><div className="spatial-scale-anchor"><i />0&nbsp;&nbsp;&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;&nbsp;6 m</div></div>; }
