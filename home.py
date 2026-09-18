import streamlit as st

# ==========================================
# HERO SECTION
# ==========================================

st.markdown("""
<div style="
padding: 50px 30px;
border-radius: 24px;
background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.85) 60%, rgba(6, 182, 212, 0.20) 100%);
border: 1px solid rgba(16, 185, 129, 0.35);
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
backdrop-filter: blur(16px);
text-align: center;
margin-bottom: 35px;
">
<h1 style="font-size: 54px; margin-bottom: 10px; font-family: 'Sora', sans-serif;">
♻️ ReLoop
</h1>
<h3 style="color: #00FFC0 !important; font-weight: 500; font-size: 24px; margin-top: 0;">
AI-Powered Circular Economy Marketplace
</h3>
<p style="font-size: 17px; color: #E2E8F0 !important; max-width: 680px; margin: 15px auto 0 auto; line-height: 1.7;">
Connecting industrial waste generators with manufacturing buyers.
Transform waste streams into verified, valuable resources and
accelerate the circular economy.
</p>
</div>
""", unsafe_allow_html=True)

# ==========================================
# PLATFORM OVERVIEW
# ==========================================

st.markdown(
    "<h2 style='text-align:center;margin-bottom:25px;'>📈 Platform Overview</h2>",
    unsafe_allow_html=True
)

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("""
<div class="reloop-card" style="text-align:center;">
<h4 style="color:#94A3B8;">Verified Suppliers</h4>
<h1 style="color:#00FFC0 !important; -webkit-text-fill-color:#00FFC0 !important; margin:10px 0;">128+</h1>
<p style="color:#00FFC0;font-weight:600;font-size:13px;margin:0;">
▲ 12 this month
</p>
</div>
""", unsafe_allow_html=True)

with col2:
    st.markdown("""
<div class="reloop-card" style="text-align:center;">
<h4 style="color:#94A3B8;">Active Listings</h4>
<h1 style="color:#00FFC0 !important; -webkit-text-fill-color:#00FFC0 !important; margin:10px 0;">842</h1>
<p style="color:#00FFC0;font-weight:600;font-size:13px;margin:0;">
▲ 54 this week
</p>
</div>
""", unsafe_allow_html=True)

with col3:
    st.markdown("""
<div class="reloop-card" style="text-align:center;">
<h4 style="color:#94A3B8;">CO₂ Prevented</h4>
<h1 style="color:#00FFC0 !important; -webkit-text-fill-color:#00FFC0 !important; margin:10px 0;">48.6 t</h1>
<p style="color:#00FFC0;font-weight:600;font-size:13px;margin:0;">
▲ 4.8 tons saved
</p>
</div>
""", unsafe_allow_html=True)

with col4:
    st.markdown("""
<div class="reloop-card" style="text-align:center;">
<h4 style="color:#94A3B8;">Transactions</h4>
<h1 style="color:#00FFC0 !important; -webkit-text-fill-color:#00FFC0 !important; margin:10px 0;">389</h1>
<p style="color:#00FFC0;font-weight:600;font-size:13px;margin:0;">
▲ 21 completed
</p>
</div>
""", unsafe_allow_html=True)

st.divider()

# ==========================================
# PORTALS
# ==========================================

st.markdown(
    "<h2 style='text-align:center;margin-bottom:25px;'>Select Your Portal</h2>",
    unsafe_allow_html=True
)

p_col1, p_col2 = st.columns(2)

with p_col1:
    st.markdown("""
<div class="reloop-card" style="height:260px;">
<div style="font-size:42px;">🛒</div>
<h3 style="color:#00FFC0 !important;">
Buyer Portal
</h3>
<p style="line-height:1.7; color:#CBD5E1 !important;">
Find verified raw materials, compare listing prices
against market value indexes, run smart matching
queries, and calculate your carbon diversion impact.
</p>
</div>
""", unsafe_allow_html=True)

    if st.button(
        "Enter Buyer Portal",
        use_container_width=True,
        key="buyer_btn"
    ):
        st.switch_page("pages/buyer_login.py")

with p_col2:
    st.markdown("""
<div class="reloop-card" style="height:260px;">
<div style="font-size:42px;">🏭</div>
<h3 style="color:#00FFC0 !important;">
Supplier Portal
</h3>
<p style="line-height:1.7; color:#CBD5E1 !important;">
Verify your business credentials, list factory
byproducts using AI-assisted descriptions,
receive buyer requests, and analyze sales metrics.
</p>
</div>
""", unsafe_allow_html=True)

    if st.button(
        "Enter Supplier Portal",
        use_container_width=True,
        key="supplier_btn"
    ):
        st.switch_page("pages/supplier_login.py")

st.divider()

# ==========================================
# FEATURES
# ==========================================

st.markdown(
    "<h2 style='margin-bottom:20px;'>💡 ReLoop Features</h2>",
    unsafe_allow_html=True
)

feat1, feat2, feat3 = st.columns(3)

with feat1:
    st.markdown("""
<div class="reloop-card">
<h4 style="color:#00FFC0;">✅ Trust Verification</h4>
<p style="color:#CBD5E1;">
Every supplier is vetted using official
business registration records and
supporting factory documentation.
</p>
</div>
""", unsafe_allow_html=True)

with feat2:
    st.markdown("""
<div class="reloop-card">
<h4 style="color:#00FFC0;">⚖️ Price Intelligence</h4>
<p style="color:#CBD5E1;">
Compare market index values with
supplier listings to identify
fair-value sourcing opportunities.
</p>
</div>
""", unsafe_allow_html=True)

with feat3:
    st.markdown("""
<div class="reloop-card">
<h4 style="color:#00FFC0;">🤖 Smart Recommendation</h4>
<p style="color:#CBD5E1;">
AI evaluates distance, pricing,
supplier trust scores and demand
to recommend optimal matches.
</p>
</div>
""", unsafe_allow_html=True)

st.divider()

# ==========================================
# FOOTER
# ==========================================

st.markdown("""
<div style="text-align:center; padding:20px; color:#94A3B8; font-size:14px;">
♻️ <b style="color:#00FFC0;">ReLoop</b> | Circular Industry Marketplace <br>
Connecting Waste to Value Through AI
</div>
""", unsafe_allow_html=True)