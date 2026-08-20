# Speaker GLB visuals

Place assets below `client/public/models/speakers/`, for example `client/public/models/speakers/reggae/future-scoop.glb`. Register the public URL in the matching `speakerModels.ts` entry; do not add a production model ID until its asset exists.

```ts
visual: {
  type: "glb",
  src: "/models/speakers/reggae/future-scoop.glb",
  rotation: [0, Math.PI, 0],
  scale: 1,
  offset: [0, 0, 0],
  emitterMeshes: { low: ["EmitterLow"] },
}
```

`body.width`, `body.height`, and `body.depth` remain the authoritative physical dimensions for placement, stacking, audio, and UI. A GLB is visual-only. The loader applies calibration rotation, measures its bounds, uniformly fits it inside `body`, aligns it centre X/Z with its bottom at `-body.height / 2`, then applies the optional fine offset. Club Craft forward is local `+Z`; use `rotation` to correct imported models.

The preferred mesh names are `Root`, `Cabinet`, `EmitterLow`, `EmitterMid`, and `EmitterHigh`. `emitterMeshes` can map other names. Only named emitters receive restrained activity colors (low red, mid yellow, high green); missing emitters do not prevent display.

GLB source geometry and textures are cached by `useGLTF`. Each displayed Speaker clones its materials, so activity state is isolated; cloned materials are disposed on unmount. During loading or if parsing/loading fails, the existing procedural Speaker remains visible.

Keep files low-poly and texture-light: 100 KB–1 MB is preferred, up to about 2 MB is acceptable. Avoid 10 MB+ assets, 4K textures, and unseen internal geometry.
