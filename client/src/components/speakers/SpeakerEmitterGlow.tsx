import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

export type SpeakerEmitterBand = "low" | "kick" | "mid" | "high";

type Props = {
  band: SpeakerEmitterBand;
  activity: number;
  position?: [number, number, number];
  size: number;
  strength?: number;
};

type GlowProfile = {
  coreScale: number;
  ringScale: number;
  spikeScale: number;
  hazeScale: number;
  coreOpacity: number;
  ringOpacity: number;
  spikeOpacity: number;
  hazeOpacity: number;
  whiteMix: number;
};

const TEXTURE_SIZE = 128;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (edge0: number, edge1: number, value: number) => { const t = clamp01((value - edge0) / (edge1 - edge0)); return t * t * (3 - 2 * t); };

function createAlphaTexture(alphaAt: (x: number, y: number) => number) {
  const data = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
  for (let py = 0; py < TEXTURE_SIZE; py += 1) for (let px = 0; px < TEXTURE_SIZE; px += 1) {
    const x = px / (TEXTURE_SIZE - 1) * 2 - 1;
    const y = py / (TEXTURE_SIZE - 1) * 2 - 1;
    const index = (py * TEXTURE_SIZE + px) * 4;
    data[index] = 255; data[index + 1] = 255; data[index + 2] = 255; data[index + 3] = Math.round(clamp01(alphaAt(x, y)) * 255);
  }
  const texture = new THREE.DataTexture(data, TEXTURE_SIZE, TEXTURE_SIZE, THREE.RGBAFormat);
  texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
  return texture;
}

const CORE_TEXTURE = createAlphaTexture((x, y) => Math.pow(Math.max(0, 1 - Math.hypot(x, y)), 4.5));
const CONCAVE_FLARE_TEXTURE = createAlphaTexture((x, y) => {
  const sx = x + y * .055; const sy = y - x * .035; const ax = Math.abs(sx); const ay = Math.abs(sy); const radius = Math.hypot(sx, sy);
  const astroid = Math.pow(ax + .0001, 2 / 3) + Math.pow(ay + .0001, 2 / 3);
  const flareRing = Math.exp(-Math.pow((astroid - .92) / .075, 2));
  const innerMask = smoothstep(.2, .3, radius);
  return flareRing * innerMask * (1 - smoothstep(1.08, 1.28, astroid));
});
const SPIKE_TEXTURE = createAlphaTexture((x, y) => {
  const sx = x + y * .055; const sy = y - x * .035; const radius = Math.hypot(sx, sy); const sqrtTwo = Math.SQRT2;
  const horizontal = Math.exp(-Math.pow(sy / .025, 2)) * Math.exp(-Math.abs(sx) * 1.7);
  const vertical = Math.exp(-Math.pow(sx / .028, 2)) * Math.exp(-Math.abs(sy) * 1.5);
  const diagonal1 = Math.exp(-Math.pow(Math.abs(sy - sx) / sqrtTwo / .035, 2)) * Math.exp(-radius * 2.4);
  const diagonal2 = Math.exp(-Math.pow(Math.abs(sy + sx) / sqrtTwo / .035, 2)) * Math.exp(-radius * 2.4);
  return horizontal * .85 + vertical + diagonal1 * .15 + diagonal2 * .11;
});
const ANGULAR_HAZE_TEXTURE = createAlphaTexture((x, y) => {
  const sx = x + y * .055; const sy = y - x * .035; const ax = Math.abs(sx); const ay = Math.abs(sy); const radius = Math.hypot(sx, sy);
  const astroid = Math.pow(ax + .0001, 2 / 3) + Math.pow(ay + .0001, 2 / 3);
  const concaveField = Math.exp(-Math.pow(astroid / 1.06, 2.2));
  const axes = Math.exp(-Math.pow(sy / .22, 2)) * .12 + Math.exp(-Math.pow(sx / .2, 2)) * .16;
  return concaveField * (.76 + axes) * smoothstep(.28, .48, radius) * (1 - smoothstep(1.12, 1.48, astroid));
});

