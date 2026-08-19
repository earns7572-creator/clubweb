/** Club Craft CUSTOM — System Response Editor; MIX remains level-only. */
import { SlidersHorizontal, RotateCcw, X } from "lucide-react";
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { type SpeakerEq } from "@/lib/speakerEq";
import SpeakerResponseGraph from "@/components/SpeakerResponseGraph";

type Props = { open: boolean; speakers: ClubSpeaker[]; speaker: ClubSpeaker | undefined; onOpenChange: (open: boolean) => void; onSpeakerSelect: (id: string) => void; onEqChange: (id: string, eq: SpeakerEq) => void; onReset: (id: string) => void };
const labels: Record<ClubSpeaker["kind"], string> = { sub: "SUB", woofer: "WOOFER", full: "FULL RANGE", mid: "MID", high: "HIGH" };
function QControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="response-q-control"><span>{label}<output>Q {value.toFixed(1)}</output></span><input type="range" min={.3} max={8} step={.1} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }

export default function SpeakerCustomPanel({ open, speakers, speaker, onOpenChange, onSpeakerSelect, onEqChange, onReset }: Props) {
  if (!open || !speaker) return null;
  const eq = speaker.eq;
  return <div className="speaker-custom-root"><button className="speaker-custom-backdrop" aria-label="Close custom controls" onClick={() => onOpenChange(false)} /><section className="speaker-custom-sheet" role="dialog" aria-label={`${labels[speaker.kind]} custom EQ`}>
    <header className="speaker-custom-head"><div><span><SlidersHorizontal size={14} /> CUSTOM</span><h2>System Response</h2><p>Type Filter + Custom EQ · level is not shown</p></div><button onClick={() => onOpenChange(false)} aria-label="Close custom controls"><X size={16} /></button></header>
    <SpeakerResponseGraph speakers={speakers} selectedSpeakerId={speaker.id} onSpeakerSelect={onSpeakerSelect} onEqChange={onEqChange} />
    <section className="response-selected-controls"><div><span>SELECTED</span><h3>{speakers.findIndex((item) => item.id === speaker.id) + 1} {labels[speaker.kind]}</h3><p>Drag L / LM / HM / H points to set frequency and gain.</p></div><div className="response-q-controls"><QControl label="LOW MID" value={eq.lowMid.q} onChange={(q) => onEqChange(speaker.id, { ...eq, lowMid: { ...eq.lowMid, q } })} /><QControl label="HIGH MID" value={eq.highMid.q} onChange={(q) => onEqChange(speaker.id, { ...eq, highMid: { ...eq.highMid, q } })} /></div></section>
    <button className="custom-eq-reset" onClick={() => onReset(speaker.id)}><RotateCcw size={14} /> Reset EQ</button>
  </section></div>;
}
