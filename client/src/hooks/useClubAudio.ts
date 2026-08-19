/**
 * Club Craft audio graph: Source → mono input → model character filters → four-band Custom EQ → Gain → Analyser → HRTF Panner → stereo Master.
 * Sync is deliberately split so a listener turn or one Speaker drag never reprograms unrelated DSP nodes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createActivityStore } from "@/lib/activityStore";
import type { SpeakerEq } from "@/lib/speakerEq";
import { getSpeakerModel, resolveModelId, type CharacterFilter, type SpeakerModelId } from "@/lib/speakerModels";
import { getBandEnergy } from "@/lib/bassPressure";
import { createStackResolver } from "@/lib/speakerStacking";

export type SpeakerKind = "sub" | "woofer" | "full" | "mid" | "high";
export type Position3D = { x: number; y: number; z: number };
export type ClubListener = { position: Position3D; orientation: { yaw: number; pitch: number } };
export type ClubSpeaker = { id: string; kind: SpeakerKind; modelId?: SpeakerModelId; label: string; position: Position3D; stackParentId?: string | null; level: number; muted: boolean; responseProfileId: string; activity: number; eq: SpeakerEq };
export type ClubSource = { id: string; name: string; category: "official" | "local"; color: string; localUrl?: string };

type Voice = { output: GainNode; stop?: () => void; media?: HTMLAudioElement; dispose?: () => void };
type SpatialCache = { x?: number; y?: number; z?: number };
type EqCache = { lowFrequency?: number; lowGain?: number; lowMidFrequency?: number; lowMidGain?: number; lowMidQ?: number; highMidFrequency?: number; highMidGain?: number; highMidQ?: number; highFrequency?: number; highGain?: number };
type SpeakerCache = SpatialCache & { modelId?: SpeakerModelId; gain?: number; eq: EqCache };
type SpeakerEqNodes = { low: BiquadFilterNode; lowMid: BiquadFilterNode; highMid: BiquadFilterNode; high: BiquadFilterNode };
type SpeakerNode = { input: GainNode; characterFilters: BiquadFilterNode[]; eq: SpeakerEqNodes; gain: GainNode; analyser: AnalyserNode; analyserData: Uint8Array; frequencyData: Uint8Array; panner: PannerNode; cache: SpeakerCache };
type LegacySpatialNode = { setPosition?: (x: number, y: number, z: number) => void; setOrientation?: (x: number, y: number, z: number) => void; positionX?: AudioParam; positionY?: AudioParam; positionZ?: AudioParam; forwardX?: AudioParam; forwardY?: AudioParam; forwardZ?: AudioParam };

const EPSILON = .0001;
const toneForOfficialSound: Record<string, number> = { pulse: 55, rain: 196, bronze: 146 };
const visualEnvelopeForKind: Record<SpeakerKind, { attack: number; release: number; gain: number }> = {
  sub: { attack: .16, release: .07, gain: 5.6 }, woofer: { attack: .22, release: .11, gain: 5.1 }, full: { attack: .26, release: .14, gain: 5.2 }, mid: { attack: .38, release: .18, gain: 6.6 }, high: { attack: .46, release: .21, gain: 7.8 },
};
export function sceneToAudioPosition(position: Position3D) { return { x: (position.x - .5) * 9, y: (position.z - .5) * 4.8, z: (position.y - .5) * 9 }; }
export function speakerToAudioPosition(speaker: ClubSpeaker, speakers: ClubSpeaker[]) { const resolver = createStackResolver(speakers); const xy = resolver.getXY(speaker); return { x: (xy.x - .5) * 9, y: resolver.getCenterMeters(speaker), z: (xy.y - .5) * 9 }; }
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

const SWEEP_START_HZ = 20;
const SWEEP_END_HZ = 20_000;
const SWEEP_DURATION_SECONDS = 15;

function makeSweepVoice(context: AudioContext, onComplete: () => void): Voice {
  const output = context.createGain(); const level = context.createGain(); const oscillator = context.createOscillator(); const now = context.currentTime; let stoppedManually = false;
  output.gain.value = .24; level.gain.setValueAtTime(0, now); level.gain.linearRampToValueAtTime(.18, now + .025); level.gain.setValueAtTime(.18, now + SWEEP_DURATION_SECONDS - .04); level.gain.linearRampToValueAtTime(0, now + SWEEP_DURATION_SECONDS);
  oscillator.type = "sine"; oscillator.frequency.setValueAtTime(SWEEP_START_HZ, now); oscillator.frequency.exponentialRampToValueAtTime(SWEEP_END_HZ, now + SWEEP_DURATION_SECONDS); oscillator.connect(level); level.connect(output);
  oscillator.onended = () => { output.disconnect(); level.disconnect(); if (!stoppedManually) onComplete(); };
  oscillator.start(now); oscillator.stop(now + SWEEP_DURATION_SECONDS);
  return { output, stop: () => { stoppedManually = true; oscillator.onended = null; oscillator.stop(); level.disconnect(); output.disconnect(); } };
}

function makeOfficialVoice(context: AudioContext, source: ClubSource, onSweepComplete: () => void): Voice {
  if (source.id === "sweep") return makeSweepVoice(context, onSweepComplete);
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
function createSpeakerEqNodes(context: AudioContext): SpeakerEqNodes {
  const low = context.createBiquadFilter(); low.type = "lowshelf";
  const lowMid = context.createBiquadFilter(); lowMid.type = "peaking";
  const highMid = context.createBiquadFilter(); highMid.type = "peaking";
  const high = context.createBiquadFilter(); high.type = "highshelf";
  return { low, lowMid, highMid, high };
}
function configureCharacterNode(node: BiquadFilterNode, filter: CharacterFilter) { node.type = filter.type; node.frequency.value = filter.frequency; node.Q.value = filter.q ?? .7; if (filter.type === "peaking" || filter.type === "lowshelf" || filter.type === "highshelf") node.gain.value = filter.gainDb ?? 0; }
function createCharacterFilters(context: AudioContext, modelId: SpeakerModelId) { return getSpeakerModel(modelId, getSpeakerModel(modelId, "sub").kind).characterFilters.map((filter) => { const node = context.createBiquadFilter(); configureCharacterNode(node, filter); return node; }); }
function connectCharacterChain(input: AudioNode, filters: BiquadFilterNode[], destination: AudioNode) { if (!filters.length) { input.connect(destination); return; } input.connect(filters[0]); for (let index = 0; index < filters.length - 1; index += 1) filters[index].connect(filters[index + 1]); filters[filters.length - 1].connect(destination); }
function createSpeakerNode(context: AudioContext, master: GainNode, modelId: SpeakerModelId): SpeakerNode {
  const input = context.createGain(); const characterFilters = createCharacterFilters(context, modelId); const eq = createSpeakerEqNodes(context); const gain = context.createGain(); const analyser = context.createAnalyser(); const panner = context.createPanner();
  input.channelCount = 1; input.channelCountMode = "explicit"; input.channelInterpretation = "speakers"; input.gain.value = 1; analyser.fftSize = 1024; analyser.smoothingTimeConstant = .78;
  panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1.2; panner.maxDistance = 12; panner.rolloffFactor = .85; panner.coneInnerAngle = 360;
  connectCharacterChain(input, characterFilters, eq.low); eq.low.connect(eq.lowMid); eq.lowMid.connect(eq.highMid); eq.highMid.connect(eq.high); eq.high.connect(gain); gain.connect(analyser); analyser.connect(panner); panner.connect(master);
  return { input, characterFilters, eq, gain, analyser, analyserData: new Uint8Array(analyser.fftSize), frequencyData: new Uint8Array(analyser.frequencyBinCount), panner, cache: { modelId, eq: {} } };
}
function disconnectSpeakerNode(node: SpeakerNode) { node.input.disconnect(); node.characterFilters.forEach((filter) => filter.disconnect()); node.eq.low.disconnect(); node.eq.lowMid.disconnect(); node.eq.highMid.disconnect(); node.eq.high.disconnect(); node.gain.disconnect(); node.analyser.disconnect(); node.panner.disconnect(); }
function syncEq(node: SpeakerNode, eq: SpeakerEq, now: number) {
  const cache = node.cache.eq;
  smoothParam(node.eq.low.frequency, eq.low.frequency, cache.lowFrequency, now); smoothParam(node.eq.low.gain, eq.low.gainDb, cache.lowGain, now);
  smoothParam(node.eq.lowMid.frequency, eq.lowMid.frequency, cache.lowMidFrequency, now); smoothParam(node.eq.lowMid.gain, eq.lowMid.gainDb, cache.lowMidGain, now); smoothParam(node.eq.lowMid.Q, eq.lowMid.q, cache.lowMidQ, now);
  smoothParam(node.eq.highMid.frequency, eq.highMid.frequency, cache.highMidFrequency, now); smoothParam(node.eq.highMid.gain, eq.highMid.gainDb, cache.highMidGain, now); smoothParam(node.eq.highMid.Q, eq.highMid.q, cache.highMidQ, now);
  smoothParam(node.eq.high.frequency, eq.high.frequency, cache.highFrequency, now); smoothParam(node.eq.high.gain, eq.high.gainDb, cache.highGain, now);
  node.cache.eq = { lowFrequency: eq.low.frequency, lowGain: eq.low.gainDb, lowMidFrequency: eq.lowMid.frequency, lowMidGain: eq.lowMid.gainDb, lowMidQ: eq.lowMid.q, highMidFrequency: eq.highMid.frequency, highMidGain: eq.highMid.gainDb, highMidQ: eq.highMid.q, highFrequency: eq.high.frequency, highGain: eq.high.gainDb };
}

export function useClubAudio(speakers: ClubSpeaker[], listener: ClubListener, sources: ClubSource[], activeSourceId: string) {
  const contextRef = useRef<AudioContext | null>(null); const masterRef = useRef<GainNode | null>(null); const voicesRef = useRef(new Map<string, Voice>()); const speakerNodesRef = useRef(new Map<string, SpeakerNode>()); const visualEnvelopeRef = useRef<Record<string, number>>({}); const lowEnvelopeRef = useRef<Record<string, number>>({}); const activitySnapshotRef = useRef<Record<string, number>>({}); const lowActivitySnapshotRef = useRef<Record<string, number>>({}); const kindBySpeakerRef = useRef(new Map<string, SpeakerKind>()); const topologyRef = useRef(""); const listenerPositionCacheRef = useRef<SpatialCache>({}); const listenerOrientationCacheRef = useRef<SpatialCache>({}); const activityStoreRef = useRef(createActivityStore()); const lowActivityStoreRef = useRef(createActivityStore()); const topologyPayloadRef = useRef({ speakers, sources, activeSourceId }); const speakersRef = useRef(speakers); const listenerRef = useRef(listener);
  topologyPayloadRef.current = { speakers, sources, activeSourceId };
  speakersRef.current = speakers; listenerRef.current = listener;
  const [isPlaying, setIsPlaying] = useState(false); const [playbackError, setPlaybackError] = useState<string | null>(null);
  const topologyKey = useMemo(() => `${activeSourceId}:${sources.map((source) => `${source.id}:${source.category}:${source.localUrl ?? ""}`).join("|")}:${speakers.map((speaker) => `${speaker.id}:${resolveModelId(speaker.modelId, speaker.kind)}`).sort().join("|")}`, [activeSourceId, sources, speakers]);
  const speakerDspKey = useMemo(() => speakers.map((speaker) => `${speaker.id}:${resolveModelId(speaker.modelId, speaker.kind)}:${speaker.level}:${speaker.muted}:${speaker.eq.low.frequency}:${speaker.eq.low.gainDb}:${speaker.eq.lowMid.frequency}:${speaker.eq.lowMid.gainDb}:${speaker.eq.lowMid.q}:${speaker.eq.highMid.frequency}:${speaker.eq.highMid.gainDb}:${speaker.eq.highMid.q}:${speaker.eq.high.frequency}:${speaker.eq.high.gainDb}`).join("|"), [speakers]);
  const speakerPositionKey = useMemo(() => speakers.map((speaker) => `${speaker.id}:${speaker.position.x}:${speaker.position.y}:${speaker.position.z}:${speaker.stackParentId ?? "floor"}`).join("|"), [speakers]);
  const listenerPositionKey = `${listener.position.x}:${listener.position.y}:${listener.position.z}`;
  const listenerOrientationKey = `${listener.orientation.yaw}:${listener.orientation.pitch}`;
  const ensureContext = useCallback(() => { if (contextRef.current) return contextRef.current; const context = new AudioContext(); const master = context.createGain(); const compressor = context.createDynamicsCompressor(); master.gain.value = .82; compressor.threshold.value = -18; compressor.ratio.value = 5; master.connect(compressor); compressor.connect(context.destination); contextRef.current = context; masterRef.current = master; return context; }, []);
  const syncTopology = useCallback((shouldPlay: boolean) => {
    const context = contextRef.current; const master = masterRef.current; if (!context || !master) return;
    const { speakers: speakerList, sources: sourceList, activeSourceId: sourceId } = topologyPayloadRef.current;
    const speakerNodes = speakerNodesRef.current; const requestedIds = new Set(speakerList.map((speaker) => speaker.id));
    Array.from(speakerNodes.entries()).forEach(([id, node]) => { if (!requestedIds.has(id)) { disconnectSpeakerNode(node); speakerNodes.delete(id); delete visualEnvelopeRef.current[id]; delete lowEnvelopeRef.current[id]; kindBySpeakerRef.current.delete(id); topologyRef.current = ""; } });
    speakerList.forEach((speaker) => { const modelId = resolveModelId(speaker.modelId, speaker.kind); const existing = speakerNodes.get(speaker.id); if (!existing || existing.cache.modelId !== modelId) { if (existing) disconnectSpeakerNode(existing); speakerNodes.set(speaker.id, createSpeakerNode(context, master, modelId)); topologyRef.current = ""; } });
    const desiredSource = sourceList.find((source) => source.id === sourceId); const voices = voicesRef.current;
    Array.from(voices.entries()).forEach(([id, voice]) => { if (id !== sourceId || !desiredSource) { voice.stop?.(); voice.dispose?.(); voice.media?.pause(); voices.delete(id); topologyRef.current = ""; } });
    if (desiredSource && shouldPlay && !voices.has(desiredSource.id)) { const nextVoice = desiredSource.category === "local" && desiredSource.localUrl ? makeLocalVoice(context, desiredSource, setPlaybackError) : makeOfficialVoice(context, desiredSource, () => { voicesRef.current.delete(desiredSource.id); topologyRef.current = ""; setIsPlaying(false); }); voices.set(desiredSource.id, nextVoice); if (nextVoice.media) void nextVoice.media.play().catch(() => { setPlaybackError("音源を再生できませんでした。ファイル形式を確認して、もう一度Playを押してください。"); setIsPlaying(false); }); topologyRef.current = ""; }
    const graph = `${sourceId}:${speakerList.map((speaker) => `${speaker.id}:${resolveModelId(speaker.modelId, speaker.kind)}`).sort().join("|")}`;
    if (topologyRef.current !== graph) { voices.forEach((voice) => { voice.output.disconnect(); speakerList.forEach((speaker) => { const node = speakerNodes.get(speaker.id); if (node) voice.output.connect(node.input); }); }); topologyRef.current = graph; }
  }, []);

  const syncSpeakerDsp = useCallback((speakerList: ClubSpeaker[]) => { const context = contextRef.current; if (!context) return; const now = context.currentTime; speakerList.forEach((speaker) => { const node = speakerNodesRef.current.get(speaker.id); if (!node) return; syncEq(node, speaker.eq, now); const targetGain = speaker.muted ? 0 : Math.max(.02, speaker.level); smoothParam(node.gain.gain, targetGain, node.cache.gain, now); node.cache.gain = targetGain; }); }, []);
  const syncSpeakerPositions = useCallback((speakerList: ClubSpeaker[]) => { const context = contextRef.current; if (!context) return; const now = context.currentTime; speakerList.forEach((speaker) => { const node = speakerNodesRef.current.get(speaker.id); if (node) setSpatialPosition(node.panner as unknown as LegacySpatialNode, speakerToAudioPosition(speaker, speakerList), node.cache, now); }); }, []);
  const syncListenerPosition = useCallback((nextListener: ClubListener) => { const context = contextRef.current; if (context) setSpatialPosition(context.listener as unknown as LegacySpatialNode, sceneToAudioPosition(nextListener.position), listenerPositionCacheRef.current, context.currentTime); }, []);
  const syncListenerOrientation = useCallback((nextListener: ClubListener) => { const context = contextRef.current; if (context) setListenerOrientation(context.listener as unknown as LegacySpatialNode, nextListener.orientation, listenerOrientationCacheRef.current, context.currentTime); }, []);

  useEffect(() => { speakersRef.current.forEach((speaker) => kindBySpeakerRef.current.set(speaker.id, speaker.kind)); }, [speakerDspKey]);
  useEffect(() => { syncTopology(isPlaying); }, [topologyKey, syncTopology, isPlaying]);
  useEffect(() => { syncSpeakerDsp(speakersRef.current); }, [speakerDspKey, syncSpeakerDsp]);
  useEffect(() => { syncSpeakerPositions(speakersRef.current); }, [speakerPositionKey, syncSpeakerPositions]);
  useEffect(() => { syncListenerPosition(listenerRef.current); }, [listenerPositionKey, syncListenerPosition]);
  useEffect(() => { syncListenerOrientation(listenerRef.current); }, [listenerOrientationKey, syncListenerOrientation]);
  useEffect(() => {
    let frame = 0; let lastPaint = 0; const store = activityStoreRef.current; const lowStore = lowActivityStoreRef.current;
    const paint = (time: number) => {
      if (time - lastPaint < 48) { frame = requestAnimationFrame(paint); return; }
      lastPaint = time; const next: Record<string, number> = {}; const nextLow: Record<string, number> = {}; let hasResidual = false; let hasLowResidual = false;
      speakerNodesRef.current.forEach((node, id) => { const kind = kindBySpeakerRef.current.get(id) ?? "full"; const envelope = visualEnvelopeForKind[kind]; let target = 0; let lowTarget = 0; if (isPlaying) { node.analyser.getByteTimeDomainData(node.analyserData); let energy = 0; for (let index = 0; index < node.analyserData.length; index += 1) energy += Math.abs(node.analyserData[index] - 128) / 128; target = Math.min(1, (energy / node.analyserData.length) * envelope.gain); lowTarget = getBandEnergy(node.analyser, node.frequencyData, contextRef.current?.sampleRate ?? 48_000); } const previous = visualEnvelopeRef.current[id] ?? 0; const smoothed = previous + (target - previous) * (target > previous ? envelope.attack : envelope.release); const previousLow = lowEnvelopeRef.current[id] ?? 0; const lowSmoothed = previousLow + (lowTarget - previousLow) * (lowTarget > previousLow ? .36 : .12); visualEnvelopeRef.current[id] = smoothed; lowEnvelopeRef.current[id] = lowSmoothed; next[id] = smoothed; nextLow[id] = lowSmoothed; hasResidual ||= smoothed > .001; hasLowResidual ||= lowSmoothed > .001; });
      const previousSnapshot = activitySnapshotRef.current; const changed = Object.keys(next).length !== Object.keys(previousSnapshot).length || Object.keys(next).some((id) => Math.abs((previousSnapshot[id] ?? 0) - next[id]) > .012);
      if (changed) { activitySnapshotRef.current = next; store.publish(next); }
      const previousLowSnapshot = lowActivitySnapshotRef.current; const lowChanged = Object.keys(nextLow).length !== Object.keys(previousLowSnapshot).length || Object.keys(nextLow).some((id) => Math.abs((previousLowSnapshot[id] ?? 0) - nextLow[id]) > .008);
      if (lowChanged) { lowActivitySnapshotRef.current = nextLow; lowStore.publish(nextLow); }
      if (isPlaying || hasResidual || hasLowResidual) frame = requestAnimationFrame(paint); else { if (Object.keys(previousSnapshot).length) { activitySnapshotRef.current = {}; store.publish({}); } if (Object.keys(previousLowSnapshot).length) { lowActivitySnapshotRef.current = {}; lowStore.publish({}); } frame = 0; }
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
  return { isPlaying, activityStore: activityStoreRef.current, lowActivityStore: lowActivityStoreRef.current, togglePlayback, playbackError, clearPlaybackError: () => setPlaybackError(null) };
}
