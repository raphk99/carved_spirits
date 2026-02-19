
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// Event Classes matching existing logic
class WorldEvent {
    constructor(label, date, image, description, clickable = true) {
        this.label = label;
        this.date = date;
        this.clickable = clickable;
        this._image = image;
        this._description = description;
    }
    get image() { return this._image; }
    get description() { return this._description; }
}

class EventObject extends WorldEvent {
    constructor(label, date, coordinates, image, description, tags = []) {
        super(label, date, image, description);
        this.coordinates = coordinates;
        this.tags = tags;
    }
}

class EventRegion extends WorldEvent {
    constructor(label, date, coordinates, content, tags = []) {
        super(label, date, content[0]?.image || "", content[0]?.text || "");
        this.coordinates = coordinates;
        this.content = content;
        this.tags = tags;
    }
}

class EventEthnicGroup extends WorldEvent {
    constructor(label, date, coordinatesList, content, tags = []) {
        super(label, date, content[0]?.image || "", content[0]?.text || "");
        this.coordinatesList = coordinatesList;
        this.content = content;
        this.tags = tags;
    }
}

export class GlobeManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.globeGroup = null;
        this.eventMarkers = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.loadingEl = null;

        this.isActive = false;
        this.animationId = null;
        this.hoveredEvent = null;
        
        // Callback for when an event is clicked on the globe
        this.onEventClick = null; 

        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 3;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 5;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.enablePan = false;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0x4488ff, 0.3);
        backLight.position.set(-5, -3, -5);
        this.scene.add(backLight);

        // Globe Group
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);

        // Stars
        this.createStars();

        // Load Assets
        this.loadEarthAssets();
        
        // Event Listeners
        window.addEventListener('resize', this.onResize.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('click', this.onClick.bind(this));
        
        // Start Loop
        this.animate();
    }

    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            sizeAttenuation: true
        });

        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    loadEarthAssets() {
        const textureLoader = new THREE.TextureLoader();
        const earthGeometry = new THREE.SphereGeometry(1, 128, 128);

        // Base Earth Texture
        textureLoader.load(
            './assets/earth/earth_1.png',
            (texture) => {
                texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                const earthMaterial = new THREE.MeshPhongMaterial({
                    map: texture,
                    shininess: 10,
                    specular: new THREE.Color(0x222222),
                    emissive: new THREE.Color(0x000000),
                    emissiveIntensity: 0
                });
                const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
                this.globeGroup.add(earthMesh);
            },
            undefined,
            (error) => {
                console.warn('Error loading earth texture, using fallback', error);
                const fallbackMaterial = new THREE.MeshPhongMaterial({
                    color: 0x1a1a2e,
                    shininess: 10
                });
                const earthMesh = new THREE.Mesh(earthGeometry, fallbackMaterial);
                this.globeGroup.add(earthMesh);
            }
        );

        // Combine Contours
        this.combineContourTextures();

        // Atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.globeGroup.add(atmosphere);
    }

    combineContourTextures() {
        const img1 = new Image();
        const img2 = new Image();
        let loaded = 0;

        img1.crossOrigin = 'anonymous';
        img2.crossOrigin = 'anonymous';

        const onLoad = () => {
            loaded++;
            if (loaded === 2) {
                const canvas = document.createElement('canvas');
                canvas.width = img1.width * 2;
                canvas.height = img1.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img1, 0, 0, img1.width, img1.height);
                ctx.drawImage(img2, img1.width, 0, img2.width, img2.height);

                const combinedTexture = new THREE.CanvasTexture(canvas);
                combinedTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                combinedTexture.needsUpdate = true;

                const contourGeometry = new THREE.SphereGeometry(1.003, 128, 128);
                const contourMaterial = new THREE.MeshBasicMaterial({
                    map: combinedTexture,
                    transparent: true,
                    opacity: 1.0,
                    blending: THREE.NormalBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });

                const contourMesh = new THREE.Mesh(contourGeometry, contourMaterial);
                this.globeGroup.add(contourMesh);
            }
        };

        img1.onload = onLoad;
        img2.onload = onLoad;
        
        // Error handling omitted for brevity, but could be added
        img1.src = './assets/earth/contour1_1.png';
        img2.src = './assets/earth/contour2_1.png';
    }

    async loadEvents() {
        try {
            const response = await fetch('./assets/data/events.json');
            if (!response.ok) throw new Error('Failed to fetch events');
            const events = await response.json();

            events.forEach(data => {
                let eventInstance;
                // Basic mapping, assuming structure from globe-test.html
                // Note: The classes were updated to include tags
                if (data.type === 'ethnic_group') {
                    eventInstance = new EventEthnicGroup(data.label, data.date, data.coordinatesList, data.content, data.tags);
                    if (data.coordinatesList) {
                        data.coordinatesList.forEach(coord => {
                            this.createEventVisual(coord.lat, coord.lon, eventInstance);
                        });
                    }
                } else if (data.type === 'region') {
                    eventInstance = new EventRegion(data.label, data.date, data.coordinates, data.content, data.tags);
                    if (data.coordinates) {
                        this.createEventVisual(data.coordinates.lat, data.coordinates.lon, eventInstance);
                    }
                } else {
                    eventInstance = new EventObject(data.label, data.date, data.coordinates, data.image, data.description, data.tags);
                    if (data.coordinates) {
                        this.createEventVisual(data.coordinates.lat, data.coordinates.lon, eventInstance);
                    }
                }
            });
            console.log(`Loaded ${this.eventMarkers.length} markers.`);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    createEventVisual(lat, lon, eventData) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const radius = 1.0;

        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        const position = new THREE.Vector3(x, y, z);
        const normal = position.clone().normalize();

        // Dot
        const dotGeometry = new THREE.SphereGeometry(0.006, 16, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial);
        dotMesh.position.copy(position);
        this.globeGroup.add(dotMesh);

        // Lightray
        const rayHeight = 0.3;
        const rayWidth = 0.02;
        const geometry = new THREE.PlaneGeometry(rayWidth, rayHeight);
        geometry.translate(0, rayHeight / 2, 0);

        // Gradient Texture
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, 64);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
        gradient.addColorStop(0.8, 'rgba(100, 200, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            opacity: 0
        });

        const lightrayMesh = new THREE.Mesh(geometry, material);
        lightrayMesh.position.copy(position);
        this.globeGroup.add(lightrayMesh);

        const markerData = {
            dotMesh: dotMesh,
            lightrayMesh: lightrayMesh,
            normal: normal,
            eventData: eventData,
            animationScale: 1.0
        };

        dotMesh.userData = markerData;
        lightrayMesh.userData = markerData;

        this.eventMarkers.push({ userData: markerData });
    }

    animate() {
        if (!this.isActive) return;

        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // Animate Lightrays
        const time = Date.now() * 0.001;
        this.globeGroup.updateMatrixWorld();

        this.eventMarkers.forEach((marker, index) => {
            const lightray = marker.userData.lightrayMesh;
            const normal = marker.userData.normal;
            
            if(lightray && normal) {
                const worldNormal = normal.clone().applyQuaternion(this.globeGroup.quaternion);
                const worldPosition = new THREE.Vector3();
                lightray.getWorldPosition(worldPosition);
                const viewVector = this.camera.position.clone().sub(worldPosition).normalize();
                const alignment = Math.abs(viewVector.dot(worldNormal));
                const scaleFactor = Math.max(0, Math.sqrt(1.0 - alignment * alignment));
                
                lightray.scale.setScalar(scaleFactor);
                lightray.up.copy(worldNormal);
                lightray.lookAt(this.camera.position);

                // Pulse
                const pulse = (0.6 + Math.sin(time * 2 + index) * 0.2);
                lightray.material.opacity = pulse * scaleFactor * marker.userData.animationScale;
                
                if (marker.userData.dotMesh) {
                    marker.userData.dotMesh.material.opacity = marker.userData.animationScale;
                }
            }
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if(this.animationId) cancelAnimationFrame(this.animationId);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        // Adjust for canvas position if not fullscreen
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            this.eventMarkers.map(m => m.userData.dotMesh),
            false
        );

        if (intersects.length > 0) {
            const marker = this.eventMarkers.find(m => m.userData.dotMesh === intersects[0].object);
            if (marker && marker.userData.eventData.clickable) {
                document.body.style.cursor = 'pointer';
                // Could trigger a hover event/callback here for UI tooltips
                
                // For now, minimal hover logic
                 if (this.hoveredEvent !== marker) {
                    this.hoveredEvent = marker;
                    // Dispatch custom event or callback if needed
                 }
            }
        } else {
            document.body.style.cursor = 'default';
            this.hoveredEvent = null;
        }
    }

    onClick(event) {
        if (!this.hoveredEvent) return;
        
        // Handle click on marker
        if (this.onEventClick) {
            this.onEventClick(this.hoveredEvent.userData.eventData);
        }
    }

    zoomToTag(tagName) {
        const searchTerm = tagName.replace(/_/g, ' ').toLowerCase();
        
        // Find matching marker
        const matchingMarker = this.eventMarkers.find(marker => {
            const data = marker.userData.eventData;
            
            // 1. Check tags array if it exists
            if (data.tags && data.tags.some(t => t.toLowerCase() === searchTerm)) {
                return true;
            }

            // 2. Check label
            if (data.label.toLowerCase().includes(searchTerm)) return true;

            // 3. Check description
            if (data.description && data.description.toLowerCase().includes(searchTerm)) return true;

            return false;
        });

        if (matchingMarker) {
            this.zoomToMarker(matchingMarker);
        } else {
            console.warn(`No marker found for tag: ${tagName}`);
            // Fallback: Just show globe from distance, or reset
            gsap.to(this.camera.position, {
                 duration: 1.5,
                 x: 0, y: 0, z: 3,
                 ease: "power2.inOut"
            });
        }
    }

    zoomToMarker(marker) {
        this.controls.enabled = false;
        const normal = marker.userData.normal;
        
        // Logic from globe-test.html
        const targetDistance = 1.2;
        const hoverDistance = 2.5;

        // Current globe rotation is 0 usually, but if auto-rotated we might need world normal
        // The marker normal is already in 'local' space of the globeGroup.
        // If globeGroup was rotated, we apply that rotation.
        // Assuming globeGroup is at 0,0,0
        const worldNormal = normal.clone().applyQuaternion(this.globeGroup.quaternion).normalize();

        const targetPosHover = worldNormal.clone().multiplyScalar(hoverDistance);
        const targetPosZoom = worldNormal.clone().multiplyScalar(targetDistance);

        const tl = gsap.timeline({
            onComplete: () => {
                this.controls.enabled = true; // Or keep disabled if showing modal
                // Trigger modal opening if we want to show details immediately
                if (this.onEventClick) {
                    this.onEventClick(marker.userData.eventData);
                }
            }
        });

        // 1. Move to Hover
        tl.to(this.camera.position, {
            duration: 1.2,
            x: targetPosHover.x,
            y: targetPosHover.y,
            z: targetPosHover.z,
            ease: "power2.inOut",
            onUpdate: () => this.camera.lookAt(0, 0, 0)
        });

        // 2. Zoom In
        tl.to(this.camera.position, {
            duration: 1.0,
            x: targetPosZoom.x,
            y: targetPosZoom.y,
            z: targetPosZoom.z,
            ease: "power2.out",
            onUpdate: () => this.camera.lookAt(0, 0, 0)
        }, "-=0.2");
    }

    dispose() {
        this.stop();
        window.removeEventListener('resize', this.onResize);
        this.container.removeEventListener('mousemove', this.onMouseMove);
        this.container.removeEventListener('click', this.onClick);
        
        // Dispose Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        // ... more comprehensive disposal if needed
    }
}
