/* SYSTM brand rule: approved gray horn and RGB signal pixels are used sparingly as the product mark, never as a decorative background. */
const systmLogoAsset = "/assets/brand/systm-mark-header.png";

type SystmLogoProps = {
  compact?: boolean;
};

export default function SystmLogo({ compact = false }: SystmLogoProps) {
  return (
    <span className={`systm-logo ${compact ? "is-compact" : ""}`} aria-label="SYSTM">
      <span className="systm-logo-mark" aria-hidden="true">
        <img src={systmLogoAsset} alt="" />
      </span>
      {!compact && <span className="systm-logo-word">SYSTM</span>}
    </span>
  );
}
