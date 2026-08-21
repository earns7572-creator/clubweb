import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PROTECTED_FAMILIES, REPRESENTATIVE_IDS, SPEAKER_GLB_SPECS } from "./speaker-glb-specs.mjs";

globalThis.FileReader ??= class FileReader {
  async readAsArrayBuffer(blob) {
    try { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
    catch (error) { this.error = error; this.onerror?.(error); }
  }
};

const rootDirectory = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(rootDirectory, "client/public/models/speakers");
const representativeOnly = process.argv.includes("--representative");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
if (process.argv.includes("--force-protected")) throw new Error("Protected-family generation is intentionally unavailable in this repair pipeline.");
if (SPEAKER_GLB_SPECS.some((spec) => PROTECTED_FAMILIES.has(spec.family))) throw new Error("Protected Reggae/Modern family found in generation specs.");

const makeMaterial = (name, color, roughness, metalness = 0) => {
  const value = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive: "#000000", emissiveIntensity: 0 });
  value.name = name; return value;
};
const shared = {
  cabinet: makeMaterial("CabinetGray", "#70767b", .84, .02), baffle: makeMaterial("BaffleGray", "#41474c", .88, .01),
  horn: makeMaterial("HornGray", "#5b6268", .8, .02), woofer: makeMaterial("WooferGray", "#353b40", .82, .01),
  cavity: makeMaterial("AcousticCavity", "#101316", .92), metal: makeMaterial("MetalHardware", "#a2a8ad", .5, .24),
  trim: makeMaterial("DarkTrim", "#42484d", .86, .02),
};
const freeparty = { ...shared, cabinet: makeMaterial("FreePartyCabinet", "#64696d", .88, .02), baffle: makeMaterial("FreePartyBaffle", "#353a3e", .9, .01), horn: makeMaterial("FreePartyHorn", "#50575c", .84, .02) };
const wBin = {
  cabinet: makeMaterial("WBinCabinet", "#242423", .9, .01), frame: makeMaterial("WBinFrame", "#36434a", .82, .04),
  horn: makeMaterial("WBinHornInside", "#111416", .94, .01), cavity: makeMaterial("WBinCavity", "#090b0c", .97), hardware: makeMaterial("WBinHardware", "#252b2f", .72, .18),
};
const hifi = { ...shared, cabinet: makeMaterial("WoodCabinet", "#76583c", .72, .01), horn: makeMaterial("WoodHorn", "#b2875b", .66, .01), woofer: makeMaterial("HiFiWoofer", "#292d30", .8, .01), metal: makeMaterial("HiFiMetal", "#9a9c99", .5, .22) };

