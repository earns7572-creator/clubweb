import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { getSpeakerModel, type SpeakerBand } from "@/lib/speakerModels";
import { createStackResolver } from "@/lib/speakerStacking";
import { speakerOrientationToAudioOrientation } from "@/lib/speakerOrientation";
import { SOUND_FIELD_STYLE } from "@/lib/soundFieldMath";

const MAX_SPEAKERS = 16;
const MAX_FIELD_COMPONENTS = 48;
const ignoreRaycast: THREE.Mesh["raycast"] = () => {};

type Props = {
  speakers: ClubSpeaker[];
  activityBySpeaker: Readonly<Record<string, number>>;
  roomWidth: number;
  roomDepth: number;
  hazeColor?: string;
  darkSurface?: boolean;
};

const NIGHT_BAND_COLORS: Record<SpeakerBand, THREE.Color> = {
  low: new THREE.Color("#ff4035"),
  kick: new THREE.Color("#ff962e"),
  full: new THREE.Color("#c9c7ba"),
  mid: new THREE.Color("#ffe21f"),
  high: new THREE.Color("#45e873"),
};

const LIGHT_BAND_COLORS: Record<SpeakerBand, THREE.Color> = {
  low: new THREE.Color("#d9362d"),
  kick: new THREE.Color("#d96d12"),
  full: new THREE.Color("#858579"),
  mid: new THREE.Color("#c89400"),
  high: new THREE.Color("#168a3d"),
};

const BAND_COLOR_WEIGHTS: Record<SpeakerBand, number> = {
  low: 0.55,
  kick: 0.90,
  full: 0.70,
  mid: 2.20,
  high: 2.80,
};

const BAND_VISIBILITY_GAINS: Record<SpeakerBand, number> = {
  low: 0.72,
  kick: 0.95,
  full: 0.95,
  mid: 1.85,
  high: 2.25,
};

const BAND_ACTIVITY_GAMMA: Record<SpeakerBand, number> = {
  low: 0.86,
  kick: 0.80,
  full: 0.78,
  mid: 0.62,
  high: 0.54,
};

const BAND_TINT_STRENGTH: Record<SpeakerBand, number> = {
  low: 0.42,
  kick: 0.65,
  full: 0.50,
  mid: 1.00,
  high: 1.00,
};

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
#define MAX_FIELD_COMPONENTS 48
varying vec2 vUv;
uniform int uCount;
uniform vec2 uRoomSize;
uniform vec2 uFieldSize;
uniform vec2 uPositions[MAX_FIELD_COMPONENTS];
uniform vec2 uDirections[MAX_FIELD_COMPONENTS];
uniform float uInnerCos[MAX_FIELD_COMPONENTS];
uniform float uOuterCos[MAX_FIELD_COMPONENTS];
uniform float uOuterGains[MAX_FIELD_COMPONENTS];
uniform float uStrengths[MAX_FIELD_COMPONENTS];
uniform float uRanges[MAX_FIELD_COMPONENTS];
uniform vec3 uColors[MAX_FIELD_COMPONENTS];
uniform float uColorWeights[MAX_FIELD_COMPONENTS];
uniform float uTintStrengths[MAX_FIELD_COMPONENTS];
uniform vec3 uHazeColor;
uniform float uDistanceScale;
uniform float uDistanceExponent;
uniform float uRangeFadeStart;
uniform float uCompression;
uniform float uAlphaGamma;
uniform float uMaxOpacity;
uniform float uEdgeFeatherMeters;

