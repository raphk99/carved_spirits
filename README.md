# Design Portfolio

A minimalist, modern design portfolio featuring smooth scrolling animations powered by Lenis and interactive 3D models using Three.js.

## Features

- ✨ **Smooth Scrolling**: Buttery smooth scroll experience with Lenis
- 🎭 **Interactive 3D Models**: Each project features unique Three.js geometry that responds to mouse movement
- 🎨 **Minimalist Design**: Clean, pure aesthetic with focus on content
- 📱 **Fully Responsive**: Optimized for all screen sizes
- ⚡ **High Performance**: Efficient rendering and optimized animations
- ♿ **Accessible**: Keyboard navigation and semantic HTML

## Tech Stack

- **Vanilla JavaScript** (ES6 Modules)
- **Three.js** - 3D graphics and interactive models
- **Lenis** - Smooth scrolling
- **Vite** - Development server and build tool
- **Pure CSS** - No frameworks, custom properties for theming

## Project Structure

```
service_portfolio/
├── index.html              # Main HTML file
├── css/
│   ├── reset.css          # CSS reset
│   └── main.css           # Main styles
├── js/
│   ├── main.js            # Application entry point
│   ├── lenis.js           # Smooth scroll setup
│   └── three-scene.js     # Three.js scene management
├── package.json           # Dependencies
└── vite.config.js         # Vite configuration
```

## Getting Started

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The site will open at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 3D Models

Each project card features a unique 3D geometry:

1. **Geometric Dreams** - Wireframe Icosahedron
2. **Fluid Motion** - Torus Knot (smooth and flowing)
3. **Minimal Essence** - Wireframe Octahedron
4. **Digital Sculpture** - Solid Dodecahedron

All models respond to mouse movement for interactive exploration.

## Customization

### Colors

Edit CSS custom properties in `css/main.css`:

```css
:root {
  --color-bg: #0a0a0a;
  --color-text: #e8e8e8;
  --color-text-muted: #808080;
  --color-accent: #ffffff;
  --color-border: #1a1a1a;
}
```

### Projects

To add or modify projects, edit the HTML in `index.html` and update the geometry in `js/three-scene.js`.

### Scroll Animation Settings

Adjust Lenis configuration in `js/lenis.js`:

```javascript
const lenis = new Lenis({
  duration: 1.2,  // Scroll duration
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  // ... other options
});
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6 module support required
- WebGL support required for 3D graphics

## Performance Tips

- The site uses requestAnimationFrame for smooth animations
- Three.js scenes are optimized with proper disposal
- Pixel ratio is capped at 2x for performance
- Responsive canvas sizing

## License

MIT License - feel free to use for your own portfolio!

## Credits

- Smooth scrolling: [@studio-freight/lenis](https://github.com/studio-freight/lenis)
- 3D graphics: [Three.js](https://threejs.org/)
