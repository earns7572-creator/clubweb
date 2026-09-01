/* SYSTM UI rule: approved horn signal brand, large direct commands and equipment shelf must never alter the audio graph or 3D scene state. */
import { memo, type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { ChevronDown, Headphones, Music2, Palette, Pause, Play, Plus, RotateCcw, SlidersHorizontal, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { type ClubListener, type ClubSource, type ClubSpeaker, useClubAudio } from "@/hooks/useClubAudio";
import ClubFloor3D, { type SurfaceTone } from "@/components/ClubFloor3D";
import SideScene from "@/components/SideScene";
import PovPreview from "@/components/PovPreview";
import SpeakerMixer from "@/components/SpeakerMixer";
import SpeakerCustomPanel from "@/components/SpeakerCustomPanel";
import SystmLogo from "@/components/SystmLogo";
import FirstUseOnboarding from "@/components/FirstUseOnboarding";
import SystmModeSelector from "@/components/SystmModeSelector";
import { useSpeakerActivity, useSpeakerBandActivity, type ActivityStore, type BandActivityStore } from "@/lib/activityStore";
import { createDefaultEq, type SpeakerEq } from "@/lib/speakerEq";
import { createStackResolver, removeSpeakerFromStack, type StackAlignment } from "@/lib/speakerStacking";
import { detachSpeakerExplicitly, moveStackRoot, resolveStackRootId, rotateSpeakerWithoutDetach } from "@/lib/speakerInteraction";
import { resolvePhysicalCollisions } from "@/lib/physicalPlacement";
import { yawToDegrees } from "@/lib/speakerOrientation";
import { defaultModelForKind, getSpeakerModel, modelIdsForFamily, orderedSpeakerFamilies, resolveModelId, type SpeakerFamily, type SpeakerModelId } from "@/lib/speakerModels";
import { CLUB_LAYOUTS, SOUND_SYSTEM_RECIPES, SYSTEM_PRESETS, type SoundSystemRecipe, type SystemPreset } from "@/lib/systemPresets";
import { SYSTEM_RECIPES, getMissingRecipeIngredients, getRecipeProgress, type RecipeProgress, type SystemRecipe } from "@/lib/systemRecipes";
import { createMaterialStagingPlan } from "@/lib/recipeMaterials";
import { createLayoutFile, layoutToClubSpeakers, layoutToPresetData, parseLayoutFile, serializeLayout } from "@/lib/layoutFile";
import { isSupportedMusicFile, type OnboardingStep } from "@/lib/onboarding";
import { loadSystmMode, persistSystmMode, SYSTM_MODE_LABELS, type SystmMode } from "@/lib/systmModes";
import { createInitialSceneStateMap, type SceneView as SystmSceneView, type SystmSceneState, type SystmSceneStateMap } from "@/lib/systmSceneState";
import "../club-floor-3d.css";
import "../floor-instrument.css";
import "../spatial-installation.css";
import "../three-views.css";
import "../dark-club.css";
import "../systm.css";
import "../mobile.css";

type SceneView = SystmSceneView;
type HeaderPopover = "sound" | "system" | "background" | "layout" | null;
type HeaderPopoverChange = boolean | ((open: boolean) => boolean);
type Point = { x: number; y: number };
const logoMark = "/assets/brand/systm-mark-header.png";
const makeSpeaker = (id: string, modelId: SpeakerModelId, x: number, y: number, level: number): ClubSpeaker => { const model = getSpeakerModel(modelId, "sub"); return { id, modelId, kind: model.kind, label: model.label, position: { x, y, z: 0 }, orientation: { yaw: 0 }, stackParentId: null, level, muted: false, responseProfileId: modelId, activity: 0, eq: createDefaultEq() }; };
const initialSpeakers: ClubSpeaker[] = [];
const listenerNameKey = "club-craft-listener-name";
const loadListenerName = () => localStorage.getItem(listenerNameKey)?.trim().slice(0, 24) || "Listener";
const initialListener: ClubListener = { name: loadListenerName(), position: { x: .5, y: .72, z: .5 }, orientation: { yaw: 0, pitch: 0 } };
const clubTracks: ClubSource[] = [{ id: "sweep", name: "Sine Sweep · 20 Hz ⇄ 20 kHz", category: "official", color: "#e7d64b" }];
const gridSpawnPoints = [{ x: .5, y: .5 }, { x: .4167, y: .5 }, { x: .5833, y: .5 }, { x: .5, y: .5833 }, { x: .5, y: .4167 }];
const surfaceChoices: Array<{ id: SurfaceTone; label: string; color: string }> = [{ id: "paper", label: "Paper", color: "#f6f4ee" }, { id: "sand", label: "Sand", color: "#e9e1d4" }, { id: "slate", label: "Slate", color: "#dde0dd" }, { id: "night", label: "Night", color: "#050606" }];
const clamp = (value: number) => Math.max(.07, Math.min(.93, value));
const clampPitch = (value: number) => Math.max(-1.12, Math.min(1.12, value));
const initialViewFromUrl = (): SceneView => { const requested = new URLSearchParams(window.location.search).get("view"); return requested === "side" || requested === "pov" ? requested : "top"; };
const recipeStorageKey = "club-craft-current-recipe";

type ProjectionProps = { view: SceneView; surfaceTone: SurfaceTone; speakers: ClubSpeaker[]; listener: ClubListener; selectedSpeakerId: string; isPlaying: boolean; canRemove: boolean; materialStaging?: boolean; activityStore: ActivityStore; lowActivityStore: ActivityStore; bandActivityStore: BandActivityStore; onSpeakerSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMoveTop: (id: string, position: Point) => void; onSpeakerMoveSide: (id: string, position: { y: number; z: number }) => void; onSpeakerRotate?: (id: string, yaw: number) => void; onSpeakerStack: (id: string, parentId: string, alignment: StackAlignment) => void; onSpeakerDetach?: (id: string) => void; onListenerMove: (position: Point) => void; onListenerNameChange: (name: string) => void; onLook: (yaw: number, pitch: number) => void; onLookAbsolute: (yaw: number, pitch: number) => void; onFloorPlace?: (point: Point) => void };
const SceneProjection = memo(function SceneProjection({ view, surfaceTone, speakers, listener, selectedSpeakerId, isPlaying, canRemove, materialStaging, activityStore, lowActivityStore, bandActivityStore, onSpeakerSelect, onSpeakerRemove, onSpeakerMoveTop, onSpeakerMoveSide, onSpeakerRotate, onSpeakerStack, onListenerMove, onListenerNameChange, onLook, onLookAbsolute, onFloorPlace }: ProjectionProps) { const activityBySpeaker = useSpeakerActivity(activityStore); const lowActivityBySpeaker = useSpeakerActivity(lowActivityStore); const bandActivityBySpeaker = useSpeakerBandActivity(bandActivityStore); const rotate = onSpeakerRotate ?? ((id: string, yaw: number) => window.dispatchEvent(new CustomEvent("club-craft:speaker-rotate", { detail: { id, yaw } }))); return <div className={`scene-surface surface-${surfaceTone}`} key={view}>{view === "top" && <ClubFloor3D speakers={speakers} activityBySpeaker={activityBySpeaker} bandActivityBySpeaker={bandActivityBySpeaker} listener={listener} selectedSpeakerId={selectedSpeakerId} signalActive={isPlaying} surfaceTone={surfaceTone} canRemove={canRemove} materialStaging={materialStaging} onSpeakerSelect={onSpeakerSelect} onSpeakerRemove={onSpeakerRemove} onSpeakerMove={onSpeakerMoveTop} onSpeakerRotate={rotate} onSpeakerStack={onSpeakerStack} onListenerMove={onListenerMove} onListenerNameChange={onListenerNameChange} onFloorPlace={onFloorPlace} />}{view === "side" && <SideScene speakers={speakers} activityBySpeaker={activityBySpeaker} listener={listener} selectedSpeakerId={selectedSpeakerId} canRemove={canRemove} onSpeakerSelect={onSpeakerSelect} onSpeakerRemove={onSpeakerRemove} onSpeakerMove={onSpeakerMoveSide} />}{view === "pov" && <PovPreview speakers={speakers} activityBySpeaker={activityBySpeaker} lowActivityBySpeaker={lowActivityBySpeaker} bandActivityBySpeaker={bandActivityBySpeaker} listener={listener} surfaceTone={surfaceTone} onLook={onLook} onLookAbsolute={onLookAbsolute} />}</div>; });

function FamilyLibrary({ family, onFamilyChange, onAdd, recipe, recipeProgress }: { family: SpeakerFamily; onFamilyChange: (family: SpeakerFamily) => void; onAdd: (id: SpeakerModelId) => void; recipe: SoundSystemRecipe | null; recipeProgress: RecipeProgress | null }) {
  const requiredModelIds = recipe?.ingredients.map((ingredient) => ingredient.modelId) ?? [];
  const models = modelIdsForFamily(family).sort((left, right) => Number(!requiredModelIds.includes(left)) - Number(!requiredModelIds.includes(right)));
  return <section className="speaker-composer speaker-library systm-library" aria-label="System library">
    <div className="systm-library-title"><span>CABINET LIBRARY</span><small>{recipe ? `RECIPE / ${recipe.name}` : "FREE BUILD"}</small></div>
    <div className="family-switch scene-family-switch" role="tablist" aria-label="Speaker family">
      {orderedSpeakerFamilies().map((definition) => <button key={definition.id} role="tab" aria-selected={family === definition.id} className={family === definition.id ? "active" : ""} onClick={() => onFamilyChange(definition.id)} title={definition.description}>{definition.shortLabel}</button>)}
    </div>
    <div className="model-choices">
      {models.map((modelId, index) => { const model = getSpeakerModel(modelId, "sub"); const ingredient = recipeProgress?.ingredients.find((item) => item.modelId === modelId); return <button key={modelId} data-slot={String(index + 1).padStart(2, "0")} className={`speaker-type-icon systm-equipment-item ${model.family} ${model.kind} ${ingredient ? "recipe-required" : ""}`} onClick={() => onAdd(modelId)} aria-label={`Add ${model.label}`} title={`Add ${model.label}`}><i /><span><b>{model.shortLabel}</b><small>{ingredient ? `required ×${ingredient.required}` : model.kind}</small></span><Plus size={14} aria-hidden="true" /></button>; })}
    </div>
  </section>;
}

function ClubLayoutLibrary({ onLoad }: { onLoad: (layout: SystemPreset) => void }) {
  return <section className="club-layout-library" aria-label="Club layouts">
    <div><span>LAYOUT TOOLS</span><small>SPATIAL SPEAKER LAYOUTS</small></div>
    <div className="club-layout-options">{CLUB_LAYOUTS.map((layout) => <button key={layout.id} onClick={() => onLoad(layout)}><strong>{layout.label}</strong><small>{layout.description}</small></button>)}</div>
  </section>;
}

function RecipeLibrary({ currentRecipeId, recipeDetail, onChoose, onFreeBuild, onPrepare, onBack }: { currentRecipeId: string | null; recipeDetail: SystemRecipe | null; onChoose: (recipe: SystemRecipe) => void; onFreeBuild: () => void; onPrepare: () => void; onBack: () => void }) {
  if (recipeDetail) return <section className="preset-popover recipe-popover" role="dialog" aria-label="Recipe browser" onPointerDown={(event) => event.stopPropagation()}><button className="recipe-back" onClick={onBack}>RECIPES</button><p>RECIPE</p><strong>{recipeDetail.name}</strong><small>{recipeDetail.description}</small><div className="recipe-ingredients">{recipeDetail.ingredients.map((ingredient) => <div key={ingredient.modelId}><b>{String(ingredient.quantity).padStart(2, "0")}</b><span>{getSpeakerModel(ingredient.modelId, "sub").shortLabel}</span></div>)}</div>{recipeDetail.suggestedLayout?.towers && <small className="recipe-hint">SUGGESTED TOWERS · {recipeDetail.suggestedLayout.towers}</small>}<button className="preset-load recipe-prepare" onClick={onPrepare}>PREPARE MATERIALS</button></section>;
  return <section className="preset-popover recipe-popover" role="dialog" aria-label="Recipe browser" onPointerDown={(event) => event.stopPropagation()}><p>RECIPE</p><button className="recipe-free" onClick={onFreeBuild}><strong>FREE BUILD</strong><small>No active recipe</small></button>{SOUND_SYSTEM_RECIPES.map((recipe) => <button key={recipe.id} className={`preset-choice recipe-choice ${currentRecipeId === recipe.id ? "active" : ""}`} onClick={() => onChoose(recipe)}><strong>{recipe.name}</strong><small>{recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.quantity, 0)} CABINETS</small></button>)}</section>;
}

type ExperienceProps = { mode: SystmMode; scene: SystmSceneState; onSceneChange: Dispatch<SetStateAction<SystmSceneState>>; onModeChange: (mode: SystmMode) => void };

function ExperienceWorkspace({ mode, scene, onSceneChange, onModeChange }: ExperienceProps) {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(mode === "sound-system" ? "speaker" : null);
  const [onboardingModel, setOnboardingModel] = useState<SpeakerModelId | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const { speakers, listener, selectedSpeakerId, view, speakerFamily, recipeId } = scene;
  const setSpeakers: Dispatch<SetStateAction<ClubSpeaker[]>> = (update) => onSceneChange((current) => ({ ...current, speakers: typeof update === "function" ? update(current.speakers) : update }));
  const setListener: Dispatch<SetStateAction<ClubListener>> = (update) => onSceneChange((current) => ({ ...current, listener: typeof update === "function" ? update(current.listener) : update }));
  const setSelectedSpeakerId = (id: string) => onSceneChange((current) => ({ ...current, selectedSpeakerId: id }));
  const setView = (nextView: SceneView) => onSceneChange((current) => ({ ...current, view: nextView }));
  const setSpeakerFamily = (family: SpeakerFamily) => onSceneChange((current) => ({ ...current, speakerFamily: family }));
  const currentRecipeId = mode === "sound-system" ? recipeId : null;
  const setCurrentRecipeId = (nextRecipeId: string | null) => onSceneChange((current) => ({ ...current, recipeId: nextRecipeId }));
  const [sources, setSources] = useState<ClubSource[]>(clubTracks);
  const [selectedSourceId, setSelectedSourceId] = useState("sweep");
  const [surfaceTone, setSurfaceTone] = useState<SurfaceTone>(() => (localStorage.getItem("club-craft-surface") as SurfaceTone) || "paper");
  const [activeHeaderPopover, setActiveHeaderPopover] = useState<HeaderPopover>(null);
  const [layoutStatus, setLayoutStatus] = useState("");
  const [recipeDetailId, setRecipeDetailId] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<SystemPreset | null>(null);
  const [mixerOpen, setMixerOpenState] = useState(false);
  const [customOpen, setCustomOpenState] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layoutInputRef = useRef<HTMLInputElement>(null);
  const localUrlsRef = useRef(new Set<string>());
  const layoutStatusTimerRef = useRef<number | null>(null);
  const setHeaderPopover = (kind: Exclude<HeaderPopover, null>, next: HeaderPopoverChange) => setActiveHeaderPopover((current) => {
    const shouldOpen = typeof next === "function" ? next(current === kind) : next;
    if (!shouldOpen) return null;
    if (kind === "sound" && onboardingStep === "sound") return current;
    return kind;
  });
  const showSourcePicker = activeHeaderPopover === "sound";
  const showPresetPicker = activeHeaderPopover === "system";
  const showSurfacePicker = activeHeaderPopover === "background";
  const showLayoutMenu = activeHeaderPopover === "layout";
  const setShowSourcePicker = (next: HeaderPopoverChange) => setHeaderPopover("sound", next);
  const setShowPresetPicker = (next: HeaderPopoverChange) => setHeaderPopover("system", next);
  const setShowSurfacePicker = (next: HeaderPopoverChange) => setHeaderPopover("background", next);
  const setShowLayoutMenu = (next: HeaderPopoverChange) => setHeaderPopover("layout", next);
  const setMixerOpen = (next: boolean) => { if (next) setActiveHeaderPopover(null); setMixerOpenState(next); };
  const setCustomOpen = (next: boolean) => { if (next) setActiveHeaderPopover(null); setCustomOpenState(next); };
  const { isPlaying, activityStore, lowActivityStore, bandActivityStore, togglePlayback, playbackError, clearPlaybackError } = useClubAudio(speakers, listener, sources, selectedSourceId);
  useEffect(() => {
    if (!activeHeaderPopover) return;
    const closeFromOutside = (event: PointerEvent) => { if (event.target instanceof Element && event.target.closest(".source-trigger-wrap, .preset-trigger-wrap, .surface-trigger-wrap, .layout-trigger-wrap")) return; setActiveHeaderPopover(null); };
    const closeFromEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveHeaderPopover(null); };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => { document.removeEventListener("pointerdown", closeFromOutside); document.removeEventListener("keydown", closeFromEscape); };
  }, [activeHeaderPopover]);
  useEffect(() => { if (mixerOpen || customOpen || onboardingStep === "sound") setActiveHeaderPopover(null); }, [customOpen, mixerOpen, onboardingStep]);
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0]; const currentRecipe = SYSTEM_RECIPES.find((recipe) => recipe.id === currentRecipeId) ?? null; const recipeDetail = SYSTEM_RECIPES.find((recipe) => recipe.id === recipeDetailId) ?? null; const recipeProgress = currentRecipe ? getRecipeProgress(currentRecipe, speakers) : null; const selectedSpeaker = speakers.find((speaker) => speaker.id === selectedSpeakerId); const selectedModel = selectedSpeaker ? getSpeakerModel(selectedSpeaker.modelId, selectedSpeaker.kind) : null;
  const selectedStackMembers = (() => { if (!selectedSpeaker) return []; const resolver = createStackResolver(speakers); const rootId = resolveStackRootId(speakers, selectedSpeaker.id); return Array.from(resolver.getSubtreeIds(rootId)).map((id) => resolver.byId.get(id)).filter((speaker): speaker is ClubSpeaker => Boolean(speaker)); })();
  const moveSpeakerTop = (id: string, position: Point) => setSpeakers((now) => moveStackRoot(now, id, position));
  const moveSpeakerSide = (id: string, position: { y: number; z: number }) => setSpeakers((now) => now.map((speaker) => speaker.id === id && !speaker.stackParentId ? { ...speaker, position: { ...speaker.position, y: clamp(position.y), z: Math.max(0, Math.min(1, position.z)) } } : speaker));
  const stackSpeaker = (id: string, parentId: string, alignment: StackAlignment) => setSpeakers((now) => { const resolver = createStackResolver(now); const speaker = resolver.byId.get(id); const parent = resolver.byId.get(parentId); if (!speaker || !parent || id === parentId || resolver.isDescendant(parentId, id)) return now; return now.map((item) => item.id === id ? { ...item, stackParentId: parentId, stackAlign: alignment, position: { ...item.position, z: 0 } } : item); });
  const detachSpeaker = (id: string) => setSpeakers((now) => detachSpeakerExplicitly(now, id));
  const rotateSpeaker = (id: string, yaw: number) => setSpeakers((now) => rotateSpeakerWithoutDetach(now, id, yaw));
  const addSpeakerModel = (modelId: SpeakerModelId) => { if (onboardingStep === "speaker") { chooseOnboardingModel(modelId); return; } if (speakers.length >= 16) return; const id = `${modelId}-${Date.now()}-${speakers.length}`; setSpeakers((now) => { const point = gridSpawnPoints[now.length % gridSpawnPoints.length]; return [...now, makeSpeaker(id, modelId, point.x, point.y, .68)]; }); setSelectedSpeakerId(id); };
  const loadSystemPreset = (preset: SystemPreset) => { const now = Date.now(); const idByKey = new Map<string, string>(); const created = preset.speakers.map((item, index) => { const id = `${item.modelId}-${now}-${index}`; idByKey.set(item.key, id); const base = makeSpeaker(id, item.modelId, item.x ?? .5, item.y ?? .5, item.level); return { speaker: { ...base, position: { ...base.position, z: item.z ?? base.position.z }, ...(item.yaw === undefined ? {} : { orientation: { yaw: item.yaw } }) }, stackOn: item.stackOn, stackAlign: item.stackAlign }; }); const resolved = created.map(({ speaker, stackOn, stackAlign }) => ({ ...speaker, stackParentId: stackOn ? idByKey.get(stackOn) ?? null : null, ...(stackOn ? { stackAlign: stackAlign ?? "center" } : {}) })); setSpeakers(resolved); setSpeakerFamily(preset.family); setSelectedSpeakerId(resolved[0]?.id ?? ""); setMobileInspectorOpen(false); setPendingPreset(null); setShowPresetPicker(false); };
  const loadClubLayout = loadSystemPreset;
  const selectRecipe = (recipe: SystemRecipe) => { setCurrentRecipeId(recipe.id); setRecipeDetailId(recipe.id); setSpeakerFamily(getSpeakerModel(recipe.ingredients[0]?.modelId, "sub").family); };
  const prepareRecipeMaterials = () => {
    if (!currentRecipe) return;
    const missing = getMissingRecipeIngredients(currentRecipe, speakers);
    if (missing.length === 0) { setShowPresetPicker(false); showLayoutMessage(`INGREDIENTS ${recipeProgress?.ingredients.reduce((sum, item) => sum + item.placed, 0) ?? 0} / ${recipeProgress?.ingredients.reduce((sum, item) => sum + item.required, 0) ?? 0}`); return; }
    const additions = missing.slice(0, Math.max(0, 16 - speakers.length)); const plans = createMaterialStagingPlan(additions); const now = Date.now(); let next = speakers.slice();
    plans.forEach((plan, index) => { const id = `${plan.modelId}-${now}-${index}`; const base = makeSpeaker(id, plan.modelId, plan.x, plan.y, .68); const collisionScene = [...next, base]; const resolved = resolvePhysicalCollisions({ speakers: collisionScene, movingRootId: id, requestedRootPoint: { x: plan.x, y: plan.y }, previousRootPoint: { x: plan.x, y: plan.y } }); const model = getSpeakerModel(plan.modelId, base.kind); const xLimit = Math.max(.03, Math.min(.47, .5 - model.body.width / 26)); const yLimit = Math.max(.03, Math.min(.47, .5 - model.body.depth / 16)); const point = { x: Math.max(xLimit, Math.min(1 - xLimit, resolved.point.x)), y: Math.max(yLimit, Math.min(1 - yLimit, resolved.point.y)) }; next = [...next, { ...base, position: { ...base.position, x: point.x, y: point.y }, orientation: { yaw: 0 }, stackParentId: null }]; });
    setSpeakers(next); setSelectedSpeakerId(next[next.length - additions.length]?.id ?? ""); setShowPresetPicker(false); setMobileInspectorOpen(false); if (additions.length < missing.length) showLayoutMessage("MATERIAL CAPACITY REACHED");
  };
  const addLocalSound = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!isSupportedMusicFile(file)) { setFileValidationError("MP3 or WAV files only."); return; } const id = `local-${Date.now()}`; const localUrl = URL.createObjectURL(file); localUrlsRef.current.add(localUrl); clearPlaybackError(); setFileValidationError(null); setSources((now) => [...now, { id, name: file.name.replace(/\.[^/.]+$/, ""), category: "local", color: "#797a73", localUrl }]); setSelectedSourceId(id); setShowSourcePicker(false); if (onboardingStep) setOnboardingStep("play"); };
  useEffect(() => { const activeUrls = new Set(sources.flatMap((source) => source.localUrl ? [source.localUrl] : [])); localUrlsRef.current.forEach((url) => { if (!activeUrls.has(url)) { URL.revokeObjectURL(url); localUrlsRef.current.delete(url); } }); }, [sources]);
  useEffect(() => () => { localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); localUrlsRef.current.clear(); if (layoutStatusTimerRef.current) window.clearTimeout(layoutStatusTimerRef.current); }, []); useEffect(() => { localStorage.setItem("club-craft-surface", surfaceTone); }, [surfaceTone]); useEffect(() => { if (mode !== "sound-system") return; if (currentRecipeId) localStorage.setItem(recipeStorageKey, currentRecipeId); else localStorage.removeItem(recipeStorageKey); }, [currentRecipeId, mode]); useEffect(() => { if (onboardingStep === "play" && isPlaying) setOnboardingStep("complete"); }, [isPlaying, onboardingStep]); useEffect(() => { if (onboardingStep !== "complete") return; const timer = window.setTimeout(() => setOnboardingStep(null), 420); return () => window.clearTimeout(timer); }, [onboardingStep]); useEffect(() => { const rotate = (event: Event) => { const detail = (event as CustomEvent<{ id?: string; yaw?: number }>).detail; const id = detail?.id; const yaw = detail?.yaw; if (!id || typeof yaw !== "number") return; setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, orientation: { yaw } } : speaker)); }; window.addEventListener("club-craft:speaker-rotate", rotate); return () => window.removeEventListener("club-craft:speaker-rotate", rotate); }, []);
  const updateSpeaker = (update: Partial<ClubSpeaker>) => { if (!selectedSpeaker) return; setSpeakers((now) => now.map((speaker) => { if (speaker.id !== selectedSpeaker.id) return speaker; const kind = update.kind ?? speaker.kind; const modelId = update.kind ? defaultModelForKind(update.kind) : resolveModelId(update.modelId ?? speaker.modelId, kind); const model = getSpeakerModel(modelId, kind); return { ...speaker, ...update, kind: model.kind, modelId, label: model.label, responseProfileId: modelId }; })); };
  const updateSpeakerLevels = (levels: Record<string, number>) => setSpeakers((now) => now.map((speaker) => levels[speaker.id] === undefined ? speaker : { ...speaker, level: Math.max(.02, Math.min(1, levels[speaker.id])) })); const updateSpeakerMute = (id: string, muted: boolean) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, muted } : speaker)); const updateSpeakerEq = (id: string, eq: SpeakerEq) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, eq } : speaker)); const resetSpeakerEq = (id: string) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, eq: createDefaultEq() } : speaker)); const removeSpeaker = (id: string) => { if (speakers.length <= 1) return; setSpeakers((now) => removeSpeakerFromStack(now, id)); setSelectedSpeakerId(speakers.find((speaker) => speaker.id !== id)?.id ?? ""); };
  const showLayoutMessage = (message: string) => { setLayoutStatus(message); if (layoutStatusTimerRef.current) window.clearTimeout(layoutStatusTimerRef.current); layoutStatusTimerRef.current = window.setTimeout(() => setLayoutStatus(""), 2600); };
  const exportLayout = () => { const json = serializeLayout({ speakers, listener, surfaceTone }); const url = URL.createObjectURL(new Blob([json], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = "club-craft-layout.json"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); setShowLayoutMenu(false); showLayoutMessage("Layout exported"); };
  const importLayout = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { const layout = parseLayoutFile(await file.text()); const nextSpeakers = layoutToClubSpeakers(layout); setSpeakers(nextSpeakers); if (layout.listener) setListener((current) => ({ ...current, position: { x: layout.listener!.x, y: layout.listener!.y, z: layout.listener!.z }, orientation: { yaw: layout.listener!.yaw, pitch: layout.listener!.pitch } })); if (layout.family) setSpeakerFamily(layout.family); if (layout.surfaceTone) setSurfaceTone(layout.surfaceTone); setSelectedSpeakerId(nextSpeakers[0]?.id ?? ""); setMobileInspectorOpen(false); showLayoutMessage("Layout imported"); } catch { showLayoutMessage("Layout import failed"); } };
  const copyPresetData = async () => { try { const layout = createLayoutFile({ speakers }); await navigator.clipboard.writeText(JSON.stringify(layoutToPresetData(layout), null, 2)); setShowLayoutMenu(false); showLayoutMessage("Preset data copied"); } catch { showLayoutMessage("Preset copy failed"); } };
  const chooseSource = (id: string) => { setSelectedSourceId(id); setShowSourcePicker(false); }; const selectSpeaker = (id: string) => { setSelectedSpeakerId(id); setMobileInspectorOpen(false); }; const turnListener = (yaw: number, pitch: number) => setListener((current) => ({ ...current, orientation: { yaw: current.orientation.yaw + yaw, pitch: clampPitch(current.orientation.pitch + pitch) } })); const setListenerLook = (yaw: number, pitch: number) => setListener((current) => ({ ...current, orientation: { yaw, pitch: clampPitch(pitch) } })); const changeListenerName = (nextName: string) => { const name = nextName.trim().slice(0, 24) || "Listener"; setListener((current) => ({ ...current, name })); localStorage.setItem(listenerNameKey, name); };
  const finishOnboarding = () => setOnboardingStep(null);
  const chooseOnboardingModel = (modelId: SpeakerModelId) => { setOnboardingModel(modelId); setSpeakerFamily(getSpeakerModel(modelId, "sub").family); setOnboardingStep("place"); };
  const placeOnboardingSpeaker = (point: Point) => { if (onboardingStep !== "place" || !onboardingModel) return; const id = `${onboardingModel}-${Date.now()}`; setSpeakers([makeSpeaker(id, onboardingModel, clamp(point.x), clamp(point.y), .68)]); setSelectedSpeakerId(id); setOnboardingStep("sound"); };
  const restartIntro = () => { if (isPlaying) void togglePlayback(); setSpeakers([]); setSelectedSpeakerId(""); setOnboardingModel(null); setSelectedSourceId("sweep"); setFileValidationError(null); setView("top"); setOnboardingStep("speaker"); };
  const inspectorModels = orderedSpeakerFamilies().flatMap((family) => modelIdsForFamily(family.id));
  return <main className={`instrument-app spatial-installation dark-club surface-${surfaceTone} scene-view-${view} onboarding-${onboardingStep === "complete" ? "play" : onboardingStep ?? "idle"}`}>
    {onboardingStep && <FirstUseOnboarding step={onboardingStep} family={speakerFamily} error={fileValidationError ?? playbackError} onFamilyChange={setSpeakerFamily} onModelChoose={chooseOnboardingModel} onChooseSweep={() => { setSelectedSourceId("sweep"); setFileValidationError(null); setOnboardingStep("play"); }} onChooseMusic={() => { fileInputRef.current?.setAttribute("accept", ".mp3,.wav,audio/mpeg,audio/wav"); fileInputRef.current?.click(); }} onPlay={() => void togglePlayback()} onSkip={finishOnboarding} onPlace={placeOnboardingSpeaker} />}
    <header className="instrument-header"><div className="spatial-brand"><img src={logoMark} alt="SYSTM" /><span className="spatial-word"><b>SYSTM</b></span><small>{SYSTM_MODE_LABELS[mode].descriptor.toLowerCase()}</small></div><div className="header-controls"><button className="mode-trigger" onClick={() => onModeChange(mode === "club" ? "sound-system" : "club")} aria-label="Switch mode"><small>MODE</small><strong>{SYSTM_MODE_LABELS[mode].label}</strong></button><div className="source-trigger-wrap"><button className="source-trigger" onClick={() => setShowSourcePicker((open) => !open)} aria-haspopup="dialog" aria-expanded={showSourcePicker}><i style={{ backgroundColor: selectedSource?.color }} /><span>SOUND · {selectedSource?.name ?? "Choose sound"}</span><ChevronDown size={14} /></button>{showSourcePicker && <section className="source-popover" role="dialog" aria-label="Choose sound"><p className="source-popover-label">Sound sources</p>{sources.map((source) => <button key={source.id} className={`source-choice ${source.id === selectedSourceId ? "active" : ""}`} onClick={() => chooseSource(source.id)}><i style={{ backgroundColor: source.color }} /><span><strong>{source.name}</strong><small>{source.category === "local" ? "Your file" : "SYSTM source"}</small></span><Music2 size={13} /></button>)}<button className="source-upload" onClick={() => fileInputRef.current?.click()}><Plus size={14} /> Upload audio</button><p className="source-private"><Headphones size={12} /> Your file stays on this device.</p></section>}<input ref={fileInputRef} className="hidden-input" type="file" accept="audio/*" onChange={addLocalSound} /></div><div className="preset-trigger-wrap"><button className="surface-trigger" aria-label={mode === "club" ? "LAYOUT" : `RECIPE / ${currentRecipe?.name ?? "FREE BUILD"}`} onClick={() => { if (mode === "club") setPendingPreset(null); else setRecipeDetailId(null); setShowPresetPicker((open) => !open); }}>{mode === "club" ? "LAYOUT" : "RECIPE"}</button>{showPresetPicker && (mode === "club" ? <section className="preset-popover" role="dialog" aria-label="Layout">{pendingPreset ? <><p>Load layout</p><small>Replaces current spatial scene</small><strong>{pendingPreset.label}</strong><button className="preset-load" onClick={() => loadClubLayout(pendingPreset)}>Load layout</button><button className="preset-back" onClick={() => setPendingPreset(null)}>Back</button></> : <><p>Club layouts</p>{CLUB_LAYOUTS.map((layout) => <button key={layout.id} className="preset-choice" onClick={() => setPendingPreset(layout)}><strong>{layout.label}</strong><small>{layout.description}</small></button>)}</>}</section> : <RecipeLibrary currentRecipeId={currentRecipeId} recipeDetail={recipeDetail} onChoose={selectRecipe} onFreeBuild={() => { setCurrentRecipeId(null); setRecipeDetailId(null); setShowPresetPicker(false); }} onPrepare={prepareRecipeMaterials} onBack={() => setRecipeDetailId(null)} />)}</div><button className="surface-trigger listener-trigger" onClick={() => setView("pov")}>LISTENER</button><div className="surface-trigger-wrap"><button className="surface-trigger" onClick={() => setShowSurfacePicker((open) => !open)} aria-haspopup="dialog" aria-expanded={showSurfacePicker}><Palette size={13} /> Background</button>{showSurfacePicker && <section className="surface-popover" role="dialog" aria-label="Choose background">{surfaceChoices.map((surface) => <button key={surface.id} className={`surface-choice ${surfaceTone === surface.id ? "active" : ""}`} onClick={() => { setSurfaceTone(surface.id); setShowSurfacePicker(false); }}><i style={{ background: surface.color }} /><span>{surface.label}</span></button>)}</section>}</div><div className="layout-trigger-wrap"><button className="surface-trigger" onClick={() => setShowLayoutMenu((open) => !open)} aria-haspopup="dialog" aria-expanded={showLayoutMenu}>DATA</button>{showLayoutMenu && <section className="layout-popover" role="dialog" aria-label="Layout data"><button onClick={exportLayout}>Export Layout</button><button onClick={() => layoutInputRef.current?.click()}>Import Layout</button><button onClick={() => void copyPresetData()}>Copy Preset Data</button></section>}<input ref={layoutInputRef} className="hidden-input" type="file" accept=".json,application/json" onChange={(event) => void importLayout(event)} /></div></div><div className="instrument-actions"><span className="headphone-note"><Headphones size={13} /> Best with headphones</span><button aria-label="Listen" className={`instrument-play ${isPlaying ? "is-playing" : ""}`} onClick={() => void togglePlayback()}>{isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{isPlaying ? "Pause" : "LISTEN"}</button></div></header>
    <section className="instrument-stage">
      <div className="view-switcher" aria-label="Scene view">{(["top", "side", "pov"] as SceneView[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}</div>
      {layoutStatus && <span className="layout-status" role="status">{layoutStatus}</span>}
      {playbackError && <button className="local-audio-error" onClick={clearPlaybackError} role="status">{playbackError}<X size={13} /></button>}
      <SceneProjection view={view} surfaceTone={surfaceTone} speakers={speakers} listener={listener} selectedSpeakerId={selectedSpeakerId} isPlaying={isPlaying} canRemove={speakers.length > 1} materialStaging={mode === "sound-system" && Boolean(currentRecipe)} activityStore={activityStore} lowActivityStore={lowActivityStore} bandActivityStore={bandActivityStore} onSpeakerSelect={selectSpeaker} onSpeakerRemove={removeSpeaker} onSpeakerMoveTop={moveSpeakerTop} onSpeakerMoveSide={moveSpeakerSide} onSpeakerRotate={rotateSpeaker} onSpeakerStack={stackSpeaker} onListenerMove={(position) => setListener((current) => ({ ...current, position: { ...current.position, ...position } }))} onListenerNameChange={changeListenerName} onLook={turnListener} onLookAbsolute={setListenerLook} />
      {currentRecipe && recipeProgress && view !== "pov" && <div className="recipe-progress-strip" aria-label={`${currentRecipe.name} ingredient progress`}><strong>{currentRecipe.name}</strong><span>{recipeProgress.ingredients.map((item) => `${getSpeakerModel(item.modelId, "sub").shortLabel} ${item.placed}/${item.required}`).join(" · ")}</span>{recipeProgress.complete && <small>MATERIALS READY</small>}</div>}
      {view !== "pov" && <>
        {mode === "club" ? <ClubLayoutLibrary onLoad={loadClubLayout} /> : <FamilyLibrary family={speakerFamily} onFamilyChange={setSpeakerFamily} onAdd={addSpeakerModel} recipe={SOUND_SYSTEM_RECIPES.find((recipe) => recipe.id === currentRecipeId) ?? null} recipeProgress={recipeProgress} />}
        {selectedSpeaker && selectedModel && <>
          <button className="mobile-speaker-edit" onClick={() => setMobileInspectorOpen(true)} aria-label={`Edit ${selectedModel.label}`}>Edit</button>
          <aside className={`spatial-inspector ${mobileInspectorOpen ? "mobile-open" : ""}`} aria-label="Selected speaker">
            <button className="mobile-inspector-close" onClick={() => setMobileInspectorOpen(false)} aria-label="Close speaker controls">×</button><button className="mobile-inspector-delete" disabled={speakers.length <= 1} onClick={() => removeSpeaker(selectedSpeaker.id)} aria-label={`Delete ${selectedSpeaker.label}`}><Trash2 size={16} /></button>
            <h2>{selectedModel.label}</h2>
            <label className="spatial-control"><span>Model</span><select value={resolveModelId(selectedSpeaker.modelId, selectedSpeaker.kind)} onChange={(event) => updateSpeaker({ modelId: event.target.value as SpeakerModelId })}>{inspectorModels.map((modelId) => <option key={modelId} value={modelId}>{getSpeakerModel(modelId, "sub").label}</option>)}</select></label>
            {selectedStackMembers.length > 1 && <div className="stack-selector-block" aria-label="Stack selector"><div className="stack-selector-heading">STACK / {String(selectedStackMembers.length).padStart(2, "0")}</div><label className="spatial-control"><span>Cabinet</span><select value={selectedSpeaker.id} onChange={(event) => selectSpeaker(event.target.value)}>{selectedStackMembers.slice().reverse().map((speaker) => { const stackNumber = selectedStackMembers.findIndex((member) => member.id === speaker.id) + 1; return <option key={speaker.id} value={speaker.id}>{`${String(stackNumber).padStart(2, "0")} ${speaker.kind.toUpperCase()}`}</option>; })}</select></label></div>}
            <label className="spatial-control"><span>Level</span><input type="range" min=".02" max="1" step=".01" value={selectedSpeaker.level} onChange={(event) => updateSpeaker({ level: Number(event.target.value) })} /></label>
            {selectedSpeaker.stackParentId ? <p className="stacked-status">Stacked · drag moves the complete column</p> : <label className="spatial-control height-control"><span>Height</span><input type="range" min="0" max="1" step=".01" value={selectedSpeaker.position.z} onChange={(event) => updateSpeaker({ position: { ...selectedSpeaker.position, z: Number(event.target.value) } })} /><div className="height-stops" aria-hidden="true"><span>Floor</span><span>Ear</span><span>High</span></div></label>}
            <div className="mobile-turn-actions" aria-label="Mobile speaker rotation"><span>Turn</span><button type="button" aria-label="Turn speaker left 15 degrees" onClick={() => rotateSpeaker(selectedSpeaker.id, (selectedSpeaker.orientation?.yaw ?? 0) - Math.PI / 12)}>↶</button><output>{yawToDegrees(selectedSpeaker.orientation?.yaw ?? 0)}°</output><button type="button" aria-label="Turn speaker right 15 degrees" onClick={() => rotateSpeaker(selectedSpeaker.id, (selectedSpeaker.orientation?.yaw ?? 0) + Math.PI / 12)}>↷</button></div>
            <div className="inspector-actions"><button className={selectedSpeaker.muted ? "muted" : ""} onClick={() => updateSpeaker({ muted: !selectedSpeaker.muted })}>{selectedSpeaker.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{selectedSpeaker.muted ? "Unmute" : "Mute"}</button><button onClick={() => setCustomOpen(true)}><SlidersHorizontal size={14} />Custom</button>{selectedSpeaker.stackParentId && <button onClick={() => detachSpeaker(selectedSpeaker.id)}>Detach</button>}</div>
          </aside>
        </>}
      </>}
    </section>
    <button className={`mixer-trigger ${mixerOpen ? "is-open" : ""}`} onClick={() => setMixerOpen(true)}>Mix</button><footer className="instrument-footer"><button onClick={() => { setSpeakers(initialSpeakers); setListener({ ...initialListener, name: loadListenerName() }); }}><RotateCcw size={13} /> Reset</button></footer><SpeakerMixer open={mixerOpen} speakers={speakers} selectedSpeakerId={selectedSpeakerId} activityStore={activityStore} onOpenChange={setMixerOpen} onSpeakerSelect={selectSpeaker} onLevelsChange={updateSpeakerLevels} onMutedChange={updateSpeakerMute} /><SpeakerCustomPanel open={customOpen} speakers={speakers} speaker={selectedSpeaker} onOpenChange={setCustomOpen} onSpeakerSelect={selectSpeaker} onEqChange={updateSpeakerEq} onReset={resetSpeakerEq} />
    {!onboardingStep && <button className="intro-reset" onClick={restartIntro}>INTRO</button>}
  </main>;
}

function ClubExperience(props: Omit<ExperienceProps, "mode">) {
  return <ExperienceWorkspace {...props} mode="club" />;
}

function SoundSystemExperience(props: Omit<ExperienceProps, "mode">) {
  return <ExperienceWorkspace {...props} mode="sound-system" />;
}

function SystmShell() {
  const [mode, setMode] = useState<SystmMode | null>(() => loadSystmMode());
  const [scenes, setScenes] = useState<SystmSceneStateMap>(() => {
    const initial = createInitialSceneStateMap(loadListenerName());
    return {
      ...initial,
      club: { ...initial.club, view: initialViewFromUrl() },
      "sound-system": { ...initial["sound-system"], recipeId: localStorage.getItem(recipeStorageKey) },
    };
  });
  const chooseMode = (nextMode: SystmMode) => { persistSystmMode(nextMode); setMode(nextMode); };
  if (!mode) return <SystmModeSelector onChoose={chooseMode} />;
  const experienceProps = { scene: scenes[mode], onSceneChange: (update: SetStateAction<SystmSceneState>) => setScenes((current) => ({ ...current, [mode]: typeof update === "function" ? update(current[mode]) : update })), onModeChange: chooseMode };
  return mode === "club" ? <ClubExperience {...experienceProps} /> : <SoundSystemExperience {...experienceProps} />;
}

export default function Home() {
  return <SystmShell />;
}