function add(root, geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
  mesh.position.set(...position); mesh.rotation.set(...rotation); root.add(mesh); return mesh;
}
const box = (root, size, material, name, position, rotation) => add(root, new THREE.BoxGeometry(...size), material, name, position, rotation);
const roundedBox = (root, size, material, name, position, rotation = [0, 0, 0], segments = 1, radius = .01) => add(root, new RoundedBoxGeometry(...size, segments, radius), material, name, position, rotation);
function shell(root, [width, height, depth], material, trim = shared.trim) {
  const t = Math.min(width, height, depth) * .045;
  box(root, [width, t, depth], material, "Cabinet", [0, t / 2, 0]);
  box(root, [width, t, depth], material, "CabinetTop", [0, height - t / 2, 0]);
  box(root, [t, height - 2 * t, depth], material, "CabinetLeft", [-width / 2 + t / 2, height / 2, 0]);
  box(root, [t, height - 2 * t, depth], material, "CabinetRight", [width / 2 - t / 2, height / 2, 0]);
  box(root, [width - 2 * t, height - 2 * t, t], material, "CabinetBack", [0, height / 2, -depth / 2 + t / 2]);
  const z = depth / 2 - t * .35;
  box(root, [width - 2 * t, t * .55, t * .65], trim, "FrontTrimTop", [0, height - t * 1.15, z]);
  box(root, [width - 2 * t, t * .55, t * .65], trim, "FrontTrimBottom", [0, t * 1.15, z]);
  box(root, [t * .55, height - 2.3 * t, t * .65], trim, "FrontTrimLeft", [-width / 2 + t * 1.15, height / 2, z]);
  box(root, [t * .55, height - 2.3 * t, t * .65], trim, "FrontTrimRight", [width / 2 - t * 1.15, height / 2, z]);
  return { t, front: depth / 2 - t * .75 };
}
const baffle = (root, width, height, z, y, material) => box(root, [width, height, .018], material, "Baffle", [0, y, z]);
function frame(root, width, height, z, y, material, t) {
  box(root, [width, t, .022], material, "HornFrameTop", [0, y + height / 2 - t / 2, z]);
  box(root, [width, t, .022], material, "HornFrameBottom", [0, y - height / 2 + t / 2, z]);
  box(root, [t, height - 2 * t, .022], material, "HornFrameLeft", [-width / 2 + t / 2, y, z]);
  box(root, [t, height - 2 * t, .022], material, "HornFrameRight", [width / 2 - t / 2, y, z]);
}
function woofer(root, radius, x, y, front, emitterName = "EmitterLow", materials = shared) {
  const depth = Math.max(.014, radius * .055);
  add(root, new THREE.CylinderGeometry(radius * 1.08, radius * 1.08, depth, 28), materials.trim, "WooferSurround", [x, y, front - depth], [Math.PI / 2, 0, 0]);
  add(root, new THREE.CylinderGeometry(radius, radius * .9, depth, 28), materials.woofer, emitterName, [x, y, front - depth * .35], [Math.PI / 2, 0, 0]);
  const cap = add(root, new THREE.SphereGeometry(radius * .22, 16, 10), materials.cavity, "DustCap", [x, y, front - depth * .05]); cap.scale.set(1, 1, .22);
}
function port(root, x, y, width, height, front, materials = shared) {
  box(root, [width, height, .026], materials.cavity, "ReflexPort", [x, y, front - .014]);
  frame(root, width * 1.08, height * 1.16, front - .001, y, materials.trim, Math.min(width, height) * .08);
}
function flareGeometry(mouthWidth, mouthHeight, throatWidth, throatHeight, depth) {
  const p = new Float32Array([
    -mouthWidth/2,-mouthHeight/2,0, mouthWidth/2,-mouthHeight/2,0, throatWidth/2,-throatHeight/2,-depth, -throatWidth/2,-throatHeight/2,-depth,
    mouthWidth/2,-mouthHeight/2,0, mouthWidth/2,mouthHeight/2,0, throatWidth/2,throatHeight/2,-depth, throatWidth/2,-throatHeight/2,-depth,
    mouthWidth/2,mouthHeight/2,0, -mouthWidth/2,mouthHeight/2,0, -throatWidth/2,throatHeight/2,-depth, throatWidth/2,throatHeight/2,-depth,
    -mouthWidth/2,mouthHeight/2,0, -mouthWidth/2,-mouthHeight/2,0, -throatWidth/2,-throatHeight/2,-depth, -throatWidth/2,throatHeight/2,-depth,
  ]);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(p, 3));
  geometry.setIndex([0,1,2,0,2,3, 4,5,6,4,6,7, 8,9,10,8,10,11, 12,13,14,12,14,15]); geometry.computeVertexNormals(); return geometry;
}
function horn(root, { width, height, depth, x = 0, y, front, emitter, materials = shared, throatScale = .14 }) {
  add(root, flareGeometry(width, height, width * throatScale, height * throatScale, depth), materials.horn, "HornFlare", [x, y, front]);
  frame(root, width * 1.04, height * 1.07, front - .002, y, materials.trim, Math.min(width, height) * .055);
  box(root, [width * throatScale * 1.05, height * throatScale * 1.05, .022], materials.cavity, "HornThroat", [x, y, front - depth + .012]);
  box(root, [width * throatScale * .68, height * throatScale * .68, .024], materials.cavity, emitter, [x, y, front - depth + .026]);
}
function brace(root, start, end, depth, material, name = "HornBrace") {
  const dx = end[0] - start[0], dy = end[1] - start[1]; const length = Math.hypot(dx, dy);
  box(root, [length, Math.min(.035, length * .08), depth], material, name, [(start[0]+end[0])/2, (start[1]+end[1])/2, start[2]], [0, 0, Math.atan2(dy, dx)]);
}
function roundedBrace(root, start, end, depth, material, name) {
  const dx = end[0] - start[0], dy = end[1] - start[1]; const length = Math.hypot(dx, dy);
  roundedBox(root, [length, .038, depth], material, name, [(start[0]+end[0])/2, (start[1]+end[1])/2, start[2]], [0, 0, Math.atan2(dy, dx)], 1, .008);
}
function normalizeAndBake(scene, [targetWidth, targetHeight, targetDepth]) {
  scene.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(scene); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
  if ([size.x,size.y,size.z].some((value) => !Number.isFinite(value) || value <= 0)) throw new Error("Invalid generated bounds");
  const normalizer = new THREE.Matrix4().set(targetWidth/size.x,0,0,-center.x*targetWidth/size.x, 0,targetHeight/size.y,0,-bounds.min.y*targetHeight/size.y, 0,0,targetDepth/size.z,-center.z*targetDepth/size.z, 0,0,0,1);
  const baked = new THREE.Scene(); baked.name = scene.name; const root = new THREE.Group(); root.name = "Root"; baked.add(root);
  scene.traverse((object) => { if (!(object instanceof THREE.Mesh)) return; const geometry = object.geometry.clone(); geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalizer, object.matrixWorld)); geometry.computeBoundingBox(); geometry.computeBoundingSphere(); const mesh = new THREE.Mesh(geometry, object.material); mesh.name = object.name; root.add(mesh); });
  baked.updateMatrixWorld(true); return baked;
}
function makeScene(label, body, builder) { const scene = new THREE.Scene(); scene.name = `${label}Asset`; const root = new THREE.Group(); root.name = "Source"; scene.add(root); builder(root, body); return normalizeAndBake(scene, body); }

