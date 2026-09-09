# Speaker GLB Asset Plan

## Current integration state

The renderer loads validated local GLBs for the released non-Modern families and for the dedicated `modern-full` cabinet. The remaining Modern models and all Reggae models intentionally keep their existing procedural renderers; this is not a bulk family conversion.

Each `SpeakerModelDefinition.visual` records the relative GLB path and runtime URL only when an actual, validated asset exists. `modern-full` is the scoped Modern-family exception; its siblings remain procedural.

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
| Modern Club | `modern/full-range.glb` (modern-full only); `modern/sub.glb`, `modern/point-source.glb` remain procedural contracts |
| Festival | `festival/sub.glb`, `festival/line-array-hang.glb`, `festival/front-fill.glb` |
| Hi-Fi | `hifi/large-woofer.glb`, `hifi/mid-horn.glb`, `hifi/tweeter.glb` |
| Steppers | `steppers/reflex-sub.glb`, `steppers/kick.glb`, `steppers/mid-top.glb`, `steppers/top.glb` |

## Production priority

Create and validate these six generic, low-poly silhouettes first: Reggae Scoop, Free Party W-Bin, Modern Full Range, Festival Line Array Hang, Hi-Fi Wooden Mid Horn, and Steppers Reflex Sub. Keep protected Modern siblings and Reggae procedural unless explicitly scoped in a later release.
