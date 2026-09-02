import type { SpeakerFamily, SpeakerModelId } from "@/lib/speakerModels";
import { getSpeakerModel } from "@/lib/speakerModels";
import type { StackAlignment } from "@/lib/speakerStacking";
import { SYSTEM_RECIPES, type SystemRecipe } from "@/lib/systemRecipes";

export type PresetSpeaker = { key: string; modelId: SpeakerModelId; x?: number; y?: number; z?: number; yaw?: number; level: number; stackOn?: string; stackAlign?: StackAlignment };
export type SystemPreset = { id: string; label: string; family: SpeakerFamily; description: string; speakers: PresetSpeaker[] };
export type ClubLayout = SystemPreset & { ownership: "club" };
export type SoundSystemRecipe = SystemRecipe & { family: SpeakerFamily; ownership: "sound-system" };
const p = (key: string, modelId: SpeakerModelId, x: number, y: number, level: number, stackOn?: string, yaw?: number): PresetSpeaker => ({ key, modelId, x, y, level, ...(stackOn ? { stackOn } : {}), ...(yaw === undefined ? {} : { yaw }) });
const stacked = (key: string, modelId: SpeakerModelId, level: number, stackOn: string, stackAlign: StackAlignment): PresetSpeaker => ({ key, modelId, level, stackOn, stackAlign });

export const REGGAE_WALL: SystemPreset = { id: "reggae-wall", label: "Reggae Sound System", family: "reggae", description: "Scoop bass, kick, horn mids and top boxes.", speakers: [
  p("left-scoop", "reggae-scoop", .36, .36, .86), p("left-kick", "reggae-kick", .36, .36, .76, "left-scoop"), p("left-mid", "reggae-mid-horn", .36, .36, .7, "left-kick"), p("left-top", "reggae-top", .36, .36, .62, "left-mid"),
  p("right-scoop", "reggae-scoop", .64, .36, .86), p("right-kick", "reggae-kick", .64, .36, .76, "right-scoop"), p("right-mid", "reggae-mid-horn", .64, .36, .7, "right-kick"), p("right-top", "reggae-top", .64, .36, .62, "right-mid"),
] };

export const FREEPARTY_WALL: SystemPreset = { id: "freeparty-wall", label: "Free Party Stack", family: "freeparty", description: "DIY W-bin, kick horn and high-impact horn stack.", speakers: [
  p("left-wbin", "freeparty-wbin", .4090999702785325, .21316313088870198, .68), stacked("left-kick", "freeparty-kick-horn", .68, "left-wbin", "right"), stacked("left-mid", "freeparty-mid-horn", .68, "left-kick", "right"), stacked("left-top", "freeparty-top", .68, "left-mid", "center"),
  p("center-wbin", "freeparty-wbin", .5, .21316313088870198, .88), stacked("center-kick", "freeparty-kick-horn", .78, "center-wbin", "center"), stacked("center-mid", "freeparty-mid-horn", .7, "center-kick", "center"), stacked("center-top", "freeparty-top", .62, "center-mid", "center"),
  p("right-wbin", "freeparty-wbin", .5909000297214675, .21316313088870198, .88), stacked("right-kick", "freeparty-kick-horn", .78, "right-wbin", "left"), stacked("right-mid", "freeparty-mid-horn", .7, "right-kick", "left"), stacked("right-top", "freeparty-top", .62, "right-mid", "center"),
] };

export const MODERN_FOUR_POINT: SystemPreset = { id: "modern-four-point", label: "4-Point Club", family: "modern", description: "Four point sources with a paired sub front line.", speakers: [
  p("front-left", "modern-full", .22, .27, .72, undefined, .88), p("front-right", "modern-full", .78, .27, .72, undefined, -.88), p("rear-left", "modern-full", .22, .75, .72, undefined, 2.3), p("rear-right", "modern-full", .78, .75, .72, undefined, -2.3),
  p("sub-left", "modern-sub", .42, .3, .82), p("sub-right", "modern-sub", .58, .3, .82),
] };

