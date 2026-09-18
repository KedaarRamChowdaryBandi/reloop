import streamlit as st
import pandas as pd
from db.db_utils import get_supplier_listings, get_supplier_orders

# Ensure user is logged in
if not st.session_state.user or st.session_state.user["role"] != "supplier":
    st.warning("Please log in as a Supplier to view this page.")
    st.switch_page("pages/supplier_login.py")
    st.stop()

user = st.session_state.user

st.title(f"🏭 {user['name']} Control Center")
st.caption("Supplier Dashboard • Manage your circular material inventory, sales metrics, and impact.")

# Fetch listings & orders
listings = get_supplier_listings(user["id"])
orders = get_supplier_orders(user["id"])

# Calculations
total_listed = len(listings)
total_sold = len([l for l in listings if l["status"] == "sold"])
total_earnings = sum(o["total_price"] for o in orders)
total_co2 = sum(l["carbon_saved"] for l in listings)

# Display Metrics
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Total Material Listed</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">{total_listed}</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Material lots listed</p>
</div>
""", unsafe_allow_html=True)

with col2:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Lots Sold</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">{total_sold}</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Transferred to circular chain</p>
</div>
""", unsafe_allow_html=True)

with col3:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Total Earnings</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">₹{total_earnings:,.2f}</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Revenue generated</p>
</div>
""", unsafe_allow_html=True)

with col4:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">CO₂ Diverted</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">{total_co2:,.2f} t</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Offset savings achieved</p>
</div>
""", unsafe_allow_html=True)

st.divider()

# Charts & Data Section
if listings:
    df_listings = pd.DataFrame(listings)
    
    col_chart1, col_chart2 = st.columns(2)
    
    with col_chart1:
        st.markdown("##### Material Types Listed")
        type_counts = df_listings["material_type"].value_counts()
        st.bar_chart(type_counts)
        
    with col_chart2:
        st.markdown("##### Listing Status")
        status_counts = df_listings["status"].value_counts()
        st.bar_chart(status_counts)

st.markdown("---")
st.markdown("### 🚀 Quick Actions")

act_col1, act_col2, act_col3 = st.columns(3)
with act_col1:
    if st.button("➕ Add New Material", use_container_width=True):
        st.switch_page("pages/add_material.py")
with act_col2:
    if st.button("📋 View My Listings", use_container_width=True):
        st.switch_page("pages/my_listings.py")
with act_col3:
    if st.button("📈 Commercial Analytics", use_container_width=True):
        st.switch_page("pages/supplier_analytics.py")
