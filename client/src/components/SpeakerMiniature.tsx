/**
 * Club Craft PA Miniatures — shared, module-level procedural PA geometry for TOP and POV.
 * The design is intentionally original: folded-horn structure, deep flares and driver recesses
 * reference general PA construction, never a branded product. No geometry is allocated in render.
 */
import * as THREE from "three";
import type { SpeakerKind } from "@/hooks/useClubAudio";

type Props = { kind: SpeakerKind; activity: number; selected?: boolean; showHaze?: boolean; idleVisible?: boolean };
type ActivityProfile = { attack: number; spread: number; rim: number; driver: number };
type Blueprint = { body: [number, number, number]; profile: ActivityProfile; cabinet: THREE.ExtrudeGeometry; edges: THREE.EdgesGeometry };
type HornProps = { geometry: THREE.BufferGeometry; x?: number; y: number; frontZ: number; mouthWidth: number; mouthHeight: number; throatWidth: number; throatHeight: number; depth: number; activity: number; character: number; color: string; folded?: boolean };

const cabinetMaterial = new THREE.MeshStandardMaterial({ color: "#171815", roughness: .74, metalness: .08 });
const baffleMaterial = new THREE.MeshStandardMaterial({ color: "#0b0c0a", roughness: .9, metalness: .03 });
const grilleMaterial = new THREE.MeshStandardMaterial({ color: "#050604", roughness: .82, metalness: .12 });
const hornExteriorMaterial = new THREE.MeshStandardMaterial({ color: "#20211c", roughness: .62, metalness: .12, side: THREE.DoubleSide });
const hornInteriorMaterial = new THREE.MeshStandardMaterial({ color: "#020302", roughness: .66, metalness: .04, side: THREE.DoubleSide });
const hornFrameMaterial = new THREE.MeshStandardMaterial({ color: "#393a31", roughness: .59, metalness: .19 });
const wooferSurroundMaterial = new THREE.MeshStandardMaterial({ color: "#262721", roughness: .66 });
const wooferConeMaterial = new THREE.MeshStandardMaterial({ color: "#080906", roughness: .54 });
const dustCapMaterial = new THREE.MeshStandardMaterial({ color: "#34352e", roughness: .7 });
const footMaterial = new THREE.MeshStandardMaterial({ color: "#080907", roughness: .87, metalness: .08 });
const detailMaterial = new THREE.MeshStandardMaterial({ color: "#2d2e28", roughness: .82 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: "#55554b", roughness: .4, metalness: .5 });
const selectionMaterial = new THREE.MeshBasicMaterial({ color: "#d5c2a8", transparent: true, opacity: .028, side: THREE.BackSide });
const idleEdgeMaterial = new THREE.LineBasicMaterial({ color: "#c4c0b3", transparent: true, opacity: .42 });

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const wooferMount = new THREE.CylinderGeometry(1, 1, .028, 24);
const wooferSurround = new THREE.TorusGeometry(1, .13, 6, 24);
const wooferCone = new THREE.ConeGeometry(1, .18, 24, 1, true);
const dustCap = new THREE.SphereGeometry(1, 16, 10);
const fastenerHead = new THREE.CylinderGeometry(.042, .042, .018, 12);

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
const midHorn = makeHornFlare(.5, .25, .14, .08, .23);
const highHorn = makeHornFlare(1.02, .42, .16, .1, .42);

const blueprints: Record<SpeakerKind, Blueprint> = {
  sub: { body: [2.42, .92, 1.42], profile: { attack: .68, spread: 1.48, rim: .17, driver: .28 }, cabinet: makeChamferCabinet(2.42, .92, 1.42, .018), edges: new THREE.EdgesGeometry(makeChamferCabinet(2.42, .92, 1.42, .018), 14) },
  woofer: { body: [1.18, 1.56, 1.1], profile: { attack: .82, spread: 1.05, rim: .21, driver: .38 }, cabinet: makeChamferCabinet(1.18, 1.56, 1.1, .045), edges: new THREE.EdgesGeometry(makeChamferCabinet(1.18, 1.56, 1.1, .045), 14) },
  full: { body: [1.12, 2.04, 1.1], profile: { attack: .9, spread: .9, rim: .27, driver: .42 }, cabinet: makeChamferCabinet(1.12, 2.04, 1.1, .115), edges: new THREE.EdgesGeometry(makeChamferCabinet(1.12, 2.04, 1.1, .115), 14) },
  mid: { body: [.8, 1.06, .68], profile: { attack: 1.18, spread: .62, rim: .2, driver: .48 }, cabinet: makeChamferCabinet(.8, 1.06, .68, .055), edges: new THREE.EdgesGeometry(makeChamferCabinet(.8, 1.06, .68, .055), 14) },
  high: { body: [1.18, .6, .86], profile: { attack: 1.38, spread: .48, rim: .16, driver: .5 }, cabinet: makeChamferCabinet(1.18, .6, .86, .1), edges: new THREE.EdgesGeometry(makeChamferCabinet(1.18, .6, .86, .1), 14) },
};
const activityColor: Record<SpeakerKind, string> = { sub: "#ef3e32", woofer: "#f06a31", full: "#f2a842", mid: "#e7d64b", high: "#56d46a" };

