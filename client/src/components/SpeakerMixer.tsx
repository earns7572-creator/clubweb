/**
 * Club Craft Mixer — a quiet bottom-sheet projection of existing Speaker level/muted state.
 * It adds no AudioNode, preserves the dark-club hierarchy, and keeps activity subscription local.
 */
import { memo, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { useSpeakerActivity, type ActivityStore } from "@/lib/activityStore";
import { MIXER_MAX_DB, MIXER_MIN_DB, dbToFaderPosition, faderPositionToDb, formatDb, linearToDb } from "@/lib/mixerMath";

type LevelPatch = Record<string, number>;
type SpeakerMixerProps = {
  open: boolean;
  speakers: ClubSpeaker[];
  selectedSpeakerId: string;
  activityStore: ActivityStore;
  onOpenChange: (open: boolean) => void;
  onSpeakerSelect: (id: string) => void;
  onLevelsChange: (levels: LevelPatch) => void;
  onMutedChange: (id: string, muted: boolean) => void;
};

const typeLabel: Record<ClubSpeaker["kind"], string> = { sub: "SUB", woofer: "WOOFER", full: "FULL", mid: "MID", high: "HIGH" };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function ActivityMeter({ speakerId, store }: { speakerId: string; store: ActivityStore }) {
  const activity = useSpeakerActivity(store)[speakerId] ?? 0;
  return <div className="mixer-meter" aria-label="Activity meter"><i style={{ transform: `scaleY(${Math.max(.025, activity)})`, opacity: .2 + activity * .8 }} /></div>;
}

const SpeakerFader = memo(function SpeakerFader({ speaker, index, selected, linked, activityStore, onSelect, onLevelsChange, onMutedChange }: { speaker: ClubSpeaker; index: number; selected: boolean; linked: boolean; activityStore: ActivityStore; onSelect: (shiftKey: boolean) => void; onLevelsChange: (speakerId: string, nextLevel: number) => void; onMutedChange: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const latestYRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const pointerRef = useRef<number | null>(null);
  const position = dbToFaderPosition(linearToDb(speaker.level));
  const applyLatest = () => {
    rafRef.current = 0;
    const y = latestYRef.current;
    const track = trackRef.current;
    if (y === null || !track) return;
    const rect = track.getBoundingClientRect();
    const nextPosition = clamp((rect.bottom - y) / rect.height, 0, 1);
    onLevelsChange(speaker.id, Math.pow(10, faderPositionToDb(nextPosition) / 20));
  };
  const schedule = (clientY: number) => { latestYRef.current = clientY; if (!rafRef.current) rafRef.current = requestAnimationFrame(applyLatest); };
  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current === event.pointerId) {
      schedule(event.clientY);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); applyLatest(); }
      pointerRef.current = null;
    }
  };
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  return <article className={`mixer-strip ${selected ? "is-selected" : ""} ${linked ? "is-linked" : ""}`} onClick={(event) => onSelect(event.shiftKey)}>
    <button className="mixer-strip-heading" onClick={(event) => { event.stopPropagation(); onSelect(event.shiftKey); }}><strong>{String(index + 1).padStart(2, "0")} {typeLabel[speaker.kind]}</strong><span>LEVEL / ACTIVITY</span></button>
    <div className="mixer-channel-core">
      <ActivityMeter speakerId={speaker.id} store={activityStore} />
      <div className="mixer-fader-wrap">
        <div ref={trackRef} className="mixer-fader-track" role="slider" aria-label={`${typeLabel[speaker.kind]} ${speaker.id} level`} aria-valuemin={MIXER_MIN_DB} aria-valuemax={MIXER_MAX_DB} aria-valuenow={linearToDb(speaker.level)} tabIndex={0} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onSelect(event.shiftKey); pointerRef.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); schedule(event.clientY); }} onPointerMove={(event) => { if (pointerRef.current === event.pointerId) schedule(event.clientY); }} onPointerUp={finish} onPointerCancel={finish} onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); onLevelsChange(speaker.id, 1); }}>
          <i className="mixer-fader-fill" style={{ height: `${position * 100}%` }} />
          <b className="mixer-fader-handle" style={{ bottom: `${position * 100}%` }} />
        </div>
      </div>
    </div>
    <output className="mixer-db" aria-live="off">{formatDb(speaker.level)}</output>
    <button className={`mixer-mute ${speaker.muted ? "is-muted" : ""}`} onClick={(event) => { event.stopPropagation(); onMutedChange(); }}>{speaker.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}<span>{speaker.muted ? "Muted" : "Mute"}</span></button>
  </article>;
});

export default function SpeakerMixer({ open, speakers, selectedSpeakerId, activityStore, onOpenChange, onSpeakerSelect, onLevelsChange, onMutedChange }: SpeakerMixerProps) {
  const [linkedSpeakerIds, setLinkedSpeakerIds] = useState<Set<string>>(() => new Set());
  const linkedSpeakerIdsRef = useRef(linkedSpeakerIds);
  useEffect(() => { linkedSpeakerIdsRef.current = linkedSpeakerIds; }, [linkedSpeakerIds]);
  useEffect(() => { if (!open) { const next = new Set<string>(); linkedSpeakerIdsRef.current = next; setLinkedSpeakerIds(next); } }, [open]);
  const chooseSpeaker = (id: string, shiftKey: boolean) => {
    onSpeakerSelect(id);
    setLinkedSpeakerIds((current) => {
      if (!shiftKey) { const next = new Set([id]); linkedSpeakerIdsRef.current = next; return next; }
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      linkedSpeakerIdsRef.current = next;
      return next;
    });
  };
  const applyFader = (id: string, nextLevel: number) => {
    const linkedIds = linkedSpeakerIdsRef.current;
    const linked = linkedIds.has(id) && linkedIds.size > 1 ? speakers.filter((speaker) => linkedIds.has(speaker.id)) : [speakers.find((speaker) => speaker.id === id)].filter(Boolean) as ClubSpeaker[];
    const source = speakers.find((speaker) => speaker.id === id);
    if (!source) return;
    const deltaDb = linearToDb(nextLevel) - linearToDb(source.level);
    const patch: LevelPatch = {};
    linked.forEach((speaker) => { patch[speaker.id] = Math.pow(10, clamp(linearToDb(speaker.level) + deltaDb, MIXER_MIN_DB, MIXER_MAX_DB) / 20); });
    onLevelsChange(patch);
  };
  if (!open) return null;
  return <div className="speaker-mixer-root"><button className="speaker-mixer-backdrop" aria-label="Close mixer" onClick={() => onOpenChange(false)} /><section className="speaker-mixer-sheet" role="dialog" aria-label="Speaker mixer">
    <div className="speaker-mixer-head"><div><h2>Speaker Mix</h2><p>Level balance · select strips · Shift links faders</p></div><button className="speaker-mixer-close" onClick={() => onOpenChange(false)} aria-label="Close mixer"><X size={16} /></button></div>
    <div className="speaker-mixer-bank" aria-label="Speaker mixer channels">{speakers.map((speaker, index) => <SpeakerFader key={speaker.id} speaker={speaker} index={index} selected={selectedSpeakerId === speaker.id} linked={linkedSpeakerIds.has(speaker.id)} activityStore={activityStore} onSelect={(shiftKey) => chooseSpeaker(speaker.id, shiftKey)} onLevelsChange={applyFader} onMutedChange={() => onMutedChange(speaker.id, !speaker.muted)} />)}</div>
    <p className="speaker-mixer-note">Drag for level · double-click returns one channel to 0 dB · Shift selects a linked balance group</p>
  </section></div>;
}
