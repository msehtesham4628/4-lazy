import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Upload,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { compressUploadImage } from '../utils/imageUtils.ts';

interface TShirt3DViewerProps {
  colorHex?: string;
  uploadedGraphicUrl?: string | null;
  customText?: string;
  customSubtitle?: string;
  fontStyle?: string;
  textColorHex?: string;
  placement?: 'center-chest' | 'left-chest' | 'full-back' | 'sleeve';
  printTechnique?: string;
  scale?: number;
  onUploadImage?: (dataUrl: string) => void;
  onRemoveImage?: () => void;
}

export const TShirt3DViewer: React.FC<TShirt3DViewerProps> = ({
  colorHex = '#f8f8fa',
  uploadedGraphicUrl = null,
  customText = '',
  customSubtitle = '',
  fontStyle = 'font-sans font-black tracking-tighter',
  textColorHex = '#111112',
  placement = 'center-chest',
  printTechnique = 'High-Density Screen Print',
  scale = 100,
  onUploadImage,
  onRemoveImage
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const tShirtGroupRef = useRef<THREE.Group | null>(null);
  const frontMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const backMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const animationFrameIdRef = useRef<number>(0);

  // State for UI controls
  const [autoRotate, setAutoRotate] = useState(false);
  const [currentAngle, setCurrentAngle] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [isDragOver, setIsDragOver] = useState(false);

  // Draw 2D canvas for texture mapping
  const createTextureCanvas = useCallback((side: 'front' | 'back') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Fill base shirt color with slight cotton fabric micro-texture
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle fabric noise/weave
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let i = 0; i < 10000; i += 2) {
      const rx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const ry = (Math.cos(i * 78.233) * 43758.5453) % 1;
      ctx.fillRect(Math.abs(rx) * 1024, Math.abs(ry) * 1024, 2, 2);
    }

    // Determine if print goes on front or back
    const isBackPlacement = placement === 'full-back';
    const shouldDrawOnThisSide = (side === 'back' && isBackPlacement) || (side === 'front' && !isBackPlacement);

    if (!shouldDrawOnThisSide) {
      return canvas;
    }

    // Determine target bounding box based on placement
    let targetX = 512;
    let targetY = 480;
    let targetWidth = 380 * (scale / 100);
    let targetHeight = 440 * (scale / 100);

    if (placement === 'left-chest') {
      targetX = 660; // user's left / viewer's right on front
      targetY = 420;
      targetWidth = 180 * (scale / 100);
      targetHeight = 180 * (scale / 100);
    } else if (placement === 'full-back') {
      targetX = 512;
      targetY = 490;
      targetWidth = 440 * (scale / 100);
      targetHeight = 520 * (scale / 100);
    }

    // If an image is uploaded, draw it onto the texture
    if (uploadedGraphicUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = uploadedGraphicUrl;

      // Draw image if already loaded
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.translate(targetX, targetY);

        // Apply print technique aesthetic
        if (printTechnique.includes('Puff')) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 6;
        } else if (printTechnique.includes('Foil')) {
          ctx.shadowColor = 'rgba(229, 169, 20, 0.5)';
          ctx.shadowBlur = 8;
        }

        const aspect = img.naturalWidth / img.naturalHeight;
        let drawW = targetWidth;
        let drawH = targetWidth / aspect;
        if (drawH > targetHeight) {
          drawH = targetHeight;
          drawW = targetHeight * aspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        // Trigger async redraw when image loads
        img.onload = () => {
          updateTextures();
        };
      }
    }

    // If custom text slogan is specified, render styled typography
    if (customText.trim()) {
      ctx.save();
      ctx.translate(targetX, uploadedGraphicUrl ? targetY + targetHeight / 2 + 30 : targetY);

      if (printTechnique.includes('Puff')) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
      }

      ctx.fillStyle = textColorHex;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Font sizing based on text length
      const textFontSize = Math.max(24, Math.min(54, Math.floor(600 / (customText.length || 1)))) * (scale / 100);
      ctx.font = `900 ${textFontSize}px sans-serif`;
      ctx.fillText(customText.toUpperCase(), 0, 0);

      if (customSubtitle.trim()) {
        const subFontSize = Math.max(14, Math.floor(textFontSize * 0.42));
        ctx.font = `700 ${subFontSize}px monospace`;
        ctx.fillStyle = textColorHex;
        ctx.globalAlpha = 0.85;
        ctx.fillText(customSubtitle.toUpperCase(), 0, textFontSize * 0.7);
      }

      ctx.restore();
    }

    // If neither image nor text, render a clean architectural studio branding placeholder
    if (!uploadedGraphicUrl && !customText.trim() && side === 'front') {
      ctx.save();
      ctx.translate(targetX, targetY);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtle dashed guideline
      ctx.strokeStyle = 'rgba(229, 169, 20, 0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

      ctx.fillStyle = 'rgba(229, 169, 20, 0.85)';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('4 LAZY CUSTOM PRINT AREA', 0, -20);

      ctx.fillStyle = 'rgba(100, 100, 110, 0.8)';
      ctx.font = '16px monospace';
      ctx.fillText('DROP ARTWORK OR TYPE SLOGAN BELOW', 0, 15);
      ctx.restore();
    }

    return canvas;
  }, [colorHex, uploadedGraphicUrl, customText, customSubtitle, textColorHex, placement, printTechnique, scale]);

  // Update Three.js textures
  const updateTextures = useCallback(() => {
    if (!frontMaterialRef.current || !backMaterialRef.current) return;

    // Front texture
    const frontCanvas = createTextureCanvas('front');
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.anisotropy = 8;
    if (frontMaterialRef.current.map) frontMaterialRef.current.map.dispose();
    frontMaterialRef.current.map = frontTex;
    frontMaterialRef.current.needsUpdate = true;

    // Back texture
    const backCanvas = createTextureCanvas('back');
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;
    backTex.anisotropy = 8;
    if (backMaterialRef.current.map) backMaterialRef.current.map.dispose();
    backMaterialRef.current.map = backTex;
    backMaterialRef.current.needsUpdate = true;

    // Body material (arms, collar, trim)
    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.color.set(colorHex);
      bodyMaterialRef.current.needsUpdate = true;
    }
  }, [createTextureCanvas, colorHex]);

  // Initialize Three.js Scene and 3D T-Shirt Geometry
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 3.4);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Studio Lighting & Environment Map
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('RoomEnvironment fallback', e);
    }

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2.5, 3.5, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xedf2ff, 1.4);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff4e0, 1.8);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222228, 0.8);
    scene.add(hemiLight);

    // 4. Contact Shadow Plane Grounding
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0,0,0,0.45)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.18)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.25;
    scene.add(shadowMesh);

    // 5. Construct Procedural 3D T-Shirt Composite Model (Group)
    const tShirtGroup = new THREE.Group();
    scene.add(tShirtGroup);
    tShirtGroupRef.current = tShirtGroup;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.82,
      metalness: 0.05
    });
    bodyMaterialRef.current = bodyMat;

    const frontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.05
    });
    frontMaterialRef.current = frontMat;

    const backMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.05
    });
    backMaterialRef.current = backMat;

    // A. Front Torso with Print Canvas Texture Mapping
    const frontTorsoGeo = new THREE.PlaneGeometry(1.22, 1.55, 32, 32);
    // Add natural sculptural chest curvature
    const pos = frontTorsoGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Subtle chest curvature
      const zCurve = Math.cos((x / 1.22) * Math.PI) * 0.12 - (y * y) * 0.02;
      pos.setZ(i, zCurve);
    }
    frontTorsoGeo.computeVertexNormals();
    const frontMesh = new THREE.Mesh(frontTorsoGeo, frontMat);
    frontMesh.position.set(0, -0.05, 0.07);
    tShirtGroup.add(frontMesh);

    // B. Back Torso with Print Canvas Texture Mapping
    const backTorsoGeo = new THREE.PlaneGeometry(1.22, 1.55, 32, 32);
    const bPos = backTorsoGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const x = bPos.getX(i);
      const y = bPos.getY(i);
      const zCurve = Math.cos((x / 1.22) * Math.PI) * 0.1 - (y * y) * 0.02;
      bPos.setZ(i, zCurve);
    }
    backTorsoGeo.computeVertexNormals();
    const backMesh = new THREE.Mesh(backTorsoGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.set(0, -0.05, -0.07);
    tShirtGroup.add(backMesh);

    // C. Torso Body Filler (Volume / Thickness)
    const torsoBodyGeo = new THREE.CylinderGeometry(0.58, 0.62, 1.5, 36, 1, true);
    torsoBodyGeo.scale(1.05, 1, 0.28);
    const torsoBodyMesh = new THREE.Mesh(torsoBodyGeo, bodyMat);
    torsoBodyMesh.position.set(0, -0.05, 0);
    tShirtGroup.add(torsoBodyMesh);

    // D. Left Drop-Shoulder Boxy Sleeve
    const leftSleeveGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.72, 28);
    const leftSleeve = new THREE.Mesh(leftSleeveGeo, bodyMat);
    leftSleeve.position.set(0.74, 0.46, 0);
    leftSleeve.rotation.z = -Math.PI / 4.2;
    leftSleeve.rotation.x = 0.08;
    tShirtGroup.add(leftSleeve);

    // Left Sleeve Cuff Ring
    const leftCuffGeo = new THREE.TorusGeometry(0.22, 0.02, 16, 28);
    const leftCuff = new THREE.Mesh(leftCuffGeo, bodyMat);
    leftCuff.position.set(0.96, 0.22, 0.02);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.rotation.y = -Math.PI / 4.2;
    tShirtGroup.add(leftCuff);

    // E. Right Drop-Shoulder Boxy Sleeve
    const rightSleeveGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.72, 28);
    const rightSleeve = new THREE.Mesh(rightSleeveGeo, bodyMat);
    rightSleeve.position.set(-0.74, 0.46, 0);
    rightSleeve.rotation.z = Math.PI / 4.2;
    rightSleeve.rotation.x = 0.08;
    tShirtGroup.add(rightSleeve);

    // Right Sleeve Cuff Ring
    const rightCuffGeo = new THREE.TorusGeometry(0.22, 0.02, 16, 28);
    const rightCuff = new THREE.Mesh(rightCuffGeo, bodyMat);
    rightCuff.position.set(-0.96, 0.22, 0.02);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.rotation.y = Math.PI / 4.2;
    tShirtGroup.add(rightCuff);

    // F. Thick 1.25" Anti-Collapse Ribbed Collar Ring
    const collarGeo = new THREE.TorusGeometry(0.29, 0.035, 18, 48);
    collarGeo.scale(1.08, 0.55, 1);
    const collarMesh = new THREE.Mesh(collarGeo, bodyMat);
    collarMesh.position.set(0, 0.74, 0.02);
    collarMesh.rotation.x = Math.PI / 2.2;
    tShirtGroup.add(collarMesh);

    // G. Bottom Hem Trim
    const bottomHemGeo = new THREE.TorusGeometry(0.61, 0.02, 16, 48);
    bottomHemGeo.scale(1.05, 0.28, 1);
    const bottomHem = new THREE.Mesh(bottomHemGeo, bodyMat);
    bottomHem.position.set(0, -0.82, 0);
    bottomHem.rotation.x = Math.PI / 2;
    tShirtGroup.add(bottomHem);

    // 6. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 5.0;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minPolarAngle = Math.PI / 4;
    controlsRef.current = controls;

    // Initial texture build
    updateTextures();

    // 7. Render Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (autoRotate && tShirtGroupRef.current) {
        tShirtGroupRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update textures whenever customization inputs change
  useEffect(() => {
    updateTextures();
  }, [updateTextures]);

  // Handle rotating to preset angles
  const rotateTo = (angle: 'front' | 'back' | 'left' | 'right') => {
    if (!tShirtGroupRef.current) return;
    setAutoRotate(false);
    setCurrentAngle(angle);

    let targetRotY = 0;
    if (angle === 'front') targetRotY = 0;
    if (angle === 'back') targetRotY = Math.PI;
    if (angle === 'left') targetRotY = Math.PI / 2;
    if (angle === 'right') targetRotY = -Math.PI / 2;

    tShirtGroupRef.current.rotation.y = targetRotY;
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.85 : 1.15;
    cameraRef.current.position.z = Math.max(2.1, Math.min(4.5, cameraRef.current.position.z * factor));
  };

  // File Upload Handlers for the Below Upload Option
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      try {
        const compressed = await compressUploadImage(file);
        onUploadImage(compressed);
      } catch (err) {
        console.error('Image upload failed', err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onUploadImage) {
      try {
        const compressed = await compressUploadImage(file);
        onUploadImage(compressed);
      } catch (err) {
        console.error('Image drop failed', err);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 3D ROTATABLE T-SHIRT VIEWER CARD */}
      <div className="relative rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top 3D Viewport Header Bar */}
        <div className="px-4 py-3 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              3D Real-Time T-Shirt Model
            </span>
            <span className="text-neutral-500 hidden sm:inline">· 360° Drag Rotatable</span>
          </div>

          {/* Quick Angle Buttons & Auto-Rotate Toggle */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => rotateTo('front')}
              className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                currentAngle === 'front' && !autoRotate ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => rotateTo('back')}
              className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                currentAngle === 'back' && !autoRotate ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => rotateTo('left')}
              className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                currentAngle === 'left' && !autoRotate ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Side
            </button>
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Pause 3D rotation' : 'Start auto 3D spin'}
              className={`p-1 rounded transition-colors ${
                autoRotate ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* The 3D Canvas Mount Container */}
        <div
          ref={mountRef}
          className="w-full h-[460px] sm:h-[520px] cursor-grab active:cursor-grabbing relative select-none"
        />

        {/* Floating 3D Navigation Controls Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-neutral-800 text-neutral-400 text-xs">
          <button
            type="button"
            onClick={() => handleZoom('in')}
            title="Zoom In"
            className="p-1 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            className="p-1 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => rotateTo('front')}
            title="Reset to Front View"
            className="p-1 hover:text-white transition-colors border-l border-neutral-700 pl-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Helpful Drag Instruction Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 font-mono flex items-center gap-1.5 pointer-events-none">
          <span className="text-[#E5A914]">✦</span> Click and drag to inspect in 360°
        </div>
      </div>

      {/* BELOW UPLOAD OPTION (Directly underneath the 3D T-Shirt) */}
      <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#E5A914]" />
            <h3 className="text-xs uppercase font-bold tracking-widest text-white">
              Upload Custom Graphic &amp; Artwork
            </h3>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            Renders directly on 3D White T-Shirt
          </span>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#E5A914] bg-[#E5A914]/10 scale-[1.01]'
              : 'border-neutral-700/80 hover:border-[#E5A914] bg-neutral-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center mx-auto mb-3 text-[#E5A914]">
            <Upload className="w-6 h-6" />
          </div>

          <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
            Click to Browse or Drag &amp; Drop Your Artwork
          </p>
          <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
            High-resolution PNG (transparent recommended), JPG, SVG, or vector logos.
          </p>
        </div>

        {/* Uploaded Graphic Status & Controls */}
        {uploadedGraphicUrl && (
          <div className="p-3 bg-neutral-950 rounded-xl border border-[#E5A914]/40 flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={uploadedGraphicUrl}
                alt="Uploaded Artwork"
                className="w-12 h-12 object-contain rounded bg-neutral-900 border border-neutral-800 p-1 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Custom Artwork Applied to 3D Model
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span>✓</span> Texture mapped to 3D T-shirt canvas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors text-xs flex items-center gap-1"
                  title="Remove uploaded graphic"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Remove</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