function CabinetFeet({ width, height, depth, count = 2 }: { width: number; height: number; depth: number; count?: number }) {
  const positions = count === 4 ? [[-.37, -.3], [.37, -.3], [-.37, .3], [.37, .3]] : [[-.34, .12], [.34, .12]];
  return <group position={[0, -height / 2 - .06, 0]}>{positions.map(([x, z], index) => <mesh key={index} geometry={unitBox} position={[x * width, 0, z * depth]} scale={[.12, .12, .14]} material={footMaterial} />)}</group>;
}

function CornerFasteners({ width, height, frontZ, inset = .08 }: { width: number; height: number; frontZ: number; inset?: number }) {
  return <>{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y], index) => <mesh key={index} geometry={fastenerHead} rotation={[Math.PI / 2, 0, 0]} position={[x * (width / 2 - inset), y * (height / 2 - inset), frontZ]} material={metalMaterial} />)}</>;
}

function WooferAssembly({ size, y, frontZ, activity, character, color, fasteners = true }: { size: number; y: number; frontZ: number; activity: number; character: number; color: string; fasteners?: boolean }) {
  const pulse = activity * character;
  return <group position={[0, y, frontZ]}>
    <mesh geometry={wooferMount} rotation={[Math.PI / 2, 0, 0]} scale={[size * 1.16, size * 1.16, 1]} material={baffleMaterial} />
    <mesh geometry={wooferSurround} position={[0, 0, .032]} scale={[size, size, 1]} material={wooferSurroundMaterial} />
    <mesh geometry={wooferCone} position={[0, 0, .045 + pulse * .012]} rotation={[Math.PI / 2, 0, 0]} scale={[size * .81, size * .81, 1]} material={wooferConeMaterial} />
    <mesh geometry={dustCap} position={[0, 0, .082 + pulse * .015]} scale={[size * .26, size * .26, size * .085]} material={dustCapMaterial} />
    {fasteners && [[-.72, -.72], [.72, -.72], [-.72, .72], [.72, .72]].map(([x, yOffset], index) => <mesh key={index} geometry={fastenerHead} rotation={[Math.PI / 2, 0, 0]} position={[x * size, yOffset * size, .07]} material={metalMaterial} />)}
    <pointLight color={color} intensity={pulse * .68} distance={.5 + size} decay={2} position={[0, 0, .18]} />
  </group>;
}

function HornFlare({ geometry, x = 0, y, frontZ, mouthWidth, mouthHeight, throatWidth, throatHeight, depth, activity, character, color, folded = false }: HornProps) {
  const pulse = activity * character;
  return <group position={[x, y, frontZ]}>
    <mesh geometry={geometry} material={hornExteriorMaterial} />
    <mesh geometry={unitBox} position={[0, mouthHeight / 2, .014]} scale={[mouthWidth, .038, .055]} material={hornFrameMaterial} />
    <mesh geometry={unitBox} position={[0, -mouthHeight / 2, .014]} scale={[mouthWidth, .038, .055]} material={hornFrameMaterial} />
    <mesh geometry={unitBox} position={[-mouthWidth / 2, 0, .014]} scale={[.038, mouthHeight, .055]} material={hornFrameMaterial} />
    <mesh geometry={unitBox} position={[mouthWidth / 2, 0, .014]} scale={[.038, mouthHeight, .055]} material={hornFrameMaterial} />
    <mesh geometry={unitBox} position={[0, 0, -depth + .014]} scale={[throatWidth, throatHeight, .028]} material={hornInteriorMaterial} />
    {folded && <><mesh geometry={unitBox} position={[-mouthWidth * .17, 0, -depth * .17]} rotation={[0, 0, -.43]} scale={[.072, mouthHeight * .78, .055]} material={hornFrameMaterial} /><mesh geometry={unitBox} position={[mouthWidth * .17, 0, -depth * .17]} rotation={[0, 0, .43]} scale={[.072, mouthHeight * .78, .055]} material={hornFrameMaterial} /><mesh geometry={unitBox} position={[0, 0, -depth * .08]} scale={[.038, mouthHeight * .76, .055]} material={detailMaterial} /></>}
    <pointLight color={color} intensity={pulse * .88} distance={.86} decay={2} position={[0, 0, .09]} />
  </group>;
}

