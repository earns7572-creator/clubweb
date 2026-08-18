/**
 * Acoustic Topography page style: a warm architectural worktable where the
 * floor is the primary interface and technical controls stay at the perimeter.
 */
import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  Disc3,
  Headphones,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { type ClubSource, type ClubSpeaker, type SpeakerKind, useClubAudio } from "@/hooks/useClubAudio";

const floorHero = "/manus-storage/clubcraft-floor-hero_acb7ea15.jpg";
const libraryImage = "/manus-storage/clubcraft-sound-library_edb92e67.jpg";
const listeningRoom = "/manus-storage/clubcraft-listening-room_dc39f761.jpg";
const logoMark = "/manus-storage/clubcraft-mark_066a01b1.png";

const speakerMeta: Record<SpeakerKind, { label: string; short: string; color: string }> = {
  sub: { label: "SUB", short: "S", color: "#30302c" },
  woofer: { label: "WOOFER", short: "W", color: "#77766f" },
  full: { label: "FULL RANGE", short: "F", color: "#ece8de" },
  mid: { label: "MID", short: "M", color: "#b3b2a9" },
  high: { label: "HIGH", short: "H", color: "#d64b35" },
};

const initialSpeakers: ClubSpeaker[] = [
  { id: "sub-1", kind: "sub", label: "SUB", x: 0.2, y: 0.76, level: 0.82 },
  { id: "full-1", kind: "full", label: "FULL", x: 0.34, y: 0.3, level: 0.74 },
  { id: "full-2", kind: "full", label: "FULL", x: 0.68, y: 0.28, level: 0.74 },
  { id: "high-1", kind: "high", label: "HIGH", x: 0.82, y: 0.7, level: 0.58 },
];

const officialSources: ClubSource[] = [
  { id: "pulse", name: "Deep Pulse", category: "official", color: "#d64b35" },
  { id: "rain", name: "Rain Room", category: "official", color: "#7b8a8b" },
  { id: "bronze", name: "Bronze Air", category: "official", color: "#9a7353" },
];

const presetScenes = {
  intimate: [
    { id: "sub-1", x: 0.36, y: 0.68 }, { id: "full-1", x: 0.35, y: 0.36 },
    { id: "full-2", x: 0.66, y: 0.36 }, { id: "high-1", x: 0.64, y: 0.67 },
  ],
  wide: [
    { id: "sub-1", x: 0.14, y: 0.82 }, { id: "full-1", x: 0.14, y: 0.2 },
    { id: "full-2", x: 0.84, y: 0.2 }, { id: "high-1", x: 0.86, y: 0.81 },
  ],
  front: [
    { id: "sub-1", x: 0.47, y: 0.24 }, { id: "full-1", x: 0.28, y: 0.22 },
    { id: "full-2", x: 0.72, y: 0.22 }, { id: "high-1", x: 0.84, y: 0.35 },
  ],
};

function clamp(value: number) {
  return Math.max(0.07, Math.min(0.93, value));
}