export const FESTIVAL_MAIN_STAGE: SystemPreset = { id: "festival-main-stage", label: "Main Stage PA", family: "festival", description: "Dual line-array hangs, six subs and front fills.", speakers: [
  p("array-left", "festival-line-array", .2, .22, .74), p("array-right", "festival-line-array", .8, .22, .74),
  p("sub-1", "festival-sub", .3, .31, .86), p("sub-2", "festival-sub", .38, .31, .86), p("sub-3", "festival-sub", .46, .31, .86), p("sub-4", "festival-sub", .54, .31, .86), p("sub-5", "festival-sub", .62, .31, .86), p("sub-6", "festival-sub", .7, .31, .86),
  p("fill-left", "festival-front-fill", .42, .34, .62), p("fill-right", "festival-front-fill", .58, .34, .62),
] };

export const HIFI_LISTENING_PAIR: SystemPreset = { id: "hifi-listening-pair", label: "Listening Bar Stereo", family: "hifi", description: "A large wooden horn stereo pair for focused listening.", speakers: [
  p("left-woofer", "hifi-woofer", .34, .3, .72), p("left-horn", "hifi-mid-horn", .34, .3, .66, "left-woofer"), p("left-tweeter", "hifi-tweeter", .34, .3, .56, "left-horn"),
  p("right-woofer", "hifi-woofer", .66, .3, .72), p("right-horn", "hifi-mid-horn", .66, .3, .66, "right-woofer"), p("right-tweeter", "hifi-tweeter", .66, .3, .56, "right-horn"),
] };

export const STEPPERS_STEREO: SystemPreset = { id: "steppers-stereo", label: "Steppers Stereo Stack", family: "steppers", description: "Compact modern dub bass stacks in stereo.", speakers: [
  p("left-bass", "steppers-reflex-sub", .34, .34, .84), p("left-kick", "steppers-kick", .34, .34, .76, "left-bass"), p("left-mid", "steppers-mid", .34, .34, .68, "left-kick"), p("left-top", "steppers-top", .34, .34, .6, "left-mid"),
  p("right-bass", "steppers-reflex-sub", .66, .34, .84), p("right-kick", "steppers-kick", .66, .34, .76, "right-bass"), p("right-mid", "steppers-mid", .66, .34, .68, "right-kick"), p("right-top", "steppers-top", .66, .34, .6, "right-mid"),
] };

export const SYSTEM_PRESETS: SystemPreset[] = [REGGAE_WALL, FREEPARTY_WALL, MODERN_FOUR_POINT, FESTIVAL_MAIN_STAGE, HIFI_LISTENING_PAIR, STEPPERS_STEREO];
export const presetsForFamily = (family: SpeakerFamily) => SYSTEM_PRESETS.filter((preset) => preset.family === family);

export const CLUB_LAYOUTS: ClubLayout[] = [MODERN_FOUR_POINT, FESTIVAL_MAIN_STAGE, HIFI_LISTENING_PAIR].map((preset) => ({ ...preset, ownership: "club" as const }));

const recipeFamily = (recipe: SystemRecipe): SpeakerFamily => getSpeakerModel(recipe.sections[0]?.recommendedModelIds[0] ?? "modern-full", "full").family;
const freePartyRecipe: SoundSystemRecipe = { id: "freeparty-wall", name: FREEPARTY_WALL.label, family: FREEPARTY_WALL.family, ownership: "sound-system", description: FREEPARTY_WALL.description, sections: [
  { band: "LOW", role: "W-BIN BASS", recommendedModelIds: ["freeparty-wbin"] },
  { band: "LOW MID", role: "KICK HORN", recommendedModelIds: ["freeparty-kick-horn"] },
  { band: "MID", role: "MID HORN", recommendedModelIds: ["freeparty-mid-horn"] },
  { band: "HIGH", role: "HF HORN", recommendedModelIds: ["freeparty-top"] },
] };

// Recipes deliberately contain guides only. Placement, yaw, quantity and stack relations remain user-built scene state.
const soundSystemRecipesById = new Map<string, SoundSystemRecipe>([...SYSTEM_RECIPES.map((recipe) => [recipe.id, { ...recipe, family: recipeFamily(recipe), ownership: "sound-system" as const }] as const), [freePartyRecipe.id, freePartyRecipe]]);
export const SOUND_SYSTEM_RECIPES: SoundSystemRecipe[] = ["reggae-sound-system", "freeparty-wall", "steppers-stack"].flatMap((id) => { const recipe = soundSystemRecipesById.get(id); return recipe ? [recipe] : []; });
