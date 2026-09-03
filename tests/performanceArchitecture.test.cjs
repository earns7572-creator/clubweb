const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = path => readFileSync(path, "utf8");
const audio = read("client/src/hooks/useClubAudio.ts");
const sineSweep = read("client/src/lib/sineSweep.ts");
const home = read("client/src/pages/Home.tsx");
const top = read("client/src/components/ClubFloor3D.tsx");
const pov = read("client/src/components/PovPreview.tsx");
const side = read("client/src/components/SideScene.tsx");
const app = read("client/src/App.tsx");
const miniature = read("client/src/components/SpeakerMiniature.tsx");
const emitterGlow = read(
  "client/src/components/speakers/SpeakerEmitterGlow.tsx"
);
const glbSpeaker = read("client/src/components/speakers/GlbSpeakerModel.tsx");
const mixer = read("client/src/components/SpeakerMixer.tsx");
const custom = read("client/src/components/SpeakerCustomPanel.tsx");
const speakerEq = read("client/src/lib/speakerEq.ts");
const responseCurve = read("client/src/lib/responseCurve.ts");
const profiles = read("client/src/lib/speakerProfiles.ts");
const responseGraph = read("client/src/components/SpeakerResponseGraph.tsx");
const bassPressure = read("client/src/lib/bassPressure.ts");
const spatialCoordinates = read("client/src/lib/spatialCoordinates.ts");
const stacking = read("client/src/lib/speakerStacking.ts");
const dimensions = read("client/src/lib/speakerDimensions.ts");
const avatar = read("client/src/components/SimpleHumanAvatar.tsx");
const djBooth = read("client/src/components/DjBooth.tsx");
const deviceOrientation = read("client/src/lib/deviceOrientation.ts");
const deviceLook = read("client/src/hooks/useDeviceLook.ts");
const mobileCss = read("client/src/mobile.css");

