/* ==========================================================================
   RELOOP MASTER JAVASCRIPT APPLICATION
   Separate Portals (Main Explainer, Buyer Portal, Supplier Portal)
   WebGL2 3D Dither Motion Background + State Management
   ========================================================================== */

// --- INITIAL SEED DATA & STATE ---
const DEFAULT_USERS = [
    { id: 1, name: "GreenTech Solutions", email: "buyer@eco.com", password: "password123", role: "buyer" },
    { id: 2, name: "EcoWeave Textiles", email: "buyer2@eco.com", password: "password123", role: "buyer" },
    { id: 3, name: "TimberCraft Industries", email: "supplier@eco.com", password: "password123", role: "supplier" },
    { id: 4, name: "PolyRecycle Ltd", email: "supplier2@eco.com", password: "password123", role: "supplier" }
];

const DEFAULT_VERIFICATIONS = [
    { supplier_id: 3, company_name: "TimberCraft Industries", gst_number: "29AAACT1234F1Z5", address: "Plot 12, Peenya Industrial Area, Bengaluru", status: "approved", trust_score: 9.4 },
    { supplier_id: 4, company_name: "PolyRecycle Ltd", gst_number: "27AAACP5678G2Z1", address: "Gala 4, MIDC Industrial Zone, Mumbai", status: "approved", trust_score: 8.8 }
];

const DEFAULT_LISTINGS = [
    { id: 101, supplier_id: 3, supplier_name: "TimberCraft Industries", material: "Wood Waste", material_type: "Wood Waste", quantity: 450.0, unit: "kg", price_per_kg: 8.50, location: "Bengaluru", condition: "good", description: "High grade untreated pine wood offcuts from furniture manufacturing.", carbon_saved: 0.20, status: "active", trust_score: 9.4, expiry_date: "2026-10-15" },
    { id: 102, supplier_id: 3, supplier_name: "TimberCraft Industries", material: "Cotton Waste", material_type: "Textiles", quantity: 300.0, unit: "kg", price_per_kg: 14.00, location: "Bengaluru", condition: "excellent", description: "Clean white cotton textile cutoffs suitable for rag rolling or paper production.", carbon_saved: 0.60, status: "active", trust_score: 9.4, expiry_date: "2026-11-01" },
    { id: 103, supplier_id: 4, supplier_name: "PolyRecycle Ltd", material: "Plastic Waste", material_type: "Plastics", quantity: 1200.0, unit: "kg", price_per_kg: 18.00, location: "Mumbai", condition: "good", description: "Baled HDPE plastic containers and industrial drum trimmings.", carbon_saved: 2.16, status: "active", trust_score: 8.8, expiry_date: "2026-12-31" },
    { id: 104, supplier_id: 4, supplier_name: "PolyRecycle Ltd", material: "Metal Scrap", material_type: "Metals", quantity: 850.0, unit: "kg", price_per_kg: 28.00, location: "Mumbai", condition: "fair", description: "Aluminum machine turnings and clean sheet metal scrap from stamping line.", carbon_saved: 1.28, status: "active", trust_score: 8.8, expiry_date: "2026-09-30" },
    { id: 105, supplier_id: 3, supplier_name: "TimberCraft Industries", material: "Paper Waste", material_type: "Paper Waste", quantity: 600.0, unit: "kg", price_per_kg: 7.00, location: "Bengaluru", condition: "good", description: "Clean corrugated cardboard boxes and unprinted kraft paper reels.", carbon_saved: 0.72, status: "active", trust_score: 9.4, expiry_date: "2026-10-31" }
];

const DEFAULT_ORDERS = [
    { id: 501, listing_id: 101, buyer_id: 1, buyer_name: "GreenTech Solutions", material: "Wood Waste", material_type: "Wood Waste", quantity: 200.0, total_price: 1700.0, carbon_saved: 0.08, status: "completed", created_at: "2026-08-10" }
];

const DEFAULT_BUYER_REQUESTS = [
    { id: 301, buyer_id: 1, buyer_name: "GreenTech Solutions", material_type: "Wood Waste", quantity: 500.0, max_price: 10.00, status: "open", created_at: "2026-08-12" }
];

