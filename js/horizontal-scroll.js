import * as THREE from 'three';
import { PLYModelLoader, PLY_MODELS_CONFIG } from './ply-model-loader.js';

/**
 * Horizontal Scroll Scene Manager
 * Creates multiple 3D shapes that appear from right to left as user scrolls horizontally
 */
export class HorizontalScrollScene {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('.horizontal-canvas');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.shapes = []; // Array to store GLB models
    this.animationId = null;
    this.currentShapeIndex = 0;
    this.scrollProgress = 0;
    
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-5, -5, -5);
    this.scene.add(backLight);
    
    // Load GLB models (geometric shapes removed - models only)
    this.loadPLYModels();
    
    // Start animation
    this.animate();
  }

  // Geometric shapes removed - using GLB models only
  createShapes() {
    // No longer creating geometric shapes
    // All visuals come from GLB models loaded in loadPLYModels()
  }

  /**
   * Load GLB models and add them to the horizontal scroll animation
   */
  async loadPLYModels() {
    if (PLY_MODELS_CONFIG.length === 0) {
      console.warn('No GLB models configured to load');
      return;
    }
    
    try {
      const loader = new PLYModelLoader();
      
      // Load all models in order of their projectId
      // First, separate models with projectId from those without
      const modelsWithProjects = PLY_MODELS_CONFIG.filter(config => config.projectId);
      const modelsWithoutProjects = PLY_MODELS_CONFIG.filter(config => !config.projectId);
      
      // Sort models with projects by their projectId
      modelsWithProjects.sort((a, b) => parseInt(a.projectId) - parseInt(b.projectId));
      
      // Combine: assigned models first, then unassigned
      const allModelsInOrder = [...modelsWithProjects, ...modelsWithoutProjects];
      
      // Load all models in order
      for (const config of allModelsInOrder) {
        const model = await loader.loadModel(config);
        
        // Set up for horizontal scroll animation
        model.position.set(10, 0, 0); // Start off to the right
        model.scale.set(0, 0, 0); // Start invisible
        model.userData.targetPosition = { x: 0, y: 0, z: 0 };
        model.userData.index = this.shapes.length;
        model.userData.visible = false;
        model.userData.isGLBModel = true;
        
        this.shapes.push(model);
        this.scene.add(model);
        
        console.log(`Added horizontal scroll model ${this.shapes.length}: ${model.userData.title}`);
      }
      
      console.log(`Configured ${this.shapes.length} GLB model(s) in horizontal scroll`);
    } catch (error) {
      console.error('Error loading GLB models in HorizontalScrollScene:', error);
    }
  }

  updateShapes(progress) {
    // Progress goes from 0 to 1 across the entire horizontal section
    const numShapes = this.shapes.length;
    const progressPerShape = 1 / numShapes;
    
    this.shapes.forEach((shape, index) => {
      const shapeStartProgress = index * progressPerShape;
      const shapeEndProgress = (index + 1) * progressPerShape;
      
      // Calculate individual shape progress
      let shapeProgress = (progress - shapeStartProgress) / progressPerShape;
      shapeProgress = Math.max(0, Math.min(1, shapeProgress));
      
      // Ease function for smooth animation
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      const easedProgress = easeOutQuart(shapeProgress);
      
      // Animate position from right (10) to center (0)
      const startX = 10;
      const targetPos = shape.userData.targetPosition;
      const endX = typeof targetPos === 'object' ? targetPos.x : targetPos.x || 0;
      shape.position.x = startX + (endX - startX) * easedProgress;
      
      // Animate scale from 0 to 1
      const scale = easedProgress;
      shape.scale.set(scale, scale, scale);
      
      // Mark as visible if progress is enough
      if (shapeProgress > 0.01) {
        shape.userData.visible = true;
      }
      
      // If shape is past its animation, fade it out and move it off screen
      if (progress > shapeEndProgress) {
        const exitProgress = (progress - shapeEndProgress) / (progressPerShape * 0.5);
        const exitEased = Math.min(1, exitProgress);
        
        // Move far to the left
        shape.position.x = endX - exitEased * 15;
        
        // Fade out - handle GLB models with multiple materials
        const opacity = 1 - exitEased;
        shape.traverse((child) => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.opacity = opacity;
                mat.transparent = true;
              });
            } else {
              child.material.opacity = opacity;
              child.material.transparent = true;
            }
          }
        });
        
        // Scale down as it exits
        const exitScale = 1 - exitEased * 0.5;
        shape.scale.set(exitScale, exitScale, exitScale);
      } else {
        // Normal display - fully opaque when in view
        shape.traverse((child) => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.opacity = easedProgress;
                mat.transparent = easedProgress < 1;
              });
            } else {
              child.material.opacity = easedProgress;
              child.material.transparent = easedProgress < 1;
            }
          }
        });
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    // GLB models stay in their configured rotation (no auto-rotation)
    // All rotation is handled by scroll-driven animation in updateShapes()
    
    this.renderer.render(this.scene, this.camera);
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
    this.updateShapes(progress);
  }

  handleResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Dispose GLB models
    this.shapes.forEach(shape => {
      shape.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(shape);
    });
    this.shapes = [];
    
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
