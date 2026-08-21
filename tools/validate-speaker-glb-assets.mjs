import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { REPRESENTATIVE_IDS, SPEAKER_GLB_SPECS } from "./speaker-glb-specs.mjs";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const assetDirectory = path.join(rootDirectory, "client/public/models/speakers");
const representativeOnly = process.argv.includes("--representative");
const specs = representativeOnly ? SPEAKER_GLB_SPECS.filter((spec) => REPRESENTATIVE_IDS.has(spec.id)) : SPEAKER_GLB_SPECS;
const loader = new GLTFLoader();
const manifest = {};
let failed = false;

const round = (value, digits = 4) => Number(value.toFixed(digits));
const colorHex = (material) => material?.color instanceof THREE.Color ? `#${material.color.getHexString()}` : null;
const ratioError = (actualA, actualB, targetA, targetB) => Math.abs((actualA / actualB) / (targetA / targetB) - 1) * 100;

async function validate(spec) {
  const errors = [];
  const file = path.join(assetDirectory, spec.path);
  let bytes;
  try { bytes = await fs.readFile(file); }
  catch { return { errors: ["file is not readable"] }; }
  if (bytes.length < 1024) errors.push("file is unexpectedly small");
  if (bytes.readUInt32LE(0) !== 0x46546c67) errors.push("invalid GLB header");
  let gltf;
  try {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    gltf = await new Promise((resolve, reject) => loader.parse(buffer, "", resolve, reject));
  } catch (error) { return { errors: [...errors, `reload failed: ${error.message}`] }; }

  gltf.scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3(); const vertex = new THREE.Vector3();
  const names = new Set(), materialColors = new Set(), cabinetColors = new Set(), emitters = new Set();
  let triangleCount = 0, meshCount = 0, vertexCount = 0, finiteVertices = true;
  gltf.scene.traverse((object) => {
    if (object.name) names.add(object.name);
    if (!(object instanceof THREE.Mesh)) return;
    meshCount += 1;
    const position = object.geometry.attributes.position;
    triangleCount += (object.geometry.index?.count ?? position?.count ?? 0) / 3;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      const hex = colorHex(material); if (hex) materialColors.add(hex);
      if (object.name.startsWith("Cabinet") && hex) cabinetColors.add(hex);
      const emitter = object.name.startsWith("Emitter"); if (emitter) emitters.add(object.name);
      if (!emitter && "emissiveIntensity" in material && material.emissiveIntensity > 0) errors.push(`${object.name}: non-emitter emissive intensity`);
    }
    if (!position) { errors.push(`${object.name}: position attribute missing`); return; }
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld); vertexCount += 1;
      if (![vertex.x, vertex.y, vertex.z].every(Number.isFinite)) { finiteVertices = false; continue; }
      bounds.expandByPoint(vertex);
    }
  });

  if (!finiteVertices) errors.push("NaN/Infinity vertex detected");
  if (!names.has("Root") || !names.has("Cabinet")) errors.push("Root or Cabinet node missing");
  for (const emitter of [spec.emitter, ...(spec.additionalEmitters ?? [])]) if (!emitters.has(emitter)) errors.push(`${emitter} missing`);
  if (meshCount < 6) errors.push(`mesh count too low: ${meshCount}`);
  if (triangleCount < 60) errors.push(`triangle count too low: ${triangleCount}`);
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const dimensions = [size.x, size.y, size.z];
  for (let index = 0; index < 3; index += 1) {
    const error = Math.abs(dimensions[index] / spec.body[index] - 1) * 100;
    if (error > 2.01) errors.push(`${["width","height","depth"][index]} error ${round(error,2)}% exceeds 2%`);
  }
  const aspectErrors = [ratioError(size.x,size.y,spec.body[0],spec.body[1]), ratioError(size.x,size.z,spec.body[0],spec.body[2]), ratioError(size.y,size.z,spec.body[1],spec.body[2])];
  const maxAspectError = Math.max(...aspectErrors);
  if (maxAspectError > 10) errors.push(`aspect ratio error ${round(maxAspectError,2)}% exceeds 10%`);
  if (Math.abs(bounds.min.y) > .005) errors.push(`bottom Y ${round(bounds.min.y)} is not zero`);
  if (Math.abs(center.x) > .005) errors.push(`center X ${round(center.x)} is not zero`);
  if (Math.abs(center.z) > .005) errors.push(`center Z ${round(center.z)} is not zero`);
  if (Math.abs(bounds.min.x) > spec.body[0]/2+.01 || Math.abs(bounds.max.x) > spec.body[0]/2+.01 || bounds.min.y < -.01 || bounds.max.y > spec.body[1]+.01 || Math.abs(bounds.min.z) > spec.body[2]/2+.01 || Math.abs(bounds.max.z) > spec.body[2]/2+.01) errors.push("outlier geometry exceeds target envelope");
  const allowedCabinets = ["freeparty-wbin","freeparty-kick-horn","freeparty-mid-horn","freeparty-top"].includes(spec.id) ? new Set(["#242423"]) : spec.family === "hifi" ? new Set(["#76583c"]) : spec.family === "freeparty" ? new Set(["#64696d"]) : new Set(["#70767b"]);
  if (![...cabinetColors].some((color) => allowedCabinets.has(color))) errors.push(`cabinet palette invalid: ${[...cabinetColors].join(", ") || "missing"}`);

  return { errors, data: {
    family: spec.family, body: { width: spec.body[0], height: spec.body[1], depth: spec.body[2] },
    actualBounds: { width: round(size.x), height: round(size.y), depth: round(size.z) },
    bounds: { min: { x: round(bounds.min.x), y: round(bounds.min.y), z: round(bounds.min.z) }, max: { x: round(bounds.max.x), y: round(bounds.max.y), z: round(bounds.max.z) } },
    aspectErrorPercent: round(maxAspectError,3), bottomY: round(bounds.min.y), centerX: round(center.x), centerZ: round(center.z),
    triangleCount: Math.round(triangleCount), meshCount, vertexCount, fileSizeKb: round(bytes.length/1024,1), emitters: [...emitters].sort(),
    materialColors: [...materialColors].sort(), finiteVertices, validation: errors.length ? "fail" : "pass",
  } };
}

for (const spec of specs) {
  const result = await validate(spec); if (result.data) manifest[spec.path] = result.data;
  if (result.errors.length) { failed = true; console.error(`FAIL ${spec.path}`); for (const error of result.errors) console.error(`  ${error}`); }
  else { const data=result.data; console.log(`PASS ${spec.path}\n  target/actual: ${spec.body.join(" x ")} / ${Object.values(data.actualBounds).join(" x ")}\n  aspect error: ${data.aspectErrorPercent}%  bottom: ${data.bottomY}  center: ${data.centerX}, ${data.centerZ}\n  ${data.triangleCount} triangles  ${data.meshCount} meshes  ${data.fileSizeKb} KB  ${[spec.emitter,...(spec.additionalEmitters??[])].join(" + ")}: PASS`); }
}
if (!representativeOnly && !failed) await fs.writeFile(path.join(assetDirectory,"manifest.json"),`${JSON.stringify(manifest,null,2)}\n`);
if (failed) process.exitCode = 1;
else console.log(`Validated ${specs.length} reloaded GLB speaker assets.`);
