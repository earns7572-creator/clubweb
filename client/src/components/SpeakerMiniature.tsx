/**
 * Club Craft PA Miniatures — shared procedural PA geometry with per-Speaker emissive materials.
 * Geometry is module-level and reused; each mounted Speaker owns only cabinet / horn / driver materials.
 * Activity is rendered by the physical speaker surfaces themselves, never by additive overlays or lights.
 */
import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { SpeakerKind } from "@/hooks/useClubAudio";

type Props = { kind: SpeakerKind; activity: number; selected?: boolean; showHaze?: boolean; idleVisible?: boolean };
type ActivityProfile = { attack: number; spread: number; rim: number; driver: number };
type Blueprint = { body: [number, number, number]; profile: ActivityProfile; cabinet: THREE.ExtrudeGeometry; edges: THREE.EdgesGeometry };
type HornProps = { geometry: THREE.BufferGeometry; x?: number; y: number; frontZ: number; mouthWidth: number; mouthHeight: number; throatWidth: number; throatHeight: number; depth: number; folded?: boolean; openThroat?: boolean };
type SpeakerMaterials = { cabinet: THREE.MeshStandardMaterial; horn: THREE.MeshStandardMaterial; driver: THREE.MeshStandardMaterial };

const passiveFrameMaterial = new THREE.MeshStandardMaterial({ color: "#393a31", roughness: .59, metalness: .19 });
const passiveDetailMaterial = new THREE.MeshStandardMaterial({ color: "#2d2e28", roughness: .82 });
const passiveMetalMaterial = new THREE.MeshStandardMaterial({ color: "#55554b", roughness: .4, metalness: .5 });
const passiveFootMaterial = new THREE.MeshStandardMaterial({ color: "#080907", roughness: .87, metalness: .08 });
const selectionMaterial = new THREE.MeshBasicMaterial({ color: "#d5c2a8", transparent: true, opacity: .028, side: THREE.BackSide });
const idleEdgeMaterial = new THREE.LineBasicMaterial({ color: "#c4c0b3", transparent: true, opacity: .42 });

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const wooferMount = new THREE.CylinderGeometry(1, 1, .028, 24);
const wooferSurround = new THREE.TorusGeometry(1, .13, 6, 24);
const wooferCone = new THREE.ConeGeometry(1, .18, 24, 1, true);
const dustCap = new THREE.SphereGeometry(1, 16, 10);
const fastenerHead = new THREE.CylinderGeometry(.042, .042, .018, 12);
const compressionNeck = new THREE.CylinderGeometry(.085, .085, .18, 16);
const compressionDriver = new THREE.CylinderGeometry(.18, .15, .34, 18);
const compressionMagnet = new THREE.CylinderGeometry(.22, .22, .13, 18);

function makeChamferCabinet(width: number, height: number, depth: number, taper = 0) {
  const top = width * (1 - taper); const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2); shape.lineTo(width / 2, -height / 2); shape.lineTo(top / 2, height / 2); shape.lineTo(-top / 2, height / 2); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .042, bevelSize: .032, bevelSegments: 1, curveSegments: 1 });
  geometry.translate(0, 0, -depth / 2); geometry.computeVertexNormals(); return geometry;
}

function makeHornFlare(mouthWidth: number, mouthHeight: number, throatWidth: number, throatHeight: number, depth: number) {
  const vertices = new Float32Array([
    -mouthWidth / 2, -mouthHeight / 2, 0, mouthWidth / 2, -mouthHeight / 2, 0, mouthWidth / 2, mouthHeight / 2, 0, -mouthWidth / 2, mouthHeight / 2, 0,
    -throatWidth / 2, -throatHeight / 2, -depth, throatWidth / 2, -throatHeight / 2, -depth, throatWidth / 2, throatHeight / 2, -depth, -throatWidth / 2, throatHeight / 2, -depth,
  ]);
  const index = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3)); geometry.setIndex(index); geometry.computeVertexNormals(); return geometry;
}

const foldedSubHorn = makeHornFlare(.9, .62, .24, .18, .36);
const upperWooferHorn = makeHornFlare(.84, .38, .19, .1, .34);
const lowerWooferHorn = makeHornFlare(.84, .54, .22, .15, .34);
const fullHorn = makeHornFlare(.74, .42, .18, .11, .36);
const midHorn = makeHornFlare(.62, .22, .14, .08, .23);
const highHorn = makeHornFlare(1.02, .42, .16, .1, .42);

