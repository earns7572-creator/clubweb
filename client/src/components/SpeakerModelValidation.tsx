/**
 * Validation-only route: bright neutral illumination for reading PA geometry, not the production club lighting.
 * It intentionally uses no shadow map so silhouette, horn depth and material separation remain the focus.
 */
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect } from "react";
import { SpeakerMiniature, speakerBlueprints } from "@/components/SpeakerMiniature";
import type { SpeakerKind } from "@/hooks/useClubAudio";
import "../speaker-model-validation.css";

type Angle = "front" | "three-quarter" | "side";
const kinds: SpeakerKind[] = ["sub", "woofer", "full", "mid", "high"];
const labels: Record<SpeakerKind, string> = { sub: "SUB", woofer: "WOOFER", full: "FULL RANGE", mid: "MID", high: "HIGH" };

function CameraPose({ angle, kind }: { angle?: Angle; kind?: SpeakerKind }) { const { camera } = useThree(); useEffect(() => { const height = kind ? speakerBlueprints[kind].body[1] : .85; const focusY = height / 2; const distance = kind ? Math.max(3.15, height * 2.65) : 7.2; const positions: Record<Angle, [number, number, number]> = { front: [0, focusY + .15, distance], "three-quarter": [distance * .68, focusY + Math.max(.72, height * .52), distance * .78], side: [distance, focusY + .32, 0] }; const position: [number, number, number] = angle ? positions[angle] : [7.1, 4.5, 8.6]; camera.position.set(position[0], position[1], position[2]); camera.lookAt(0, focusY, 0); }, [angle, camera, kind]); return null; }
function NeutralExposure() { const { gl } = useThree(); useEffect(() => { const previous = gl.toneMappingExposure; gl.toneMappingExposure = 1.72; return () => { gl.toneMappingExposure = previous; }; }, [gl]); return null; }
function NeutralScene({ shown, active }: { shown: SpeakerKind[]; active: boolean }) { const xFor = (index: number) => shown.length === 1 ? 0 : (index - 2) * 2.1; return <><color attach="background" args={["#4a4943"]} /><ambientLight intensity={1.85} /><hemisphereLight args={["#fff8e7", "#363733", 1.2]} /><directionalLight position={[1.5, 4.2, 7]} intensity={3.8} color="#fff2d6" /><directionalLight position={[-5, 4, 3]} intensity={1.45} color="#d8e0e0" /><directionalLight position={[0, 5, -4]} intensity={.55} color="#f4dfbd" /><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15, 12]} /><meshStandardMaterial color="#777469" roughness={.92} /></mesh>{shown.map((kind, index) => { const [, height] = speakerBlueprints[kind].body; return <group key={kind} position={[xFor(index), height / 2, 0]}><SpeakerMiniature kind={kind} activity={active ? .78 : 0} showHaze={active} /></group>; })}</>; }

export default function SpeakerModelValidation() {
  const params = new URLSearchParams(window.location.search); const angle = params.get("angle") as Angle | null; const validAngle = angle === "front" || angle === "three-quarter" || angle === "side" ? angle : undefined; const requestedKind = params.get("kind") as SpeakerKind | null; const validKind = requestedKind && kinds.includes(requestedKind) ? requestedKind : undefined; const shown = validKind ? [validKind] : validAngle ? ["full" as SpeakerKind] : kinds; const active = params.get("active") === "1";
  const captionKind = validKind ?? "full";
  return <main className="speaker-model-lab"><header><strong>Club Craft</strong><span>{active ? "Band Activity Color Verification" : "PA Speaker Geometry Verification"}</span></header><section className="speaker-model-canvas"><Canvas camera={{ fov: 40 }} dpr={[1, 1.5]}><NeutralExposure /><CameraPose angle={validAngle} kind={shown.length === 1 ? shown[0] : undefined} /><NeutralScene shown={shown} active={active} /></Canvas></section>{shown.length === 1 ? <p className="speaker-model-caption">{labels[captionKind]} — {validAngle === "three-quarter" ? "3/4" : validAngle ?? "front"}</p> : <div className="speaker-model-labels">{kinds.map((kind) => <span key={kind}>{labels[kind]}</span>)}</div>}</main>;
}
