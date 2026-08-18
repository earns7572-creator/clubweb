/**
 * Club Craft audio graph: Source → mono input → Type Filter → Gain → Analyser → HRTF Panner → stereo Master.
 * Sync is deliberately split so a listener turn or one Speaker drag never reprograms unrelated DSP nodes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createActivityStore } from "@/lib/activityStore";

export type SpeakerKind = "sub" | "woofer" | "full" | "mid" | "high";
export type Position3D = { x: number; y: number; z: number };
export type ClubListener = { position: Position3D; orientation: { yaw: number; pitch: number } };
export type ClubSpeaker = { id: string; kind: SpeakerKind; label: string; position: Position3D; level: number; muted: boolean; responseProfileId: string; activity: number };
export type ClubSource = { id: string; name: string; category: "official" | "local"; color: string; localUrl?: string };

type Voice = { output: GainNode; stop?: () => void; media?: HTMLAudioElement; dispose?: () => void };
type SpatialCache = { x?: number; y?: number; z?: number };
type SpeakerCache = SpatialCache & { kind?: SpeakerKind; frequency?: number; q?: number; gain?: number };
type SpeakerNode = { input: GainNode; filter: BiquadFilterNode; gain: GainNode; analyser: AnalyserNode; analyserData: Uint8Array; panner: PannerNode; cache: SpeakerCache };
type LegacySpatialNode = { setPosition?: (x: number, y: number, z: number) => void; setOrientation?: (x: number, y: number, z: number) => void; positionX?: AudioParam; positionY?: AudioParam; positionZ?: AudioParam; forwardX?: AudioParam; forwardY?: AudioParam; forwardZ?: AudioParam };

const EPSILON = .0001;
const filterForKind: Record<SpeakerKind, { type: BiquadFilterType; frequency: number; q: number }> = {
  sub: { type: "lowpass", frequency: 110, q: .8 }, woofer: { type: "lowpass", frequency: 460, q: .62 }, full: { type: "allpass", frequency: 1000, q: .3 }, mid: { type: "bandpass", frequency: 1600, q: .6 }, high: { type: "highpass", frequency: 3600, q: .7 },
};
const toneForOfficialSound: Record<string, number> = { pulse: 55, rain: 196, bronze: 146 };
export const initialHeightForKind: Record<SpeakerKind, number> = { sub: 0, woofer: .22, full: .5, mid: .66, high: .78 };
const visualEnvelopeForKind: Record<SpeakerKind, { attack: number; release: number; gain: number }> = {
  sub: { attack: .13, release: .055, gain: 6.1 }, woofer: { attack: .22, release: .11, gain: 5.8 }, full: { attack: .28, release: .14, gain: 5.5 }, mid: { attack: .42, release: .2, gain: 5.1 }, high: { attack: .56, release: .28, gain: 4.8 },
};
export function sceneToAudioPosition(position: Position3D) { return { x: (position.x - .5) * 9, y: (position.z - .5) * 4.8, z: (position.y - .5) * 9 }; }
export function sceneOrientationToAudioOrientation(orientation: ClubListener["orientation"]) { return { x: Math.sin(orientation.yaw) * Math.cos(orientation.pitch), y: Math.sin(orientation.pitch), z: -Math.cos(orientation.yaw) * Math.cos(orientation.pitch) }; }

const differs = (next: number, previous: number | undefined) => previous === undefined || Math.abs(next - previous) > EPSILON;
function smoothParam(param: AudioParam | undefined, value: number, previous: number | undefined, now: number) { if (param && differs(value, previous)) param.setTargetAtTime(value, now, .035); }
function setSpatialPosition(node: LegacySpatialNode, position: SpatialCache, cache: SpatialCache, now: number) {
  const changed = differs(position.x ?? 0, cache.x) || differs(position.y ?? 0, cache.y) || differs(position.z ?? 0, cache.z);
  if (!changed) return;
  if (node.positionX && node.positionY && node.positionZ) { smoothParam(node.positionX, position.x ?? 0, cache.x, now); smoothParam(node.positionY, position.y ?? 0, cache.y, now); smoothParam(node.positionZ, position.z ?? 0, cache.z, now); }
  else node.setPosition?.(position.x ?? 0, position.y ?? 0, position.z ?? 0);
  cache.x = position.x; cache.y = position.y; cache.z = position.z;
}
function setListenerOrientation(node: LegacySpatialNode, orientation: ClubListener["orientation"], cache: SpatialCache, now: number) {
  const forward = sceneOrientationToAudioOrientation(orientation);
  const changed = differs(forward.x, cache.x) || differs(forward.y, cache.y) || differs(forward.z, cache.z);
  if (!changed) return;
  if (node.forwardX && node.forwardY && node.forwardZ) { smoothParam(node.forwardX, forward.x, cache.x, now); smoothParam(node.forwardY, forward.y, cache.y, now); smoothParam(node.forwardZ, forward.z, cache.z, now); }
  else node.setOrientation?.(forward.x, forward.y, forward.z);
  cache.x = forward.x; cache.y = forward.y; cache.z = forward.z;
}

function makeOfficialVoice(context: AudioContext, source: ClubSource): Voice {
  const output = context.createGain(); output.gain.value = .24;
  const osc = context.createOscillator(); const overtone = context.createOscillator(); const lowpass = context.createBiquadFilter(); const lfo = context.createOscillator(); const lfoGain = context.createGain(); const fundamental = toneForOfficialSound[source.id] ?? 110;
  osc.type = source.id === "rain" ? "sine" : "triangle"; osc.frequency.value = fundamental; overtone.type = "sine"; overtone.frequency.value = fundamental * (source.id === "bronze" ? 2.01 : 1.5); overtone.detune.value = source.id === "bronze" ? 7 : -4;
  lowpass.type = "lowpass"; lowpass.frequency.value = source.id === "pulse" ? 380 : 1150; lowpass.Q.value = .4; lfo.frequency.value = source.id === "pulse" ? 1.7 : .16; lfoGain.gain.value = source.id === "pulse" ? 120 : 26;
  osc.connect(lowpass); overtone.connect(lowpass); lowpass.connect(output); lfo.connect(lfoGain); lfoGain.connect(lowpass.frequency); osc.start(); overtone.start(); lfo.start();
  return { output, stop: () => { osc.stop(); overtone.stop(); lfo.stop(); output.disconnect(); } };
}
function makeLocalVoice(context: AudioContext, source: ClubSource, onError: (message: string) => void): Voice {
  const media = new Audio(); media.src = source.localUrl ?? ""; media.preload = "auto"; media.loop = true; media.setAttribute("playsinline", "");
  const onMediaError = () => onError("この音声ファイルは、このブラウザでは再生できません。MP3、WAV、M4A、またはAACを試してください。");
  media.addEventListener("error", onMediaError); media.load();
  const mediaSource = context.createMediaElementSource(media); const output = context.createGain(); output.gain.value = .6; mediaSource.connect(output);
  return { output, media, dispose: () => { media.pause(); media.removeEventListener("error", onMediaError); mediaSource.disconnect(); output.disconnect(); media.removeAttribute("src"); media.load(); } };
}
function createSpeakerNode(context: AudioContext, master: GainNode): SpeakerNode {
  const input = context.createGain(); const filter = context.createBiquadFilter(); const gain = context.createGain(); const analyser = context.createAnalyser(); const panner = context.createPanner();
  input.channelCount = 1; input.channelCountMode = "explicit"; input.channelInterpretation = "speakers"; input.gain.value = 1; analyser.fftSize = 64; analyser.smoothingTimeConstant = .78;
  panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1.2; panner.maxDistance = 12; panner.rolloffFactor = .85; panner.coneInnerAngle = 360;
  input.connect(filter); filter.connect(gain); gain.connect(analyser); analyser.connect(panner); panner.connect(master);
  return { input, filter, gain, analyser, analyserData: new Uint8Array(analyser.fftSize), panner, cache: {} };
}
function disconnectSpeakerNode(node: SpeakerNode) { node.input.disconnect(); node.filter.disconnect(); node.gain.disconnect(); node.analyser.disconnect(); node.panner.disconnect(); }

export function useClubAudio(speakers: ClubSpeaker[], listener: ClubListener, sources: ClubSource[], activeSourceId: string) {
  const contextRef = useRef<AudioContext | null>(null); const masterRef = useRef<GainNode | null>(null); const voicesRef = useRef(new Map<string, Voice>()); const speakerNodesRef = useRef(new Map<string, SpeakerNode>()); const visualEnvelopeRef = useRef<Record<string, number>>({}); const activitySnapshotRef = useRef<Record<string, number>>({}); const kindBySpeakerRef = useRef(new Map<string, SpeakerKind>()); const topologyRef = useRef(""); const listenerPositionCacheRef = useRef<SpatialCache>({}); const listenerOrientationCacheRef = useRef<SpatialCache>({}); const activityStoreRef = useRef(createActivityStore()); const topologyPayloadRef = useRef({ speakers, sources, activeSourceId }); const speakersRef = useRef(speakers); const listenerRef = useRef(listener);
  topologyPayloadRef.current = { speakers, sources, activeSourceId };
  speakersRef.current = speakers; listenerRef.current = listener;
  const [isPlaying, setIsPlaying] = useState(false); const [playbackError, setPlaybackError] = useState<string | null>(null);
  const topologyKey = useMemo(() => `${activeSourceId}:${sources.map((source) => `${source.id}:${source.category}:${source.localUrl ?? ""}`).join("|")}:${speakers.map((speaker) => speaker.id).sort().join("|")}`, [activeSourceId, sources, speakers]);
  const speakerDspKey = useMemo(() => speakers.map((speaker) => `${speaker.id}:${speaker.kind}:${speaker.level}:${speaker.muted}`).join("|"), [speakers]);
  const speakerPositionKey = useMemo(() => speakers.map((speaker) => `${speaker.id}:${speaker.position.x}:${speaker.position.y}:${speaker.position.z}`).join("|"), [speakers]);
  const listenerPositionKey = `${listener.position.x}:${listener.position.y}:${listener.position.z}`;
  const listenerOrientationKey = `${listener.orientation.yaw}:${listener.orientation.pitch}`;
  const ensureContext = useCallback(() => { if (contextRef.current) return contextRef.current; const context = new AudioContext(); const master = context.createGain(); const compressor = context.createDynamicsCompressor(); master.gain.value = .82; compressor.threshold.value = -18; compressor.ratio.value = 5; master.connect(compressor); compressor.connect(context.destination); contextRef.current = context; masterRef.current = master; return context; }, []);
  const syncTopology = useCallback((shouldPlay: boolean) => {
    const context = contextRef.current; const master = masterRef.current; if (!context || !master) return;
    const { speakers: speakerList, sources: sourceList, activeSourceId: sourceId } = topologyPayloadRef.current;
    const speakerNodes = speakerNodesRef.current; const requestedIds = new Set(speakerList.map((speaker) => speaker.id));
    Array.from(speakerNodes.entries()).forEach(([id, node]) => { if (!requestedIds.has(id)) { disconnectSpeakerNode(node); speakerNodes.delete(id); delete visualEnvelopeRef.current[id]; kindBySpeakerRef.current.delete(id); topologyRef.current = ""; } });
    speakerList.forEach((speaker) => { if (!speakerNodes.has(speaker.id)) { speakerNodes.set(speaker.id, createSpeakerNode(context, master)); topologyRef.current = ""; } });
    const desiredSource = sourceList.find((source) => source.id === sourceId); const voices = voicesRef.current;
    Array.from(voices.entries()).forEach(([id, voice]) => { if (id !== sourceId || !desiredSource) { voice.stop?.(); voice.dispose?.(); voice.media?.pause(); voices.delete(id); topologyRef.current = ""; } });
    if (desiredSource && !voices.has(desiredSource.id)) { const nextVoice = desiredSource.category === "local" && desiredSource.localUrl ? makeLocalVoice(context, desiredSource, setPlaybackError) : makeOfficialVoice(context, desiredSource); voices.set(desiredSource.id, nextVoice); if (shouldPlay && nextVoice.media) void nextVoice.media.play().catch(() => { setPlaybackError("音源を再生できませんでした。ファイル形式を確認して、もう一度Playを押してください。"); setIsPlaying(false); }); topologyRef.current = ""; }
    const graph = `${sourceId}:${speakerList.map((speaker) => speaker.id).sort().join("|")}`;
    if (topologyRef.current !== graph) { voices.forEach((voice) => { voice.output.disconnect(); speakerList.forEach((speaker) => { const node = speakerNodes.get(speaker.id); if (node) voice.output.connect(node.input); }); }); topologyRef.current = graph; }
  }, []);

  const syncSpeakerDsp = useCallback((speakerList: ClubSpeaker[]) => { const context = contextRef.current; if (!context) return; const now = context.currentTime; speakerList.forEach((speaker) => { const node = speakerNodesRef.current.get(speaker.id); if (!node) return; const config = filterForKind[speaker.kind]; if (node.cache.kind !== speaker.kind) node.filter.type = config.type; smoothParam(node.filter.frequency, config.frequency, node.cache.frequency, now); smoothParam(node.filter.Q, config.q, node.cache.q, now); const targetGain = speaker.muted ? 0 : Math.max(.02, speaker.level); smoothParam(node.gain.gain, targetGain, node.cache.gain, now); node.cache.kind = speaker.kind; node.cache.frequency = config.frequency; node.cache.q = config.q; node.cache.gain = targetGain; }); }, []);
  const syncSpeakerPositions = useCallback((speakerList: ClubSpeaker[]) => { const context = contextRef.current; if (!context) return; const now = context.currentTime; speakerList.forEach((speaker) => { const node = speakerNodesRef.current.get(speaker.id); if (node) setSpatialPosition(node.panner as unknown as LegacySpatialNode, sceneToAudioPosition(speaker.position), node.cache, now); }); }, []);
  const syncListenerPosition = useCallback((nextListener: ClubListener) => { const context = contextRef.current; if (context) setSpatialPosition(context.listener as unknown as LegacySpatialNode, sceneToAudioPosition(nextListener.position), listenerPositionCacheRef.current, context.currentTime); }, []);
  const syncListenerOrientation = useCallback((nextListener: ClubListener) => { const context = contextRef.current; if (context) setListenerOrientation(context.listener as unknown as LegacySpatialNode, nextListener.orientation, listenerOrientationCacheRef.current, context.currentTime); }, []);

  useEffect(() => { speakersRef.current.forEach((speaker) => kindBySpeakerRef.current.set(speaker.id, speaker.kind)); }, [speakerDspKey]);
  useEffect(() => { syncTopology(isPlaying); }, [topologyKey, syncTopology, isPlaying]);
  useEffect(() => { syncSpeakerDsp(speakersRef.current); }, [speakerDspKey, syncSpeakerDsp]);
  useEffect(() => { syncSpeakerPositions(speakersRef.current); }, [speakerPositionKey, syncSpeakerPositions]);
  useEffect(() => { syncListenerPosition(listenerRef.current); }, [listenerPositionKey, syncListenerPosition]);
  useEffect(() => { syncListenerOrientation(listenerRef.current); }, [listenerOrientationKey, syncListenerOrientation]);
  useEffect(() => {
    let frame = 0; let lastPaint = 0; const store = activityStoreRef.current;
    const paint = (time: number) => {
      if (time - lastPaint < 48) { frame = requestAnimationFrame(paint); return; }
      lastPaint = time; const next: Record<string, number> = {}; let hasResidual = false;
      speakerNodesRef.current.forEach((node, id) => { const kind = kindBySpeakerRef.current.get(id) ?? "full"; const envelope = visualEnvelopeForKind[kind]; let target = 0; if (isPlaying) { node.analyser.getByteTimeDomainData(node.analyserData); let energy = 0; for (let index = 0; index < node.analyserData.length; index += 1) energy += Math.abs(node.analyserData[index] - 128) / 128; target = Math.min(1, (energy / node.analyserData.length) * envelope.gain); } const previous = visualEnvelopeRef.current[id] ?? 0; const smoothed = previous + (target - previous) * (target > previous ? envelope.attack : envelope.release); visualEnvelopeRef.current[id] = smoothed; next[id] = smoothed; hasResidual ||= smoothed > .001; });
      const previousSnapshot = activitySnapshotRef.current; const changed = Object.keys(next).length !== Object.keys(previousSnapshot).length || Object.keys(next).some((id) => Math.abs((previousSnapshot[id] ?? 0) - next[id]) > .012);
      if (changed) { activitySnapshotRef.current = next; store.publish(next); }
      if (isPlaying || hasResidual) frame = requestAnimationFrame(paint); else { if (Object.keys(previousSnapshot).length) { activitySnapshotRef.current = {}; store.publish({}); } frame = 0; }
    };
    if (isPlaying || Object.values(visualEnvelopeRef.current).some((value) => value > .001)) frame = requestAnimationFrame(paint);
    return () => { if (frame) cancelAnimationFrame(frame); };
  }, [isPlaying]);
  const togglePlayback = useCallback(async () => {
    const context = ensureContext(); syncTopology(isPlaying); syncSpeakerDsp(speakersRef.current); syncSpeakerPositions(speakersRef.current); syncListenerPosition(listenerRef.current); syncListenerOrientation(listenerRef.current);
    if (isPlaying) { await context.suspend(); voicesRef.current.forEach((voice) => voice.media?.pause()); setIsPlaying(false); return; }
    try { if (context.state !== "running") await context.resume(); await Promise.all(Array.from(voicesRef.current.values()).map(async (voice) => { if (voice.media) await voice.media.play(); })); setPlaybackError(null); setIsPlaying(true); }
    catch { setPlaybackError("音源を再生できませんでした。ファイル形式を確認して、もう一度Playを押してください。"); setIsPlaying(false); }
  }, [ensureContext, isPlaying, syncListenerOrientation, syncListenerPosition, syncSpeakerDsp, syncSpeakerPositions, syncTopology]);
  useEffect(() => () => { voicesRef.current.forEach((voice) => { voice.stop?.(); voice.dispose?.(); voice.media?.pause(); }); speakerNodesRef.current.forEach(disconnectSpeakerNode); void contextRef.current?.close(); }, []);
  return { isPlaying, activityStore: activityStoreRef.current, togglePlayback, playbackError, clearPlaybackError: () => setPlaybackError(null) };
}