function makeBlueprint(body: [number, number, number], profile: ActivityProfile, taper: number): Blueprint { const cabinet = makeChamferCabinet(...body, taper); return { body, profile, cabinet, edges: new THREE.EdgesGeometry(cabinet, 14) }; }
const blueprints: Record<SpeakerKind, Blueprint> = {
  sub: makeBlueprint([2.42, .92, 1.42], { attack: .68, spread: 1.48, rim: .17, driver: .28 }, .018),
  woofer: makeBlueprint([1.18, 1.56, 1.1], { attack: .82, spread: 1.05, rim: .21, driver: .38 }, .045),
  full: makeBlueprint([1.12, 2.04, 1.1], { attack: .9, spread: .9, rim: .27, driver: .42 }, .115),
  mid: makeBlueprint([.86, .92, .56], { attack: 1.18, spread: .62, rim: .2, driver: .48 }, .04),
  high: makeBlueprint([1.18, .6, 1.18], { attack: 1.38, spread: .48, rim: .16, driver: .5 }, .1),
};
const activityTint: Record<SpeakerKind, string> = { sub: "#b99d7c", woofer: "#c4aa83", full: "#d4be96", mid: "#d1be99", high: "#ddd0b7" };
const emissiveResponse: Record<SpeakerKind, { cabinet: number; horn: number; driver: number }> = {
  sub: { cabinet: .10, horn: .72, driver: .80 }, woofer: { cabinet: .12, horn: .66, driver: .88 }, full: { cabinet: .12, horn: .62, driver: .94 }, mid: { cabinet: .075, horn: .56, driver: .96 }, high: { cabinet: .025, horn: .66, driver: 1.08 },
};

function createSpeakerMaterials(): SpeakerMaterials {
  return {
    cabinet: new THREE.MeshStandardMaterial({ color: "#171815", roughness: .74, metalness: .08, emissive: "#000000", emissiveIntensity: .01 }),
    horn: new THREE.MeshStandardMaterial({ color: "#11120f", roughness: .66, metalness: .04, side: THREE.DoubleSide, emissive: "#000000", emissiveIntensity: .015 }),
    driver: new THREE.MeshStandardMaterial({ color: "#0a0b08", roughness: .54, metalness: .05, side: THREE.DoubleSide, emissive: "#000000", emissiveIntensity: .02 }),
  };
}

function useSpeakerMaterials(kind: SpeakerKind, activity: number) {
  const materials = useMemo(createSpeakerMaterials, []);
  const { invalidate } = useThree();
  useEffect(() => () => { materials.cabinet.dispose(); materials.horn.dispose(); materials.driver.dispose(); }, [materials]);
  useEffect(() => {
    const active = Math.max(0, Math.min(1, activity)); const tint = new THREE.Color(activityTint[kind]); const response = emissiveResponse[kind];
    materials.cabinet.emissive.copy(tint).multiplyScalar(.55); materials.horn.emissive.copy(tint); materials.driver.emissive.copy(tint).multiplyScalar(1.05);
    materials.cabinet.emissiveIntensity = .008 + active * response.cabinet;
    materials.horn.emissiveIntensity = .014 + active * response.horn;
    materials.driver.emissiveIntensity = .018 + active * response.driver;
    invalidate();
  }, [activity, invalidate, kind, materials]);
  return materials;
}

function CabinetFeet({ width, height, depth, count = 2 }: { width: number; height: number; depth: number; count?: number }) {
  const positions = count === 4 ? [[-.37, -.3], [.37, -.3], [-.37, .3], [.37, .3]] : [[-.34, .12], [.34, .12]];
  return <group position={[0, -height / 2 - .06, 0]}>{positions.map(([x, z], index) => <mesh key={index} geometry={unitBox} position={[x * width, 0, z * depth]} scale={[.12, .12, .14]} material={passiveFootMaterial} />)}</group>;
}
function CornerFasteners({ width, height, frontZ, inset = .08 }: { width: number; height: number; frontZ: number; inset?: number }) { return <>{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y], index) => <mesh key={index} geometry={fastenerHead} rotation={[Math.PI / 2, 0, 0]} position={[x * (width / 2 - inset), y * (height / 2 - inset), frontZ]} material={passiveMetalMaterial} />)}</>; }

