/**
 * Club Craft PA Miniature — a shared procedural rendering layer for TOP and POV.
 * Each type owns a distinct cabinet silhouette and sub-mesh layout; geometry is allocated once per type at module load.
 */
import * as THREE from "three";
import type { SpeakerKind } from "@/hooks/useClubAudio";

type Props = { kind: SpeakerKind; activity: number; selected?: boolean; showHaze?: boolean; idleVisible?: boolean };
type ActivityProfile = { attack: number; spread: number; rim: number; driver: number };
type Blueprint = { body: [number, number, number]; profile: ActivityProfile; cabinet: THREE.ExtrudeGeometry; baffle: THREE.BoxGeometry; horn?: THREE.BufferGeometry; edges?: THREE.EdgesGeometry };

const staticBaffle = new THREE.MeshStandardMaterial({ color: "#0a0b09", roughness: .92, metalness: .02 });
const staticGrille = new THREE.MeshStandardMaterial({ color: "#050604", roughness: .82, metalness: .12 });
const staticHornInterior = new THREE.MeshStandardMaterial({ color: "#030403", roughness: .65, metalness: .05, side: THREE.DoubleSide });
const staticFoot = new THREE.MeshStandardMaterial({ color: "#090a08", roughness: .86, metalness: .08 });
const staticCabinet = new THREE.MeshStandardMaterial({ color: "#171815", roughness: .74, metalness: .08 });
const staticWooferSurround = new THREE.MeshStandardMaterial({ color: "#22231f", roughness: .68 });
const staticWooferCone = new THREE.MeshStandardMaterial({ color: "#0b0c0a", roughness: .57 });
const staticDustCap = new THREE.MeshStandardMaterial({ color: "#34352e", roughness: .72 });
const staticHornExterior = new THREE.MeshStandardMaterial({ color: "#20211c", roughness: .62, metalness: .12, side: THREE.DoubleSide });
const staticHornFrame = new THREE.MeshStandardMaterial({ color: "#38382f", roughness: .6, metalness: .18 });
const staticDetail = new THREE.MeshStandardMaterial({ color: "#2c2d27", roughness: .84 });
const staticMetalDetail = new THREE.MeshStandardMaterial({ color: "#4b4b42", roughness: .42, metalness: .46 });
const staticSelection = new THREE.MeshBasicMaterial({ color: "#d5c2a8", transparent: true, opacity: .028, side: THREE.BackSide });
const staticIdleEdge = new THREE.LineBasicMaterial({ color: "#c4c0b3", transparent: true, opacity: .42 });
const unitBox = new THREE.BoxGeometry(1, 1, 1);
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
  const frontZ = 0; const rearZ = -depth; const vertices = new Float32Array([
    -mouthWidth / 2, -mouthHeight / 2, frontZ, mouthWidth / 2, -mouthHeight / 2, frontZ, mouthWidth / 2, mouthHeight / 2, frontZ, -mouthWidth / 2, mouthHeight / 2, frontZ,
    -throatWidth / 2, -throatHeight / 2, rearZ, throatWidth / 2, -throatHeight / 2, rearZ, throatWidth / 2, throatHeight / 2, rearZ, -throatWidth / 2, throatHeight / 2, rearZ,
  ]); const index = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3)); geometry.setIndex(index); geometry.computeVertexNormals(); return geometry;
}

