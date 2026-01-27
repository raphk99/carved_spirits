# TextHoverAnimation

A lightweight, highly customizable JavaScript component that creates beautiful letter-by-letter hover animations. Each letter smoothly transitions in sequence, creating an elegant wave effect perfect for navigation links, headings, buttons, and more.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Size](https://img.shields.io/badge/size-3kb-orange.svg)

## ✨ Features

- 🎨 **Smooth Animations** - Butter-smooth letter transitions with configurable easing
- ⚡ **High Performance** - Uses CSS transforms and will-change for optimal rendering
- 🎯 **Highly Configurable** - Control duration, stagger, easing, and direction
- 🔄 **Multiple Directions** - Animate up, down, left, or right
- 🎪 **Callbacks** - Hook into animation lifecycle events
- 📦 **Zero Dependencies** - Pure vanilla JavaScript
- 🎭 **Accessibility** - Properly handles aria attributes
- 💪 **TypeScript Ready** - Includes JSDoc for better IDE support
- 🧹 **Clean API** - Easy to initialize and destroy

## 📦 Installation

### Direct Download

```javascript
import { TextHoverAnimation } from './text-hover-animation.js';
```

### NPM (when published)

```bash
npm install text-hover-animation
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { TextHoverAnimation } from './text-hover-animation.js';

// Apply to all elements with class 'animated-link'
new TextHoverAnimation('.animated-link');
```

### With Custom Options

```javascript
new TextHoverAnimation('.nav-link', {
  duration: 700,        // Animation duration in ms
  stagger: 40,          // Delay between each letter
  easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  direction: 'up'       // 'up', 'down', 'left', 'right'
});
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | Number | `600` | Animation duration in milliseconds |
| `stagger` | Number | `35` | Delay between each letter animation (ms) |
| `easing` | String | `'cubic-bezier(0.65, 0, 0.35, 1)'` | CSS easing function |
| `direction` | String | `'up'` | Animation direction: `'up'`, `'down'`, `'left'`, `'right'` |
| `preserveSpaces` | Boolean | `true` | Convert spaces to non-breaking spaces |
| `onHoverStart` | Function | `null` | Callback when hover begins |
| `onHoverEnd` | Function | `null` | Callback when hover ends |
| `onLetterHoverStart` | Function | `null` | Callback for each letter start |
| `onLetterHoverEnd` | Function | `null` | Callback for each letter end |

### Advanced Options

```javascript
{
  // Custom class names for styling (advanced)
  classNames: {
    wrapper: 'th-letters-wrapper',
    container: 'th-letter-container',
    letter: 'th-letter',
    original: 'th-letter-original',
    clone: 'th-letter-clone',
    hovered: 'th-hovered'
  }
}
```

## 📖 Examples

### Navigation Links

```javascript
new TextHoverAnimation('.nav-link', {
  duration: 700,
  stagger: 40,
  easing: 'cubic-bezier(0.65, 0, 0.35, 1)'
});
```

### Heading with Bounce Effect

```javascript
new TextHoverAnimation('h1', {
  duration: 800,
  stagger: 50,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
  direction: 'down'
});
```

### Buttons with Fast Animation

```javascript
new TextHoverAnimation('.btn', {
  duration: 400,
  stagger: 20,
  direction: 'up'
});
```

### With Callbacks

```javascript
new TextHoverAnimation('.interactive-text', {
  duration: 600,
  stagger: 30,
  onHoverStart: (element) => {
    console.log('Hover started on:', element);
  },
  onHoverEnd: (element) => {
    console.log('Hover ended on:', element);
  },
  onLetterHoverStart: (letterContainer, index) => {
    console.log(`Letter ${index} animation started`);
  }
});
```

### Multiple Elements with Different Configs

```javascript
// Slow, elegant animation for main headings
new TextHoverAnimation('h1', {
  duration: 900,
  stagger: 60,
  easing: 'cubic-bezier(0.65, 0, 0.35, 1)'
});

// Fast, snappy animation for buttons
new TextHoverAnimation('.btn', {
  duration: 400,
  stagger: 20,
  easing: 'cubic-bezier(0.76, 0, 0.24, 1)'
});
```

## 🎯 API Methods

### Constructor

```javascript
const animation = new TextHoverAnimation(selector, options);
```

- `selector`: String, NodeList, HTMLElement, or Array of elements
- `options`: Configuration object (optional)

### destroy()

Remove the animation and restore original text:

```javascript
const animation = new TextHoverAnimation('.my-links');

// Later, when you want to clean up
animation.destroy();
```

### updateOptions(newOptions)

Update configuration and reinitialize:

```javascript
const animation = new TextHoverAnimation('.my-links');

// Change to a different animation style
animation.updateOptions({
  duration: 1000,
  direction: 'down'
});
```

## 🎨 Custom Easing Functions

The component accepts any CSS easing function:

```javascript
// Ease in-out (smooth)
easing: 'cubic-bezier(0.65, 0, 0.35, 1)'

// Ease out (quick start, slow end)
easing: 'cubic-bezier(0.33, 1, 0.68, 1)'

// Ease in (slow start, quick end)
easing: 'cubic-bezier(0.32, 0, 0.67, 0)'

// Bounce effect
easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'

// Elastic effect
easing: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
```

Try [cubic-bezier.com](https://cubic-bezier.com) to create custom easing functions!

## 🎭 Accessibility

The component automatically adds `aria-hidden="true"` to cloned letters to prevent screen readers from reading text twice. The original text structure is preserved for accessibility.

## 🎪 Animation Directions

### Up (default)
Letters slide up and out, replaced by letters sliding up from below.

### Down
Letters slide down and out, replaced by letters sliding down from above.

### Left
Letters slide left and out, replaced by letters sliding in from the right.

### Right
Letters slide right and out, replaced by letters sliding in from the left.

## 🔧 Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Opera 74+

Requires support for:
- ES6 Classes
- CSS Transforms
- CSS Custom Properties

## ⚡ Performance Tips

1. **Use will-change sparingly** - The component already optimizes this
2. **Limit concurrent animations** - Don't animate too many elements simultaneously
3. **Use transform over position** - The component uses transforms by default
4. **Disable on mobile if needed** - Add breakpoint logic for mobile devices

```javascript
// Disable on mobile
if (window.innerWidth > 768) {
  new TextHoverAnimation('.nav-link');
}
```

## 🐛 Troubleshooting

### Letters overlap or look weird
Make sure the parent element doesn't have conflicting styles like `display: flex` with `align-items: center`.

### Animation is choppy
- Check if there are too many elements animating simultaneously
- Ensure GPU acceleration is enabled (it is by default with transforms)
- Try reducing the `duration` or `stagger` values

### Text jumps on initialization
This can happen if the element has specific line-height settings. The component uses `line-height: 1em` by default.

## 📝 License

MIT License - feel free to use this in personal and commercial projects!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🌟 Credits

Inspired by the hover effect on [landonorris.com](https://landonorris.com/)

## 📮 Feedback

If you use this component, I'd love to hear about it! Feel free to reach out with feedback or showcase your implementation.

---

Made with ❤️ by [Your Name]
