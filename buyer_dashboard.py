import streamlit as st
import pandas as pd
from db.db_utils import get_buyer_orders

# Ensure user is logged in
if not st.session_state.user or st.session_state.user["role"] != "buyer":
    st.warning("Please log in as a Buyer to view this page.")
    st.switch_page("pages/buyer_login.py")
    st.stop()

user = st.session_state.user

st.title(f"📊 Welcome, {user['name']}")
st.caption("Buyer Dashboard • View your circular procurement and environmental metrics.")

# Fetch Buyer Orders
orders = get_buyer_orders(user["id"])

# Compute Metrics
total_procured = sum(o["quantity"] for o in orders)
total_spent = sum(o["total_price"] for o in orders)
total_co2 = sum(o["carbon_saved"] for o in orders)
order_count = len(orders)

# Layout: Metric columns
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Materials Purchased</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">{total_procured:,.1f} kg</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Procured waste byproducts</p>
</div>
""", unsafe_allow_html=True)

with col2:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Total Spent</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">₹{total_spent:,.2f}</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Circularity investments</p>
</div>
""", unsafe_allow_html=True)

with col3:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Total CO₂ Saved</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">{total_co2:,.2f} t</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Carbon footprint reduction</p>
</div>
""", unsafe_allow_html=True)

with col4:
    st.markdown(f"""
<div class="reloop-card" style="text-align: center;">
<h4 style="color: #94A3B8; font-size: 14px; margin: 0;">Total Transactions</h4>
<h2 style="color: #00FFC0 !important; -webkit-text-fill-color: #00FFC0 !important; margin: 10px 0;">{order_count}</h2>
<p style="color: #CBD5E1; font-size: 11px; margin: 0;">Completed orders</p>
</div>
""", unsafe_allow_html=True)

st.divider()

# Charts & Analytics
if orders:
    df = pd.DataFrame(orders)
    col_chart1, col_chart2 = st.columns(2)
    
    with col_chart1:
        st.markdown("##### Spending Timeline")
        df['date'] = pd.to_datetime(df['created_at'])
        spending_over_time = df.groupby(df['date'].dt.date)['total_price'].sum()
        st.line_chart(spending_over_time)
        
    with col_chart2:
        st.markdown("##### Material Types Purchased")
        mat_counts = df['material_type'].value_counts()
        st.bar_chart(mat_counts)

st.markdown("---")
st.markdown("### 🚀 Quick Actions")

act_col1, act_col2, act_col3 = st.columns(3)
with act_col1:
    if st.button("🛒 Browse Marketplace", use_container_width=True):
        st.switch_page("pages/marketplace.py")
with act_col2:
    if st.button("🤖 Run AI Matcher", use_container_width=True):
        st.switch_page("pages/ai_matcher.py")
with act_col3:
    if st.button("⚖️ Price Comparison", use_container_width=True):
        st.switch_page("pages/price_comparison.py")
