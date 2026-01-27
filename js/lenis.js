import Lenis from '@studio-freight/lenis';

/**
 * Initialize Lenis smooth scrolling
 */
export function initLenis() {
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

  // Animation frame loop
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Handle anchor links
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

/**
 * Hero scroll animation - makes hero zoom towards user and fade into Selected Works
 */
export function initHeroScrollAnimation(lenis, heroTextScene) {
  const hero = document.getElementById('hero');
  const heroCanvas = document.getElementById('hero-canvas');
  const heroContent = document.querySelector('.hero-content');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const projectsSection = document.getElementById('projects');
  
  if (!hero || !projectsSection) return;

  lenis.on('scroll', ({ scroll }) => {
    const heroHeight = hero.offsetHeight;
    const scrollProgress = Math.min(1, Math.max(0, scroll / (heroHeight * 0.8)));
    
    // Update 3D text scene scroll progress
    if (heroTextScene) {
      heroTextScene.setScrollProgress(scrollProgress);
    }
    
    // Fade out hero elements as we scroll
    const opacity = 1 - scrollProgress;
    const fadeOpacity = Math.max(0, 1 - scrollProgress * 1.5); // Faster fade
    
    if (heroCanvas) {
      heroCanvas.style.opacity = fadeOpacity;
    }
    
    if (heroContent) {
      heroContent.style.opacity = fadeOpacity;
    }
    
    if (scrollIndicator) {
      scrollIndicator.style.opacity = Math.max(0, 1 - scrollProgress * 3); // Even faster fade for indicator
    }
    
    // Scale effect on hero - subtle zoom in
    const scale = 1 + scrollProgress * 0.1;
    if (hero) {
      hero.style.transform = `scale(${scale})`;
    }
  });
}

/**
 * Initialize scroll-triggered animations
 */
export function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, observerOptions);

  // Observe all elements with data-scroll-animate
  const animateElements = document.querySelectorAll('[data-scroll-animate]');
  animateElements.forEach(el => observer.observe(el));

  return observer;
}

/**
 * Parallax effect for hero elements
 */
export function initParallax(lenis) {
  const parallaxElements = document.querySelectorAll('.hero-content, .scroll-indicator');
  
  lenis.on('scroll', ({ scroll }) => {
    parallaxElements.forEach((el, index) => {
      const speed = index === 0 ? 0.5 : 0.3;
      const yPos = scroll * speed;
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  });
}

/**
 * Initialize horizontal scroll animation for shapes section
 */
export function initHorizontalScrollAnimation(lenis, horizontalScene) {
  const horizontalSection = document.getElementById('horizontal-scroll');
  const progressBar = document.querySelector('.progress-bar');
  
  if (!horizontalSection || !horizontalScene) return;

  lenis.on('scroll', ({ scroll }) => {
    const sectionTop = horizontalSection.offsetTop;
    const sectionHeight = horizontalSection.offsetHeight;
    const viewportHeight = window.innerHeight;
    
    // Calculate if we're in the horizontal scroll section
    const sectionStart = sectionTop;
    const sectionEnd = sectionTop + sectionHeight - viewportHeight;
    
    if (scroll >= sectionStart && scroll <= sectionEnd) {
      // We're in the horizontal scroll section
      const scrollInSection = scroll - sectionStart;
      const scrollableHeight = sectionHeight - viewportHeight;
      const progress = Math.min(1, Math.max(0, scrollInSection / scrollableHeight));
      
      // Update the 3D scene with scroll progress
      horizontalScene.setScrollProgress(progress);
      
      // Update progress bar
      if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
      }
    } else if (scroll < sectionStart) {
      // Before the section
      horizontalScene.setScrollProgress(0);
      if (progressBar) {
        progressBar.style.width = '0%';
      }
    } else {
      // After the section
      horizontalScene.setScrollProgress(1);
      if (progressBar) {
        progressBar.style.width = '100%';
      }
    }
  });
}
