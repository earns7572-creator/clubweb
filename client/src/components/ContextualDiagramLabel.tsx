import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { getSpeakerModel } from "@/lib/speakerModels";
import { yawToDegrees } from "@/lib/speakerOrientation";

type LabelVariant = "top" | "side";

type SpeakerLabelProps = {
  speaker: ClubSpeaker;
  stackCount?: number;
  supportOnBlock?: boolean;
  variant: LabelVariant;
  yawCue?: number;
};

export function ContextualSpeakerLabel({
  speaker,
  stackCount = 1,
  supportOnBlock = false,
  variant,
  yawCue,
}: SpeakerLabelProps) {
  const model = getSpeakerModel(speaker.modelId, speaker.kind);
  const stackText = stackCount > 1 ? `STACK ×${stackCount}` : null;
  const supportText = supportOnBlock ? "BLOCK SUPPORT" : null;

  return (
    <span
      className={`contextual-diagram-label contextual-diagram-speaker contextual-diagram-${variant}`}
      data-contextual-diagram="speaker"
      aria-label={`${model.label}, ${model.band}${stackText ? `, ${stackText}` : ""}${supportText ? `, ${supportText}` : ""}`}
    >
      <i className="contextual-diagram-rule" aria-hidden="true" />
      <span className="contextual-diagram-copy">
        <b>{model.label}</b>
        <small>
          {model.band.toUpperCase()}
          {stackText ? ` · ${stackText}` : ""}
          {supportText ? ` · ${supportText}` : ""}
        </small>
      </span>
      {yawCue !== undefined && (
        <output className="contextual-diagram-yaw">
          {yawToDegrees(yawCue)}°
        </output>
      )}
    </span>
  );
}

export function ContextualBlockLabel({
  stackCount = 1,
  variant,
}: {
  stackCount?: number;
  variant: LabelVariant;
}) {
  return (
    <span
      className={`contextual-diagram-label contextual-diagram-block contextual-diagram-${variant}`}
      data-contextual-diagram="block"
      aria-label={`BLOCK${stackCount > 1 ? `, stack of ${stackCount}` : ""}`}
    >
      <i className="contextual-diagram-rule" aria-hidden="true" />
      <span className="contextual-diagram-copy">
        <b>BLOCK</b>
        {stackCount > 1 && <small>×{stackCount}</small>}
      </span>
    </span>
  );
}
