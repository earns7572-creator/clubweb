/**
 * Club Craft 3D headphone preview: Source → Type Filter → Gain → HRTF Panner → Master.
 * Scene coordinates stay separate from Web Audio coordinates; position-only changes update AudioParams, not graph topology.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type SpeakerKind = "sub" | "woofer" | "full" | "mid" | "high";
export type Position3D = { x: number; y: number; z: number };
export type ClubListener = { position: Position3D; orientation: { forwardX: number; forwardY: number; forwardZ: number } };

export type ClubSpeaker = {
  id: string;
  kind: SpeakerKind;
  label: string;
  position: Position3D;
  level: number;
  muted: boolean;
  responseProfileId: string;
  activity: number;
};

export type ClubSource = { id: string; name: string; category: "official" | "local"; color: string; localUrl?: string };

type Voice = { output: GainNode; stop?: () => void; media?: HTMLAudioElement };
type SpeakerNode = { filter: BiquadFilterNode; gain: GainNode; panner: PannerNode };
type LegacySpatialNode = { setPosition?: (x: number, y: number, z: number) => void; setOrientation?: (x: number, y: number, z: number) => void; positionX?: AudioParam; positionY?: AudioParam; positionZ?: AudioParam; forwardX?: AudioParam; forwardY?: AudioParam; forwardZ?: AudioParam };

const filterForKind: Record<SpeakerKind, { type: BiquadFilterType; frequency: number; q: number }> = {
  sub: { type: "lowpass", frequency: 110, q: 0.8 }, woofer: { type: "lowpass", frequency: 460, q: 0.62 },
  full: { type: "allpass", frequency: 1000, q: 0.3 }, mid: { type: "bandpass", frequency: 1600, q: 0.6 }, high: { type: "highpass", frequency: 3600, q: 0.7 },
};

const toneForOfficialSound: Record<string, number> = { pulse: 55, rain: 196, bronze: 146 };
export const initialHeightForKind: Record<SpeakerKind, number> = { sub: 0, woofer: .22, full: .5, mid: .66, high: .78 };

/** Converts normalized Club Craft floor coordinates into Web Audio right/up/front axes. */
export function sceneToAudioPosition(position: Position3D) {
  return { x: (position.x - .5) * 9, y: (position.z - .5) * 4.8, z: (position.y - .5) * 9 };
}

function smoothParam(param: AudioParam | undefined, value: number, now: number) { param?.setTargetAtTime(value, now, .035); }
function setSpatialPosition(node: LegacySpatialNode, position: { x: number; y: number; z: number }, now: number) {
  if (node.positionX && node.positionY && node.positionZ) { smoothParam(node.positionX, position.x, now); smoothParam(node.positionY, position.y, now); smoothParam(node.positionZ, position.z, now); }
  else node.setPosition?.(position.x, position.y, position.z);
}
function setListenerOrientation(node: LegacySpatialNode, orientation: ClubListener["orientation"], now: number) {
  if (node.forwardX && node.forwardY && node.forwardZ) { smoothParam(node.forwardX, orientation.forwardX, now); smoothParam(node.forwardY, orientation.forwardY, now); smoothParam(node.forwardZ, orientation.forwardZ, now); }
  else node.setOrientation?.(orientation.forwardX, orientation.forwardY, orientation.forwardZ);
}

function makeOfficialVoice(context: AudioContext, source: ClubSource): Voice {
  const output = context.createGain(); output.gain.value = .24;
  const osc = context.createOscillator(); const overtone = context.createOscillator(); const lowpass = context.createBiquadFilter();
  const lfo = context.createOscillator(); const lfoGain = context.createGain(); const fundamental = toneForOfficialSound[source.id] ?? 110;
  osc.type = source.id === "rain" ? "sine" : "triangle"; osc.frequency.value = fundamental;
  overtone.type = "sine"; overtone.frequency.value = fundamental * (source.id === "bronze" ? 2.01 : 1.5); overtone.detune.value = source.id === "bronze" ? 7 : -4;
  lowpass.type = "lowpass"; lowpass.frequency.value = source.id === "pulse" ? 380 : 1150; lowpass.Q.value = .4;
  lfo.frequency.value = source.id === "pulse" ? 1.7 : .16; lfoGain.gain.value = source.id === "pulse" ? 120 : 26;
  osc.connect(lowpass); overtone.connect(lowpass); lowpass.connect(output); lfo.connect(lfoGain); lfoGain.connect(lowpass.frequency);
  osc.start(); overtone.start(); lfo.start();
  return { output, stop: () => { osc.stop(); overtone.stop(); lfo.stop(); output.disconnect(); } };
}

