import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, Eye, Sparkles, ZoomIn, ZoomOut, Check, Palette } from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Stealth Black', hex: '#0f172a', textHex: '#10b981', label: 'Hitam' },
  { name: 'Garuda Red', hex: '#991b1b', textHex: '#ffffff', label: 'Merah' },
  { name: 'Ocean Navy', hex: '#1e3a8a', textHex: '#38bdf8', label: 'Navy' },
  { name: 'Forest Emerald', hex: '#064e3b', textHex: '#fbbf24', label: 'Hijau' },
  { name: 'Pure White', hex: '#f8fafc', textHex: '#0f172a', label: 'Putih' },
];

const ACCENT_PRESETS = [
  { name: 'Neon Emerald', hex: '#10b981' },
  { name: 'Varsity Gold', hex: '#fbbf24' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Electric Cyan', hex: '#38bdf8' },
  { name: 'Bold Crimson', hex: '#ef4444' },
];

export default function Jersey3DViewer({
  customName = 'DUJANAH',
  customNumber = '10',
  customCollar = 'O-Neck',
  customTeam = '',
  selectedSize = 'M',
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const jerseyGroupRef = useRef(null);
  const collarMeshRef = useRef(null);
  const textureCanvasRef = useRef(null);
  const dynamicTextureRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Studio UI states
  const [activeColor, setActiveColor] = useState(COLOR_PRESETS[0]);
  const [activeAccent, setActiveAccent] = useState(ACCENT_PRESETS[0]);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [activeAnglePreset, setActiveAnglePreset] = useState('back'); // 'front' | 'back' | 'side'

  // Target rotation for smooth interpolation when preset buttons are clicked
  const targetRotationYRef = useRef(Math.PI); // Start facing back to show nameset

  // ==========================================
  // 1. DYNAMIC SUBLIMATION TEXTURE GENERATOR
  // ==========================================
  const updateDynamicTexture = useCallback(() => {
    if (!textureCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      textureCanvasRef.current = canvas;
    }

    const canvas = textureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // A. Base Fabric Color
    ctx.fillStyle = activeColor.hex;
    ctx.fillRect(0, 0, W, H);

    // B. Breathable Jacquard Fabric Pattern (Micro-Mesh Grid)
    ctx.fillStyle = activeColor.hex === '#f8fafc' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.035)';
    const dotSpacing = 8;
    for (let x = 0; x < W; x += dotSpacing) {
      for (let y = 0; y < H; y += dotSpacing) {
        ctx.fillRect(x + (y % (dotSpacing * 2) === 0 ? dotSpacing / 2 : 0), y, 2, 2);
      }
    }

    // C. Athletic Sublimation Side Stripes & Raglan Accents
    ctx.strokeStyle = activeAccent.hex;
    ctx.lineWidth = 14;
    ctx.globalAlpha = 0.85;

    // Left side panel accent (x ~ 512)
    ctx.beginPath();
    ctx.moveTo(500, 150);
    ctx.lineTo(500, H - 50);
    ctx.stroke();

    // Right side panel accent (x ~ 1536)
    ctx.beginPath();
    ctx.moveTo(1548, 150);
    ctx.lineTo(1548, H - 50);
    ctx.stroke();

    ctx.globalAlpha = 1.0;

    // D. FRONT ZONE (Centered at X = 1024)
    const frontCenterX = 1024;
    
    // Front Sponsor / Team Name across chest
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = activeAccent.hex;
    ctx.font = 'bold 54px "Arial Black", Impact, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    const teamDisplay = customTeam ? customTeam.toUpperCase() : 'REGARSPORT INDONESIA';
    ctx.fillText(teamDisplay, frontCenterX, 520);

    // Left Chest Club Badge (Shield Crest)
    const crestX = frontCenterX - 240;
    const crestY = 320;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = activeAccent.hex;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(crestX - 45, crestY - 40);
    ctx.lineTo(crestX + 45, crestY - 40);
    ctx.lineTo(crestX + 45, crestY + 15);
    ctx.quadraticCurveTo(crestX, crestY + 55, crestX, crestY + 60);
    ctx.quadraticCurveTo(crestX, crestY + 55, crestX - 45, crestY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crest Monogram "RS"
    ctx.fillStyle = activeAccent.hex;
    ctx.font = 'black 34px "Arial Black", sans-serif';
    ctx.fillText('RS', crestX, crestY + 8);

    // Star above crest
    ctx.font = '22px sans-serif';
    ctx.fillText('★', crestX, crestY - 50);

    // Right Chest Small Number
    if (customNumber) {
      const numX = frontCenterX + 240;
      const numY = 320;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px "Impact", "Arial Black", sans-serif';
      ctx.fillText(`#${customNumber}`, numX, numY);
    }

    // Authentic Sublimation Label Tag at bottom hem
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(frontCenterX - 350, H - 120, 150, 42);
    ctx.strokeStyle = activeAccent.hex;
    ctx.lineWidth = 2;
    ctx.strokeRect(frontCenterX - 350, H - 120, 150, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('REGARSPORT', frontCenterX - 275, H - 105);
    ctx.fillStyle = activeAccent.hex;
    ctx.font = '12px monospace';
    ctx.fillText(`SIZE: ${selectedSize}`, frontCenterX - 275, H - 90);


    // E. BACK ZONE (Split across X = 0..512 and X = 1536..2048, Center at X = 0 / 2048)
    const drawBackItem = (drawFn) => {
      ctx.save();
      drawFn(0);
      ctx.restore();
      ctx.save();
      drawFn(W);
      ctx.restore();
    };

    // 1. Nameset (Nama Punggung)
    drawBackItem((cx) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = activeAccent.hex;
      ctx.font = 'bold 84px "Arial Black", Impact, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.letterSpacing = '8px';
      const nameDisplay = customName ? customName.toUpperCase() : 'REGARSPORT';
      ctx.fillText(nameDisplay, cx, 280);
    });

    // 2. Big Athletic Back Number (Nomor Punggung Varsity)
    drawBackItem((cx) => {
      const numberDisplay = customNumber || '10';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 360px "Impact", "Arial Black", sans-serif';
      
      // Shadow & outer stroke for high-contrast visibility
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 28;
      ctx.strokeText(numberDisplay, cx, 550);

      // Inner fill
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(numberDisplay, cx, 550);

      // Inner accent inline stripe
      ctx.strokeStyle = activeAccent.hex;
      ctx.lineWidth = 8;
      ctx.strokeText(numberDisplay, cx, 550);
    });

    // 3. Lower Back Sublimation Slogan
    drawBackItem((cx) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 24px monospace';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('FACTORY DIRECT • WONOGIRI INDONESIA', cx, 860);
    });

    // Notify Three.js texture to update on GPU
    if (dynamicTextureRef.current) {
      dynamicTextureRef.current.needsUpdate = true;
    }
  }, [activeColor, activeAccent, customName, customNumber, customTeam, selectedSize]);

  // ==========================================
  // 2. THREE.JS SCENE INITIALIZATION & MESHES
  // ==========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Perspective Camera
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 5.2);
    cameraRef.current = camera;

    // WebGL Renderer with Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 7.0;
    controls.minPolarAngle = Math.PI / 4.2;
    controls.maxPolarAngle = Math.PI / 1.75;
    controlsRef.current = controls;

    // ==========================================
    // STUDIO 3-POINT LIGHTING SETUP
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3.5, 4.0, 4.0);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5f3fc, 1.1);
    fillLight.position.set(-4.0, 2.0, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x6ee7b7, 2.5);
    rimLight.position.set(0, 4.5, -4.5);
    scene.add(rimLight);

    // ==========================================
    // 3D PROCEDURAL ATHLETIC JERSEY MESH
    // ==========================================
    const jerseyGroup = new THREE.Group();
    jerseyGroup.position.y = 0.05;
    jerseyGroup.rotation.y = targetRotationYRef.current;
    scene.add(jerseyGroup);
    jerseyGroupRef.current = jerseyGroup;

    // Offscreen Dynamic Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    textureCanvasRef.current = canvas;

    const dynamicTexture = new THREE.CanvasTexture(canvas);
    dynamicTexture.colorSpace = THREE.SRGBColorSpace;
    dynamicTexture.wrapS = THREE.RepeatWrapping;
    dynamicTexture.wrapT = THREE.ClampToEdgeWrapping;
    dynamicTextureRef.current = dynamicTexture;

    // Realistic Athletic Fabric Material
    const jerseyMaterial = new THREE.MeshStandardMaterial({
      map: dynamicTexture,
      roughness: 0.62,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // A. TORSO: Athletic Tapered Cylinder
    const torsoGeometry = new THREE.CylinderGeometry(1.15, 0.94, 2.7, 64, 1, true);
    const torsoMesh = new THREE.Mesh(torsoGeometry, jerseyMaterial);
    torsoMesh.scale.set(1.0, 1.0, 0.56);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    jerseyGroup.add(torsoMesh);

    // B. RIGHT SLEEVE
    const sleeveGeometry = new THREE.CylinderGeometry(0.42, 0.35, 1.35, 32);
    const rightSleeve = new THREE.Mesh(sleeveGeometry, jerseyMaterial);
    rightSleeve.position.set(1.36, 0.72, 0);
    rightSleeve.rotation.z = -Math.PI / 3.4;
    rightSleeve.rotation.y = 0.12;
    rightSleeve.scale.set(1.0, 1.0, 0.72);
    jerseyGroup.add(rightSleeve);

    // Right Sleeve Cuff
    const cuffGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.14, 32);
    const cuffMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeAccent.hex),
      roughness: 0.5,
    });
    const rightCuff = new THREE.Mesh(cuffGeo, cuffMat);
    rightCuff.position.set(1.85, 0.38, 0.05);
    rightCuff.rotation.z = -Math.PI / 3.4;
    jerseyGroup.add(rightCuff);

    // C. LEFT SLEEVE
    const leftSleeve = new THREE.Mesh(sleeveGeometry, jerseyMaterial);
    leftSleeve.position.set(-1.36, 0.72, 0);
    leftSleeve.rotation.z = Math.PI / 3.4;
    leftSleeve.rotation.y = -0.12;
    leftSleeve.scale.set(1.0, 1.0, 0.72);
    jerseyGroup.add(leftSleeve);

    // Left Sleeve Cuff
    const leftCuff = new THREE.Mesh(cuffGeo, cuffMat);
    leftCuff.position.set(-1.85, 0.38, 0.05);
    leftCuff.rotation.z = Math.PI / 3.4;
    jerseyGroup.add(leftCuff);

    // D. BOTTOM WAIST HEM
    const hemGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.09, 48);
    const hemMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeColor.hex),
      roughness: 0.6,
    });
    const bottomHem = new THREE.Mesh(hemGeo, hemMat);
    bottomHem.position.y = -1.35;
    bottomHem.scale.set(1.0, 1.0, 0.56);
    jerseyGroup.add(bottomHem);

    // E. DYNAMIC COLLAR
    const collarGroup = new THREE.Group();
    collarMeshRef.current = collarGroup;
    jerseyGroup.add(collarGroup);

    // F. SOFT CIRCULAR FLOOR SHADOW
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.65;
    scene.add(shadowMesh);

    // ==========================================
    // ANIMATION LOOP WITH SMOOTH INTERPOLATION
    // ==========================================
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (jerseyGroupRef.current) {
        if (isAutoRotate) {
          jerseyGroupRef.current.rotation.y += delta * 0.9;
        } else {
          const currentY = jerseyGroupRef.current.rotation.y;
          const targetY = targetRotationYRef.current;
          jerseyGroupRef.current.rotation.y = THREE.MathUtils.lerp(currentY, targetY, 0.08);
        }

        const elapsedTime = clock.getElapsedTime();
        jerseyGroupRef.current.position.y = 0.05 + Math.sin(elapsedTime * 1.8) * 0.035;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ==========================================
    // RESIZE OBSERVER
    // ==========================================
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Initial texture draw
    updateDynamicTexture();

    // CLEANUP
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      torsoGeometry.dispose();
      sleeveGeometry.dispose();
      cuffGeo.dispose();
      hemGeo.dispose();
      jerseyMaterial.dispose();
      dynamicTexture.dispose();
    };
  }, []);

  // Update texture whenever inputs change
  useEffect(() => {
    updateDynamicTexture();
  }, [updateDynamicTexture]);

  // Update 3D Collar geometry when customCollar or colors change
  useEffect(() => {
    if (!collarMeshRef.current) return;
    const collarGroup = collarMeshRef.current;

    while (collarGroup.children.length > 0) {
      const obj = collarGroup.children[0];
      collarGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    const collarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeAccent.hex),
      roughness: 0.55,
      metalness: 0.1,
    });

    if (customCollar === 'V-Neck') {
      const leftVGeo = new THREE.BoxGeometry(0.12, 0.52, 0.09);
      const leftVMesh = new THREE.Mesh(leftVGeo, collarMat);
      leftVMesh.position.set(-0.2, 1.22, 0.28);
      leftVMesh.rotation.z = -Math.PI / 4.8;
      leftVMesh.rotation.x = -0.15;
      collarGroup.add(leftVMesh);

      const rightVMesh = new THREE.Mesh(leftVGeo, collarMat);
      rightVMesh.position.set(0.2, 1.22, 0.28);
      rightVMesh.rotation.z = Math.PI / 4.8;
      rightVMesh.rotation.x = -0.15;
      collarGroup.add(rightVMesh);

      const backRingGeo = new THREE.TorusGeometry(0.48, 0.07, 16, 32, Math.PI);
      const backRing = new THREE.Mesh(backRingGeo, collarMat);
      backRing.rotation.x = -Math.PI / 2.2;
      backRing.position.set(0, 1.35, -0.05);
      collarGroup.add(backRing);
    } else if (customCollar === 'Kerah Polo') {
      const flapGeo = new THREE.BoxGeometry(0.38, 0.22, 0.08);
      const leftFlap = new THREE.Mesh(flapGeo, collarMat);
      leftFlap.position.set(-0.32, 1.34, 0.26);
      leftFlap.rotation.z = -0.22;
      leftFlap.rotation.y = 0.3;
      collarGroup.add(leftFlap);

      const rightFlap = new THREE.Mesh(flapGeo, collarMat);
      rightFlap.position.set(0.32, 1.34, 0.26);
      rightFlap.rotation.z = 0.22;
      rightFlap.rotation.y = -0.3;
      collarGroup.add(rightFlap);

      const placketGeo = new THREE.BoxGeometry(0.18, 0.45, 0.06);
      const placketMesh = new THREE.Mesh(placketGeo, collarMat);
      placketMesh.position.set(0, 1.08, 0.29);
      collarGroup.add(placketMesh);

      const poloBackGeo = new THREE.TorusGeometry(0.5, 0.09, 16, 32, Math.PI);
      const poloBack = new THREE.Mesh(poloBackGeo, collarMat);
      poloBack.rotation.x = -Math.PI / 2.2;
      poloBack.position.set(0, 1.36, -0.05);
      collarGroup.add(poloBack);
    } else {
      const oNeckGeo = new THREE.TorusGeometry(0.48, 0.085, 16, 48);
      const oNeckMesh = new THREE.Mesh(oNeckGeo, collarMat);
      oNeckMesh.position.set(0, 1.36, 0.02);
      oNeckMesh.rotation.x = Math.PI / 2.08;
      oNeckMesh.scale.set(1.0, 1.0, 0.75);
      collarGroup.add(oNeckMesh);
    }
  }, [customCollar, activeAccent]);

  // ==========================================
  // PRESET CAMERA ROTATION HANDLERS
  // ==========================================
  const rotateTo = (angle, presetKey) => {
    setIsAutoRotate(false);
    setActiveAnglePreset(presetKey);
    targetRotationYRef.current = angle;
  };

  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const newZ = THREE.MathUtils.clamp(cam.position.z + delta, 3.2, 6.8);
    cam.position.z = newZ;
    controlsRef.current.update();
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col items-center">
      {/* Top Header Controls Bar */}
      <div className="w-full px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-slate-800/80 z-10 bg-slate-950/70 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
            3D Studio 360°
          </span>
          <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
            • WebGL Sublimasi
          </span>
        </div>

        {/* View Angle Preset Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => rotateTo(Math.PI, 'back')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeAnglePreset === 'back' && !isAutoRotate
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Belakang
          </button>
          <button
            type="button"
            onClick={() => rotateTo(0, 'front')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeAnglePreset === 'front' && !isAutoRotate
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Depan
          </button>
          <button
            type="button"
            onClick={() => rotateTo(Math.PI / 2, 'side')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeAnglePreset === 'side' && !isAutoRotate
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Samping
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            title="Auto-Rotate 360 Showcase"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isAutoRotate
                ? 'bg-emerald-500 text-slate-950 shadow-xs animate-pulse'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RotateCw size={13} className={isAutoRotate ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-80 sm:h-96 relative cursor-grab active:cursor-grabbing select-none"
        title="Klik dan tahan untuk memutar 360°, scroll untuk zoom"
      />

      {/* Floating Interactive Gesture Hint */}
      <div className="absolute bottom-16 left-3 pointer-events-none z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-xs text-[10px] text-slate-300 font-mono shadow-md">
        <Sparkles size={11} className="text-emerald-400" />
        <span>Geser mouse / sentuh untuk putar 360°</span>
      </div>

      {/* Zoom Controls Overlay (Bottom Right) */}
      <div className="absolute bottom-16 right-3 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition backdrop-blur-xs cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition backdrop-blur-xs cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
      </div>

      {/* Bottom Color Palette Bar */}
      <div className="w-full px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 z-10 text-xs">
        {/* Base Jersey Color Options */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <Palette size={12} className="text-emerald-400" />
            <span>Kain:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => setActiveColor(color)}
                title={color.name}
                style={{ backgroundColor: color.hex }}
                className={`w-5 h-5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                  activeColor.hex === color.hex
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-110'
                    : 'border-slate-600 hover:scale-105'
                }`}
              >
                {activeColor.hex === color.hex && (
                  <Check
                    size={10}
                    className={color.hex === '#f8fafc' ? 'text-slate-900' : 'text-white'}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accent / Nameset Color Options */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Sablon:
          </span>
          <div className="flex items-center gap-1.5">
            {ACCENT_PRESETS.map((accent) => (
              <button
                key={accent.hex}
                type="button"
                onClick={() => setActiveAccent(accent)}
                title={accent.name}
                style={{ backgroundColor: accent.hex }}
                className={`w-4 h-4 rounded-full border transition cursor-pointer flex items-center justify-center ${
                  activeAccent.hex === accent.hex
                    ? 'border-white ring-2 ring-white/40 scale-110'
                    : 'border-slate-600 hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
