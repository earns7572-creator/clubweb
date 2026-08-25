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

const progress = (index: string, label: string) => <><span className="first-use-progress">{index} / 04 <i aria-hidden="true">───── ■ ■</i></span><strong>{label}</strong></>;
const Pointer = ({ direction }: { direction: "down" | "up" }) => <span className={`first-use-pointer first-use-pointer-${direction}`} aria-hidden="true" />;

export default function FirstUseOnboarding({ step, error, onChooseSweep, onChooseMusic, onSkip, onPlace }: Props) {
  const guideStep = step === "complete" ? "play" : step;
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
    <span className="first-use-focus-veil" aria-hidden="true" />
    <button className="first-use-skip" onClick={onSkip}>SKIP INTRO</button>
    {guideStep === "speaker" && <aside className="first-use-guide first-use-guide-library">{progress("01", "PICK A CABINET")}<span className="first-use-guide-secondary">CHOOSE ONE CABINET FROM THE LIBRARY</span><Pointer direction="down" /></aside>}
    {guideStep === "place" && <><span className="first-use-floor-frame" aria-hidden="true" /><span className="first-use-floor-target" aria-hidden="true" /><aside className="first-use-guide first-use-guide-place">{progress("02", "PLACE IT")}<span className="first-use-guide-secondary"><span className="desktop-copy">CLICK ANYWHERE ON THE FLOOR</span><span className="mobile-copy">TAP ANYWHERE ON THE FLOOR</span></span><Pointer direction="down" /></aside></>}
    {guideStep === "sound" && <aside className="first-use-guide first-use-guide-sound">{progress("03", "CHOOSE A SOUND")}<div className="first-use-sound-actions"><button onClick={onChooseSweep}>SINE SWEEP</button><button onClick={onChooseMusic}>YOUR MUSIC</button></div><small>YOUR FILE STAYS ON THIS DEVICE</small>{error && <p className="first-use-error">{error}</p>}</aside>}
    {guideStep === "play" && <aside className="first-use-guide first-use-guide-listen">{progress("04", "LISTEN")}<span className="first-use-guide-secondary">START THE SOUND SYSTEM</span><Pointer direction="up" />{error && <p className="first-use-error">{error}</p>}</aside>}
  </div>;
}
