import streamlit as st

# Hero Header with Glassmorphism
st.markdown("""
<div style="
    padding: 40px;
    border-radius: 24px;
    background: linear-gradient(135deg, #071B17 0%, #123524 50%, #1B4332 100%);
    border: 1px solid rgba(0, 230, 118, 0.2);
    text-align: center;
    margin-bottom: 30px;
">
    <h1 style="font-size: 50px; color: #00E676; margin-bottom: 10px; font-family: 'Outfit', sans-serif;">♻️ ReLoop</h1>
    <h3 style="color: white; font-weight: 300;">AI-Powered Circular Economy Marketplace</h3>
    <p style="font-size: 16px; color: #DCE3EA; max-width: 600px; margin: 15px auto;">
        Connecting industrial waste generators with manufacturing buyers. 
        Transform your commercial bypass and waste material into profitable, verified resources.
    </p>
</div>
""", unsafe_allow_html=True)

# Platform Statistics Section
st.markdown("<h3 style='text-align: center; margin-bottom: 20px;'>📈 Platform Overview</h3>", unsafe_allow_html=True)
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("""
    <div class="reloop-card" style="text-align: center; padding: 15px;">
        <h4 style="color: #888;">Verified Suppliers</h4>
        <h1 style="color: #00E676; margin: 10px 0;">128+</h1>
        <p style="color: #2e7d32; font-size: 12px;">▲ 12 this month</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="reloop-card" style="text-align: center; padding: 15px;">
        <h4 style="color: #888;">Active Listings</h4>
        <h1 style="color: #00E676; margin: 10px 0;">842</h1>
        <p style="color: #2e7d32; font-size: 12px;">▲ 54 this week</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="reloop-card" style="text-align: center; padding: 15px;">
        <h4 style="color: #888;">CO₂ Prevented</h4>
        <h1 style="color: #00E676; margin: 10px 0;">48.6 t</h1>
        <p style="color: #2e7d32; font-size: 12px;">▲ 4.8 tons saved</p>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown("""
    <div class="reloop-card" style="text-align: center; padding: 15px;">
        <h4 style="color: #888;">Transactions</h4>
        <h1 style="color: #00E676; margin: 10px 0;">389</h1>
        <p style="color: #2e7d32; font-size: 12px;">▲ 21 completed</p>
    </div>
    """, unsafe_allow_html=True)

st.divider()

# Navigation Portals Cards
st.markdown("<h2 style='text-align: center; margin-bottom: 25px;'>Select Your Portal</h2>", unsafe_allow_html=True)
p_col1, p_col2 = st.columns(2)

with p_col1:
    st.markdown("""
    <div class="reloop-card" style="height: 250px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🛒</div>
        <h3>Buyer Portal</h3>
        <p style="color: #aaa; min-height: 80px;">
            Find verified raw materials, compare listing prices against market value indexes, 
            run smart matching queries, and calculate your exact carbon diversion impact.
        </p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Enter Buyer Portal", use_container_width=True, key="btn_buyer_enter"):
        st.switch_page("pages/buyer_login.py")

with p_col2:
    st.markdown("""
    <div class="reloop-card" style="height: 250px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🏭</div>
        <h3>Supplier Portal</h3>
        <p style="color: #aaa; min-height: 80px;">
            Verify your business credentials, list factory byproducts with AI text parsing, 
            receive real-time buyer purchase requests, and analyze your sales metrics.
        </p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Enter Supplier Portal", use_container_width=True, key="btn_supplier_enter"):
        st.switch_page("pages/supplier_login.py")

st.divider()

# Platform Features Showcase
st.markdown("<h3 style='margin-bottom: 20px;'>💡 ReLoop Features</h3>", unsafe_allow_html=True)
feat_col1, feat_col2, feat_col3 = st.columns(3)

with feat_col1:
    st.info("""
    **✅ Trust Verification**
    Every supplier is vetted against official registry codes (such as GST details) and factory documents before listing is activated.
    """)

with feat_col2:
    st.info("""
    **⚖️ Price Intelligence**
    Understand market values. Compare historical values with seller listings to buy materials at fair circular prices.
    """)

with feat_col3:
    st.info("""
    **🤖 Smart Recommendation**
    Our integrated matcher checks distance, prices, and trust scores to recommend the absolute optimal byproduct matches.
    """)

st.caption("♻️ ReLoop • Circular Industry Marketplace • Built with Streamlit")