assert.match(audio, /syncTopology/);
assert.match(audio, /syncSpeakerDsp/);
assert.match(audio, /syncSpeakerPositions/);
assert.match(audio, /speakerToAudioPosition\(speaker, speakerList\)/);
assert.doesNotMatch(audio, /sceneToAudioPosition\(speaker\.position\)/);
assert.match(audio, /syncListenerPosition/);
assert.match(audio, /syncListenerOrientation/);
assert.match(audio, /cache: SpeakerCache/);
assert.doesNotMatch(audio, /setActivityBySpeaker/);
assert.doesNotMatch(audio, /speakers\.find\(/);
assert.match(audio, /isPlaying \|\| hasResidual/);
assert.match(home, /useSpeakerActivity\(activityStore\)/);
assert.doesNotMatch(home, /activityBySpeaker, togglePlayback/);
assert.match(top, /frameloop="demand"/);
assert.match(top, /requestAnimationFrame\(applyPending\)/);
assert.match(pov, /frameloop="demand"/);
assert.match(pov, /requestAnimationFrame\(flushLook\)/);
assert.match(side, /getBoundingClientRect\(\)/);
assert.match(side, /requestAnimationFrame\(flush\)/);
assert.match(
  app,
  /lazy\(\(\) => import\("\.\/components\/SpeakerModelValidation"\)\)/
);
assert.match(miniature, /const cabinet = makeChamferCabinet/);
assert.match(
  miniature,
  /useMemo\(\(\) => createSpeakerMaterials\(resolved\), \[resolved\]\)/
);
assert.match(miniature, /Object\.values\(materials\).*material\.dispose\(\)/);
assert.match(miniature, /bandActivity/);
assert.match(miniature, /SpeakerEmitterGlow/);
assert.match(miniature, /band="low"/);
assert.match(miniature, /band="mid"/);
assert.match(miniature, /band="high"/);
assert.match(miniature, /function makeConcaveDisc/);
assert.match(miniature, /const concaveWooferCone = makeConcaveDisc/);
assert.match(miniature, /glowGeometry\?: THREE\.BufferGeometry/);
assert.match(miniature, /wooferMount\.rotateX\(Math\.PI \/ 2\)/);
assert.match(miniature, /function WooferAssembly[\s\S]*frontZ \+ \.015/);
assert.doesNotMatch(
  miniature,
  /geometry=\{wooferMount\} rotation=\{\[Math\.PI \/ 2, 0, 0\]\}/
);
assert.doesNotMatch(miniature, /function WooferAssembly[\s\S]*frontZ \+ \.2/);
assert.match(emitterGlow, /low: new THREE\.Color\("#ff3b30"\)/);
assert.match(emitterGlow, /mid: new THREE\.Color\("#ffd60a"\)/);
assert.match(emitterGlow, /high: new THREE\.Color\("#20ef63"\)/);
assert.doesNotMatch(miniature, /emitterDisc/);
assert.match(emitterGlow, /invalidate\(\)/);
assert.doesNotMatch(miniature, /new THREE\.(PointLight|SpotLight)/);
assert.doesNotMatch(miniature, /EffectComposer|UnrealBloomPass/);
assert.match(emitterGlow, /createAlphaTexture/);
assert.match(miniature, /<GlbSpeakerModel visual=\{model\.visual\}/);
assert.match(miniature, /<Suspense fallback=\{fallback\}>/);
assert.match(glbSpeaker, /useGLTF\(visual\.src\)/);
assert.match(glbSpeaker, /gltf\.scene\.clone\(true\)/);
assert.match(glbSpeaker, /Math\.min\(\s*body\.width/);
assert.match(glbSpeaker, /emissiveIntensity = strength \* (?:\.9|0\.9)/);
assert.match(emitterGlow, /function SpeakerEmitterGlow/);
assert.match(emitterGlow, /new THREE\.SpriteMaterial/);
assert.match(emitterGlow, /depthTest: true/);
assert.doesNotMatch(miniature, /visible=\{activity/);
assert.match(emitterGlow, /materials\.core\.opacity = profile\.coreOpacity/);
assert.match(home, /<SpeakerMixer/);
assert.match(home, /onLevelsChange=\{updateSpeakerLevels\}/);
assert.match(mixer, /useSpeakerActivity\(store\)/);
assert.match(mixer, /requestAnimationFrame\(applyLatest\)/);
assert.match(mixer, /setPointerCapture/);
assert.doesNotMatch(mixer, /createAnalyser|createGain|createPanner/);
assert.doesNotMatch(mixer, /DrawerContent|DrawerPrimitive/);
assert.match(sineSweep, /export const SWEEP_START_HZ = 20/);
assert.match(sineSweep, /export const SWEEP_END_HZ = 20_000/);
assert.match(sineSweep, /export const SWEEP_LEG_DURATION_SECONDS = 13/);
assert.match(sineSweep, /export const SWEEP_SCHEDULE_LEGS = 512/);
assert.match(
  audio,
  /oscillator\.frequency\.exponentialRampToValueAtTime\(sweepLegTarget\(index\), now \+ \(index \+ 1\) \* SWEEP_LEG_DURATION_SECONDS\)/
);
assert.match(audio, /oscillator\.stop\(stopAt\)/);
assert.match(
  audio,
  /desiredSource && shouldPlay && !voices\.has\(desiredSource\.id\)/
);
assert.match(
  audio,
  /const resumePromise = context\.state === "running" \? null : context\.resume\(\)/
);
assert.match(
  audio,
  /syncTopology\(true\); syncSpeakerDsp\(speakersRef\.current\);/
);
assert.match(
  audio,
  /const mediaPlayRequests = Array\.from\(voicesRef\.current\.values\(\)\)\.map/
);
assert.match(audio, /if \(resumePromise\) await resumePromise/);
assert.match(audio, /AudioContext did not resume/);
assert.match(home, /id:\s*"sweep",\s*name:\s*"Sine Sweep · 20 Hz ⇄ 20 kHz"/);
assert.match(audio, /type SpeakerEqNodes/);
assert.match(audio, /createSpeakerEqNodes/);
assert.match(audio, /function createCharacterFilters/);
assert.match(audio, /function connectCharacterChain/);
assert.match(
  audio,
  /connectCharacterChain\(input, characterFilters, eq\.low\); eq\.low\.connect\(eq\.lowMid\); eq\.lowMid\.connect\(eq\.highMid\); eq\.highMid\.connect\(eq\.high\); eq\.high\.connect\(gain\)/
);
assert.match(
  audio,
  /function syncEq\(node: SpeakerNode, eq: SpeakerEq, now: number\)/
);
assert.match(
  audio,
  /panner\.distanceModel = "inverse"; panner\.refDistance = 1\.2; panner\.maxDistance = 12; panner\.rolloffFactor = \.85; panner\.coneInnerAngle = model\.directivity\.innerAngle; panner\.coneOuterAngle = model\.directivity\.outerAngle; panner\.coneOuterGain = model\.directivity\.outerGain/
);
assert.match(audio, /const speakerOrientationKey/);
assert.match(audio, /syncSpeakerOrientations/);
assert.match(audio, /orientationX/);
assert.match(top, /onRotate=\{props\.onSpeakerRotate\}/);
assert.match(top, /getSpeakerModel\(speaker\.modelId, speaker\.kind\)\.body/);
assert.match(top, /className="speaker-turn-handle"/);
assert.match(top, /aria-label=\{`Aim \$\{speaker\.label\}`\}/);
assert.match(home, /<SpeakerCustomPanel/);
assert.match(custom, /<SpeakerResponseGraph/);
assert.match(custom, /Reset EQ/);
assert.doesNotMatch(mixer, /SpeakerCustomPanel|createBiquad/);
assert.match(speakerEq, /low: \{ frequency: 100, gainDb: 0 \}/);
assert.match(speakerEq, /lowMid: \{ frequency: 300, gainDb: 0, q: 1 \}/);
assert.match(speakerEq, /highMid: \{ frequency: 2500, gainDb: 0, q: 1 \}/);
assert.match(speakerEq, /high: \{ frequency: 8000, gainDb: 0 \}/);
assert.match(speakerEq, /function createDefaultEq\(\)/);
assert.match(audio, /panner\.distanceModel = "inverse"/);
assert.match(audio, /analyser\.fftSize = 1024/);
assert.match(
  audio,
  /frequencyData: new Uint8Array\(analyser\.frequencyBinCount\)/
);
assert.match(audio, /lowActivityStoreRef/);
assert.match(audio, /bassEnergyFromFrequencyData\(node\.frequencyData/);
assert.match(audio, /analyser\.smoothingTimeConstant = \.35/);
assert.match(audio, /LOW_ATTACK = \.55/);
assert.match(audio, /LOW_RELEASE = \.32/);
assert.match(audio, /LOW_PAUSE_RELEASE = \.55/);
assert.match(audio, /LOW_SNAP = \.006/);
assert.doesNotMatch(
  audio,
  /distance[^\n]{0,80}(?:lowpass|highshelf|lowshelf)/i
);
assert.match(audio, /import \{ getSpeakerModel, resolveModelId/);
assert.match(audio, /speakerToAudioPosition\(speaker, speakerList\)/);
assert.match(
  responseCurve,
  /import \{ getSpeakerModel \} from "@\/lib\/speakerModels"/
);
assert.match(
  responseCurve,
  /characterFilters = getSpeakerModel\(speaker\.modelId, speaker\.kind\)\.characterFilters/
);
assert.match(
  responseCurve,
  /const RESPONSE_FREQUENCIES = createLogFrequencyBins\(\)/
);
assert.match(responseCurve, /count = 240/);
assert.match(responseCurve, /function getSpeakerResponse/);
assert.match(responseCurve, /function findIntersections/);
assert.match(profiles, /export const filterForKind/);
assert.match(responseGraph, /requestAnimationFrame\(applyDrag\)/);
assert.match(responseGraph, /response-curve-hit/);
assert.match(responseGraph, /response-eq-point/);
assert.match(bassPressure, /SUB_BAND_HZ = \{ low: 25, high: 90 \}/);
assert.match(bassPressure, /UPPER_BASS_BAND_HZ = \{ low: 90, high: 160 \}/);
assert.match(bassPressure, /UPPER_BASS_WEIGHT = \.18/);
assert.match(bassPressure, /LOW_ACTIVITY_GATE = \.035/);
assert.match(bassPressure, /VIBRATION_WEIGHT/);
assert.match(bassPressure, /sub: 1, woofer: \.5, full: \.08, mid: 0, high: 0/);
assert.match(bassPressure, /VIBRATION_THRESHOLD = \.12/);
assert.match(bassPressure, /speakerToAudioPosition\(speaker, speakers\)/);
assert.match(
  bassPressure,
  /Math\.pow\(\(clamped - VIBRATION_THRESHOLD\) \/ \(1 - VIBRATION_THRESHOLD\), 1\.35\)/
);
assert.match(bassPressure, /calculateBassPressure/);
assert.match(bassPressure, /1 - Math\.exp\(-sum \* \.75\)/);
assert.match(spatialCoordinates, /speakerToAudioPosition/);
assert.match(spatialCoordinates, /createStackResolver/);
assert.match(pov, /useFrame/);
assert.match(pov, /prefers-reduced-motion: reduce/);
assert.match(pov, /<CameraRig listener=\{listener\} vibration=\{vibration\}/);
assert.match(pov, /target > current\.current \? 15 : 11/);
assert.match(pov, /target === 0 && current\.current < \.004/);
assert.match(pov, /current\.current > \.001 \|\| vibration > 0/);
assert.doesNotMatch(pov, /setListener/);
assert.match(dimensions, /SCENE_VERTICAL_METERS = 6/);
assert.match(dimensions, /SPEAKER_BODY/);
assert.match(dimensions, /speakerBodyForSpeaker/);
assert.match(stacking, /createStackResolver/);
assert.match(stacking, /STACK_ENTER_FACTOR = \.28/);
assert.match(stacking, /STACK_RELEASE_FACTOR = \.4/);
assert.match(stacking, /removeSpeakerFromStack/);
assert.match(top, /findStackCandidate/);
assert.match(top, /onSpeakerStack/);
assert.match(
  home,
  /const detachSpeaker = \(id: string\) =>\s*setSpeakers\(now => detachSpeakerExplicitly\(now, id\)\)/
);
assert.match(home, /function SpeakerInspector\(/);
assert.match(home, /onClick=\{onDetachSpeaker\}/);
assert.match(home, /onDetachSpeaker=\{\(\) =>/);
assert.match(home, /modelIdsForFamily/);
assert.match(home, /orderedSpeakerFamilies/);
assert.match(home, /SYSTEM_RECIPES/);
assert.match(home, /function FamilyLibrary/);
assert.doesNotMatch(home, /prepareRecipeMaterials|PREPARE MATERIALS/);
assert.match(
  home,
  /const \{[\s\S]*speakers,[\s\S]*listener,[\s\S]*selectedSpeakerId,[\s\S]*view,[\s\S]*speakerFamily,[\s\S]*recipeId,[\s\S]*\} = scene/
);
assert.match(
  home,
  /const setSpeakers: Dispatch<SetStateAction<ClubSpeaker\[\]>>/
);
assert.match(home, /const setListener: Dispatch<SetStateAction<ClubListener>>/);
assert.match(top, /onPointerDown=\{\(\) => props\.onSpeakerSelect\(""\)\}/);
assert.match(audio, /type ClubListener = \{ name: string;/);
assert.match(home, /club-craft-listener-name/);
assert.match(home, /onListenerNameChange=\{changeListenerName\}/);
assert.match(top, /<SimpleHumanAvatar variant="listener"/);
assert.match(top, /<ListenerNameTag name=\{listener\.name\}/);
assert.match(
  top,
  /<SoundFieldLayer[\s\S]*speakers=\{props\.speakers\}[\s\S]*activityBySpeaker=\{props\.activityBySpeaker\}[\s\S]*bandActivityBySpeaker=\{props\.bandActivityBySpeaker\}/
);
assert.match(side, /side-listener-name/);
assert.match(side, /side-dj-booth/);
assert.doesNotMatch(pov, /DjBooth/);
assert.match(avatar, /const headGeometry = new THREE\.SphereGeometry/);
assert.match(avatar, /const torsoGeometry = new THREE\.CylinderGeometry/);
assert.doesNotMatch(avatar, /useFrame|requestAnimationFrame|setInterval/);
assert.doesNotMatch(djBooth, /useFrame|requestAnimationFrame|setInterval/);
assert.match(deviceOrientation, /requestOrientationPermission/);
assert.match(deviceOrientation, /requestPermission\(false\)/);
assert.match(deviceOrientation, /writeDeviceOrientationQuaternion/);
assert.match(deviceOrientation, /window\.screen\?\.orientation\?\.angle/);
assert.match(
  deviceLook,
  /type MotionState = "off" \| "requesting" \| "active" \| "denied" \| "unsupported"/
);
assert.match(deviceLook, /MAX_YAW_DELTA = Math\.PI \* \.75/);
assert.match(deviceLook, /MAX_PITCH_DELTA = \.95/);
assert.match(deviceLook, /SMOOTHING = \.16/);
assert.match(deviceLook, /window\.addEventListener\("deviceorientation"/);
assert.match(deviceLook, /window\.removeEventListener\("deviceorientation"/);
assert.match(deviceLook, /AUDIO_INTERVAL_MS = 1000 \/ 25/);
assert.match(deviceLook, /baselineQuaternion/);
assert.match(
  deviceLook,
  /writeRelativeDeviceLook\(relativeLook\.current, baselineQuaternion\.current, currentQuaternion\.current, relativeQuaternion\.current, relativeForward\.current\)/
);
assert.doesNotMatch(
  deviceLook,
  /createAnalyser|createGain|createPanner|AudioContext/
);
assert.match(pov, /useDeviceLook/);
assert.match(pov, /onLookAbsolute/);
assert.match(pov, /<button className=\{`motion-toggle/);
assert.match(pov, /RECENTER/);
assert.match(
  home,
  /mobileInspectorOpen[\s\S]*setMobileInspectorOpen\] =\s*useState\(false\)/
);
assert.match(
  home,
  /const selectSpeaker = \(id: string\) => \{[\s\S]*setSelectedSpeakerId\(id\);[\s\S]*setMobileInspectorOpen\(false\);[\s\S]*\}/
);
assert.match(
  home,
  /className=\{`spatial-inspector \$\{mobileOpen \? "mobile-open" : ""\}`\}/
);
assert.match(
  home,
  /className="mobile-speaker-edit"[\s\S]*onClick=\{\(\) => setMobileInspectorOpen\(true\)\}/
);
assert.match(mobileCss, /\.spatial-inspector \{ display: none;/);
assert.match(mobileCss, /\.spatial-inspector\.mobile-open \{ display: block;/);

console.log("performance architecture tests passed");
