# CashZilla — Upgraded Professional Demo (Client-side)

This is a polished, mobile-friendly frontend demo for CashZilla. It is a static site using only the browser `localStorage` to simulate users, earnings, referrals, and withdrawals. For production use, integrate Firebase/Auth/Firestore and server-side validation.

## Included files
- index.html — main dashboard
- styles.css — professional dark theme styling
- app.js — client-side logic (localStorage)
- admin.html — browser admin panel (demo, not secure)
- fake-names.js — sample Indian names for fake withdraw popups
- README.md — this file

## Quick test
1. Unzip and open `index.html` in your phone browser or desktop. The demo stores state in localStorage.
2. Use Admin button — demo password: `CashZilla@123` to open admin.html.
3. To simulate referrals, open `index.html?ref=ANYCODE` — the owner gets ₹250 simulated.

## Deployment (Netlify / GitHub Pages / Firebase)
- Netlify: Drag & drop the folder in Netlify Sites > New site from drag & drop.
- GitHub Pages: Push to a repository and enable GitHub Pages (branch: main, folder: root).
- Firebase (Termux): use firebase-tools `firebase init hosting` and `firebase deploy` (set public folder to this project).

## Notes
- This demo intentionally includes a "hidden deposit" requirement of ₹500 before withdrawal (client-side). For a real app, never hide rules and always validate transactions on a server.
- I can integrate Firebase Auth & Firestore for real referrals, secure admin, and proper withdrawal flows if you want — tell me and I’ll add it.
