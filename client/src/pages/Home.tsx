/* SYSTM release: a new presentation around the unchanged physical and audio engines. */
import { memo, useEffect, useRef, useState } from "react";
import { ChevronDown, Headphones, Play, Plus, SlidersHorizontal, Square, Volume2, VolumeX, X } from "lucide-react";
import { type ClubListener, type ClubSource, type ClubSpeaker, useClubAudio } from "@/hooks/useClubAudio";
import ClubFloor3D, { type SurfaceTone } from "@/components/ClubFloor3D";
import SideScene from "@/components/SideScene";
import PovPreview from "@/components/PovPreview";
import SpeakerMixer from "@/components/SpeakerMixer";
import SpeakerCustomPanel from "@/components/SpeakerCustomPanel";
import ObjectControlsAnchor from "@/components/ObjectControlsAnchor";
import FirstUseOnboarding from "@/components/FirstUseOnboarding";
import { useSpeakerActivity, useSpeakerBandActivity, type ActivityStore, type BandActivityStore } from "@/lib/activityStore";
import { createDefaultEq, type SpeakerEq } from "@/lib/speakerEq";
import { createStackResolver, removeSpeakerFromStack, type StackAlignment } from "@/lib/speakerStacking";
import { createBlockResolver, normalizeSpeakerSupportHeights, syncSpeakerSupportPositions, type SupportBlock } from "@/lib/blockSupport";
import { detachSpeakerExplicitly, resolveStackRootId, rotateSpeakerWithoutDetach } from "@/lib/speakerInteraction";
import { yawToDegrees } from "@/lib/speakerOrientation";
import { defaultModelForKind, getSpeakerModel, resolveModelId, type SpeakerFamily, type SpeakerModelId } from "@/lib/speakerModels";
import { SYSTEM_RECIPES, getRecipeProgress, type SystemRecipe } from "@/lib/systemRecipes";
import { createLayoutFile, layoutToClubSpeakers, layoutToPresetData, layoutToSupportBlocks, parseLayoutFile, serializeLayout } from "@/lib/layoutFile";
import { isSupportedMusicFile, type OnboardingStep } from "@/lib/onboarding";
import "../club-floor-3d.css";
import "../three-views.css";
import "../scene-objects.css";
import "../systm.css";
import "../mobile.css";
import "../contextual-diagram.css";
import "../secondary-controls.css";

type SceneView = "top" | "side" | "pov";
type HeaderPopover = "sound" | "system" | "background" | "layout" | null;
type HeaderPopoverChange = boolean | ((open: boolean) => boolean);
type CabinetColorScope = "this" | "stack" | "all";
type Point = { x: number; y: number };
type RotationCue = { speakerId: string; yaw: number } | null;
const makeSpeaker = (id: string, modelId: SpeakerModelId, x: number, y: number, level: number): ClubSpeaker => { const model = getSpeakerModel(modelId, "sub"); return { id, modelId, kind: model.kind, label: model.label, position: { x, y, z: 0 }, orientation: { yaw: 0 }, stackParentId: null, supportBlockId: null, level, muted: false, responseProfileId: modelId, activity: 0, eq: createDefaultEq() }; };
const initialSpeakers: ClubSpeaker[] = [{ ...makeSpeaker("starter-sub", "modern-sub", .31, .46, .68), cabinetColor: "#d9a09a" }, { ...makeSpeaker("starter-full", "modern-full", .69, .46, .68), cabinetColor: "#a9c7d8" }];
const listenerNameKey = "club-craft-listener-name";
const loadListenerName = () => localStorage.getItem(listenerNameKey)?.trim().slice(0, 24) || "Listener";
const initialListener: ClubListener = { name: loadListenerName(), position: { x: .5, y: .72, z: .5 }, orientation: { yaw: 0, pitch: 0 } };
const clubTracks: ClubSource[] = [{ id: "sweep", name: "Sine Sweep · 20 Hz ⇄ 20 kHz", category: "official", color: "#e7d64b" }];
const gridSpawnPoints = [{ x: .5, y: .5 }, { x: .4167, y: .5 }, { x: .5833, y: .5 }, { x: .5, y: .5833 }, { x: .5, y: .4167 }];
const surfaceChoices: Array<{ id: SurfaceTone; label: string; color: string }> = [{ id: "paper", label: "Paper", color: "#f6f4ee" }, { id: "sand", label: "Sand", color: "#e9e1d4" }, { id: "slate", label: "Slate", color: "#dde0dd" }, { id: "night", label: "Night", color: "#050606" }];
const cabinetColors = [{ id: "chalk-red", label: "CHALK RED", value: "#d9a09a" }, { id: "powder-blue", label: "POWDER BLUE", value: "#a9c7d8" }, { id: "pale-lime", label: "PALE LIME", value: "#bdd79a" }, { id: "mist-violet", label: "MIST VIOLET", value: "#b9b1d8" }, { id: "light-graphite", label: "LIGHT GRAPHITE", value: "#8c9096" }] as const;
const clamp = (value: number) => Math.max(.07, Math.min(.93, value));
const clampPitch = (value: number) => Math.max(-1.12, Math.min(1.12, value));
const initialViewFromUrl = (): SceneView => { const requested = new URLSearchParams(window.location.search).get("view"); return requested === "side" || requested === "pov" ? requested : "top"; };
const recipeStorageKey = "club-craft-current-recipe";
// The public catalog is restricted; legacy model IDs remain valid in imported layouts.
const releaseSpeakerModelIds: readonly SpeakerModelId[] = ["modern-sub", "modern-woofer", "modern-full", "modern-mid", "modern-high"];

