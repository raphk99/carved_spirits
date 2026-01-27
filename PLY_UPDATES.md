# PLY Model Updates - Shading & Project Assignment

## What Changed

### 1. Better Shading with Depth Perception ✅

Point clouds now use a custom shader material that provides:
- **Directional lighting** - Light comes from top-right, creating shadows
- **Ambient lighting** - Base illumination (40%)
- **Diffuse lighting** - Surface shading based on light direction (60%)
- **Rim lighting** - Subtle edge highlights for better depth perception
- **Same grey color** - `#e8e8e8` matching your geometric shapes

### 2. Project Assignment System ✅

You can now assign PLY models to specific projects instead of showing them alongside:

```javascript
{
  filename: 'sam3d-splat.ply',
  scale: 1.0,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  pointSize: 0.03,
  projectId: '1'  // ← Replaces Project 1's geometry
}
```

**Project IDs:**
- `'1'` - Replaces the Icosahedron (Geometric Dreams)
- `'2'` - Replaces the Torus Knot (Fluid Motion)
- `'3'` - Replaces the Octahedron (Minimal Essence)
- `'4'` - Replaces the Dodecahedron (Digital Sculpture)
- `null` or omit - Appears alongside geometric shapes

### 3. Where Models Appear

**With `projectId: '1'`:**
- ✅ Project Card 1 shows your PLY model (geometric shape hidden)
- ✅ Modal view for Project 1 shows PLY model
- ✅ Horizontal scroll replaces first shape with PLY model
- ✅ Other projects (2, 3, 4) show their original geometric shapes

## Current Configuration

Your `sam3d-splat.ply` is currently assigned to Project 1:

```javascript
{
  filename: 'sam3d-splat.ply',
  scale: 1.0,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  pointSize: 0.03,      // Adjust for surface density
  projectId: '1'         // Replaces Project 1
}
```

## Adjusting the Appearance

### Point Size (Surface Density)

Controls how solid the point cloud looks:

```javascript
pointSize: 0.01  // Very sparse, see through
pointSize: 0.03  // Current - good balance
pointSize: 0.05  // Denser, more solid
pointSize: 0.08  // Very dense, almost solid surface
```

### Scale

Make the model bigger or smaller:

```javascript
scale: 0.5   // Half size
scale: 1.0   // Original size (current)
scale: 1.5   // 150% size
scale: 2.0   // Double size
```

### Position

Adjust position in 3D space:

```javascript
position: { x: 0, y: 0, z: 0 }     // Centered (current)
position: { x: 0, y: -0.5, z: 0 }  // Lower
position: { x: 0, y: 0.5, z: 0 }   // Higher
```

### Rotation

Rotate the model (values in radians):

```javascript
rotation: { x: 0, y: 0, z: 0 }        // No rotation (current)
rotation: { x: 0, y: 1.57, z: 0 }     // 90° around Y-axis
rotation: { x: 0, y: 3.14, z: 0 }     // 180° around Y-axis
rotation: { x: 1.57, y: 0, z: 0 }     // 90° around X-axis
```

## Adding More Models

### Replace Different Projects

```javascript
export const PLY_MODELS_CONFIG = [
  {
    filename: 'sam3d-splat.ply',
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    pointSize: 0.03,
    projectId: '1'  // Project 1
  },
  {
    filename: 'another-model.ply',
    scale: 1.2,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    pointSize: 0.04,
    projectId: '2'  // Project 2
  }
];
```

### Add Alongside (Not Replace)

Omit `projectId` to show model alongside geometric shapes:

```javascript
{
  filename: 'extra-model.ply',
  scale: 0.8,
  position: { x: 3, y: 0, z: 0 },  // Position to the right
  rotation: { x: 0, y: 0, z: 0 },
  pointSize: 0.03
  // No projectId - appears alongside all projects
}
```

## Shading Details

The new shader provides three-dimensional depth perception:

1. **Light Source**: Top-right (5, 5, 5)
2. **Lighting Breakdown**:
   - 40% ambient (always visible)
   - 60% diffuse (depends on surface angle to light)
   - 30% rim (highlights edges when viewed at angles)

3. **Grey Color**: Same as geometric shapes (`#e8e8e8`)

This creates visible depth, making it easy to distinguish different parts of the model even though it's all the same color.

## Troubleshooting

### "Model looks too sparse"
Increase `pointSize`:
```javascript
pointSize: 0.05  // or 0.08
```

### "Model looks too dense/blobby"
Decrease `pointSize`:
```javascript
pointSize: 0.02  // or 0.015
```

### "Can't see depth/shading"
The shader should automatically provide depth. Check:
1. Browser console for errors
2. Lighting is working (should see darker and lighter areas)
3. Try rotating the model to see different angles

### "Model not appearing in project"
Check:
1. `projectId` matches '1', '2', '3', or '4'
2. Browser console for loading errors
3. File exists in `/public/models/`

## Browser Console Output

You should see:
```
Loading PLY model: sam3d-splat.ply
PLY Info - Vertices: 5993, Has faces: false
Rendering sam3d-splat.ply as point cloud
Successfully loaded PLY model: sam3d-splat.ply
Replaced shape 0 with PLY model: sam3d-splat.ply
```

This confirms the model loaded and was assigned to a project.
