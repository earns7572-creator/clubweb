# Speaker GLB Asset Plan

## Current integration state

The current renderer has no GLB loading path (`useGLTF`, `GLTFLoader`, or equivalent asset component is not present). All six Sound System Scenes therefore use the existing procedural speaker renderer at runtime. No loader has been added in this branch.

Each `SpeakerModelDefinition.visual` now records a **planned** relative GLB path while keeping `renderer: "procedural"`. A future loader may use that path only after an actual, validated asset exists. Do not change this metadata to a runtime URL pre-emptively.

## Asset contract for the future loader

| Field | Rule |
|---|---|
| Location | WebDev static storage or an equivalent deployed asset URL, not a missing local path |
| Source of physical truth | `SpeakerModelDefinition.body`; never GLB bounding-box dimensions |
| Forward axis | Match the Club Craft loader convention; use metadata rotation correction instead of destructive mesh edits |
| Materials | 1–4 materials, no brand logos or manufacturer-identifying details |
| Activity nodes | Use `Cabinet`, `EmitterLow`, `EmitterMid`, and `EmitterHigh` when meaningful |
| File budget | Target 100 KB–1 MB; maximum approximately 2 MB per model |

## Planned asset paths

| Scene | Models |
|---|---|
| Reggae | `reggae/scoop.glb`, `reggae/kick-bin.glb`, `reggae/mid-horn.glb`, `reggae/top.glb` |
| Free Party | `freeparty/w-bin.glb`, `freeparty/kick-horn.glb`, `freeparty/mid-horn.glb`, `freeparty/hf-horn.glb` |
| Modern Club | `modern/sub.glb`, `modern/point-source.glb` |
| Festival | `festival/sub.glb`, `festival/line-array-hang.glb`, `festival/front-fill.glb` |
| Hi-Fi | `hifi/large-woofer.glb`, `hifi/mid-horn.glb`, `hifi/tweeter.glb` |
| Steppers | `steppers/reflex-sub.glb`, `steppers/kick.glb`, `steppers/mid-top.glb`, `steppers/top.glb` |

## Production priority

Create and validate these six generic, low-poly silhouettes first: Reggae Scoop, Free Party W-Bin, Modern Point Source, Festival Line Array Hang, Hi-Fi Wooden Mid Horn, and Steppers Reflex Sub. Keep the current procedural family renderers active until the loader and each asset are both available.