const blueprints: Record<SpeakerKind, Blueprint> = {
  sub: { body: [2.06, .78, 1.3], profile: { attack: .68, spread: 1.48, rim: .17, driver: .28 }, cabinet: makeChamferCabinet(2.06, .78, 1.3, .025), baffle: new THREE.BoxGeometry(1.86, .58, .065) },
  woofer: { body: [1.22, 1.08, .98], profile: { attack: .82, spread: 1.05, rim: .21, driver: .38 }, cabinet: makeChamferCabinet(1.22, 1.08, .98, .05), baffle: new THREE.BoxGeometry(1.04, .88, .06) },
  full: { body: [1.02, 1.94, 1.04], profile: { attack: .9, spread: .9, rim: .27, driver: .42 }, cabinet: makeChamferCabinet(1.02, 1.94, 1.04, .12), baffle: new THREE.BoxGeometry(.78, 1.66, .06), horn: makeHornFlare(.66, .36, .19, .10, .28) },
  mid: { body: [.74, .78, .6], profile: { attack: 1.18, spread: .62, rim: .2, driver: .48 }, cabinet: makeChamferCabinet(.74, .78, .6, .06), baffle: new THREE.BoxGeometry(.57, .58, .05) },
  high: { body: [1.02, .56, .72], profile: { attack: 1.38, spread: .48, rim: .16, driver: .5 }, cabinet: makeChamferCabinet(.72, .42, .56, .12), baffle: new THREE.BoxGeometry(.88, .4, .055), horn: makeHornFlare(.76, .33, .18, .09, .28) },
};
Object.values(blueprints).forEach((blueprint) => { blueprint.edges = new THREE.EdgesGeometry(blueprint.cabinet, 14); });
const activityColor: Record<SpeakerKind, string> = { sub: "#ef3e32", woofer: "#f06a31", full: "#f2a842", mid: "#e7d64b", high: "#56d46a" };

function WooferAssembly({ size, activity, character, y, color }: { size: number; activity: number; character: number; y: number; color: string }) {
  const pulse = activity * character;
  return <group position={[0, y, 0]}>
    <mesh geometry={wooferSurround} position={[0, 0, .526]} scale={[size, size, 1]} material={staticWooferSurround} />
    <mesh geometry={wooferCone} position={[0, 0, .536 + pulse * .008]} rotation={[Math.PI / 2, 0, 0]} scale={[size * .82, size * .82, 1]} material={staticWooferCone} />
    <mesh geometry={dustCap} position={[0, 0, .566 + pulse * .01]} scale={[size * .25, size * .25, size * .08]} material={staticDustCap} />
    <pointLight color={color} intensity={pulse * .68} distance={.5 + size} decay={2} position={[0, 0, .64]} />
  </group>;
}

function RecessedBaffle({ blueprint, depth }: { blueprint: Blueprint; depth: number }) {
  return <group position={[0, 0, depth / 2 + .024]}><mesh geometry={blueprint.baffle} material={staticBaffle} /><mesh geometry={unitBox} position={[0, 0, .038]} scale={[blueprint.baffle.parameters.width * .91, blueprint.baffle.parameters.height * .91, .015]} material={staticGrille} /></group>;
}

function HornFlare({ geometry, y, depth, activity, character, mouthWidth, mouthHeight, color }: { geometry: THREE.BufferGeometry; y: number; depth: number; activity: number; character: number; mouthWidth: number; mouthHeight: number; color: string }) {
  const flareFront = depth / 2 + .06; const pulse = activity * character;
  return <group position={[0, y, flareFront]}><mesh geometry={geometry} material={staticHornExterior} /><mesh geometry={unitBox} position={[0, mouthHeight / 2, .012]} scale={[mouthWidth, .034, .04]} material={staticHornFrame} /><mesh geometry={unitBox} position={[0, -mouthHeight / 2, .012]} scale={[mouthWidth, .034, .04]} material={staticHornFrame} /><mesh geometry={unitBox} position={[-mouthWidth / 2, 0, .012]} scale={[.034, mouthHeight, .04]} material={staticHornFrame} /><mesh geometry={unitBox} position={[mouthWidth / 2, 0, .012]} scale={[.034, mouthHeight, .04]} material={staticHornFrame} /><mesh geometry={unitBox} position={[0, 0, -.255]} scale={[.16, .09, .025]} material={staticHornInterior} /><pointLight color={color} intensity={pulse * .92} distance={.95} decay={2} position={[0, 0, .05]} /></group>;
}

