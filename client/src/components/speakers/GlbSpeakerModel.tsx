/* GLB visuals are normalized to the existing miniature convention: centred X/Z, bottom at -body.height / 2, and forward +Z. */
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { SpeakerGlbVisual } from "@/lib/speakerModels";

type Props = { visual: SpeakerGlbVisual; body: { width: number; height: number; depth: number }; activity: number };
const bandColors = { low: new THREE.Color("#ff3b30"), mid: new THREE.Color("#ffd60a"), high: new THREE.Color("#32d05b") } as const;

function cloneMaterials(scene: THREE.Object3D) { const materials: THREE.Material[] = []; scene.traverse((object) => { if (!(object instanceof THREE.Mesh)) return; if (Array.isArray(object.material)) { object.material = object.material.map((material) => { const clone = material.clone(); materials.push(clone); return clone; }); } else { const clone = object.material.clone(); object.material = clone; materials.push(clone); } }); return materials; }
function namedEmitterMeshes(scene: THREE.Object3D, visual: SpeakerGlbVisual) { const emitters: Array<{ mesh: THREE.Mesh; color: THREE.Color }> = []; (Object.entries(visual.emitterMeshes ?? {}) as Array<[keyof typeof bandColors, string[] | undefined]>).forEach(([band, names]) => names?.forEach((name) => { const object = scene.getObjectByName(name); if (object instanceof THREE.Mesh) emitters.push({ mesh: object, color: bandColors[band] }); else if (import.meta.env.DEV) console.warn(`Club Craft GLB emitter not found: ${name}`); })); return emitters; }

export default function GlbSpeakerModel({ visual, body, activity }: Props) {
  const gltf = useGLTF(visual.src); const { invalidate } = useThree();
  const instance = useMemo(() => {
    const scene = gltf.scene.clone(true); const materials = cloneMaterials(scene); scene.rotation.fromArray(visual.rotation ?? [0, 0, 0]);
    const firstBox = new THREE.Box3().setFromObject(scene); const size = firstBox.getSize(new THREE.Vector3()); const fit = Math.min(body.width / Math.max(size.x, .0001), body.height / Math.max(size.y, .0001), body.depth / Math.max(size.z, .0001)) * (visual.scale ?? 1);
    scene.scale.setScalar(fit); const fittedBox = new THREE.Box3().setFromObject(scene); const center = fittedBox.getCenter(new THREE.Vector3()); scene.position.set(-center.x, -fittedBox.min.y - body.height / 2, -center.z); const offset = visual.offset ?? [0, 0, 0]; scene.position.add(new THREE.Vector3(...offset));
    return { scene, materials, emitters: namedEmitterMeshes(scene, visual) };
  }, [body.depth, body.height, body.width, gltf.scene, visual]);
  useEffect(() => () => instance.materials.forEach((material) => material.dispose()), [instance]);
  useEffect(() => { const strength = Math.pow(THREE.MathUtils.clamp(activity, 0, 1), 1.05); instance.emitters.forEach(({ mesh, color }) => { const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; materials.forEach((material) => { if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) { material.emissive.copy(color); material.emissiveIntensity = strength * .9; } }); }); invalidate(); }, [activity, instance, invalidate]);
  return <primitive object={instance.scene} />;
}
