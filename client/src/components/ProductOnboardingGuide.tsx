import {
  PRODUCT_ONBOARDING_COPY,
  PRODUCT_ONBOARDING_STEPS,
  productOnboardingIndex,
  type ProductOnboardingStep,
} from "@/lib/productOnboarding";
import type { SystmMode } from "@/lib/systmModes";
import "../product-onboarding.css";

type Props = {
  mode: SystmMode;
  step: ProductOnboardingStep;
  onSkip: () => void;
};

export default function ProductOnboardingGuide({ mode, step, onSkip }: Props) {
  const copy = PRODUCT_ONBOARDING_COPY[step];
  const index = productOnboardingIndex(mode, step);
  const total = PRODUCT_ONBOARDING_STEPS[mode].length;
  return (
    <div className={`product-guide product-guide-${step}`} aria-live="polite">
      <button className="product-guide-skip" type="button" onClick={onSkip}>
        SKIP INTRO
      </button>
      <aside className="product-guide-caption">
        <span>
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        <strong>{copy.verb}</strong>
        <small>{copy.hint}</small>
      </aside>
    </div>
  );
}
