/* SYSTM UI rule: approved horn signal brand, large direct commands and equipment shelf must never alter the audio graph or 3D scene state. */
import {
  memo,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  Headphones,
  Music2,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  type ClubListener,
  type ClubSource,
  type ClubSpeaker,
  useClubAudio,
} from "@/hooks/useClubAudio";
import ClubFloor3D, { type SurfaceTone } from "@/components/ClubFloor3D";
import SideScene from "@/components/SideScene";
import PovPreview from "@/components/PovPreview";
import SpeakerMixer from "@/components/SpeakerMixer";
import SpeakerCustomPanel from "@/components/SpeakerCustomPanel";
import ProductOnboardingGuide from "@/components/ProductOnboardingGuide";
import SystmModeSelector from "@/components/SystmModeSelector";
import {
  useSpeakerActivity,
  useSpeakerBandActivity,
  type ActivityStore,
  type BandActivityStore,
} from "@/lib/activityStore";
import { createDefaultEq, type SpeakerEq } from "@/lib/speakerEq";
import {
  createStackResolver,
  removeSpeakerFromStack,
  type StackAlignment,
} from "@/lib/speakerStacking";
import {
  detachSpeakerExplicitly,
  moveStackRoot,
  resolveStackRootId,
  rotateSpeakerWithoutDetach,
} from "@/lib/speakerInteraction";
import { yawToDegrees } from "@/lib/speakerOrientation";
import {
  CABINET_COLOR_PRESETS,
  DEFAULT_CABINET_COLOR,
  cabinetColorTargetIds,
  normalizeCabinetColor,
  type CabinetColorScope,
} from "@/lib/speakerCabinetColor";
import {
  defaultModelForKind,
  getSpeakerModel,
  modelIdsForFamily,
  orderedSpeakerFamilies,
  resolveModelId,
  type SpeakerFamily,
  type SpeakerModelId,
} from "@/lib/speakerModels";
import {
  CLUB_LAYOUTS,
  SOUND_SYSTEM_RECIPES,
  type SoundSystemRecipe,
  type SystemPreset,
} from "@/lib/systemPresets";
import {
  SYSTEM_RECIPES,
  type SystemRecipe,
} from "@/lib/systemRecipes";
import {
  createLayoutFile,
  layoutToClubSpeakers,
  layoutToPresetData,
  parseLayoutFile,
  serializeLayout,
} from "@/lib/layoutFile";
import { isSupportedMusicFile } from "@/lib/onboarding";
import {
  advanceProductOnboarding,
  autoAdvanceProductOnboarding,
  demoModeFromSearch,
  firstProductOnboardingStep,
  productOnboardingAutoDelay,
  type ProductOnboardingEvent,
} from "@/lib/productOnboarding";
import {
  loadSystmMode,
  persistSystmMode,
  SYSTM_MODE_LABELS,
  type SystmMode,
} from "@/lib/systmModes";
import {
  createInitialSceneStateMap,
  type SceneView as SystmSceneView,
  type SystmSceneState,
  type SystmSceneStateMap,
} from "@/lib/systmSceneState";
import "../club-floor-3d.css";
import "../floor-instrument.css";
import "../spatial-installation.css";
import "../three-views.css";
import "../dark-club.css";
import "../systm.css";
import "../mobile.css";
import "../product-experience.css";

type SceneView = SystmSceneView;
const SCENE_VIEWS: readonly SceneView[] = ["top", "side", "pov"];
type DesktopPanel =
  | "layout"
  | "speakers"
  | "recipe"
  | "cabinets"
  | "inspector"
  | "mix";
type HeaderPopover =
  | "mode"
  | "layout"
  | "recipe"
  | "sound"
  | "background"
  | "data"
  | null;
type HeaderPopoverChange = boolean | ((open: boolean) => boolean);
type Point = { x: number; y: number };
const logoMark = "/assets/brand/systm-mark-header.png";
const makeSpeaker = (
  id: string,
  modelId: SpeakerModelId,
  x: number,
  y: number,
  level: number
): ClubSpeaker => {
  const model = getSpeakerModel(modelId, "sub");
  return {
    id,
    modelId,
    kind: model.kind,
    label: model.label,
    position: { x, y, z: 0 },
    orientation: { yaw: 0 },
    stackParentId: null,
    cabinetColor: DEFAULT_CABINET_COLOR,
    level,
    muted: false,
    responseProfileId: modelId,
    activity: 0,
    eq: createDefaultEq(),
  };
};
const initialSpeakers: ClubSpeaker[] = [];
const listenerNameKey = "club-craft-listener-name";
const loadListenerName = () =>
  localStorage.getItem(listenerNameKey)?.trim().slice(0, 24) || "Listener";
const initialListener: ClubListener = {
  name: loadListenerName(),
  position: { x: 0.5, y: 0.72, z: 0.5 },
  orientation: { yaw: 0, pitch: 0 },
};
const clubTracks: ClubSource[] = [
  {
    id: "sweep",
    name: "Sine Sweep · 20 Hz ⇄ 20 kHz",
    category: "official",
    color: "#e7d64b",
  },
];
const gridSpawnPoints = [
  { x: 0.5, y: 0.5 },
  { x: 0.4167, y: 0.5 },
  { x: 0.5833, y: 0.5 },
  { x: 0.5, y: 0.5833 },
  { x: 0.5, y: 0.4167 },
];
const surfaceChoices: Array<{ id: SurfaceTone; label: string; color: string }> =
  [
    { id: "paper", label: "Paper", color: "#f6f4ee" },
    { id: "sand", label: "Sand", color: "#e9e1d4" },
    { id: "slate", label: "Slate", color: "#dde0dd" },
    { id: "night", label: "Night", color: "#050606" },
  ];
const clamp = (value: number) => Math.max(0.07, Math.min(0.93, value));
const clampPitch = (value: number) => Math.max(-1.12, Math.min(1.12, value));
const initialViewFromUrl = (): SceneView => {
  const requested = new URLSearchParams(window.location.search).get("view");
  return requested === "side" || requested === "pov" ? requested : "top";
};
const recipeStorageKey = "club-craft-current-recipe";
const onboardingCompleteKey = (mode: SystmMode) =>
  `systm-onboarding-complete:${mode}`;
const soundSystemLibraryFamilies: SpeakerFamily[] = [
  "reggae",
  "freeparty",
  "festival",
  "hifi",
  "steppers",
];

