/* Club Craft Reggae rule: cabinets and horn throats stay dark; activity color belongs only to SpeakerEmitterGlow. */
import * as THREE from "three";
import { createContext, useContext, useEffect, useMemo } from "react";
import type { SpeakerKind } from "@/hooks/useClubAudio";
import { getSpeakerModel, type SpeakerModelId } from "@/lib/speakerModels";
import SpeakerEmitterGlow, { type SpeakerEmitterBand } from "@/components/speakers/SpeakerEmitterGlow";
import { normalizeCabinetColor } from "@/lib/speakerCabinetColor";
import type { SpeakerBandActivity } from "@/lib/bandActivity";

type Props = { modelId: SpeakerModelId; kind: SpeakerKind; activity: number; bandActivity?: SpeakerBandActivity; selected?: boolean; glowStrength?: number; cabinetColor?: string };
const box = new THREE.BoxGeometry(1, 1, 1); const selection = new THREE.MeshBasicMaterial({ color: "#d5c2a8", transparent: true, opacity: .035, side: THREE.BackSide });
function hornGeometry(mouthWidth: number, mouthHeight: number, throatWidth: number, throatHeight: number, depth: number) { const positions = new Float32Array([-mouthWidth / 2, -mouthHeight / 2, 0, mouthWidth / 2, -mouthHeight / 2, 0, mouthWidth / 2, mouthHeight / 2, 0, -mouthWidth / 2, mouthHeight / 2, 0, -throatWidth / 2, -throatHeight / 2, -depth, throatWidth / 2, -throatHeight / 2, -depth, throatWidth / 2, throatHeight / 2, -depth, -throatWidth / 2, throatHeight / 2, -depth]); const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)); geometry.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]); for (let index = 0; index < 4; index += 1) geometry.addGroup(index * 6, 6, index); geometry.computeVertexNormals(); return geometry; }
const midHorn = hornGeometry(.48, .46, .08, .06, .38); const midGlow = hornGeometry(.3, .27, .045, .032, .27); const topHorn = hornGeometry(.42, .22, .055, .032, .24); const topGlow = hornGeometry(.25, .12, .03, .018, .17);
const frameMaterial = new THREE.MeshStandardMaterial({ color: "#858b90", roughness: .75, metalness: .04 });
const hornVoidMaterial = new THREE.MeshBasicMaterial({ color: "#111417", toneMapped: false });
const hornWallMaterials = ["#3b4146", "#4b5157", "#5c6369", "#30363b"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: .02, side: THREE.DoubleSide }));
const CabinetColorContext = createContext<string | undefined>(undefined);
function useReggaeMaterials() { const materials = useMemo(() => ({ cabinet: new THREE.MeshStandardMaterial({ color: "#686e73", roughness: .88, metalness: .02 }), edge: new THREE.MeshStandardMaterial({ color: "#8a9095", roughness: .74, metalness: .05 }), horn: new THREE.MeshStandardMaterial({ color: "#4d5358", roughness: .84, side: THREE.DoubleSide }), emitter: new THREE.MeshStandardMaterial({ color: "#111315", emissive: "#000000", emissiveIntensity: 0, roughness: .65, side: THREE.DoubleSide, toneMapped: false }), throat: new THREE.MeshStandardMaterial({ color: "#15191c", roughness: .9 }) }), []); useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials]); return materials; }
function useScoopMaterials() { const cabinetColor = useContext(CabinetColorContext); const resolved = normalizeCabinetColor(cabinetColor); const materials = useMemo(() => ({ cabinet: new THREE.MeshStandardMaterial({ color: resolved, roughness: .9, metalness: .01 }), frame: new THREE.MeshStandardMaterial({ color: "#6a5849", roughness: .87, metalness: .01 }), recess: new THREE.MeshStandardMaterial({ color: "#403830", roughness: .92, metalness: 0 }), horn: new THREE.MeshStandardMaterial({ color: "#4a3e35", roughness: .93, metalness: 0, side: THREE.DoubleSide }), cavity: new THREE.MeshStandardMaterial({ color: "#171615", roughness: .92, metalness: 0, side: THREE.DoubleSide }), cone: new THREE.MeshStandardMaterial({ color: "#292929", roughness: .86, metalness: 0 }), surround: new THREE.MeshStandardMaterial({ color: "#171717", roughness: .88, metalness: 0 }), dustCap: new THREE.MeshStandardMaterial({ color: "#202020", roughness: .84, metalness: 0 }), hardware: new THREE.MeshStandardMaterial({ color: "#3c3b38", roughness: .72, metalness: .12 }) }), [resolved]); useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials]); return materials; }
function Horn({ geometry, emitterGeometry, x = 0, y, frontZ, mouthWidth = .9, mouthHeight = .5, depth = .3, throatWidth = .08, throatHeight = .05, materials, activity, glowBand, glowStrength }: { geometry: THREE.BufferGeometry; emitterGeometry: THREE.BufferGeometry; x?: number; y: number; frontZ: number; mouthWidth?: number; mouthHeight?: number; depth?: number; throatWidth?: number; throatHeight?: number; materials: ReturnType<typeof useReggaeMaterials>; activity: number; glowBand: SpeakerEmitterBand; glowStrength: number }) { void emitterGeometry; const visualDepth = THREE.MathUtils.clamp(depth * .12, .035, .065); const innerWidth = THREE.MathUtils.lerp(throatWidth, mouthWidth, .42); const innerHeight = THREE.MathUtils.lerp(throatHeight, mouthHeight, .42); return <group position={[x, y, frontZ]}><mesh geometry={box} position={[0, 0, -.004]} scale={[mouthWidth * .91, mouthHeight * .84, .018]} material={hornVoidMaterial} /><mesh geometry={geometry} position={[0, 0, visualDepth + .006]} scale={[1, 1, visualDepth / depth]} material={hornWallMaterials} /><mesh geometry={box} position={[0, 0, .012]} scale={[throatWidth, throatHeight, .022]} material={materials.emitter} /><HornRing width={innerWidth} height={innerHeight} z={visualDepth * .42} /><SpeakerEmitterGlow band={glowBand} activity={activity} position={[0, 0, visualDepth + .075]} size={Math.max(mouthWidth, mouthHeight) * .42} strength={glowStrength} /></group>; }
function CabinetFrame({ width, height, front }: { width: number; height: number; front: number }) { const rail = .035; return <group><mesh geometry={box} position={[0, height / 2, front + .024]} scale={[width, rail, .045]} material={frameMaterial} /><mesh geometry={box} position={[0, -height / 2, front + .024]} scale={[width, rail, .045]} material={frameMaterial} /><mesh geometry={box} position={[-width / 2, 0, front + .024]} scale={[rail, height, .045]} material={frameMaterial} /><mesh geometry={box} position={[width / 2, 0, front + .024]} scale={[rail, height, .045]} material={frameMaterial} /></group>; }
function HornRing({ width, height, z }: { width: number; height: number; z: number }) { const rail = .022; return <group position={[0, 0, z]}><mesh geometry={box} position={[0, height / 2, 0]} scale={[width, rail, .026]} material={frameMaterial} /><mesh geometry={box} position={[0, -height / 2, 0]} scale={[width, rail, .026]} material={frameMaterial} /><mesh geometry={box} position={[-width / 2, 0, 0]} scale={[rail, height, .026]} material={frameMaterial} /><mesh geometry={box} position={[width / 2, 0, 0]} scale={[rail, height, .026]} material={frameMaterial} /></group>; }
function HornBack({ width, height, x = 0, y, front, materials }: { width: number; height: number; x?: number; y: number; front: number; materials: ReturnType<typeof useReggaeMaterials> }) { return <mesh geometry={box} position={[x, y, front + .006]} scale={[width, height, .035]} material={materials.throat} />; }
function HornBraces({ xs, y, height, front, horizontal = true }: { xs: number[]; y: number; height: number; front: number; horizontal?: boolean }) { return <group>{xs.map((x) => <mesh key={x} geometry={box} position={[x, y, front + .03]} scale={[.034, height, .045]} material={frameMaterial} />)}{horizontal && <mesh geometry={box} position={[0, y, front + .03]} scale={[Math.max(...xs.map(Math.abs), .45) * 2.35, .032, .045]} material={frameMaterial} />}</group>; }
function Scoop({ activity, glowStrength }: { activity: number; glowStrength: number }) {
  const materials = useScoopMaterials(); const body = getSpeakerModel("reggae-scoop", "sub").body; const front = body.depth / 2 - .14; const rail = .075; const upperHeight = .67; const mouthHeight = .86; const wooferY = .39; const mouthY = -.42; const scoopDepth = .56; const innerWidth = body.width - rail * 2;
  return <group>
    <mesh geometry={box} position={[0, 0, -body.depth / 2 + .038]} scale={[body.width, body.height, .076]} material={materials.cabinet} />
    <mesh geometry={box} position={[-body.width / 2 + .038, 0, 0]} scale={[.076, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[body.width / 2 - .038, 0, 0]} scale={[.076, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, body.height / 2 - .038, 0]} scale={[body.width, .076, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, -body.height / 2 + .038, 0]} scale={[body.width, .076, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, .31, front - .095]} scale={[innerWidth, upperHeight, .07]} material={materials.recess} />
    <mesh geometry={box} position={[0, body.height / 2 - rail / 2, front + .026]} scale={[body.width, rail, .075]} material={materials.frame} />
    <mesh geometry={box} position={[0, -body.height / 2 + rail / 2, front + .026]} scale={[body.width, rail, .075]} material={materials.frame} />
    <mesh geometry={box} position={[-body.width / 2 + rail / 2, 0, front + .026]} scale={[rail, body.height, .075]} material={materials.frame} />
    <mesh geometry={box} position={[body.width / 2 - rail / 2, 0, front + .026]} scale={[rail, body.height, .075]} material={materials.frame} />
    <mesh geometry={box} position={[0, -.03, front + .027]} scale={[innerWidth, .07, .075]} material={materials.frame} />
    <mesh geometry={box} position={[0, .72, front + .02]} scale={[innerWidth, .06, .065]} material={materials.frame} />
    <mesh position={[0, wooferY, front - .045]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.39, .39, .038, 16]} /><primitive object={materials.hardware} attach="material" /></mesh>
    <mesh position={[0, wooferY, front - .008]}><torusGeometry args={[.33, .046, 6, 18]} /><primitive object={materials.surround} attach="material" /></mesh>
    <mesh position={[0, wooferY, front - .025]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[.305, .13, 18, 1, true]} /><primitive object={materials.cone} attach="material" /></mesh>
    <mesh position={[0, wooferY, front - .09]} scale={[1, 1, .46]}><sphereGeometry args={[.105, 12, 6]} /><primitive object={materials.dustCap} attach="material" /></mesh>
    {[-.285, .285].map((x) => [wooferY - .285, wooferY + .285].map((y) => <mesh key={`${x}:${y}`} position={[x, y, front - .012]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.018, .018, .028, 6]} /><primitive object={materials.hardware} attach="material" /></mesh>))}
    <mesh geometry={box} position={[0, mouthY, front - scoopDepth + .025]} scale={[.3, .22, .045]} material={materials.cavity} />
    <mesh geometry={box} position={[0, mouthY - .29, front - .22]} rotation={[.34, 0, 0]} scale={[innerWidth * .86, .07, .5]} material={materials.horn} />
    <mesh geometry={box} position={[0, mouthY + .27, front - .25]} rotation={[-.27, 0, 0]} scale={[innerWidth * .84, .065, .42]} material={materials.recess} />
    <mesh geometry={box} position={[0, mouthY - .02, front - .36]} rotation={[.46, 0, 0]} scale={[innerWidth * .62, .065, .34]} material={materials.horn} />
    <mesh geometry={box} position={[-innerWidth / 2 + .04, mouthY, front - .22]} rotation={[0, -.22, 0]} scale={[.065, mouthHeight * .82, .48]} material={materials.horn} />
    <mesh geometry={box} position={[innerWidth / 2 - .04, mouthY, front - .22]} rotation={[0, .22, 0]} scale={[.065, mouthHeight * .82, .48]} material={materials.horn} />
    <SpeakerEmitterGlow band="low" activity={activity} position={[0, mouthY - .18, front - scoopDepth + .15]} size={.34} strength={glowStrength} />
  </group>;
}
function Kick({ activity, glowStrength }: { activity: number; glowStrength: number }) {
  const materials = useScoopMaterials(); const body = getSpeakerModel("reggae-kick", "woofer").body; const front = body.depth / 2 - .1; const rail = .06; const innerWidth = body.width - rail * 2; const wooferY = .1; const portY = -.32; const portHeight = .15;
  return <group>
    <mesh geometry={box} position={[0, 0, -body.depth / 2 + .035]} scale={[body.width, body.height, .07]} material={materials.cabinet} />
    <mesh geometry={box} position={[-body.width / 2 + .035, 0, 0]} scale={[.07, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[body.width / 2 - .035, 0, 0]} scale={[.07, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, body.height / 2 - .035, 0]} scale={[body.width, .07, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, -body.height / 2 + .035, 0]} scale={[body.width, .07, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, .08, front - .085]} scale={[innerWidth, .61, .065]} material={materials.recess} />
    <mesh geometry={box} position={[0, body.height / 2 - rail / 2, front + .025]} scale={[body.width, rail, .07]} material={materials.frame} />
    <mesh geometry={box} position={[0, -body.height / 2 + rail / 2, front + .025]} scale={[body.width, rail, .07]} material={materials.frame} />
    <mesh geometry={box} position={[-body.width / 2 + rail / 2, 0, front + .025]} scale={[rail, body.height, .07]} material={materials.frame} />
    <mesh geometry={box} position={[body.width / 2 - rail / 2, 0, front + .025]} scale={[rail, body.height, .07]} material={materials.frame} />
    <mesh geometry={box} position={[0, -.225, front + .026]} scale={[innerWidth, .055, .07]} material={materials.frame} />
    <mesh position={[0, wooferY, front - .04]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.36, .36, .036, 16]} /><primitive object={materials.hardware} attach="material" /></mesh>
    <mesh position={[0, wooferY, front - .005]}><torusGeometry args={[.3, .045, 6, 18]} /><primitive object={materials.surround} attach="material" /></mesh>
    <mesh position={[0, wooferY, front - .022]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[.28, .125, 18, 1, true]} /><primitive object={materials.cone} attach="material" /></mesh>
    <mesh position={[0, wooferY, front - .084]} scale={[1, 1, .45]}><sphereGeometry args={[.095, 12, 6]} /><primitive object={materials.dustCap} attach="material" /></mesh>
    {[-.265, .265].map((x) => [wooferY - .265, wooferY + .265].map((y) => <mesh key={`${x}:${y}`} position={[x, y, front - .01]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.017, .017, .026, 6]} /><primitive object={materials.hardware} attach="material" /></mesh>))}
    <mesh geometry={box} position={[0, portY, front - .3]} scale={[innerWidth * .78, portHeight * .72, .045]} material={materials.cavity} />
    <mesh geometry={box} position={[0, portY + portHeight / 2, front - .14]} scale={[innerWidth * .82, .028, .31]} material={materials.recess} />
    <mesh geometry={box} position={[0, portY - portHeight / 2, front - .13]} rotation={[.08, 0, 0]} scale={[innerWidth * .82, .03, .32]} material={materials.horn} />
    <mesh geometry={box} position={[-innerWidth * .41, portY, front - .14]} scale={[.03, portHeight, .31]} material={materials.horn} />
    <mesh geometry={box} position={[innerWidth * .41, portY, front - .14]} scale={[.03, portHeight, .31]} material={materials.horn} />
    <SpeakerEmitterGlow band="kick" activity={activity} position={[0, wooferY, front + .035]} size={.3} strength={glowStrength} />
  </group>;
}
function WoodenMidHorn({ x, front, materials, activity, glowStrength }: { x: number; front: number; materials: ReturnType<typeof useScoopMaterials>; activity: number; glowStrength: number }) {
  const mouthWidth = .4; const mouthHeight = .52; const throatZ = front - .43;
  return <group position={[x, 0, 0]}>
    <mesh geometry={box} position={[0, 0, throatZ]} scale={[.09, .07, .045]} material={materials.cavity} />
    <mesh geometry={box} position={[0, 0, throatZ + .025]} scale={[.055, .042, .026]} material={materials.hardware} />
    <mesh geometry={box} position={[0, mouthHeight * .34, front - .105]} rotation={[-.24, 0, 0]} scale={[mouthWidth, .038, .24]} material={materials.horn} />
    <mesh geometry={box} position={[0, -mouthHeight * .34, front - .105]} rotation={[.24, 0, 0]} scale={[mouthWidth, .038, .24]} material={materials.horn} />
    <mesh geometry={box} position={[-mouthWidth * .36, 0, front - .105]} rotation={[0, .27, 0]} scale={[.038, mouthHeight * .72, .24]} material={materials.horn} />
    <mesh geometry={box} position={[mouthWidth * .36, 0, front - .105]} rotation={[0, -.27, 0]} scale={[.038, mouthHeight * .72, .24]} material={materials.horn} />
    <mesh geometry={box} position={[0, .115, front - .285]} rotation={[-.22, 0, 0]} scale={[.218, .033, .19]} material={materials.recess} />
    <mesh geometry={box} position={[0, -.115, front - .285]} rotation={[.22, 0, 0]} scale={[.218, .033, .19]} material={materials.recess} />
    <mesh geometry={box} position={[-.12, 0, front - .285]} rotation={[0, .25, 0]} scale={[.033, .25, .19]} material={materials.recess} />
    <mesh geometry={box} position={[.12, 0, front - .285]} rotation={[0, -.25, 0]} scale={[.033, .25, .19]} material={materials.recess} />
    <mesh geometry={box} position={[0, .047, front - .385]} rotation={[-.18, 0, 0]} scale={[.112, .028, .105]} material={materials.horn} />
    <mesh geometry={box} position={[0, -.047, front - .385]} rotation={[.18, 0, 0]} scale={[.112, .028, .105]} material={materials.horn} />
    <mesh geometry={box} position={[-.06, 0, front - .385]} rotation={[0, .2, 0]} scale={[.028, .13, .105]} material={materials.horn} />
    <mesh geometry={box} position={[.06, 0, front - .385]} rotation={[0, -.2, 0]} scale={[.028, .13, .105]} material={materials.horn} />
    <SpeakerEmitterGlow band="mid" activity={activity} position={[0, 0, throatZ + .055]} size={.16} strength={glowStrength} />
  </group>;
}
function MidHorn({ activity, glowStrength }: { activity: number; glowStrength: number }) {
  const materials = useScoopMaterials(); const body = getSpeakerModel("reggae-mid-horn", "mid").body; const front = body.depth / 2 - .055; const rail = .065; const innerWidth = body.width - rail * 2;
  return <group>
    <mesh geometry={box} position={[0, 0, -body.depth / 2 + .035]} scale={[body.width, body.height, .07]} material={materials.cabinet} />
    <mesh geometry={box} position={[-body.width / 2 + .035, 0, 0]} scale={[.07, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[body.width / 2 - .035, 0, 0]} scale={[.07, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, body.height / 2 - .035, 0]} scale={[body.width, .07, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, -body.height / 2 + .035, 0]} scale={[body.width, .07, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, body.height / 2 - rail / 2, front + .025]} scale={[body.width, rail, .07]} material={materials.frame} />
    <mesh geometry={box} position={[0, -body.height / 2 + rail / 2, front + .025]} scale={[body.width, rail, .07]} material={materials.frame} />
    <mesh geometry={box} position={[-body.width / 2 + rail / 2, 0, front + .025]} scale={[rail, body.height, .07]} material={materials.frame} />
    <mesh geometry={box} position={[body.width / 2 - rail / 2, 0, front + .025]} scale={[rail, body.height, .07]} material={materials.frame} />
    <mesh geometry={box} position={[0, 0, front + .026]} scale={[.07, body.height - rail * 2, .07]} material={materials.frame} />
    <mesh geometry={box} position={[0, 0, front - .035]} scale={[innerWidth, body.height - rail * 2, .045]} material={materials.cavity} />
    <WoodenMidHorn x={-.223} front={front} materials={materials} activity={activity} glowStrength={glowStrength} />
    <WoodenMidHorn x={.223} front={front} materials={materials} activity={activity} glowStrength={glowStrength} />
  </group>;
}
function TopDriver({ x, y, front, materials }: { x: number; y: number; front: number; materials: ReturnType<typeof useScoopMaterials> }) {
  return <group position={[x, y, 0]}>
    <mesh geometry={box} position={[0, 0, front - .035]} scale={[.104, .104, .04]} material={materials.recess} />
    <mesh position={[0, 0, front + .01]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.039, .039, .03, 12]} /><primitive object={materials.hardware} attach="material" /></mesh>
    <mesh position={[0, 0, front + .029]}><torusGeometry args={[.027, .007, 5, 12]} /><primitive object={materials.surround} attach="material" /></mesh>
    <mesh position={[0, 0, front + .025]} scale={[1, 1, .4]}><sphereGeometry args={[.023, 10, 5]} /><primitive object={materials.dustCap} attach="material" /></mesh>
  </group>;
}
function Top({ activity, glowStrength }: { activity: number; glowStrength: number }) {
  const materials = useScoopMaterials(); const body = getSpeakerModel("reggae-top", "high").body; const front = body.depth / 2 - .045; const rail = .06; const hornWidth = .41; const hornHeight = .19; const throatZ = front - .245;
  return <group>
    <mesh geometry={box} position={[0, 0, -body.depth / 2 + .032]} scale={[body.width, body.height, .064]} material={materials.cabinet} />
    <mesh geometry={box} position={[-body.width / 2 + .032, 0, 0]} scale={[.064, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[body.width / 2 - .032, 0, 0]} scale={[.064, body.height, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, body.height / 2 - .032, 0]} scale={[body.width, .064, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, -body.height / 2 + .032, 0]} scale={[body.width, .064, body.depth]} material={materials.cabinet} />
    <mesh geometry={box} position={[0, body.height / 2 - rail / 2, front + .024]} scale={[body.width, rail, .065]} material={materials.frame} />
    <mesh geometry={box} position={[0, -body.height / 2 + rail / 2, front + .024]} scale={[body.width, rail, .065]} material={materials.frame} />
    <mesh geometry={box} position={[-body.width / 2 + rail / 2, 0, front + .024]} scale={[rail, body.height, .065]} material={materials.frame} />
    <mesh geometry={box} position={[body.width / 2 - rail / 2, 0, front + .024]} scale={[rail, body.height, .065]} material={materials.frame} />
    <mesh geometry={box} position={[0, 0, front - .025]} scale={[.47, .26, .045]} material={materials.cavity} />
    <mesh geometry={box} position={[0, hornHeight * .34, front - .07]} rotation={[-.2, 0, 0]} scale={[hornWidth, .028, .15]} material={materials.horn} />
    <mesh geometry={box} position={[0, -hornHeight * .34, front - .07]} rotation={[.2, 0, 0]} scale={[hornWidth, .028, .15]} material={materials.horn} />
    <mesh geometry={box} position={[-hornWidth * .36, 0, front - .07]} rotation={[0, .22, 0]} scale={[.028, hornHeight * .72, .15]} material={materials.horn} />
    <mesh geometry={box} position={[hornWidth * .36, 0, front - .07]} rotation={[0, -.22, 0]} scale={[.028, hornHeight * .72, .15]} material={materials.horn} />
    <mesh geometry={box} position={[0, .045, front - .175]} rotation={[-.16, 0, 0]} scale={[.215, .024, .11]} material={materials.recess} />
    <mesh geometry={box} position={[0, -.045, front - .175]} rotation={[.16, 0, 0]} scale={[.215, .024, .11]} material={materials.recess} />
    <mesh geometry={box} position={[-.115, 0, front - .175]} rotation={[0, .18, 0]} scale={[.024, .105, .11]} material={materials.recess} />
    <mesh geometry={box} position={[.115, 0, front - .175]} rotation={[0, -.18, 0]} scale={[.024, .105, .11]} material={materials.recess} />
    <mesh geometry={box} position={[0, 0, throatZ]} scale={[.07, .035, .04]} material={materials.cavity} />
    <mesh geometry={box} position={[0, 0, throatZ + .023]} scale={[.04, .022, .025]} material={materials.hardware} />
    <TopDriver x={-.315} y={.09} front={front} materials={materials} />
    <TopDriver x={-.315} y={-.09} front={front} materials={materials} />
    <TopDriver x={.315} y={.09} front={front} materials={materials} />
    <TopDriver x={.315} y={-.09} front={front} materials={materials} />
    <SpeakerEmitterGlow band="high" activity={activity} position={[0, 0, throatZ + .06]} size={.17} strength={glowStrength} />
  </group>;
}

export default function ReggaeSpeakerModel({ modelId, kind, activity, bandActivity, selected = false, glowStrength = .8, cabinetColor }: Props) { const model = getSpeakerModel(modelId, kind); const bands = bandActivity ?? { overall: activity, low: activity, mid: activity, high: activity }; return <CabinetColorContext.Provider value={cabinetColor}><group>{modelId === "reggae-scoop" && <Scoop activity={bands.low} glowStrength={glowStrength} />}{modelId === "reggae-kick" && <Kick activity={bands.low} glowStrength={glowStrength} />}{modelId === "reggae-mid-horn" && <MidHorn activity={bands.mid} glowStrength={glowStrength} />}{modelId === "reggae-top" && <Top activity={bands.high} glowStrength={glowStrength} />}{selected && <mesh geometry={box} scale={[model.body.width * 1.018, model.body.height * 1.018, model.body.depth * 1.018]} material={selection} />}</group></CabinetColorContext.Provider>; }
