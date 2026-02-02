import * as THREE from 'three';

/**
 * Mobile Controls for 3D Models
 * Provides touch and gyroscope-based interaction
 */

/**
 * Touch Controls Class
 * Handles single-finger drag rotation and two-finger pinch zoom
 */
class TouchControls {
  constructor(canvas, camera, models) {
    this.canvas = canvas;
    this.camera = camera;
    this.models = models;
    
    // Touch state
    this.touchState = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      lastX: 0,
      lastY: 0,
      deltaX: 0,
      deltaY: 0,
      velocity: { x: 0, y: 0 },
      isPinching: false,
      initialDistance: 0,
      initialCameraZ: 0
    };
    
    // Rotation state
    this.targetRotation = new THREE.Euler();
    this.currentRotation = new THREE.Euler();
    
    // Inertia/momentum
    this.inertiaDecay = 0.92;
    
    // Bind methods
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    
    // Enable touch controls
    this.enable();
  }
  
  enable() {
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }
  
  disable() {
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
    
    // Reset state
    this.touchState.active = false;
    this.touchState.isPinching = false;
    this.touchState.velocity = { x: 0, y: 0 };
  }
  
  onTouchStart(event) {
    event.preventDefault();
    
    const touches = event.touches;
    
    if (touches.length === 1) {
      // Single touch - rotation
      this.touchState.active = true;
      this.touchState.isPinching = false;
      this.touchState.startX = touches[0].clientX;
      this.touchState.startY = touches[0].clientY;
      this.touchState.lastX = touches[0].clientX;
      this.touchState.lastY = touches[0].clientY;
      this.touchState.velocity = { x: 0, y: 0 };
      
      // Store initial rotation for each model
      this.models.forEach(model => {
        if (!model.userData.initialRotation) {
          model.userData.initialRotation = {
            x: model.rotation.x,
            y: model.rotation.y,
            z: model.rotation.z
          };
        }
      });
    } else if (touches.length === 2) {
      // Two touches - pinch zoom
      this.touchState.isPinching = true;
      this.touchState.active = false;
      
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      this.touchState.initialDistance = Math.sqrt(dx * dx + dy * dy);
      this.touchState.initialCameraZ = this.camera.position.z;
    }
  }
  
  onTouchMove(event) {
    event.preventDefault();
    
    const touches = event.touches;
    
    if (this.touchState.active && touches.length === 1) {
      // Single touch - calculate delta for rotation
      const touch = touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      this.touchState.currentX = touch.clientX;
      this.touchState.currentY = touch.clientY;
      
      // Calculate delta from last position
      const deltaX = touch.clientX - this.touchState.lastX;
      const deltaY = touch.clientY - this.touchState.lastY;
      
      // Update velocity for inertia
      this.touchState.velocity.x = deltaX;
      this.touchState.velocity.y = deltaY;
      
      // Calculate normalized delta based on canvas size
      this.touchState.deltaX = (deltaX / rect.width) * Math.PI * 2;
      this.touchState.deltaY = (deltaY / rect.height) * Math.PI * 2;
      
      // Update last position
      this.touchState.lastX = touch.clientX;
      this.touchState.lastY = touch.clientY;
      
    } else if (this.touchState.isPinching && touches.length === 2) {
      // Two touches - calculate pinch distance for zoom
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate scale factor
      const scale = this.touchState.initialDistance / currentDistance;
      
      // Update camera position (zoom)
      const newZ = this.touchState.initialCameraZ * scale;
      this.camera.position.z = THREE.MathUtils.clamp(newZ, 2, 10);
    }
  }
  
  onTouchEnd(event) {
    event.preventDefault();
    
    if (event.touches.length === 0) {
      this.touchState.active = false;
      this.touchState.isPinching = false;
    } else if (event.touches.length === 1) {
      // Switched from two-finger to one-finger
      this.touchState.isPinching = false;
      this.touchState.active = true;
      this.touchState.lastX = event.touches[0].clientX;
      this.touchState.lastY = event.touches[0].clientY;
    }
  }
  
  update() {
    if (!this.models || this.models.length === 0) return;
    
    // Apply rotation based on touch delta
    if (this.touchState.active) {
      this.models.forEach(model => {
        // Get initial rotation from config or stored value
        const initialRotation = model.userData.plyConfig?.rotation || { x: 0, y: 0, z: 0 };
        const storedRotation = model.userData.initialRotation || initialRotation;
        
        // Apply delta to rotation
        model.rotation.y += this.touchState.deltaX;
        model.rotation.x += this.touchState.deltaY;
        
        // Reset delta after applying
        this.touchState.deltaX *= 0.8;
        this.touchState.deltaY *= 0.8;
      });
    } else if (!this.touchState.isPinching) {
      // Apply inertia/momentum when not actively touching
      if (Math.abs(this.touchState.velocity.x) > 0.1 || Math.abs(this.touchState.velocity.y) > 0.1) {
        this.models.forEach(model => {
          const rect = this.canvas.getBoundingClientRect();
          const deltaX = (this.touchState.velocity.x / rect.width) * Math.PI * 2;
          const deltaY = (this.touchState.velocity.y / rect.height) * Math.PI * 2;
          
          model.rotation.y += deltaX * 0.5;
          model.rotation.x += deltaY * 0.5;
        });
        
        // Apply decay to velocity
        this.touchState.velocity.x *= this.inertiaDecay;
        this.touchState.velocity.y *= this.inertiaDecay;
      }
    }
  }
  
  dispose() {
    this.disable();
  }
}