export function useClubAudio(speakers: ClubSpeaker[], listener: ClubListener, sources: ClubSource[], activeSourceId: string) {
  const contextRef = useRef<AudioContext | null>(null); const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef(new Map<string, Voice>()); const speakerNodesRef = useRef(new Map<string, SpeakerNode>()); const topologyRef = useRef("");
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const context = new AudioContext(); const master = context.createGain(); const compressor = context.createDynamicsCompressor();
    master.gain.value = .82; compressor.threshold.value = -18; compressor.ratio.value = 5; master.connect(compressor); compressor.connect(context.destination);
    contextRef.current = context; masterRef.current = master; return context;
  }, []);

  const sync = useCallback(() => {
    const context = contextRef.current; const master = masterRef.current; if (!context || !master) return;
    const now = context.currentTime; const speakerNodes = speakerNodesRef.current;
    for (const [id, node] of Array.from(speakerNodes.entries())) if (!speakers.some((speaker) => speaker.id === id)) { node.filter.disconnect(); node.gain.disconnect(); node.panner.disconnect(); speakerNodes.delete(id); topologyRef.current = ""; }
    speakers.forEach((speaker) => {
      let node = speakerNodes.get(speaker.id);
      if (!node) {
        const filter = context.createBiquadFilter(); const gain = context.createGain(); const panner = context.createPanner();
        panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1.2; panner.maxDistance = 12; panner.rolloffFactor = .85; panner.coneInnerAngle = 360;
        filter.connect(gain); gain.connect(panner); panner.connect(master); node = { filter, gain, panner }; speakerNodes.set(speaker.id, node); topologyRef.current = "";
      }
      const config = filterForKind[speaker.kind]; node.filter.type = config.type; smoothParam(node.filter.frequency, config.frequency, now); smoothParam(node.filter.Q, config.q, now);
      smoothParam(node.gain.gain, speaker.muted ? 0 : Math.max(.02, speaker.level), now);
      setSpatialPosition(node.panner as unknown as LegacySpatialNode, sceneToAudioPosition(speaker.position), now);
    });
    setSpatialPosition(context.listener as unknown as LegacySpatialNode, sceneToAudioPosition(listener.position), now);
    setListenerOrientation(context.listener as unknown as LegacySpatialNode, listener.orientation, now);

    const desiredSource = sources.find((source) => source.id === activeSourceId); const voices = voicesRef.current;
    for (const [id, voice] of Array.from(voices.entries())) if (id !== activeSourceId || !desiredSource) { voice.stop?.(); voice.media?.pause(); voices.delete(id); topologyRef.current = ""; }
    if (desiredSource && !voices.has(desiredSource.id)) {
      if (desiredSource.category === "local" && desiredSource.localUrl) { const media = new Audio(desiredSource.localUrl); media.loop = true; media.preload = "auto"; const mediaSource = context.createMediaElementSource(media); const output = context.createGain(); output.gain.value = .6; mediaSource.connect(output); voices.set(desiredSource.id, { output, media }); if (context.state === "running") void media.play(); }
      else voices.set(desiredSource.id, makeOfficialVoice(context, desiredSource));
      topologyRef.current = "";
    }
    const topology = `${activeSourceId}:${speakers.map((speaker) => speaker.id).sort().join("|")}`;
    if (topologyRef.current !== topology) { voices.forEach((voice) => { voice.output.disconnect(); speakers.forEach((speaker) => { const destination = speakerNodes.get(speaker.id); if (destination) voice.output.connect(destination.filter); }); }); topologyRef.current = topology; }
  }, [activeSourceId, listener, sources, speakers]);

  useEffect(() => { sync(); }, [sync]);
  const togglePlayback = useCallback(async () => { const context = ensureContext(); sync(); if (context.state === "suspended") { await context.resume(); voicesRef.current.forEach((voice) => void voice.media?.play()); setIsPlaying(true); return; } await context.suspend(); voicesRef.current.forEach((voice) => voice.media?.pause()); setIsPlaying(false); }, [ensureContext, sync]);
  useEffect(() => () => { voicesRef.current.forEach((voice) => { voice.stop?.(); voice.media?.pause(); }); void contextRef.current?.close(); }, []);
  return { isPlaying, togglePlayback };
}