void main() {
  vec2 point = vec2((vUv.x - 0.5) * uFieldSize.x, (0.5 - vUv.y) * uFieldSize.y);
  float energy = 0.0;
  float colorWeight = 0.0;
  vec3 weightedColor = vec3(0.0);

  for (int i = 0; i < MAX_FIELD_COMPONENTS; i++) {
    if (i < uCount) {
      float strength = uStrengths[i];
      if (strength > 0.0001) {
        vec2 delta = point - uPositions[i];
        float distanceMeters = length(delta);
        vec2 rayDirection = distanceMeters > 0.0001 ? delta / distanceMeters : normalize(uDirections[i]);
        float cosTheta = dot(normalize(uDirections[i]), rayDirection);
        float transition = smoothstep(uOuterCos[i], uInnerCos[i], cosTheta);
        float angular = mix(uOuterGains[i], 1.0, transition);
        float distanceFade = 1.0 / (1.0 + pow(distanceMeters / uDistanceScale, uDistanceExponent));
        float rangeMeters = max(uRanges[i], 0.001);
        float rangeFade = 1.0 - smoothstep(rangeMeters * uRangeFadeStart, rangeMeters, distanceMeters);
        float contribution = strength * angular * distanceFade * rangeFade;
        float contributionEnergy = contribution * contribution;
        energy += contributionEnergy;
        float visualColorEnergy = contributionEnergy * uColorWeights[i];
        vec3 tintedSpeakerColor = mix(uHazeColor, uColors[i], uTintStrengths[i]);
        weightedColor += tintedSpeakerColor * visualColorEnergy;
        colorWeight += visualColorEnergy;
      }
    }
  }

  if (energy <= 0.000001) discard;
  float combined = sqrt(energy);
  float visibleStrength = 1.0 - exp(-uCompression * combined);
  vec2 halfField = uFieldSize * 0.5;
  vec2 distanceToEdge = halfField - abs(point);
  float nearestEdge = min(distanceToEdge.x, distanceToEdge.y);
  float edgeFade = smoothstep(0.0, uEdgeFeatherMeters, nearestEdge);
  float alpha = pow(clamp(visibleStrength, 0.0, 1.0), uAlphaGamma) * uMaxOpacity * edgeFade;
  if (alpha <= 0.002) discard;
  vec3 finalColor = colorWeight > 0.000001 ? weightedColor / colorWeight : uHazeColor;
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export default function SoundFieldLayer({ speakers, activityBySpeaker, roomWidth, roomDepth, hazeColor = "#777870", darkSurface = false }: Props) {
  const { invalidate } = useThree();
  const resolver = useMemo(() => createStackResolver(speakers), [speakers]);
  const fieldWidth = roomWidth * SOUND_FIELD_STYLE.fieldExtentScale;
  const fieldDepth = roomDepth * SOUND_FIELD_STYLE.fieldExtentScale;
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    uniforms: {
      uCount: { value: 0 },
      uRoomSize: { value: new THREE.Vector2(roomWidth, roomDepth) },
      uFieldSize: { value: new THREE.Vector2(fieldWidth, fieldDepth) },
      uPositions: { value: Array.from({ length: MAX_FIELD_COMPONENTS }, () => new THREE.Vector2()) },
      uDirections: { value: Array.from({ length: MAX_FIELD_COMPONENTS }, () => new THREE.Vector2(0, 1)) },
      uInnerCos: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uOuterCos: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uOuterGains: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uStrengths: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uRanges: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uColors: { value: Array.from({ length: MAX_FIELD_COMPONENTS }, () => new THREE.Color()) },
      uColorWeights: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uTintStrengths: { value: new Float32Array(MAX_FIELD_COMPONENTS) },
      uHazeColor: { value: new THREE.Color(hazeColor) },
      uDistanceScale: { value: SOUND_FIELD_STYLE.distanceScaleMeters },
      uDistanceExponent: { value: SOUND_FIELD_STYLE.distanceExponent },
      uRangeFadeStart: { value: SOUND_FIELD_STYLE.rangeFadeStart },
      uCompression: { value: SOUND_FIELD_STYLE.compression },
      uAlphaGamma: { value: SOUND_FIELD_STYLE.alphaGamma },
      uMaxOpacity: { value: SOUND_FIELD_STYLE.maxOpacity },
      uEdgeFeatherMeters: { value: SOUND_FIELD_STYLE.edgeFeatherMeters },
    },
  }), []);

  useEffect(() => {
    material.uniforms.uRoomSize.value.set(roomWidth, roomDepth);
    material.uniforms.uFieldSize.value.set(fieldWidth, fieldDepth);
    material.uniforms.uHazeColor.value.set(hazeColor);
    const activeFieldComponents = speakers.slice(0, MAX_SPEAKERS).flatMap((speaker) => {
      const model = getSpeakerModel(speaker.modelId, speaker.kind);
      const xy = resolver.getXY(speaker);
      const orientation = speakerOrientationToAudioOrientation(speaker.orientation?.yaw ?? 0);
      const rawActivity = speaker.muted ? 0 : activityBySpeaker[speaker.id] ?? 0;
      return model.fieldComponents.map((component) => ({ component, x: (xy.x - .5) * roomWidth, z: (xy.y - .5) * roomDepth, directionX: orientation.x, directionZ: orientation.z, rawActivity }));
    }).slice(0, MAX_FIELD_COMPONENTS);
    material.uniforms.uCount.value = activeFieldComponents.length;
    const positions = material.uniforms.uPositions.value as THREE.Vector2[];
    const directions = material.uniforms.uDirections.value as THREE.Vector2[];
    const colors = material.uniforms.uColors.value as THREE.Color[];
    const colorWeights = material.uniforms.uColorWeights.value as Float32Array;
    const tintStrengths = material.uniforms.uTintStrengths.value as Float32Array;
    const innerCos = material.uniforms.uInnerCos.value as Float32Array;
    const outerCos = material.uniforms.uOuterCos.value as Float32Array;
    const outerGains = material.uniforms.uOuterGains.value as Float32Array;
    const strengths = material.uniforms.uStrengths.value as Float32Array;
    const ranges = material.uniforms.uRanges.value as Float32Array;
    const palette = darkSurface ? NIGHT_BAND_COLORS : LIGHT_BAND_COLORS;

    for (let i = 0; i < MAX_FIELD_COMPONENTS; i += 1) {
      strengths[i] = 0;
      if (i >= activeFieldComponents.length) continue;
      const field = activeFieldComponents[i];
      const { component } = field;
      positions[i].set(field.x, field.z);
      directions[i].set(field.directionX, field.directionZ);
      innerCos[i] = Math.cos(component.innerAngle * .5 * Math.PI / 180);
      outerCos[i] = Math.cos(component.outerAngle * .5 * Math.PI / 180);
      outerGains[i] = component.outerGain;
      const visualActivity = Math.pow(THREE.MathUtils.clamp(field.rawActivity, 0, 1), BAND_ACTIVITY_GAMMA[component.band]);
      strengths[i] = Math.min(2.4, visualActivity * BAND_VISIBILITY_GAINS[component.band] * component.gain);
      ranges[i] = component.visualRangeMeters;
      colors[i].copy(palette[component.band]);
      colorWeights[i] = BAND_COLOR_WEIGHTS[component.band];
      tintStrengths[i] = BAND_TINT_STRENGTH[component.band];
    }

    invalidate();
  }, [speakers, activityBySpeaker, resolver, roomWidth, roomDepth, fieldWidth, fieldDepth, hazeColor, darkSurface, material, invalidate]);

  useEffect(() => () => material.dispose(), [material]);

  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} renderOrder={0} raycast={ignoreRaycast}>
    <planeGeometry args={[fieldWidth, fieldDepth, 1, 1]} />
    <primitive object={material} attach="material" />
  </mesh>;
}
