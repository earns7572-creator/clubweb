/**
 * Side View — a small elevation model of the same ClubScene.
 * Pointer drag edits depth (Y) and height (Z) only; X remains untouched in this projection.
 */
import { useRef } from "react";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";

type Props = { speakers: ClubSpeaker[]; listener: ClubListener; selectedSpeakerId: string; onSpeakerSelect: (id: string) => void; onSpeakerMove: (id: string, position: { y: number; z: number }) => void };
const clamp = (value: number) => Math.max(.04, Math.min(.96, value));

export default function SideScene({ speakers, listener, selectedSpeakerId, onSpeakerSelect, onSpeakerMove }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null); const dragRef = useRef<string | null>(null);
  const update = (event: React.PointerEvent<HTMLDivElement>) => { const id = dragRef.current; const rect = sceneRef.current?.getBoundingClientRect(); if (!id || !rect) return; onSpeakerMove(id, { y: clamp((event.clientX - rect.left) / rect.width), z: clamp(1 - (event.clientY - rect.top) / rect.height) }); };
  return <div ref={sceneRef} className="side-scene" onPointerMove={update} onPointerUp={() => { dragRef.current = null; }} onPointerLeave={() => { dragRef.current = null; }}>
    <div className="side-stage">stage</div><div className="side-floor" /><div className="side-depth">floor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;stage</div>
    {speakers.map((speaker, index) => <button key={speaker.id} className={`side-speaker ${speaker.kind} ${speaker.id === selectedSpeakerId ? "selected" : ""}`} style={{ left: `${speaker.position.y * 88 + 6}%`, bottom: `${speaker.position.z * 74 + 9}%`, marginLeft: `${((index % 3) - 1) * 2}px` }} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); dragRef.current = speaker.id; onSpeakerSelect(speaker.id); sceneRef.current?.setPointerCapture(event.pointerId); }} aria-label={`Move ${speaker.kind} speaker`}><i /><b /></button>)}
    <div className="side-listener" style={{ left: `${listener.position.y * 88 + 6}%`, bottom: `${listener.position.z * 74 + 9}%` }} aria-label="Listener"><i /></div>
  </div>;
}
