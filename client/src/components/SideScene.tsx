/*
 * Club Craft SIDE rule — the named Listener is a CSS human silhouette; the booth remains a non-interactive scene object.
 * Pointer drag edits depth (Y) and height (Z) only; X remains untouched in this projection.
 */
import { useEffect, useRef } from "react";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";
import { SCENE_VERTICAL_METERS, speakerBodyForSpeaker } from "@/lib/speakerDimensions";
import { createStackResolver, STACK_ROOM_METERS } from "@/lib/speakerStacking";

type Props = { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>>; listener: ClubListener; selectedSpeakerId: string; canRemove: boolean; onSpeakerSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMove: (id: string, position: { y: number; z: number }) => void };
const clamp = (value: number) => Math.max(.04, Math.min(.96, value));

export default function SideScene({ speakers, activityBySpeaker, listener, selectedSpeakerId, canRemove, onSpeakerSelect, onSpeakerRemove, onSpeakerMove }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null); const dragRef = useRef<string | null>(null); const rectRef = useRef<DOMRect | null>(null); const pendingRef = useRef<{ x: number; y: number } | null>(null); const frameRef = useRef<number | null>(null); const stackResolver = createStackResolver(speakers);
  const flush = () => { frameRef.current = null; const id = dragRef.current; const rect = rectRef.current; const point = pendingRef.current; pendingRef.current = null; if (!id || !rect || !point) return; onSpeakerMove(id, { y: clamp((point.x - rect.left) / rect.width), z: clamp(1 - (point.y - rect.top) / rect.height) }); };
  const update = (event: React.PointerEvent<HTMLDivElement>) => { if (!dragRef.current || !rectRef.current) return; pendingRef.current = { x: event.clientX, y: event.clientY }; if (frameRef.current === null) frameRef.current = requestAnimationFrame(flush); };
  const stop = () => { if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); flush(); } dragRef.current = null; rectRef.current = null; pendingRef.current = null; };
  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); }, []);
  return <div ref={sceneRef} className="side-scene" onPointerMove={update} onPointerUp={stop} onPointerLeave={stop}>
    <div className="side-stage">stage</div><div className="side-floor" /><div className="side-depth">floor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stage</div><div className="side-dj-booth" aria-hidden="true"><i className="side-dj-table" /><span className="side-dj-human"><b className="side-human-head" /><b className="side-human-body" /><b className="side-human-leg side-human-leg-left" /><b className="side-human-leg side-human-leg-right" /></span></div>
    {speakers.map((speaker, index) => { const stacked = Boolean(speaker.stackParentId); const xy = stackResolver.getXY(speaker); const centerMeters = stackResolver.getCenterMeters(speaker); const body = speakerBodyForSpeaker(speaker); return <div key={speaker.id} className={`side-speaker ${speaker.kind} ${speaker.id === selectedSpeakerId ? "selected" : ""} ${stacked ? "stacked" : ""}`} style={{ left: `${xy.y * 88 + 6}%`, bottom: `${centerMeters / SCENE_VERTICAL_METERS * 74 + 9}%`, width: `${body.depth / STACK_ROOM_METERS.depth * 88}%`, height: `${body.height / SCENE_VERTICAL_METERS * 74}%`, marginLeft: `${((index % 3) - 1) * 2}px`, "--activity": activityBySpeaker[speaker.id] ?? 0 } as React.CSSProperties}><button className="side-speaker-drag" disabled={stacked} onPointerDown={(event) => { if (stacked) return; event.preventDefault(); event.stopPropagation(); dragRef.current = speaker.id; rectRef.current = sceneRef.current?.getBoundingClientRect() ?? null; onSpeakerSelect(speaker.id); sceneRef.current?.setPointerCapture(event.pointerId); }} aria-label={`Move ${speaker.kind} speaker`}><i /><b /></button>{speaker.id === selectedSpeakerId && canRemove && <button className="side-cabinet-remove" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSpeakerRemove(speaker.id); }} aria-label={`Remove ${speaker.kind} speaker`}>×</button>}</div>; })}
    <div className="side-listener" style={{ left: `${listener.position.y * 88 + 6}%`, bottom: `${listener.position.z * 74 + 9}%` }} aria-label={`${listener.name}, listener position`}><span className="side-listener-name">{listener.name}</span><i className="side-human-head" /><i className="side-human-body" /><i className="side-human-leg side-human-leg-left" /><i className="side-human-leg side-human-leg-right" /></div>
  </div>;
}
