/**
 * Floor-Centric Virtual Sound System: current audio, snapping, dragging and Speaker controls remain intact.
 * This page only changes the visual shell into a single interactive floor with a source popover and floating inspector.
 */
import { useRef, useState } from "react";
import { ChevronDown, CircleHelp, Headphones, Music2, Pause, Play, Plus, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { type ClubSource, type ClubSpeaker, type SpeakerKind, useClubAudio } from "@/hooks/useClubAudio";
import ClubFloor3D from "@/components/ClubFloor3D";
import "../club-floor-3d.css";
import "../floor-instrument.css";

const logoMark = "/manus-storage/clubcraft-mark_066a01b1.png";
const speakerMeta: Record<SpeakerKind, { label: string; short: string; color: string; note: string }> = {
  sub: { label: "SUB", short: "S", color: "#2b2d2b", note: "low, heavy cabinet" },
  woofer: { label: "WOOFER", short: "W", color: "#6f726d", note: "mid cabinet" },
  full: { label: "FULL RANGE", short: "F", color: "#f1f0e9", note: "tall cabinet" },
  mid: { label: "MID", short: "M", color: "#a3a39a", note: "compact cabinet" },
  high: { label: "HIGH", short: "H", color: "#c6c4bc", note: "small horn cabinet" },
};
const initialSpeakers: ClubSpeaker[] = [
  { id: "sub-1", kind: "sub", label: "SUB", x: .1667, y: .75, level: .78, muted: false },
  { id: "full-1", kind: "full", label: "FULL RANGE", x: .3333, y: .3333, level: .72, muted: false },
  { id: "full-2", kind: "full", label: "FULL RANGE", x: .6667, y: .3333, level: .72, muted: false },
  { id: "high-1", kind: "high", label: "HIGH", x: .8333, y: .6667, level: .6, muted: false },
];
const clubTracks: ClubSource[] = [
  { id: "pulse", name: "Deep Pulse", category: "official", color: "#e65b4a" },
  { id: "rain", name: "Rain Room", category: "official", color: "#d6aa43" },
  { id: "bronze", name: "Bronze Air", category: "official", color: "#4bbd92" },
];
const GRID_STEPS = 12;
const clamp = (value: number) => Math.max(.07, Math.min(.93, value));
const snapToGrid = (value: number) => clamp(Math.round(value * GRID_STEPS) / GRID_STEPS);
const gridSpawnPoints = [{ x: .5, y: .5 }, { x: .4167, y: .5 }, { x: .5833, y: .5 }, { x: .5, y: .5833 }, { x: .5, y: .4167 }];

export default function Home() {
  const [speakers, setSpeakers] = useState<ClubSpeaker[]>(initialSpeakers);
  const [listener, setListener] = useState({ x: .5, y: .72 });
  const [sources, setSources] = useState<ClubSource[]>(clubTracks);
  const [selectedSourceId, setSelectedSourceId] = useState("pulse");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("full-1");
  const [showHelp, setShowHelp] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPlaying, togglePlayback } = useClubAudio(speakers, listener, sources, selectedSourceId);
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0];
  const selectedSpeaker = speakers.find((speaker) => speaker.id === selectedSpeakerId) ?? speakers[0];

  const moveSpeakerToGrid = (id: string, position: { x: number; y: number }) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, x: snapToGrid(position.x), y: snapToGrid(position.y) } : speaker));
  const addSpeaker = (kind: SpeakerKind) => {
    const id = `${kind}-${Date.now()}`;
    setSpeakers((now) => [...now, { id, kind, label: speakerMeta[kind].label, x: gridSpawnPoints[now.length % gridSpawnPoints.length].x, y: gridSpawnPoints[now.length % gridSpawnPoints.length].y, level: .68, muted: false }]);
    setSelectedSpeakerId(id);
  };
  const addLocalSound = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const id = `local-${Date.now()}`;
    setSources((now) => [...now, { id, name: file.name.replace(/\.[^/.]+$/, ""), category: "local", color: "#797a73", localUrl: URL.createObjectURL(file) }]);
    setSelectedSourceId(id);
    setShowSourcePicker(false);
    event.target.value = "";
  };
  const updateSpeaker = (update: Partial<ClubSpeaker>) => {
    if (!selectedSpeaker) return;
    setSpeakers((now) => now.map((speaker) => speaker.id === selectedSpeaker.id ? { ...speaker, ...update, label: update.kind ? speakerMeta[update.kind].label : speaker.label } : speaker));
  };
  const removeSelected = () => {
    if (!selectedSpeaker || speakers.length <= 1) return;
    setSpeakers((now) => now.filter((speaker) => speaker.id !== selectedSpeaker.id));
    setSelectedSpeakerId(speakers.find((speaker) => speaker.id !== selectedSpeaker.id)?.id ?? "");
  };
  const chooseSource = (id: string) => { setSelectedSourceId(id); setShowSourcePicker(false); };

  return <main className="instrument-app">
    <header className="instrument-header">
      <div className="instrument-brand"><img src={logoMark} alt="Club Craft" /><span className="brand-word"><b>CLUB</b><em>CRAFT</em></span><small>spatial sound</small></div>
      <div className="source-trigger-wrap">
        <button className="source-trigger" onClick={() => setShowSourcePicker((open) => !open)} aria-haspopup="dialog" aria-expanded={showSourcePicker}><i style={{ backgroundColor: selectedSource?.color }} /><span>{selectedSource?.name ?? "Choose a sound"}</span><ChevronDown size={14} /></button>
        {showSourcePicker && <section className="source-popover" role="dialog" aria-label="Choose a sound"><p className="source-popover-label">CLUB CRAFT PICKS</p>{sources.map((source) => <button key={source.id} className={`source-choice ${source.id === selectedSourceId ? "active" : ""}`} onClick={() => chooseSource(source.id)}><i style={{ backgroundColor: source.color }} /><span><strong>{source.name}</strong><small>{source.category === "local" ? "YOUR FILE" : "CLUB CRAFT PICK"}</small></span><Music2 size={13} /></button>)}<button className="source-upload" onClick={() => fileInputRef.current?.click()}><Plus size={14} /> UPLOAD AUDIO</button><p className="source-private"><Headphones size={12} /> Your file stays on this device.</p></section>}
        <input ref={fileInputRef} className="hidden-input" type="file" accept="audio/*" onChange={addLocalSound} />
      </div>
      <div className="instrument-actions"><button className="instrument-help" onClick={() => setShowHelp(true)} aria-label="How to play"><CircleHelp size={16} /></button><button className="instrument-play" onClick={() => void togglePlayback()}>{isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{isPlaying ? "PAUSE" : "PLAY"}</button></div>
    </header>

    <section className="instrument-stage">
      <h1 className="instrument-title">Move a speaker. Hear the room change.</h1><p className="instrument-subtitle">Place cabinets on the floor and find your listening position.</p>
      <ClubFloor3D speakers={speakers} listener={listener} selectedSpeakerId={selectedSpeakerId} sourceColor={selectedSource?.color} signalActive={isPlaying} onSpeakerSelect={setSelectedSpeakerId} onSpeakerMove={moveSpeakerToGrid} onListenerMove={setListener} />
      <div className="cabinet-tray"><span>PLACE A CABINET</span>{(Object.keys(speakerMeta) as SpeakerKind[]).map((kind) => <button key={kind} onClick={() => addSpeaker(kind)}><i style={{ backgroundColor: speakerMeta[kind].color }} />{speakerMeta[kind].label}</button>)}</div>
      {selectedSpeaker && <aside className="floating-inspector" aria-label="Selected speaker"><div className="inspector-object"><div className={`inspector-cabinet ${selectedSpeaker.kind}`} style={{ backgroundColor: speakerMeta[selectedSpeaker.kind].color }}><span>{speakerMeta[selectedSpeaker.kind].short}</span></div><div><h2>{speakerMeta[selectedSpeaker.kind].label}</h2><p>{speakerMeta[selectedSpeaker.kind].note}</p></div></div><span className="inspector-label">SPEAKER TYPE</span><div className="type-selector">{(Object.keys(speakerMeta) as SpeakerKind[]).map((kind) => <button key={kind} className={selectedSpeaker.kind === kind ? "active" : ""} onClick={() => updateSpeaker({ kind })}>{speakerMeta[kind].short}</button>)}</div><span className="inspector-label volume-row">VOLUME <b>{Math.round(selectedSpeaker.level * 100)}%</b></span><input className="volume-input" type="range" min=".08" max="1" step=".01" value={selectedSpeaker.level} onChange={(event) => updateSpeaker({ level: Number(event.target.value) })} /><div className="inspector-actions"><button className={selectedSpeaker.muted ? "muted" : ""} onClick={() => updateSpeaker({ muted: !selectedSpeaker.muted })}>{selectedSpeaker.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{selectedSpeaker.muted ? "UNMUTE" : "MUTE"}</button><button className="remove" onClick={removeSelected} disabled={speakers.length <= 1} aria-label="Remove speaker"><X size={15} /></button></div></aside>}
    </section>

    <footer className="instrument-footer"><span><b>TRY THIS</b> Put a SUB close to YOU, then move a HIGH to the far right.</span><button onClick={() => { setSpeakers(initialSpeakers); setListener({ x: .5, y: .72 }); }}><RotateCcw size={13} /> RESET ROOM</button></footer>
    {showHelp && <div className="help-backdrop" onClick={() => setShowHelp(false)}><section className="help-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="close-help" onClick={() => setShowHelp(false)}><X size={18} /></button><img src={logoMark} alt="" /><p className="panel-kicker">THREE MOVES</p><h2>Place sound in a room.</h2><ol><li><b>1</b><span>Choose a song from the top.</span></li><li><b>2</b><span>Place a Speaker from the tray.</span></li><li><b>3</b><span>Press PLAY, then move a cabinet or listener.</span></li></ol><button className="instrument-play" onClick={() => { setShowHelp(false); void togglePlayback(); }}><Play size={14} fill="currentColor" /> PLAY THE ROOM</button></section></div>}
  </main>;
}
