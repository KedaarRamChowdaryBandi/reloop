/* ==========================================================================
   RELOOP DYNAMIC BACKGROUND ENGINE v3
   Cognizance-inspired: starfield, mouse trail, nebula glow, gravitational
   particles, energy beams, click bursts — NOW WITH SCROLL-REACTIVE MOTION
   Parallax depth, scroll-speed ripples, scroll particle waves, nebula shift
   Green Eco-Tech Theme (#00FFC0 / #10B981 / #040912)
   ========================================================================== */

(function () {
    const canvas = document.getElementById('reloop-dither-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    let particles = [];
    let stars = [];
    let mouseTrail = [];
    let clickBursts = [];
    let scrollRipples = [];
    let nebulae = [];
    let time = 0;

    // Mouse / Touch state
    const mouse = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        radius: 260,
        isActive: false,
        scrollSpeed: 0,
        velocityX: 0,
        velocityY: 0,
        lastX: window.innerWidth / 2,
        lastY: window.innerHeight / 2
    };

    // Scroll state — drives most new effects
    const scroll = {
        y: 0,
        lastY: 0,
        speed: 0,           // Current speed (smoothed)
        rawSpeed: 0,        // Instantaneous speed
        direction: 0,       // -1 up, 1 down, 0 still
        progress: 0,        // 0→1 normalized page scroll progress
        maxScroll: 1,
        intensity: 0        // 0→1 how fast we're scrolling right now
    };

    const PARTICLE_COUNT = 120;
    const STAR_COUNT = 200;
    const TRAIL_LENGTH = 30;
    const MAX_DISTANCE = 180;
    const NEBULA_COUNT = 4;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        scroll.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        initStars();
        initNebulae();
    }

    // ==========================================================================
    // STARFIELD — Parallax depth stars, drift on scroll
    // ==========================================================================

    class Star {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 3 + 0.3;       // Depth layer
            this.baseAlpha = Math.random() * 0.7 + 0.2;
            this.alpha = this.baseAlpha;
            this.size = Math.random() * 1.8 + 0.3;
            this.twinkleSpeed = Math.random() * 0.03 + 0.005;
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.parallaxFactor = this.z * 0.15;      // Deeper stars move less
            this.scrollOffsetY = 0;
        }

        update() {
            this.twinklePhase += this.twinkleSpeed;
            this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.3;

            // SCROLL PARALLAX — Stars shift vertically at depth-dependent rate
            this.scrollOffsetY = scroll.y * this.parallaxFactor;
            const drawY = ((this.y - this.scrollOffsetY) % height + height) % height;

            // Mouse parallax
            if (mouse.isActive) {
                const dx = (mouse.x - width / 2) * 0.006 * this.z;
                const dy = (mouse.y - height / 2) * 0.006 * this.z;
                this.x += dx * 0.01;
                this.y += dy * 0.01;
            }

            // Wrap
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;

            // Scroll speed brightens stars
            this.alpha += Math.abs(scroll.speed) * 0.008;
        }

        draw() {
            const drawY = ((this.y - this.scrollOffsetY) % height + height) % height;
            const glowBoost = Math.min(1, Math.abs(scroll.speed) * 0.015);

            ctx.beginPath();
            ctx.arc(this.x, drawY, this.size * this.z, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 240, 255, ${Math.max(0, Math.min(1, this.alpha))})`;
            ctx.fill();

            // Star glow — intensifies on scroll
            if (this.z > 1.5 || glowBoost > 0.3) {
                ctx.beginPath();
                ctx.arc(this.x, drawY, this.size * this.z * (2.5 + glowBoost * 2), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 192, ${Math.max(0, this.alpha * (0.12 + glowBoost * 0.15))})`;
                ctx.fill();
            }
        }
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }
    }

    // ==========================================================================
    // NEBULA GLOW — Drifts with scroll, colors shift by depth
    // ==========================================================================

    function initNebulae() {
        nebulae = [];
        const baseColors = [
            { r: 0, g: 255, b: 192 },    // Mint
            { r: 6, g: 182, b: 212 },     // Cyan
            { r: 16, g: 185, b: 129 },    // Emerald
            { r: 52, g: 211, b: 153 },    // Lime
        ];
        for (let i = 0; i < NEBULA_COUNT; i++) {
            nebulae.push({
                x: Math.random() * width,
                y: Math.random() * height,
                baseX: Math.random() * width,
                baseY: Math.random() * height,
                radius: 200 + Math.random() * 250,
                baseColor: baseColors[i % baseColors.length],
                alpha: 0.025 + Math.random() * 0.02,
                driftSpeed: 0.002 + Math.random() * 0.003,
                phase: Math.random() * Math.PI * 2,
                scrollFactor: 0.05 + Math.random() * 0.1   // Each nebula reacts differently to scroll
            });
        }
    }

    function drawNebulae() {
        const scrollNorm = scroll.progress; // 0→1

        for (let n of nebulae) {
            n.phase += n.driftSpeed;

            // Scroll-driven vertical drift — each nebula drifts at its own rate
            const scrollDrift = scroll.y * n.scrollFactor;
            n.x = n.baseX + Math.sin(n.phase) * 40 + scroll.speed * 2;
            n.y = n.baseY + Math.cos(n.phase * 0.7) * 30 - scrollDrift * 0.3;

            // Scroll-driven color shift — hue shifts deeper as you scroll
            const hueShift = scrollNorm * 30;
            const c = n.baseColor;
            const shiftedR = Math.min(255, c.r + hueShift);
            const shiftedG = Math.max(0, c.g - hueShift * 0.5);
            const shiftedB = Math.min(255, c.b + hueShift * 0.3);

            // Scroll speed intensifies nebula
            const alphaBoost = Math.abs(scroll.speed) * 0.002;

            const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
            grad.addColorStop(0, `rgba(${shiftedR}, ${shiftedG}, ${shiftedB}, ${(n.alpha + alphaBoost) * 1.5})`);
            grad.addColorStop(0.4, `rgba(${shiftedR}, ${shiftedG}, ${shiftedB}, ${(n.alpha + alphaBoost) * 0.6})`);
            grad.addColorStop(1, `rgba(${shiftedR}, ${shiftedG}, ${shiftedB}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // ==========================================================================
    // SCROLL RIPPLES — Concentric waves emanate from center on scroll
    // ==========================================================================

    class ScrollRipple {
        constructor() {
            this.x = width / 2;
            this.y = height / 2;
            this.radius = 10;
            this.maxRadius = Math.max(width, height) * 0.8;
            this.alpha = Math.min(1, Math.abs(scroll.speed) * 0.06);
            this.hue = scroll.speed > 0 ? 160 : 180;  // Down=green, Up=cyan
        }

        update() {
            this.radius += 6 + Math.abs(scroll.speed) * 0.3;
            this.alpha -= 0.008;
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 75%, ${this.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${this.hue}, 100%, 75%, 0.5)`;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // ==========================================================================
    // PARTICLES — Scroll-reactive displacement + wave distortion
    // ==========================================================================

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseX = this.x;
            this.baseY = this.y;
            this.z = Math.random() * 2.5 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.6 * this.z;
            this.vy = (Math.random() - 0.5) * 0.6 * this.z;
            this.baseRadius = Math.random() * 2.8 + 1;
            this.radius = this.baseRadius;
            this.alpha = Math.random() * 0.5 + 0.3;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = Math.random() * 0.02 + 0.008;
            this.scrollWavePhase = Math.random() * Math.PI * 2;
        }

        update() {
            // Natural drift
            this.x += this.vx;
            this.y += this.vy;

            // SCROLL WAVE DISTORTION — sine wave displacement on scroll
            const scrollWave = Math.sin(this.y * 0.008 + time * 2 + this.scrollWavePhase) * scroll.speed * 0.5;
            this.x += scrollWave * this.z;

            // SCROLL PUSH — particles drift in scroll direction
            this.y -= scroll.speed * 0.3 * this.z;

            // Edge wrapping
            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;
            if (this.y < -10) this.y = height + 10;
            if (this.y > height + 10) this.y = -10;

            // Orbital pulse
            this.angle += this.speed;
            this.radius = this.baseRadius + Math.sin(this.angle) * 0.8;

            // SCROLL SPEED — particles expand and glow faster on scroll
            this.radius += Math.abs(scroll.speed) * 0.02;
            this.alpha = Math.min(1, this.alpha + Math.abs(scroll.speed) * 0.001);

            // MOUSE GRAVITATIONAL ATTRACTION
            if (mouse.isActive) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius) {
                    let force = (mouse.radius - dist) / mouse.radius;
                    let ease = force * force;
                    this.x += (dx / dist) * ease * 4.5;
                    this.y += (dy / dist) * ease * 4.5;
                    this.alpha = Math.min(1.0, 0.3 + ease * 0.7);
                    this.vx += mouse.velocityX * 0.02 * force;
                    this.vy += mouse.velocityY * 0.02 * force;
                } else {
                    this.alpha += (0.35 - this.alpha) * 0.02;
                }
            }

            // Dampen velocity
            this.vx *= 0.995;
            this.vy *= 0.995;
        }

        draw() {
            // Scroll speed color shift — particles get more cyan when scrolling fast
            const scrollIntensity = Math.min(1, Math.abs(scroll.speed) * 0.02);
            const g = Math.round(255 - scrollIntensity * 40);
            const b = Math.round(192 + scrollIntensity * 60);

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, ${g}, ${b}, ${this.alpha})`;
            ctx.shadowBlur = (18 + scrollIntensity * 15) * this.z;
            ctx.shadowColor = `rgba(0, ${g}, ${b}, 0.8)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ==========================================================================
    // MOUSE TRAIL
    // ==========================================================================

    function updateTrail() {
        mouseTrail.unshift({ x: mouse.x, y: mouse.y, alpha: 1.0 });
        if (mouseTrail.length > TRAIL_LENGTH) mouseTrail.pop();
    }

    function drawTrail() {
        if (!mouse.isActive || mouseTrail.length < 2) return;

        for (let i = 1; i < mouseTrail.length; i++) {
            const t = mouseTrail[i];
            const progress = i / mouseTrail.length;
            t.alpha = (1 - progress) * 0.5;
            const size = (1 - progress) * 6 + 1;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 192, ${t.alpha})`;
            ctx.fill();
        }

        if (mouseTrail.length > 2) {
            ctx.beginPath();
            ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
            for (let i = 1; i < mouseTrail.length; i++) {
                const prev = mouseTrail[i - 1];
                const curr = mouseTrail[i];
                ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
            }
            ctx.strokeStyle = `rgba(0, 255, 192, 0.3)`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00FFC0';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // ==========================================================================
    // CLICK BURST RIPPLES
    // ==========================================================================

    class ClickBurst {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 5;
            this.alpha = 1.0;
            this.rings = 3;
        }

        update() {
            this.radius += 5;
            this.alpha -= 0.02;
        }

        draw() {
            if (this.alpha <= 0) return;
            for (let r = 0; r < this.rings; r++) {
                const ringRadius = this.radius - r * 20;
                if (ringRadius <= 0) continue;
                const ringAlpha = this.alpha * (1 - r * 0.3);
                ctx.beginPath();
                ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 255, 192, ${ringAlpha})`;
                ctx.lineWidth = 2.5 - r * 0.5;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#00FFC0';
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }

    // ==========================================================================
    // PARTICLE CONNECTIONS + ENERGY BEAMS
    // ==========================================================================

    function connectParticles() {
        // Scroll modulates connection distance and opacity
        const scrollBoost = Math.min(1, Math.abs(scroll.speed) * 0.015);
        const dynamicMaxDist = MAX_DISTANCE + scrollBoost * 60;

        for (let a = 0; a < particles.length; a++) {
            for (let b = a + 1; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < dynamicMaxDist) {
                    let alpha = (1 - dist / dynamicMaxDist) * (0.35 + scrollBoost * 0.2);
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.strokeStyle = `rgba(0, 255, 192, ${alpha})`;
                    ctx.lineWidth = 0.8 + scrollBoost * 0.5;
                    ctx.stroke();
                }
            }

            // Energy beams to cursor
            if (mouse.isActive) {
                let dx = mouse.x - particles[a].x;
                let dy = mouse.y - particles[a].y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius * 0.8) {
                    let beamAlpha = (1 - dist / (mouse.radius * 0.8)) * 0.5;
                    const grad = ctx.createLinearGradient(
                        particles[a].x, particles[a].y, mouse.x, mouse.y
                    );
                    grad.addColorStop(0, `rgba(0, 255, 192, ${beamAlpha * 0.8})`);
                    grad.addColorStop(0.5, `rgba(6, 182, 212, ${beamAlpha * 0.4})`);
                    grad.addColorStop(1, `rgba(0, 255, 192, ${beamAlpha})`);
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
    }

    // ==========================================================================
    // SCROLL HORIZONTAL SCAN LINE — Subtle horizontal light on fast scroll
    // ==========================================================================

    function drawScrollScanline() {
        if (Math.abs(scroll.speed) < 3) return;

        const intensity = Math.min(1, Math.abs(scroll.speed) * 0.04);
        const scanY = height / 2 + Math.sin(time * 3) * 30;

        const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        grad.addColorStop(0, `rgba(0, 255, 192, 0)`);
        grad.addColorStop(0.5, `rgba(0, 255, 192, ${intensity * 0.08})`);
        grad.addColorStop(1, `rgba(0, 255, 192, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 30, width, 60);
    }

    // ==========================================================================
    // MAIN ANIMATION LOOP
    // ==========================================================================

    function animate() {
        time += 0.016;
        ctx.clearRect(0, 0, width, height);

        // Smooth mouse easing
        const prevMX = mouse.x;
        const prevMY = mouse.y;
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
        mouse.velocityX = mouse.x - prevMX;
        mouse.velocityY = mouse.y - prevMY;

        // Smooth scroll speed
        scroll.speed += (scroll.rawSpeed - scroll.speed) * 0.15;
        scroll.intensity = Math.min(1, Math.abs(scroll.speed) * 0.03);
        scroll.progress = Math.min(1, scroll.y / Math.max(1, scroll.maxScroll));

        // Spawn scroll ripples at scroll-speed threshold
        if (Math.abs(scroll.rawSpeed) > 5 && Math.random() < 0.3) {
            scrollRipples.push(new ScrollRipple());
        }

        // === LAYER 1: Deep space background (shifts with scroll) ===
        const bgShift = scroll.progress * 40;
        let bgGrad = ctx.createRadialGradient(
            mouse.x, mouse.y + bgShift, 0,
            width / 2, height / 2, Math.max(width, height) * 0.8
        );
        bgGrad.addColorStop(0, '#0B1A2E');
        bgGrad.addColorStop(0.3, '#06162D');
        bgGrad.addColorStop(0.7, '#040E1A');
        bgGrad.addColorStop(1, '#020810');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // === LAYER 2: Scroll speed vignette pulse ===
        if (scroll.intensity > 0.1) {
            const vigGrad = ctx.createRadialGradient(
                width / 2, height / 2, height * 0.3,
                width / 2, height / 2, height * 0.9
            );
            vigGrad.addColorStop(0, `rgba(0, 255, 192, 0)`);
            vigGrad.addColorStop(1, `rgba(0, 255, 192, ${scroll.intensity * 0.06})`);
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, width, height);
        }

        // === LAYER 3: Nebula glows ===
        drawNebulae();

        // === LAYER 4: Starfield (scroll parallax) ===
        for (let s of stars) {
            s.update();
            s.draw();
        }

        // === LAYER 5: Scroll scanline ===
        drawScrollScanline();

        // === LAYER 6: Particle connections ===
        connectParticles();

        // === LAYER 7: Particles (scroll-reactive) ===
        for (let p of particles) {
            p.update();
            p.draw();
        }

        // === LAYER 8: Mouse trail ===
        if (mouse.isActive) {
            updateTrail();
            drawTrail();

            // Cursor glow
            const cursorGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 50);
            cursorGrad.addColorStop(0, 'rgba(0, 255, 192, 0.15)');
            cursorGrad.addColorStop(0.5, 'rgba(0, 255, 192, 0.05)');
            cursorGrad.addColorStop(1, 'rgba(0, 255, 192, 0)');
            ctx.fillStyle = cursorGrad;
            ctx.fillRect(mouse.x - 50, mouse.y - 50, 100, 100);
        }

        // === LAYER 9: Scroll ripples ===
        for (let i = scrollRipples.length - 1; i >= 0; i--) {
            let ripple = scrollRipples[i];
            ripple.update();
            ripple.draw();
            if (ripple.alpha <= 0 || ripple.radius > ripple.maxRadius) {
                scrollRipples.splice(i, 1);
            }
        }

        // === LAYER 10: Click burst rings ===
        for (let i = clickBursts.length - 1; i >= 0; i--) {
            let burst = clickBursts[i];
            burst.update();
            burst.draw();
            if (burst.alpha <= 0) clickBursts.splice(i, 1);
        }

        // Decay
        scroll.rawSpeed *= 0.85;
        mouse.scrollSpeed *= 0.92;

        requestAnimationFrame(animate);
    }

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
    }

    // EVENT LISTENERS
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.isActive = true;
    });

    window.addEventListener('mouseleave', () => {
        mouse.isActive = false;
        mouseTrail = [];
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.targetX = e.touches[0].clientX;
            mouse.targetY = e.touches[0].clientY;
            mouse.isActive = true;
        }
    }, { passive: true });

    // SCROLL LISTENER — Captures raw scroll speed for all effects
    window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        scroll.rawSpeed = currentY - scroll.lastY;
        scroll.direction = scroll.rawSpeed > 0 ? 1 : scroll.rawSpeed < 0 ? -1 : 0;
        scroll.lastY = currentY;
        scroll.y = currentY;
        scroll.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        mouse.scrollSpeed = scroll.rawSpeed;
    }, { passive: true });

    window.addEventListener('click', (e) => {
        clickBursts.push(new ClickBurst(e.clientX, e.clientY));
    });

    window.addEventListener('resize', () => {
        resize();
        scroll.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    });

    // Start
    resize();
    initParticles();
    animate();
})();
