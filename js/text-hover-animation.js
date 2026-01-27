/**
 * TextHoverAnimation - A reusable letter-by-letter hover animation component
 * 
 * Creates a smooth, sequential letter transition effect on hover where each letter
 * slides up and is replaced by a clone sliding in from above (or any direction).
 * 
 * @example
 * // Basic usage with defaults
 * new TextHoverAnimation('.nav-link');
 * 
 * @example
 * // Custom configuration
 * new TextHoverAnimation('.my-links', {
 *   duration: 800,
 *   stagger: 40,
 *   easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
 *   direction: 'up'
 * });
 * 
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

export class TextHoverAnimation {
  /**
   * Default configuration options
   * @type {Object}
   */
  static defaults = {
    // Animation duration in milliseconds
    duration: 600,
    
    // Delay between each letter animation in milliseconds
    stagger: 35,
    
    // CSS easing function
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
    
    // Animation direction: 'up', 'down', 'left', 'right'
    direction: 'up',
    
    // Whether to preserve spaces as visible characters
    preserveSpaces: true,
    
    // Custom class names (advanced usage)
    classNames: {
      wrapper: 'th-letters-wrapper',
      container: 'th-letter-container',
      letter: 'th-letter',
      original: 'th-letter-original',
      clone: 'th-letter-clone',
      hovered: 'th-hovered'
    },
    
    // Callbacks
    onHoverStart: null,
    onHoverEnd: null,
    onLetterHoverStart: null,
    onLetterHoverEnd: null
  };

  /**
   * Creates a new TextHoverAnimation instance
   * @param {string|NodeList|HTMLElement[]} selector - CSS selector or elements
   * @param {Object} options - Configuration options
   */
  constructor(selector, options = {}) {
    this.options = { ...TextHoverAnimation.defaults, ...options };
    this.elements = this._getElements(selector);
    this.animationId = `th-animation-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.elements.length === 0) {
      console.warn('TextHoverAnimation: No elements found for selector:', selector);
      return;
    }
    
    this._injectStyles();
    this._init();
  }

  /**
   * Get elements from selector
   * @private
   */
  _getElements(selector) {
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    } else if (selector instanceof NodeList) {
      return Array.from(selector);
    } else if (Array.isArray(selector)) {
      return selector;
    } else if (selector instanceof HTMLElement) {
      return [selector];
    }
    return [];
  }

  /**
   * Inject dynamic styles based on configuration
   * @private
   */
  _injectStyles() {
    const styleId = `th-animation-styles-${this.animationId}`;
    
    // Check if styles already exist
    if (document.getElementById(styleId)) return;
    
    const { duration, easing, direction, classNames } = this.options;
    const transforms = this._getTransforms(direction);
    
    const css = `
      /* Text Hover Animation Styles */
      .${classNames.wrapper} {
        display: inline-flex;
      }
      
      .${classNames.container} {
        display: inline-block;
        position: relative;
        overflow: hidden;
        height: 1em;
        line-height: 1em;
        vertical-align: baseline;
      }
      
      .${classNames.letter} {
        display: block;
        transition: transform ${duration}ms ${easing};
        will-change: transform;
        backface-visibility: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .${classNames.original} {
        transform: ${transforms.originalDefault};
      }
      
      .${classNames.clone} {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        transform: ${transforms.cloneDefault};
      }
      
      .${classNames.container}.${classNames.hovered} .${classNames.original} {
        transform: ${transforms.originalHovered};
      }
      
      .${classNames.container}.${classNames.hovered} .${classNames.clone} {
        transform: ${transforms.cloneHovered};
      }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /**
   * Get transform values based on direction
   * @private
   */
  _getTransforms(direction) {
    const transforms = {
      up: {
        originalDefault: 'translateY(0)',
        cloneDefault: 'translateY(100%)',
        originalHovered: 'translateY(-100%)',
        cloneHovered: 'translateY(0)'
      },
      down: {
        originalDefault: 'translateY(0)',
        cloneDefault: 'translateY(-100%)',
        originalHovered: 'translateY(100%)',
        cloneHovered: 'translateY(0)'
      },
      left: {
        originalDefault: 'translateX(0)',
        cloneDefault: 'translateX(100%)',
        originalHovered: 'translateX(-100%)',
        cloneHovered: 'translateX(0)'
      },
      right: {
        originalDefault: 'translateX(0)',
        cloneDefault: 'translateX(-100%)',
        originalHovered: 'translateX(100%)',
        cloneHovered: 'translateX(0)'
      }
    };
    
    return transforms[direction] || transforms.up;
  }

  /**
   * Initialize all elements
   * @private
   */
  _init() {
    this.elements.forEach(element => {
      this._splitText(element);
      this._addEventListeners(element);
    });
  }

  /**
   * Split text into animated letters
   * @private
   */
  _splitText(element) {
    const text = element.textContent;
    const { classNames, preserveSpaces } = this.options;
    
    // Store original text
    element.setAttribute('data-th-original-text', text);
    element.innerHTML = '';
    element.style.position = 'relative';
    element.style.display = 'inline-block';

    // Create wrapper for all letters
    const wrapper = document.createElement('span');
    wrapper.className = classNames.wrapper;

    // Split text into letters
    text.split('').forEach((char, index) => {
      const letterContainer = document.createElement('span');
      letterContainer.className = classNames.container;
      letterContainer.setAttribute('data-th-index', index);
      
      // Handle spaces
      const displayChar = (char === ' ' && preserveSpaces) ? '\u00A0' : char;
      
      // Original letter
      const letterOriginal = document.createElement('span');
      letterOriginal.className = `${classNames.letter} ${classNames.original}`;
      letterOriginal.textContent = displayChar;
      letterOriginal.setAttribute('aria-hidden', 'true');
      
      // Clone letter
      const letterClone = document.createElement('span');
      letterClone.className = `${classNames.letter} ${classNames.clone}`;
      letterClone.textContent = displayChar;
      letterClone.setAttribute('aria-hidden', 'true');
      
      letterContainer.appendChild(letterOriginal);
      letterContainer.appendChild(letterClone);
      wrapper.appendChild(letterContainer);
    });

    element.appendChild(wrapper);
  }

  /**
   * Add event listeners to element
   * @private
   */
  _addEventListeners(element) {
    element.addEventListener('mouseenter', () => this._animateIn(element));
    element.addEventListener('mouseleave', () => this._animateOut(element));
  }

  /**
   * Animate letters in on hover
   * @private
   */
  _animateIn(element) {
    const { classNames, stagger, onHoverStart, onLetterHoverStart } = this.options;
    const letterContainers = element.querySelectorAll(`.${classNames.container}`);
    
    // Call hover start callback
    if (typeof onHoverStart === 'function') {
      onHoverStart(element);
    }
    
    letterContainers.forEach((container, index) => {
      const timeoutId = setTimeout(() => {
        container.classList.add(classNames.hovered);
        
        // Call letter hover start callback
        if (typeof onLetterHoverStart === 'function') {
          onLetterHoverStart(container, index);
        }
      }, index * stagger);
      
      // Store timeout ID for cleanup
      container.setAttribute('data-th-timeout', timeoutId);
    });
  }

  /**
   * Animate letters out when hover ends
   * @private
   */
  _animateOut(element) {
    const { classNames, stagger, onHoverEnd, onLetterHoverEnd } = this.options;
    const letterContainers = element.querySelectorAll(`.${classNames.container}`);
    
    letterContainers.forEach((container, index) => {
      // Clear any pending timeouts
      const timeoutId = container.getAttribute('data-th-timeout');
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
      }
      
      const reverseTimeoutId = setTimeout(() => {
        container.classList.remove(classNames.hovered);
        
        // Call letter hover end callback
        if (typeof onLetterHoverEnd === 'function') {
          onLetterHoverEnd(container, index);
        }
      }, index * stagger);
      
      container.setAttribute('data-th-timeout', reverseTimeoutId);
    });
    
    // Call hover end callback
    if (typeof onHoverEnd === 'function') {
      onHoverEnd(element);
    }
  }

  /**
   * Destroy the animation and restore original text
   * @public
   */
  destroy() {
    this.elements.forEach(element => {
      // Clear timeouts
      const letterContainers = element.querySelectorAll(`.${this.options.classNames.container}`);
      letterContainers.forEach(container => {
        const timeoutId = container.getAttribute('data-th-timeout');
        if (timeoutId) {
          clearTimeout(parseInt(timeoutId));
        }
      });
      
      // Restore original text
      const originalText = element.getAttribute('data-th-original-text');
      if (originalText) {
        element.textContent = originalText;
        element.removeAttribute('data-th-original-text');
      }
      
      // Remove inline styles
      element.style.position = '';
      element.style.display = '';
    });
    
    // Remove injected styles
    const styleEl = document.getElementById(`th-animation-styles-${this.animationId}`);
    if (styleEl) {
      styleEl.remove();
    }
  }

  /**
   * Update configuration options
   * @param {Object} newOptions - New options to merge
   * @public
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.destroy();
    this._injectStyles();
    this._init();
  }
}

// Export as default for convenience
export default TextHoverAnimation;
