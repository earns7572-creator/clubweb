/**
 * Side View — a small elevation model of the same ClubScene.
 * Pointer drag edits depth (Y) and height (Z) only; X remains untouched in this projection.
 */
import { useEffect, useRef } from "react";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";

type Props = { speakers: ClubSpeaker[]; activityBySpeaker: Readonly<Record<string, number>>; listener: ClubListener; selectedSpeakerId: string; canRemove: boolean; onSpeakerSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMove: (id: string, position: { y: number; z: number }) => void };
const clamp = (value: number) => Math.max(.04, Math.min(.96, value));

export default function SideScene({ speakers, activityBySpeaker, listener, selectedSpeakerId, canRemove, onSpeakerSelect, onSpeakerRemove, onSpeakerMove }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null); const dragRef = useRef<string | null>(null); const rectRef = useRef<DOMRect | null>(null); const pendingRef = useRef<{ x: number; y: number } | null>(null); const frameRef = useRef<number | null>(null);
  const flush = () => { frameRef.current = null; const id = dragRef.current; const rect = rectRef.current; const point = pendingRef.current; pendingRef.current = null; if (!id || !rect || !point) return; onSpeakerMove(id, { y: clamp((point.x - rect.left) / rect.width), z: clamp(1 - (point.y - rect.top) / rect.height) }); };
  const update = (event: React.PointerEvent<HTMLDivElement>) => { if (!dragRef.current || !rectRef.current) return; pendingRef.current = { x: event.clientX, y: event.clientY }; if (frameRef.current === null) frameRef.current = requestAnimationFrame(flush); };
  const stop = () => { if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); flush(); } dragRef.current = null; rectRef.current = null; pendingRef.current = null; };
  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); }, []);
  return <div ref={sceneRef} className="side-scene" onPointerMove={update} onPointerUp={stop} onPointerLeave={stop}>
    <div className="side-stage">stage</div><div className="side-floor" /><div className="side-depth">floor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stage</div>
    {speakers.map((speaker, index) => <div key={speaker.id} className={`side-speaker ${speaker.kind} ${speaker.id === selectedSpeakerId ? "selected" : ""}`} style={{ left: `${speaker.position.y * 88 + 6}%`, bottom: `${speaker.position.z * 74 + 9}%`, marginLeft: `${((index % 3) - 1) * 2}px`, "--activity": activityBySpeaker[speaker.id] ?? 0 } as React.CSSProperties}><button className="side-speaker-drag" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); dragRef.current = speaker.id; rectRef.current = sceneRef.current?.getBoundingClientRect() ?? null; onSpeakerSelect(speaker.id); sceneRef.current?.setPointerCapture(event.pointerId); }} aria-label={`Move ${speaker.kind} speaker`}><i /><b /></button>{speaker.id === selectedSpeakerId && canRemove && <button className="side-cabinet-remove" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSpeakerRemove(speaker.id); }} aria-label={`Remove ${speaker.kind} speaker`}>×</button>}</div>)}
    <div className="side-listener" style={{ left: `${listener.position.y * 88 + 6}%`, bottom: `${listener.position.z * 74 + 9}%` }} aria-label="Listener"><i /></div>
  </div>;
}
