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
  coronaScale: number;
  spikeScale: number;
  hazeScale: number;
  coreOpacity: number;
  coronaOpacity: number;
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

const CORE_TEXTURE = createAlphaTexture((x, y) => {
  const radius = Math.hypot(x, y);
  const soft = Math.exp(-Math.pow(radius / .43, 2));
  const hot = Math.exp(-Math.pow(radius / .15, 2));
  return Math.min(1, soft * .58 + hot * .82);
});
const CORONA_TEXTURE = createAlphaTexture((x, y) => {
  const sx = x * .90 + y * .045;
  const sy = y * 1.08 - x * .025;
  const main = Math.exp(-(Math.pow(sx / .38, 2) + Math.pow(sy / .32, 2)));
  const offsetGlow = Math.exp(-(Math.pow((x - .085) / .42, 2) + Math.pow((y + .045) / .34, 2)));
  const upperBloom = Math.exp(-(Math.pow((x + .025) / .30, 2) + Math.pow((y - .10) / .40, 2)));
  return Math.min(1, main * .62 + offsetGlow * .25 + upperBloom * .13);
});
const SPIKE_TEXTURE = createAlphaTexture((x, y) => {
  const sx = x + y * .055; const sy = y - x * .035; const radius = Math.hypot(sx, sy); const sqrtTwo = Math.SQRT2;
  const horizontalFalloff = sx >= 0 ? Math.exp(-sx * 1.15) : Math.exp(sx * 1.55);
  const verticalFalloff = sy >= 0 ? Math.exp(-sy * 1.05) : Math.exp(sy * 1.5);
  const horizontal = Math.exp(-Math.pow(sy / .016, 2)) * horizontalFalloff;
  const vertical = Math.exp(-Math.pow(sx / .017, 2)) * verticalFalloff;
  const diagonal1 = Math.exp(-Math.pow(Math.abs(sy - sx) / sqrtTwo / .028, 2)) * Math.exp(-radius * 2.8);
  const diagonal2 = Math.exp(-Math.pow(Math.abs(sy + sx) / sqrtTwo / .028, 2)) * Math.exp(-radius * 2.8);
  return horizontal * .95 + vertical + diagonal1 * .07 + diagonal2 * .04;
});
const ANGULAR_HAZE_TEXTURE = createAlphaTexture((x, y) => {
  const sx = x + y * .055; const sy = y - x * .035; const radius = Math.hypot(sx, sy);
  const horizontalFalloff = sx >= 0 ? Math.exp(-sx * 1.85) : Math.exp(sx * 2.15);
  const verticalFalloff = sy >= 0 ? Math.exp(-sy * 1.8) : Math.exp(sy * 2.2);
  const horizontalHaze = Math.exp(-Math.pow(sy / .2, 2)) * horizontalFalloff;
  const verticalHaze = Math.exp(-Math.pow(sx / .2, 2)) * verticalFalloff;
  const centerSuppression = .38 + .62 * smoothstep(.08, .4, radius);
  return (horizontalHaze * .55 + verticalHaze * .65) * centerSuppression;
});

const BAND_COLORS: Record<SpeakerEmitterBand, THREE.Color> = {
  low: new THREE.Color("#ff3b30"), kick: new THREE.Color("#ff8a24"), mid: new THREE.Color("#ffd60a"), high: new THREE.Color("#20ef63"),
};
const CORE_WHITE_START: Record<SpeakerEmitterBand, number> = { low: .62, kick: .56, mid: .46, high: .34 };
const WARM_WHITE = new THREE.Color("#fff8ee");
const PROFILES: Record<SpeakerEmitterBand, GlowProfile> = {
  low: { coreScale: .26, coronaScale: .72, spikeScale: 1.85, hazeScale: 1.80, coreOpacity: .76, coronaOpacity: .12, spikeOpacity: .18, hazeOpacity: .014, whiteMix: .50 },
  kick: { coreScale: .25, coronaScale: .74, spikeScale: 2, hazeScale: 1.90, coreOpacity: .82, coronaOpacity: .15, spikeOpacity: .25, hazeOpacity: .017, whiteMix: .58 },
  mid: { coreScale: .24, coronaScale: .76, spikeScale: 2.20, hazeScale: 2, coreOpacity: .88, coronaOpacity: .19, spikeOpacity: .36, hazeOpacity: .021, whiteMix: .72 },
  high: { coreScale: .24, coronaScale: .80, spikeScale: 2.45, hazeScale: 2.10, coreOpacity: .92, coronaOpacity: .25, spikeOpacity: .50, hazeOpacity: .025, whiteMix: .90 },
};
const ignoreRaycast: THREE.Sprite["raycast"] = () => {};
const materialFor = (map: THREE.Texture) => new THREE.SpriteMaterial({ map, transparent: true, opacity: 0, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false });

export default function SpeakerEmitterGlow({ band, activity, position = [0, 0, 0], size, strength = .8 }: Props) {
  const { invalidate } = useThree();
  const profile = PROFILES[band];
  const materials = useMemo(() => ({ core: materialFor(CORE_TEXTURE), corona: materialFor(CORONA_TEXTURE), spikes: materialFor(SPIKE_TEXTURE), haze: materialFor(ANGULAR_HAZE_TEXTURE) }), []);
  const a = THREE.MathUtils.clamp(activity, 0, 1);
  const growth = 1 + a * .06;

  useEffect(() => () => { materials.core.dispose(); materials.corona.dispose(); materials.spikes.dispose(); materials.haze.dispose(); }, [materials]);
  useEffect(() => {
    const color = BAND_COLORS[band];
    const whiteStart = CORE_WHITE_START[band];
    const whiteAmount = THREE.MathUtils.clamp((a - whiteStart) / (1 - whiteStart), 0, 1) * profile.whiteMix;
    materials.core.color.copy(color).lerp(WARM_WHITE, whiteAmount);
    materials.corona.color.copy(color); materials.spikes.color.copy(color); materials.haze.color.copy(color);
    materials.core.opacity = profile.coreOpacity * Math.pow(a, .68) * strength;
    materials.corona.opacity = profile.coronaOpacity * Math.pow(a, .82) * strength;
    materials.spikes.opacity = profile.spikeOpacity * Math.pow(a, .74) * strength;
    materials.haze.opacity = profile.hazeOpacity * Math.pow(a, 1) * strength;
    invalidate();
  }, [a, band, invalidate, materials, profile, strength]);

  return <group position={position}>
    <sprite material={materials.haze} scale={[size * profile.hazeScale * growth, size * profile.hazeScale * growth, 1]} renderOrder={5} raycast={ignoreRaycast} />
    <sprite material={materials.corona} scale={[size * profile.coronaScale * growth, size * profile.coronaScale * growth, 1]} renderOrder={6} raycast={ignoreRaycast} />
    <sprite material={materials.spikes} scale={[size * profile.spikeScale * growth, size * profile.spikeScale * growth, 1]} renderOrder={7} raycast={ignoreRaycast} />
    <sprite material={materials.core} scale={[size * profile.coreScale * growth, size * profile.coreScale * growth, 1]} renderOrder={8} raycast={ignoreRaycast} />
  </group>;
}
