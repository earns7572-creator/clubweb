/* Club Craft booth rule: a small static physical DJ object; playback changes pose only, never starts an animation loop. */
import * as THREE from "three";
import type { SurfaceTone } from "@/components/ClubFloor3D";
import { SimpleHumanAvatar } from "@/components/SimpleHumanAvatar";

const boothGeometry = new THREE.BoxGeometry(1.8, .75, .62);
const deckGeometry = new THREE.BoxGeometry(.55, .05, .38);
const mixerGeometry = new THREE.BoxGeometry(.34, .06, .36);
const boothTopGeometry = new THREE.BoxGeometry(1.52, .022, .46);
const boothMaterial = new THREE.MeshStandardMaterial({ color: "#555650", roughness: .88, metalness: .01 });
const deckMaterial = new THREE.MeshStandardMaterial({ color: "#22231f", roughness: .74, metalness: .015 });
const mixerMaterial = new THREE.MeshStandardMaterial({ color: "#171815", roughness: .68, metalness: .02 });
const boothTopMaterial: Record<SurfaceTone, THREE.MeshStandardMaterial> = {
  paper: new THREE.MeshStandardMaterial({ color: "#696961", roughness: .86, metalness: .01 }),
  sand: new THREE.MeshStandardMaterial({ color: "#6a6157", roughness: .86, metalness: .01 }),
  slate: new THREE.MeshStandardMaterial({ color: "#606864", roughness: .86, metalness: .01 }),
};
const ignoreRaycast = () => null;

export function DjBooth({ active, tone }: { active: boolean; tone: SurfaceTone }) {
  return <group dispose={null}>
    <mesh geometry={boothGeometry} material={boothMaterial} position={[0, .43, 0]} raycast={ignoreRaycast} />
    <mesh geometry={deckGeometry} material={deckMaterial} position={[-.52, .83, .02]} raycast={ignoreRaycast} />
    <mesh geometry={mixerGeometry} material={mixerMaterial} position={[0, .84, .02]} raycast={ignoreRaycast} />
    <mesh geometry={deckGeometry} material={deckMaterial} position={[.52, .83, .02]} raycast={ignoreRaycast} />
    <mesh geometry={boothTopGeometry} material={boothTopMaterial[tone]} position={[0, .79, .02]} raycast={ignoreRaycast} />
    <group position={[0, .01, -.38]} raycast={ignoreRaycast}><SimpleHumanAvatar variant="dj" active={active} /></group>
  </group>;
}
