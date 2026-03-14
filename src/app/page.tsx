'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const minimapCanvas = minimapRef.current;
    if (!canvas || !minimapCanvas) return;

    const ctx = canvas.getContext('2d');
    const minimapCtx = minimapCanvas.getContext('2d');
    if (!canvas || !minimapCanvas || !ctx || !minimapCtx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    minimapCanvas.width = 150;
    minimapCanvas.height = 150;

    let gameState: 'title' | 'playing' | 'paused' = 'title';
    const keys: Record<string, boolean> = {};
    let mouseX = width / 2, mouseY = height / 2;
    let lastTime = performance.now();
    let hintFadeStarted = false;

    const ship = {
      x: 0, y: 0, vx: 0, vy: 0, angle: 0, targetAngle: 0, thrust: 0, boosting: false
    };
    const camera = { x: 0, y: 0 };
    const worldSize = 100000;

    const stars: Array<{
      x: number; y: number; size: number;
      twinkle: number; twinkleSpeed: number;
      layer: number; speedMult: number;
      brightness: number; color: string;
    }> = [];

    const nebulae: Array<{
      x: number; y: number; radius: number;
      color1: string; color2: string;
      opacity: number; rotation: number; rotationSpeed: number;
    }> = [];

    const artifacts: Array<{ x: number; y: number; radius: number; pulse: number }> = [];
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }> = [];
    const warpLines: Array<{ x: number; y: number; length: number; angle: number; life: number }> = [];

    let artifactCount = 0;
    const screenShake = { x: 0, y: 0, intensity: 0 };

    function generateStars() {
      for (let layer = 0; layer < 3; layer++) {
        const count = 200 + layer * 150;
        const sizeRange = layer === 0 ? [0.5, 1.5] : layer === 1 ? [1, 2.5] : [1.5, 3.5];
        const speedMult = layer === 0 ? 0.1 : layer === 1 ? 0.3 : 0.6;
        const brightness = layer === 0 ? 0.3 : layer === 1 ? 0.6 : 1;
        for (let i = 0; i < count; i++) {
          stars.push({
            x: (Math.random() - 0.5) * worldSize,
            y: (Math.random() - 0.5) * worldSize,
            size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.5 + Math.random() * 2,
            layer,
            speedMult,
            brightness,
            color: ['#ffffff', '#ffe4c4', '#add8e6'][Math.floor(Math.random() * 3)]
          });
        }
      }
    }

    function generateNebulae() {
      for (let i = 0; i < 15; i++) {
        nebulae.push({
          x: (Math.random() - 0.5) * worldSize * 0.8,
          y: (Math.random() - 0.5) * worldSize * 0.8,
          radius: 300 + Math.random() * 500,
          color1: Math.random() > 0.5 ? '#1a0a2e' : '#0d1b2a',
          color2: Math.random() > 0.5 ? '#2d1b4e' : '#1a3a5c',
          opacity: 0.15 + Math.random() * 0.2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.0002
        });
      }
    }

    function spawnArtifact() {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 800;
      artifacts.push({
        x: ship.x + Math.cos(angle) * dist,
        y: ship.y + Math.sin(angle) * dist,
        radius: 15,
        pulse: Math.random() * Math.PI * 2
      });
    }

    function spawnInitialArtifacts() {
      for (let i = 0; i < 20; i++) spawnArtifact();
    }

    function updateShip(dt: number) {
      const acceleration = ship.boosting ? 800 : 400;
      const friction = 0.98;
      const maxSpeed = ship.boosting ? 500 : 250;

      ship.targetAngle = Math.atan2(mouseY - height / 2, mouseX - width / 2);
      let angleDiff = ship.targetAngle - ship.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      ship.angle += angleDiff * 5 * dt;

      ship.thrust = 0;
      if (keys['KeyW'] || keys['ArrowUp']) {
        ship.vx += Math.cos(ship.angle) * acceleration * dt;
        ship.vy += Math.sin(ship.angle) * acceleration * dt;
        ship.thrust = 1;
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        ship.vx -= Math.cos(ship.angle) * acceleration * 0.5 * dt;
        ship.vy -= Math.sin(ship.angle) * acceleration * 0.5 * dt;
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        ship.vx -= Math.cos(ship.angle - Math.PI / 2) * acceleration * 0.5 * dt;
        ship.vy -= Math.sin(ship.angle - Math.PI / 2) * acceleration * 0.5 * dt;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        ship.vx += Math.cos(ship.angle - Math.PI / 2) * acceleration * 0.5 * dt;
        ship.vy += Math.sin(ship.angle - Math.PI / 2) * acceleration * 0.5 * dt;
      }

      const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      if (speed > maxSpeed) {
        ship.vx = (ship.vx / speed) * maxSpeed;
        ship.vy = (ship.vy / speed) * maxSpeed;
      }

      ship.vx *= friction;
      ship.vy *= friction;
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      ship.x = Math.max(-worldSize / 2, Math.min(worldSize / 2, ship.x));
      ship.y = Math.max(-worldSize / 2, Math.min(worldSize / 2, ship.y));

      camera.x = ship.x - width / 2;
      camera.y = ship.y - height / 2;

      if (ship.thrust > 0 && Math.random() > 0.5) {
        const tailAngle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        particles.push({
          x: ship.x - Math.cos(ship.angle) * 20,
          y: ship.y - Math.sin(ship.angle) * 20,
          vx: Math.cos(tailAngle) * 50 + (Math.random() - 0.5) * 30,
          vy: Math.sin(tailAngle) * 50 + (Math.random() - 0.5) * 30,
          life: 1,
          size: 3 + Math.random() * 3,
          color: ship.boosting ? '#00ffcc' : '#7b68ee'
        });
      }

      if (ship.boosting && ship.thrust > 0 && Math.random() > 0.7) {
        warpLines.push({
          x: ship.x + (Math.random() - 0.5) * width,
          y: ship.y + (Math.random() - 0.5) * height,
          length: 50 + Math.random() * 100,
          angle: ship.angle + Math.PI / 2,
          life: 1
        });
      }

      while (artifacts.length < 25) spawnArtifact();
    }

    function updateArtifacts(dt: number) {
      for (let i = artifacts.length - 1; i >= 0; i--) {
        const art = artifacts[i];
        art.pulse += dt * 3;
        const dx = ship.x - art.x;
        const dy = ship.y - art.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < art.radius + 20) {
          artifactCount++;
          artifacts.splice(i, 1);
          screenShake.intensity = 10;
          for (let j = 0; j < 20; j++) {
            const angle = (Math.PI * 2 / 20) * j;
            particles.push({
              x: art.x, y: art.y,
              vx: Math.cos(angle) * 100 + (Math.random() - 0.5) * 50,
              vy: Math.sin(angle) * 100 + (Math.random() - 0.5) * 50,
              life: 1, size: 4 + Math.random() * 4, color: '#ff6b35'
            });
          }
        }
      }
    }

    function updateParticles(dt: number) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
        if (p.life <= 0) particles.splice(i, 1);
      }
      for (let i = warpLines.length - 1; i >= 0; i--) {
        warpLines[i].life -= dt * 3;
        if (warpLines[i].life <= 0) warpLines.splice(i, 1);
      }
      if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.5) {
          screenShake.intensity = 0;
          screenShake.x = 0;
          screenShake.y = 0;
        }
      }
    }

    function render() {
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(screenShake.x, screenShake.y);

      for (const neb of nebulae) {
        const screenX = neb.x - camera.x;
        const screenY = neb.y - camera.y;
        if (screenX < -neb.radius * 2 || screenX > width + neb.radius * 2 ||
            screenY < -neb.radius * 2 || screenY > height + neb.radius * 2) continue;
        neb.rotation += neb.rotationSpeed;
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(neb.rotation);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.radius);
        gradient.addColorStop(0, neb.color1);
        gradient.addColorStop(0.5, neb.color2);
        gradient.addColorStop(1, 'transparent');
        ctx.globalAlpha = neb.opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, neb.radius, neb.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const line of warpLines) {
        ctx.save();
        ctx.translate(line.x - camera.x, line.y - camera.y);
        ctx.rotate(line.angle);
        ctx.strokeStyle = `rgba(0, 255, 204, ${line.life * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-line.length / 2, 0);
        ctx.lineTo(line.length / 2, 0);
        ctx.stroke();
        ctx.restore();
      }

      for (const star of stars) {
        const parallax = 1 - star.speedMult;
        const screenX = (star.x - camera.x * parallax + width * 5) % (width + 200) - 100;
        const screenY = (star.y - camera.y * parallax + height * 5) % (height + 200) - 100;
        const twinkle = Math.sin(star.twinkle) * 0.3 + 0.7;
        star.twinkle += star.twinkleSpeed * 0.016;
        ctx.globalAlpha = star.brightness * twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
        ctx.fill();
        if (star.layer === 2 && star.brightness > 0.8) {
          ctx.globalAlpha = star.brightness * twinkle * 0.3;
          ctx.beginPath();
          ctx.arc(screenX, screenY, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      for (const art of artifacts) {
        const screenX = art.x - camera.x;
        const screenY = art.y - camera.y;
        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) continue;
        const pulse = Math.sin(art.pulse) * 0.3 + 1;
        const glowSize = art.radius * 2 * pulse;
        ctx.globalAlpha = 0.3;
        const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
        glowGradient.addColorStop(0, '#ff6b35');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(screenX, screenY, art.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, art.radius * 0.4 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      const shipScreenX = width / 2;
      const shipScreenY = height / 2;
      ctx.save();
      ctx.translate(shipScreenX, shipScreenY);
      ctx.rotate(ship.angle);

      if (ship.thrust > 0) {
        ctx.globalAlpha = 0.6;
        const engineGlow = ctx.createRadialGradient(-25, 0, 0, -25, 0, 30);
        engineGlow.addColorStop(0, ship.boosting ? '#00ffcc' : '#7b68ee');
        engineGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.arc(-25, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(-15, -12);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-15, 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.restore();
    }

    function renderMinimap() {
      minimapCtx.clearRect(0, 0, 150, 150);
      const scale = 150 / 600;
      minimapCtx.fillStyle = 'rgba(26, 10, 46, 0.5)';
      minimapCtx.beginPath();
      minimapCtx.arc(75, 75, 70, 0, Math.PI * 2);
      minimapCtx.fill();
      for (const art of artifacts) {
        const relX = (art.x - ship.x) * scale;
        const relY = (art.y - ship.y) * scale;
        if (Math.sqrt(relX * relX + relY * relY) < 70) {
          minimapCtx.fillStyle = '#ff6b35';
          minimapCtx.beginPath();
          minimapCtx.arc(75 + relX, 75 + relY, 3, 0, Math.PI * 2);
          minimapCtx.fill();
        }
      }
      minimapCtx.fillStyle = '#00ffcc';
      minimapCtx.shadowColor = '#00ffcc';
      minimapCtx.shadowBlur = 5;
      minimapCtx.beginPath();
      minimapCtx.arc(75, 75, 4, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
    }

    function updateHUD() {
      const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      const velocityEl = document.getElementById('velocity');
      const coordsEl = document.getElementById('coordinates');
      const artifactsEl = document.getElementById('artifacts');
      if (velocityEl) velocityEl.textContent = Math.round(speed).toString();
      if (coordsEl) coordsEl.textContent = `${Math.round(ship.x)}, ${Math.round(ship.y)}`;
      if (artifactsEl) artifactsEl.textContent = artifactCount.toString();
    }

    let animationId: number;

    function gameLoop(timestamp: number) {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      if (gameState === 'playing') {
        updateShip(dt);
        updateArtifacts(dt);
        updateParticles(dt);
        render();
        renderMinimap();
        updateHUD();

        if (!hintFadeStarted && (ship.thrust > 0 || Math.sqrt(ship.vx ** 2 + ship.vy ** 2) > 10)) {
          hintFadeStarted = true;
          setTimeout(() => {
            const hint = document.getElementById('controlsHint');
            if (hint) {
              hint.style.transition = 'opacity 3s ease';
              hint.style.opacity = '0';
            }
          }, 3000);
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
      gameState = 'playing';
    }

    function togglePause() {
      if (gameState === 'playing') {
        gameState = 'paused';
        const pausedOverlay = document.getElementById('pausedOverlay');
        if (pausedOverlay) pausedOverlay.classList.add('visible');
      } else if (gameState === 'paused') {
        gameState = 'playing';
        const pausedOverlay = document.getElementById('pausedOverlay');
        if (pausedOverlay) pausedOverlay.classList.remove('visible');
      }
    }

    function handleResize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'Space') startGame();
      if (e.code === 'Escape') togglePause();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') ship.boosting = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') ship.boosting = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (gameState === 'title') {
        startGame();
        return;
      }
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
      if (e.touches.length === 1) {
        keys['KeyW'] = true;
        ship.thrust = 1;
      } else if (e.touches.length === 2) {
        ship.boosting = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        keys['KeyW'] = false;
        ship.thrust = 0;
        ship.boosting = false;
      } else if (e.touches.length === 1) {
        ship.boosting = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'playing') togglePause();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    generateStars();
    generateNebulae();
    spawnInitialArtifacts();

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameStarted]);

  const startGame = useCallback(() => {
    setGameStarted(true);
  }, []);

  return (
    <main style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#030308' }}>
      <link 
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share+Tech+Mono&display=swap" 
        rel="stylesheet" 
      />
      
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', position: 'fixed', top: 0, left: 0 }} 
      />
      
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3, 3, 8, 0.8) 100%)',
        zIndex: 10
      }} />

      <div 
        id="titleScreen" 
        onClick={startGame}
        onTouchStart={(e) => { e.preventDefault(); startGame(); }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          display: gameStarted ? 'none' : 'flex',
          flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, cursor: 'pointer',
          background: 'radial-gradient(ellipse at center, rgba(26, 10, 46, 0.9) 0%, rgba(3, 3, 8, 0.98) 100%)'
        }}
      >
        <h1 style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 'clamp(36px, 8vw, 72px)', fontWeight: 700,
          color: '#fff',
          textShadow: '0 0 40px rgba(0, 255, 204, 0.6), 0 0 80px rgba(123, 104, 238, 0.4)',
          letterSpacing: '8px', marginBottom: '20px',
          animation: 'titlePulse 3s ease-in-out infinite'
        }}>COSMIC DRIFT</h1>
        <div style={{
          fontSize: '14px', color: '#7b68ee', letterSpacing: '6px', marginBottom: '60px'
        }}>AN INFINITE JOURNEY</div>
        <div style={{
          fontSize: '16px', color: '#c8d4e3', letterSpacing: '3px',
          animation: 'blink 2s ease-in-out infinite'
        }}>TAP OR PRESS SPACE TO LAUNCH</div>
      </div>

      <div id="pausedOverlay" style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 90, background: 'rgba(3, 3, 8, 0.7)',
        opacity: 0, pointerEvents: 'none', transition: 'opacity 0.3s ease'
      }}>
        <h2 style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: '48px',
          color: '#c8d4e3', letterSpacing: '10px',
          textShadow: '0 0 30px rgba(123, 104, 238, 0.5)'
        }}>PAUSED</h2>
      </div>

      <div id="hud" style={{
        position: 'fixed', top: 20, left: 20, zIndex: 20,
        color: '#c8d4e3', fontSize: 12, letterSpacing: 1,
        display: gameStarted ? 'block' : 'none'
      }}>
        <div style={{
          background: 'rgba(13, 27, 42, 0.6)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(123, 104, 238, 0.3)', borderRadius: 8,
          padding: '15px 20px',
          boxShadow: '0 0 20px rgba(123, 104, 238, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#7b68ee', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Velocity</div>
            <div id="velocity" style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 18,
              color: '#00ffcc', textShadow: '0 0 10px rgba(0, 255, 204, 0.5)'
            }}>0</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#7b68ee', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Coordinates</div>
            <div id="coordinates" style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 18,
              color: '#00ffcc', textShadow: '0 0 10px rgba(0, 255, 204, 0.5)'
            }}>0, 0</div>
          </div>
          <div>
            <div style={{ color: '#7b68ee', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Artifacts</div>
            <div id="artifacts" style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 18,
              color: '#00ffcc', textShadow: '0 0 10px rgba(0, 255, 204, 0.5)'
            }}>0</div>
          </div>
        </div>
      </div>

      <div id="minimap" style={{
        position: 'fixed', bottom: 20, right: 20,
        width: 150, height: 150, borderRadius: '50%',
        background: 'rgba(13, 27, 42, 0.7)',
        border: '1px solid rgba(123, 104, 238, 0.4)',
        boxShadow: '0 0 30px rgba(123, 104, 238, 0.2), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        zIndex: 20, overflow: 'hidden', display: gameStarted ? 'block' : 'none'
      }}>
        <canvas ref={minimapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div id="controlsHint" style={{
        position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, textAlign: 'center',
        color: 'rgba(200, 212, 227, 0.6)', fontSize: 11, letterSpacing: 2
      }}>
        <span className="desktop-controls">WASD or ARROWS to move &bull; MOUSE to aim &bull; SHIFT to boost</span>
        <span className="mobile-controls" style={{ display: 'none' }}>TOUCH to aim & thrust &bull; TWO FINGERS to boost</span>
      </div>

      <style jsx global>{`
        @keyframes titlePulse {
          0%, 100% { text-shadow: 0 0 40px rgba(0, 255, 204, 0.6), 0 0 80px rgba(123, 104, 238, 0.4); }
          50% { text-shadow: 0 0 60px rgba(0, 255, 204, 0.8), 0 0 120px rgba(123, 104, 238, 0.6); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px), (pointer: coarse) {
          .desktop-controls { display: none !important; }
          .mobile-controls { display: inline !important; }
        }
      `}</style>
    </main>
  );
}
