import streamlit as st
import math
from db.db_utils import get_active_listings, create_order

# Ensure user is logged in as buyer
if not st.session_state.user or st.session_state.user["role"] != "buyer":
    st.warning("Please log in as a Buyer to view the AI Matcher.")
    st.switch_page("pages/buyer_login.py")
    st.stop()

user = st.session_state.user

st.title("🤖 AI Smart Matching Engine")
st.caption("Multi-factor algorithm evaluating material specifications, distance, pricing, supplier trust scores, and carbon offset.")

# Sourcing Requirement Inputs
st.subheader("🎯 Define Your Sourcing Requirements")

col1, col2, col3 = st.columns(3)
with col1:
    req_material = st.text_input("Material Keyword / Needs", placeholder="e.g. Copper, Cotton, Slag...")
with col2:
    req_qty = st.number_input("Required Quantity (kg)", min_value=1.0, value=500.0, step=50.0)
with col3:
    req_max_price = st.number_input("Max Budget (₹/kg)", min_value=0.0, value=250.0, step=5.0)

# Location coordinates simulation
col_loc1, col_loc2 = st.columns(2)
with col_loc1:
    buyer_lat = st.number_input("Factory Latitude", value=19.0760, format="%.4f")
with col_loc2:
    buyer_lon = st.number_input("Factory Longitude", value=72.8777, format="%.4f")

# Priority Weightings
st.markdown("##### ⚙️ Matching Optimization Weights")
w_dist = st.slider("Weight: Proximity / Shortest Distance", 0.0, 1.0, 0.3, step=0.1)
w_price = st.slider("Weight: Lowest Price", 0.0, 1.0, 0.4, step=0.1)
w_trust = st.slider("Weight: Highest Supplier Trust", 0.0, 1.0, 0.3, step=0.1)

def haversine_distance(lat1, lon1, lat2, lon2):
    # Dummy lat/lon generator if not in database
    R = 6371.0 # Earth radius km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

