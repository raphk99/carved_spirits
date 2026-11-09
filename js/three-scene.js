import * as THREE from 'three';
import { PLYModelLoader, PLY_MODELS_CONFIG, prepareMaskMaterials } from './ply-model-loader.js';
import { MobileControls } from './mobile-controls.js';

export { prepareMaskMaterials };

/** Touch devices: phones and tablets (used to lighten rendering and resize work). */
export const IS_TOUCH_DEVICE =
  typeof window !== 'undefined' &&
  (('ontouchstart' in window) || navigator.maxTouchPoints > 0) &&
  window.matchMedia('(pointer: coarse)').matches;

/** Pixel ratio cap: full quality on desktop, lighter on phones (big GPU win). */
export function getPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, IS_TOUCH_DEVICE ? 1.5 : 2);
}

/** Tweak these to make every mask scene brighter/darker at once. */
export const STUDIO_LIGHTING = {
  exposure: 1.5,
  ambient: 4.0,
  key: 5.0,
  fill: 2.0,
  rim: 2.5,
};

/**
 * Bright, soft "studio" lighting shared by every scene that renders the masks.
 * Uses plain lights only (no PMREM environment map) so creating a card scene
 * while scrolling stays cheap on phones.
 */
export function applyStudioLighting(renderer, scene) {
  // The scanned textures are dark wood (some average ~15% brightness), so the
  // lights deliberately push well above 1.0; ACES keeps the lighter masks
  // (e.g. whiteface) from clipping while lifting the dark ones.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = STUDIO_LIGHTING.exposure;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8bba8, STUDIO_LIGHTING.ambient));

  // Key light from the front-top-right: carves out the relief of the face
  const keyLight = new THREE.DirectionalLight(0xfff1e0, STUDIO_LIGHTING.key);
  keyLight.position.set(4, 6, 10);
  scene.add(keyLight);

  // Fill from the left so the shadow side never goes black
  const fillLight = new THREE.DirectionalLight(0xffffff, STUDIO_LIGHTING.fill);
  fillLight.position.set(-8, 1, 6);
  scene.add(fillLight);

  // Rim from behind to separate the silhouette from the dark background
  const rimLight = new THREE.DirectionalLight(0xffffff, STUDIO_LIGHTING.rim);
  rimLight.position.set(0, 4, -10);
  scene.add(rimLight);
}

/**
 * Three.js Scene Manager
 */
export class SceneManager {
  constructor(canvas, projectId) {
    this.canvas = canvas;
    this.projectId = projectId;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.plyModels = []; // Array to store PLY models
    this.animationId = null;
    this.mouse = new THREE.Vector2();
    this.targetRotation = new THREE.Euler();
    this.isHovered = false;
    this.mobileControls = null; // Mobile controls instance
    this.isMobile = MobileControls.isMobile();
    
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.z = 5;
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(getPixelRatio());
    this.renderer.setClearColor(0x000000, 0);
    
    // Lighting
    applyStudioLighting(this.renderer, this.scene);
    
    // Load GLB models (geometric shapes removed - models only)
    this.loadPLYModels();
    
    // Event listeners - only add mouse listeners on desktop
    if (!this.isMobile) {
      this._onMouseMove = (event) => this.onMouseMove(event);
      this._onMouseEnter = () => this.isHovered = true;
      this._onMouseLeave = () => this.isHovered = false;
      this.canvas.addEventListener('mousemove', this._onMouseMove);
      this.canvas.addEventListener('mouseenter', this._onMouseEnter);
      this.canvas.addEventListener('mouseleave', this._onMouseLeave);
    }
    
    // Start animation
    this.animate();
  }

  // Geometric shapes removed - using GLB models only
  // Kept for reference but not used anymore
  createGeometry() {
    // No longer creating geometric shapes
    // All visuals come from GLB models
    this.mesh = null;
  }

  /**
   * Load GLB models and add them to the scene
   */
  async loadPLYModels() {
    if (PLY_MODELS_CONFIG.length === 0) {
      console.warn('No GLB models configured to load');
      return;
    }
    
    try {
      const loader = new PLYModelLoader();
      
      // Find models assigned to this project
      const assignedConfigs = PLY_MODELS_CONFIG.filter(config => 
        config.projectId === this.projectId
      );
      
      // Find models not assigned to any project (should appear alongside project 1)
      const unassignedConfigs = PLY_MODELS_CONFIG.filter(config => 
        !config.projectId
      );
      
      // Load assigned models
      if (assignedConfigs.length > 0) {
        const assignedModels = await Promise.all(
          assignedConfigs.map(config => loader.loadModel(config))
        );
        
        assignedModels.forEach(model => {
          this.plyModels.push(model);
          this.scene.add(model);
          console.log(`Added model: ${model.userData.title}`);
        });
      }
      
      // Load unassigned models (only for project 1)
      if (unassignedConfigs.length > 0 && this.projectId === '1') {
        const unassignedModels = await Promise.all(
          unassignedConfigs.map(config => loader.loadModel(config))
        );
        
        unassignedModels.forEach(model => {
          this.plyModels.push(model);
          this.scene.add(model);
          console.log(`Added unassigned model: ${model.userData.title}`);
        });
      }
      
      // Initialize mobile controls if on mobile device
      if (this.isMobile && this.plyModels.length > 0) {
        this.mobileControls = new MobileControls(this.canvas, this.camera, this.plyModels, {
          showToggle: false, // No toggle for project cards
          initialMode: 'touch',
          allowPageScroll: true // vertical swipes on a card scroll the page
        });
      }
    } catch (error) {
      console.error('Error loading GLB models in SceneManager:', error);
    }
  }

  onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    // Update mobile controls if on mobile
    if (this.isMobile && this.mobileControls) {
      this.mobileControls.update();
    } else {
      // Desktop: Animate GLB models - ONLY with mouse interaction, no auto-rotation
      this.plyModels.forEach(model => {
        // Interactive rotation based on mouse ONLY
        if (this.isHovered) {
          // Get the model's initial rotation from config
          const initialRotation = model.userData.plyConfig?.rotation || { x: 0, y: 0, z: 0 };
          
          this.targetRotation.y = initialRotation.y + this.mouse.x * 0.5;
          this.targetRotation.x = initialRotation.x + this.mouse.y * 0.5;
          
          model.rotation.y += (this.targetRotation.y - model.rotation.y) * 0.05;
          model.rotation.x += (this.targetRotation.x - model.rotation.x) * 0.05;
        }
      });
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(getPixelRatio());
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Dispose mobile controls
    if (this.mobileControls) {
      this.mobileControls.dispose();
      this.mobileControls = null;
    }
    
    // Dispose GLB models
    this.plyModels.forEach(model => {
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(model);
    });
    this.plyModels = [];
    
    if (this.renderer) {
      this.renderer.forceContextLoss();
      this.renderer.dispose();
    }
    
    if (!this.isMobile) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mouseenter', this._onMouseEnter);
      this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    }
  }
}

/**
 * Modal Scene Manager for expanded view
 */
export class ModalSceneManager extends SceneManager {
  constructor(canvas, projectId, options = {}) {
    super(canvas, projectId);
    this.isExpanded = true;
  }

  /**
   * Load GLB models for modal view
   * Override to adjust positioning for modal
   */
  async loadPLYModels() {
    if (PLY_MODELS_CONFIG.length === 0) {
      console.warn('No GLB models configured to load');
      return;
    }
    
    try {
      const loader = new PLYModelLoader();
      
      // Find models assigned to this project
      const assignedConfigs = PLY_MODELS_CONFIG.filter(config => 
        config.projectId === this.projectId
      );
      
      // Find models not assigned to any project (should appear alongside project 1)
      const unassignedConfigs = PLY_MODELS_CONFIG.filter(config => 
        !config.projectId
      );
      
      // Load assigned models
      if (assignedConfigs.length > 0) {
        const assignedModels = await Promise.all(
          assignedConfigs.map(config => loader.loadModel(config))
        );
        
        assignedModels.forEach(model => {
          // Scale up slightly for modal view
          model.scale.multiplyScalar(1.3);
          
          this.plyModels.push(model);
          this.scene.add(model);
          console.log(`Added modal model: ${model.userData.title}`);
        });
      }
      
      // Load unassigned models (only for project 1)
      if (unassignedConfigs.length > 0 && this.projectId === '1') {
        const unassignedModels = await Promise.all(
          unassignedConfigs.map(config => loader.loadModel(config))
        );
        
        unassignedModels.forEach(model => {
          // Scale for modal view
          model.scale.multiplyScalar(1.3);
          // Slightly more offset for modal
          model.position.x += 1;
          
          this.plyModels.push(model);
          this.scene.add(model);
          console.log(`Added unassigned modal model: ${model.userData.title}`);
        });
      }
      
      // Initialize mobile controls for modal if on mobile device
      if (this.isMobile && this.plyModels.length > 0) {
        this.mobileControls = new MobileControls(this.canvas, this.camera, this.plyModels, {
          showToggle: false, // No toggle for now
          initialMode: 'touch'
        });
      }
    } catch (error) {
      console.error('Error loading GLB models in ModalSceneManager:', error);
    }
  }

  // Geometric shapes removed - using GLB models only
  createGeometry() {
    // No longer creating geometric shapes for modal
    // All visuals come from GLB models
    this.mesh = null;
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    // Update mobile controls if on mobile
    if (this.isMobile && this.mobileControls) {
      this.mobileControls.update();
    } else {
      // Desktop: Animate GLB models - with mouse interaction and smoother interpolation for modal
      this.plyModels.forEach(model => {
        // Interactive rotation with smoother interpolation for modal
        const initialRotation = model.userData.plyConfig?.rotation || { x: 0, y: 0, z: 0 };
        
        this.targetRotation.y = initialRotation.y + this.mouse.x * 0.8;
        this.targetRotation.x = initialRotation.x + this.mouse.y * 0.8;
        
        model.rotation.y += (this.targetRotation.y - model.rotation.y) * 0.03;
        model.rotation.x += (this.targetRotation.x - model.rotation.x) * 0.03;
      });
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}
