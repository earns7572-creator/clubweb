/* SYSTM onboarding rule: keep the Scene, existing SYSTEM LIBRARY, Header SOUND, and LISTEN control as the instrument; guidance only marks the next action. */
import { useEffect } from "react";
import type { SpeakerFamily, SpeakerModelId } from "@/lib/speakerModels";
import type { OnboardingStep } from "@/lib/onboarding";
import "../first-use-onboarding.css";

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

const progress = (index: string, label: string) => <><span className="first-use-progress">{index} / 04 <i aria-hidden="true">■ ■</i></span><strong>{label}</strong></>;

export default function FirstUseOnboarding({ step, error, onChooseSweep, onChooseMusic, onSkip, onPlace }: Props) {
  useEffect(() => {
    if (step !== "place") return;
    const placeFromFloorCanvas = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const canvas = event.target.closest(".club-floor-3d canvas");
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      onPlace({ x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height });
    };
    window.addEventListener("pointerdown", placeFromFloorCanvas);
    return () => window.removeEventListener("pointerdown", placeFromFloorCanvas);
  }, [onPlace, step]);
  return <div className={`first-use-onboarding first-use-${step}`} aria-live="polite">
    {step !== "complete" && <button className="first-use-skip" onClick={onSkip}>SKIP INTRO</button>}
    {step === "speaker" && <aside className="first-use-guide first-use-guide-library">{progress("01", "PICK A CABINET")}</aside>}
    {step === "place" && <aside className="first-use-guide first-use-guide-place">{progress("02", "PLACE IT")}<small><span className="desktop-copy">CLICK THE FLOOR</span><span className="mobile-copy">TAP THE FLOOR</span></small></aside>}
    {step === "sound" && <aside className="first-use-guide first-use-guide-sound">{progress("03", "CHOOSE A SOUND")}<div className="first-use-sound-actions"><button onClick={onChooseSweep}>SINE SWEEP</button><button onClick={onChooseMusic}>YOUR MUSIC</button></div><small>YOUR FILE STAYS ON THIS DEVICE</small>{error && <p className="first-use-error">{error}</p>}</aside>}
    {step === "play" && <aside className="first-use-guide first-use-guide-listen">{progress("04", "LISTEN")}{error && <p className="first-use-error">{error}</p>}</aside>}
    {step === "complete" && <aside className="first-use-complete">BUILD YOUR SYSTEM</aside>}
  </div>;
}
