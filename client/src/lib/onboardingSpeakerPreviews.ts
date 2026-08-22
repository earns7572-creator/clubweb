import type { SpeakerModelId } from "@/lib/speakerModels";

/** Static files committed under client/public/assets: modelId is the only preview lookup key. */
export const onboardingSpeakerPreviewByModel: Record<SpeakerModelId, string> = {
  "modern-sub": "/assets/onboarding/modern-sub.webp",
  "modern-woofer": "/assets/onboarding/modern-woofer.webp",
  "modern-full": "/assets/onboarding/modern-full.webp",
  "modern-mid": "/assets/onboarding/modern-mid.webp",
  "modern-high": "/assets/onboarding/modern-high.webp",
  "reggae-scoop": "/assets/onboarding/reggae-scoop.webp",
  "reggae-kick": "/assets/onboarding/reggae-kick.webp",
  "reggae-mid-horn": "/assets/onboarding/reggae-mid-horn.webp",
  "reggae-top": "/assets/onboarding/reggae-top.webp",
  "freeparty-wbin": "/assets/onboarding/freeparty-wbin.webp",
  "freeparty-kick-horn": "/assets/onboarding/freeparty-kick-horn.webp",
  "freeparty-mid-horn": "/assets/onboarding/freeparty-mid-horn.webp",
  "freeparty-top": "/assets/onboarding/freeparty-top.webp",
  "festival-sub": "/assets/onboarding/festival-sub.webp",
  "festival-line-array": "/assets/onboarding/festival-line-array.webp",
  "festival-front-fill": "/assets/onboarding/festival-front-fill.webp",
  "hifi-woofer": "/assets/onboarding/hifi-woofer.webp",
  "hifi-mid-horn": "/assets/onboarding/hifi-mid-horn.webp",
  "hifi-tweeter": "/assets/onboarding/hifi-tweeter.webp",
  "steppers-reflex-sub": "/assets/onboarding/steppers-reflex-sub.webp",
  "steppers-kick": "/assets/onboarding/steppers-kick.webp",
  "steppers-mid": "/assets/onboarding/steppers-mid.webp",
  "steppers-top": "/assets/onboarding/steppers-top.webp",
};
