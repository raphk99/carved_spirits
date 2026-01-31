import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Base URL for assets (works with GitHub Pages and local dev)
const BASE_URL = import.meta?.env?.BASE_URL
  ? new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  : new URL('./', document.baseURI).toString();

/**
 * GLB Models Configuration
 * Add new models here by copying the structure below
 * 
 * Example:
 * {
 *   filename: 'model1.glb',
 *   title: 'Model Title',
 *   subtitle: 'Brief description of the model',
 *   tags: ['tag1', 'tag2'],
 *   scale: 1.0,
 *   position: { x: 0, y: 0, z: 0 },
 *   rotation: { x: 0, y: 0, z: 0 },
 *   projectId: '1'    // Assign to specific project (1-4), or null to add alongside
 * }
 */
export const PLY_MODELS_CONFIG = [
  {
    filename: 'bawl.glb',
    title: 'Geometric Dreams',
    subtitle: 'Abstract 3D composition exploring form and space',
    tags: ['3D Design', 'Abstract'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '1'
  },
  {
    filename: 'half.glb',
    title: 'Fluid Motion',
    subtitle: 'Dynamic interaction study with organic shapes',
    tags: ['Interactive', 'Animation'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '2'
  },
  {
    filename: 'jarjar.glb',
    title: 'Minimal Essence',
    subtitle: 'Reductionist approach to 3D visualization',
    tags: ['Minimalism', 'Visual'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '3'
  },
  {
    filename: 'long.glb',
    title: 'Digital Sculpture',
    subtitle: 'Contemporary digital art meets traditional form',
    tags: ['Sculpture', 'Digital Art'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '4'
  },
  {
    filename: 'oreille.glb',
    title: 'Organic Form',
    subtitle: 'Exploring natural curves and biomorphic design',
    tags: ['Organic', 'Sculpture', 'Form'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '5'
  },
  {
    filename: 'box.glb',
    title: 'Cubic Structure',
    subtitle: 'Exploring geometric fundamentals and spatial relationships',
    tags: ['Geometry', 'Minimal', 'Architecture'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '6'
  },
  {
    filename: 'dragon.glb',
    title: 'Mythical Form',
    subtitle: 'Organic complexity and detailed surface modeling',
    tags: ['Character', 'Organic', 'Fantasy'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '7'
  },
  {
    filename: 'orange.glb',
    title: 'Citrus Study',
    subtitle: 'Photorealistic texturing and natural form capture',
    tags: ['Photorealism', 'Nature', 'Texture'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '8'
  },
  {
    filename: 'scar.glb',
    title: 'Surface Detail',
    subtitle: 'Intricate surface modeling and material exploration',
    tags: ['Detail', 'Material', 'Texture'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '9'
  },
  {
    filename: 'squarecolors.glb',
    title: 'Chromatic Grid',
    subtitle: 'Color theory application in geometric composition',
    tags: ['Color', 'Grid', 'Abstract'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '10'
  },
  {
    filename: 'squaregrey.glb',
    title: 'Monochrome Composition',
    subtitle: 'Study in grayscale and form without color distraction',
    tags: ['Monochrome', 'Minimal', 'Study'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '11'
  },
  {
    filename: 'whiteface.glb',
    title: 'Portrait Study',
    subtitle: 'Character modeling and facial feature exploration',
    tags: ['Portrait', 'Character', 'Study'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    projectId: '12'
  }
];

/**
 * GLB Model Loader
 * Handles loading and configuring GLB 3D models
 */
export class PLYModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.basePath = new URL('public/models/', BASE_URL).toString();
  }

  /**
   * Load a single GLB model
   * @param {Object} config - Model configuration object
   * @param {string} config.filename - GLB filename
   * @param {number} config.scale - Model scale
   * @param {Object} config.position - Position {x, y, z}
   * @param {Object} config.rotation - Rotation {x, y, z} in radians
   * @returns {Promise<THREE.Group>} - Promise resolving to the loaded object
   */
  loadModel(config) {
    return new Promise((resolve, reject) => {
      const path = this.basePath + config.filename;
      
      console.log(`Loading GLB model: ${config.filename}`);
      
      this.loader.load(
        path,
        (gltf) => {
          // Get the scene from the GLTF
          const object = gltf.scene;
          
          // Center the model
          const box = new THREE.Box3().setFromObject(object);
          const center = new THREE.Vector3();
          box.getCenter(center);
          object.position.sub(center);
          
          // GLB files already have materials and colors, so we just need to ensure
          // they're compatible with our lighting setup
          object.traverse((child) => {
            if (child.isMesh) {
              // Ensure the material casts and receives shadows if needed
              child.castShadow = true;
              child.receiveShadow = true;
              
              // If the material needs adjustment, you can do it here
              // For now, we keep the original materials from the GLB file
            }
          });
          
          // Apply transformations from config
          object.scale.set(config.scale, config.scale, config.scale);
          object.position.set(
            config.position.x,
            config.position.y,
            config.position.z
          );
          object.rotation.set(
            config.rotation.x,
            config.rotation.y,
            config.rotation.z
          );
          
          // Store config in userData for future reference
          object.userData.plyConfig = config;
          object.userData.isPLYModel = true;
          object.userData.title = config.title || config.filename;
          object.userData.subtitle = config.subtitle || '';
          object.userData.tags = config.tags || [];
          
          console.log(`Successfully loaded GLB model: ${config.filename}`);
          resolve(object);
        },
        (progress) => {
          // Optional: Log loading progress
          const percentComplete = (progress.loaded / progress.total) * 100;
          if (!isNaN(percentComplete)) {
            console.log(`Loading ${config.filename}: ${percentComplete.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error(`Error loading GLB model ${config.filename}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load all configured GLB models
   * @param {Array} configs - Array of model configurations (defaults to PLY_MODELS_CONFIG)
   * @returns {Promise<Array<THREE.Group>>} - Promise resolving to array of loaded models
   */
  async loadAllModels(configs = PLY_MODELS_CONFIG) {
    if (!configs || configs.length === 0) {
      console.log('No GLB models configured to load');
      return [];
    }
    
    console.log(`Loading ${configs.length} GLB model(s)...`);
    
    try {
      const models = await Promise.all(
        configs.map(config => this.loadModel(config))
      );
      
      console.log(`Successfully loaded ${models.length} GLB model(s)`);
      return models;
    } catch (error) {
      console.error('Error loading some GLB models:', error);
      // Return partial results - filter out failed loads
      const results = await Promise.allSettled(
        configs.map(config => this.loadModel(config))
      );
      
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    }
  }

  /**
   * Create a normalized bounding box for a mesh
   * Useful for scaling models to a consistent size
   * @param {THREE.Mesh} mesh - The mesh to normalize
   * @param {number} targetSize - Target size for the longest dimension
   */
  normalizeSize(mesh, targetSize = 2) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDim;
    
    mesh.scale.multiplyScalar(scale);
  }
}
