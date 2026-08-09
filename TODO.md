# TODO — Fix Logout Process Error

## Steps
- [x] 1. Analyze the logout error (root cause: `pages/home.py` not in supplier navigation)
- [x] 2. Read relevant files (webapp.py, pages/logout.py, login pages)
- [x] 3. Get plan approval from user
- [x] 4. Store page objects in `st.session_state["pages"]` in webapp.py
- [x] 5. Update pages/logout.py to switch using the stored page object
- [x] 6. Verify both files compile successfully
