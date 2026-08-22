import { Play } from "lucide-react";
import { getSpeakerModel, modelIdsForFamily, orderedSpeakerFamilies, type SpeakerFamily, type SpeakerModelId } from "@/lib/speakerModels";
import type { OnboardingStep } from "@/lib/onboarding";
import { onboardingSpeakerPreviewByModel } from "@/lib/onboardingSpeakerPreviews";
import "../first-use-onboarding.css";

const bandLabel = { sub: "Low bass", woofer: "Punch", full: "Full range", mid: "Midrange", high: "High frequencies" } as const;

type Props = {
  step: OnboardingStep;
  family: SpeakerFamily;
  error: string | null;
  onFamilyChange: (family: SpeakerFamily) => void;
  onModelChoose: (modelId: SpeakerModelId) => void;
  onChooseSweep: () => void;
  onChooseMusic: () => void;
  onPlay: () => void;
  onSkip: () => void;
  onPlace: (point: { x: number; y: number }) => void;
};

export default function FirstUseOnboarding({ step, family, error, onFamilyChange, onModelChoose, onChooseSweep, onChooseMusic, onPlay, onSkip, onPlace }: Props) {
  return <div className={`first-use-onboarding first-use-${step}`} aria-live="polite" onPointerDown={(event) => { if (step !== "place" || event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); onPlace({ x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height }); }}>
    <section className="first-use-panel">
      {step !== "complete" && <button className="first-use-skip" onClick={onSkip}>SKIP</button>}
      {step === "speaker" && <>
        <p className="first-use-eyebrow">FIRST LISTEN</p><h1>CHOOSE A SPEAKER</h1><p className="first-use-lede">Start with one cabinet. You can build from there.</p>
        <div className="first-use-families">{orderedSpeakerFamilies().map((item) => <button key={item.id} className={family === item.id ? "active" : ""} onClick={() => onFamilyChange(item.id)}>{item.shortLabel}</button>)}</div>
        <div className="first-use-model-grid">{modelIdsForFamily(family).map((modelId) => { const model = getSpeakerModel(modelId, "sub"); return <button key={modelId} data-model-id={modelId} className={`first-use-model-card ${model.family}`} onClick={() => onModelChoose(modelId)}><span className="first-use-model-preview"><img src={onboardingSpeakerPreviewByModel[modelId]} alt="" decoding="async" draggable={false} /></span><span className="first-use-model-copy"><strong>{model.shortLabel}</strong><small>{bandLabel[model.kind]}</small></span></button>; })}</div>
      </>}
      {step === "place" && <><p className="first-use-eyebrow">ONE SPEAKER</p><h1>PLACE YOUR SPEAKER</h1><p className="first-use-lede"><span className="desktop-copy">Click on the floor</span><span className="mobile-copy">Tap on the floor</span></p></>}
      {step === "sound" && <><p className="first-use-eyebrow">NEXT</p><h1>CHOOSE A SOUND</h1><div className="first-use-sound-grid"><button className="first-use-sound-card" onClick={onChooseSweep}><strong>SINE SWEEP</strong><span>20 Hz ⇄ 20 kHz</span></button><button className="first-use-sound-card" onClick={onChooseMusic}><strong>YOUR MUSIC</strong><span>Choose a track from your device</span><small>MP3, WAV only</small></button></div>{error && <p className="first-use-error">{error}</p>}</>}
      {step === "play" && <><p className="first-use-eyebrow">READY</p><button className="first-use-play" onClick={onPlay}><Play fill="currentColor" size={21} /> PLAY</button><p className="first-use-lede">Hear your speaker</p>{error && <p className="first-use-error">{error}</p>}</>}
      {step === "complete" && <><p className="first-use-eyebrow">CLUB CRAFT</p><h1>BUILD YOUR SYSTEM</h1></>}
    </section>
  </div>;
}
