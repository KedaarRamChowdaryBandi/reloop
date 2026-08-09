import streamlit as st

st.session_state.user = None
st.success("You have been successfully logged out.")
st.switch_page("pages/home.py")
