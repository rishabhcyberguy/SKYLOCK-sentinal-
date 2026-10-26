import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const TARGET_RADAR_URL = 'https://ais-dev-pvuh6g7dlsd6fhhvtdj5ql-785036556038.asia-southeast1.run.app/?view=radar';

export const TacticalDrone3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [telemetry, setTelemetry] = useState({ pitch: '+0.4°', roll: '-1.2°', alt: '1,420 M' });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 360;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL initialization fallback', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x182c38, 2.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf7f7f3, 3.2);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    const frontFillLight = new THREE.DirectionalLight(0xa5d8eb, 2.0);
    frontFillLight.position.set(-3, 4, 4);
    scene.add(frontFillLight);

    // Rim / cyber glow lights
    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 3.5);
    cyanRimLight.position.set(-4, -2, -4);
    scene.add(cyanRimLight);

    const greenAccentLight = new THREE.PointLight(0x00ff66, 3.0, 10);
    greenAccentLight.position.set(0, -0.6, 1.5);
    scene.add(greenAccentLight);

    // --- Materials ---
    const carbonHullMat = new THREE.MeshStandardMaterial({
      color: 0x242d35,
      roughness: 0.4,
      metalness: 0.7,
    });

    const stealthArmorMat = new THREE.MeshStandardMaterial({
      color: 0x33404c,
      roughness: 0.32,
      metalness: 0.8,
    });

    const canopyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0c2535,
      roughness: 0.12,
      metalness: 0.95,
      emissive: new THREE.Color(0x003847),
      emissiveIntensity: 0.4,
    });

    const goldSensorMat = new THREE.MeshStandardMaterial({
      color: 0xd7b23f,
      roughness: 0.2,
      metalness: 0.9,
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x485561,
      roughness: 0.4,
      metalness: 0.95,
    });

    const rotorBladeMat = new THREE.MeshStandardMaterial({
      color: 0x242e36,
      roughness: 0.3,
      metalness: 0.7,
    });

    const cyanGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });

    const greenGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.9,
    });

    const redGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0.9,
    });

    // --- Drone Group Hierarchy ---
    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // 1. Central Aerodynamic Stealth Fuselage
    // Main fuselage body (tapered faceted hexagonal body)
    const bodyGeom = new THREE.CylinderGeometry(0.38, 0.62, 2.2, 6);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeom, carbonHullMat);
    bodyMesh.scale.set(1.1, 0.45, 1);
    droneGroup.add(bodyMesh);

    // Upper avionics spine
    const spineGeom = new THREE.BoxGeometry(0.38, 0.22, 1.6);
    const spineMesh = new THREE.Mesh(spineGeom, stealthArmorMat);
    spineMesh.position.set(0, 0.16, -0.1);
    droneGroup.add(spineMesh);

    // Stealth cockpit / payload canopy
    const canopyGeom = new THREE.CylinderGeometry(0.24, 0.36, 1.1, 5);
    canopyGeom.rotateX(Math.PI / 2);
    const canopyMesh = new THREE.Mesh(canopyGeom, canopyGlassMat);
    canopyMesh.position.set(0, 0.18, 0.35);
    canopyMesh.scale.set(0.9, 0.5, 1);
    droneGroup.add(canopyMesh);

    // Nose radome & EO aperture cone
    const noseGeom = new THREE.ConeGeometry(0.34, 0.75, 6);
    noseGeom.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeom, stealthArmorMat);
    noseMesh.position.set(0, -0.02, 1.4);
    noseMesh.scale.set(1.1, 0.55, 1);
    droneGroup.add(noseMesh);

    // Pitot tube / tactical sensor probe
    const probeGeom = new THREE.CylinderGeometry(0.015, 0.02, 0.45, 8);
    probeGeom.rotateX(Math.PI / 2);
    const probeMesh = new THREE.Mesh(probeGeom, titaniumMat);
    probeMesh.position.set(0, 0, 1.95);
    droneGroup.add(probeMesh);

    // 2. Gimbal EO/IR Camera Turret (Under Nose)
    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, -0.22, 0.95);
    droneGroup.add(turretGroup);

    const turretBallGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const turretBallMesh = new THREE.Mesh(turretBallGeom, titaniumMat);
    turretGroup.add(turretBallMesh);

    const lensGeom = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 16);
    lensGeom.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeom, goldSensorMat);
    lensMesh.position.set(0.06, -0.02, 0.16);
    turretGroup.add(lensMesh);

    const flirLensGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.1, 16);
    flirLensGeom.rotateX(Math.PI / 2);
    const flirLensMesh = new THREE.Mesh(flirLensGeom, greenGlowMat);
    flirLensMesh.position.set(-0.06, -0.02, 0.16);
    turretGroup.add(flirLensMesh);

    // 3. Rotor Arms and Motor Pods (X4 Quadrotor VTOL Configuration)
    const armPositions = [
      { x: 1.15, z: 0.85, angle: 0.6 },   // Front Right
      { x: -1.15, z: 0.85, angle: -0.6 }, // Front Left
      { x: 1.35, z: -0.85, angle: 2.5 },  // Rear Right
      { x: -1.35, z: -0.85, angle: -2.5 },// Rear Left
    ];

    const rotorGroups: THREE.Group[] = [];

    armPositions.forEach((pos, idx) => {
      // Carbon diagonal arm strut
      const armLength = Math.hypot(pos.x, pos.z);
      const armGeom = new THREE.BoxGeometry(0.12, 0.08, armLength);
      const armMesh = new THREE.Mesh(armGeom, carbonHullMat);
      
      const armAngleY = Math.atan2(pos.x, pos.z);
      armMesh.position.set(pos.x / 2, 0.02, pos.z / 2);
      armMesh.rotation.y = armAngleY;
      droneGroup.add(armMesh);

      // Motor Nacelle (Housing)
      const nacelleGeom = new THREE.CylinderGeometry(0.16, 0.18, 0.32, 12);
      const nacelleMesh = new THREE.Mesh(nacelleGeom, titaniumMat);
      nacelleMesh.position.set(pos.x, 0.1, pos.z);
      droneGroup.add(nacelleMesh);

      // Rotor group (spinning part)
      const rotorGrp = new THREE.Group();
      rotorGrp.position.set(pos.x, 0.28, pos.z);

      // Motor hub cap
      const capGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 12);
      const capMesh = new THREE.Mesh(capGeom, stealthArmorMat);
      rotorGrp.add(capMesh);

      // Dual propeller blades
      const blade1Geom = new THREE.BoxGeometry(0.1, 0.015, 0.95);
      const blade1 = new THREE.Mesh(blade1Geom, rotorBladeMat);
      blade1.rotation.y = 0.1;
      rotorGrp.add(blade1);

      const blade2Geom = new THREE.BoxGeometry(0.1, 0.015, 0.95);
      const blade2 = new THREE.Mesh(blade2Geom, rotorBladeMat);
      blade2.rotation.y = Math.PI / 2 + 0.1;
      rotorGrp.add(blade2);

      // Aerodynamic rotor sweep glow ring
      const ringGeom = new THREE.RingGeometry(0.44, 0.48, 24);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeom, cyanGlowMat);
      ringMesh.position.y = -0.01;
      rotorGrp.add(ringMesh);

      droneGroup.add(rotorGrp);
      rotorGroups.push(rotorGrp);

      // Navigation LEDs on arm tips
      const ledGeom = new THREE.SphereGeometry(0.035, 8, 8);
      let ledMat = cyanGlowMat;
      if (pos.x > 0) ledMat = greenGlowMat; // Starboard green
      else if (pos.x < 0) ledMat = redGlowMat; // Port red
      const ledMesh = new THREE.Mesh(ledGeom, ledMat);
      ledMesh.position.set(pos.x, 0.02, pos.z);
      droneGroup.add(ledMesh);
    });

    // 4. Ventral Carbon Landing Skids
    const skidGeom = new THREE.CylinderGeometry(0.035, 0.035, 1.8, 8);
    skidGeom.rotateX(Math.PI / 2);
    
    // Left skid
    const leftSkid = new THREE.Mesh(skidGeom, titaniumMat);
    leftSkid.position.set(-0.48, -0.32, 0);
    droneGroup.add(leftSkid);

    // Right skid
    const rightSkid = new THREE.Mesh(skidGeom, titaniumMat);
    rightSkid.position.set(0.48, -0.32, 0);
    droneGroup.add(rightSkid);

    // Skid struts
    const strutGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8);
    [-0.48, 0.48].forEach((x) => {
      [-0.45, 0.45].forEach((z) => {
        const strut = new THREE.Mesh(strutGeom, carbonHullMat);
        strut.position.set(x, -0.16, z);
        droneGroup.add(strut);
      });
    });

    // 5. Tail Fin & Tactical Comms Antennas
    const finGeom = new THREE.BoxGeometry(0.04, 0.45, 0.5);
    const finMesh = new THREE.Mesh(finGeom, stealthArmorMat);
    finMesh.position.set(0, 0.32, -1.05);
    finMesh.rotation.x = -0.3;
    droneGroup.add(finMesh);

    const finLedGeom = new THREE.SphereGeometry(0.03, 8, 8);
    const finLed = new THREE.Mesh(finLedGeom, cyanGlowMat);
    finLed.position.set(0, 0.56, -1.22);
    droneGroup.add(finLed);

    // --- Interactive Mouse Tilt & Orbit State ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.25;
    let targetRotationY = -0.55;
    let currentRotationX = 0.25;
    let currentRotationY = -0.55;
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;

      if (isDragging) {
        const deltaX = e.clientX - previousPointerX;
        const deltaY = e.clientY - previousPointerY;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        previousPointerX = e.clientX;
        previousPointerY = e.clientY;
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      isDragging = true;
      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);

    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width || 600;
        height = entry.contentRect.height || 360;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    // --- Render Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // High RPM Rotor Rotation
      rotorGroups.forEach((rGrp, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1;
        rGrp.rotation.y += dir * 0.45;
      });

      // Airborne aerodynamic hover bobbing
      const hoverY = Math.sin(elapsedTime * 2.2) * 0.09;
      droneGroup.position.y = hoverY;

      // Gimbal camera tracking scan
      turretGroup.rotation.y = Math.sin(elapsedTime * 1.5) * 0.45 + mouseX * 0.4;
      turretGroup.rotation.x = -0.15 + Math.cos(elapsedTime * 1.8) * 0.15 - mouseY * 0.3;

      // Mouse interactive pitch/yaw or drag rotation
      if (!isDragging) {
        // Subtle bank towards cursor + auto patrol rotation
        targetRotationY += 0.0035;
        targetRotationX = 0.22 + mouseY * 0.35;
      }

      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      droneGroup.rotation.x = currentRotationX;
      droneGroup.rotation.y = currentRotationY;
      droneGroup.rotation.z = Math.sin(elapsedTime * 1.8) * 0.04 - mouseX * 0.15;

      // Update HUD telemetry values
      if (Math.floor(elapsedTime * 10) % 6 === 0) {
        const pitchVal = (droneGroup.rotation.x * 180) / Math.PI;
        const rollVal = (droneGroup.rotation.z * 180) / Math.PI;
        const pitchDeg = pitchVal.toFixed(1);
        const rollDeg = rollVal.toFixed(1);
        const altNum = 1420 + Math.round(hoverY * 50);
        setTelemetry({
          pitch: `${pitchVal > 0 ? '+' : ''}${pitchDeg}°`,
          roll: `${rollVal > 0 ? '+' : ''}${rollDeg}°`,
          alt: `${altNum.toLocaleString()} M`,
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Clean Up ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);

      // Dispose geometries
      [
        bodyGeom,
        spineGeom,
        canopyGeom,
        noseGeom,
        probeGeom,
        turretBallGeom,
        lensGeom,
        flirLensGeom,
        skidGeom,
        strutGeom,
        finGeom,
        finLedGeom,
      ].forEach((g) => g.dispose());

      // Dispose materials
      [
        carbonHullMat,
        stealthArmorMat,
        canopyGlassMat,
        goldSensorMat,
        titaniumMat,
        rotorBladeMat,
        cyanGlowMat,
        greenGlowMat,
        redGlowMat,
      ].forEach((m) => m.dispose());

      renderer.dispose();
    };
  }, []);

  return (
    <section
      className="tactical-drone-section relative my-8"
      id="tactical-drone-section"
      aria-label="3D Tactical Drone Reconnaissance Model"
    >
      {/* Clickable Card Link to Target Radar View */}
      <a
        href={TARGET_RADAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block group relative overflow-hidden rounded border border-[#1b5961] bg-[#050f14]/90 hover:border-[#00ff66] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.6)] cursor-pointer text-decoration-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Click to launch Operational Radar view"
      >
        {/* Top Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#1b5961]/50 bg-[#071922]/80">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#00ff66]/15 border border-[#00ff66]/60 text-[#00ff66] text-xs font-mono font-bold">
              ✈
            </span>
            <div>
              <div className="text-[10px] font-mono font-bold tracking-widest text-[#00ff66] flex items-center gap-2">
                <span>TACTICAL UAV RECON / AX-204 RAVEN</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse"></span>
                <span className="text-[9px] text-[#72dbc2] font-normal uppercase hidden sm:inline">
                  PBR 3D AVIONICS VECTOR
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#8aa0a8] m-0">
                AERIAL SURVEILLANCE DRONE · CLICK ANYWHERE TO LAUNCH OPERATIONAL RADAR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#04141b] border border-[#1b5961] text-[#72dbc2] text-[10px] font-mono tracking-wider">
              DRAG TO ROTATE 360°
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#00ff66]/10 border border-[#00ff66] text-[#00ff66] group-hover:bg-[#00ff66] group-hover:text-[#050505] text-[11px] font-mono font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(0,255,102,0.25)]">
              <span>LAUNCH RADAR VIEW</span>
              <span className="font-black">↗</span>
            </div>
          </div>
        </div>

        {/* 3D Canvas Viewport - Sized 'just a little small from Operational radar' */}
        {/* Operational radar is h-[320px] sm:h-[420px] md:h-[500px]; here we set h-[270px] sm:h-[350px] md:h-[410px] */}
        <div
          ref={containerRef}
          className="relative w-full h-[270px] sm:h-[350px] md:h-[410px] bg-gradient-to-b from-[#030d12] via-[#05141c] to-[#02090d] overflow-hidden select-none"
        >
          {/* Subtle Grid Backdrop */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0, 255, 102, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.15) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Three.js Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

          {/* Tactical HUD Overlay Elements */}
          <div className="absolute top-3 left-4 pointer-events-none font-mono text-[10px] space-y-1 text-[#72dbc2]/90">
            <div className="flex items-center gap-1.5 text-[#00ff66] font-bold">
              <span className="w-1.5 h-1.5 bg-[#00ff66] rounded-full inline-block"></span>
              <span>LIVE TELEMETRY FEED</span>
            </div>
            <div>PITCH: <span className="text-white">{telemetry.pitch}</span></div>
            <div>ROLL: <span className="text-white">{telemetry.roll}</span></div>
            <div>ALT: <span className="text-white">{telemetry.alt}</span></div>
          </div>

          <div className="absolute top-3 right-4 pointer-events-none font-mono text-[10px] space-y-1 text-right text-[#72dbc2]/90">
            <div className="text-[#00ff66] font-bold">AVIONICS STATUS: NOMINAL</div>
            <div>SENSOR: <span className="text-white">FLIR EO/IR GIMBAL</span></div>
            <div>LINK: <span className="text-white">AES-256 ENCRYPTED</span></div>
            <div>UPLINK: <span className="text-[#00ff66]">SYNCHRONIZED (99.8%)</span></div>
          </div>

          {/* Central Target Reticle HUD on Hover */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${
              isHovered ? 'scale-105 opacity-90' : 'scale-95 opacity-40'
            }`}
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 border border-[#00ff66]/40 rounded-full flex items-center justify-center relative">
              <div className="absolute -top-1 w-2 h-0.5 bg-[#00ff66]"></div>
              <div className="absolute -bottom-1 w-2 h-0.5 bg-[#00ff66]"></div>
              <div className="absolute -left-1 w-0.5 h-2 bg-[#00ff66]"></div>
              <div className="absolute -right-1 w-0.5 h-2 bg-[#00ff66]"></div>
              <div className="w-2 h-2 rounded-full bg-[#00ff66]/70"></div>
            </div>
            <div className="text-center font-mono text-[9px] text-[#00ff66] font-bold tracking-widest mt-2 uppercase">
              {isHovered ? 'TARGET LOCKED · CLICK TO ENTER RADAR' : 'AX-204 RECON UAV'}
            </div>
          </div>

          {/* Bottom HUD Bar */}
          <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex flex-wrap items-center justify-between text-[10px] font-mono text-[#8aa0a8] border-t border-[#1b5961]/40 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-[#00ff66]">● AUTONOMOUS LOITER PATROL</span>
              <span className="hidden sm:inline">COORDINATES: N 28° 36.44′ · E 77° 12.05′</span>
            </div>
            <div className="flex items-center gap-2 text-[#72dbc2]">
              <span className="text-[11px] font-bold group-hover:text-[#00ff66] transition-colors">
                URL: ais-dev.../?view=radar ↗
              </span>
            </div>
          </div>
        </div>
      </a>
    </section>
  );
};