// App State Manager
class AppState {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('reloop_users')) || DEFAULT_USERS;
        this.verifications = JSON.parse(localStorage.getItem('reloop_verifications')) || DEFAULT_VERIFICATIONS;
        this.listings = JSON.parse(localStorage.getItem('reloop_listings')) || DEFAULT_LISTINGS;
        this.orders = JSON.parse(localStorage.getItem('reloop_orders')) || DEFAULT_ORDERS;
        this.buyerRequests = JSON.parse(localStorage.getItem('reloop_buyer_requests')) || DEFAULT_BUYER_REQUESTS;
        this.currentUser = JSON.parse(localStorage.getItem('reloop_current_user')) || null;
    }

    save() {
        localStorage.setItem('reloop_users', JSON.stringify(this.users));
        localStorage.setItem('reloop_verifications', JSON.stringify(this.verifications));
        localStorage.setItem('reloop_listings', JSON.stringify(this.listings));
        localStorage.setItem('reloop_orders', JSON.stringify(this.orders));
        localStorage.setItem('reloop_buyer_requests', JSON.stringify(this.buyerRequests));
        localStorage.setItem('reloop_current_user', JSON.stringify(this.currentUser));
    }
}

const state = new AppState();

// ==========================================================================
// 1. WEBGL2 3D DITHER MOTION SHADER ENGINE
// ==========================================================================

function initWebGLDitherShader() {
    const canvas = document.getElementById('reloop-dither-bg');
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false });
    if (!gl) return;

    const vsSource = `#version 300 es
    precision mediump float;
    layout(location = 0) in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }`;

    const fsSource = `#version 300 es
    precision mediump float;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_pixelRatio;
    uniform float u_pxSize;
    uniform vec4 u_colorBack;
    uniform vec4 u_colorFront;

    out vec4 fragColor;

    #define TWO_PI 6.28318530718

    vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
        -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    const int bayer4x4[16] = int[16](
      0, 8, 2, 10,
      12, 4, 14, 6,
      3, 11, 1, 9,
      15, 7, 13, 5
    );

    float getBayerValue(vec2 uv) {
      ivec2 pos = ivec2(fract(uv / 4.0) * 4.0);
      int index = pos.y * 4 + pos.x;
      return float(bayer4x4[index]) / 16.0;
    }

    void main() {
      float t = .5 * u_time;
      float pxSize = u_pxSize * u_pixelRatio;
      vec2 pxSizeUV = (gl_FragCoord.xy - .5 * u_resolution) / pxSize;
      vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
      vec2 normalizedUV = canvasPixelizedUV / u_resolution;

      vec2 shapeUV = normalizedUV;
      float l = length(shapeUV);
      float angle = 6. * atan(shapeUV.y, shapeUV.x) + 4. * t;
      float twist = 1.2;
      float offset = 1. / pow(max(l, 1e-6), twist) + angle / TWO_PI;
      float mid = smoothstep(0., 1., pow(l, twist));
      float shape = mix(0., fract(offset), mid);

      float dithering = getBayerValue(canvasPixelizedUV) - .5;
      float res = step(.5, shape + dithering);

      vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
      vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
      vec3 color = mix(bgColor, fgColor, res);

      fragColor = vec4(color, 0.95);
    }`;

    function compileShader(type, src) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uPixelRatio = gl.getUniformLocation(program, 'u_pixelRatio');
    const uPxSize = gl.getUniformLocation(program, 'u_pxSize');
    const uColorBack = gl.getUniformLocation(program, 'u_colorBack');
    const uColorFront = gl.getUniformLocation(program, 'u_colorFront');

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
        }
    }

    window.addEventListener('resize', resize);
    resize();

    let start = performance.now();
    function render(now) {
        resize();
        const elapsed = (now - start) * 0.001 * 2.8;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uPixelRatio, Math.min(window.devicePixelRatio || 1, 2));
        gl.uniform1f(uPxSize, 3.4);
        gl.uniform4f(uColorBack, 0.02, 0.04, 0.08, 1.0);
        gl.uniform4f(uColorFront, 0.0, 1.0, 0.75, 0.85);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// ==========================================================================
// 2. PORTAL & SUBTAB SWITCHING
// ==========================================================================