type ProjectionProps = {
  mode: SystmMode;
  view: SceneView;
  surfaceTone: SurfaceTone;
  speakers: ClubSpeaker[];
  listener: ClubListener;
  selectedSpeakerId: string;
  isPlaying: boolean;
  canRemove: boolean;
  activityStore: ActivityStore;
  lowActivityStore: ActivityStore;
  bandActivityStore: BandActivityStore;
  onSpeakerSelect: (id: string) => void;
  onSpeakerRemove: (id: string) => void;
  onSpeakerMoveTop: (id: string, position: Point) => void;
  onSpeakerMoveSide: (id: string, position: { y: number; z: number }) => void;
  onSpeakerRotate?: (id: string, yaw: number) => void;
  onSpeakerStack: (
    id: string,
    parentId: string,
    alignment: StackAlignment
  ) => void;
  onSpeakerDetach?: (id: string) => void;
  onListenerMove: (position: Point) => void;
  onListenerNameChange: (name: string) => void;
  onLook: (yaw: number, pitch: number) => void;
  onLookAbsolute: (yaw: number, pitch: number) => void;
  onFloorPlace?: (point: Point) => void;
};
const SceneProjection = memo(function SceneProjection({
  mode,
  view,
  surfaceTone,
  speakers,
  listener,
  selectedSpeakerId,
  isPlaying,
  canRemove,
  activityStore,
  lowActivityStore,
  bandActivityStore,
  onSpeakerSelect,
  onSpeakerRemove,
  onSpeakerMoveTop,
  onSpeakerMoveSide,
  onSpeakerRotate,
  onSpeakerStack,
  onListenerMove,
  onListenerNameChange,
  onLook,
  onLookAbsolute,
  onFloorPlace,
}: ProjectionProps) {
  const activityBySpeaker = useSpeakerActivity(activityStore);
  const lowActivityBySpeaker = useSpeakerActivity(lowActivityStore);
  const bandActivityBySpeaker = useSpeakerBandActivity(bandActivityStore);
  const rotate =
    onSpeakerRotate ??
    ((id: string, yaw: number) =>
      window.dispatchEvent(
        new CustomEvent("club-craft:speaker-rotate", { detail: { id, yaw } })
      ));
  return (
    <div className={`scene-surface surface-${surfaceTone}`} key={view}>
      {view === "top" && (
        <ClubFloor3D
          mode={mode}
          speakers={speakers}
          activityBySpeaker={activityBySpeaker}
          bandActivityBySpeaker={bandActivityBySpeaker}
          listener={listener}
          selectedSpeakerId={selectedSpeakerId}
          signalActive={isPlaying}
          surfaceTone={surfaceTone}
          canRemove={canRemove}
          showChannelLabels={mode === "club"}
          onSpeakerSelect={onSpeakerSelect}
          onSpeakerRemove={onSpeakerRemove}
          onSpeakerMove={onSpeakerMoveTop}
          onSpeakerRotate={rotate}
          onSpeakerStack={onSpeakerStack}
          onListenerMove={onListenerMove}
          onListenerNameChange={onListenerNameChange}
          onFloorPlace={onFloorPlace}
        />
      )}
      {view === "side" && (
        <SideScene
          speakers={speakers}
          activityBySpeaker={activityBySpeaker}
          listener={listener}
          selectedSpeakerId={selectedSpeakerId}
          canRemove={canRemove}
          onSpeakerSelect={onSpeakerSelect}
          onSpeakerRemove={onSpeakerRemove}
          onSpeakerMove={onSpeakerMoveSide}
        />
      )}
      {view === "pov" && (
        <PovPreview
          speakers={speakers}
          activityBySpeaker={activityBySpeaker}
          lowActivityBySpeaker={lowActivityBySpeaker}
          bandActivityBySpeaker={bandActivityBySpeaker}
          listener={listener}
          surfaceTone={mode === "sound-system" ? "slate" : surfaceTone}
          onLook={onLook}
          onLookAbsolute={onLookAbsolute}
        />
      )}
    </div>
  );
});

