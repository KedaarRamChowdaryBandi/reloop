import streamlit as st
from theme import load_css

# MUST BE FIRST STREAMLIT CALL
st.set_page_config(
    page_title="ReLoop - AI Circular Economy",
    page_icon="♻️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject Master CSS Design System
load_css()

# Initialize Session State
if "user" not in st.session_state:
    st.session_state.user = None


# Page Definitions
home_page = st.Page("pages/home.py", title="Home", icon="🏠", default=True)
buyer_login = st.Page("pages/buyer_login.py", title="Buyer Portal", icon="🛒")
supplier_login = st.Page("pages/supplier_login.py", title="Supplier Portal", icon="🏭")

# Buyer Pages
buyer_dash = st.Page("pages/buyer_dashboard.py", title="Dashboard", icon="📊", default=True)
marketplace = st.Page("pages/marketplace.py", title="Marketplace", icon="🛒")
ai_matcher = st.Page("pages/ai_matcher.py", title="AI Matcher", icon="🤖")
buyer_verification = st.Page("pages/buyer_verification.py", title="Verification Registry", icon="✅")
price_comparison = st.Page("pages/price_comparison.py", title="Price Comparison", icon="⚖️")
carbon_impact = st.Page("pages/carbon_impact.py", title="Carbon Impact", icon="🌱")
buyer_orders = st.Page("pages/buyer_orders.py", title="My Orders", icon="📦")

# Supplier Pages
supplier_dash = st.Page("pages/supplier_dashboard.py", title="Dashboard", icon="📊", default=True)
supplier_verification = st.Page("pages/supplier_verification.py", title="Verify Business", icon="✅")
add_material = st.Page("pages/add_material.py", title="Add Material", icon="➕")
my_listings = st.Page("pages/my_listings.py", title="My Listings", icon="📋")
buyer_requests = st.Page("pages/buyer_requests.py", title="Buyer Requests", icon="💬")
material_analyzer = st.Page("pages/material_analyzer.py", title="Material Analyzer", icon="🔬")
supplier_analytics = st.Page("pages/supplier_analytics.py", title="Analytics", icon="📈")

# Common Shared Pages
chat_bot = st.Page("pages/ai_chatbot.py", title="AI Assistant", icon="💬")
logout = st.Page("pages/logout.py", title="Logout", icon="🔓")

# Select navigation layout based on Session State
if st.session_state.user is None:
    navigation_structure = {
        "ReLoop": [home_page],
        "Access Portals": [buyer_login, supplier_login],
        "AI Assistant": [chat_bot]
    }
elif st.session_state.user["role"] == "buyer":
    navigation_structure = {
        f"Buyer: {st.session_state.user['name']}": [
            buyer_dash, marketplace, ai_matcher, buyer_verification, price_comparison, carbon_impact, buyer_orders
        ],
        "AI Assistant": [chat_bot],
        "Session Management": [logout]
    }
else:  # supplier
    navigation_structure = {
        f"Supplier: {st.session_state.user['name']}": [
            supplier_dash, supplier_verification, add_material, my_listings, buyer_requests, material_analyzer, supplier_analytics
        ],
        "AI Assistant": [chat_bot],
        "Session Management": [logout]
    }

pg = st.navigation(navigation_structure)
pg.run()