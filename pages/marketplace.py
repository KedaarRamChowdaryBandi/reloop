import streamlit as st
from db.db_utils import get_active_listings, create_order

# Ensure user is logged in as buyer
if not st.session_state.user or st.session_state.user["role"] != "buyer":
    st.warning("Please log in as a Buyer to browse the Marketplace.")
    st.switch_page("pages/buyer_login.py")
    st.stop()

user = st.session_state.user

st.title("🛒 Circular Industrial Marketplace")
st.caption("Discover, evaluate, and procure verified industrial waste streams and factory byproducts.")

# Search & Filters Bar
with st.container():
    col1, col2, col3, col4 = st.columns([3, 2, 2, 2])
    with col1:
        search_query = st.text_input("🔍 Search Materials / Locations", placeholder="e.g. Copper, Slag, Mumbai...")
    with col2:
        category_filter = st.selectbox(
            "Material Category",
            ["All Categories", "Metals & Alloys", "Plastics & Polymers", "Chemicals & Solvents", "Textiles & Fiber", "Glass & Ceramics", "Paper & Wood"]
        )
    with col3:
        max_price = st.number_input("Max Price (₹/kg)", min_value=0.0, value=1000.0, step=10.0)
    with col4:
        condition_filter = st.selectbox("Condition / Quality", ["All Conditions", "Raw Scrap", "Sorted & Cleaned", "Processed Pellets", "Industrial Grade"])

# Fetch Active Listings
all_listings = get_active_listings()

# Filter Logic
listings = []
for l in all_listings:
    # Match query
    q = search_query.strip().lower()
    if q and (q not in l["material"].lower() and q not in l["location"].lower() and q not in (l["description"] or "").lower()):
        continue
    # Match category
    if category_filter != "All Categories" and l["material_type"].lower() != category_filter.lower():
        continue
    # Match price
    if l["price_per_kg"] > max_price:
        continue
    # Match condition
    if condition_filter != "All Conditions" and l["condition"].lower() != condition_filter.lower():
        continue
    
    listings.append(l)

st.markdown("---")

if not listings:
    st.info("No active listings found matching your search criteria. Try adjusting your filters.")
else:
    st.markdown(f"##### Showing {len(listings)} active listing(s)")
    
    for l in listings:
        status_val = l["status"]
        if status_val == "verified" or l["trust_score"] and l["trust_score"] >= 7.5:
            badge = '<span class="badge-verified">✅ Verified Supplier</span>'
        elif status_val == "sold":
            badge = '<span class="badge-sold">🔴 Sold</span>'
        else:
            badge = '<span class="badge-info">ℹ️ Active Listing</span>'
            
        trust_score = l["trust_score"] if l["trust_score"] is not None else 5.0
        trust_color = "#00FFC0" if trust_score >= 8.0 else "#F59E0B" if trust_score >= 5.0 else "#F43F5E"
        
        col_card, col_action = st.columns([4, 1])
        
        with col_card:
            st.markdown(f"""
<div class="reloop-card">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
<h3 style="margin: 0; color: #00FFC0;">{l['material'].title()}</h3>
<div>{badge}</div>
</div>
<p style="color: #CBD5E1; font-style: italic; font-size: 13px; margin-bottom: 12px;">{l['description'] or 'No description provided.'}</p>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 13px; color: #CBD5E1;">
<div><strong>Quantity:</strong> {l['quantity']} {l['unit']}</div>
<div><strong>Price per kg:</strong> ₹{l['price_per_kg']:.2f}</div>
<div><strong>Estimated Value:</strong> ₹{(l['quantity'] * l['price_per_kg']):,.2f}</div>
<div><strong>Source Location:</strong> 📍 {l['location'].title()}</div>
<div><strong>Condition Quality:</strong> {l['condition'].upper()}</div>
<div><strong>Supplier:</strong> {l['supplier_name']}</div>
<div><strong>Carbon Saved:</strong> 🌱 {l['carbon_saved']:.2f} t CO₂</div>
<div><strong>Expiry / Lifetime:</strong> ⏳ {l['expiry_date'] or 'N/A'}</div>
<div>
<strong>AI Trust Score:</strong> 
<span style="color: {trust_color}; font-weight: bold;">{trust_score:.1f} / 10.0</span>
</div>
</div>
</div>
""", unsafe_allow_html=True)
            
        with col_action:
            st.write("")
            st.write("")
            st.write("")
            total_value = l['quantity'] * l['price_per_kg']
            st.metric("Total Cost", f"₹{total_value:,.1f}")
            if st.button("🛒 Procure", key=f"buy_{l['id']}", use_container_width=True):
                # Execute purchase
                create_order(
                    listing_id=l['id'],
                    buyer_id=user["id"],
                    quantity=l['quantity'],
                    total_price=total_value
                )
                st.success(f"Successfully purchased {l['material']}!")
                st.rerun()
