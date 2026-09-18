/* ==========================================================================
   DEDICATED SUPPLIER PORTAL JAVASCRIPT
   State Management + Supplier Features Only
   ========================================================================== */

const DEFAULT_USERS = [
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
    { id: 103, supplier_id: 4, supplier_name: "PolyRecycle Ltd", material: "Plastic Waste", material_type: "Plastics", quantity: 1200.0, unit: "kg", price_per_kg: 18.00, location: "Mumbai", condition: "good", description: "Baled HDPE plastic containers and industrial drum trimmings.", carbon_saved: 2.16, status: "active", trust_score: 8.8, expiry_date: "2026-12-31" }
];

const DEFAULT_ORDERS = [
    { id: 501, listing_id: 101, buyer_id: 1, buyer_name: "GreenTech Solutions", material: "Wood Waste", material_type: "Wood Waste", quantity: 200.0, total_price: 1700.0, carbon_saved: 0.08, status: "completed", created_at: "2026-08-10" }
];

const DEFAULT_BUYER_REQUESTS = [
    { id: 301, buyer_id: 1, buyer_name: "GreenTech Solutions", material_type: "Wood Waste", quantity: 500.0, max_price: 10.00, status: "open", created_at: "2026-08-12" }
];

class SupplierState {
    constructor() {
        const storedSupplier = localStorage.getItem('reloop_active_supplier');
        const storedBuyer = localStorage.getItem('reloop_active_buyer');

        if (storedBuyer && !storedSupplier) {
            // Block buyer from cross-accessing supplier portal
            alert('🚫 Buyer accounts cannot access the Supplier Portal. Redirecting to Buyer Portal...');
            window.location.href = 'buyer.html';
            return;
        }

        if (!storedSupplier) {
            window.location.href = 'login.html?role=supplier';
            return;
        }

        this.currentUser = JSON.parse(storedSupplier);
        this.users = JSON.parse(localStorage.getItem('reloop_users')) || DEFAULT_USERS;
        this.verifications = JSON.parse(localStorage.getItem('reloop_verifications')) || DEFAULT_VERIFICATIONS;
        this.listings = JSON.parse(localStorage.getItem('reloop_listings')) || DEFAULT_LISTINGS;
        this.orders = JSON.parse(localStorage.getItem('reloop_orders')) || DEFAULT_ORDERS;
        this.buyerRequests = JSON.parse(localStorage.getItem('reloop_buyer_requests')) || DEFAULT_BUYER_REQUESTS;
    }

    save() {
        localStorage.setItem('reloop_users', JSON.stringify(this.users));
        localStorage.setItem('reloop_verifications', JSON.stringify(this.verifications));
        localStorage.setItem('reloop_listings', JSON.stringify(this.listings));
        localStorage.setItem('reloop_orders', JSON.stringify(this.orders));
        localStorage.setItem('reloop_buyer_requests', JSON.stringify(this.buyerRequests));
        localStorage.setItem('reloop_active_supplier', JSON.stringify(this.currentUser));
    }
}

const state = new SupplierState();

function updateSupplierBadge() {
    const badge = document.getElementById('supplier-user-badge');
    const authBtn = document.getElementById('supplier-auth-btn');

    if (state.currentUser) {
        badge.innerHTML = `👤 ${state.currentUser.name}`;
        badge.style.color = 'var(--primary-mint)';
        authBtn.innerHTML = '🔓 Sign Out to Home';
        authBtn.onclick = handleSupplierSignOut;

        const sName = document.getElementById('supplier-welcome-name');
        if (sName) sName.innerText = `Welcome, ${state.currentUser.name}`;
    }
}

function handleSupplierSignOut() {
    localStorage.removeItem('reloop_active_supplier');
    window.location.href = 'index.html';
}

