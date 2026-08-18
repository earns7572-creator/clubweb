/**
 * Acoustic Topography implementation note:
 * This hook keeps Web Audio behind the tactile Floor View. It models a sound as
 * a source routed through virtual speaker filters and PannerNodes to headphones.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type SpeakerKind = "sub" | "woofer" | "full" | "mid" | "high";

export type ClubSpeaker = {
  id: string;
  kind: SpeakerKind;
  label: string;
  x: number;
  y: number;
  level: number;
};

export type ClubSource = {
  id: string;
  name: string;
  category: "official" | "local";
  color: string;
  localUrl?: string;
};

type Voice = {
  output: GainNode;
  stop?: () => void;
  media?: HTMLAudioElement;
};

type SpeakerNode = {
  filter: BiquadFilterNode;
  gain: GainNode;
  panner: PannerNode;
};

const filterForKind: Record<SpeakerKind, { type: BiquadFilterType; frequency: number; q: number }> = {
  sub: { type: "lowpass", frequency: 110, q: 0.8 },
  woofer: { type: "lowpass", frequency: 460, q: 0.62 },
  full: { type: "allpass", frequency: 1000, q: 0.3 },
  mid: { type: "bandpass", frequency: 1600, q: 0.6 },
  high: { type: "highpass", frequency: 3600, q: 0.7 },
};

const toneForOfficialSound: Record<string, number> = {
  pulse: 55,
  rain: 196,
  bronze: 146,
};

function makeOfficialVoice(context: AudioContext, source: ClubSource): Voice {
  const output = context.createGain();
  output.gain.value = 0.24;
  const osc = context.createOscillator();
  const overtone = context.createOscillator();
  const lowpass = context.createBiquadFilter();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  const fundamental = toneForOfficialSound[source.id] ?? 110;

  osc.type = source.id === "rain" ? "sine" : "triangle";
  osc.frequency.value = fundamental;
  overtone.type = "sine";
  overtone.frequency.value = fundamental * (source.id === "bronze" ? 2.01 : 1.5);
  overtone.detune.value = source.id === "bronze" ? 7 : -4;
  lowpass.type = "lowpass";
  lowpass.frequency.value = source.id === "pulse" ? 380 : 1150;
  lowpass.Q.value = 0.4;
  lfo.frequency.value = source.id === "pulse" ? 1.7 : 0.16;
  lfoGain.gain.value = source.id === "pulse" ? 120 : 26;

  osc.connect(lowpass);
  overtone.connect(lowpass);
  lowpass.connect(output);
  lfo.connect(lfoGain);
  lfoGain.connect(lowpass.frequency);
  osc.start();
  overtone.start();
  lfo.start();

  return {
    output,
    stop: () => {
      osc.stop();
      overtone.stop();
      lfo.stop();
      output.disconnect();
    },
  };
}

export function useClubAudio(
  speakers: ClubSpeaker[],
  listener: { x: number; y: number },
  sources: ClubSource[],
  routes: string[],
) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef(new Map<string, Voice>());
  const speakerNodesRef = useRef(new Map<string, SpeakerNode>());
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const context = new AudioContext();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.gain.value = 0.82;
    compressor.threshold.value = -18;
    compressor.ratio.value = 5;
    master.connect(compressor);
    compressor.connect(context.destination);
    contextRef.current = context;
    masterRef.current = master;
    return context;
  }, []);

  const sync = useCallback(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;

    const speakerNodes = speakerNodesRef.current;
    for (const [id, node] of Array.from(speakerNodes.entries())) {
      if (!speakers.some((speaker) => speaker.id === id)) {
        node.filter.disconnect();
        node.gain.disconnect();
        node.panner.disconnect();
        speakerNodes.delete(id);
      }
    }

    speakers.forEach((speaker) => {
      let node = speakerNodes.get(speaker.id);
      if (!node) {
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        const panner = context.createPanner();
        panner.panningModel = "HRTF";
        panner.distanceModel = "inverse";
        panner.refDistance = 1.2;
        panner.maxDistance = 12;
        panner.rolloffFactor = 0.85;
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(master);
        node = { filter, gain, panner };
        speakerNodes.set(speaker.id, node);
      }
      const config = filterForKind[speaker.kind];
      node.filter.type = config.type;
      node.filter.frequency.setTargetAtTime(config.frequency, context.currentTime, 0.04);
      node.filter.Q.setTargetAtTime(config.q, context.currentTime, 0.04);
      node.gain.gain.setTargetAtTime(Math.max(0.02, speaker.level), context.currentTime, 0.04);
      node.panner.positionX.setTargetAtTime((speaker.x - 0.5) * 9, context.currentTime, 0.04);
      node.panner.positionY.setTargetAtTime(0, context.currentTime, 0.04);
      node.panner.positionZ.setTargetAtTime((speaker.y - 0.5) * 9, context.currentTime, 0.04);
    });

    context.listener.positionX.setTargetAtTime((listener.x - 0.5) * 8, context.currentTime, 0.04);
    context.listener.positionY.setTargetAtTime(0, context.currentTime, 0.04);
    context.listener.positionZ.setTargetAtTime((listener.y - 0.5) * 8, context.currentTime, 0.04);

    const voices = voicesRef.current;
    for (const [id, voice] of Array.from(voices.entries())) {
      if (!sources.some((source) => source.id === id)) {
        voice.stop?.();
        voice.media?.pause();
        voices.delete(id);
      }
    }

    sources.forEach((source) => {
      if (!voices.has(source.id)) {
        if (source.category === "local" && source.localUrl) {
          const media = new Audio(source.localUrl);
          media.loop = true;
          media.preload = "auto";
          const mediaSource = context.createMediaElementSource(media);
          const output = context.createGain();
          output.gain.value = 0.6;
          mediaSource.connect(output);
          voices.set(source.id, { output, media });
        } else {
          voices.set(source.id, makeOfficialVoice(context, source));
        }
      }
    });

    voices.forEach((voice, sourceId) => {
      voice.output.disconnect();
      speakers.forEach((speaker) => {
        if (routes.includes(`${sourceId}:${speaker.id}`)) {
          const destination = speakerNodes.get(speaker.id);
          if (destination) voice.output.connect(destination.filter);
        }
      });
    });
  }, [listener.x, listener.y, routes, sources, speakers]);

  useEffect(() => {
    sync();
  }, [sync]);

  const togglePlayback = useCallback(async () => {
    const context = ensureContext();
    sync();
    if (context.state === "suspended") {
      await context.resume();
      voicesRef.current.forEach((voice) => void voice.media?.play());
      setIsPlaying(true);
      return;
    }
    await context.suspend();
    voicesRef.current.forEach((voice) => voice.media?.pause());
    setIsPlaying(false);
  }, [ensureContext, sync]);

  useEffect(() => {
    return () => {
      voicesRef.current.forEach((voice) => {
        voice.stop?.();
        voice.media?.pause();
      });
      void contextRef.current?.close();
    };
  }, []);

  return { isPlaying, togglePlayback };
}
