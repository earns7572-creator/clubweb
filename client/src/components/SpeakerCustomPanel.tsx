/** Club Craft CUSTOM — a restrained per-Speaker EQ sheet; MIX remains level-only. */
import { SlidersHorizontal, RotateCcw, X } from "lucide-react";
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { EQ_RANGES, formatFrequency, frequencyToPosition, positionToFrequency, type SpeakerEq } from "@/lib/speakerEq";

type Props = { open: boolean; speaker: ClubSpeaker | undefined; onOpenChange: (open: boolean) => void; onEqChange: (id: string, eq: SpeakerEq) => void; onReset: (id: string) => void };
const labels: Record<ClubSpeaker["kind"], string> = { sub: "SUB", woofer: "WOOFER", full: "FULL RANGE", mid: "MID", high: "HIGH" };

function Range({ label, value, min, max, step = .01, onChange, output }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; output: string }) {
  return <label className="custom-eq-control"><span>{label}<output>{output}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
function Frequency({ label, value, range, onChange }: { label: string; value: number; range: readonly [number, number]; onChange: (value: number) => void }) {
  return <Range label={label} value={frequencyToPosition(value, range[0], range[1])} min={0} max={1} step={.001} output={formatFrequency(value)} onChange={(position) => onChange(positionToFrequency(position, range[0], range[1]))} />;
}
function Gain({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <Range label="Gain" value={value} min={-12} max={12} step={.1} output={`${value >= 0 ? "+" : ""}${value.toFixed(1)} dB`} onChange={onChange} />; }

export default function SpeakerCustomPanel({ open, speaker, onOpenChange, onEqChange, onReset }: Props) {
  if (!open || !speaker) return null;
  const patch = (next: SpeakerEq) => onEqChange(speaker.id, next);
  const eq = speaker.eq;
  return <div className="speaker-custom-root"><button className="speaker-custom-backdrop" aria-label="Close custom controls" onClick={() => onOpenChange(false)} /><section className="speaker-custom-sheet" role="dialog" aria-label={`${labels[speaker.kind]} custom EQ`}>
    <header className="speaker-custom-head"><div><span><SlidersHorizontal size={14} /> CUSTOM</span><h2>{labels[speaker.kind]}</h2><p>Speaker EQ · MIX controls level separately</p></div><button onClick={() => onOpenChange(false)} aria-label="Close custom controls"><X size={16} /></button></header>
    <div className="speaker-custom-bands">
      <section className="custom-eq-band"><h3>LOW <small>Shelf</small></h3><Frequency label="Frequency" value={eq.low.frequency} range={EQ_RANGES.low.frequency} onChange={(frequency) => patch({ ...eq, low: { ...eq.low, frequency } })} /><Gain value={eq.low.gainDb} onChange={(gainDb) => patch({ ...eq, low: { ...eq.low, gainDb } })} /></section>
      <section className="custom-eq-band"><h3>LOW MID <small>Peak</small></h3><Frequency label="Frequency" value={eq.lowMid.frequency} range={EQ_RANGES.lowMid.frequency} onChange={(frequency) => patch({ ...eq, lowMid: { ...eq.lowMid, frequency } })} /><Gain value={eq.lowMid.gainDb} onChange={(gainDb) => patch({ ...eq, lowMid: { ...eq.lowMid, gainDb } })} /><Range label="Q" value={eq.lowMid.q} min={.3} max={8} step={.1} output={eq.lowMid.q.toFixed(1)} onChange={(q) => patch({ ...eq, lowMid: { ...eq.lowMid, q } })} /></section>
      <section className="custom-eq-band"><h3>HIGH MID <small>Peak</small></h3><Frequency label="Frequency" value={eq.highMid.frequency} range={EQ_RANGES.highMid.frequency} onChange={(frequency) => patch({ ...eq, highMid: { ...eq.highMid, frequency } })} /><Gain value={eq.highMid.gainDb} onChange={(gainDb) => patch({ ...eq, highMid: { ...eq.highMid, gainDb } })} /><Range label="Q" value={eq.highMid.q} min={.3} max={8} step={.1} output={eq.highMid.q.toFixed(1)} onChange={(q) => patch({ ...eq, highMid: { ...eq.highMid, q } })} /></section>
      <section className="custom-eq-band"><h3>HIGH <small>Shelf</small></h3><Frequency label="Frequency" value={eq.high.frequency} range={EQ_RANGES.high.frequency} onChange={(frequency) => patch({ ...eq, high: { ...eq.high, frequency } })} /><Gain value={eq.high.gainDb} onChange={(gainDb) => patch({ ...eq, high: { ...eq.high, gainDb } })} /></section>
    </div>
    <button className="custom-eq-reset" onClick={() => onReset(speaker.id)}><RotateCcw size={14} /> Reset EQ</button>
  </section></div>;
}