if st.button("🚀 Calculate AI Recommendations", use_container_width=True):
    if not req_material:
        st.error("Please specify a material keyword to match.")
    else:
        all_listings = get_active_listings()
        
        matches = []
        for l in all_listings:
            # Check keyword match
            if req_material.lower() in l["material"].lower() or req_material.lower() in (l["description"] or "").lower() or req_material.lower() in l["material_type"].lower():
                # Simulated distance
                dist = haversine_distance(buyer_lat, buyer_lon, 19.1200 + (l["id"] % 5)*0.1, 72.8900 + (l["id"] % 5)*0.1)
                l["distance_km"] = dist
                
                # Normalize metrics (0 to 1)
                dist_score = max(0.0, 1.0 - (dist / 500.0))
                price_score = max(0.0, 1.0 - (l["price_per_kg"] / max(req_max_price, 1.0))) if l["price_per_kg"] <= req_max_price else 0.1
                trust_val = (l["trust_score"] if l["trust_score"] is not None else 5.0) / 10.0
                
                # Calculate composite match score
                total_w = w_dist + w_price + w_trust
                if total_w == 0:
                    total_w = 1.0
                    
                composite_score = ((dist_score * w_dist) + (price_score * w_price) + (trust_val * w_trust)) / total_w
                l["match_score"] = composite_score * 100.0
                
                matches.append(l)
                
        if not matches:
            st.warning("No listings found matching that material keyword. Ask the AI assistant or browse the Marketplace.")
        else:
            st.success(f"Located {len(matches)} matches! Calculating smart recommendations...")
            
            # Identify specific award-winners
            best_match = max(matches, key=lambda x: x["match_score"])
            cheapest = min(matches, key=lambda x: x["price_per_kg"])
            nearest = min(matches, key=lambda x: x["distance_km"])
            highest_trust = max(matches, key=lambda x: x["trust_score"] if x["trust_score"] is not None else 5.0)
            
            # Display Award Cards
            col_award1, col_award2, col_award3, col_award4 = st.columns(4)
            
            with col_award1:
                st.markdown(f"""
<div class="reloop-card" style="border-color: #00FFC0; height: 260px;">
<h3 style="color: #00FFC0; font-size: 16px; margin-top: 0;">🥇 Best Match</h3>
<h4 style="margin: 10px 0; color: #F8FAFC;">{best_match['material'].title()}</h4>
<p style="font-size: 13px; color: #CBD5E1; min-height: 45px;">Seller: {best_match['supplier_name']}<br>Location: {best_match['location']}</p>
<h2 style="color: #00FFC0; margin: 10px 0; font-size: 24px;">{best_match['match_score']:.1f}%</h2>
<p style="font-size: 11px; color: #94A3B8; margin: 0;">Optimized match score</p>
</div>
""", unsafe_allow_html=True)
                if st.button("Procure Best Match", key="btn_procure_best", use_container_width=True):
                    val = best_match['quantity'] * best_match['price_per_kg']
                    create_order(best_match['id'], user['id'], best_match['quantity'], val)
                    st.success("Best Match procured!")
                    st.rerun()
                    
            with col_award2:
                st.markdown(f"""
<div class="reloop-card" style="border-color: #38BDF8; height: 260px;">
<h3 style="color: #38BDF8; font-size: 16px; margin-top: 0;">📍 Nearest</h3>
<h4 style="margin: 10px 0; color: #F8FAFC;">{nearest['material'].title()}</h4>
<p style="font-size: 13px; color: #CBD5E1; min-height: 45px;">Seller: {nearest['supplier_name']}<br>Location: {nearest['location']}</p>
<h2 style="color: #38BDF8; margin: 10px 0; font-size: 24px;">{nearest['distance_km']:.1f} km</h2>
<p style="font-size: 11px; color: #94A3B8; margin: 0;">Shortest transport route</p>
</div>
""", unsafe_allow_html=True)
                if st.button("Procure Nearest", key="btn_procure_near", use_container_width=True):
                    val = nearest['quantity'] * nearest['price_per_kg']
                    create_order(nearest['id'], user['id'], nearest['quantity'], val)
                    st.success("Nearest procured!")
                    st.rerun()
                    
            with col_award3:
                st.markdown(f"""
<div class="reloop-card" style="border-color: #F59E0B; height: 260px;">
<h3 style="color: #F59E0B; font-size: 16px; margin-top: 0;">💰 Cheapest</h3>
<h4 style="margin: 10px 0; color: #F8FAFC;">{cheapest['material'].title()}</h4>
<p style="font-size: 13px; color: #CBD5E1; min-height: 45px;">Seller: {cheapest['supplier_name']}<br>Location: {cheapest['location']}</p>
<h2 style="color: #F59E0B; margin: 10px 0; font-size: 24px;">₹{cheapest['price_per_kg']:.1f}/kg</h2>
<p style="font-size: 11px; color: #94A3B8; margin: 0;">Lowest cost per unit</p>
</div>
""", unsafe_allow_html=True)
                if st.button("Procure Cheapest", key="btn_procure_cheap", use_container_width=True):
                    val = cheapest['quantity'] * cheapest['price_per_kg']
                    create_order(cheapest['id'], user['id'], cheapest['quantity'], val)
                    st.success("Cheapest procured!")
                    st.rerun()
                    
            with col_award4:
                st.markdown(f"""
<div class="reloop-card" style="border-color: #EC4899; height: 260px;">
<h3 style="color: #EC4899; font-size: 16px; margin-top: 0;">⭐ Highest Trust</h3>
<h4 style="margin: 10px 0; color: #F8FAFC;">{highest_trust['material'].title()}</h4>
<p style="font-size: 13px; color: #CBD5E1; min-height: 45px;">Seller: {highest_trust['supplier_name']}<br>Trust Score: {highest_trust['trust_score'] or 5.0:.1f}</p>
<h2 style="color: #EC4899; margin: 10px 0; font-size: 24px;">{highest_trust['trust_score'] or 5.0:.1f}/10</h2>
<p style="font-size: 11px; color: #94A3B8; margin: 0;">Vetted credentials index</p>
</div>
""", unsafe_allow_html=True)
                if st.button("Procure Trustworthy", key="btn_procure_trust", use_container_width=True):
                    val = highest_trust['quantity'] * highest_trust['price_per_kg']
                    create_order(highest_trust['id'], user['id'], highest_trust['quantity'], val)
                    st.success("Most trusted procured!")
                    st.rerun()
            
            st.divider()
            
            # Full Matches List
            st.subheader("All Matches Ordered by Match Score")
            sorted_matches = sorted(matches, key=lambda x: x["match_score"], reverse=True)
            
            for m in sorted_matches:
                score_color = "#F43F5E"
                if m["match_score"] >= 80.0:
                    score_color = "#00FFC0"
                elif m["match_score"] >= 50.0:
                    score_color = "#F59E0B"
                    
                st.markdown(f"""
<div class="reloop-card">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
<h4 style="margin: 0; color: #F8FAFC;">♻️ {m['material'].title()}</h4>
<div style="font-size: 18px; font-weight: bold; color: {score_color};">Match Score: {m['match_score']:.1f}%</div>
</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px; color: #CBD5E1; margin-bottom: 15px;">
<div><strong>Supplier:</strong> {m['supplier_name']}</div>
<div><strong>Distance:</strong> 📍 {m['distance_km']:.1f} km</div>
<div><strong>Price:</strong> ₹{m['price_per_kg']:.2f} / kg</div>
<div><strong>Available Quantity:</strong> {m['quantity']:.1f} {m['unit']}</div>
<div><strong>Carbon Offset:</strong> 🌱 {m['carbon_saved']:.2f} t CO₂</div>
<div><strong>Condition Quality:</strong> {m['condition'].upper()}</div>
<div><strong>Expiry / Lifetime:</strong> ⏳ {m['expiry_date'] or 'N/A'}</div>
</div>
</div>
""", unsafe_allow_html=True)
                if st.button(f"🛒 Procure {m['material']} ({m['quantity']} {m['unit']})", key=f"buy_match_{m['id']}", use_container_width=True):
                    total_value = m['quantity'] * m['price_per_kg']
                    create_order(m['id'], user['id'], m['quantity'], total_value)
                    st.success("Successfully purchased!")
                    st.rerun()

# Post Sourcing Request
st.divider()
st.subheader("📢 Post a Sourcing Request")
st.write("Can't find a supplier lot matching your specifications? Post a request so suppliers can see your sourcing needs in their feed!")

from db.db_utils import add_buyer_request

with st.form("buyer_sourcing_form"):
    req_mat_type = st.selectbox("Material Category Needed", ["Wood Waste", "Cotton Waste", "Textile Waste", "Plastic Waste", "Paper Waste", "Metal Scrap", "Organic Waste"])
    req_vol = st.number_input("Volume Needed (kg)", min_value=1.0, value=500.0)
    req_max_price = st.number_input("Maximum Budget Price (₹ / kg)", min_value=0.1, value=15.0)
    
    post_btn = st.form_submit_button("📢 Publish Sourcing Request")
    
if post_btn:
    add_buyer_request(user["id"], req_mat_type, req_vol, req_max_price)
    st.success(f"Successfully posted sourcing request for {req_vol} kg of {req_mat_type}!")
    st.toast("Request posted!", icon="📢")