function FamilyLibrary({
  mode,
  family,
  onFamilyChange,
  onAdd,
  recipe,
}: {
  mode: SystmMode;
  family: SpeakerFamily;
  onFamilyChange: (family: SpeakerFamily) => void;
  onAdd: (id: SpeakerModelId) => void;
  recipe: SoundSystemRecipe | null;
}) {
  const allowedFamilies =
    mode === "club"
      ? orderedSpeakerFamilies().map(definition => definition.id)
      : soundSystemLibraryFamilies;
  const guideModelIds = recipe
    ? Array.from(
        new Set(
          recipe.sections.flatMap(section => section.recommendedModelIds)
        )
      )
    : [];
  const renderModel = (modelId: SpeakerModelId, index: number) => {
    const model = getSpeakerModel(modelId, "sub");
    return (
      <button
        key={modelId}
        data-slot={String(index + 1).padStart(2, "0")}
        className={`speaker-type-icon systm-equipment-item ${model.family} ${model.kind}`}
        onClick={() => onAdd(modelId)}
        aria-label={`Add ${model.label}`}
      >
        <i />
        <span>
          <b>{model.label}</b>
          <small>
            {model.band.toUpperCase()} / {model.kind.toUpperCase()}
          </small>
        </span>
        <Plus size={16} aria-hidden="true" />
      </button>
    );
  };
  return (
    <section
      className="speaker-composer speaker-library systm-library"
      aria-label={
        mode === "club" ? "Club speaker library" : "System cabinet library"
      }
    >
      <div className="systm-library-title">
        <span>{mode === "club" ? "SPEAKER LIBRARY" : "CABINET LIBRARY"}</span>
        <small>
          {mode === "club"
            ? "MODEL-CENTRIC / BUILD THE SPACE"
            : recipe
              ? `GUIDE / ${recipe.name}`
              : "FREE BUILD"}
        </small>
      </div>
      {recipe && (
        <div className="recipe-guide-row" aria-label="Recipe guide">
          <div className="library-section-label">
            <strong>RECIPE GUIDE</strong>
            <span>OPTIONAL PALETTE</span>
          </div>
          <div className="recipe-sections">
            {recipe.sections.map(section => (
              <div
                key={`${section.band}-${section.role}`}
                className="recipe-section"
              >
                <b>{section.band}</b>
                <span>{section.role}</span>
                {section.recommendedModelIds.map(modelId => (
                  <button
                    key={modelId}
                    onClick={() => onAdd(modelId)}
                    aria-label={`Add ${getSpeakerModel(modelId, "sub").label}`}
                  >
                    <Plus size={13} aria-hidden="true" /> ADD
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="library-section-label other-cabinets-label">
        <strong>{mode === "club" ? "ALL CABINETS" : "OTHER CABINETS"}</strong>
        <span>
          {mode === "club"
            ? "ADD ANY REGISTERED MODEL"
            : "GUIDE DOES NOT LIMIT THE BUILD"}
        </span>
      </div>
      <div
        className="family-switch scene-family-switch"
        role="tablist"
        aria-label="Speaker family"
      >
        {orderedSpeakerFamilies()
          .filter(definition => allowedFamilies.includes(definition.id))
          .map(definition => (
            <button
              key={definition.id}
              role="tab"
              aria-selected={family === definition.id}
              className={family === definition.id ? "active" : ""}
              onClick={() => onFamilyChange(definition.id)}
              title={definition.description}
            >
              {definition.shortLabel}
            </button>
          ))}
      </div>
      <div className="model-choices">
        {modelIdsForFamily(family)
          .filter(modelId => !guideModelIds.includes(modelId))
          .map((modelId, index) => renderModel(modelId, index))}
      </div>
    </section>
  );
}

const layoutCategory = (layout: SystemPreset) =>
  layout.id === "modern-four-point"
    ? "4 POINT"
    : layout.id === "festival-main-stage"
      ? "MAIN PA"
      : "LISTENING";

function ClubLayoutLibrary({
  onLoad,
  onFree,
}: {
  onLoad: (layout: SystemPreset) => void;
  onFree: () => void;
}) {
  return (
    <section className="club-layout-library" aria-label="Club layouts">
      <div>
        <span>LAYOUT SHELF</span>
        <small>BUILD THE SPACE</small>
      </div>
      <div className="club-layout-options">
        <button onClick={onFree}>
          <strong>FREE</strong>
          <small>EMPTY SPACE</small>
        </button>
        {CLUB_LAYOUTS.map(layout => (
          <button key={layout.id} onClick={() => onLoad(layout)}>
            <strong>{layoutCategory(layout)}</strong>
            <small>{layout.label}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecipeLibrary({
  currentRecipeId,
  onChoose,
  onFreeBuild,
}: {
  currentRecipeId: string | null;
  onChoose: (recipe: SystemRecipe) => void;
  onFreeBuild: () => void;
}) {
  return (
    <section
      className="preset-popover recipe-popover"
      role="dialog"
      aria-label="Recipe browser"
      onPointerDown={event => event.stopPropagation()}
    >
      <p>RECIPE / INGREDIENT GUIDE</p>
      <button className="recipe-free" onClick={onFreeBuild}>
        <strong>FREE BUILD</strong>
        <small>Start without a cabinet list</small>
      </button>
      {SOUND_SYSTEM_RECIPES.map(recipe => (
        <button
          key={recipe.id}
          className={`preset-choice recipe-choice ${currentRecipeId === recipe.id ? "active" : ""}`}
          onClick={() => onChoose(recipe)}
        >
          <strong>{recipe.name}</strong>
          <small>
            {recipe.sections
              .map(section => `${section.band} / ${section.role}`)
              .join(" · ")}
          </small>
        </button>
      ))}
    </section>
  );
}

type SpeakerInspectorProps = {
  speaker: ClubSpeaker;
  speakers: ClubSpeaker[];
  selectedStackMembers: ClubSpeaker[];
  inspectorModels: SpeakerModelId[];
  cabinetColorScope: CabinetColorScope;
  mobileOpen?: boolean;
  onCabinetColorScopeChange: (scope: CabinetColorScope) => void;
  onCabinetColorChange: (value: string) => void;
  onUpdateSpeaker: (update: Partial<ClubSpeaker>) => void;
  onSelectSpeaker: (id: string) => void;
  onRemoveSpeaker: () => void;
  onRotateSpeaker: (yaw: number) => void;
  onDetachSpeaker: () => void;
  onClose: () => void;
  onCustomOpen: () => void;
}

function SpeakerInspector({
  speaker,
  speakers,
  selectedStackMembers,
  inspectorModels,
  cabinetColorScope,
  mobileOpen = false,
  onCabinetColorScopeChange,
  onCabinetColorChange,
  onUpdateSpeaker,
  onSelectSpeaker,
  onRemoveSpeaker,
  onRotateSpeaker,
  onDetachSpeaker,
  onClose,
  onCustomOpen,
}: SpeakerInspectorProps) {
  const selectedModel = getSpeakerModel(speaker.modelId, speaker.kind);
  return (
    <aside
      className={`spatial-inspector ${mobileOpen ? "mobile-open" : ""}`}
      aria-label="Selected speaker"
    >
      <button
        className="mobile-inspector-close"
        onClick={onClose}
        aria-label="Close speaker controls"
      >
        ×
      </button>
      <button
        className="mobile-inspector-delete"
        disabled={speakers.length <= 1}
        onClick={onRemoveSpeaker}
        aria-label={`Delete ${selectedModel.label}`}
      >
        <Trash2 size={16} />
      </button>
      <h2>{selectedModel.label}</h2>
      <label className="spatial-control">
        <span>Model</span>
        <select
          value={resolveModelId(speaker.modelId, speaker.kind)}
          onChange={event =>
            onUpdateSpeaker({ modelId: event.target.value as SpeakerModelId })
          }
        >
          {inspectorModels.map(modelId => (
            <option key={modelId} value={modelId}>
              {getSpeakerModel(modelId, "sub").label}
            </option>
          ))}
        </select>
      </label>
      {selectedStackMembers.length > 1 && (
        <div className="stack-selector-block" aria-label="Stack selector">
          <div className="stack-selector-heading">
            STACK / {String(selectedStackMembers.length).padStart(2, "0")}
          </div>
          <label className="spatial-control">
            <span>Cabinet</span>
            <select
              value={speaker.id}
              onChange={event => onSelectSpeaker(event.target.value)}
            >
              {selectedStackMembers
                .slice()
                .reverse()
                .map(stackSpeaker => {
                  const stackNumber =
                    selectedStackMembers.findIndex(
                      member => member.id === stackSpeaker.id
                    ) + 1;
                  return (
                    <option key={stackSpeaker.id} value={stackSpeaker.id}>
                      {`${String(stackNumber).padStart(2, "0")} ${stackSpeaker.kind.toUpperCase()}`}
                    </option>
                  );
                })}
            </select>
          </label>
        </div>
      )}
      <section className="cabinet-color-control" aria-label="Cabinet color">
        <div className="cabinet-color-heading">
          <span>COLOR</span>
          <output>{normalizeCabinetColor(speaker.cabinetColor)}</output>
        </div>
        <div className="cabinet-color-presets">
          {CABINET_COLOR_PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              className={
                normalizeCabinetColor(speaker.cabinetColor) === preset.value
                  ? "active"
                  : ""
              }
              style={{ "--swatch": preset.value } as React.CSSProperties}
              onClick={() => onCabinetColorChange(preset.value)}
              aria-label={`Apply ${preset.label} cabinet color`}
              title={preset.label}
            >
              <i />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
        <div className="cabinet-custom-color">
          <label>
            <span>CUSTOM</span>
            <input
              type="color"
              value={normalizeCabinetColor(speaker.cabinetColor)}
              onChange={event => onCabinetColorChange(event.target.value)}
              aria-label="Custom cabinet color picker"
            />
          </label>
          <input
            type="text"
            value={normalizeCabinetColor(speaker.cabinetColor)}
            onChange={event => {
              if (/^#[0-9a-fA-F]{6}$/.test(event.target.value))
                onCabinetColorChange(event.target.value);
            }}
            aria-label="Custom cabinet hex color"
          />
        </div>
        <div className="cabinet-color-scope" aria-label="Apply color to">
          {(["this", "stack", "all"] as CabinetColorScope[]).map(scope => (
            <button
              key={scope}
              type="button"
              className={cabinetColorScope === scope ? "active" : ""}
              disabled={scope === "stack" && selectedStackMembers.length <= 1}
              onClick={() => onCabinetColorScopeChange(scope)}
            >
              {scope.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
      <label className="spatial-control">
        <span>Level</span>
        <input
          type="range"
          min=".02"
          max="1"
          step=".01"
          value={speaker.level}
          onChange={event => onUpdateSpeaker({ level: Number(event.target.value) })}
        />
      </label>
      {speaker.stackParentId ? (
        <p className="stacked-status">Stacked · drag moves the complete column</p>
      ) : (
        <label className="spatial-control height-control">
          <span>Height</span>
          <input
            type="range"
            min="0"
            max="1"
            step=".01"
            value={speaker.position.z}
            onChange={event =>
              onUpdateSpeaker({
                position: { ...speaker.position, z: Number(event.target.value) },
              })
            }
          />
          <div className="height-stops" aria-hidden="true">
            <span>Floor</span>
            <span>Ear</span>
            <span>High</span>
          </div>
        </label>
      )}
      <div className="mobile-turn-actions" aria-label="Mobile speaker rotation">
        <span>Turn</span>
        <button
          type="button"
          aria-label="Turn speaker left 15 degrees"
          onClick={() =>
            onRotateSpeaker((speaker.orientation?.yaw ?? 0) - Math.PI / 12)
          }
        >
          ↶
        </button>
        <output>{yawToDegrees(speaker.orientation?.yaw ?? 0)}°</output>
        <button
          type="button"
          aria-label="Turn speaker right 15 degrees"
          onClick={() =>
            onRotateSpeaker((speaker.orientation?.yaw ?? 0) + Math.PI / 12)
          }
        >
          ↷
        </button>
      </div>
      <div className="inspector-actions">
        <button
          className={speaker.muted ? "muted" : ""}
          onClick={() => onUpdateSpeaker({ muted: !speaker.muted })}
        >
          {speaker.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {speaker.muted ? "Unmute" : "Mute"}
        </button>
        <button onClick={onCustomOpen}>
          <SlidersHorizontal size={14} />
          Custom
        </button>
        {speaker.stackParentId && <button onClick={onDetachSpeaker}>Detach</button>}
      </div>
    </aside>
  );
}

type DesktopSidePanelProps = {
  mode: SystmMode;
  activePanel: DesktopPanel;
  speakers: ClubSpeaker[];
  selectedSpeakerId: string;
  selectedSpeaker?: ClubSpeaker;
  selectedStackMembers: ClubSpeaker[];
  inspectorModels: SpeakerModelId[];
  speakerFamily: SpeakerFamily;
  currentRecipeId: string | null;
  activityStore: ActivityStore;
  cabinetColorScope: CabinetColorScope;
  onPanelChange: (panel: DesktopPanel) => void;
  onClose: () => void;
  onFamilyChange: (family: SpeakerFamily) => void;
  onAdd: (modelId: SpeakerModelId) => void;
  onLoadLayout: (layout: SystemPreset) => void;
  onFreeLayout: () => void;
  onChooseRecipe: (recipe: SystemRecipe) => void;
  onFreeBuild: () => void;
  onCabinetColorScopeChange: (scope: CabinetColorScope) => void;
  onCabinetColorChange: (value: string) => void;
  onUpdateSpeaker: (update: Partial<ClubSpeaker>) => void;
  onSelectSpeaker: (id: string) => void;
  onRemoveSpeaker: () => void;
  onRotateSpeaker: (yaw: number) => void;
  onDetachSpeaker: () => void;
  onCustomOpen: () => void;
  onLevelsChange: (levels: Record<string, number>) => void;
  onMutedChange: (id: string, muted: boolean) => void;
};

function DesktopSidePanel({
  mode,
  activePanel,
  speakers,
  selectedSpeakerId,
  selectedSpeaker,
  selectedStackMembers,
  inspectorModels,
  speakerFamily,
  currentRecipeId,
  activityStore,
  cabinetColorScope,
  onPanelChange,
  onClose,
  onFamilyChange,
  onAdd,
  onLoadLayout,
  onFreeLayout,
  onChooseRecipe,
  onFreeBuild,
  onCabinetColorScopeChange,
  onCabinetColorChange,
  onUpdateSpeaker,
  onSelectSpeaker,
  onRemoveSpeaker,
  onRotateSpeaker,
  onDetachSpeaker,
  onCustomOpen,
  onLevelsChange,
  onMutedChange,
}: DesktopSidePanelProps) {
  const panelTabs: Array<{ id: DesktopPanel; label: string }> =
    mode === "club"
      ? [
          { id: "layout", label: "LAYOUT" },
          { id: "speakers", label: "SPEAKERS" },
          { id: "mix", label: "MIX" },
        ]
      : [
          { id: "recipe", label: "RECIPE" },
          { id: "cabinets", label: "CABINETS" },
          { id: "mix", label: "MIX" },
        ];
  if (selectedSpeaker) panelTabs.splice(2, 0, { id: "inspector", label: "INSPECTOR" });
  return (
    <aside
      className="desktop-side-panel"
      aria-label={`${SYSTM_MODE_LABELS[mode].label} side panel`}
    >
      <header className="desktop-side-panel-head">
        <div>
          <span>SYSTM / WORKSPACE</span>
          <h2>{SYSTM_MODE_LABELS[mode].descriptor}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close side panel">
          <X size={16} />
        </button>
      </header>
      <nav className="desktop-panel-tabs" aria-label="Workspace panels">
        {panelTabs.map(panel => (
          <button
            key={panel.id}
            type="button"
            className={activePanel === panel.id ? "active" : ""}
            onClick={() => onPanelChange(panel.id)}
          >
            {panel.label}
          </button>
        ))}
      </nav>
      <div className="desktop-panel-body">
        {activePanel === "layout" && mode === "club" && (
          <ClubLayoutLibrary onLoad={onLoadLayout} onFree={onFreeLayout} />
        )}
        {activePanel === "speakers" && mode === "club" && (
          <FamilyLibrary
            mode={mode}
            family={speakerFamily}
            onFamilyChange={onFamilyChange}
            onAdd={onAdd}
            recipe={null}
          />
        )}
        {activePanel === "recipe" && mode === "sound-system" && (
          <RecipeLibrary
            currentRecipeId={currentRecipeId}
            onChoose={onChooseRecipe}
            onFreeBuild={onFreeBuild}
          />
        )}
        {activePanel === "cabinets" && mode === "sound-system" && (
          <FamilyLibrary
            mode={mode}
            family={speakerFamily}
            onFamilyChange={onFamilyChange}
            onAdd={onAdd}
            recipe={SOUND_SYSTEM_RECIPES.find(recipe => recipe.id === currentRecipeId) ?? null}
          />
        )}
        {activePanel === "inspector" && selectedSpeaker && (
          <SpeakerInspector
            speaker={selectedSpeaker}
            speakers={speakers}
            selectedStackMembers={selectedStackMembers}
            inspectorModels={inspectorModels}
            cabinetColorScope={cabinetColorScope}
            onCabinetColorScopeChange={onCabinetColorScopeChange}
            onCabinetColorChange={onCabinetColorChange}
            onUpdateSpeaker={onUpdateSpeaker}
            onSelectSpeaker={onSelectSpeaker}
            onRemoveSpeaker={onRemoveSpeaker}
            onRotateSpeaker={onRotateSpeaker}
            onDetachSpeaker={onDetachSpeaker}
            onClose={onClose}
            onCustomOpen={onCustomOpen}
          />
        )}
        {activePanel === "inspector" && !selectedSpeaker && (
          <p className="desktop-panel-empty">SELECT A SPEAKER TO OPEN INSPECTOR</p>
        )}
        {activePanel === "mix" && (
          <div className="desktop-mixer-content">
            <SpeakerMixer
              open
              speakers={speakers}
              selectedSpeakerId={selectedSpeakerId}
              activityStore={activityStore}
              onOpenChange={open => {
                if (!open) onClose();
              }}
              onSpeakerSelect={onSelectSpeaker}
              onLevelsChange={onLevelsChange}
              onMutedChange={onMutedChange}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

type ExperienceProps = {
  mode: SystmMode;
  scene: SystmSceneState;
  onSceneChange: Dispatch<SetStateAction<SystmSceneState>>;
  onModeChange: (mode: SystmMode) => void;
};

function ExperienceWorkspace({
  mode,
  scene,
  onSceneChange,
  onModeChange,
}: ExperienceProps) {
  const isDemo = demoModeFromSearch(window.location.search) === mode;
  const [fileValidationError, setFileValidationError] = useState<string | null>(
    null
  );
  const {
    speakers,
    listener,
    selectedSpeakerId,
    view,
    speakerFamily,
    recipeId,
    modeOnboardingStep: onboardingStep,
  } = scene;
  const setSpeakers: Dispatch<SetStateAction<ClubSpeaker[]>> = update =>
    onSceneChange(current => ({
      ...current,
      speakers:
        typeof update === "function" ? update(current.speakers) : update,
    }));
  const setListener: Dispatch<SetStateAction<ClubListener>> = update =>
    onSceneChange(current => ({
      ...current,
      listener:
        typeof update === "function" ? update(current.listener) : update,
    }));
  const setSelectedSpeakerId = (id: string) =>
    onSceneChange(current => ({ ...current, selectedSpeakerId: id }));
  const setView = (nextView: SceneView) => {
    onSceneChange(current => ({ ...current, view: nextView }));
    if (nextView === "pov") advanceOnboarding("view-pov");
  };
  const setSpeakerFamily = (family: SpeakerFamily) =>
    onSceneChange(current => ({ ...current, speakerFamily: family }));
  const currentRecipeId = mode === "sound-system" ? recipeId : null;
  const setCurrentRecipeId = (nextRecipeId: string | null) =>
    onSceneChange(current => ({ ...current, recipeId: nextRecipeId }));
  const setOnboardingStep = (step: SystmSceneState["modeOnboardingStep"]) =>
    onSceneChange(current => ({ ...current, modeOnboardingStep: step }));
  const advanceOnboarding = (event: ProductOnboardingEvent) =>
    onSceneChange(current => ({
      ...current,
      modeOnboardingStep: advanceProductOnboarding(
        mode,
        current.modeOnboardingStep,
        event
      ),
    }));
  const [sources, setSources] = useState<ClubSource[]>(clubTracks);
  const [selectedSourceId, setSelectedSourceId] = useState("sweep");
  const [surfaceTone, setSurfaceTone] = useState<SurfaceTone>(
    () =>
      isDemo
        ? "paper"
        : (localStorage.getItem("club-craft-surface") as SurfaceTone) || "paper"
  );
  const [activeHeaderPopover, setActiveHeaderPopover] =
    useState<HeaderPopover>(null);
  const [layoutStatus, setLayoutStatus] = useState("");
  const [mixerOpen, setMixerOpenState] = useState(false);
  const [customOpen, setCustomOpenState] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel | null>(
    mode === "club" ? "layout" : "recipe"
  );
  const [cabinetColorScope, setCabinetColorScope] =
    useState<CabinetColorScope>("this");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layoutInputRef = useRef<HTMLInputElement>(null);
  const localUrlsRef = useRef(new Set<string>());
  const layoutStatusTimerRef = useRef<number | null>(null);
  const setHeaderPopover = (
    kind: Exclude<HeaderPopover, null>,
    next: HeaderPopoverChange
  ) =>
    setActiveHeaderPopover(current => {
      const shouldOpen =
        typeof next === "function" ? next(current === kind) : next;
      if (!shouldOpen) return null;
      return kind;
    });
  const showModePicker = activeHeaderPopover === "mode";
  const showSourcePicker = activeHeaderPopover === "sound";
  const showLayoutPicker = activeHeaderPopover === "layout";
  const showRecipePicker = activeHeaderPopover === "recipe";
  const showSurfacePicker = activeHeaderPopover === "background";
  const showLayoutMenu = activeHeaderPopover === "data";
  const setShowModePicker = (next: HeaderPopoverChange) =>
    setHeaderPopover("mode", next);
  const setShowSourcePicker = (next: HeaderPopoverChange) =>
    setHeaderPopover("sound", next);
  const setShowLayoutPicker = (next: HeaderPopoverChange) =>
    setHeaderPopover("layout", next);
  const setShowRecipePicker = (next: HeaderPopoverChange) =>
    setHeaderPopover("recipe", next);
  const setShowSurfacePicker = (next: HeaderPopoverChange) =>
    setHeaderPopover("background", next);
  const setShowLayoutMenu = (next: HeaderPopoverChange) =>
    setHeaderPopover("data", next);
  const openDesktopPanel = (panel: DesktopPanel) => {
    setDesktopPanel(panel);
    setMixerOpenState(false);
  };
  const openPanelOrPopover = (
    panel: DesktopPanel,
    setPopover: (next: HeaderPopoverChange) => void
  ) => {
    if (window.matchMedia("(min-width: 1121px)").matches) {
      setActiveHeaderPopover(null);
      openDesktopPanel(panel);
    } else {
      setPopover(open => !open);
    }
  };
  const setMixerOpen = (next: boolean) => {
    if (next) setActiveHeaderPopover(null);
    setMixerOpenState(next);
  };
  const setCustomOpen = (next: boolean) => {
    if (next) setActiveHeaderPopover(null);
    setCustomOpenState(next);
  };
  const {
    isPlaying,
    activityStore,
    lowActivityStore,
    bandActivityStore,
    togglePlayback,
    playbackError,
    clearPlaybackError,
  } = useClubAudio(speakers, listener, sources, selectedSourceId);
  useEffect(() => {
    if (!activeHeaderPopover) return;
    const closeFromOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".product-popover-owner")
      )
        return;
      setActiveHeaderPopover(null);
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveHeaderPopover(null);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [activeHeaderPopover]);
  useEffect(() => {
    if (mixerOpen || customOpen) setActiveHeaderPopover(null);
  }, [customOpen, mixerOpen]);
  const selectedSource =
    sources.find(source => source.id === selectedSourceId) ?? sources[0];
  const currentRecipe =
    SYSTEM_RECIPES.find(recipe => recipe.id === currentRecipeId) ?? null;
  const selectedSpeaker = speakers.find(
    speaker => speaker.id === selectedSpeakerId
  );
  const selectedModel = selectedSpeaker
    ? getSpeakerModel(selectedSpeaker.modelId, selectedSpeaker.kind)
    : null;
  const selectedStackMembers = (() => {
    if (!selectedSpeaker) return [];
    const resolver = createStackResolver(speakers);
    const rootId = resolveStackRootId(speakers, selectedSpeaker.id);
    return Array.from(resolver.getSubtreeIds(rootId))
      .map(id => resolver.byId.get(id))
      .filter((speaker): speaker is ClubSpeaker => Boolean(speaker));
  })();
  const moveSpeakerTop = (id: string, position: Point) => {
    setSpeakers(now => moveStackRoot(now, id, position));
    if (mode === "sound-system") advanceOnboarding("cabinet-moved");
  };
  const moveSpeakerSide = (id: string, position: { y: number; z: number }) =>
    setSpeakers(now =>
      now.map(speaker =>
        speaker.id === id && !speaker.stackParentId
          ? {
              ...speaker,
              position: {
                ...speaker.position,
                y: clamp(position.y),
                z: Math.max(0, Math.min(1, position.z)),
              },
            }
          : speaker
      )
    );
  const stackSpeaker = (
    id: string,
    parentId: string,
    alignment: StackAlignment
  ) => {
    setSpeakers(now => {
      const resolver = createStackResolver(now);
      const speaker = resolver.byId.get(id);
      const parent = resolver.byId.get(parentId);
      if (
        !speaker ||
        !parent ||
        id === parentId ||
        resolver.isDescendant(parentId, id)
      )
        return now;
      return now.map(item =>
        item.id === id
          ? {
              ...item,
              stackParentId: parentId,
              stackAlign: alignment,
              position: { ...item.position, z: 0 },
            }
          : item
      );
    });
    advanceOnboarding("cabinet-stacked");
  };
  const detachSpeaker = (id: string) =>
    setSpeakers(now => detachSpeakerExplicitly(now, id));
  const rotateSpeaker = (id: string, yaw: number) => {
    setSpeakers(now => rotateSpeakerWithoutDetach(now, id, yaw));
    advanceOnboarding("speaker-rotated");
  };
  const addSpeakerModel = (modelId: SpeakerModelId) => {
    if (speakers.length >= 16) return;
    const id = `${modelId}-${Date.now()}-${speakers.length}`;
    setSpeakers(now => {
      const point = gridSpawnPoints[now.length % gridSpawnPoints.length];
      return [...now, makeSpeaker(id, modelId, point.x, point.y, 0.68)];
    });
    setSelectedSpeakerId(id);
    setDesktopPanel("inspector");
    advanceOnboarding("cabinet-added");
  };
  const loadSystemPreset = (preset: SystemPreset) => {
    const now = Date.now();
    const idByKey = new Map<string, string>();
    const created = preset.speakers.map((item, index) => {
      const id = `${item.modelId}-${now}-${index}`;
      idByKey.set(item.key, id);
      const base = makeSpeaker(
        id,
        item.modelId,
        item.x ?? 0.5,
        item.y ?? 0.5,
        item.level
      );
      return {
        speaker: {
          ...base,
          position: { ...base.position, z: item.z ?? base.position.z },
          ...(item.yaw === undefined ? {} : { orientation: { yaw: item.yaw } }),
        },
        stackOn: item.stackOn,
        stackAlign: item.stackAlign,
      };
    });
    const resolved = created.map(({ speaker, stackOn, stackAlign }) => ({
      ...speaker,
      stackParentId: stackOn ? (idByKey.get(stackOn) ?? null) : null,
      ...(stackOn ? { stackAlign: stackAlign ?? "center" } : {}),
    }));
    setSpeakers(resolved);
    setSpeakerFamily(preset.family);
    setSelectedSpeakerId(resolved[0]?.id ?? "");
    setDesktopPanel("inspector");
    setMobileInspectorOpen(false);
    setActiveHeaderPopover(null);
    advanceOnboarding("layout-selected");
  };
  const loadClubLayout = loadSystemPreset;
  const startFreeClub = () => {
    setSpeakers([]);
    setSelectedSpeakerId("");
    setDesktopPanel("layout");
    setActiveHeaderPopover(null);
    advanceOnboarding("layout-selected");
  };
  const selectRecipe = (recipe: SystemRecipe) => {
    setCurrentRecipeId(recipe.id);
    setSpeakerFamily(
      getSpeakerModel(
        recipe.sections[0]?.recommendedModelIds[0],
        "sub"
      ).family
    );
    setDesktopPanel("cabinets");
    setActiveHeaderPopover(null);
    advanceOnboarding("recipe-selected");
  };
  const addLocalSound = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isSupportedMusicFile(file)) {
      setFileValidationError("MP3 or WAV files only.");
      return;
    }
    const id = `local-${Date.now()}`;
    const localUrl = URL.createObjectURL(file);
    localUrlsRef.current.add(localUrl);
    clearPlaybackError();
    setFileValidationError(null);
    setSources(now => [
      ...now,
      {
        id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: "local",
        color: "#797a73",
        localUrl,
      },
    ]);
    setSelectedSourceId(id);
    setShowSourcePicker(false);
  };
  useEffect(() => {
    const activeUrls = new Set(
      sources.flatMap(source => (source.localUrl ? [source.localUrl] : []))
    );
    localUrlsRef.current.forEach(url => {
      if (!activeUrls.has(url)) {
        URL.revokeObjectURL(url);
        localUrlsRef.current.delete(url);
      }
    });
  }, [sources]);
  useEffect(
    () => () => {
      localUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      localUrlsRef.current.clear();
      if (layoutStatusTimerRef.current)
        window.clearTimeout(layoutStatusTimerRef.current);
    },
    []
  );
  useEffect(() => {
    if (isDemo) return;
    localStorage.setItem("club-craft-surface", surfaceTone);
  }, [isDemo, surfaceTone]);
  useEffect(() => {
    if (mode !== "sound-system") return;
    if (currentRecipeId)
      localStorage.setItem(recipeStorageKey, currentRecipeId);
    else localStorage.removeItem(recipeStorageKey);
  }, [currentRecipeId, mode]);
  useEffect(() => {
    if (isPlaying) advanceOnboarding("playback-started");
  }, [isPlaying]);
  useEffect(() => {
    if (!isDemo || !onboardingStep) return;
    const next = autoAdvanceProductOnboarding(onboardingStep);
    if (next === undefined) return;
    const timer = window.setTimeout(
      () => setOnboardingStep(next),
      productOnboardingAutoDelay(onboardingStep)
    );
    return () => window.clearTimeout(timer);
  }, [isDemo, onboardingStep]);
  useEffect(() => {
    const rotate = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; yaw?: number }>)
        .detail;
      const id = detail?.id;
      const yaw = detail?.yaw;
      if (!id || typeof yaw !== "number") return;
      setSpeakers(now =>
        now.map(speaker =>
          speaker.id === id ? { ...speaker, orientation: { yaw } } : speaker
        )
      );
    };
    window.addEventListener("club-craft:speaker-rotate", rotate);
    return () =>
      window.removeEventListener("club-craft:speaker-rotate", rotate);
  }, []);
  const updateSpeaker = (update: Partial<ClubSpeaker>) => {
    if (!selectedSpeaker) return;
    setSpeakers(now =>
      now.map(speaker => {
        if (speaker.id !== selectedSpeaker.id) return speaker;
        const kind = update.kind ?? speaker.kind;
        const modelId = update.kind
          ? defaultModelForKind(update.kind)
          : resolveModelId(update.modelId ?? speaker.modelId, kind);
        const model = getSpeakerModel(modelId, kind);
        return {
          ...speaker,
          ...update,
          kind: model.kind,
          modelId,
          label: model.label,
          responseProfileId: modelId,
        };
      })
    );
  };
  const applyCabinetColor = (value: string) => {
    if (!selectedSpeaker) return;
    const color = normalizeCabinetColor(value);
    setSpeakers(now => {
      const targets = cabinetColorTargetIds(
        now,
        selectedSpeaker.id,
        cabinetColorScope
      );
      return now.map(speaker =>
        targets.has(speaker.id) ? { ...speaker, cabinetColor: color } : speaker
      );
    });
  };
  const updateSpeakerLevels = (levels: Record<string, number>) =>
    setSpeakers(now =>
      now.map(speaker =>
        levels[speaker.id] === undefined
          ? speaker
          : {
              ...speaker,
              level: Math.max(0.02, Math.min(1, levels[speaker.id])),
            }
      )
    );
  const updateSpeakerMute = (id: string, muted: boolean) =>
    setSpeakers(now =>
      now.map(speaker => (speaker.id === id ? { ...speaker, muted } : speaker))
    );
  const updateSpeakerEq = (id: string, eq: SpeakerEq) =>
    setSpeakers(now =>
      now.map(speaker => (speaker.id === id ? { ...speaker, eq } : speaker))
    );
  const resetSpeakerEq = (id: string) =>
    setSpeakers(now =>
      now.map(speaker =>
        speaker.id === id ? { ...speaker, eq: createDefaultEq() } : speaker
      )
    );
  const removeSpeaker = (id: string) => {
    if (speakers.length <= 1) return;
    setSpeakers(now => removeSpeakerFromStack(now, id));
    setSelectedSpeakerId(speakers.find(speaker => speaker.id !== id)?.id ?? "");
  };
  const showLayoutMessage = (message: string) => {
    setLayoutStatus(message);
    if (layoutStatusTimerRef.current)
      window.clearTimeout(layoutStatusTimerRef.current);
    layoutStatusTimerRef.current = window.setTimeout(
      () => setLayoutStatus(""),
      2600
    );
  };
  const exportLayout = () => {
    const json = serializeLayout({ speakers, listener, surfaceTone });
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "club-craft-layout.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setShowLayoutMenu(false);
    showLayoutMessage("Layout exported");
  };
  const importLayout = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const layout = parseLayoutFile(await file.text());
      const nextSpeakers = layoutToClubSpeakers(layout);
      setSpeakers(nextSpeakers);
      if (layout.listener)
        setListener(current => ({
          ...current,
          position: {
            x: layout.listener!.x,
            y: layout.listener!.y,
            z: layout.listener!.z,
          },
          orientation: {
            yaw: layout.listener!.yaw,
            pitch: layout.listener!.pitch,
          },
        }));
      if (layout.family) setSpeakerFamily(layout.family);
      if (layout.surfaceTone) setSurfaceTone(layout.surfaceTone);
      setSelectedSpeakerId(nextSpeakers[0]?.id ?? "");
      setMobileInspectorOpen(false);
      showLayoutMessage("Layout imported");
    } catch {
      showLayoutMessage("Layout import failed");
    }
  };
  const copyPresetData = async () => {
    try {
      const layout = createLayoutFile({ speakers });
      await navigator.clipboard.writeText(
        JSON.stringify(layoutToPresetData(layout), null, 2)
      );
      setShowLayoutMenu(false);
      showLayoutMessage("Preset data copied");
    } catch {
      showLayoutMessage("Preset copy failed");
    }
  };
  const chooseSource = (id: string) => {
    setSelectedSourceId(id);
    setShowSourcePicker(false);
  };
  const selectSpeaker = (id: string) => {
    setSelectedSpeakerId(id);
    setDesktopPanel("inspector");
    setMobileInspectorOpen(false);
  };
  const turnListener = (yaw: number, pitch: number) => {
    setListener(current => ({
      ...current,
      orientation: {
        yaw: current.orientation.yaw + yaw,
        pitch: clampPitch(current.orientation.pitch + pitch),
      },
    }));
    advanceOnboarding("listener-looked");
  };
  const setListenerLook = (yaw: number, pitch: number) => {
    setListener(current => ({
      ...current,
      orientation: { yaw, pitch: clampPitch(pitch) },
    }));
    advanceOnboarding("listener-looked");
  };
  const changeListenerName = (nextName: string) => {
    const name = nextName.trim().slice(0, 24) || "Listener";
    setListener(current => ({ ...current, name }));
    localStorage.setItem(listenerNameKey, name);
  };
  const finishOnboarding = () => {
    setOnboardingStep(null);
    if (!isDemo) localStorage.setItem(onboardingCompleteKey(mode), "1");
  };
  const restartIntro = () => {
    setFileValidationError(null);
    if (!isDemo) localStorage.removeItem(onboardingCompleteKey(mode));
    setOnboardingStep(firstProductOnboardingStep(mode));
  };
  const inspectorModels = orderedSpeakerFamilies().flatMap(family =>
    modelIdsForFamily(family.id)
  );
  return (
    <main
      className={`instrument-app product-experience product-mode-${mode} spatial-installation dark-club surface-${surfaceTone} scene-view-${view} onboarding-${onboardingStep ?? "idle"}`}
      data-mode={mode}
      data-systm-mode={mode}
      data-onboarding-step={onboardingStep ?? "complete"}
    >
      {onboardingStep && (
        <ProductOnboardingGuide
          mode={mode}
          step={onboardingStep}
          onSkip={finishOnboarding}
          isDemo={isDemo}
        />
      )}
      <header className="instrument-header">
        <div className="spatial-brand">
          <img src={logoMark} alt="SYSTM" />
          <span className="spatial-word">
            <b>SYSTM</b>
          </span>
          <small>{SYSTM_MODE_LABELS[mode].descriptor}</small>
        </div>
        <nav
          className="header-controls"
          aria-label={`${SYSTM_MODE_LABELS[mode].label} controls`}
        >
          <div className="product-popover-owner mode-control">
            <button
              className="product-header-control mode-trigger"
              onClick={() => setShowModePicker(open => !open)}
              aria-haspopup="dialog"
              aria-expanded={showModePicker}
            >
              <small>MODE</small>
              <strong>{SYSTM_MODE_LABELS[mode].label}</strong>
              <ChevronDown size={13} />
            </button>
            {showModePicker && (
              <section
                className="product-popover mode-popover"
                role="dialog"
                aria-label="Choose mode"
              >
                {(["club", "sound-system"] as SystmMode[]).map(
                  (item, index) => (
                    <button
                      key={item}
                      className={item === mode ? "active" : ""}
                      onClick={() => {
                        setActiveHeaderPopover(null);
                        onModeChange(item);
                      }}
                    >
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      <span>
                        <strong>{SYSTM_MODE_LABELS[item].label}</strong>
                        <small>{SYSTM_MODE_LABELS[item].descriptor}</small>
                      </span>
                    </button>
                  )
                )}
              </section>
            )}
          </div>

          {mode === "club" ? (
            <div className="product-popover-owner layout-control">
              <button
                className="product-header-control"
                onClick={() => openPanelOrPopover("layout", setShowLayoutPicker)}
                aria-haspopup="dialog"
                aria-expanded={showLayoutPicker}
              >
                <small>LAYOUT</small>
                <strong>SPACE</strong>
                <ChevronDown size={13} />
              </button>
              {showLayoutPicker && (
                <section
                  className="product-popover layout-browser"
                  role="dialog"
                  aria-label="Club layout browser"
                >
                  <p>LAYOUT / EXISTING SYSTEMS</p>
                  <button onClick={startFreeClub}>
                    <b>FREE</b>
                    <span>
                      <strong>EMPTY SPACE</strong>
                      <small>Start without a generated layout</small>
                    </span>
                  </button>
                  {CLUB_LAYOUTS.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => loadClubLayout(layout)}
                    >
                      <b>{layoutCategory(layout)}</b>
                      <span>
                        <strong>{layout.label}</strong>
                        <small>{layout.description}</small>
                      </span>
                    </button>
                  ))}
                </section>
              )}
            </div>
          ) : (
            <div className="product-popover-owner recipe-control">
              <button
                className="product-header-control"
                onClick={() => openPanelOrPopover("recipe", setShowRecipePicker)}
                aria-haspopup="dialog"
                aria-expanded={showRecipePicker}
              >
                <small>RECIPE</small>
                <strong>{currentRecipe?.name ?? "FREE BUILD"}</strong>
                <ChevronDown size={13} />
              </button>
              {showRecipePicker && (
                <RecipeLibrary
                  currentRecipeId={currentRecipeId}
                  onChoose={selectRecipe}
                  onFreeBuild={() => {
                    setCurrentRecipeId(null);
                    setDesktopPanel("cabinets");
                    setActiveHeaderPopover(null);
                    advanceOnboarding("recipe-selected");
                  }}
                />
              )}
            </div>
          )}

          <div className="product-popover-owner source-control">
            <button
              className="product-header-control"
              onClick={() => setShowSourcePicker(open => !open)}
              aria-haspopup="dialog"
              aria-expanded={showSourcePicker}
            >
              <small>SOUND</small>
              <strong>{selectedSource?.name ?? "CHOOSE"}</strong>
              <ChevronDown size={13} />
            </button>
            {showSourcePicker && (
              <section
                className="product-popover source-popover"
                role="dialog"
                aria-label="Choose sound"
              >
                <p className="source-popover-label">SOUND SOURCE</p>
                {sources.map(source => (
                  <button
                    key={source.id}
                    className={`source-choice ${source.id === selectedSourceId ? "active" : ""}`}
                    onClick={() => chooseSource(source.id)}
                  >
                    <i style={{ backgroundColor: source.color }} />
                    <span>
                      <strong>{source.name}</strong>
                      <small>
                        {source.category === "local"
                          ? "YOUR FILE"
                          : "SYSTM SOURCE"}
                      </small>
                    </span>
                    <Music2 size={13} />
                  </button>
                ))}
                <button
                  className="source-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={14} /> UPLOAD AUDIO
                </button>
                <p className="source-private">
                  <Headphones size={12} /> YOUR FILE STAYS ON THIS DEVICE
                </p>
              </section>
            )}
            <input
              ref={fileInputRef}
              className="hidden-input"
              type="file"
              accept="audio/*"
              onChange={addLocalSound}
            />
          </div>

          {mode === "club" && (
            <button
              className="product-header-control listener-trigger"
              onClick={() => setView("pov")}
            >
              <small>LISTENER</small>
              <strong>POV</strong>
            </button>
          )}

          <div className="product-popover-owner background-control technical-control">
            <button
              className="product-header-control"
              onClick={() => setShowSurfacePicker(open => !open)}
              aria-haspopup="dialog"
              aria-expanded={showSurfacePicker}
            >
              <Palette size={13} />
              <small>BACKGROUND</small>
            </button>
            {showSurfacePicker && (
              <section
                className="product-popover surface-popover"
                role="dialog"
                aria-label="Choose background"
              >
                {surfaceChoices.map(surface => (
                  <button
                    key={surface.id}
                    className={`surface-choice ${surfaceTone === surface.id ? "active" : ""}`}
                    onClick={() => {
                      setSurfaceTone(surface.id);
                      setActiveHeaderPopover(null);
                    }}
                  >
                    <i style={{ background: surface.color }} />
                    <span>{surface.label}</span>
                  </button>
                ))}
              </section>
            )}
          </div>
          <div className="product-popover-owner data-control technical-control">
            <button
              className="product-header-control"
              onClick={() => setShowLayoutMenu(open => !open)}
              aria-haspopup="dialog"
              aria-expanded={showLayoutMenu}
            >
              <small>DATA</small>
            </button>
            {showLayoutMenu && (
              <section
                className="product-popover layout-popover"
                role="dialog"
                aria-label="Layout data"
              >
                <button onClick={exportLayout}>EXPORT LAYOUT</button>
                <button onClick={() => layoutInputRef.current?.click()}>
                  IMPORT LAYOUT
                </button>
                <button onClick={() => void copyPresetData()}>
                  COPY PRESET DATA
                </button>
              </section>
            )}
            <input
              ref={layoutInputRef}
              className="hidden-input"
              type="file"
              accept=".json,application/json"
              onChange={event => void importLayout(event)}
            />
          </div>
        </nav>
        <div className="instrument-actions">
          <span className="headphone-note">
            <Headphones size={13} /> HEADPHONES
          </span>
          <button
            aria-label={isPlaying ? "Pause" : "Listen"}
            className={`instrument-play ${isPlaying ? "is-playing" : ""}`}
            onClick={() => void togglePlayback()}
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            {isPlaying ? "PAUSE" : "LISTEN"}
          </button>
        </div>
      </header>
      <section className="instrument-stage">
        <div className="desktop-scene-frame">
          <div className="view-switcher" aria-label="Scene view">
            {SCENE_VIEWS.map(item => (
              <button
                key={item}
                className={view === item ? "active" : ""}
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {layoutStatus && (
            <span className="layout-status" role="status">
              {layoutStatus}
            </span>
          )}
          {(playbackError || fileValidationError) && (
            <button
              className="local-audio-error"
              onClick={() => {
                clearPlaybackError();
                setFileValidationError(null);
              }}
              role="status"
            >
              {playbackError || fileValidationError}
              <X size={13} />
            </button>
          )}
          {speakers.length === 0 && view === "top" && (
            <div className="mode-empty-state" aria-live="polite">
              <span>{mode === "club" ? "CLUB" : "SOUND SYSTEM"}</span>
              <strong>
                {mode === "club"
                  ? "CHOOSE A LAYOUT"
                  : currentRecipe
                    ? "ADD A CABINET"
                    : "CHOOSE A RECIPE"}
              </strong>
            </div>
          )}
          <SceneProjection
            mode={mode}
            view={view}
            surfaceTone={surfaceTone}
            speakers={speakers}
            listener={listener}
            selectedSpeakerId={selectedSpeakerId}
            isPlaying={isPlaying}
            canRemove={speakers.length > 1}
            activityStore={activityStore}
            lowActivityStore={lowActivityStore}
            bandActivityStore={bandActivityStore}
            onSpeakerSelect={selectSpeaker}
            onSpeakerRemove={removeSpeaker}
            onSpeakerMoveTop={moveSpeakerTop}
            onSpeakerMoveSide={moveSpeakerSide}
            onSpeakerRotate={rotateSpeaker}
            onSpeakerStack={stackSpeaker}
            onListenerMove={position => {
              setListener(current => ({
                ...current,
                position: { ...current.position, ...position },
              }));
              advanceOnboarding("listener-moved");
            }}
            onListenerNameChange={changeListenerName}
            onLook={turnListener}
            onLookAbsolute={setListenerLook}
          />
          {view !== "pov" && (
            <div className="mobile-surface-controls">
              {mode === "club" ? (
                <>
                  <ClubLayoutLibrary
                    onLoad={loadClubLayout}
                    onFree={startFreeClub}
                  />
                  <FamilyLibrary
                    mode={mode}
                    family={speakerFamily}
                    onFamilyChange={setSpeakerFamily}
                    onAdd={addSpeakerModel}
                    recipe={null}
                  />
                </>
              ) : (
                <FamilyLibrary
                  mode={mode}
                  family={speakerFamily}
                  onFamilyChange={setSpeakerFamily}
                  onAdd={addSpeakerModel}
                  recipe={
                    SOUND_SYSTEM_RECIPES.find(
                      recipe => recipe.id === currentRecipeId
                    ) ?? null
                  }
                />
              )}
              {selectedSpeaker && selectedModel && (
                <>
                  <button
                    className="mobile-speaker-edit"
                    onClick={() => setMobileInspectorOpen(true)}
                    aria-label={`Edit ${selectedModel.label}`}
                  >
                    Edit
                  </button>
                  <SpeakerInspector
                    speaker={selectedSpeaker}
                    speakers={speakers}
                    selectedStackMembers={selectedStackMembers}
                    inspectorModels={inspectorModels}
                    cabinetColorScope={cabinetColorScope}
                    mobileOpen={mobileInspectorOpen}
                    onCabinetColorScopeChange={setCabinetColorScope}
                    onCabinetColorChange={applyCabinetColor}
                    onUpdateSpeaker={updateSpeaker}
                    onSelectSpeaker={selectSpeaker}
                    onRemoveSpeaker={() => removeSpeaker(selectedSpeaker.id)}
                    onRotateSpeaker={yaw =>
                      rotateSpeaker(selectedSpeaker.id, yaw)
                    }
                    onDetachSpeaker={() => detachSpeaker(selectedSpeaker.id)}
                    onClose={() => setMobileInspectorOpen(false)}
                    onCustomOpen={() => setCustomOpen(true)}
                  />
                </>
              )}
            </div>
          )}
        </div>
        {desktopPanel && (
          <DesktopSidePanel
            mode={mode}
            activePanel={desktopPanel}
            speakers={speakers}
            selectedSpeakerId={selectedSpeakerId}
            selectedSpeaker={selectedSpeaker}
            selectedStackMembers={selectedStackMembers}
            inspectorModels={inspectorModels}
            speakerFamily={speakerFamily}
            currentRecipeId={currentRecipeId}
            activityStore={activityStore}
            cabinetColorScope={cabinetColorScope}
            onCabinetColorChange={applyCabinetColor}
            onPanelChange={openDesktopPanel}
            onClose={() => setDesktopPanel(null)}
            onFamilyChange={setSpeakerFamily}
            onAdd={addSpeakerModel}
            onLoadLayout={loadClubLayout}
            onFreeLayout={startFreeClub}
            onChooseRecipe={selectRecipe}
            onFreeBuild={() => {
              setCurrentRecipeId(null);
              setDesktopPanel("cabinets");
              setActiveHeaderPopover(null);
              advanceOnboarding("recipe-selected");
            }}
            onCabinetColorScopeChange={setCabinetColorScope}
            onUpdateSpeaker={updateSpeaker}
            onSelectSpeaker={selectSpeaker}
            onRemoveSpeaker={() =>
              selectedSpeaker && removeSpeaker(selectedSpeaker.id)
            }
            onRotateSpeaker={yaw =>
              selectedSpeaker && rotateSpeaker(selectedSpeaker.id, yaw)
            }
            onDetachSpeaker={() =>
              selectedSpeaker && detachSpeaker(selectedSpeaker.id)
            }
            onCustomOpen={() => setCustomOpen(true)}
            onLevelsChange={updateSpeakerLevels}
            onMutedChange={updateSpeakerMute}
          />
        )}
        {!desktopPanel && (
          <button
            className="desktop-panel-open"
            type="button"
            onClick={() => openDesktopPanel(mode === "club" ? "speakers" : "cabinets")}
          >
            OPEN PANEL
          </button>
        )}
      </section>
      <button
        className={`mixer-trigger ${mixerOpen ? "is-open" : ""}`}
        onClick={() => setMixerOpen(true)}
      >
        Mix
      </button>
      <footer className="instrument-footer">
        <button
          onClick={() => {
            setSpeakers(initialSpeakers);
            setListener({ ...initialListener, name: loadListenerName() });
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </footer>
      <SpeakerMixer
        open={mixerOpen}
        speakers={speakers}
        selectedSpeakerId={selectedSpeakerId}
        activityStore={activityStore}
        onOpenChange={setMixerOpen}
        onSpeakerSelect={selectSpeaker}
        onLevelsChange={updateSpeakerLevels}
        onMutedChange={updateSpeakerMute}
      />
      <SpeakerCustomPanel
        open={customOpen}
        speakers={speakers}
        speaker={selectedSpeaker}
        onOpenChange={setCustomOpen}
        onSpeakerSelect={selectSpeaker}
        onEqChange={updateSpeakerEq}
        onReset={resetSpeakerEq}
      />
      {!onboardingStep && (
        <button className="intro-reset" onClick={restartIntro}>
          INTRO
        </button>
      )}
    </main>
  );
}

function ClubExperience(props: Omit<ExperienceProps, "mode">) {
  return <ExperienceWorkspace {...props} mode="club" />;
}

function SoundSystemExperience(props: Omit<ExperienceProps, "mode">) {
  return <ExperienceWorkspace {...props} mode="sound-system" />;
}

function SystmShell() {
  const demoMode = demoModeFromSearch(window.location.search);
  const [mode, setMode] = useState<SystmMode | null>(
    () => demoMode ?? loadSystmMode()
  );
  const [scenes, setScenes] = useState<SystmSceneStateMap>(() => {
    const initial = createInitialSceneStateMap(loadListenerName());
    const onboardingStep = (nextMode: SystmMode) =>
      demoMode === nextMode ||
      localStorage.getItem(onboardingCompleteKey(nextMode)) !== "1"
        ? firstProductOnboardingStep(nextMode)
        : null;
    return {
      club: {
        ...initial.club,
        view: initialViewFromUrl(),
        modeOnboardingStep: onboardingStep("club"),
      },
      "sound-system": {
        ...initial["sound-system"],
        speakerFamily: "reggae",
        recipeId: demoMode ? null : localStorage.getItem(recipeStorageKey),
        modeOnboardingStep: onboardingStep("sound-system"),
      },
    };
  });
  const chooseMode = (nextMode: SystmMode) => {
    persistSystmMode(nextMode);
    setMode(nextMode);
  };
  if (!mode) return <SystmModeSelector onChoose={chooseMode} />;
  const experienceProps = {
    scene: scenes[mode],
    onSceneChange: (update: SetStateAction<SystmSceneState>) =>
      setScenes(current => ({
        ...current,
        [mode]: typeof update === "function" ? update(current[mode]) : update,
      })),
    onModeChange: chooseMode,
  };
  return mode === "club" ? (
    <ClubExperience {...experienceProps} />
  ) : (
    <SoundSystemExperience {...experienceProps} />
  );
}

export default function Home() {
  return <SystmShell />;
}
