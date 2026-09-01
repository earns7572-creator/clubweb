import { SYSTM_MODE_LABELS, type SystmMode } from "@/lib/systmModes";

type Props = { onChoose: (mode: SystmMode) => void };

export default function SystmModeSelector({ onChoose }: Props) {
  return <main className="systm-mode-selector">
    <div className="systm-mode-selector-inner">
      <p className="systm-selector-brand">SYSTM</p>
      <div className="systm-mode-options" aria-label="Choose SYSTM mode">
        {(Object.entries(SYSTM_MODE_LABELS) as Array<[SystmMode, typeof SYSTM_MODE_LABELS[SystmMode]]>).map(([mode, copy], index) => <button key={mode} className="systm-mode-option" onClick={() => onChoose(mode)}>
          <span className="systm-mode-option-number">{String(index + 1).padStart(2, "0")}</span>
          <span><strong className="systm-mode-option-label">{copy.label}</strong><small className="systm-mode-option-descriptor">{copy.descriptor}</small></span>
        </button>)}
      </div>
    </div>
  </main>;
}
