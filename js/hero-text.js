import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Base URL for assets (works with GitHub Pages)
const BASE_URL = import.meta?.env?.BASE_URL || 
  (window.location.pathname.includes('/carved_spirits/') ? '/carved_spirits/' : '/');

/**
 * Hero Tree Scene Manager
 * Displays tree.glb model spanning across hero section and beyond
 */
export class HeroTextScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.treeModel = null;
    this.animationId = null;
    this.mouse = new THREE.Vector2();
    this.targetRotation = { x: 0, y: 0 };
    this.currentRotation = { x: 0, y: 0 };
    this.scrollProgress = 0;
    this.isLoaded = false;

    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    const aspect = window.innerWidth / (window.innerHeight * 1.5);
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 15);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight * 1.5);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Lighting for the tree
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 10, 5);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -10, 5);
    this.scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 0, 10);
    this.scene.add(pointLight);

    // Load tree model
    this.loadTreeModel();

    // Event listeners
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));

    // Start animation
    this.animate();
  }

  loadTreeModel() {
    const loader = new GLTFLoader();
    
    loader.load(
      BASE_URL + 'models/tree.glb',
      (gltf) => {
        this.treeModel = gltf.scene;
        
        // Calculate bounding box to center the model
        const box = new THREE.Box3().setFromObject(this.treeModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Center the model
        this.treeModel.position.x = -center.x;
        this.treeModel.position.y = -center.y;
        this.treeModel.position.z = -center.z;
        
        // Scale the model to fit nicely in the scene
        // Make it tall enough to span across hero and beyond
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 20 / maxDim;
        this.treeModel.scale.set(scale, scale, scale);
        
        // Ensure materials are properly set
        this.treeModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance materials if needed
            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });
        
        this.scene.add(this.treeModel);
        this.isLoaded = true;
        console.log('Tree model loaded successfully');
      },
      (progress) => {
        console.log('Loading tree model:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading tree model:', error);
      }
    );
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Update scroll progress (0 = top, 1 = scrolled past hero)
   */
  setScrollProgress(progress) {
    this.scrollProgress = Math.min(1, Math.max(0, progress));
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    if (this.treeModel) {
      // Subtle interactive rotation based on mouse
      this.targetRotation.y = this.mouse.x * 0.1;
      this.targetRotation.x = this.mouse.y * 0.05;

      // Smooth interpolation
      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

      this.treeModel.rotation.y = this.currentRotation.y;
      this.treeModel.rotation.x = this.currentRotation.x;

      // Scroll-based animation - tree slowly rotates and moves
      // Add a gentle continuous rotation
      this.treeModel.rotation.y += 0.001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight * 1.5;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.treeModel) {
      this.treeModel.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this.treeModel);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.handleResize);
  }
}