function WooferAssembly({ size, y, frontZ, materials, fasteners = true }: { size: number; y: number; frontZ: number; materials: SpeakerMaterials; fasteners?: boolean }) {
  return <group position={[0, y, frontZ]}>
    <mesh geometry={wooferMount} rotation={[Math.PI / 2, 0, 0]} scale={[size * 1.16, size * 1.16, 1]} material={materials.cabinet} />
    <mesh geometry={wooferSurround} position={[0, 0, .032]} scale={[size, size, 1]} material={materials.cabinet} />
    <mesh geometry={wooferCone} position={[0, 0, .045]} rotation={[Math.PI / 2, 0, 0]} scale={[size * .81, size * .81, 1]} material={materials.driver} />
    <mesh geometry={dustCap} position={[0, 0, .082]} scale={[size * .26, size * .26, size * .085]} material={materials.driver} />
    {fasteners && [[-.72, -.72], [.72, -.72], [-.72, .72], [.72, .72]].map(([x, yOffset], index) => <mesh key={index} geometry={fastenerHead} rotation={[Math.PI / 2, 0, 0]} position={[x * size, yOffset * size, .07]} material={passiveMetalMaterial} />)}
  </group>;
}

function HornFlare({ geometry, x = 0, y, frontZ, mouthWidth, mouthHeight, throatWidth, throatHeight, depth, folded = false, openThroat = false, materials }: HornProps & { materials: SpeakerMaterials }) {
  return <group position={[x, y, frontZ]}>
    <mesh geometry={geometry} material={materials.horn} />
    <mesh geometry={unitBox} position={[0, mouthHeight / 2, .014]} scale={[mouthWidth, .038, .055]} material={passiveFrameMaterial} /><mesh geometry={unitBox} position={[0, -mouthHeight / 2, .014]} scale={[mouthWidth, .038, .055]} material={passiveFrameMaterial} />
    <mesh geometry={unitBox} position={[-mouthWidth / 2, 0, .014]} scale={[.038, mouthHeight, .055]} material={passiveFrameMaterial} /><mesh geometry={unitBox} position={[mouthWidth / 2, 0, .014]} scale={[.038, mouthHeight, .055]} material={passiveFrameMaterial} />
    {!openThroat && <mesh geometry={unitBox} position={[0, 0, -depth + .014]} scale={[throatWidth, throatHeight, .028]} material={materials.driver} />}
    {folded && <><mesh geometry={unitBox} position={[-mouthWidth * .17, 0, -depth * .17]} rotation={[0, 0, -.43]} scale={[.072, mouthHeight * .78, .055]} material={passiveFrameMaterial} /><mesh geometry={unitBox} position={[mouthWidth * .17, 0, -depth * .17]} rotation={[0, 0, .43]} scale={[.072, mouthHeight * .78, .055]} material={passiveFrameMaterial} /><mesh geometry={unitBox} position={[0, 0, -depth * .08]} scale={[.038, mouthHeight * .76, .055]} material={passiveDetailMaterial} /></>}
  </group>;
}

function FoldedHornChamber({ geometry, x = 0, y, frontZ, mouthWidth, mouthHeight, throatWidth, throatHeight, flareDepth, tunnelDepth, materials }: { geometry: THREE.BufferGeometry; x?: number; y: number; frontZ: number; mouthWidth: number; mouthHeight: number; throatWidth: number; throatHeight: number; flareDepth: number; tunnelDepth: number; materials: SpeakerMaterials }) {
  const tunnelZ = -flareDepth - tunnelDepth / 2;
  return <group position={[x, y, frontZ]}><HornFlare geometry={geometry} mouthWidth={mouthWidth} mouthHeight={mouthHeight} throatWidth={throatWidth} throatHeight={throatHeight} depth={flareDepth} folded openThroat y={0} frontZ={0} materials={materials} /><mesh geometry={unitBox} position={[-throatWidth / 2 - .028, 0, tunnelZ]} scale={[.056, throatHeight + .09, tunnelDepth]} material={passiveDetailMaterial} /><mesh geometry={unitBox} position={[throatWidth / 2 + .028, 0, tunnelZ]} scale={[.056, throatHeight + .09, tunnelDepth]} material={passiveDetailMaterial} /><mesh geometry={unitBox} position={[0, throatHeight / 2 + .035, tunnelZ]} scale={[throatWidth + .1, .055, tunnelDepth]} material={passiveDetailMaterial} /><mesh geometry={unitBox} position={[0, -throatHeight / 2 - .035, tunnelZ]} scale={[throatWidth + .1, .055, tunnelDepth]} material={passiveDetailMaterial} /><mesh geometry={unitBox} position={[0, 0, -flareDepth - tunnelDepth + .018]} scale={[throatWidth * .58, throatHeight * .58, .038]} material={materials.driver} /><mesh geometry={unitBox} position={[-throatWidth * .42, 0, -flareDepth - tunnelDepth * .27]} rotation={[0, 0, -.36]} scale={[.04, throatHeight * 1.12, .05]} material={passiveFrameMaterial} /><mesh geometry={unitBox} position={[throatWidth * .42, 0, -flareDepth - tunnelDepth * .67]} rotation={[0, 0, .36]} scale={[.04, throatHeight * 1.12, .05]} material={passiveFrameMaterial} /></group>;
}