function CabinetFeet({ width, height, depth, count = 2 }: { width: number; height: number; depth: number; count?: number }) { const coordinates = count === 4 ? [[-.36, -.28], [.36, -.28], [-.36, .28], [.36, .28]] : [[-.32, 0], [.32, 0]]; return <group position={[0, -height / 2 - .06, 0]}>{coordinates.map(([x, z], index) => <mesh key={index} geometry={unitBox} position={[x * width, 0, z * depth]} scale={[.12, .12, .14]} material={staticFoot} />)}</group>; }

function SubModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) { const [width, height, depth] = blueprint.body; return <><mesh geometry={blueprint.cabinet} material={staticCabinet} castShadow receiveShadow /><RecessedBaffle blueprint={blueprint} depth={depth} /><WooferAssembly size={.38} activity={activity} character={blueprint.profile.driver} y={.02} color={color} /><mesh geometry={unitBox} position={[0, -.255, depth / 2 + .062]} scale={[.64, .09, .03]} material={staticHornInterior} /><CabinetFeet width={width} height={height} depth={depth} count={4} /></>; }
function WooferModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) { const [width, height, depth] = blueprint.body; return <><mesh geometry={blueprint.cabinet} material={staticCabinet} castShadow receiveShadow /><RecessedBaffle blueprint={blueprint} depth={depth} /><WooferAssembly size={.31} activity={activity} character={blueprint.profile.driver} y={-.08} color={color} /><mesh geometry={unitBox} position={[0, .37, depth / 2 + .062]} scale={[.48, .026, .026]} material={staticDetail} /><CabinetFeet width={width} height={height} depth={depth} /></>; }
function FullGrille({ width, height, depth }: { width: number; height: number; depth: number }) {
  const z = depth / 2 + .102; const vertical = [-.34, .34]; const horizontal = [-.77, .08, .77];
  return <group position={[0, 0, z]}>
    {vertical.map((x) => <mesh key={`v-${x}`} geometry={unitBox} position={[x, 0, .012]} scale={[.016, height * .83, .014]} material={staticMetalDetail} />)}
    {horizontal.map((y) => <mesh key={`h-${y}`} geometry={unitBox} position={[0, y, .014]} scale={[width * .74, .016, .014]} material={staticMetalDetail} />)}
  </group>;
}

function FullBezel({ width, height, depth }: { width: number; height: number; depth: number }) {
  const z = depth / 2 + .066;
  return <group position={[0, 0, z]}>
    <mesh geometry={unitBox} position={[0, height * .43, 0]} scale={[width * .88, .08, .075]} material={staticDetail} />
    <mesh geometry={unitBox} position={[0, -height * .43, 0]} scale={[width * .88, .08, .075]} material={staticDetail} />
    <mesh geometry={unitBox} position={[-width * .44, 0, 0]} scale={[.08, height * .86, .075]} material={staticDetail} />
    <mesh geometry={unitBox} position={[width * .44, 0, 0]} scale={[.08, height * .86, .075]} material={staticDetail} />
  </group>;
}

function FullFasteners({ width, height, depth }: { width: number; height: number; depth: number }) {
  const coordinates: Array<[number, number]> = [[-.39, .77], [.39, .77], [-.39, -.78], [.39, -.78]];
  return <>{coordinates.map(([x, y], index) => <mesh key={index} geometry={fastenerHead} rotation={[Math.PI / 2, 0, 0]} position={[x, y, depth / 2 + .125]} material={staticMetalDetail} />)}</>;
}

function FullModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) {
  const [width, height, depth] = blueprint.body;
  return <group rotation={[-.055, 0, 0]}>
    <mesh geometry={blueprint.cabinet} material={staticCabinet} castShadow receiveShadow />
    <FullBezel width={width} height={height} depth={depth} />
    <FullGrille width={width} height={height} depth={depth} />
    <WooferAssembly size={.31} activity={activity} character={blueprint.profile.driver} y={-.43} color={color} />
    <HornFlare geometry={blueprint.horn!} y={.49} depth={depth} activity={activity} character={blueprint.profile.driver} mouthWidth={.66} mouthHeight={.36} color={color} />
    <mesh geometry={unitBox} position={[0, .055, depth / 2 + .135]} scale={[width * .72, .034, .026]} material={staticMetalDetail} />
    <FullFasteners width={width} height={height} depth={depth} />
    {[-.25, .25].map((x, index) => <mesh key={index} geometry={fastenerHead} rotation={[0, 0, 0]} position={[x, height / 2 + .004, .05]} material={staticHornInterior} />)}
    <CabinetFeet width={width} height={height} depth={depth} />
  </group>;
}
function MidModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) { const [, , depth] = blueprint.body; return <><mesh geometry={blueprint.cabinet} material={staticCabinet} castShadow receiveShadow /><RecessedBaffle blueprint={blueprint} depth={depth} /><WooferAssembly size={.2} activity={activity} character={blueprint.profile.driver} y={0} color={color} /></>; }
function HighModel({ blueprint, activity, color }: { blueprint: Blueprint; activity: number; color: string }) { const [width, height, depth] = blueprint.body; return <><mesh geometry={blueprint.cabinet} position={[0, 0, -.07]} material={staticCabinet} castShadow receiveShadow /><mesh geometry={blueprint.baffle} position={[0, 0, depth / 2 + .02]} material={staticBaffle} /><HornFlare geometry={blueprint.horn!} y={0} depth={depth} activity={activity} character={blueprint.profile.driver} mouthWidth={.76} mouthHeight={.33} color={color} /><mesh geometry={unitBox} position={[-width * .31, -.22, -.1]} scale={[.07, .24, .08]} material={staticFoot} /><mesh geometry={unitBox} position={[width * .31, -.22, -.1]} scale={[.07, .24, .08]} material={staticFoot} /></>; }

export function SpeakerMiniature({ kind, activity, selected = false, showHaze = true, idleVisible = false }: Props) {
  const blueprint = blueprints[kind]; const [width, height, depth] = blueprint.body; const visibleActivity = Math.max(0, Math.min(1, activity * blueprint.profile.attack)); const color = activityColor[kind];
  return <group>
    {idleVisible && <pointLight color="#ddd7c8" intensity={.72} distance={2.25 + blueprint.profile.spread * .55} decay={2} position={[0, .2, depth / 2 + .8]} />}
    {idleVisible && <lineSegments geometry={blueprint.edges} material={staticIdleEdge} />}
    <pointLight color={color} intensity={visibleActivity * (2.1 + blueprint.profile.spread * .9)} distance={1.7 + blueprint.profile.spread * 1.7} decay={2} position={[0, 0, depth / 2 + .52]} />
    {showHaze && visibleActivity > .018 && <group position={[0, 0, depth / 2 + .17]}>{[0, 1].map((layer) => <mesh key={layer} position={[0, 0, layer * .035]} rotation={[Math.PI / 2 + layer * .13, layer * .3, 0]}><circleGeometry args={[Math.max(width, height) * (.34 + blueprint.profile.spread * .14 + layer * .1), 20]} /><meshBasicMaterial color={color} transparent opacity={visibleActivity * (.055 + blueprint.profile.spread * .022)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>)}</group>}
    {kind === "sub" && <SubModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "woofer" && <WooferModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "full" && <FullModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "mid" && <MidModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {kind === "high" && <HighModel blueprint={blueprint} activity={visibleActivity} color={color} />}
    {selected && <mesh geometry={blueprint.cabinet} scale={[1.018, 1.018, 1.018]} material={staticSelection} />}
  </group>;
}

export const speakerBlueprints = blueprints;
