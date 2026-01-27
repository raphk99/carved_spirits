# Quick Start Guide

Get your portfolio up and running in under 5 minutes!

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Three.js (3D graphics)
- Lenis (smooth scrolling)
- Vite (development server)

### 2. Start Development Server

```bash
npm run dev
```

Your portfolio will open automatically at `http://localhost:3000`

## What You'll See

- **Hero Section**: Animated title with scroll indicator
- **Projects Grid**: 4 project cards with interactive 3D models
- **Interactive 3D**: Hover over projects to see 3D models respond to your mouse
- **Expandable Projects**: Click any project to view in fullscreen modal
- **Smooth Scrolling**: Buttery smooth Lenis scroll throughout

## Customization

### Update Your Information

Edit `index.html`:

```html
<!-- Change site title -->
<title>Your Name - Portfolio</title>

<!-- Update hero text -->
<h1 class="hero-title">
  <span>Your</span>
  <span>Name</span>
</h1>

<!-- Update email -->
<a href="mailto:your@email.com">your@email.com</a>
```

### Change Colors

Edit `css/main.css` (lines 2-7):

```css
:root {
  --color-bg: #0a0a0a;        /* Background color */
  --color-text: #e8e8e8;      /* Main text color */
  --color-text-muted: #808080; /* Secondary text */
  --color-accent: #ffffff;     /* Accent color */
  --color-border: #1a1a1a;    /* Border color */
}
```

### Add Your Projects

In `index.html`, duplicate a project card:

```html
<article class="project-card" data-project="5">
  <div class="project-number">05</div>
  <div class="project-content">
    <h3 class="project-title">Your Project Name</h3>
    <p class="project-description">Your project description</p>
    <div class="project-tags">
      <span class="tag">Tag 1</span>
      <span class="tag">Tag 2</span>
    </div>
  </div>
  <div class="project-3d-container" data-3d-target="5">
    <canvas class="project-canvas" id="canvas-5"></canvas>
  </div>
  <button class="project-expand">
    <span class="expand-icon">+</span>
  </button>
</article>
```

Then add geometry in `js/three-scene.js` (around line 66):

```javascript
case '5':
  geometry = new THREE.SphereGeometry(1.5, 32, 32);
  material = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    wireframe: false,
    metalness: 0.7,
    roughness: 0.2,
  });
  break;
```

### Update Social Links

Edit the footer in `index.html`:

```html
<ul class="footer-list">
  <li><a href="https://twitter.com/yourhandle">Twitter</a></li>
  <li><a href="https://instagram.com/yourhandle">Instagram</a></li>
  <li><a href="https://linkedin.com/in/yourhandle">LinkedIn</a></li>
  <li><a href="https://dribbble.com/yourhandle">Dribbble</a></li>
</ul>
```

## Available Three.js Geometries

Replace geometries in `js/three-scene.js`:

- `BoxGeometry` - Cubes
- `SphereGeometry` - Spheres
- `TorusGeometry` - Donuts
- `TorusKnotGeometry` - Complex knots
- `ConeGeometry` - Cones
- `CylinderGeometry` - Cylinders
- `IcosahedronGeometry` - 20-sided polyhedron
- `OctahedronGeometry` - 8-sided polyhedron
- `DodecahedronGeometry` - 12-sided polyhedron
- `TetrahedronGeometry` - 4-sided polyhedron

Set `wireframe: true` for a wireframe look!

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready to deploy to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting

## Need Help?

- Three.js docs: https://threejs.org/docs/
- Lenis docs: https://github.com/studio-freight/lenis
- Vite docs: https://vitejs.dev/

## Tips

1. **Performance**: Keep 3D models simple for best performance
2. **Mobile**: Test on mobile devices - touch interactions work too!
3. **Images**: Add project thumbnails to the assets folder
4. **Loading**: Models load instantly since they're procedural geometry

Enjoy your new portfolio! 🚀
