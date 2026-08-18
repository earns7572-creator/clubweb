/** Sound System Playground: a one-screen, beginner-first spatial music toy. */
import { useRef, useState } from "react";
import { CircleHelp, Headphones, Music2, Pause, Play, Plus, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { type ClubSource, type ClubSpeaker, type SpeakerKind, useClubAudio } from "@/hooks/useClubAudio";
import ClubFloor3D from "@/components/ClubFloor3D";
import "../playground-signals.css";
import "../speaker-printed.css";
import "../grid-snap.css";
import "../room-architecture.css";
import "../club-floor-3d.css";
import "../three-polish.css";

const logoMark = "/manus-storage/clubcraft-mark_066a01b1.png";
const speakerMeta: Record<SpeakerKind, { label: string; short: string; color: string; note: string }> = {
  sub: { label: "SUB", short: "S", color: "#2b2d2b", note: "low" },
  woofer: { label: "WOOFER", short: "W", color: "#6f726d", note: "warm" },
  full: { label: "FULL RANGE", short: "F", color: "#f1f0e9", note: "full" },
  mid: { label: "MID", short: "M", color: "#e0b13c", note: "voice" },
  high: { label: "HIGH", short: "H", color: "#4bbd92", note: "air" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPlaying, togglePlayback } = useClubAudio(speakers, listener, sources, selectedSourceId);
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0];
  const selectedSpeaker = speakers.find((speaker) => speaker.id === selectedSpeakerId) ?? speakers[0];

  const moveSpeakerToGrid = (id: string, position: { x: number; y: number }) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, x: snapToGrid(position.x), y: snapToGrid(position.y) } : speaker));
  const addSpeaker = (kind: SpeakerKind) => {
    const id = `${kind}-${Date.now()}`;
    setSpeakers((now) => {
      const position = gridSpawnPoints[now.length % gridSpawnPoints.length];
      return [...now, { id, kind, label: speakerMeta[kind].label, x: position.x, y: position.y, level: .68, muted: false }];
    });
    setSelectedSpeakerId(id);
  };
  const addLocalSound = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const id = `local-${Date.now()}`;
    setSources((now) => [...now, { id, name: file.name.replace(/\.[^/.]+$/, ""), category: "local", color: "#5e98c8", localUrl: URL.createObjectURL(file) }]);
    setSelectedSourceId(id);
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

  return <main className="playground-app three-playground-app">
    <header className="playground-header">
      <div className="play-brand"><img src={logoMark} alt="Club Craft" /><div><p>SOUND SYSTEM PLAYGROUND</p><h1>CLUB CRAFT</h1></div></div>
      <div className="header-center"><span className="track-led" style={{ backgroundColor: selectedSource?.color }} /><span>{selectedSource?.name ?? "Choose a sound"}</span></div>
      <div className="play-actions"><button className="quiet-button" onClick={() => setShowHelp(true)}><CircleHelp size={16} /> HOW TO PLAY</button><button className="hear-button" onClick={() => void togglePlayback()}>{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}{isPlaying ? "PAUSE" : "PLAY"}</button></div>
    </header>
    <section className="playground-shell">
      <aside className="sound-picker"><div className="panel-kicker">1. CHOOSE A SOUND</div><h2>Pick a song for your room.</h2><div className="track-list">{sources.map((source) => <button key={source.id} className={`track-card ${source.id === selectedSourceId ? "selected" : ""}`} onClick={() => setSelectedSourceId(source.id)}><span className="source-light" style={{ backgroundColor: source.color }} /><span><strong>{source.name}</strong><small>{source.category === "local" ? "YOUR FILE" : "CLUB PICK"}</small></span><Music2 size={15} /></button>)}</div><button className="add-track" onClick={() => fileInputRef.current?.click()}><Plus size={17} /> ADD YOUR SONG</button><input ref={fileInputRef} className="hidden-input" type="file" accept="audio/*" onChange={addLocalSound} /><p className="privacy-note"><Headphones size={14} /> Your file stays on this device.</p></aside>
      <section className="room-section three-room-section"><div className="room-heading"><div><p className="panel-kicker">2. PLACE YOUR SPEAKERS</p><h2>Move them. Hear the room change.</h2></div><div className={`room-status ${isPlaying ? "playing" : ""}`}><i /> {isPlaying ? "ROOM IS PLAYING" : "READY TO PLAY"}</div></div><ClubFloor3D speakers={speakers} listener={listener} selectedSpeakerId={selectedSpeakerId} sourceColor={selectedSource?.color} onSpeakerSelect={setSelectedSpeakerId} onSpeakerMove={moveSpeakerToGrid} onListenerMove={setListener} /><div className="speaker-add-row"><span>3. ADD A SPEAKER</span>{(Object.keys(speakerMeta) as SpeakerKind[]).map((kind) => <button key={kind} onClick={() => addSpeaker(kind)}><i style={{ backgroundColor: speakerMeta[kind].color }} />{speakerMeta[kind].label}</button>)}</div></section>
      <aside className="speaker-inspector"><div className="panel-kicker">4. CHANGE THIS SPEAKER</div>{selectedSpeaker && <><div className="inspector-speaker"><div className={`mini-cabinet ${selectedSpeaker.kind}`}><span>{speakerMeta[selectedSpeaker.kind].short}</span></div><div><h2>{speakerMeta[selectedSpeaker.kind].label}</h2><p>{speakerMeta[selectedSpeaker.kind].note} character</p></div></div><div className="type-pills"><p>TYPE</p><div>{(Object.keys(speakerMeta) as SpeakerKind[]).map((kind) => <button key={kind} className={selectedSpeaker.kind === kind ? "active" : ""} onClick={() => updateSpeaker({ kind })}>{speakerMeta[kind].short}</button>)}</div></div><label className="volume-control"><span>VOLUME <b>{Math.round(selectedSpeaker.level * 100)}%</b></span><input type="range" min=".08" max="1" step=".01" value={selectedSpeaker.level} onChange={(event) => updateSpeaker({ level: Number(event.target.value) })} /></label><button className={`mute-button ${selectedSpeaker.muted ? "on" : ""}`} onClick={() => updateSpeaker({ muted: !selectedSpeaker.muted })}>{selectedSpeaker.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}{selectedSpeaker.muted ? "UNMUTE" : "MUTE"}</button><button className="remove-button" onClick={removeSelected} disabled={speakers.length <= 1}><X size={15} /> REMOVE</button><div className="listen-note"><Volume2 size={16} /><span>Move it left, right, closer, or farther. Listen for the change.</span></div></>}</aside>
    </section>
    <footer className="playground-footer"><span><b>TRY THIS:</b> put a SUB close to YOU, then move a HIGH to the far right.</span><button onClick={() => { setSpeakers(initialSpeakers); setListener({ x: .5, y: .72 }); }}><RotateCcw size={13} /> RESET ROOM</button></footer>
    {showHelp && <div className="help-backdrop" onClick={() => setShowHelp(false)}><section className="help-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="close-help" onClick={() => setShowHelp(false)}><X size={18} /></button><img src={logoMark} alt="" /><p className="panel-kicker">YOU ONLY NEED THREE MOVES</p><h2>Place sound in a room.</h2><ol><li><b>1</b><span>Pick a song from the left.</span></li><li><b>2</b><span>Add a Speaker at the bottom.</span></li><li><b>3</b><span>Press PLAY, then drag the Speaker or ◎ YOU.</span></li></ol><button className="hear-button" onClick={() => { setShowHelp(false); void togglePlayback(); }}><Play size={16} fill="currentColor" /> PLAY THE ROOM</button></section></div>}
  </main>;
}