function BafflePlate({ width, height, frontZ, materials }: { width: number; height: number; frontZ: number; materials: SpeakerMaterials }) { return <><mesh geometry={unitBox} position={[0, 0, frontZ]} scale={[width, height, .055]} material={materials.cabinet} /><mesh geometry={unitBox} position={[0, 0, frontZ + .032]} scale={[width * .91, height * .91, .012]} material={materials.cabinet} /></>; }

function SubModel({ blueprint, materials }: { blueprint: Blueprint; materials: SpeakerMaterials }) { const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075; return <><mesh geometry={blueprint.cabinet} material={materials.cabinet} /><FoldedHornChamber geometry={foldedSubHorn} x={-.57} y={.01} frontZ={frontZ} mouthWidth={.9} mouthHeight={.62} throatWidth={.24} throatHeight={.18} flareDepth={.36} tunnelDepth={.28} materials={materials} /><FoldedHornChamber geometry={foldedSubHorn} x={.57} y={.01} frontZ={frontZ} mouthWidth={.9} mouthHeight={.62} throatWidth={.24} throatHeight={.18} flareDepth={.36} tunnelDepth={.28} materials={materials} /><mesh geometry={unitBox} position={[0, .01, frontZ + .025]} scale={[.07, height * .71, .095]} material={passiveFrameMaterial} /><mesh geometry={unitBox} position={[0, -height * .31, frontZ + .018]} scale={[width * .82, .045, .068]} material={passiveDetailMaterial} /><CornerFasteners width={width * .92} height={height * .78} frontZ={frontZ + .055} inset={.06} /><CabinetFeet width={width} height={height} depth={depth} count={4} /></>; }
function WooferModel({ blueprint, materials }: { blueprint: Blueprint; materials: SpeakerMaterials }) { const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075; return <><mesh geometry={blueprint.cabinet} material={materials.cabinet} /><FoldedHornChamber geometry={upperWooferHorn} y={.43} frontZ={frontZ} mouthWidth={.84} mouthHeight={.38} throatWidth={.19} throatHeight={.1} flareDepth={.34} tunnelDepth={.2} materials={materials} /><mesh geometry={unitBox} position={[0, .06, frontZ + .022]} scale={[width * .77, .065, .07]} material={passiveDetailMaterial} /><FoldedHornChamber geometry={lowerWooferHorn} y={-.43} frontZ={frontZ} mouthWidth={.84} mouthHeight={.54} throatWidth={.22} throatHeight={.15} flareDepth={.34} tunnelDepth={.24} materials={materials} /><mesh geometry={unitBox} position={[0, -.43, frontZ + .038]} scale={[.055, .43, .07]} material={passiveFrameMaterial} /><CornerFasteners width={width * .88} height={height * .87} frontZ={frontZ + .05} /><CabinetFeet width={width} height={height} depth={depth} /></>; }
function SideHandles({ width, y }: { width: number; y: number }) { return <>{[-1, 1].map((direction) => <group key={direction} position={[direction * (width / 2 + .008), y, .04]} rotation={[0, Math.PI / 2, 0]}><mesh geometry={unitBox} scale={[.3, .17, .03]} material={passiveDetailMaterial} /><mesh geometry={unitBox} position={[0, .1, .02]} scale={[.35, .025, .045]} material={passiveDetailMaterial} /></group>)}</>; }
function FullModel({ blueprint, materials }: { blueprint: Blueprint; materials: SpeakerMaterials }) { const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075; return <group rotation={[-.055, 0, 0]}><mesh geometry={blueprint.cabinet} material={materials.cabinet} /><BafflePlate width={width * .82} height={height * .84} frontZ={depth / 2 + .025} materials={materials} /><HornFlare geometry={fullHorn} y={.55} frontZ={frontZ} mouthWidth={.74} mouthHeight={.42} throatWidth={.18} throatHeight={.11} depth={.36} materials={materials} /><WooferAssembly size={.34} y={-.42} frontZ={depth / 2 + .075} materials={materials} /><mesh geometry={unitBox} position={[0, .08, frontZ + .025]} scale={[width * .71, .035, .06]} material={passiveMetalMaterial} />{[-.26, .26].map((x, index) => <mesh key={index} geometry={unitBox} position={[x, -height * .39, frontZ + .035]} scale={[.16, .065, .065]} material={materials.driver} />)}<SideHandles width={width} y={-.02} /><CornerFasteners width={width * .85} height={height * .86} frontZ={frontZ + .053} /><CabinetFeet width={width} height={height} depth={depth} /></group>; }
function MidModel({ blueprint, materials }: { blueprint: Blueprint; materials: SpeakerMaterials }) { const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .07; return <><mesh geometry={blueprint.cabinet} material={materials.cabinet} /><BafflePlate width={width * .82} height={height * .72} frontZ={depth / 2 + .022} materials={materials} /><HornFlare geometry={midHorn} y={.16} frontZ={frontZ} mouthWidth={.62} mouthHeight={.22} throatWidth={.14} throatHeight={.08} depth={.23} materials={materials} /><WooferAssembly size={.27} y={-.17} frontZ={depth / 2 + .065} materials={materials} /><mesh geometry={unitBox} position={[0, -height * .35, frontZ + .025]} scale={[width * .53, .07, .05]} material={materials.driver} /><CornerFasteners width={width * .84} height={height * .76} frontZ={frontZ + .045} inset={.055} /></>; }
function HighModel({ blueprint, materials }: { blueprint: Blueprint; materials: SpeakerMaterials }) { const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075; return <><HornFlare geometry={highHorn} y={.02} frontZ={frontZ} mouthWidth={1.02} mouthHeight={.42} throatWidth={.16} throatHeight={.1} depth={.42} materials={materials} /><mesh geometry={compressionNeck} rotation={[Math.PI / 2, 0, 0]} position={[0, .02, frontZ - .53]} material={materials.driver} /><mesh geometry={compressionDriver} rotation={[Math.PI / 2, 0, 0]} position={[0, .02, frontZ - .78]} material={materials.driver} /><mesh geometry={compressionMagnet} rotation={[Math.PI / 2, 0, 0]} position={[0, .02, frontZ - 1.01]} material={passiveDetailMaterial} />{[-.28, .28].map((x, index) => <mesh key={index} geometry={unitBox} position={[x, 0, frontZ - .74]} scale={[.06, .46, .58]} material={passiveDetailMaterial} />)}{[-.25, .25].map((y, index) => <mesh key={index} geometry={unitBox} position={[0, y, frontZ - .74]} scale={[.62, .06, .58]} material={passiveDetailMaterial} />)}{[-.42, .42].map((x, index) => <mesh key={index} geometry={unitBox} position={[x, -.32, frontZ - .48]} scale={[.065, .25, .1]} material={passiveFootMaterial} />)}<CornerFasteners width={width * .9} height={height * .8} frontZ={frontZ + .052} inset={.07} /></>; }

export function SpeakerMiniature({ kind, activity, selected = false, showHaze = true, idleVisible = false }: Props) {
  const blueprint = blueprints[kind]; const materials = useSpeakerMaterials(kind, activity); void showHaze;
  return <group>{idleVisible && <lineSegments geometry={blueprint.edges} material={idleEdgeMaterial} rotation={kind === "full" ? [-.055, 0, 0] : undefined} />}{kind === "sub" && <SubModel blueprint={blueprint} materials={materials} />}{kind === "woofer" && <WooferModel blueprint={blueprint} materials={materials} />}{kind === "full" && <FullModel blueprint={blueprint} materials={materials} />}{kind === "mid" && <MidModel blueprint={blueprint} materials={materials} />}{kind === "high" && <HighModel blueprint={blueprint} materials={materials} />}{selected && <mesh geometry={blueprint.cabinet} scale={[1.018, 1.018, 1.018]} rotation={kind === "full" ? [-.055, 0, 0] : undefined} material={selectionMaterial} />}</group>;
}

export const speakerBlueprints = blueprints;
