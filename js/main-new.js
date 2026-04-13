// Import dependencies
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import Lenis from '@studio-freight/lenis';
    import { SceneManager, ModalSceneManager } from './three-scene.js';
    import { generateProjectsGrid, generateTagHtml } from './project-generator.js';

    import { PLYModelLoader, PLY_MODELS_CONFIG, MODEL_BASE_PATHS } from './ply-model-loader.js';

    // ===== Text Hover Animation =====
    class TextHoverAnimation {
      static defaults = {
        duration: 600,
        stagger: 35,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        direction: 'up',
        preserveSpaces: true,
        noReplacement: false,
        disableHover: false,
        classNames: {
          wrapper: 'th-letters-wrapper',
          container: 'th-letter-container',
          letter: 'th-letter',
          original: 'th-letter-original',
          clone: 'th-letter-clone',
          hovered: 'th-hovered'
        },
        onHoverStart: null,
        onHoverEnd: null,
        onLetterHoverStart: null,
        onLetterHoverEnd: null
      };

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

      _injectStyles() {
        const styleId = `th-animation-styles-${this.animationId}`;

        if (document.getElementById(styleId)) return;

        const { duration, easing, direction, classNames, noReplacement } = this.options;
        const transforms = this._getTransforms(direction);

        const css = `
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
            ${noReplacement ? 'opacity: 0;' : ''}
          }
          
          .${classNames.container}.${classNames.hovered} .${classNames.original} {
            transform: ${transforms.originalHovered};
          }
          
          .${classNames.container}.${classNames.hovered} .${classNames.clone} {
            transform: ${noReplacement ? transforms.cloneDefault : transforms.cloneHovered};
            ${noReplacement ? 'opacity: 0;' : ''}
          }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
      }

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

      _init() {
        this.elements.forEach(element => {
          this._splitText(element);
          this._addEventListeners(element);
        });
      }

      _splitText(element) {
        const text = element.textContent;
        const { classNames, preserveSpaces } = this.options;

        element.setAttribute('data-th-original-text', text);
        element.innerHTML = '';
        element.style.position = 'relative';
        element.style.display = 'inline-block';

        const wrapper = document.createElement('span');
        wrapper.className = classNames.wrapper;

        text.split('').forEach((char, index) => {
          const letterContainer = document.createElement('span');
          letterContainer.className = classNames.container;
          letterContainer.setAttribute('data-th-index', index);

          const displayChar = (char === ' ' && preserveSpaces) ? '\u00A0' : char;

          const letterOriginal = document.createElement('span');
          letterOriginal.className = `${classNames.letter} ${classNames.original}`;
          letterOriginal.textContent = displayChar;
          letterOriginal.setAttribute('aria-hidden', 'true');

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

      _addEventListeners(element) {
        if (!this.options.disableHover) {
          element.addEventListener('mouseenter', () => this._animateIn(element));
          element.addEventListener('mouseleave', () => this._animateOut(element));
        }
      }

      _animateIn(element) {
        const { classNames, stagger, onHoverStart, onLetterHoverStart } = this.options;
        const letterContainers = element.querySelectorAll(`.${classNames.container}`);

        if (typeof onHoverStart === 'function') {
          onHoverStart(element);
        }

        letterContainers.forEach((container, index) => {
          const timeoutId = setTimeout(() => {
            container.classList.add(classNames.hovered);

            if (typeof onLetterHoverStart === 'function') {
              onLetterHoverStart(container, index);
            }
          }, index * stagger);

          container.setAttribute('data-th-timeout', timeoutId);
        });
      }

      _animateOut(element) {
        const { classNames, stagger, onHoverEnd, onLetterHoverEnd } = this.options;
        const letterContainers = element.querySelectorAll(`.${classNames.container}`);

        letterContainers.forEach((container, index) => {
          const timeoutId = container.getAttribute('data-th-timeout');
          if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
          }

          const reverseTimeoutId = setTimeout(() => {
            container.classList.remove(classNames.hovered);

            if (typeof onLetterHoverEnd === 'function') {
              onLetterHoverEnd(container, index);
            }
          }, index * stagger);

          container.setAttribute('data-th-timeout', reverseTimeoutId);
        });

        if (typeof onHoverEnd === 'function') {
          onHoverEnd(element);
        }
      }

      // Public methods to manually trigger animation
      hide(element) {
        if (!element && this.elements.length > 0) {
          this.elements.forEach(el => this._animateIn(el));
        } else if (element) {
          this._animateIn(element);
        }
      }

      show(element) {
        if (!element && this.elements.length > 0) {
          this.elements.forEach(el => this._animateOut(el));
        } else if (element) {
          this._animateOut(element);
        }
      }
    }

    // ===== Lenis Smooth Scrolling =====
    function initLenis() {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            lenis.scrollTo(target, {
              offset: -100,
              duration: 1.5,
            });
          }
        });
      });

      return lenis;
    }

    function initHeroScrollAnimation(lenis, heroTextScene) {
      const hero = document.getElementById('hero');
      const heroCanvas = document.getElementById('hero-canvas');
      const heroContent = document.querySelector('.hero-content');
      const scrollIndicator = document.querySelector('.scroll-indicator');
      const projectsSection = document.getElementById('projects');

      if (!hero || !projectsSection) return;

      lenis.on('scroll', ({ scroll }) => {
        const heroHeight = hero.offsetHeight;
        const scrollProgress = Math.min(1, Math.max(0, scroll / (heroHeight * 0.8)));

        if (heroTextScene) {
          heroTextScene.setScrollProgress(scrollProgress);
        }

        const opacity = 1 - scrollProgress;
        const fadeOpacity = Math.max(0, 1 - scrollProgress * 1.5);

        if (heroCanvas) {
          heroCanvas.style.opacity = fadeOpacity;
        }

        if (heroContent) {
          heroContent.style.opacity = fadeOpacity;
        }

        if (scrollIndicator) {
          scrollIndicator.style.opacity = Math.max(0, 1 - scrollProgress * 3);
        }

        const scale = 1 + scrollProgress * 0.1;
        if (hero) {
          hero.style.transform = `scale(${scale})`;
        }
      });
    }

    let scrollObserver = null;

    function initScrollAnimations() {
      if (scrollObserver) {
        scrollObserver.disconnect();
      }

      const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      };

      scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Unobserve once visible to save resources
            scrollObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);

      const animateElements = document.querySelectorAll('[data-scroll-animate]');
      animateElements.forEach(el => scrollObserver.observe(el));

      return scrollObserver;
    }

    function initHorizontalScrollAnimation(lenis, horizontalScene) {
      const horizontalSection = document.getElementById('horizontal-scroll');
      const progressBar = document.querySelector('.progress-bar');

      if (!horizontalSection || !horizontalScene) return;

      lenis.on('scroll', ({ scroll }) => {
        const sectionTop = horizontalSection.offsetTop;
        const sectionHeight = horizontalSection.offsetHeight;
        const viewportHeight = window.innerHeight;

        const sectionStart = sectionTop;
        const sectionEnd = sectionTop + sectionHeight - viewportHeight;

        if (scroll >= sectionStart && scroll <= sectionEnd) {
          const scrollInSection = scroll - sectionStart;
          const scrollableHeight = sectionHeight - viewportHeight;
          const progress = Math.min(1, Math.max(0, scrollInSection / scrollableHeight));

          horizontalScene.setScrollProgress(progress);

          if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
          }
        } else if (scroll < sectionStart) {
          horizontalScene.setScrollProgress(0);
          if (progressBar) {
            progressBar.style.width = '0%';
          }
        } else {
          horizontalScene.setScrollProgress(1);
          if (progressBar) {
            progressBar.style.width = '100%';
          }
        }
      });
    }

    // ===== Hero Text Scene =====
    class HeroTextScene {
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
        this.scene = new THREE.Scene();

        const aspect = window.innerWidth / (window.innerHeight * 1.5);
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 15);

        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          alpha: true,
          antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight * 1.5);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

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

        this.loadTreeModel();

        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));

        this.animate();
      }

      loadTreeModel(baseIndex = 0) {
        const loader = new GLTFLoader();
        const basePath = MODEL_BASE_PATHS[baseIndex] || MODEL_BASE_PATHS[0];

        loader.load(
          basePath + 'tree.glb',
          (gltf) => {
            this.treeModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(this.treeModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 20 / maxDim;
            this.treeModel.scale.set(scale, scale, scale);

            this.treeModel.position.x = -center.x * scale;
            this.treeModel.position.y = -center.y * scale;
            this.treeModel.position.z = -center.z * scale;

            this.treeModel.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

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
            const nextIndex = baseIndex + 1;
            if (nextIndex < MODEL_BASE_PATHS.length) {
              console.warn('Retrying tree model with fallback base path...');
              this.loadTreeModel(nextIndex);
              return;
            }

            console.error('Error loading tree model:', error);
          }
        );
      }

      onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }

      setScrollProgress(progress) {
        this.scrollProgress = Math.min(1, Math.max(0, progress));
      }

      animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        if (this.treeModel) {
          this.targetRotation.y = this.mouse.x * 0.1;
          this.targetRotation.x = this.mouse.y * 0.05;

          this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
          this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

          this.treeModel.rotation.y = this.currentRotation.y;
          this.treeModel.rotation.x = this.currentRotation.x;

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

    // ===== Horizontal Scroll Scene =====
    class HorizontalScrollScene {
      constructor(container) {
        this.container = container;
        this.canvas = container.querySelector('.horizontal-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.shapes = [];
        this.animationId = null;
        this.currentShapeIndex = 0;
        this.scrollProgress = 0;

        this.init();
      }

      init() {
        this.scene = new THREE.Scene();

        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          alpha: true,
          antialias: true,
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-5, -5, -5);
        this.scene.add(backLight);

        this.loadPLYModels();

        this.animate();
      }

      async loadPLYModels() {
        if (PLY_MODELS_CONFIG.length === 0) {
          console.warn('No GLB models configured to load');
          return;
        }

        try {
          const loader = new PLYModelLoader();

          const modelsWithProjects = PLY_MODELS_CONFIG.filter(config => config.projectId);
          const modelsWithoutProjects = PLY_MODELS_CONFIG.filter(config => !config.projectId);

          modelsWithProjects.sort((a, b) => parseInt(a.projectId) - parseInt(b.projectId));

          const allModelsInOrder = [...modelsWithProjects, ...modelsWithoutProjects];

          for (const config of allModelsInOrder) {
            const model = await loader.loadModel(config);

            model.position.set(10, 0, 0);
            model.scale.set(0, 0, 0);
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
        const numShapes = this.shapes.length;
        const progressPerShape = 1 / numShapes;

        this.shapes.forEach((shape, index) => {
          const shapeStartProgress = index * progressPerShape;
          const shapeEndProgress = (index + 1) * progressPerShape;

          let shapeProgress = (progress - shapeStartProgress) / progressPerShape;
          shapeProgress = Math.max(0, Math.min(1, shapeProgress));

          const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
          const easedProgress = easeOutQuart(shapeProgress);

          const startX = 10;
          const targetPos = shape.userData.targetPosition;
          const endX = typeof targetPos === 'object' ? targetPos.x : targetPos.x || 0;
          shape.position.x = startX + (endX - startX) * easedProgress;

          const scale = easedProgress;
          shape.scale.set(scale, scale, scale);

          if (shapeProgress > 0.01) {
            shape.userData.visible = true;
          }

          if (progress > shapeEndProgress) {
            const exitProgress = (progress - shapeEndProgress) / (progressPerShape * 0.5);
            const exitEased = Math.min(1, exitProgress);

            shape.position.x = endX - exitEased * 15;

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

            const exitScale = 1 - exitEased * 0.5;
            shape.scale.set(exitScale, exitScale, exitScale);
          } else {
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

    // ===== Project Manager =====
    class ProjectManager {
      constructor() {
        this.scenes = new Map();
        this.modalScene = null;
        this.currentProject = null;
        this.modal = document.getElementById('project-modal');
        this.modalCanvas = document.getElementById('modal-canvas');
        this.modalClose = document.querySelector('.modal-close');
        
        // Don't call init here, wait for loadProjects
      }

      async loadProjects() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;
        
        const { html } = await generateProjectsGrid('assets/data/objects.json');
        grid.innerHTML = html;
        
        // After DOM is updated, initialize the scenes and events
        this.init();
        
        // Also re-initialize description truncation since new elements are added
        initDescriptionTruncation();
        
        // Initialize scroll animations for the new elements
        initScrollAnimations();
      }

      init() {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
          const projectId = card.dataset.project;
          const canvas = card.querySelector('.project-canvas');

          if (canvas) {
            const scene = new SceneManager(canvas, projectId);
            this.scenes.set(projectId, scene);
          }

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

        if (this.modalClose) {
          this.modalClose.addEventListener('click', () => {
            this.closeModal();
          });
        }

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.modal.classList.contains('active')) {
            this.closeModal();
          }
        });

        window.addEventListener('resize', () => {
          this.handleResize();
        });
      }

      openModal(projectId, card) {
        this.currentProject = projectId;

        const title = card.querySelector('.project-title').textContent;
        const descriptionEl = card.querySelector('.project-description');
        // Get the full text if it exists, otherwise use the regular text
        const description = descriptionEl.getAttribute('data-full-text') || descriptionEl.textContent;
        const number = card.querySelector('.project-number').textContent;
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);

        document.querySelector('.modal-number').textContent = number;
        document.querySelector('.modal-title').textContent = title;
        document.querySelector('.modal-description').textContent = description;

        const modalTagsContainer = document.querySelector('.modal-tags');
        modalTagsContainer.innerHTML = tags.map(tag => generateTagHtml(tag)).join('');

        if (this.modalScene) {
          this.modalScene.dispose();
        }
        this.modalScene = new ModalSceneManager(this.modalCanvas, projectId);

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show mobile hint on first visit (mobile only)
        this.showMobileHint();

        // Add scroll listener for sticky header border effect
        const modalInfo = document.querySelector('.modal-info');
        const descriptionWrapper = document.querySelector('.modal-description-wrapper');

        if (descriptionWrapper) {
          const handleScroll = () => {
            if (descriptionWrapper.scrollTop > 0) {
              modalInfo.classList.add('scrolled');
            } else {
              modalInfo.classList.remove('scrolled');
            }
          };

          descriptionWrapper.addEventListener('scroll', handleScroll);
          this.modalScrollHandler = handleScroll;
        }

        setTimeout(() => {
          if (this.modalScene) {
            this.modalScene.handleResize();
          }
        }, 100);
      }

      showMobileHint() {
        // Only show on mobile devices
        const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
          && window.innerWidth <= 1024;

        if (!isMobile) return;

        // Check if user has seen the hint before
        const hasSeenHint = localStorage.getItem('carved_spirits_mobile_hint_seen');

        if (!hasSeenHint) {
          const hintEl = document.getElementById('mobile-hint');
          if (hintEl) {
            hintEl.style.display = 'block';

            // Mark as seen after showing
            setTimeout(() => {
              localStorage.setItem('carved_spirits_mobile_hint_seen', 'true');
              hintEl.style.display = 'none';
            }, 3000);
          }
        }
      }

      closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';

        // Remove scroll listener
        const descriptionWrapper = document.querySelector('.modal-description-wrapper');
        if (descriptionWrapper && this.modalScrollHandler) {
          descriptionWrapper.removeEventListener('scroll', this.modalScrollHandler);
          this.modalScrollHandler = null;
        }

        // Remove scrolled class
        const modalInfo = document.querySelector('.modal-info');
        if (modalInfo) {
          modalInfo.classList.remove('scrolled');
        }

        if (this.modalScene) {
          this.modalScene.dispose();
          this.modalScene = null;
        }

        this.currentProject = null;
      }

      handleResize() {
        this.scenes.forEach(scene => {
          scene.handleResize();
        });

        if (this.modalScene) {
          this.modalScene.handleResize();
        }
      }
    }

    // ===== Initialize Description Truncation =====
    function initDescriptionTruncation() {
      const MAX_CHARS = 50;

      document.querySelectorAll('.project-card').forEach(card => {
        const descriptionEl = card.querySelector('.project-description');
        if (!descriptionEl) return;

        const fullText = descriptionEl.textContent.trim();

        // Only add see more/less if text exceeds max characters
        if (fullText.length > MAX_CHARS) {
          const truncatedText = fullText.substring(0, MAX_CHARS);

          // Store the full text as a data attribute
          descriptionEl.setAttribute('data-full-text', fullText);
          descriptionEl.setAttribute('data-truncated-text', truncatedText);

          // Create wrapper for smooth height animation
          const wrapper = document.createElement('div');
          wrapper.className = 'description-wrapper';

          // Create content holder
          const content = document.createElement('span');
          content.textContent = truncatedText + '... ';

          // Create see more toggle as inline element
          const toggleBtn = document.createElement('span');
          toggleBtn.className = 'see-more-toggle';
          toggleBtn.textContent = 'see more';

          // Replace description content
          descriptionEl.innerHTML = '';
          wrapper.appendChild(content);
          wrapper.appendChild(toggleBtn);
          descriptionEl.appendChild(wrapper);

          // Measure heights
          let truncatedHeight = wrapper.scrollHeight;
          content.textContent = fullText + ' ';
          let fullHeight = wrapper.scrollHeight;
          content.textContent = truncatedText + '... ';

          // Set initial height
          wrapper.style.maxHeight = truncatedHeight + 'px';

          let isExpanded = false;

          // Add click handler
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click

            if (isExpanded) {
              // Collapse
              card.classList.remove('description-expanded');
              wrapper.classList.remove('expanded');
              wrapper.style.maxHeight = fullHeight + 'px';
              requestAnimationFrame(() => {
                wrapper.style.maxHeight = truncatedHeight + 'px';
              });

              setTimeout(() => {
                content.textContent = truncatedText + '... ';
                toggleBtn.textContent = 'see more';

                // Remeasure truncated height
                const newTruncatedHeight = wrapper.scrollHeight;
                wrapper.style.maxHeight = newTruncatedHeight + 'px';
              }, 600);

              isExpanded = false;
            } else {
              // Expand
              const currentHeight = wrapper.scrollHeight;
              content.textContent = fullText + ' ';
              const newFullHeight = wrapper.scrollHeight;
              content.textContent = truncatedText + '... ';

              wrapper.style.maxHeight = currentHeight + 'px';
              requestAnimationFrame(() => {
                content.textContent = fullText + ' ';
                toggleBtn.textContent = 'see less';
                // Let the wrapper expand fully, card will handle scrolling
                wrapper.style.maxHeight = newFullHeight + 'px';
                wrapper.classList.add('expanded');
                card.classList.add('description-expanded');
              });

              fullHeight = newFullHeight;
              isExpanded = true;
            }
          });
        }
      });
    }

    // ===== Initialize About Section =====
    function initAboutSection(heroTextScene) {
      const aboutSection = document.getElementById('about');
      const aboutLink = document.getElementById('about-link');
      const aboutClose = document.querySelector('.about-close');
      const aboutCanvas = document.getElementById('about-canvas');
      let aboutTreeScene = null;

      function openAbout() {
        aboutSection.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!aboutTreeScene && aboutCanvas) {
          aboutTreeScene = new HeroTextScene(aboutCanvas);

          aboutTreeScene.handleResize = function () {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          };

          setTimeout(() => {
            if (aboutTreeScene) {
              const width = window.innerWidth;
              const height = window.innerHeight;

              aboutTreeScene.camera.aspect = width / height;
              aboutTreeScene.camera.updateProjectionMatrix();

              aboutTreeScene.camera.position.set(0, 0, 20);

              aboutTreeScene.renderer.setSize(width, height);
              aboutTreeScene.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }
          }, 100);
        }
      }

      function closeAbout() {
        aboutSection.classList.remove('active');
        document.body.style.overflow = '';

        if (aboutTreeScene) {
          aboutTreeScene.dispose();
          aboutTreeScene = null;
        }
      }

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

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && aboutSection.classList.contains('active')) {
          closeAbout();
        }
      });

      if (aboutSection) {
        aboutSection.addEventListener('click', (e) => {
          if (e.target === aboutSection) {
            closeAbout();
          }
        });
      }
    }

    // ===== Initialize Scroll Reactive Header =====
    function initScrollReactiveHeader(lenis) {
      const SCROLL_THRESHOLD = 20;
      let lastScrollY = 0;
      let isHidden = false;

      // Get all nav elements to animate
      const navLogo = document.querySelector('.nav-logo');
      const navLinks = document.querySelectorAll('.nav-link');
      const themeToggle = document.getElementById('theme-toggle');
      const allNavElements = [navLogo, ...navLinks].filter(el => el);

      // Initialize animations with noReplacement and disableHover for scroll behavior
      const animations = allNavElements.map(element => {
        return new TextHoverAnimation(element, {
          duration: 600,
          stagger: 35,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          direction: 'up',
          noReplacement: true,
          disableHover: true
        });
      });

      // Handle scroll direction
      const handleScroll = (currentScrollY) => {
        const scrollingUp = currentScrollY < lastScrollY;

        // Don't do anything if we're at the very top
        if (currentScrollY < SCROLL_THRESHOLD) {
          if (isHidden) {
            animations.forEach(animation => animation.show());
            if (themeToggle) themeToggle.classList.remove('nav-hidden');
            isHidden = false;
          }
          lastScrollY = currentScrollY;
          return;
        }
        
        // Hide when scrolling down
        if (!scrollingUp && !isHidden) {
          animations.forEach(animation => animation.hide());
          if (themeToggle) themeToggle.classList.add('nav-hidden');
          isHidden = true;
        }
        // Show when scrolling up
        else if (scrollingUp && isHidden) {
          animations.forEach(animation => animation.show());
          if (themeToggle) themeToggle.classList.remove('nav-hidden');
          isHidden = false;
        }

        lastScrollY = currentScrollY;
      };
      
      if (lenis && typeof lenis.on === 'function') {
        lenis.on('scroll', ({ scroll }) => {
          handleScroll(scroll);
        });
      } else {
        window.addEventListener('scroll', () => {
          handleScroll(window.scrollY || window.pageYOffset);
        });
      }

      return animations;
    }
    
    // ===== Theme Init =====
    function initTheme() {
      const themeToggle = document.getElementById('theme-toggle');
      if (!themeToggle) return;
      
      const isLightMode = localStorage.getItem('carved_spirits_theme') === 'light';
      
      if (isLightMode) {
        document.documentElement.classList.add('light-mode');
      }
      
      themeToggle.addEventListener('click', () => {
        const isCurrentlyLight = document.documentElement.classList.contains('light-mode');
        
        if (isCurrentlyLight) {
          document.documentElement.classList.remove('light-mode');
          localStorage.setItem('carved_spirits_theme', 'dark');
        } else {
          document.documentElement.classList.add('light-mode');
          localStorage.setItem('carved_spirits_theme', 'light');
        }
      });
    }

    // ===== Main Init =====
    function init() {
      initTheme();
      
      // Initialize scroll-reactive header (includes logo and nav links)
      const lenis = initLenis();
      
      // Keep the nav/toggle scroll state in sync with Lenis.
      initScrollReactiveHeader(lenis);

      initScrollAnimations();

      const heroCanvas = document.getElementById('hero-canvas');
      let heroTextScene = null;

      if (heroCanvas) {
        heroTextScene = new HeroTextScene(heroCanvas);
      }

      initHeroScrollAnimation(lenis, heroTextScene);

      const horizontalScrollContainer = document.querySelector('.horizontal-scroll-container');
      let horizontalScene = null;

      if (horizontalScrollContainer) {
        horizontalScene = new HorizontalScrollScene(horizontalScrollContainer);
        initHorizontalScrollAnimation(lenis, horizontalScene);

        window.addEventListener('resize', () => {
          if (horizontalScene) {
            horizontalScene.handleResize();
          }
        });
      }

      const projectManager = new ProjectManager();
      projectManager.loadProjects();

      // initDescriptionTruncation() is now called inside projectManager.loadProjects()

      initAboutSection(heroTextScene);

      window.addEventListener('load', () => {
        document.body.classList.add('loaded');
      });

      console.log('Portfolio initialized');
    }

    // Start the app
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }