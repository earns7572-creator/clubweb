/* Club Craft avatar rule: shared matte architectural human forms, never game characters or animated rigs. */
import * as THREE from "three";

type SimpleHumanAvatarProps = {
  variant?: "listener" | "dj";
  active?: boolean;
};

const headGeometry = new THREE.SphereGeometry(.12, 16, 12);
const torsoGeometry = new THREE.CylinderGeometry(.15, .2, .52, 12);
const limbGeometry = new THREE.CylinderGeometry(.045, .05, .48, 10);
const avatarBodyMaterial = new THREE.MeshStandardMaterial({ color: "#32332f", roughness: .82, metalness: .02 });
const avatarHeadMaterial = new THREE.MeshStandardMaterial({ color: "#b7afa0", roughness: .76, metalness: 0 });

function AvatarArm({ side }: { side: "left" | "right" }) {
  const direction = side === "left" ? -1 : 1;
  return <mesh geometry={limbGeometry} material={avatarBodyMaterial} position={[direction * .205, .83, 0]} rotation={[0, 0, direction * -.16]} />;
}

function AvatarLeg({ side }: { side: "left" | "right" }) {
  const direction = side === "left" ? -1 : 1;
  return <mesh geometry={limbGeometry} material={avatarBodyMaterial} position={[direction * .09, .29, .01]} rotation={[0, 0, direction * -.035]} />;
}

function StandingPose() {
  return <group dispose={null}>
    <mesh geometry={torsoGeometry} material={avatarBodyMaterial} position={[0, .86, 0]} />
    <mesh geometry={headGeometry} material={avatarHeadMaterial} position={[0, 1.23, .015]} />
    <AvatarArm side="left" /><AvatarArm side="right" />
    <AvatarLeg side="left" /><AvatarLeg side="right" />
  </group>;
}

function DjArm({ side, active }: { side: "left" | "right"; active: boolean }) {
  const direction = side === "left" ? -1 : 1;
  const targetX = side === "left" ? -.31 : .1;
  const targetZ = active ? .27 : .065;
  const targetY = active ? .8 : .7;
  return <mesh geometry={limbGeometry} material={avatarBodyMaterial} position={[targetX, targetY, targetZ]} rotation={[active ? -.88 : -.15, 0, direction * -.31]} />;
}

function DjPose({ active }: { active: boolean }) {
  return <group dispose={null}>
    <mesh geometry={torsoGeometry} material={avatarBodyMaterial} position={[0, .86, 0]} rotation={[active ? -.06 : 0, 0, 0]} />
    <mesh geometry={headGeometry} material={avatarHeadMaterial} position={[0, 1.23, active ? .045 : .015]} rotation={[active ? -.12 : 0, 0, 0]} />
    <DjArm side="left" active={active} /><DjArm side="right" active={active} />
    <AvatarLeg side="left" /><AvatarLeg side="right" />
  </group>;
}

export function SimpleHumanAvatar({ variant = "listener", active = false }: SimpleHumanAvatarProps) {
  return variant === "dj" ? <DjPose active={active} /> : <StandingPose />;
}
