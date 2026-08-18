/** Validation-only route for inspecting the shared SpeakerMiniature geometry under neutral light. */
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect } from "react";
import { SpeakerMiniature, speakerBlueprints } from "@/components/SpeakerMiniature";
import type { SpeakerKind } from "@/hooks/useClubAudio";
import "../speaker-model-validation.css";

type Angle = "front" | "three-quarter" | "side";
const kinds: SpeakerKind[] = ["sub", "woofer", "full", "mid", "high"];
const labels: Record<SpeakerKind, string> = { sub: "SUB", woofer: "WOOFER", full: "FULL RANGE", mid: "MID", high: "HIGH" };

function CameraPose({ angle }: { angle?: Angle }) { const { camera } = useThree(); useEffect(() => { const positions: Record<Angle, [number, number, number]> = { front: [0, 1.2, 7.2], "three-quarter": [4.8, 2.7, 6.1], side: [6.7, 1.35, 0] }; const position: [number, number, number] = angle ? positions[angle] : [8.7, 5.8, 10.8]; camera.position.set(position[0], position[1], position[2]); camera.lookAt(0, .85, 0); }, [angle, camera]); return null; }
function NeutralScene({ angle, active }: { angle?: Angle; active: boolean }) { const shown = angle ? ["full" as SpeakerKind] : kinds; const xFor = (index: number) => angle ? 0 : (index - 2) * 2.1; return <><color attach="background" args={["#1b1c19"]} /><ambientLight intensity={.75} /><directionalLight position={[4, 6, 7]} intensity={1.35} castShadow /><directionalLight position={[-5, 3, -2]} intensity={.45} color="#a9b4c0" /><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 12]} /><meshStandardMaterial color="#34342f" roughness={.92} /></mesh>{shown.map((kind, index) => { const [, height] = speakerBlueprints[kind].body; return <group key={kind} position={[xFor(index), height / 2, 0]}><SpeakerMiniature kind={kind} activity={active ? .78 : 0} showHaze={active} /></group>; })}</>; }

export default function SpeakerModelValidation() {
  const params = new URLSearchParams(window.location.search); const angle = params.get("angle") as Angle | null; const validAngle = angle === "front" || angle === "three-quarter" || angle === "side" ? angle : undefined; const active = params.get("active") === "1";
  return <main className="speaker-model-lab"><header><strong>Club Craft</strong><span>{active ? "Band Activity Color Verification" : "PA Speaker Geometry Verification"}</span></header><section className="speaker-model-canvas"><Canvas shadows camera={{ fov: 40 }} dpr={[1, 1.5]}><CameraPose angle={validAngle} /><NeutralScene angle={validAngle} active={active} /></Canvas></section>{validAngle ? <p className="speaker-model-caption">FULL RANGE — {validAngle === "three-quarter" ? "3/4" : validAngle}</p> : <div className="speaker-model-labels">{kinds.map((kind) => <span key={kind}>{labels[kind]}</span>)}</div>}</main>;
}