type ProjectionProps = { view: SceneView; surfaceTone: SurfaceTone; speakers: ClubSpeaker[]; blocks: SupportBlock[]; listener: ClubListener; selectedSpeakerId: string; selectedBlockId: string; isPlaying: boolean; canRemove: boolean; rotationCue?: RotationCue; activityStore: ActivityStore; lowActivityStore: ActivityStore; bandActivityStore: BandActivityStore; onSpeakerSelect: (id: string) => void; onBlockSelect: (id: string) => void; onSpeakerRemove: (id: string) => void; onSpeakerMoveTop: (id: string, position: Point) => void; onSpeakerMoveSide: (id: string, position: { y: number }) => void; onBlockMove: (id: string, position: Point) => void; onSpeakerRotate?: (id: string, yaw: number) => void; onSpeakerStack: (id: string, parentId: string, alignment: StackAlignment) => void; onSpeakerSupportBlock: (id: string, blockId: string) => void; onSpeakerDetachFromBlock: (id: string) => void; onBlockStack: (id: string, parentId: string) => void; onListenerMove: (position: Point) => void; onListenerNameChange: (name: string) => void; onLook: (yaw: number, pitch: number) => void; onLookAbsolute: (yaw: number, pitch: number) => void; onFloorPlace?: (point: Point) => void };
const SceneProjection = memo(function SceneProjection({ view, surfaceTone, speakers, blocks, listener, selectedSpeakerId, selectedBlockId, isPlaying, canRemove, rotationCue, activityStore, lowActivityStore, bandActivityStore, onSpeakerSelect, onBlockSelect, onSpeakerRemove, onSpeakerMoveTop, onSpeakerMoveSide, onBlockMove, onSpeakerRotate, onSpeakerStack, onSpeakerSupportBlock, onSpeakerDetachFromBlock, onBlockStack, onListenerMove, onListenerNameChange, onLook, onLookAbsolute, onFloorPlace }: ProjectionProps) { const activityBySpeaker = useSpeakerActivity(activityStore); const lowActivityBySpeaker = useSpeakerActivity(lowActivityStore); const bandActivityBySpeaker = useSpeakerBandActivity(bandActivityStore); const rotate = onSpeakerRotate ?? ((id: string, yaw: number) => window.dispatchEvent(new CustomEvent("club-craft:speaker-rotate", { detail: { id, yaw } }))); return <div className={`scene-surface surface-${surfaceTone}`} key={view}>{view === "top" && <ClubFloor3D speakers={speakers} blocks={blocks} activityBySpeaker={activityBySpeaker} bandActivityBySpeaker={bandActivityBySpeaker} listener={listener} selectedSpeakerId={selectedSpeakerId} selectedBlockId={selectedBlockId} signalActive={isPlaying} surfaceTone={surfaceTone} canRemove={canRemove} rotationCue={rotationCue} onSpeakerSelect={onSpeakerSelect} onBlockSelect={onBlockSelect} onSpeakerRemove={onSpeakerRemove} onSpeakerMove={onSpeakerMoveTop} onBlockMove={onBlockMove} onSpeakerRotate={rotate} onSpeakerStack={onSpeakerStack} onSpeakerSupportBlock={onSpeakerSupportBlock} onSpeakerDetachFromBlock={onSpeakerDetachFromBlock} onBlockStack={onBlockStack} onListenerMove={onListenerMove} onListenerNameChange={onListenerNameChange} onFloorPlace={onFloorPlace} />}{view === "side" && <SideScene speakers={speakers} blocks={blocks} activityBySpeaker={activityBySpeaker} listener={listener} selectedSpeakerId={selectedSpeakerId} canRemove={canRemove} rotationCue={rotationCue} onSpeakerSelect={onSpeakerSelect} onSpeakerRemove={onSpeakerRemove} onSpeakerMove={onSpeakerMoveSide} />}{view === "pov" && <PovPreview speakers={speakers} blocks={blocks} activityBySpeaker={activityBySpeaker} lowActivityBySpeaker={lowActivityBySpeaker} bandActivityBySpeaker={bandActivityBySpeaker} listener={listener} surfaceTone={surfaceTone} onLook={onLook} onLookAbsolute={onLookAbsolute} />}</div>; });