/**
 * Gyroscope Controls Class
 * Handles device orientation for model rotation
 */
class GyroControls {
  constructor(canvas, camera, models) {
    this.canvas = canvas;
    this.camera = camera;
    this.models = models;
    
    // Gyroscope state
    this.gyroState = {
      active: false,
      alpha: 0,
      beta: 0,
      gamma: 0,
      baselineAlpha: 0,
      baselineBeta: 0,
      baselineGamma: 0,
      calibrated: false
    };
    
    // Smoothing
    this.smoothingFactor = 0.1;
    this.targetRotation = new THREE.Euler();
    
    // Bind methods
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
  }
  
  async enable() {
    // Check if DeviceOrientationEvent is supported
    if (!window.DeviceOrientationEvent) {
      console.warn('DeviceOrientation not supported');
      return false;
    }
    
    // Check if permission is needed (iOS 13+)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          console.warn('DeviceOrientation permission denied');
          return false;
        }
      } catch (error) {
        console.error('Error requesting DeviceOrientation permission:', error);
        return false;
      }
    }
    
    // Add orientation listener
    window.addEventListener('deviceorientation', this.onDeviceOrientation);
    this.gyroState.active = true;
    
    // Store initial rotations
    this.models.forEach(model => {
      if (!model.userData.initialRotation) {
        model.userData.initialRotation = {
          x: model.rotation.x,
          y: model.rotation.y,
          z: model.rotation.z
        };
      }
    });
    
    return true;
  }
  
  disable() {
    window.removeEventListener('deviceorientation', this.onDeviceOrientation);
    this.gyroState.active = false;
    this.gyroState.calibrated = false;
  }
  
  calibrate() {
    // Set current orientation as baseline
    this.gyroState.baselineAlpha = this.gyroState.alpha;
    this.gyroState.baselineBeta = this.gyroState.beta;
    this.gyroState.baselineGamma = this.gyroState.gamma;
    this.gyroState.calibrated = true;
  }
  
  onDeviceOrientation(event) {
    if (!this.gyroState.active) return;
    
    // Get orientation values (in degrees)
    const alpha = event.alpha || 0; // Z-axis (0-360)
    const beta = event.beta || 0;   // X-axis (-180 to 180)
    const gamma = event.gamma || 0; // Y-axis (-90 to 90)
    
    // Store raw values
    this.gyroState.alpha = alpha;
    this.gyroState.beta = beta;
    this.gyroState.gamma = gamma;
    
    // Auto-calibrate on first reading
    if (!this.gyroState.calibrated) {
      this.calibrate();
    }
  }
  
  update() {
    if (!this.gyroState.active || !this.gyroState.calibrated || !this.models || this.models.length === 0) {
      return;
    }
    
    // Calculate relative orientation from baseline
    let deltaAlpha = this.gyroState.alpha - this.gyroState.baselineAlpha;
    let deltaBeta = this.gyroState.beta - this.gyroState.baselineBeta;
    let deltaGamma = this.gyroState.gamma - this.gyroState.baselineGamma;
    
    // Normalize alpha to -180 to 180
    if (deltaAlpha > 180) deltaAlpha -= 360;
    if (deltaAlpha < -180) deltaAlpha += 360;
    
    // Convert to radians and apply to models
    this.models.forEach(model => {
      const initialRotation = model.userData.plyConfig?.rotation || { x: 0, y: 0, z: 0 };
      
      // Map device orientation to model rotation
      // Gamma (left/right tilt) -> Y rotation
      // Beta (forward/back tilt) -> X rotation
      const targetY = initialRotation.y + (deltaGamma * Math.PI / 180) * 2;
      const targetX = initialRotation.x + (deltaBeta * Math.PI / 180) * 0.5;
      
      // Smooth interpolation
      model.rotation.y += (targetY - model.rotation.y) * this.smoothingFactor;
      model.rotation.x += (targetX - model.rotation.x) * this.smoothingFactor;
    });
  }
  
  dispose() {
    this.disable();
  }
}