function switchPortal(portalName) {
    document.querySelectorAll('.portal-container').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#main-nav-links .nav-item').forEach(item => item.classList.remove('active'));

    const targetPortal = document.getElementById(`portal-${portalName}`);
    if (targetPortal) targetPortal.classList.add('active');

    const targetNav = document.querySelector(`#main-nav-links .nav-item[data-portal="${portalName}"]`);
    if (targetNav) targetNav.classList.add('active');

    const indicator = document.getElementById('current-portal-indicator');
    if (indicator) {
        if (portalName === 'buyer') indicator.innerText = '🛒 Buyer Portal';
        else if (portalName === 'supplier') indicator.innerText = '🏭 Supplier Portal';
        else indicator.innerText = 'Explainer Hub';
    }

    if (portalName === 'buyer') {
        renderBuyerDashboard();
        renderMarketplace();
    } else if (portalName === 'supplier') {
        renderSupplierDashboard();
        renderSupplierInventory();
        renderSupplierBuyerRequests();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchBuyerSubtab(tabName) {
    document.querySelectorAll('#portal-buyer .subtab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#portal-buyer .subtab-content').forEach(c => c.classList.remove('active'));

    const navItem = document.querySelector(`#portal-buyer .subtab-item[data-subtab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');

    const content = document.getElementById(`subtab-${tabName}`);
    if (content) content.classList.add('active');

    if (tabName === 'buyer-dash') renderBuyerDashboard();
    if (tabName === 'buyer-market') renderMarketplace();
    if (tabName === 'buyer-matcher') runAIMatching();
    if (tabName === 'buyer-price') renderPriceComparison();
    if (tabName === 'buyer-carbon') calculateCarbonOffset();
    if (tabName === 'buyer-verify') renderVerificationRegistry();
}

function switchSupplierSubtab(tabName) {
    document.querySelectorAll('#portal-supplier .subtab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#portal-supplier .subtab-content').forEach(c => c.classList.remove('active'));

    const navItem = document.querySelector(`#portal-supplier .subtab-item[data-subtab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');

    const content = document.getElementById(`subtab-${tabName}`);
    if (content) content.classList.add('active');

    if (tabName === 'supplier-dash') renderSupplierDashboard();
    if (tabName === 'supplier-inventory') renderSupplierInventory();
    if (tabName === 'supplier-requests') renderSupplierBuyerRequests();
}

// User Badge & Auth
function updateNavUserBadge() {
    const badge = document.getElementById('nav-user-badge');
    const authBtn = document.getElementById('nav-auth-btn');

    if (state.currentUser) {
        badge.innerHTML = `👤 ${state.currentUser.name} (${state.currentUser.role.toUpperCase()})`;
        badge.style.color = 'var(--primary-mint)';
        authBtn.innerHTML = '🔓 Sign Out';
        authBtn.onclick = handleSignOut;

        const bName = document.getElementById('buyer-welcome-name');
        if (bName) bName.innerText = `Welcome, ${state.currentUser.name}`;

        const sName = document.getElementById('supplier-welcome-name');
        if (sName) sName.innerText = `Welcome, ${state.currentUser.name}`;
    } else {
        badge.innerHTML = '👤 Guest Session';
        badge.style.color = 'var(--text-dim)';
        authBtn.innerHTML = '🔐 Sign In / Register';
        authBtn.onclick = () => openAuthModal();
    }
}

function openAuthModal(role = 'buyer') {
    document.getElementById('auth-modal').classList.add('active');
    document.getElementById('auth-role').value = role;
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function fillDemoAuth(role) {
    if (role === 'buyer') {
        document.getElementById('auth-email').value = 'buyer@eco.com';
        document.getElementById('auth-password').value = 'password123';
        document.getElementById('auth-role').value = 'buyer';
    } else {
        document.getElementById('auth-email').value = 'supplier@eco.com';
        document.getElementById('auth-password').value = 'password123';
        document.getElementById('auth-role').value = 'supplier';
    }
}

function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-password').value.trim();
    const role = document.getElementById('auth-role').value;

    if (!email || !pass) {
        alert('Please enter email and password.');
        return;
    }

    let user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (!user) {
        user = { id: Date.now(), name: email.split('@')[0].toUpperCase(), email: email, password: pass, role: role };
        state.users.push(user);
    }

    state.currentUser = user;
    state.save();
    updateNavUserBadge();
    closeAuthModal();

    if (role === 'buyer') switchPortal('buyer');
    else switchPortal('supplier');
}

function handleSignOut() {
    state.currentUser = null;
    state.save();
    updateNavUserBadge();
    switchPortal('main');
}

// ==========================================================================
// 3. BUYER PORTAL LOGIC & RENDERERS
// ==========================================================================

function renderBuyerDashboard() {
    const ordersList = document.getElementById('buyer-orders-history-list');
    if (!ordersList) return;

    const userOrders = state.currentUser ? state.orders.filter(o => o.buyer_id === state.currentUser.id || o.buyer_name === state.currentUser.name) : state.orders;

    const totalQty = userOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.total_price, 0);
    const totalCO2 = userOrders.reduce((sum, o) => sum + o.carbon_saved, 0);

    if (document.getElementById('b-stat-procured')) document.getElementById('b-stat-procured').innerText = `${totalQty.toLocaleString()} kg`;
    if (document.getElementById('b-stat-spent')) document.getElementById('b-stat-spent').innerText = `₹${totalSpent.toLocaleString('en-IN')}`;
    if (document.getElementById('b-stat-co2')) document.getElementById('b-stat-co2').innerText = `${totalCO2.toFixed(2)} t`;
    if (document.getElementById('b-stat-orders')) document.getElementById('b-stat-orders').innerText = `${userOrders.length}`;

    ordersList.innerHTML = `
        <div class="grid-2">
            ${userOrders.map(o => `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h3 style="color:var(--primary-mint); margin:0;">${o.material}</h3>
                        <span class="badge badge-verified">✅ Completed Order</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:13px;">Procured Volume: ${o.quantity} kg | Total Value: ₹${o.total_price.toLocaleString('en-IN')}</p>
                    <div style="color:var(--accent-lime); font-size:12px; font-weight:bold; margin-top:6px;">🌱 Carbon Prevented: ${o.carbon_saved} tons CO₂</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMarketplace() {
    const container = document.getElementById('marketplace-grid-container');
    if (!container) return;

    const query = (document.getElementById('market-search')?.value || '').toLowerCase();
    const category = document.getElementById('market-category')?.value || 'All';
    const maxPrice = parseFloat(document.getElementById('market-max-price')?.value) || 10000;
    const condition = document.getElementById('market-condition')?.value || 'All';

    const filtered = state.listings.filter(l => {
        const matchesQuery = !query || l.material.toLowerCase().includes(query) || l.location.toLowerCase().includes(query) || l.description.toLowerCase().includes(query);
        const matchesCat = category === 'All' || l.material_type.toLowerCase().includes(category.toLowerCase());
        const matchesPrice = l.price_per_kg <= maxPrice;
        const matchesCond = condition === 'All' || l.condition.toLowerCase() === condition.toLowerCase();
        return matchesQuery && matchesCat && matchesPrice && matchesCond;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="reloop-card" style="text-align:center; padding:40px;"><h3 style="color:var(--text-dim);">No active listings match your filters.</h3></div>`;
        return;
    }

    container.innerHTML = `
        <div style="font-weight:700; color:var(--primary-mint); margin-bottom:15px;">Showing ${filtered.length} active listing(s)</div>
        <div class="grid-2">
            ${filtered.map(l => {
                const totalCost = l.quantity * l.price_per_kg;
                const trustScore = l.trust_score || 5.0;
                const trustColor = trustScore >= 8.0 ? '#00FFC0' : trustScore >= 5.0 ? '#F59E0B' : '#F43F5E';
                return `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="color:var(--primary-mint); margin:0;">${l.material}</h3>
                        <span class="badge badge-verified">✅ Verified Supplier</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px; font-style:italic;">${l.description}</p>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; font-size:13px; color:var(--text-muted); margin-bottom:16px;">
                        <div><strong>Quantity:</strong> ${l.quantity} ${l.unit}</div>
                        <div><strong>Price/kg:</strong> ₹${l.price_per_kg.toFixed(2)}</div>
                        <div><strong>Total Value:</strong> ₹${totalCost.toLocaleString('en-IN')}</div>
                        <div><strong>Location:</strong> 📍 ${l.location}</div>
                        <div><strong>Quality:</strong> ${l.condition.toUpperCase()}</div>
                        <div><strong>Supplier:</strong> ${l.supplier_name}</div>
                        <div><strong>CO₂ Saved:</strong> 🌱 ${l.carbon_saved} t</div>
                        <div><strong>Trust Index:</strong> <span style="color:${trustColor}; font-weight:bold;">${trustScore.toFixed(1)}/10</span></div>
                    </div>
                    <button class="btn btn-buyer btn-full" onclick="procureListing(${l.id})">🛒 Procure Material (₹${totalCost.toLocaleString('en-IN')})</button>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

function procureListing(id) {
    if (!state.currentUser) {
        alert('Please sign in to procure materials.');
        openAuthModal('buyer');
        return;
    }

    const listing = state.listings.find(l => l.id === id);
    if (!listing) return;

    const totalVal = listing.quantity * listing.price_per_kg;
    const newOrder = {
        id: Date.now(),
        listing_id: listing.id,
        buyer_id: state.currentUser.id,
        buyer_name: state.currentUser.name,
        material: listing.material,
        material_type: listing.material_type,
        quantity: listing.quantity,
        total_price: totalVal,
        carbon_saved: listing.carbon_saved,
        status: 'completed',
        created_at: new Date().toISOString().split('T')[0]
    };

    state.orders.push(newOrder);
    state.save();
    alert(`🎉 Successfully procured ${listing.quantity} ${listing.unit} of ${listing.material}! Order saved to your Buyer Dashboard.`);
    switchBuyerSubtab('buyer-dash');
}

function runAIMatching() {
    const awardsContainer = document.getElementById('ai-award-cards-container');
    const listContainer = document.getElementById('ai-matches-list-container');
    if (!awardsContainer || !listContainer) return;

    const reqMat = (document.getElementById('match-req-material')?.value || 'Wood').toLowerCase();
    const reqMaxPrice = parseFloat(document.getElementById('match-req-maxprice')?.value) || 250;
    const wDist = parseFloat(document.getElementById('weight-dist')?.value) || 0.3;
    const wPrice = parseFloat(document.getElementById('weight-price')?.value) || 0.4;
    const wTrust = parseFloat(document.getElementById('weight-trust')?.value) || 0.3;

    let matches = state.listings.filter(l => l.material.toLowerCase().includes(reqMat) || l.description.toLowerCase().includes(reqMat));
    if (matches.length === 0) matches = [...state.listings];

    matches.forEach(m => {
        const dist = 10 + (m.id % 7) * 25;
        m.distance_km = dist;

        const distScore = Math.max(0.1, 1.0 - (dist / 300.0));
        const priceScore = Math.max(0.1, 1.0 - (m.price_per_kg / Math.max(reqMaxPrice, 1.0)));
        const trustVal = (m.trust_score || 5.0) / 10.0;

        const totalW = wDist + wPrice + wTrust || 1.0;
        m.match_score = (((distScore * wDist) + (priceScore * wPrice) + (trustVal * wTrust)) / totalW) * 100.0;
    });

    const bestMatch = [...matches].sort((a,b) => b.match_score - a.match_score)[0];
    const cheapest = [...matches].sort((a,b) => a.price_per_kg - b.price_per_kg)[0];
    const nearest = [...matches].sort((a,b) => a.distance_km - b.distance_km)[0];
    const highestTrust = [...matches].sort((a,b) => (b.trust_score||5) - (a.trust_score||5))[0];

    awardsContainer.innerHTML = `
        <div style="font-weight:700; color:var(--primary-mint); font-size:20px; margin-bottom:15px;">🏆 AI Recommended Sourcing Winners</div>
        <div class="grid-4" style="margin-bottom:30px;">
            <div class="reloop-card" style="border-color:var(--primary-mint);">
                <span class="badge badge-verified" style="margin-bottom:8px;">🥇 Best Overall Match</span>
                <h3 style="color:#FFF;">${bestMatch.material}</h3>
                <div style="font-size:24px; font-weight:800; color:var(--primary-mint); margin:8px 0;">${bestMatch.match_score.toFixed(1)}% Match</div>
                <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Seller: ${bestMatch.supplier_name}<br>Price: ₹${bestMatch.price_per_kg}/kg</p>
                <button class="btn btn-buyer btn-sm btn-full" onclick="procureListing(${bestMatch.id})">Procure Best Match</button>
            </div>
            <div class="reloop-card" style="border-color:#38BDF8;">
                <span class="badge badge-info" style="margin-bottom:8px;">📍 Nearest Proximity</span>
                <h3 style="color:#FFF;">${nearest.material}</h3>
                <div style="font-size:24px; font-weight:800; color:#38BDF8; margin:8px 0;">${nearest.distance_km} km</div>
                <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Seller: ${nearest.supplier_name}<br>Shortest freight distance</p>
                <button class="btn btn-outline btn-sm btn-full" onclick="procureListing(${nearest.id})">Procure Nearest</button>
            </div>
            <div class="reloop-card" style="border-color:#F59E0B;">
                <span class="badge badge-pending" style="margin-bottom:8px;">💰 Lowest Price</span>
                <h3 style="color:#FFF;">${cheapest.material}</h3>
                <div style="font-size:24px; font-weight:800; color:#F59E0B; margin:8px 0;">₹${cheapest.price_per_kg}/kg</div>
                <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Seller: ${cheapest.supplier_name}<br>Lowest unit cost</p>
                <button class="btn btn-outline btn-sm btn-full" onclick="procureListing(${cheapest.id})">Procure Cheapest</button>
            </div>
            <div class="reloop-card" style="border-color:var(--accent-lime);">
                <span class="badge badge-verified" style="margin-bottom:8px;">⭐ Highest Trust</span>
                <h3 style="color:#FFF;">${highestTrust.material}</h3>
                <div style="font-size:24px; font-weight:800; color:var(--accent-lime); margin:8px 0;">${(highestTrust.trust_score||5).toFixed(1)}/10</div>
                <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Seller: ${highestTrust.supplier_name}<br>Verified GSTIN record</p>
                <button class="btn btn-outline btn-sm btn-full" onclick="procureListing(${highestTrust.id})">Procure Most Trusted</button>
            </div>
        </div>
    `;

    listContainer.innerHTML = `
        <h3 style="color:var(--text-main); margin-bottom:15px;">All Recommendations Ranked by Score</h3>
        <div class="grid-2">
            ${matches.sort((a,b) => b.match_score - a.match_score).map(m => `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="color:#FFF;">♻️ ${m.material}</h4>
                        <span style="color:var(--primary-mint); font-weight:800; font-size:18px;">${m.match_score.toFixed(1)}% Match</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin:8px 0;">Supplier: ${m.supplier_name} | Location: ${m.location} (${m.distance_km} km)</p>
                    <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">Price: ₹${m.price_per_kg}/kg | Available: ${m.quantity} ${m.unit}</div>
                    <button class="btn btn-buyer btn-sm btn-full" onclick="procureListing(${m.id})">🛒 Procure Material</button>
                </div>
            `).join('')}
        </div>
    `;
}

function renderPriceComparison() {
    const container = document.getElementById('price-comparison-list');
    if (!container) return;

    const benchmarks = { "Wood Waste": 9.20, "Cotton Waste": 15.50, "Plastic Waste": 21.00, "Metal Scrap": 32.00, "Paper Waste": 8.00 };

    container.innerHTML = `
        <div class="grid-2">
            ${state.listings.map(l => {
                const bench = benchmarks[l.material] || benchmarks[l.material_type] || 15.0;
                const diff = ((l.price_per_kg - bench) / bench) * 100.0;
                const dealBadge = diff <= 0 ? `<span class="badge badge-verified">🔥 ${Math.abs(diff).toFixed(1)}% Below Index (Great Deal)</span>` : `<span class="badge badge-pending">⚠️ ${diff.toFixed(1)}% Above Index</span>`;
                return `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="color:var(--primary-mint); margin:0;">${l.material}</h3>
                        ${dealBadge}
                    </div>
                    <p style="color:var(--text-muted); font-size:13px;">Supplier: ${l.supplier_name} (${l.location})</p>
                    <div style="display:flex; justify-content:space-between; margin:15px 0; font-size:16px;">
                        <div>Listing Price: <strong style="color:var(--primary-mint);">₹${l.price_per_kg.toFixed(2)}/kg</strong></div>
                        <div>Market Index Rate: <strong>₹${bench.toFixed(2)}/kg</strong></div>
                    </div>
                    <button class="btn btn-buyer btn-full" onclick="procureListing(${l.id})">Procure at ₹${l.price_per_kg.toFixed(2)}/kg</button>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

function calculateCarbonOffset() {
    const matType = document.getElementById('calc-mat-type')?.value || 'Plastic Waste';
    const weight = parseFloat(document.getElementById('calc-weight')?.value) || 1000;
    const factors = { "Plastic Waste": 2.16, "Metal Scrap": 1.85, "Cotton Waste": 2.00, "Wood Waste": 0.44, "Paper Waste": 1.20 };

    const factor = factors[matType] || 1.5;
    const co2Tons = (weight * factor) / 1000.0;

    if (document.getElementById('calc-co2-result')) document.getElementById('calc-co2-result').value = `${co2Tons.toFixed(2)} tons CO₂`;
    if (document.getElementById('eq-trees')) document.getElementById('eq-trees').innerText = (co2Tons * 16.5).toFixed(1);
    if (document.getElementById('eq-cars')) document.getElementById('eq-cars').innerText = (co2Tons * 0.22).toFixed(2);
    if (document.getElementById('eq-homes')) document.getElementById('eq-homes').innerText = (co2Tons * 0.12).toFixed(2);
    if (document.getElementById('eq-landfill')) document.getElementById('eq-landfill').innerText = `${weight.toLocaleString()} kg`;
}

function renderVerificationRegistry() {
    const container = document.getElementById('verification-registry-list');
    if (!container) return;

    container.innerHTML = `
        <div class="grid-2">
            ${state.verifications.map(v => `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="color:var(--primary-mint); margin:0;">${v.company_name}</h3>
                        <span class="badge badge-verified">✅ Verified GSTIN</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;"><strong>GSTIN:</strong> <code>${v.gst_number}</code></p>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px;"><strong>Address:</strong> 📍 ${v.address}</p>
                    <div style="font-size:18px; font-weight:800; color:var(--accent-lime);">AI Trust Index Score: ${v.trust_score.toFixed(1)} / 10.0</div>
                </div>
            `).join('')}
        </div>
    `;
}

function submitBuyerRequest() {
    if (!state.currentUser) {
        alert('Please sign in as a Buyer to post sourcing requests.');
        openAuthModal('buyer');
        return;
    }

    const cat = document.getElementById('req-cat').value;
    const qty = parseFloat(document.getElementById('req-qty').value) || 500;
    const price = parseFloat(document.getElementById('req-maxprice').value) || 15;

    const newReq = {
        id: Date.now(),
        buyer_id: state.currentUser.id,
        buyer_name: state.currentUser.name,
        material_type: cat,
        quantity: qty,
        max_price: price,
        status: 'open',
        created_at: new Date().toISOString().split('T')[0]
    };

    state.buyerRequests.unshift(newReq);
    state.save();
    alert(`🎉 Published sourcing request for ${qty} kg of ${cat}! Suppliers can now view your request.`);
    switchBuyerSubtab('buyer-dash');
}

// ==========================================================================
// 4. SUPPLIER PORTAL LOGIC & RENDERERS
// ==========================================================================

function renderSupplierDashboard() {
    const summaryContainer = document.getElementById('supplier-dash-listings-summary');
    if (!summaryContainer) return;

    const userListings = state.currentUser ? state.listings.filter(l => l.supplier_id === state.currentUser.id || l.supplier_name === state.currentUser.name) : state.listings;

    if (document.getElementById('s-stat-listed')) document.getElementById('s-stat-listed').innerText = userListings.length;
    if (document.getElementById('s-stat-sold')) document.getElementById('s-stat-sold').innerText = state.orders.length;
    if (document.getElementById('s-stat-earnings')) document.getElementById('s-stat-earnings').innerText = `₹${state.orders.reduce((s,o)=>s+o.total_price,0).toLocaleString('en-IN')}`;
    if (document.getElementById('s-stat-co2')) document.getElementById('s-stat-co2').innerText = `${userListings.reduce((s,l)=>s+l.carbon_saved,0).toFixed(2)} t`;

    summaryContainer.innerHTML = `
        <h3 style="color:var(--text-main); margin-bottom:15px;">Active Factory Waste Listings</h3>
        <div class="grid-2">
            ${userListings.map(l => `
                <div class="reloop-card">
                    <h3 style="color:var(--primary-mint); margin-bottom:8px;">${l.material}</h3>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">${l.description}</p>
                    <div style="font-size:13px; color:var(--text-muted);">Quantity: ${l.quantity} ${l.unit} | Price: ₹${l.price_per_kg}/kg | Location: ${l.location}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSupplierInventory() {
    const container = document.getElementById('supplier-inventory-list');
    if (!container) return;

    const userListings = state.currentUser ? state.listings.filter(l => l.supplier_id === state.currentUser.id || l.supplier_name === state.currentUser.name) : state.listings;

    container.innerHTML = `
        <h3 style="color:var(--text-main); margin-bottom:15px;">📋 Factory Waste Inventory List (${userListings.length})</h3>
        <div class="grid-2">
            ${userListings.map(l => `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="color:var(--primary-mint); margin:0;">${l.material}</h3>
                        <span class="badge badge-verified">✅ Active</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:10px;">${l.description}</p>
                    <div style="font-size:13px; color:var(--text-muted);">Volume: ${l.quantity} ${l.unit} | Rate: ₹${l.price_per_kg}/kg | Location: ${l.location}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSupplierBuyerRequests() {
    const container = document.getElementById('supplier-buyer-requests-list');
    if (!container) return;

    container.innerHTML = `
        <h3 style="color:var(--text-main); margin-bottom:15px;">💬 Incoming Open Buyer Sourcing Requests</h3>
        <div class="grid-2">
            ${state.buyerRequests.map(r => `
                <div class="reloop-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="color:var(--primary-mint); margin:0;">Demand: ${r.material_type}</h3>
                        <span class="badge badge-pending">📢 Open Request</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">Buyer: ${r.buyer_name}</p>
                    <div style="font-size:14px; color:var(--text-muted);">Requested Volume: <strong>${r.quantity} kg</strong> | Max Budget: <strong>₹${r.max_price}/kg</strong></div>
                </div>
            `).join('')}
        </div>
    `;
}

function autofillAIDescription() {
    const mat = document.getElementById('add-mat-name')?.value || 'Industrial Waste Scrap';
    const cat = document.getElementById('add-mat-cat')?.value || 'Secondary Material';
    const cond = document.getElementById('add-mat-cond')?.value || 'good';

    const descArea = document.getElementById('add-mat-desc');
    if (descArea) {
        descArea.value = `High grade, clean ${mat} generated directly from manufacturing line. Classified under ${cat} with ${cond} grade condition quality. Ideal for circular remanufacturing and direct industrial reuse.`;
    }
}

function submitNewMaterial() {
    if (!state.currentUser || state.currentUser.role !== 'supplier') {
        alert('Please sign in as a Supplier to list new materials.');
        openAuthModal('supplier');
        return;
    }

    const mat = document.getElementById('add-mat-name')?.value.trim();
    const cat = document.getElementById('add-mat-cat')?.value;
    const qty = parseFloat(document.getElementById('add-mat-qty')?.value) || 100;
    const price = parseFloat(document.getElementById('add-mat-price')?.value) || 10;
    const loc = document.getElementById('add-mat-loc')?.value || 'Bengaluru';
    const cond = document.getElementById('add-mat-cond')?.value || 'good';
    const desc = document.getElementById('add-mat-desc')?.value || 'Clean industrial byproduct.';

    if (!mat) {
        alert('Please enter a material name.');
        return;
    }

    const newListing = {
        id: Date.now(),
        supplier_id: state.currentUser.id,
        supplier_name: state.currentUser.name,
        material: mat,
        material_type: cat,
        quantity: qty,
        unit: 'kg',
        price_per_kg: price,
        location: loc,
        condition: cond,
        description: desc,
        carbon_saved: (qty * 1.5) / 1000.0,
        status: 'active',
        trust_score: 9.2,
        expiry_date: '2026-12-31'
    };

    state.listings.unshift(newListing);
    state.save();
    alert(`🎉 Successfully published ${mat} to the Marketplace!`);
    switchSupplierSubtab('supplier-inventory');
}

function submitGSTVerification() {
    const comp = document.getElementById('gst-company').value.trim();
    const gst = document.getElementById('gst-num').value.trim();
    const addr = document.getElementById('gst-address').value.trim();

    if (!comp || !gst) {
        alert('Please enter both company name and GSTIN number.');
        return;
    }

    const newVerification = {
        supplier_id: state.currentUser ? state.currentUser.id : 99,
        company_name: comp,
        gst_number: gst,
        address: addr,
        status: 'approved',
        trust_score: 9.5
    };

    state.verifications.unshift(newVerification);
    state.save();
    alert('🎉 Business GSTIN verified successfully! Trust index updated to 9.5/10.');
    switchPortal('buyer');
}

// ==========================================================================
// 5. AI CHATBOT DRAWER
// ==========================================================================

function toggleChatbot() {
    document.getElementById('chatbot-drawer').classList.toggle('active');
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
    const input = document.getElementById('chat-user-input');
    const msg = input.value.trim();
    if (!msg) return;

    const container = document.getElementById('chat-messages-container');
    container.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    input.value = '';

    setTimeout(() => {
        let reply = "I can assist you with circular material sourcing, listing your factory waste, or calculating carbon diversion metrics. Switch between Buyer and Supplier portals in the top navigation!";
        const q = msg.toLowerCase();
        if (q.includes('wood') || q.includes('pine')) {
            reply = "We currently have 450 kg of Pine Wood Waste available in Bengaluru listed at ₹8.50/kg!";
        } else if (q.includes('plastic') || q.includes('hdpe')) {
            reply = "We have 1,200 kg of baled HDPE Plastic Waste in Mumbai listed at ₹18.00/kg with an AI Trust Score of 8.8/10.";
        } else if (q.includes('cotton') || q.includes('textile')) {
            reply = "EcoWeave Textiles has listed 300 kg of white cotton textile scrap in Bengaluru at ₹14.00/kg.";
        }
        container.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
        container.scrollTop = container.scrollHeight;
    }, 400);
}

// ==========================================================================
// INITIALIZATION ON DOM READY
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initWebGLDitherShader();
    updateNavUserBadge();
    renderMarketplace();
    calculateCarbonOffset();
    initMotionEngine();
});