function switchSupplierSubtab(tabName) {
    document.querySelectorAll('.subtab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));

    const navItem = document.querySelector(`.subtab-item[data-subtab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');

    const content = document.getElementById(`subtab-${tabName}`);
    if (content) content.classList.add('active');

    if (tabName === 'supplier-dash') renderSupplierDashboard();
    if (tabName === 'supplier-inventory') renderSupplierInventory();
    if (tabName === 'supplier-requests') renderSupplierBuyerRequests();
}

function updateSupplierBadge() {
    const badge = document.getElementById('supplier-user-badge');
    const authBtn = document.getElementById('supplier-auth-btn');

    if (state.currentUser) {
        badge.innerHTML = `👤 ${state.currentUser.name} (SUPPLIER)`;
        badge.style.color = 'var(--primary-mint)';
        authBtn.innerHTML = '🔓 Sign Out';
        authBtn.onclick = handleSupplierSignOut;

        const sName = document.getElementById('supplier-welcome-name');
        if (sName) sName.innerText = `Welcome, ${state.currentUser.name} (Supplier)`;
    } else {
        badge.innerHTML = '👤 Supplier Guest';
        badge.style.color = 'var(--text-dim)';
        authBtn.innerHTML = '🔐 Supplier Sign In';
        authBtn.onclick = openSupplierAuthModal;
    }
}

function openSupplierAuthModal() {
    document.getElementById('supplier-auth-modal').classList.add('active');
}

function closeSupplierAuthModal() {
    document.getElementById('supplier-auth-modal').classList.remove('active');
}

function fillDemoSupplierAuth() {
    document.getElementById('supplier-email').value = 'supplier@eco.com';
    document.getElementById('supplier-password').value = 'password123';
}

function handleSupplierAuthSubmit() {
    const email = document.getElementById('supplier-email').value.trim();
    const pass = document.getElementById('supplier-password').value.trim();

    if (!email || !pass) {
        alert('Please enter email and password.');
        return;
    }

    let user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (!user) {
        user = { id: Date.now(), name: email.split('@')[0].toUpperCase(), email: email, password: pass, role: "supplier" };
        state.users.push(user);
    }

    state.currentUser = user;
    state.save();
    updateSupplierBadge();
    closeSupplierAuthModal();
    renderSupplierDashboard();
}

function handleSupplierSignOut() {
    state.currentUser = null;
    state.save();
    updateSupplierBadge();
}

function renderSupplierDashboard() {
    const summaryContainer = document.getElementById('supplier-dash-listings-summary');
    if (!summaryContainer) return;

    const userListings = state.currentUser ? state.listings.filter(l => l.supplier_id === state.currentUser.id || l.supplier_name === state.currentUser.name) : state.listings;

    if (document.getElementById('s-stat-listed')) document.getElementById('s-stat-listed').innerText = userListings.length;
    if (document.getElementById('s-stat-sold')) document.getElementById('s-stat-sold').innerText = state.orders.length;
    if (document.getElementById('s-stat-earnings')) document.getElementById('s-stat-earnings').innerText = `₹${state.orders.reduce((s,o)=>s+o.total_price,0).toLocaleString('en-IN')}`;
    if (document.getElementById('s-stat-co2')) document.getElementById('s-stat-co2').innerText = `${userListings.reduce((s,l)=>s+l.carbon_saved,0).toFixed(2)} t`;

    summaryContainer.innerHTML = `
        <h3 style="color:var(--text-main); margin-bottom:15px;">Active Factory Waste Listings Summary</h3>
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
        supplier_id: state.currentUser ? state.currentUser.id : 3,
        supplier_name: state.currentUser ? state.currentUser.name : "TimberCraft Industries",
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
        supplier_id: state.currentUser ? state.currentUser.id : 3,
        company_name: comp,
        gst_number: gst,
        address: addr,
        status: 'approved',
        trust_score: 9.5
    };

    state.verifications.unshift(newVerification);
    state.save();
    alert('🎉 Business GSTIN verified successfully! Trust index score updated to 9.5/10.');
    switchSupplierSubtab('supplier-dash');
}

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
        let reply = "I can assist you with generating AI material descriptions, verifying GSTIN credentials, or checking open buyer requests!";
        const q = msg.toLowerCase();
        if (q.includes('gst') || q.includes('verify')) reply = "Submit your 15-digit GSTIN number in the Verify Business tab to boost your Trust Score to 9.5/10!";
        else if (q.includes('list') || q.includes('add')) reply = "Use the Add New Material tab and click '🪄 AI Smart Autofill' to automatically write professional industrial descriptions!";
        
        container.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
        container.scrollTop = container.scrollHeight;
    }, 400);
}

document.addEventListener('DOMContentLoaded', () => {
    updateSupplierBadge();
    renderSupplierDashboard();
    renderSupplierInventory();
    renderSupplierBuyerRequests();
    initMotionEngine();
});
