/**
 * Club Craft 3D headphone preview: Source → Type Filter → Gain → HRTF Panner → Master.
 * Local files remain in the browser. Their media element is resumed only after an explicit Play action and always enters the existing speaker graph.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type SpeakerKind = "sub" | "woofer" | "full" | "mid" | "high";
export type Position3D = { x: number; y: number; z: number };
export type ClubListener = { position: Position3D; orientation: { yaw: number; pitch: number } };
export type ClubSpeaker = { id: string; kind: SpeakerKind; label: string; position: Position3D; level: number; muted: boolean; responseProfileId: string; activity: number };
export type ClubSource = { id: string; name: string; category: "official" | "local"; color: string; localUrl?: string };

type Voice = { output: GainNode; stop?: () => void; media?: HTMLAudioElement; dispose?: () => void };
type SpeakerNode = { filter: BiquadFilterNode; gain: GainNode; analyser: AnalyserNode; analyserData: Uint8Array; panner: PannerNode };
type LegacySpatialNode = { setPosition?: (x: number, y: number, z: number) => void; setOrientation?: (x: number, y: number, z: number) => void; positionX?: AudioParam; positionY?: AudioParam; positionZ?: AudioParam; forwardX?: AudioParam; forwardY?: AudioParam; forwardZ?: AudioParam };

const filterForKind: Record<SpeakerKind, { type: BiquadFilterType; frequency: number; q: number }> = {
  sub: { type: "lowpass", frequency: 110, q: .8 }, woofer: { type: "lowpass", frequency: 460, q: .62 }, full: { type: "allpass", frequency: 1000, q: .3 }, mid: { type: "bandpass", frequency: 1600, q: .6 }, high: { type: "highpass", frequency: 3600, q: .7 },
};
const toneForOfficialSound: Record<string, number> = { pulse: 55, rain: 196, bronze: 146 };
export const initialHeightForKind: Record<SpeakerKind, number> = { sub: 0, woofer: .22, full: .5, mid: .66, high: .78 };
const visualEnvelopeForKind: Record<SpeakerKind, { attack: number; release: number; gain: number }> = {
  sub: { attack: .13, release: .055, gain: 6.1 },
  woofer: { attack: .22, release: .11, gain: 5.8 },
  full: { attack: .28, release: .14, gain: 5.5 },
  mid: { attack: .42, release: .2, gain: 5.1 },
  high: { attack: .56, release: .28, gain: 4.8 },
};
export function sceneToAudioPosition(position: Position3D) { return { x: (position.x - .5) * 9, y: (position.z - .5) * 4.8, z: (position.y - .5) * 9 }; }

function smoothParam(param: AudioParam | undefined, value: number, now: number) { param?.setTargetAtTime(value, now, .035); }
function setSpatialPosition(node: LegacySpatialNode, position: { x: number; y: number; z: number }, now: number) { if (node.positionX && node.positionY && node.positionZ) { smoothParam(node.positionX, position.x, now); smoothParam(node.positionY, position.y, now); smoothParam(node.positionZ, position.z, now); } else node.setPosition?.(position.x, position.y, position.z); }
export function sceneOrientationToAudioOrientation(orientation: ClubListener["orientation"]) { return { x: Math.sin(orientation.yaw) * Math.cos(orientation.pitch), y: Math.sin(orientation.pitch), z: -Math.cos(orientation.yaw) * Math.cos(orientation.pitch) }; }
function setListenerOrientation(node: LegacySpatialNode, orientation: ClubListener["orientation"], now: number) { const forward = sceneOrientationToAudioOrientation(orientation); if (node.forwardX && node.forwardY && node.forwardZ) { smoothParam(node.forwardX, forward.x, now); smoothParam(node.forwardY, forward.y, now); smoothParam(node.forwardZ, forward.z, now); } else node.setOrientation?.(forward.x, forward.y, forward.z); }

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

export function useClubAudio(speakers: ClubSpeaker[], listener: ClubListener, sources: ClubSource[], activeSourceId: string) {
  const contextRef = useRef<AudioContext | null>(null); const masterRef = useRef<GainNode | null>(null); const voicesRef = useRef(new Map<string, Voice>()); const speakerNodesRef = useRef(new Map<string, SpeakerNode>()); const visualEnvelopeRef = useRef<Record<string, number>>({}); const topologyRef = useRef("");
  const [isPlaying, setIsPlaying] = useState(false); const [playbackError, setPlaybackError] = useState<string | null>(null); const [activityBySpeaker, setActivityBySpeaker] = useState<Record<string, number>>({});
  const ensureContext = useCallback(() => { if (contextRef.current) return contextRef.current; const context = new AudioContext(); const master = context.createGain(); const compressor = context.createDynamicsCompressor(); master.gain.value = .82; compressor.threshold.value = -18; compressor.ratio.value = 5; master.connect(compressor); compressor.connect(context.destination); contextRef.current = context; masterRef.current = master; return context; }, []);

  const sync = useCallback(() => {
    const context = contextRef.current; const master = masterRef.current; if (!context || !master) return;
    const now = context.currentTime; const speakerNodes = speakerNodesRef.current;
    for (const [id, node] of Array.from(speakerNodes.entries())) if (!speakers.some((speaker) => speaker.id === id)) { node.filter.disconnect(); node.gain.disconnect(); node.analyser.disconnect(); node.panner.disconnect(); speakerNodes.delete(id); topologyRef.current = ""; }
    speakers.forEach((speaker) => {
      let node = speakerNodes.get(speaker.id);
      if (!node) { const filter = context.createBiquadFilter(); const gain = context.createGain(); const analyser = context.createAnalyser(); const panner = context.createPanner(); analyser.fftSize = 64; analyser.smoothingTimeConstant = .78; panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1.2; panner.maxDistance = 12; panner.rolloffFactor = .85; panner.coneInnerAngle = 360; filter.connect(gain); gain.connect(analyser); analyser.connect(panner); panner.connect(master); node = { filter, gain, analyser, analyserData: new Uint8Array(analyser.fftSize), panner }; speakerNodes.set(speaker.id, node); topologyRef.current = ""; }
      const config = filterForKind[speaker.kind]; node.filter.type = config.type; smoothParam(node.filter.frequency, config.frequency, now); smoothParam(node.filter.Q, config.q, now); smoothParam(node.gain.gain, speaker.muted ? 0 : Math.max(.02, speaker.level), now); setSpatialPosition(node.panner as unknown as LegacySpatialNode, sceneToAudioPosition(speaker.position), now);
    });
    setSpatialPosition(context.listener as unknown as LegacySpatialNode, sceneToAudioPosition(listener.position), now); setListenerOrientation(context.listener as unknown as LegacySpatialNode, listener.orientation, now);
    const desiredSource = sources.find((source) => source.id === activeSourceId); const voices = voicesRef.current;
    for (const [id, voice] of Array.from(voices.entries())) if (id !== activeSourceId || !desiredSource) { voice.stop?.(); voice.dispose?.(); voice.media?.pause(); voices.delete(id); topologyRef.current = ""; }
    if (desiredSource && !voices.has(desiredSource.id)) { const nextVoice = desiredSource.category === "local" && desiredSource.localUrl ? makeLocalVoice(context, desiredSource, setPlaybackError) : makeOfficialVoice(context, desiredSource); voices.set(desiredSource.id, nextVoice); if (isPlaying && nextVoice.media) void nextVoice.media.play().catch(() => { setPlaybackError("音源を再生できませんでした。ファイル形式を確認して、もう一度Playを押してください。"); setIsPlaying(false); }); topologyRef.current = ""; }
    const topology = `${activeSourceId}:${speakers.map((speaker) => speaker.id).sort().join("|")}`;
    if (topologyRef.current !== topology) { voices.forEach((voice) => { voice.output.disconnect(); speakers.forEach((speaker) => { const destination = speakerNodes.get(speaker.id); if (destination) voice.output.connect(destination.filter); }); }); topologyRef.current = topology; }
  }, [activeSourceId, isPlaying, listener, sources, speakers]);

  useEffect(() => { sync(); }, [sync]);
  useEffect(() => {
    let frame = 0; let lastPaint = 0;
    const paint = (time: number) => {
      if (time - lastPaint > 48) {
        lastPaint = time;
        const next: Record<string, number> = {};
        speakerNodesRef.current.forEach((node, id) => {
          const kind = speakers.find((speaker) => speaker.id === id)?.kind ?? "full"; const envelope = visualEnvelopeForKind[kind];
          let target = 0;
          if (isPlaying) { node.analyser.getByteTimeDomainData(node.analyserData); let energy = 0; for (let index = 0; index < node.analyserData.length; index += 1) energy += Math.abs(node.analyserData[index] - 128) / 128; target = Math.min(1, (energy / node.analyserData.length) * envelope.gain); }
          const previous = visualEnvelopeRef.current[id] ?? 0; const rate = target > previous ? envelope.attack : envelope.release; const smoothed = previous + (target - previous) * rate;
          visualEnvelopeRef.current[id] = smoothed; next[id] = smoothed;
        });
        setActivityBySpeaker(next);
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint); return () => cancelAnimationFrame(frame);
  }, [isPlaying, speakers]);
  const togglePlayback = useCallback(async () => {
    const context = ensureContext(); sync();
    if (isPlaying) { await context.suspend(); voicesRef.current.forEach((voice) => voice.media?.pause()); setIsPlaying(false); return; }
    try { if (context.state !== "running") await context.resume(); const results = await Promise.all(voicesRef.current.size ? Array.from(voicesRef.current.values()).map(async (voice) => { if (voice.media) await voice.media.play(); }) : []); void results; setPlaybackError(null); setIsPlaying(true); }
    catch { setPlaybackError("音源を再生できませんでした。ファイル形式を確認して、もう一度Playを押してください。"); setIsPlaying(false); }
  }, [ensureContext, isPlaying, sync]);
  useEffect(() => () => { voicesRef.current.forEach((voice) => { voice.stop?.(); voice.dispose?.(); voice.media?.pause(); }); void contextRef.current?.close(); }, []);
  return { isPlaying, activityBySpeaker, togglePlayback, playbackError, clearPlaybackError: () => setPlaybackError(null) };
}