function BafflePlate({ width, height, frontZ }: { width: number; height: number; frontZ: number }) {
  return <><mesh geometry={unitBox} position={[0, 0, frontZ]} scale={[width, height, .055]} material={baffleMaterial} /><mesh geometry={unitBox} position={[0, 0, frontZ + .032]} scale={[width * .91, height * .91, .012]} material={grilleMaterial} /></>;
}

function SubModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) {
  const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075;
  return <>
    <mesh geometry={blueprint.cabinet} material={cabinetMaterial} />
    <BafflePlate width={width * .9} height={height * .72} frontZ={depth / 2 + .03} />
    <HornFlare geometry={foldedSubHorn} x={-.57} y={.01} frontZ={frontZ} mouthWidth={.9} mouthHeight={.62} throatWidth={.24} throatHeight={.18} depth={.36} activity={activity} character={blueprint.profile.driver} color={color} folded />
    <HornFlare geometry={foldedSubHorn} x={.57} y={.01} frontZ={frontZ} mouthWidth={.9} mouthHeight={.62} throatWidth={.24} throatHeight={.18} depth={.36} activity={activity} character={blueprint.profile.driver} color={color} folded />
    <mesh geometry={unitBox} position={[0, .01, frontZ + .025]} scale={[.07, height * .71, .095]} material={hornFrameMaterial} />
    <mesh geometry={unitBox} position={[0, -height * .31, frontZ + .018]} scale={[width * .82, .045, .068]} material={detailMaterial} />
    <CornerFasteners width={width * .92} height={height * .78} frontZ={frontZ + .055} inset={.06} />
    <CabinetFeet width={width} height={height} depth={depth} count={4} />
  </>;
}

function WooferModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) {
  const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075;
  return <>
    <mesh geometry={blueprint.cabinet} material={cabinetMaterial} />
    <BafflePlate width={width * .86} height={height * .85} frontZ={depth / 2 + .026} />
    <HornFlare geometry={upperWooferHorn} y={.43} frontZ={frontZ} mouthWidth={.84} mouthHeight={.38} throatWidth={.19} throatHeight={.1} depth={.34} activity={activity} character={blueprint.profile.driver} color={color} folded />
    <mesh geometry={unitBox} position={[0, .06, frontZ + .022]} scale={[width * .77, .065, .07]} material={detailMaterial} />
    <HornFlare geometry={lowerWooferHorn} y={-.43} frontZ={frontZ} mouthWidth={.84} mouthHeight={.54} throatWidth={.22} throatHeight={.15} depth={.34} activity={activity} character={blueprint.profile.driver} color={color} folded />
    <mesh geometry={unitBox} position={[0, -.43, frontZ + .038]} scale={[.055, .43, .07]} material={hornFrameMaterial} />
    <CornerFasteners width={width * .88} height={height * .87} frontZ={frontZ + .05} />
    <CabinetFeet width={width} height={height} depth={depth} />
  </>;
}

function SideHandles({ width, depth, y }: { width: number; depth: number; y: number }) {
  return <>{[-1, 1].map((direction) => <group key={direction} position={[direction * (width / 2 + .008), y, .04]} rotation={[0, Math.PI / 2, 0]}><mesh geometry={unitBox} scale={[.3, .17, .03]} material={hornInteriorMaterial} /><mesh geometry={unitBox} position={[0, .1, .02]} scale={[.35, .025, .045]} material={detailMaterial} /></group>)}</>;
}

function FullModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) {
  const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075;
  return <group rotation={[-.055, 0, 0]}>
    <mesh geometry={blueprint.cabinet} material={cabinetMaterial} />
    <BafflePlate width={width * .82} height={height * .84} frontZ={depth / 2 + .025} />
    <HornFlare geometry={fullHorn} y={.55} frontZ={frontZ} mouthWidth={.74} mouthHeight={.42} throatWidth={.18} throatHeight={.11} depth={.36} activity={activity} character={blueprint.profile.driver} color={color} />
    <WooferAssembly size={.34} y={-.42} frontZ={depth / 2 + .075} activity={activity} character={blueprint.profile.driver} color={color} />
    <mesh geometry={unitBox} position={[0, .08, frontZ + .025]} scale={[width * .71, .035, .06]} material={metalMaterial} />
    {[-.26, .26].map((x, index) => <mesh key={index} geometry={unitBox} position={[x, -height * .39, frontZ + .035]} scale={[.16, .065, .065]} material={hornInteriorMaterial} />)}
    <SideHandles width={width} depth={depth} y={-.02} />
    <CornerFasteners width={width * .85} height={height * .86} frontZ={frontZ + .053} />
    <CabinetFeet width={width} height={height} depth={depth} />
  </group>;
}

function MidModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) {
  const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .07;
  return <>
    <mesh geometry={blueprint.cabinet} material={cabinetMaterial} />
    <BafflePlate width={width * .8} height={height * .8} frontZ={depth / 2 + .022} />
    <HornFlare geometry={midHorn} y={.27} frontZ={frontZ} mouthWidth={.5} mouthHeight={.25} throatWidth={.14} throatHeight={.08} depth={.23} activity={activity} character={blueprint.profile.driver} color={color} />
    <WooferAssembly size={.22} y={-.2} frontZ={depth / 2 + .065} activity={activity} character={blueprint.profile.driver} color={color} />
    {[-.19, .19].map((x, index) => <mesh key={index} geometry={unitBox} position={[x, -height * .38, frontZ + .025]} scale={[.12, .06, .05]} material={hornInteriorMaterial} />)}
    <CornerFasteners width={width * .83} height={height * .83} frontZ={frontZ + .045} inset={.055} />
  </>;
}

function HighModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) {
  const [width, height, depth] = blueprint.body; const frontZ = depth / 2 + .075;
  return <>
    <mesh geometry={blueprint.cabinet} position={[0, 0, -.12]} material={cabinetMaterial} />
    <HornFlare geometry={highHorn} y={.02} frontZ={frontZ} mouthWidth={1.02} mouthHeight={.42} throatWidth={.16} throatHeight={.1} depth={.42} activity={activity} character={blueprint.profile.driver} color={color} />
    <mesh geometry={unitBox} position={[0, 0, -.49]} scale={[.3, .28, .34]} material={detailMaterial} />
    <mesh geometry={unitBox} position={[0, 0, -.68]} scale={[.18, .18, .18]} material={metalMaterial} />
    {[-.42, .42].map((x, index) => <mesh key={index} geometry={unitBox} position={[x, -.32, -.1]} scale={[.065, .25, .1]} material={footMaterial} />)}
    <CornerFasteners width={width * .9} height={height * .8} frontZ={frontZ + .052} inset={.07} />
  </>;
}

export function SpeakerMiniature({ kind, activity, selected = false, showHaze = true, idleVisible = false }: Props) {
  const blueprint = blueprints[kind]; const [width, height, depth] = blueprint.body; const visibleActivity = Math.max(0, Math.min(1, activity * blueprint.profile.attack)); const color = activityColor[kind];
  return <group>
    {idleVisible && <pointLight color="#ddd7c8" intensity={.72} distance={2.25 + blueprint.profile.spread * .55} decay={2} position={[0, .2, depth / 2 + .8]} />}
    {idleVisible && <lineSegments geometry={blueprint.edges} material={idleEdgeMaterial} />}
    <pointLight color={color} intensity={visibleActivity * (2.1 + blueprint.profile.spread * .9)} distance={1.7 + blueprint.profile.spread * 1.7} decay={2} position={[0, 0, depth / 2 + .52]} />
    {showHaze && visibleActivity > .018 && <group position={[0, 0, depth / 2 + .17]}>{[0, 1].map((layer) => <mesh key={layer} position={[0, 0, layer * .035]} rotation={[Math.PI / 2 + layer * .13, layer * .3, 0]}><circleGeometry args={[Math.max(width, height) * (.34 + blueprint.profile.spread * .14 + layer * .1), 20]} /><meshBasicMaterial color={color} transparent opacity={visibleActivity * (.055 + blueprint.profile.spread * .022)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>)}</group>}
    {kind === "sub" && <SubModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "woofer" && <WooferModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "full" && <FullModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "mid" && <MidModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "high" && <HighModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {selected && <mesh geometry={blueprint.cabinet} scale={[1.018, 1.018, 1.018]} material={selectionMaterial} />}
  </group>;
}

export const speakerBlueprints = blueprints;