/**
 * Mobile Controls Manager
 * Manages touch and gyroscope controls with mode switching
 */
export class MobileControls {
  constructor(canvas, camera, models, options = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.models = models;
    
    // Options
    this.showToggle = options.showToggle !== false; // Default true
    this.initialMode = options.initialMode || 'touch';
    
    // Current mode
    this.mode = this.initialMode;
    
    // Control instances
    this.touchControls = new TouchControls(canvas, camera, models);
    this.gyroControls = new GyroControls(canvas, camera, models);
    
    // Initially disable gyro
    this.gyroControls.disable();
    
    // Callbacks
    this.onModeChange = options.onModeChange || null;
  }
  
  async switchMode(mode) {
    if (mode === this.mode) return;
    
    if (mode === 'touch') {
      // Switch to touch
      this.gyroControls.disable();
      this.touchControls.enable();
      this.mode = 'touch';
      
      if (this.onModeChange) {
        this.onModeChange('touch');
      }
      
      return true;
    } else if (mode === 'gyroscope') {
      // Switch to gyroscope
      const success = await this.gyroControls.enable();
      
      if (success) {
        this.touchControls.disable();
        this.mode = 'gyroscope';
        
        if (this.onModeChange) {
          this.onModeChange('gyroscope');
        }
        
        return true;
      } else {
        // Failed to enable gyroscope, stay in touch mode
        console.warn('Failed to enable gyroscope, staying in touch mode');
        return false;
      }
    }
    
    return false;
  }
  
  recalibrate() {
    if (this.mode === 'gyroscope') {
      this.gyroControls.calibrate();
    }
  }
  
  update() {
    if (this.mode === 'touch') {
      this.touchControls.update();
    } else if (this.mode === 'gyroscope') {
      this.gyroControls.update();
    }
  }
  
  dispose() {
    this.touchControls.dispose();
    this.gyroControls.dispose();
  }
  
  // Utility method to check if device supports gyroscope
  static isGyroscopeSupported() {
    return 'DeviceOrientationEvent' in window;
  }
  
  // Utility method to detect mobile device
  static isMobile() {
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0) 
      && window.innerWidth <= 1024;
  }
}