function FamilyLibrary({ onAdd, onAddBlock, mobileOpen, onMobileOpenChange, full, blocksFull }: { onAdd: (id: SpeakerModelId) => void; onAddBlock: () => void; mobileOpen: boolean; onMobileOpenChange: (open: boolean) => void; full: boolean; blocksFull: boolean }) {
  const models = releaseSpeakerModelIds;
  return <section className={`speaker-library ${mobileOpen ? "is-mobile-open" : ""}`} aria-label="Speaker tray">
    <button className="mobile-tray-handle" onClick={() => onMobileOpenChange(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="speaker-tray-content"><b>SPEAKERS</b><span aria-hidden="true">{mobileOpen ? "−" : "+"}</span></button>
    <div id="speaker-tray-content" className="component-index">
      <h2>COMPONENTS</h2>
      <div className="model-choices">{models.map((modelId) => {
        const model = getSpeakerModel(modelId, "sub");
        return <button key={modelId} data-model-id={modelId} onClick={() => onAdd(modelId)} disabled={full} aria-label={`Add ${model.shortLabel.toUpperCase()}`}><span>{model.kind.toUpperCase()}</span><Plus size={14} strokeWidth={1.4} aria-hidden="true" /></button>;
      })}</div>
      <div className="support-index"><h3>SUPPORT</h3><button onClick={onAddBlock} disabled={blocksFull} aria-label="Add BLOCK support object"><span>BLOCK</span><Plus size={14} strokeWidth={1.4} aria-hidden="true" /></button></div>
      {full && <p className="catalog-limit" role="status">16 speakers placed</p>}
    </div>
  </section>;
}

export default function Home() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(null);
  const [onboardingModel, setOnboardingModel] = useState<SpeakerModelId | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<ClubSpeaker[]>(initialSpeakers);
  const [blocks, setBlocks] = useState<SupportBlock[]>([]);
  const [listener, setListener] = useState<ClubListener>(initialListener);
  const [sources, setSources] = useState<ClubSource[]>(clubTracks);
  const [selectedSourceId, setSelectedSourceId] = useState("sweep");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [view, setView] = useState<SceneView>(initialViewFromUrl);
  const [surfaceTone, setSurfaceTone] = useState<SurfaceTone>(() => (localStorage.getItem("club-craft-surface") as SurfaceTone) || "paper");
  const [activeHeaderPopover, setActiveHeaderPopover] = useState<HeaderPopover>(null);
  const [layoutStatus, setLayoutStatus] = useState("");
  const [speakerFamily, setSpeakerFamily] = useState<SpeakerFamily>("modern");
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(() => localStorage.getItem(recipeStorageKey));
  const [recipeDetailId, setRecipeDetailId] = useState<string | null>(null);
  const [mixerOpen, setMixerOpenState] = useState(false);
  const [customOpen, setCustomOpenState] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [speakerTrayOpen, setSpeakerTrayOpen] = useState(false);
  const [cabinetColorScope, setCabinetColorScope] = useState<CabinetColorScope>("this");
  const [customCabinetColor, setCustomCabinetColor] = useState("#70767b");
  const [rotationCue, setRotationCue] = useState<RotationCue>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layoutInputRef = useRef<HTMLInputElement>(null);
  const localUrlsRef = useRef(new Set<string>());
  const layoutStatusTimerRef = useRef<number | null>(null);
  const rotationCueTimerRef = useRef<number | null>(null);
  const setHeaderPopover = (kind: Exclude<HeaderPopover, null>, next: HeaderPopoverChange) => {
    const shouldOpen = typeof next === "function" ? next(activeHeaderPopover === kind) : next;
    if (shouldOpen && kind === "sound" && onboardingStep === "sound") return;
    if (shouldOpen) { setSpeakerTrayOpen(false); setMobileInspectorOpen(false); setMixerOpenState(false); setCustomOpenState(false); }
    setActiveHeaderPopover(shouldOpen ? kind : null);
  };
  const showSourcePicker = activeHeaderPopover === "sound";
  const showPresetPicker = activeHeaderPopover === "system";
  const showSurfacePicker = activeHeaderPopover === "background";
  const showLayoutMenu = activeHeaderPopover === "layout";
  const setShowSourcePicker = (next: HeaderPopoverChange) => setHeaderPopover("sound", next);
  const setShowPresetPicker = (next: HeaderPopoverChange) => setHeaderPopover("system", next);
  const setShowSurfacePicker = (next: HeaderPopoverChange) => setHeaderPopover("background", next);
  const setShowLayoutMenu = (next: HeaderPopoverChange) => setHeaderPopover("layout", next);
  const setMixerOpen = (next: boolean) => { if (next) { setActiveHeaderPopover(null); setSpeakerTrayOpen(false); setMobileInspectorOpen(false); setCustomOpenState(false); } setMixerOpenState(next); };
  const setCustomOpen = (next: boolean) => { if (next) { setActiveHeaderPopover(null); setSpeakerTrayOpen(false); setMobileInspectorOpen(false); setMixerOpenState(false); } setCustomOpenState(next); };
  const { isPlaying, activityStore, lowActivityStore, bandActivityStore, togglePlayback, playbackError, clearPlaybackError } = useClubAudio(speakers, listener, sources, selectedSourceId);
  useEffect(() => {
    if (!activeHeaderPopover) return;
    const closeFromOutside = (event: PointerEvent) => { if (event.target instanceof Element && event.target.closest(".source-trigger-wrap, .preset-trigger-wrap, .surface-trigger-wrap, .layout-trigger-wrap")) return; setActiveHeaderPopover(null); };
    const closeFromEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveHeaderPopover(null); };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => { document.removeEventListener("pointerdown", closeFromOutside); document.removeEventListener("keydown", closeFromEscape); };
  }, [activeHeaderPopover]);
  useEffect(() => { if (mixerOpen || customOpen || onboardingStep === "sound") { setActiveHeaderPopover(null); setSpeakerTrayOpen(false); } }, [customOpen, mixerOpen, onboardingStep]);
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0]; const currentRecipe = SYSTEM_RECIPES.find((recipe) => recipe.id === currentRecipeId) ?? null; const recipeDetail = SYSTEM_RECIPES.find((recipe) => recipe.id === recipeDetailId) ?? null; const recipeProgress = currentRecipe ? getRecipeProgress(currentRecipe, speakers) : null; const selectedSpeaker = speakers.find((speaker) => speaker.id === selectedSpeakerId); const selectedModel = selectedSpeaker ? getSpeakerModel(selectedSpeaker.modelId, selectedSpeaker.kind) : null;
  const selectedStackMembers = (() => { if (!selectedSpeaker) return []; const resolver = createStackResolver(speakers); const rootId = resolveStackRootId(speakers, selectedSpeaker.id); return Array.from(resolver.getSubtreeIds(rootId)).map((id) => resolver.byId.get(id)).filter((speaker): speaker is ClubSpeaker => Boolean(speaker)); })();
  const selectedCabinetColor = selectedSpeaker?.cabinetColor ?? "#70767b";
  const moveSpeakerTop = (id: string, position: Point) => setSpeakers((now) => { const rootId = resolveStackRootId(now, id); return now.map((speaker) => speaker.id === rootId ? { ...speaker, position: { ...speaker.position, x: position.x, y: position.y } } : speaker); });
  const moveSpeakerSide = (id: string, position: { y: number }) => setSpeakers((now) => now.map((speaker) => speaker.id === id && !speaker.stackParentId ? { ...speaker, position: { ...speaker.position, y: clamp(position.y) } } : speaker));
  const moveBlock = (id: string, position: Point) => setBlocks((now) => { const next = now.map((block) => block.id === id ? { ...block, position: { x: clamp(position.x), y: clamp(position.y) } } : block); setSpeakers((current) => syncSpeakerSupportPositions(current, next)); return next; });
  const stackSpeaker = (id: string, parentId: string, alignment: StackAlignment) => setSpeakers((now) => { const resolver = createStackResolver(now); const speaker = resolver.byId.get(id); const parent = resolver.byId.get(parentId); if (!speaker || !parent || id === parentId || resolver.isDescendant(parentId, id)) return now; return now.map((item) => item.id === id ? { ...item, stackParentId: parentId, stackAlign: alignment, supportBlockId: null, position: { ...item.position, z: 0 } } : item); });
  const supportSpeakerOnBlock = (id: string, blockId: string) => setSpeakers((now) => { const rootId = resolveStackRootId(now, id); const blockResolver = createBlockResolver(blocks); const block = blockResolver.byId.get(blockId); if (!block) return now; const point = blockResolver.getXY(block); return normalizeSpeakerSupportHeights(now.map((speaker) => speaker.id === rootId ? { ...speaker, supportBlockId: blockId, stackParentId: null, stackAlign: undefined, position: { ...speaker.position, x: point.x, y: point.y } } : speaker), blocks); });
  const detachSpeakerFromBlock = (id: string) => setSpeakers((now) => { const rootId = resolveStackRootId(now, id); return now.map((speaker) => speaker.id === rootId ? { ...speaker, supportBlockId: null, position: { ...speaker.position, z: 0 } } : speaker); });
  const stackBlock = (id: string, parentId: string) => setBlocks((now) => { const resolver = createBlockResolver(now); if (!resolver.byId.has(id) || !resolver.byId.has(parentId) || id === parentId || resolver.isDescendant(parentId, id)) return now; const next = now.map((block) => block.id === id ? { ...block, stackParentId: parentId } : block); setSpeakers((current) => syncSpeakerSupportPositions(current, next)); return next; });
  const detachSpeaker = (id: string) => setSpeakers((now) => detachSpeakerExplicitly(now, id));
  const rotateSpeaker = (id: string, yaw: number) => { setRotationCue({ speakerId: id, yaw }); if (rotationCueTimerRef.current) window.clearTimeout(rotationCueTimerRef.current); rotationCueTimerRef.current = window.setTimeout(() => setRotationCue(null), 900); setSpeakers((now) => rotateSpeakerWithoutDetach(now, id, yaw)); };
  const addSpeakerModel = (modelId: SpeakerModelId) => { if (onboardingStep === "speaker") { chooseOnboardingModel(modelId); return; } if (speakers.length >= 16) return; const id = `${modelId}-${Date.now()}-${speakers.length}`; setSpeakers((now) => { const point = gridSpawnPoints[now.length % gridSpawnPoints.length]; return [...now, makeSpeaker(id, modelId, point.x, point.y, .68)]; }); setSelectedBlockId(""); setSelectedSpeakerId(id); setSpeakerTrayOpen(false); setMobileInspectorOpen(false); };
  const addBlock = () => { if (blocks.length >= 16) return; const id = `block-${Date.now()}-${blocks.length}`; const point = gridSpawnPoints[blocks.length % gridSpawnPoints.length]; setBlocks((now) => [...now, { id, label: "BLOCK", position: point, stackParentId: null, color: "#9b8d78" }]); setSelectedSpeakerId(""); setSelectedBlockId(id); setSpeakerTrayOpen(false); setMobileInspectorOpen(false); };
  const selectRecipe = (recipe: SystemRecipe) => { setCurrentRecipeId(recipe.id); setRecipeDetailId(recipe.id); setSpeakerFamily(getSpeakerModel(recipe.ingredients[0]?.modelId, "sub").family); };
  const addLocalSound = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!isSupportedMusicFile(file)) { setFileValidationError("MP3 or WAV files only."); return; } const id = `local-${Date.now()}`; const localUrl = URL.createObjectURL(file); localUrlsRef.current.add(localUrl); clearPlaybackError(); setFileValidationError(null); setSources((now) => [...now, { id, name: file.name.replace(/\.[^/.]+$/, ""), category: "local", color: "#797a73", localUrl }]); setSelectedSourceId(id); setShowSourcePicker(false); if (onboardingStep) setOnboardingStep("play"); };
  useEffect(() => { const activeUrls = new Set(sources.flatMap((source) => source.localUrl ? [source.localUrl] : [])); localUrlsRef.current.forEach((url) => { if (!activeUrls.has(url)) { URL.revokeObjectURL(url); localUrlsRef.current.delete(url); } }); }, [sources]);
  useEffect(() => () => { localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); localUrlsRef.current.clear(); if (layoutStatusTimerRef.current) window.clearTimeout(layoutStatusTimerRef.current); if (rotationCueTimerRef.current) window.clearTimeout(rotationCueTimerRef.current); }, []); useEffect(() => { localStorage.setItem("club-craft-surface", surfaceTone); }, [surfaceTone]); useEffect(() => { if (currentRecipeId) localStorage.setItem(recipeStorageKey, currentRecipeId); else localStorage.removeItem(recipeStorageKey); }, [currentRecipeId]); useEffect(() => { if (onboardingStep === "play" && isPlaying) setOnboardingStep("complete"); }, [isPlaying, onboardingStep]); useEffect(() => { if (onboardingStep !== "complete") return; const timer = window.setTimeout(() => setOnboardingStep(null), 420); return () => window.clearTimeout(timer); }, [onboardingStep]); useEffect(() => { const rotate = (event: Event) => { const detail = (event as CustomEvent<{ id?: string; yaw?: number }>).detail; const id = detail?.id; const yaw = detail?.yaw; if (!id || typeof yaw !== "number") return; setRotationCue({ speakerId: id, yaw }); if (rotationCueTimerRef.current) window.clearTimeout(rotationCueTimerRef.current); rotationCueTimerRef.current = window.setTimeout(() => setRotationCue(null), 900); setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, orientation: { yaw } } : speaker)); }; window.addEventListener("club-craft:speaker-rotate", rotate); return () => window.removeEventListener("club-craft:speaker-rotate", rotate); }, []);
  const updateSpeaker = (update: Partial<ClubSpeaker>) => { if (!selectedSpeaker) return; setSpeakers((now) => now.map((speaker) => { if (speaker.id !== selectedSpeaker.id) return speaker; const kind = update.kind ?? speaker.kind; const modelId = update.kind ? defaultModelForKind(update.kind) : resolveModelId(update.modelId ?? speaker.modelId, kind); const model = getSpeakerModel(modelId, kind); return { ...speaker, ...update, kind: model.kind, modelId, label: model.label, responseProfileId: modelId }; })); };
  const updateSpeakerLevels = (levels: Record<string, number>) => setSpeakers((now) => now.map((speaker) => levels[speaker.id] === undefined ? speaker : { ...speaker, level: Math.max(.02, Math.min(1, levels[speaker.id])) })); const updateSpeakerMute = (id: string, muted: boolean) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, muted } : speaker)); const updateSpeakerEq = (id: string, eq: SpeakerEq) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, eq } : speaker)); const resetSpeakerEq = (id: string) => setSpeakers((now) => now.map((speaker) => speaker.id === id ? { ...speaker, eq: createDefaultEq() } : speaker)); const removeSpeaker = (id: string) => { if (speakers.length <= 1) return; setSpeakers((now) => removeSpeakerFromStack(now, id)); setSelectedSpeakerId(speakers.find((speaker) => speaker.id !== id)?.id ?? ""); };
  const showLayoutMessage = (message: string) => { setLayoutStatus(message); if (layoutStatusTimerRef.current) window.clearTimeout(layoutStatusTimerRef.current); layoutStatusTimerRef.current = window.setTimeout(() => setLayoutStatus(""), 2600); };
  const exportLayout = () => { const json = serializeLayout({ speakers, blocks, listener, surfaceTone }); const url = URL.createObjectURL(new Blob([json], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = "club-craft-layout.json"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); setShowLayoutMenu(false); showLayoutMessage("Layout exported"); };
  const importLayout = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { const layout = parseLayoutFile(await file.text()); const runtimeSeed = Date.now(); const nextBlocks = layoutToSupportBlocks(layout, runtimeSeed); const importedSpeakers = layoutToClubSpeakers(layout, runtimeSeed); const nextSpeakers = nextBlocks.length ? syncSpeakerSupportPositions(importedSpeakers, nextBlocks) : importedSpeakers; setBlocks(nextBlocks); setSpeakers(nextSpeakers); if (layout.listener) setListener((current) => ({ ...current, position: { x: layout.listener!.x, y: layout.listener!.y, z: layout.listener!.z }, orientation: { yaw: layout.listener!.yaw, pitch: layout.listener!.pitch } })); if (layout.family) setSpeakerFamily(layout.family); if (layout.surfaceTone) setSurfaceTone(layout.surfaceTone); setSelectedBlockId(""); setSelectedSpeakerId(nextSpeakers[0]?.id ?? ""); setMobileInspectorOpen(false); setShowLayoutMenu(false); showLayoutMessage("Layout imported"); } catch { showLayoutMessage("Layout import failed"); } };
  const copyPresetData = async () => { try { const layout = createLayoutFile({ speakers }); await navigator.clipboard.writeText(JSON.stringify(layoutToPresetData(layout), null, 2)); setShowLayoutMenu(false); showLayoutMessage("Preset data copied"); } catch { showLayoutMessage("Preset copy failed"); } };
  const applyCabinetColor = (color: string, scope = cabinetColorScope) => { if (!selectedSpeaker) return; const targetIds = scope === "all" ? new Set(speakers.map((speaker) => speaker.id)) : scope === "stack" ? new Set(selectedStackMembers.map((speaker) => speaker.id)) : new Set([selectedSpeaker.id]); setSpeakers((now) => now.map((speaker) => targetIds.has(speaker.id) ? { ...speaker, cabinetColor: color } : speaker)); };
  const chooseSource = (id: string) => { setSelectedSourceId(id); setShowSourcePicker(false); }; const selectSpeaker = (id: string) => { setSelectedSpeakerId(id); setMobileInspectorOpen(false); setSpeakerTrayOpen(false); setActiveHeaderPopover(null); }; const toggleSpeakerTray = (open: boolean) => { setSpeakerTrayOpen(open); if (open) { setMobileInspectorOpen(false); setActiveHeaderPopover(null); setMixerOpenState(false); setCustomOpenState(false); } }; const turnListener = (yaw: number, pitch: number) => setListener((current) => ({ ...current, orientation: { yaw: current.orientation.yaw + yaw, pitch: clampPitch(current.orientation.pitch + pitch) } })); const setListenerLook = (yaw: number, pitch: number) => setListener((current) => ({ ...current, orientation: { yaw, pitch: clampPitch(pitch) } })); const changeListenerName = (nextName: string) => { const name = nextName.trim().slice(0, 24) || "Listener"; setListener((current) => ({ ...current, name })); localStorage.setItem(listenerNameKey, name); };
  const finishOnboarding = () => setOnboardingStep(null);
  const chooseOnboardingModel = (modelId: SpeakerModelId) => { setOnboardingModel(modelId); setSpeakerFamily(getSpeakerModel(modelId, "sub").family); setOnboardingStep("place"); };
  const placeOnboardingSpeaker = (point: Point) => { if (onboardingStep !== "place" || !onboardingModel) return; const id = `${onboardingModel}-${Date.now()}`; setSpeakers([makeSpeaker(id, onboardingModel, clamp(point.x), clamp(point.y), .68)]); setSelectedSpeakerId(id); setOnboardingStep("sound"); };
  const inspectorModels = releaseSpeakerModelIds;
  const releaseRecipes = SYSTEM_RECIPES.filter((recipe) => recipe.ingredients.every((item) => releaseSpeakerModelIds.includes(item.modelId)));
  const visibleRecipe = currentRecipe && releaseRecipes.includes(currentRecipe) ? currentRecipe : null;
  const inspectorHidden = speakerTrayOpen || Boolean(activeHeaderPopover) || mixerOpen || customOpen;
  const openInspector = () => { setSpeakerTrayOpen(false); setActiveHeaderPopover(null); setMobileInspectorOpen(true); };
  const dismissInspector = () => { setMobileInspectorOpen(false); setSelectedSpeakerId(""); };
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key !== "Escape") return; setSpeakerTrayOpen(false); setMobileInspectorOpen(false); setMixerOpenState(false); setCustomOpenState(false); setSelectedSpeakerId(""); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return <main className={`instrument-app release-workbench surface-${surfaceTone} scene-view-${view} tray-${speakerTrayOpen ? "open" : "closed"}`}>
    {onboardingStep && <FirstUseOnboarding step={onboardingStep} family={speakerFamily} error={fileValidationError ?? playbackError} onFamilyChange={setSpeakerFamily} onModelChoose={chooseOnboardingModel} onChooseSweep={() => { setSelectedSourceId("sweep"); setFileValidationError(null); setOnboardingStep("play"); }} onChooseMusic={() => { fileInputRef.current?.setAttribute("accept", ".mp3,.wav,audio/mpeg,audio/wav"); fileInputRef.current?.click(); }} onPlay={() => void togglePlayback()} onSkip={finishOnboarding} onPlace={placeOnboardingSpeaker} />}
    <header className="instrument-header">
      <h1 className="systm-wordmark">SYSTM</h1>
      <div className="transport">
        <div className="source-trigger-wrap">
          <button className="source-trigger" onClick={() => setShowSourcePicker((open) => !open)} aria-haspopup="dialog" aria-expanded={showSourcePicker} aria-label="Choose sound" title={selectedSource?.name}>SOUND<ChevronDown size={12} aria-hidden="true" /></button>
          {showSourcePicker && <section className="source-popover" role="dialog" aria-label="Choose sound">
            <div className="popover-heading"><h2>SOUND</h2><button onClick={() => setShowSourcePicker(false)} aria-label="Close sound picker"><X size={18} /></button></div>
            {sources.map((source) => <button key={source.id} className={`source-choice ${source.id === selectedSourceId ? "active" : ""}`} onClick={() => chooseSource(source.id)} aria-pressed={source.id === selectedSourceId}><span><strong>{source.name}</strong><small>{source.category === "local" ? "YOUR FILE" : "TEST SIGNAL"}</small></span><span aria-hidden="true">{source.id === selectedSourceId ? "✓" : ""}</span></button>)}
            <button className="source-upload" onClick={() => fileInputRef.current?.click()}><Plus size={16} />UPLOAD AUDIO</button>
            {fileValidationError && <p className="file-validation-error" role="alert">{fileValidationError}</p>}
            <p className="source-private"><Headphones size={13} />Your file stays on this device.</p>
          </section>}
          <input ref={fileInputRef} className="hidden-input" type="file" accept="audio/*" onChange={addLocalSound} />
        </div>
        <button className={`instrument-play ${isPlaying ? "is-playing" : ""}`} onClick={() => void togglePlayback()} aria-label={isPlaying ? "Stop" : "Play"}>{isPlaying ? <Square size={11} fill="currentColor" /> : <Play size={12} fill="currentColor" />}{isPlaying ? "STOP" : "PLAY"}</button>
      </div>
    </header>
    <section className="instrument-stage" aria-label="Sound system work surface">
      <SceneProjection view={view} surfaceTone={surfaceTone} speakers={speakers} blocks={blocks} listener={listener} selectedSpeakerId={selectedSpeakerId} selectedBlockId={selectedBlockId} isPlaying={isPlaying} canRemove={speakers.length > 1} rotationCue={rotationCue} activityStore={activityStore} lowActivityStore={lowActivityStore} bandActivityStore={bandActivityStore} onSpeakerSelect={(id) => { setSelectedBlockId(""); selectSpeaker(id); }} onBlockSelect={(id) => { setSelectedSpeakerId(""); setSelectedBlockId(id); }} onSpeakerRemove={removeSpeaker} onSpeakerMoveTop={moveSpeakerTop} onSpeakerMoveSide={moveSpeakerSide} onBlockMove={moveBlock} onSpeakerRotate={rotateSpeaker} onSpeakerStack={stackSpeaker} onSpeakerSupportBlock={supportSpeakerOnBlock} onSpeakerDetachFromBlock={detachSpeakerFromBlock} onBlockStack={stackBlock} onListenerMove={(position) => setListener((current) => ({ ...current, position: { ...current.position, ...position } }))} onListenerNameChange={changeListenerName} onLook={turnListener} onLookAbsolute={setListenerLook} />
    </section>
    <nav className="view-switcher" aria-label="Scene view">{(["top", "side", "pov"] as SceneView[]).map((item) => <button key={item} className={view === item ? "active" : ""} aria-pressed={view === item} onClick={() => { setView(item); setSpeakerTrayOpen(false); setMobileInspectorOpen(false); setActiveHeaderPopover(null); }}>{item.toUpperCase()}</button>)}</nav>
    {layoutStatus && <span className="layout-status" role="status">{layoutStatus}</span>}
    {playbackError && <button className="local-audio-error" onClick={clearPlaybackError} role="status">{playbackError}<X size={13} /></button>}
    {view !== "pov" && <>
      <FamilyLibrary onAdd={addSpeakerModel} onAddBlock={addBlock} mobileOpen={speakerTrayOpen} onMobileOpenChange={toggleSpeakerTray} full={speakers.length >= 16} blocksFull={blocks.length >= 16} />
      {selectedSpeaker && selectedModel && <>
        {!inspectorHidden && <button className="mobile-speaker-edit" onClick={openInspector} aria-label={`Edit ${selectedModel.kind.toUpperCase()}`}><span>{selectedModel.kind.toUpperCase()}</span>EDIT</button>}
        <ObjectControlsAnchor selectionKey={`${selectedSpeaker.id}:${selectedSpeaker.position.x}:${selectedSpeaker.position.y}:${view}`} open={mobileInspectorOpen} hidden={inspectorHidden}>
          <div className="object-heading"><div><span className="object-eyebrow">SELECTED</span><h2>{selectedModel.kind.toUpperCase()}</h2></div><button className="inspector-close" onClick={dismissInspector} aria-label="Close speaker controls"><X size={18} /></button></div>
          {selectedStackMembers.length > 1 && <label className="stack-selector-block"><span>STACK</span><select aria-label="Stack cabinet" value={selectedSpeaker.id} onChange={(event) => { setSelectedSpeakerId(event.target.value); }}>{selectedStackMembers.slice().reverse().map((speaker) => <option key={speaker.id} value={speaker.id}>{selectedStackMembers.indexOf(speaker) + 1} · {speaker.kind.toUpperCase()}</option>)}</select></label>}
          <section className="cabinet-color-control" aria-label="Speaker Color">
            <div className="cabinet-color-heading"><h3>SPEAKER COLOR</h3><output>{cabinetColors.find((color) => color.value === selectedCabinetColor)?.label ?? "CUSTOM"}</output></div>
            <div className="cabinet-color-swatches">{cabinetColors.map((color) => <button key={color.id} type="button" className={selectedCabinetColor === color.value ? "active" : ""} onClick={() => applyCabinetColor(color.value)} aria-label={color.label} aria-pressed={selectedCabinetColor === color.value} title={color.label}><i style={{ backgroundColor: color.value }} /></button>)}<label className="cabinet-color-custom"><input type="color" value={customCabinetColor} onChange={(event) => { setCustomCabinetColor(event.target.value); applyCabinetColor(event.target.value); }} aria-label="Custom cabinet color" /><span>CUSTOM</span></label></div>
            <div className="cabinet-color-scope" role="group" aria-label="Apply cabinet color to">{(["this", "stack", "all"] as CabinetColorScope[]).map((scope) => <button key={scope} type="button" className={cabinetColorScope === scope ? "active" : ""} aria-pressed={cabinetColorScope === scope} disabled={scope === "stack" && selectedStackMembers.length < 2} onClick={() => setCabinetColorScope(scope)}>{scope.toUpperCase()}</button>)}</div>
          </section>
          <div className="mobile-turn-actions" aria-label="Speaker rotation"><span>ROTATE</span><button type="button" aria-label="Turn speaker left 15 degrees" onClick={() => rotateSpeaker(selectedSpeaker.id, (selectedSpeaker.orientation?.yaw ?? 0) - Math.PI / 12)}>↶</button><output>{yawToDegrees(selectedSpeaker.orientation?.yaw ?? 0)}°</output><button type="button" aria-label="Turn speaker right 15 degrees" onClick={() => rotateSpeaker(selectedSpeaker.id, (selectedSpeaker.orientation?.yaw ?? 0) + Math.PI / 12)}>↷</button></div>
          <details className="object-adjustments"><summary>ADJUST</summary><label className="spatial-control"><span>MODEL</span><select aria-label="Speaker model" value={resolveModelId(selectedSpeaker.modelId, selectedSpeaker.kind)} onChange={(event) => updateSpeaker({ modelId: event.target.value as SpeakerModelId })}>{!inspectorModels.includes(resolveModelId(selectedSpeaker.modelId, selectedSpeaker.kind)) && <option value={resolveModelId(selectedSpeaker.modelId, selectedSpeaker.kind)}>Imported cabinet</option>}{inspectorModels.map((modelId) => <option key={modelId} value={modelId}>{getSpeakerModel(modelId, "sub").kind.toUpperCase()}</option>)}</select></label><label className="spatial-control"><span>LEVEL</span><input aria-label="Speaker level" type="range" min=".02" max="1" step=".01" value={selectedSpeaker.level} onChange={(event) => updateSpeaker({ level: Number(event.target.value) })} /></label><div className="adjustment-actions"><button onClick={() => updateSpeaker({ muted: !selectedSpeaker.muted })}>{selectedSpeaker.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{selectedSpeaker.muted ? "UNMUTE" : "MUTE"}</button><button onClick={() => setCustomOpen(true)}><SlidersHorizontal size={14} />EQ</button></div></details>
          <div className="inspector-actions">{selectedSpeaker.stackParentId && <button onClick={() => detachSpeaker(selectedSpeaker.id)}>DETACH</button>}{!selectedSpeaker.stackParentId && selectedSpeaker.supportBlockId && <button onClick={() => detachSpeakerFromBlock(selectedSpeaker.id)}>DETACH</button>}<button className="delete-object" disabled={speakers.length <= 1} onClick={() => removeSpeaker(selectedSpeaker.id)}>DELETE</button></div>
        </ObjectControlsAnchor>
      </>}
    </>}
    <footer className="workbench-footer">
      <button className="mixer-trigger" onClick={() => setMixerOpen(true)}>MIX</button>
      <div className="surface-trigger-wrap"><button onClick={() => setShowSurfacePicker((open) => !open)} aria-haspopup="dialog" aria-expanded={showSurfacePicker}>SURFACE</button>{showSurfacePicker && <section className="surface-popover" role="dialog" aria-label="Choose background"><div className="popover-heading"><h2>SURFACE</h2><button onClick={() => setShowSurfacePicker(false)} aria-label="Close surface picker"><X size={18} /></button></div>{surfaceChoices.map((surface) => <button key={surface.id} className={`surface-choice ${surfaceTone === surface.id ? "active" : ""}`} onClick={() => { setSurfaceTone(surface.id); setShowSurfacePicker(false); }} aria-pressed={surfaceTone === surface.id}><span>{surface.label.toUpperCase()}</span><span aria-hidden="true">{surfaceTone === surface.id ? "✓" : ""}</span></button>)}</section>}</div>
      <div className="layout-trigger-wrap"><button onClick={() => setShowLayoutMenu((open) => !open)} aria-haspopup="dialog" aria-expanded={showLayoutMenu}>LAYOUT</button>{showLayoutMenu && <section className="layout-popover" role="dialog" aria-label="Layout"><div className="popover-heading"><h2>LAYOUT</h2><button onClick={() => setShowLayoutMenu(false)} aria-label="Close layout menu"><X size={18} /></button></div><button onClick={exportLayout}>EXPORT</button><button onClick={() => layoutInputRef.current?.click()}>IMPORT</button><button onClick={() => void copyPresetData()}>COPY PRESET DATA</button><button onClick={() => { setRecipeDetailId(null); setShowPresetPicker(true); }}>RECIPES</button><button onClick={() => { setSpeakers(initialSpeakers); setBlocks([]); setSelectedBlockId(""); setSelectedSpeakerId(""); setListener({ ...initialListener, name: loadListenerName() }); setShowLayoutMenu(false); }}>RESET LAYOUT</button></section>}<input ref={layoutInputRef} className="hidden-input" type="file" accept=".json,application/json" onChange={(event) => void importLayout(event)} /></div>
      {showPresetPicker && <div className="preset-trigger-wrap"><section className="preset-popover" role="dialog" aria-label="Recipe browser"><div className="popover-heading"><h2>RECIPES</h2><button onClick={() => setShowPresetPicker(false)} aria-label="Close recipes"><X size={18} /></button></div>{recipeDetail && releaseRecipes.includes(recipeDetail) ? <><button className="recipe-back" onClick={() => setRecipeDetailId(null)}>← RECIPES</button><h3>{recipeDetail.name}</h3><div className="recipe-ingredients">{recipeDetail.ingredients.map((ingredient) => <p key={ingredient.modelId}><span>{getSpeakerModel(ingredient.modelId, "sub").kind.toUpperCase()}</span><b>{getRecipeProgress(recipeDetail, speakers).ingredients.find((item) => item.modelId === ingredient.modelId)?.placed ?? 0} / {ingredient.quantity}</b></p>)}</div></> : <><button onClick={() => { setCurrentRecipeId(null); setRecipeDetailId(null); setShowPresetPicker(false); }}>FREE BUILD</button>{releaseRecipes.map((recipe) => <button key={recipe.id} onClick={() => selectRecipe(recipe)}>{recipe.name}</button>)}</>}</section></div>}
    </footer>
    {visibleRecipe && recipeProgress && <div className="recipe-progress-strip" role="status"><span>{visibleRecipe.name}</span><span>{recipeProgress.ingredients.reduce((n, item) => n + item.placed, 0)} / {recipeProgress.ingredients.reduce((n, item) => n + item.required, 0)}</span></div>}
    <SpeakerMixer open={mixerOpen} speakers={speakers} selectedSpeakerId={selectedSpeakerId} activityStore={activityStore} onOpenChange={setMixerOpen} onSpeakerSelect={selectSpeaker} onLevelsChange={updateSpeakerLevels} onMutedChange={updateSpeakerMute} />
    <SpeakerCustomPanel open={customOpen} speakers={speakers} speaker={selectedSpeaker} onOpenChange={setCustomOpen} onSpeakerSelect={selectSpeaker} onEqChange={updateSpeakerEq} onReset={resetSpeakerEq} />
  </main>;
}
