import { initLenis, initScrollAnimations, initParallax, initHeroScrollAnimation, initHorizontalScrollAnimation } from './lenis.js';
import { SceneManager, ModalSceneManager } from './three-scene.js';
import { HeroTextScene } from './hero-text.js';
import { HorizontalScrollScene } from './horizontal-scroll.js';
import { TextHoverAnimation } from './text-hover-animation.js';

/**
 * Project Manager - Handles all project interactions
 */
class ProjectManager {
  constructor() {
    this.scenes = new Map();
    this.modalScene = null;
    this.currentProject = null;
    this.modal = document.getElementById('project-modal');
    this.modalCanvas = document.getElementById('modal-canvas');
    this.modalClose = document.querySelector('.modal-close');
    
    this.init();
  }

  init() {
    // Initialize 3D scenes for each project card
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      const projectId = card.dataset.project;
      const canvas = card.querySelector('.project-canvas');
      
      if (canvas) {
        const scene = new SceneManager(canvas, projectId);
        this.scenes.set(projectId, scene);
      }
      
      // Add click handlers
      const expandBtn = card.querySelector('.project-expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openModal(projectId, card);
        });
      }
      
      card.addEventListener('click', () => {
        this.openModal(projectId, card);
      });
    });
    
    // Modal close handler
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => {
        this.closeModal();
      });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  openModal(projectId, card) {
    this.currentProject = projectId;
    
    // Get project data from card
    const title = card.querySelector('.project-title').textContent;
    const description = card.querySelector('.project-description').textContent;
    const number = card.querySelector('.project-number').textContent;
    const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
    
    // Update modal content
    document.querySelector('.modal-number').textContent = number;
    document.querySelector('.modal-title').textContent = title;
    document.querySelector('.modal-description').textContent = description;
    
    const modalTagsContainer = document.querySelector('.modal-tags');
    modalTagsContainer.innerHTML = tags.map(tag => 
      `<span class="tag">${tag}</span>`
    ).join('');
    
    // Create 3D scene for modal
    if (this.modalScene) {
      this.modalScene.dispose();
    }
    this.modalScene = new ModalSceneManager(this.modalCanvas, projectId);
    
    // Show modal
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Resize modal scene
    setTimeout(() => {
      if (this.modalScene) {
        this.modalScene.handleResize();
      }
    }, 100);
  }

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Dispose modal scene
    if (this.modalScene) {
      this.modalScene.dispose();
      this.modalScene = null;
    }
    
    this.currentProject = null;
  }

  handleResize() {
    // Resize all project scenes
    this.scenes.forEach(scene => {
      scene.handleResize();
    });
    
    // Resize modal scene if open
    if (this.modalScene) {
      this.modalScene.handleResize();
    }
  }
}

/**
 * Initialize the application
 */
function init() {
  // Initialize nav link hover animation with smoother, slower settings
  new TextHoverAnimation('.nav-link', {
    duration: 700,        // Slower transition (700ms)
    stagger: 40,          // Smoother stagger between letters (40ms)
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',  // Smooth ease-in-out
    direction: 'up'
  });
  
  // Initialize Lenis smooth scrolling
  const lenis = initLenis();
  
  // Initialize scroll animations
  initScrollAnimations();
  
  // Initialize Hero 3D Text Scene
  const heroCanvas = document.getElementById('hero-canvas');
  let heroTextScene = null;
  
  if (heroCanvas) {
    heroTextScene = new HeroTextScene(heroCanvas);
  }
  
  // Initialize hero scroll animation (zoom towards user effect)
  initHeroScrollAnimation(lenis, heroTextScene);
  
  // Initialize horizontal scroll section
  const horizontalScrollContainer = document.querySelector('.horizontal-scroll-container');
  let horizontalScene = null;
  
  if (horizontalScrollContainer) {
    horizontalScene = new HorizontalScrollScene(horizontalScrollContainer);
    initHorizontalScrollAnimation(lenis, horizontalScene);
    
    // Handle resize for horizontal scene
    window.addEventListener('resize', () => {
      if (horizontalScene) {
        horizontalScene.handleResize();
      }
    });
  }
  
  // Initialize parallax effects (disabled for hero since we have custom scroll animation)
  // initParallax(lenis);
  
  // Initialize project manager (handles 3D scenes and interactions)
  const projectManager = new ProjectManager();
  
  // Initialize About section
  initAboutSection(heroTextScene);
  
  // Add loading class removal
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
  
  console.log('Portfolio initialized');
}

/**
 * Initialize About Section
 */
function initAboutSection(heroTextScene) {
  const aboutSection = document.getElementById('about');
  const aboutLink = document.getElementById('about-link');
  const aboutClose = document.querySelector('.about-close');
  const aboutCanvas = document.getElementById('about-canvas');
  let aboutTreeScene = null;
  
  // Open about section
  function openAbout() {
    aboutSection.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Initialize tree scene for about section
    if (!aboutTreeScene && aboutCanvas) {
      aboutTreeScene = new HeroTextScene(aboutCanvas);
      
      // Override handleResize for about section to use full viewport
      aboutTreeScene.handleResize = function() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };
      
      // Adjust camera and renderer for about section (full viewport)
      setTimeout(() => {
        if (aboutTreeScene) {
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          // Fix camera aspect ratio for full viewport
          aboutTreeScene.camera.aspect = width / height;
          aboutTreeScene.camera.updateProjectionMatrix();
          
          // Adjust camera position to show tree fully visible
          aboutTreeScene.camera.position.set(0, 0, 20);
          
          // Fix renderer size for full viewport
          aboutTreeScene.renderer.setSize(width, height);
          aboutTreeScene.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }, 100);
    }
  }
  
  // Close about section
  function closeAbout() {
    aboutSection.classList.remove('active');
    document.body.style.overflow = '';
    
    // Dispose tree scene
    if (aboutTreeScene) {
      aboutTreeScene.dispose();
      aboutTreeScene = null;
    }
  }
  
  // Event listeners
  if (aboutLink) {
    aboutLink.addEventListener('click', (e) => {
      e.preventDefault();
      openAbout();
    });
  }
  
  if (aboutClose) {
    aboutClose.addEventListener('click', () => {
      closeAbout();
    });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutSection.classList.contains('active')) {
      closeAbout();
    }
  });
  
  // Close when clicking outside content
  if (aboutSection) {
    aboutSection.addEventListener('click', (e) => {
      if (e.target === aboutSection) {
        closeAbout();
      }
    });
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
