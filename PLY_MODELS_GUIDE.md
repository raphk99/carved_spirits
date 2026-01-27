# PLY 3D Models Integration Guide

This guide explains how to add and manage .ply 3D models in your portfolio.

## Quick Start: Adding a New PLY Model

Follow these 3 simple steps to add a new 3D model:

### Step 1: Add Your PLY File

Place your `.ply` file in the `/public/models/` folder.

```
service_portfolio/
  └── public/
      └── models/
          ├── model1.ply
          ├── model2.ply
          └── your-new-model.ply  ← Add your file here
```

### Step 2: Configure the Model

Open `js/ply-model-loader.js` and add your model to the `PLY_MODELS_CONFIG` array:

```javascript
export const PLY_MODELS_CONFIG = [
  {
    filename: 'your-new-model.ply',  // Must match the file in /public/models/
    scale: 1.0,                       // Adjust to make it bigger/smaller
    position: { x: 0, y: 0, z: 0 },  // Adjust position in 3D space
    rotation: { x: 0, y: 0, z: 0 }   // Adjust rotation (in radians)
  }
];
```

### Step 3: Refresh Your Browser

That's it! The model will automatically load and appear in:
- Project card scenes (alongside geometric shapes)
- Modal expanded views
- Horizontal scroll animation

## Configuration Options

Each model in `PLY_MODELS_CONFIG` supports these options:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `filename` | string | The name of your .ply file | `'chair.ply'` |
| `scale` | number | Uniform scale multiplier | `1.5` (150% size) |
| `position` | object | 3D position `{x, y, z}` | `{x: 2, y: 0, z: -1}` |
| `rotation` | object | 3D rotation `{x, y, z}` in radians | `{x: 0, y: 1.57, z: 0}` |

### Scale Tips

- `1.0` = original size
- `0.5` = half size
- `2.0` = double size
- Start with `1.0` and adjust based on how it looks

### Position Tips

- `x`: left (-) / right (+)
- `y`: down (-) / up (+)
- `z`: away (-) / toward (+)
- Default `{x: 0, y: 0, z: 0}` centers the model

### Rotation Tips

- Rotation values are in **radians** (not degrees)
- 90° = 1.57 radians
- 180° = 3.14 radians
- 360° = 6.28 radians

## Example Configuration

```javascript
export const PLY_MODELS_CONFIG = [
  {
    filename: 'chair.ply',
    scale: 1.2,
    position: { x: 0, y: -0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },
  {
    filename: 'table.ply',
    scale: 0.8,
    position: { x: 3, y: 0, z: 0 },
    rotation: { x: 0, y: 1.57, z: 0 }  // Rotated 90°
  },
  {
    filename: 'lamp.ply',
    scale: 1.5,
    position: { x: -3, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }
];
```

## Where Models Appear

Your PLY models will appear in three locations:

1. **Project Cards** - Each of the 4 project cards will display all configured models alongside the original geometric shapes
2. **Modal View** - When you click a project card, the expanded modal shows all models
3. **Horizontal Scroll Section** - Models animate in from right to left as you scroll

## Material Settings

PLY models are rendered with a uniform surface material (no colors):

- Color: `#e8e8e8` (light gray matching the site aesthetic)
- Metalness: `0.4`
- Roughness: `0.5`
- Lighting: Same directional and ambient lights as geometric shapes

Any color data in your PLY files will be ignored.

## Troubleshooting

### Model doesn't appear

1. Check browser console for errors
2. Verify the filename matches exactly (case-sensitive)
3. Ensure the .ply file is in `/public/models/`
4. Check that the file is a valid PLY format

### Model is too big/small

Adjust the `scale` value in the configuration:
- Too big? Try `0.5` or `0.3`
- Too small? Try `2.0` or `3.0`

### Model is in wrong position

Adjust the `position` values:
- Move right: increase `x`
- Move left: decrease `x`
- Move up: increase `y`
- Move down: decrease `y`

### Browser console shows loading errors

Check:
1. File path is correct (`/models/filename.ply`)
2. File is properly uploaded to `/public/models/`
3. PLY file is not corrupted
4. File is in ASCII or binary PLY format

## Technical Details

- **Loader**: Uses Three.js `PLYLoader` from examples/addons
- **Format Support**: Both ASCII and binary PLY formats
- **Geometry Processing**: Automatically centers models and computes vertex normals
- **Loading**: Asynchronous - page remains interactive while models load
- **Fallback**: If loading fails, geometric shapes still display

## Animation Behavior

All PLY models automatically:
- Auto-rotate continuously
- Respond to mouse movement when hovered
- Animate in scroll sections with same timing as geometric shapes
- Use smooth interpolation for interactions

No additional configuration needed for animations!
