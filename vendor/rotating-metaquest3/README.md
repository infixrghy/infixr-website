# Rotating Meta Quest 3

A self-rotating Meta Quest 3 3D model for embedding on a website. Single vertical axis, no user interaction — passive hero element.

## Files

- `headset.glb` — optimized model (~485 KB, ~40k tris, Draco-compressed, JPEG textures)
- `index.html` — viewer using `<model-viewer>` (Google's glTF web component)
- `original/sketchfab_meta_quest_3.glb` — untouched source (~6.7 MB, 76k tris)

## Usage

Open `index.html` directly or serve over HTTP:

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Optimization pipeline

Source (6.7 MB) → Blender → decimate to 52% (40k tris) → 1024² JPEG q92 textures → Draco mesh compression level 8 → final GLB ~485 KB.

The model is rotated by `<model-viewer>`'s `auto-rotate` (camera orbit), so no animation tracks are baked into the GLB.

## Attribution

3D model: "Meta Quest 3" by **Elin** ([@ElinHohler on Sketchfab](https://sketchfab.com/3d-models/meta-quest-3-65a813833dc04eeeb7d33bdca58c184c))

Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modifications: decimation, texture compression, Draco encoding.