export default function Home() {
  const [speakers, setSpeakers] = useState<ClubSpeaker[]>(initialSpeakers);
  const [listener, setListener] = useState({ x: 0.5, y: 0.66 });
  const [sources, setSources] = useState<ClubSource[]>(officialSources);
  const [routes, setRoutes] = useState<string[]>(["pulse:sub-1", "pulse:full-1", "pulse:full-2", "rain:high-1"]);
  const [selectedSourceId, setSelectedSourceId] = useState("pulse");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("full-1");
  const [showHelp, setShowHelp] = useState(false);
  const [activePreset, setActivePreset] = useState<keyof typeof presetScenes | null>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ target: "speaker" | "listener"; id?: string } | null>(null);
  const { isPlaying, togglePlayback } = useClubAudio(speakers, listener, sources, routes);

  const selectedSpeaker = speakers.find((speaker) => speaker.id === selectedSpeakerId) ?? speakers[0];
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0];
  const selectedRouteActive = Boolean(selectedSource && selectedSpeaker && routes.includes(`${selectedSource.id}:${selectedSpeaker.id}`));
  const routeCount = useMemo(() => routes.filter((route) => route.startsWith(`${selectedSourceId}:`)).length, [routes, selectedSourceId]);

  const startDrag = (event: React.PointerEvent, target: "speaker" | "listener", id?: string) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { target, id };
    if (target === "speaker" && id) setSelectedSpeakerId(id);
  };

  const moveOnFloor = (event: React.PointerEvent) => {
    if (!dragRef.current || !floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    if (dragRef.current.target === "listener") setListener({ x, y });
    else if (dragRef.current.id) {
      const id = dragRef.current.id;
      setSpeakers((current) => current.map((speaker) => speaker.id === id ? { ...speaker, x, y } : speaker));
      setActivePreset(null);
    }
  };

  const finishDrag = () => { dragRef.current = null; };

  const toggleRoute = () => {
    if (!selectedSource || !selectedSpeaker) return;
    const key = `${selectedSource.id}:${selectedSpeaker.id}`;
    setRoutes((current) => current.includes(key) ? current.filter((route) => route !== key) : [...current, key]);
  };

  const addSpeaker = () => {
    const kind: SpeakerKind = ["sub", "woofer", "full", "mid", "high"][speakers.length % 5] as SpeakerKind;
    const id = `${kind}-${Date.now()}`;
    setSpeakers((current) => [...current, { id, kind, label: speakerMeta[kind].label, x: 0.5, y: 0.44, level: 0.65 }]);
    setSelectedSpeakerId(id);
    setActivePreset(null);
  };

  const removeSelectedSpeaker = () => {
    if (speakers.length <= 1 || !selectedSpeaker) return;
    setSpeakers((current) => current.filter((speaker) => speaker.id !== selectedSpeaker.id));
    setRoutes((current) => current.filter((route) => !route.endsWith(`:${selectedSpeaker.id}`)));
    setSelectedSpeakerId(speakers.find((speaker) => speaker.id !== selectedSpeaker.id)?.id ?? "");
  };

  const addLocalFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const id = `local-${Date.now()}`;
    setSources((current) => [...current, { id, name: file.name.replace(/\.[^/.]+$/, ""), category: "local", color: "#4f7073", localUrl: URL.createObjectURL(file) }]);
    setSelectedSourceId(id);
    event.target.value = "";
  };

  const applyPreset = (preset: keyof typeof presetScenes) => {
    const positions = presetScenes[preset];
    setSpeakers((current) => current.map((speaker) => {
      const position = positions.find((item) => item.id === speaker.id);
      return position ? { ...speaker, x: position.x, y: position.y } : speaker;
    }));
    setActivePreset(preset);
  };

  return (
    <main className="club-app">
      <header className="app-header">
        <div className="brand-lockup">
          <img className="brand-mark" src={logoMark} alt="Club Craft" />
          <div>
            <p className="eyebrow">SPATIAL PLAYGROUND</p>
            <h1>CLUB CRAFT</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="plain-control" type="button" onClick={() => setShowHelp(true)}><CircleHelp size={16} /> HOW IT WORKS</button>
          <button className="play-control" type="button" onClick={() => void togglePlayback()}>
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} {isPlaying ? "PAUSE ROOM" : "HEAR THE ROOM"}
          </button>
        </div>
      </header>

      <section className="workbench">
        <aside className="sound-shelf" aria-label="Sound library">
          <div className="shelf-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(37,37,33,.78), rgba(37,37,33,.2)), url(${libraryImage})` }}>
            <p>START WITH A SOUND</p>
            <span>Pick one, then place it.</span>
          </div>
          <div className="shelf-section-heading"><span>OFFICIAL SOUNDS</span><Sparkles size={14} /></div>
          <div className="source-stack">
            {sources.filter((source) => source.category === "official").map((source) => (
              <button key={source.id} type="button" onClick={() => setSelectedSourceId(source.id)} className={`source-card ${source.id === selectedSourceId ? "is-selected" : ""}`}>
                <span className="source-dot" style={{ backgroundColor: source.color }} />
                <span><strong>{source.name}</strong><small>CLUB EDIT</small></span>
                <Disc3 size={17} />
              </button>
            ))}
          </div>
          <div className="shelf-section-heading my-sounds"><span>MY SOUNDS</span><span className="private-tag">STAYS ON THIS DEVICE</span></div>
          <div className="source-stack local-stack">
            {sources.filter((source) => source.category === "local").map((source) => (
              <button key={source.id} type="button" onClick={() => setSelectedSourceId(source.id)} className={`source-card local ${source.id === selectedSourceId ? "is-selected" : ""}`}>
                <span className="source-dot" style={{ backgroundColor: source.color }} />
                <span><strong>{source.name}</strong><small>LOCAL FILE</small></span>
                <Music2 size={16} />
              </button>
            ))}
            <button type="button" className="add-sound" onClick={() => fileInputRef.current?.click()}><Plus size={18} /> ADD YOUR SOUND</button>
            <input ref={fileInputRef} className="hidden-input" type="file" accept="audio/*" onChange={addLocalFile} />
          </div>
          <div className="shelf-footnote"><Headphones size={15} /> Headphones recommended</div>
        </aside>

        <section className="club-stage" aria-label="Your virtual club">
          <div className="stage-topline">
            <div><p className="eyebrow">YOUR CLUB / PLAN 01</p><h2>Move a speaker. The room changes.</h2></div>
            <div className="stage-status"><span className={`live-indicator ${isPlaying ? "active" : ""}`} /> {isPlaying ? "ROOM IS LIVE" : "ROOM IS READY"}</div>
          </div>
          <div
            ref={floorRef}
            className="floor-view"
            style={{ backgroundImage: `linear-gradient(rgba(231,228,218,.91), rgba(231,228,218,.95)), url(${floorHero})` }}
            onPointerMove={moveOnFloor}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <div className="floor-grid" />
            <div className="floor-ruler ruler-top"><span>0</span><span>3M</span><span>6M</span><span>9M</span></div>
            <div className="floor-ruler ruler-left"><span>0</span><span>3M</span><span>6M</span></div>
            <div className="axis-note axis-north">NORTH / ROOM AXIS</div>
            <div className="axis-note axis-east">ACOUSTIC FIELD 06×06M</div>
            <div className="stage-origin"><span className="stage-cross" /><span>STAGE</span><small>fixed source origin</small></div>
            <svg className="route-lines" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
              {routes.filter((route) => route.startsWith(`${selectedSourceId}:`)).map((route) => {
                const speaker = speakers.find((item) => item.id === route.split(":")[1]);
                if (!speaker) return null;
                return <g key={route}><line x1="50" y1="50" x2={speaker.x * 100} y2={speaker.y * 100} /><circle cx={speaker.x * 100} cy={speaker.y * 100} r="1.05" /></g>;
              })}
            </svg>
            {speakers.map((speaker) => {
              const meta = speakerMeta[speaker.kind];
              const active = routes.includes(`${selectedSourceId}:${speaker.id}`);
              return (
                <button
                  key={speaker.id}
                  type="button"
                  className={`speaker-puck ${speaker.kind} ${speaker.id === selectedSpeakerId ? "selected" : ""} ${active && isPlaying ? "speaking" : ""}`}
                  style={{ left: `${speaker.x * 100}%`, top: `${speaker.y * 100}%`, "--speaker-color": meta.color } as React.CSSProperties}
                  onPointerDown={(event) => startDrag(event, "speaker", speaker.id)}
                  onClick={() => setSelectedSpeakerId(speaker.id)}
                  aria-label={`${meta.label} speaker`}
                >
                  <span className="puck-ring" /><strong>{meta.short}</strong><small>{meta.label}</small>
                </button>
              );
            })}
            <button
              type="button"
              className="listener-marker"
              style={{ left: `${listener.x * 100}%`, top: `${listener.y * 100}%` }}
              onPointerDown={(event) => startDrag(event, "listener")}
              aria-label="Move your listening position"
            ><span>◎</span><small>YOU</small></button>
            <div className="floor-caption"><span>Drag a speaker</span><i /> <span>Move ◎ YOU</span></div>
          </div>
          <div className="scene-bar">
            <span className="scene-label">MOOD</span>
            {(["intimate", "wide", "front"] as const).map((preset) => (
              <button key={preset} type="button" onClick={() => applyPreset(preset)} className={activePreset === preset ? "active" : ""}>{preset === "front" ? "FRONT HEAVY" : preset.toUpperCase()}</button>
            ))}
            <button type="button" className="reset-scene" onClick={() => { setSpeakers(initialSpeakers); setListener({ x: 0.5, y: 0.66 }); setActivePreset(null); }}><RotateCcw size={13} /> RESET</button>
          </div>
        </section>

        <aside className="inspector" aria-label="Selected object details">
          <div className="inspector-title"><span>SELECTED SPEAKER</span><ChevronDown size={16} /></div>
          {selectedSpeaker && (
            <>
              <div className="selected-object">
                <div className={`object-orb ${selectedSpeaker.kind}`}><span>{speakerMeta[selectedSpeaker.kind].short}</span></div>
                <div><p>{speakerMeta[selectedSpeaker.kind].label}</p><small>virtual speaker</small></div>
              </div>
              <label className="control-label">SPEAKER TYPE
                <select value={selectedSpeaker.kind} onChange={(event) => {
                  const kind = event.target.value as SpeakerKind;
                  setSpeakers((current) => current.map((speaker) => speaker.id === selectedSpeaker.id ? { ...speaker, kind, label: speakerMeta[kind].label } : speaker));
                }}>
                  {Object.entries(speakerMeta).map(([kind, meta]) => <option key={kind} value={kind}>{meta.label}</option>)}
                </select>
              </label>
              <label className="control-label">LEVEL <span>{Math.round(selectedSpeaker.level * 100)}%</span>
                <input type="range" min="0.12" max="1" step="0.01" value={selectedSpeaker.level} onChange={(event) => setSpeakers((current) => current.map((speaker) => speaker.id === selectedSpeaker.id ? { ...speaker, level: Number(event.target.value) } : speaker))} />
              </label>
              <div className="route-panel">
                <p>ROUTE FROM</p>
                <div className="route-source"><span className="source-dot" style={{ backgroundColor: selectedSource?.color }} />{selectedSource?.name ?? "Choose a sound"}</div>
                <button type="button" className={`route-toggle ${selectedRouteActive ? "routed" : ""}`} onClick={toggleRoute}>
                  <span>{selectedRouteActive ? "ROUTED" : "ROUTE HERE"}</span><Volume2 size={16} />
                </button>
                <small>{routeCount} speaker{routeCount === 1 ? "" : "s"} connected from this sound</small>
              </div>
              <button type="button" className="delete-speaker" onClick={removeSelectedSpeaker} disabled={speakers.length <= 1}><X size={14} /> REMOVE SPEAKER</button>
            </>
          )}
          <button type="button" className="add-speaker" onClick={addSpeaker}><Plus size={16} /> ADD SPEAKER</button>
          <div className="inspector-image" style={{ backgroundImage: `linear-gradient(0deg, rgba(37,37,33,.6), transparent), url(${listeningRoom})` }}><span>LISTEN FROM<br />WHERE YOU ARE.</span></div>
        </aside>
      </section>

      {showHelp && <div className="help-backdrop" role="presentation" onClick={() => setShowHelp(false)}>
        <section className="help-sheet" role="dialog" aria-modal="true" aria-label="How Club Craft works" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="close-help" onClick={() => setShowHelp(false)}><X size={18} /></button>
          <img src={logoMark} alt="" />
          <p className="eyebrow">THREE MOVES</p><h2>Put sound in a place.</h2>
          <ol><li><b>1</b><span>Choose a sound from the left shelf.</span></li><li><b>2</b><span>Pick a Speaker, then press <em>Route here</em>.</span></li><li><b>3</b><span>Drag the Speaker or <em>◎ YOU</em> and listen.</span></li></ol>
          <button className="play-control" type="button" onClick={() => { setShowHelp(false); void togglePlayback(); }}><Play size={16} fill="currentColor" /> HEAR THE ROOM</button>
        </section>
      </div>}
    </main>
  );
}