const builders = {
  wBin(root, body) {
    const [w,h,d] = body, wall = .045, front = d / 2 - .014, floor = .055;
    roundedBox(root,[w,wall,d],wBin.cabinet,"Cabinet",[0,floor + wall / 2,0],[0,0,0],2,.014);
    roundedBox(root,[w,wall,d],wBin.cabinet,"CabinetTop",[0,h - wall / 2,0],[0,0,0],2,.014);
    roundedBox(root,[wall,h - floor - wall,d],wBin.cabinet,"CabinetLeft",[-w / 2 + wall / 2,(h + floor) / 2,0],[0,0,0],2,.014);
    roundedBox(root,[wall,h - floor - wall,d],wBin.cabinet,"CabinetRight",[w / 2 - wall / 2,(h + floor) / 2,0],[0,0,0],2,.014);
    roundedBox(root,[w - 2 * wall,h - floor - 2 * wall,wall],wBin.cabinet,"CabinetBack",[0,(h + floor) / 2,-d / 2 + wall / 2],[0,0,0],2,.012);

    box(root,[w * .89,h * .76,.026],wBin.cavity,"HornMouthVoid",[0,h * .5,front - d * .39]);
    const frameWidth = w * .92, frameHeight = h * .82, frameThickness = .043;
    roundedBox(root,[frameWidth,frameThickness,.06],wBin.frame,"FrontFrameTop",[0,h * .5 + frameHeight / 2 - frameThickness / 2,front],[0,0,0],1,.009);
    roundedBox(root,[frameWidth,frameThickness,.06],wBin.frame,"FrontFrameBottom",[0,h * .5 - frameHeight / 2 + frameThickness / 2,front],[0,0,0],1,.009);
    roundedBox(root,[frameThickness,frameHeight - 2 * frameThickness,.06],wBin.frame,"FrontFrameLeft",[-frameWidth / 2 + frameThickness / 2,h * .5,front],[0,0,0],1,.009);
    roundedBox(root,[frameThickness,frameHeight - 2 * frameThickness,.06],wBin.frame,"FrontFrameRight",[frameWidth / 2 - frameThickness / 2,h * .5,front],[0,0,0],1,.009);

    const pathZ = front - d * .25, pathDepth = d * .54;
    const points = [[-w*.41,h*.79],[-w*.23,h*.2],[0,h*.58],[w*.23,h*.2],[w*.41,h*.79]];
    for (let index = 0; index < 4; index += 1) roundedBrace(root,[...points[index],pathZ],[...points[index + 1],pathZ],pathDepth,wBin.horn,`HornPathPanel${index + 1}`);
    roundedBox(root,[.042,h*.68,pathDepth],wBin.frame,"CentralSplitter",[0,h*.5,pathZ],[0,0,0],1,.008);
    roundedBox(root,[w*.34,.032,d*.42],wBin.horn,"InternalBraceLeft",[-w*.27,h*.48,front-d*.27],[0,0,-.12],1,.007);
    roundedBox(root,[w*.34,.032,d*.42],wBin.horn,"InternalBraceRight",[w*.27,h*.48,front-d*.27],[0,0,.12],1,.007);
    roundedBox(root,[w*.82,.048,.075],wBin.frame,"FrontLowerReinforcement",[0,h*.13,front+.002],[0,0,0],1,.01);

    for (const side of [-1,1]) {
      const x = side * (w / 2 - .008);
      roundedBox(root,[.018,h*.2,d*.22],wBin.cavity,side < 0 ? "SideHandleLeft" : "SideHandleRight",[x,h*.56,-d*.07],[0,0,0],1,.008);
      roundedBox(root,[.024,h*.025,d*.13],wBin.hardware,side < 0 ? "SideGripLeft" : "SideGripRight",[x + side*.006,h*.56,-d*.07],[0,0,0],1,.006);
    }
    for (const x of [-w*.43,w*.43]) for (const z of [-d*.34,d*.34]) roundedBox(root,[w*.12,.055,d*.14],wBin.hardware,"PalletFoot",[x,.0275,z],[0,0,0],1,.008);
    for (const x of [-w*.475,w*.475]) for (const y of [h*.09,h*.91]) for (const z of [-d*.475,d*.475]) roundedBox(root,[.05,.05,.05],wBin.hardware,"CornerProtector",[x,y,z],[0,0,0],1,.009);

    roundedBox(root,[w*.085,h*.075,.026],wBin.cavity,"EmitterLow",[0,h*.57,-d*.43],[0,0,0],1,.006);
  },
  kickHorn(root, body) { const [w,h,d]=body,{front}=shell(root,body,freeparty.cabinet,freeparty.trim); baffle(root,w*.88,h*.77,front-.025,h*.5,freeparty.baffle); horn(root,{width:w*.78,height:h*.58,depth:d*.48,y:h*.5,front,emitter:"EmitterLow",materials:freeparty,throatScale:.16}); box(root,[.035,h*.53,d*.28],freeparty.trim,"HornBrace",[0,h*.5,front-d*.14]); },
  midHorn(root, body) { const [w,h,d]=body,{front}=shell(root,body,freeparty.cabinet,freeparty.trim); baffle(root,w*.88,h*.77,front-.025,h*.5,freeparty.baffle); horn(root,{width:w*.76,height:h*.6,depth:d*.55,y:h*.52,front,emitter:"EmitterMid",materials:freeparty,throatScale:.13}); },
  topHorn(root, body) { const [w,h,d]=body,{front}=shell(root,body,freeparty.cabinet,freeparty.trim); baffle(root,w*.88,h*.74,front-.022,h*.5,freeparty.baffle); horn(root,{width:w*.75,height:h*.55,depth:d*.5,y:h*.5,front,emitter:"EmitterHigh",materials:freeparty,throatScale:.1}); },
  festivalSub(root, body) { const [w,h]=body,{front}=shell(root,body,shared.cabinet,shared.metal); baffle(root,w*.9,h*.76,front-.025,h*.5,shared.baffle); woofer(root,h*.285,-w*.235,h*.52,front,"EmitterLow"); woofer(root,h*.285,w*.235,h*.52,front,"DriverLow"); frame(root,w*.91,h*.78,front+.002,h*.5,shared.metal,.025); },
  lineArray(root, body) {
    const [w,h,d]=body,mh=h*.135; box(root,[w*.92,.065,d*.78],shared.metal,"Flybar",[0,h-.04,-d*.03]);
    box(root,[.035,h*.91,.035],shared.metal,"RiggingSpine",[-w*.46,h*.49,-d*.22]); box(root,[.035,h*.91,.035],shared.metal,"RiggingSpine",[w*.46,h*.49,-d*.22]);
    for(let i=0;i<6;i++){ const g=new THREE.Group(); g.position.set(0,h*.87-i*h*.145,-d*.06+(i/5)**2*d*.22); g.rotation.x=Math.max(0,i-1)*.045; root.add(g);
      box(g,[w*.92,mh,d*.78],shared.cabinet,i===0?"Cabinet":`ArrayCabinet${i+1}`,[0,0,0]); baffle(g,w*.82,mh*.68,d*.39-.016,0,shared.baffle);
      box(g,[w*.33,mh*.35,.018],shared.horn,"Waveguide",[0,0,d*.39-.005]); box(g,[w*.16,mh*.18,.02],shared.cavity,i===0?"EmitterHigh":`DriverHigh${i+1}`,[0,0,d*.39-.001]);
      for(const x of [-w*.425,w*.425]) box(g,[.028,mh*.82,.035],shared.metal,"RiggingPin",[x,0,d*.14]); }
  },
  frontFill(root, body) { const [w,h,d]=body,{front}=shell(root,body,shared.cabinet,shared.metal); baffle(root,w*.88,h*.76,front-.02,h*.5,shared.baffle); woofer(root,h*.24,-w*.2,h*.46,front,"EmitterLow"); horn(root,{width:w*.32,height:h*.35,depth:d*.28,x:w*.2,y:h*.5,front,emitter:"EmitterHigh",throatScale:.16}); },
  hifiWoofer(root, body) { const [w,h]=body,{front}=shell(root,body,hifi.cabinet,hifi.horn); baffle(root,w*.86,h*.85,front-.022,h*.5,hifi.horn); woofer(root,w*.335,0,h*.52,front,"EmitterLow",hifi); for(const x of [-w*.38,w*.38]) for(const y of [h*.15,h*.85]) add(root,new THREE.SphereGeometry(.018,10,6),hifi.metal,"BaffleBolt",[x,y,front]); },
  hifiHorn(root, body) { const [w,h,d]=body,{front}=shell(root,body,hifi.cabinet,hifi.horn); baffle(root,w*.9,h*.8,front-d*.52,h*.52,hifi.cavity); horn(root,{width:w*.88,height:h*.76,depth:d*.69,y:h*.52,front,emitter:"EmitterMid",materials:hifi,throatScale:.1}); for(const ratio of [.33,.66]) frame(root,w*(.18+ratio*.7),h*(.17+ratio*.55),front-d*(1-ratio)*.64,h*.52,hifi.horn,.015); },
  hifiTweeter(root, body) { const [w,h,d]=body,{front}=shell(root,body,hifi.cabinet,hifi.horn); baffle(root,w*.86,h*.75,front-.018,h*.5,hifi.cavity); horn(root,{width:w*.66,height:h*.56,depth:d*.48,y:h*.5,front,emitter:"EmitterHigh",materials:hifi,throatScale:.08}); },
  reflexSub(root, body) { const [w,h]=body,{front}=shell(root,body,shared.cabinet,shared.trim); baffle(root,w*.88,h*.78,front-.022,h*.5,shared.baffle); woofer(root,h*.315,0,h*.58,front,"EmitterLow"); port(root,-w*.22,h*.17,w*.25,h*.12,front); port(root,w*.22,h*.17,w*.25,h*.12,front); frame(root,w*.9,h*.8,front+.002,h*.5,shared.metal,.024); },
  steppersKick(root, body) { const [w,h,d]=body,{front}=shell(root,body,shared.cabinet,shared.trim); baffle(root,w*.88,h*.76,front-.022,h*.5,shared.baffle); woofer(root,h*.28,0,h*.55,front,"EmitterLow"); port(root,0,h*.16,w*.48,h*.1,front); box(root,[w*.68,.026,d*.34],shared.horn,"KickShelf",[0,h*.34,front-d*.17]); },
  steppersMid(root, body) { const [w,h,d]=body,{front}=shell(root,body,shared.cabinet,shared.trim); baffle(root,w*.88,h*.78,front-.022,h*.5,shared.baffle); woofer(root,h*.205,0,h*.3,front,"EmitterLow"); horn(root,{width:w*.62,height:h*.3,depth:d*.42,y:h*.69,front,emitter:"EmitterMid",throatScale:.13}); },
  steppersTop(root, body) { const [w,h,d]=body,{front}=shell(root,body,shared.cabinet,shared.trim); baffle(root,w*.87,h*.74,front-.018,h*.5,shared.baffle); horn(root,{width:w*.7,height:h*.53,depth:d*.48,y:h*.5,front,emitter:"EmitterHigh",throatScale:.1}); },
};

const specs = requestedId ? SPEAKER_GLB_SPECS.filter((spec) => spec.id === requestedId) : representativeOnly ? SPEAKER_GLB_SPECS.filter((spec) => REPRESENTATIVE_IDS.has(spec.id)) : SPEAKER_GLB_SPECS;
if (requestedId && specs.length !== 1) throw new Error(`Unknown speaker model id: ${requestedId}`);
await fs.mkdir(outputDirectory,{recursive:true});
for(const spec of specs){ if(PROTECTED_FAMILIES.has(spec.family)) throw new Error(`Refusing protected family: ${spec.family}`); const scene=makeScene(spec.id,spec.body,builders[spec.build]); const destination=path.join(outputDirectory,spec.path); await fs.mkdir(path.dirname(destination),{recursive:true}); const glb=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true,trs:true}); await fs.writeFile(destination,Buffer.from(glb)); console.log(`generated ${spec.path}`); }
console.log(`Generated ${specs.length} protected-safe GLB speaker assets${representativeOnly?" (representatives)":""}.`);
