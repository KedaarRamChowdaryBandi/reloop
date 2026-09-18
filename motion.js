/* ==========================================================================
   RELOOP MOTION ENGINE
   Shared across all pages: index, buyer, supplier, login
   Scroll animations, tilt, typing, counters, ripples, particles
   ========================================================================== */

function initMotionEngine() {
    // --- 1. Scroll-Triggered Entrance Animations (IntersectionObserver) ---
    const motionElements = document.querySelectorAll('.motion-fade-up, .motion-fade-left, .motion-fade-right, .motion-scale-in, .footer');
    const gridElements = document.querySelectorAll('.grid-2, .grid-3, .grid-4');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    motionElements.forEach(el => observer.observe(el));
    gridElements.forEach(el => observer.observe(el));

    // --- 2. Auto-Apply Motion Classes to Page Elements ---
    applyMotionClasses();

    // --- 3. Card Tilt Effect on Mouse Move ---
    initTiltEffect();

    // --- 4. Button Ripple Effect ---
    initRippleEffect();

    // --- 5. Hero Typing Effect ---
    initTypingEffect();

    // --- 6. Animated Metric Counters ---
    initCounterAnimation();

    // --- 7. Floating Emoji Particles ---
    initFloatingParticles();

    // --- 8. Magnetic Button Hover ---
    initMagneticButtons();
}

function applyMotionClasses() {
    // Explainer hero
    const hero = document.querySelector('.explainer-hero');
    if (hero) hero.classList.add('motion-scale-in');

    // Step cards with stagger
    document.querySelectorAll('.step-card').forEach((card, i) => {
        card.classList.add('motion-fade-up', `delay-${i + 1}`);
    });

    // Gateway cards
    document.querySelectorAll('.gateway-card').forEach((card, i) => {
        card.classList.add('motion-fade-up', `delay-${i + 1}`);
    });

    // Metric cards
    document.querySelectorAll('.metric-card').forEach((card, i) => {
        card.classList.add('motion-fade-up', `delay-${Math.min(i + 1, 5)}`);
    });

    // Section headings
    document.querySelectorAll('h2').forEach(h => h.classList.add('motion-fade-up'));

    // Reloop cards (marketplace, etc)
    document.querySelectorAll('.reloop-card').forEach((card, i) => {
        card.classList.add('motion-fade-up', `delay-${Math.min(i + 1, 6)}`);
    });

    // Subtab bar
    const subtabBar = document.querySelector('.subtab-bar');
    if (subtabBar) subtabBar.classList.add('motion-fade-up');
}

// --- Tilt Effect on Cards ---
function initTiltEffect() {
    const tiltTargets = document.querySelectorAll('.gateway-card, .reloop-card, .metric-card');

    tiltTargets.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.01)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// --- Button Ripple on Click ---
function initRippleEffect() {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// --- Typing Effect for Hero Subtitle ---
function initTypingEffect() {
    const subtitle = document.querySelector('.explainer-subtitle');
    if (!subtitle) return;

    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.classList.add('typing-cursor');

    let i = 0;
    function typeChar() {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeChar, 45);
        } else {
            setTimeout(() => subtitle.classList.remove('typing-cursor'), 2000);
        }
    }

    setTimeout(typeChar, 600);
}

// --- Animated Counter for Metric Values ---
function initCounterAnimation() {
    const metricVals = document.querySelectorAll('.metric-val');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = 'true';
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    metricVals.forEach(el => counterObserver.observe(el));
}

function animateCounter(el) {
    const originalText = el.textContent.trim();
    const numMatch = originalText.match(/[\d,.]+/);
    if (!numMatch) return;

    const numStr = numMatch[0];
    const prefix = originalText.substring(0, originalText.indexOf(numStr));
    const suffix = originalText.substring(originalText.indexOf(numStr) + numStr.length);
    const targetNum = parseFloat(numStr.replace(/,/g, ''));
    const hasDecimal = numStr.includes('.');
    const decimalPlaces = hasDecimal ? numStr.split('.')[1].length : 0;
    const hasComma = numStr.includes(',');
    const duration = 1200;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        let current = targetNum * eased;

        if (hasDecimal) {
            current = current.toFixed(decimalPlaces);
        } else {
            current = Math.round(current);
        }

        if (hasComma) {
            current = Number(current).toLocaleString('en-IN');
        }

        el.textContent = prefix + current + suffix;
        el.classList.add('counting');

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = originalText;
            setTimeout(() => el.classList.remove('counting'), 200);
        }
    }

    requestAnimationFrame(update);
}

// --- Floating Emoji Particles in Hero ---
function initFloatingParticles() {
    const hero = document.querySelector('.explainer-hero');
    if (!hero) return;

    const emojis = ['♻️', '🌱', '💚', '⚡', '🔄', '🌿', '🏭', '📦'];
    hero.style.position = 'relative';
    hero.style.overflow = 'hidden';

    for (let i = 0; i < 8; i++) {
        const span = document.createElement('span');
        span.className = 'hero-float-particle';
        span.textContent = emojis[i % emojis.length];
        span.style.left = (10 + Math.random() * 80) + '%';
        span.style.top = (10 + Math.random() * 80) + '%';
        span.style.animationDelay = (Math.random() * 3) + 's';
        span.style.animationDuration = (3 + Math.random() * 3) + 's';
        hero.appendChild(span);
    }
}

// --- Magnetic Button Hover ---
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.btn-buyer, .btn-supplier');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.03)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}
