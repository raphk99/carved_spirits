# PLY Models Folder

Place your `.ply` 3D model files in this folder.

## Quick Instructions

1. Download your `.ply` files from SAM AI 3D or other sources
2. Place them in this folder
3. Open `js/ply-model-loader.js` and add configuration for each model
4. Refresh your browser to see the models

## Example Structure

```
models/
  ├── model1.ply
  ├── model2.ply
  ├── chair.ply
  └── table.ply
```

## Supported Formats

- ASCII PLY format
- Binary PLY format (little-endian and big-endian)

## Notes

- File names are case-sensitive
- Keep file names simple (no spaces, use underscores or hyphens)
- Models will be automatically centered and normalized

For detailed instructions, see `/PLY_MODELS_GUIDE.md` in the project root.
