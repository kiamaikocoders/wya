import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';
import './CircularGallery.css';

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: any) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

function createTextTexture(
  gl: WebGLRenderingContext,
  text: string,
  font = 'bold 30px monospace',
  color = 'black'
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2d context');
  
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  gl: WebGLRenderingContext;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor: string;
  font: string;
  mesh?: Mesh;

  constructor({
    gl,
    plane,
    renderer,
    text,
    textColor = '#ffffff',
    font = 'bold 30px sans-serif'
  }: {
    gl: WebGLRenderingContext;
    plane: Mesh;
    renderer: Renderer;
    text: string;
    textColor?: string;
    font?: string;
  }) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.2; // Increased from 0.15 to 0.2 for better visibility
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.08; // Adjusted position
    this.mesh.setParent(this.plane);
  }
}

interface MediaItem {
  image: string;
  text: string;
}

class Media {
  extra: number = 0;
  geometry: Plane;
  gl: WebGLRenderingContext;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: { width: number; height: number };
  text: string;
  viewport: { width: number; height: number };
  bend: number;
  textColor: string;
  borderRadius: number;
  font: string;
  program?: Program;
  plane?: Mesh;
  title?: Title;
  speed: number = 0;
  width: number = 0;
  widthTotal: number = 0;
  x: number = 0;
  padding: number = 0;
  scale: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font
  }: {
    geometry: Plane;
    gl: WebGLRenderingContext;
    image: string;
    index: number;
    length: number;
    renderer: Renderer;
    scene: Transform;
    screen: { width: number; height: number };
    text: string;
    viewport: { width: number; height: number };
    bend: number;
    textColor: string;
    borderRadius?: number;
    font?: string;
  }) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font || 'bold 30px sans-serif';
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      if (this.program) {
        this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      }
    };
  }

  createMesh() {
    if (!this.program) return;
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    if (!this.plane) return;
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font
    });
  }

  update(scroll: { current: number; last: number }, direction: string) {
    if (!this.plane || !this.program) return;
    
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;
    
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;

    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: { screen?: { width: number; height: number }; viewport?: { width: number; height: number } } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
    }
    
    if (!this.plane || !this.program) return;
    
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

interface CircularGalleryProps {
  items: MediaItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  onItemClick?: (index: number, item: MediaItem) => void;
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: { ease: number; current: number; target: number; last: number; position?: number };
  onCheckDebounce: () => void;
  renderer?: Renderer;
  gl?: WebGLRenderingContext;
  camera?: Camera;
  scene?: Transform;
  planeGeometry?: Plane;
  mediasImages?: MediaItem[];
  medias?: Media[];
  screen: { width: number; height: number } = { width: 0, height: 0 };
  viewport: { width: number; height: number } = { width: 0, height: 0 };
  isDown: boolean = false;
  start: number = 0;
  startTime?: number;
  raf?: number;
  boundOnResize?: () => void;
  boundOnWheel?: (e: WheelEvent) => void;
  boundOnTouchDown?: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchMove?: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchUp?: () => void;
  onItemClick?: (index: number, item: MediaItem) => void;

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 3,
      textColor = '#ffffff',
      borderRadius = 0.05,
      font = 'bold 30px Figtree',
      scrollSpeed = 2,
      scrollEase = 0.05,
      onItemClick
    }: CircularGalleryProps & { bend?: number; textColor?: string; borderRadius?: number; font?: string; scrollSpeed?: number; scrollEase?: number; onItemClick?: (index: number, item: MediaItem) => void }
  ) {
    document.documentElement.classList.remove('no-js');
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.onItemClick = onItemClick;
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    if (!this.gl) return;
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    if (!this.gl) return;
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }

  createMedias(items: MediaItem[], bend = 3, textColor: string, borderRadius: number, font: string) {
    if (!this.gl || !this.planeGeometry || !this.renderer || !this.scene) return;
    
    const galleryItems = items && items.length ? items : [];
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages!.length,
        renderer: this.renderer,
        scene: this.scene!,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font
      });
    });
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    this.startTime = Date.now();
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown) return;
    const x = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll.position || 0) + distance;
  }

  onTouchUp() {
    const wasClick = this.isDown && Date.now() - (this.startTime || 0) < 200;
    const moved = Math.abs((this.scroll.position || 0) - this.scroll.current) > 5;
    
    if (wasClick && !moved && this.onItemClick && this.mediasImages) {
      // Find which item is closest to center
      const centerX = this.viewport.width / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      if (this.medias && this.medias.length > 0) {
        this.medias.forEach((media, index) => {
          if (media.plane) {
            const distance = Math.abs(media.plane.position.x + this.scroll.current);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index % this.mediasImages.length;
            }
          }
        });
        
        const item = this.mediasImages[closestIndex];
        if (item) {
          this.onItemClick(closestIndex, item);
        }
      }
    }
    
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e: WheelEvent) {
    const delta = e.deltaY || (e as any).wheelDelta || (e as any).detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    
    if (!this.renderer || !this.camera) return;
    
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });

    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };

    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render({ scene: this.scene, camera: this.camera });
    }
    
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);

    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('mousewheel', this.boundOnWheel as any);
    window.addEventListener('wheel', this.boundOnWheel);
    window.addEventListener('mousedown', this.boundOnTouchDown as any);
    window.addEventListener('mousemove', this.boundOnTouchMove as any);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown as any);
    window.addEventListener('touchmove', this.boundOnTouchMove as any);
    window.addEventListener('touchend', this.boundOnTouchUp);
  }

  destroy() {
    if (this.raf) window.cancelAnimationFrame(this.raf);
    if (this.boundOnResize) window.removeEventListener('resize', this.boundOnResize);
    if (this.boundOnWheel) {
      window.removeEventListener('mousewheel', this.boundOnWheel as any);
      window.removeEventListener('wheel', this.boundOnWheel);
    }
    if (this.boundOnTouchDown) {
      window.removeEventListener('mousedown', this.boundOnTouchDown as any);
      window.removeEventListener('touchstart', this.boundOnTouchDown as any);
    }
    if (this.boundOnTouchMove) {
      window.removeEventListener('mousemove', this.boundOnTouchMove as any);
      window.removeEventListener('touchmove', this.boundOnTouchMove as any);
    }
    if (this.boundOnTouchUp) {
      window.removeEventListener('mouseup', this.boundOnTouchUp);
      window.removeEventListener('touchend', this.boundOnTouchUp);
    }
    if (this.renderer && this.gl && this.gl.canvas.parentNode) {
      this.gl.canvas.parentNode.removeChild(this.gl.canvas);
    }
  }
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  font = 'bold 30px Figtree',
  scrollSpeed = 2,
  scrollEase = 0.05,
  onItemClick
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    appRef.current = new App(containerRef.current, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
      onItemClick
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
      }
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, onItemClick]);

  return <div className="circular-gallery" ref={containerRef} />;
}

