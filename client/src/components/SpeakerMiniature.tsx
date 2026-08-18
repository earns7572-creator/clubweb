/**
 * Club Craft PA Miniature — shared, procedural speaker construction for TOP and POV.
 * Module-level geometry is reused across instances; activity only affects materials, local light and tiny driver motion.
 */
import * as THREE from "three";
import type { SpeakerKind } from "@/hooks/useClubAudio";

type Props = { kind: SpeakerKind; activity: number; selected?: boolean; showHaze?: boolean };

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 20);
const unitCone = new THREE.ConeGeometry(1, 1, 4);

type Blueprint = { body: [number, number, number]; baffle: [number, number]; driver: number; profile: { attack: number; spread: number; rim: number; driver: number }; horn?: boolean; upperHorn?: boolean; feet?: boolean };
const blueprints: Record<SpeakerKind, Blueprint> = {
  sub: { body: [1.7, .76, 1.16], baffle: [1.54, .55], driver: .31, profile: { attack: .68, spread: 1.45, rim: .17, driver: .28 }, feet: true },
  woofer: { body: [1.28, .92, .9], baffle: [1.08, .68], driver: .25, profile: { attack: .82, spread: 1.05, rim: .21, driver: .38 }, feet: true },
  full: { body: [.72, 1.84, .78], baffle: [.56, 1.58], driver: .18, profile: { attack: .9, spread: .9, rim: .27, driver: .42 }, upperHorn: true, feet: true },
  mid: { body: [.68, .7, .6], baffle: [.5, .52], driver: .17, profile: { attack: 1.18, spread: .62, rim: .2, driver: .48 } },
  high: { body: [.78, .44, .64], baffle: [.64, .28], driver: .18, profile: { attack: 1.38, spread: .48, rim: .16, driver: .5 }, horn: true },
};

function meshMaterial(activity: number, amount: number) { return <meshStandardMaterial color="#151613" roughness={.78} metalness={.04} emissive="#c9a783" emissiveIntensity={activity * amount} />; }

function RoundDriver({ size, activity, character, y = 0 }: { size: number; activity: number; character: number; y?: number }) {
  return <group position={[0, y, .525]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1 + activity * character * .06]}>
    <mesh geometry={unitCylinder} scale={[size, size, .048]}>{meshMaterial(activity, .48 * character)}</mesh>
    <mesh geometry={unitCylinder} position={[0, 0, .03]} scale={[size * .7, size * .7, .018]}><meshStandardMaterial color="#050604" roughness={.52} /></mesh>
    <mesh geometry={unitCylinder} position={[0, 0, .052]} scale={[size * .18, size * .18, .019]}><meshStandardMaterial color="#2f302a" roughness={.72} /></mesh>
  </group>;
}

function Horn({ activity, character, y = 0, scale = 1 }: { activity: number; character: number; y?: number; scale?: number }) {
  return <group position={[0, y, .54]} rotation={[Math.PI / 2, 0, 0]}>
    <mesh geometry={unitCone} scale={[.28 * scale, .20 * scale, .36 * scale]}>{meshMaterial(activity, .52 * character)}</mesh>
    <mesh geometry={unitCylinder} position={[0, -.14 * scale, .01]} scale={[.07 * scale, .07 * scale, .022]}><meshStandardMaterial color="#020302" /></mesh>
  </group>;
}

function GrilleBars({ width, height }: { width: number; height: number }) {
  return <group position={[0, 0, .518]}>{[-.32, -.16, 0, .16, .32].map((x) => <mesh key={x} geometry={unitBox} position={[x * width, 0, 0]} scale={[.014, height, .012]}><meshStandardMaterial color="#090a08" roughness={.9} /></mesh>)}</group>;
}

export function SpeakerMiniature({ kind, activity, selected = false, showHaze = true }: Props) {
  const blueprint = blueprints[kind]; const [width, height, depth] = blueprint.body; const visibleActivity = Math.max(0, Math.min(1, activity * blueprint.profile.attack));
  const baffleDepth = depth / 2 + .018; const feetY = -height / 2 - .045;
  return <group>
    <pointLight color="#e4c6a5" intensity={visibleActivity * (.8 + blueprint.profile.spread * .7)} distance={1.2 + blueprint.profile.spread * 1.5} decay={2} position={[0, 0, depth / 2 + .46]} />
    {showHaze && visibleActivity > .018 && <mesh position={[0, 0, depth / 2 + .16]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[Math.max(width, height) * (.42 + blueprint.profile.spread * .16), 28]} /><meshBasicMaterial color="#d8c0a0" transparent opacity={visibleActivity * (.016 + blueprint.profile.spread * .012)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>}
    <mesh geometry={unitBox} scale={[width, height, depth]} castShadow receiveShadow>{meshMaterial(visibleActivity, blueprint.profile.rim)}</mesh>
    <mesh geometry={unitBox} position={[0, 0, baffleDepth]} scale={[blueprint.baffle[0], blueprint.baffle[1], .04]} castShadow><meshStandardMaterial color="#070806" roughness={.9} /></mesh>
    <GrilleBars width={blueprint.baffle[0]} height={blueprint.baffle[1]} />
    {kind === "sub" && <><RoundDriver size={blueprint.driver} activity={visibleActivity} character={blueprint.profile.driver} /><mesh geometry={unitBox} position={[0, -.28, .55]} scale={[1.1, .035, .03]}><meshStandardMaterial color="#1d1e1a" roughness={.85} /></mesh></>}
    {kind === "woofer" && <><RoundDriver size={blueprint.driver} activity={visibleActivity} character={blueprint.profile.driver} /><mesh geometry={unitBox} position={[0, .34, .55]} scale={[.76, .028, .03]}><meshStandardMaterial color="#20211c" roughness={.85} /></mesh></>}
    {kind === "full" && <><RoundDriver size={blueprint.driver} activity={visibleActivity} character={blueprint.profile.driver} y={-.36} /><Horn activity={visibleActivity} character={blueprint.profile.driver} y={.42} scale={1.06} /></>}
    {kind === "mid" && <RoundDriver size={blueprint.driver} activity={visibleActivity} character={blueprint.profile.driver} />}
    {kind === "high" && <Horn activity={visibleActivity} character={blueprint.profile.driver} scale={1.28} />}
    {blueprint.feet && <group position={[0, feetY, 0]}>{[-.32, .32].map((x) => <mesh key={x} geometry={unitBox} position={[x * Math.min(1, width), 0, 0]} scale={[.11, .09, depth * .62]}><meshStandardMaterial color="#080907" roughness={.82} /></mesh>)}</group>}
    {kind === "high" && <mesh geometry={unitBox} position={[0, -.33, 0]} scale={[.07, .24, .07]}><meshStandardMaterial color="#20211c" roughness={.86} /></mesh>}
    {selected && <mesh geometry={unitBox} scale={[width * 1.022, height * 1.022, depth * 1.022]}><meshBasicMaterial color="#d5c2a8" transparent opacity={.035} side={THREE.BackSide} /></mesh>}
  </group>;
}

export const speakerBlueprints = blueprints;