const BAND_COLORS: Record<SpeakerEmitterBand, THREE.Color> = {
  low: new THREE.Color("#ff3b30"), kick: new THREE.Color("#ff8a24"), mid: new THREE.Color("#ffd60a"), high: new THREE.Color("#20ef63"),
};
const CORE_WHITE_START: Record<SpeakerEmitterBand, number> = { low: .62, kick: .56, mid: .46, high: .34 };
const WARM_WHITE = new THREE.Color("#fff8ee");
const PROFILES: Record<SpeakerEmitterBand, GlowProfile> = {
  low: { coreScale: .22, ringScale: 1.28, spikeScale: 1.85, hazeScale: 2.35, coreOpacity: .82, ringOpacity: .30, spikeOpacity: .18, hazeOpacity: .020, whiteMix: .40 },
  kick: { coreScale: .21, ringScale: 1.30, spikeScale: 1.95, hazeScale: 2.45, coreOpacity: .90, ringOpacity: .38, spikeOpacity: .24, hazeOpacity: .024, whiteMix: .48 },
  mid: { coreScale: .20, ringScale: 1.36, spikeScale: 2.10, hazeScale: 2.55, coreOpacity: .96, ringOpacity: .50, spikeOpacity: .34, hazeOpacity: .030, whiteMix: .58 },
  high: { coreScale: .20, ringScale: 1.42, spikeScale: 2.30, hazeScale: 2.70, coreOpacity: 1, ringOpacity: .64, spikeOpacity: .46, hazeOpacity: .038, whiteMix: .78 },
};
const ignoreRaycast: THREE.Sprite["raycast"] = () => {};
const materialFor = (map: THREE.Texture) => new THREE.SpriteMaterial({ map, transparent: true, opacity: 0, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false });

export default function SpeakerEmitterGlow({ band, activity, position = [0, 0, 0], size, strength = .8 }: Props) {
  const { invalidate } = useThree();
  const profile = PROFILES[band];
  const materials = useMemo(() => ({ core: materialFor(CORE_TEXTURE), ring: materialFor(CONCAVE_FLARE_TEXTURE), spikes: materialFor(SPIKE_TEXTURE), haze: materialFor(ANGULAR_HAZE_TEXTURE) }), []);
  const a = THREE.MathUtils.clamp(activity, 0, 1);
  const growth = 1 + a * .06;

  useEffect(() => () => { materials.core.dispose(); materials.ring.dispose(); materials.spikes.dispose(); materials.haze.dispose(); }, [materials]);
  useEffect(() => {
    const color = BAND_COLORS[band];
    const whiteStart = CORE_WHITE_START[band];
    const whiteAmount = THREE.MathUtils.clamp((a - whiteStart) / (1 - whiteStart), 0, 1) * profile.whiteMix;
    materials.core.color.copy(color).lerp(WARM_WHITE, whiteAmount);
    materials.ring.color.copy(color); materials.spikes.color.copy(color); materials.haze.color.copy(color);
    materials.core.opacity = profile.coreOpacity * Math.pow(a, .68) * strength;
    materials.ring.opacity = profile.ringOpacity * Math.pow(a, .72) * strength;
    materials.spikes.opacity = profile.spikeOpacity * Math.pow(a, .76) * strength;
    materials.haze.opacity = profile.hazeOpacity * Math.pow(a, .98) * strength;
    invalidate();
  }, [a, band, invalidate, materials, profile, strength]);

  return <group position={position}>
    <sprite material={materials.haze} scale={[size * profile.hazeScale * growth, size * profile.hazeScale * growth, 1]} renderOrder={5} raycast={ignoreRaycast} />
    <sprite material={materials.ring} scale={[size * profile.ringScale * growth, size * profile.ringScale * growth, 1]} renderOrder={6} raycast={ignoreRaycast} />
    <sprite material={materials.spikes} scale={[size * profile.spikeScale * growth, size * profile.spikeScale * growth, 1]} renderOrder={7} raycast={ignoreRaycast} />
    <sprite material={materials.core} scale={[size * profile.coreScale * growth, size * profile.coreScale * growth, 1]} renderOrder={8} raycast={ignoreRaycast} />
  </group>;
}
