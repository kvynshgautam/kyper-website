# ⚡ KYPER™ Official Portal & Distribution Hub

> **The World's Fastest AI Auto-Reply & Context-Aware Keyboard for Android & Chrome.**  
> *Engineered with Precision by Kavyansh Gautam (KG)*

---

## 🌟 Highlights
- **Direct Dual Platform Distribution**:
  - 🤖 **Android APK (v6.1)**: Silent notification auto-reply, "Tu vs Tum vs Aap" cultural dynamic, uncensored gaali engine, bank OTP shield.
  - 🌐 **Chrome Extension (v5.2)**: Universal DOM injection for WhatsApp Web & Instagram DM with style cloner.
- **Interactive Live Simulator**:
  - Test the KYPER decision matrix live in the browser with 6 message scenarios (Papa, Boss, Dost, Crush, Emergency, Bank OTP) and 4 tones.
- **1-Click Binary Updates**:
  - Run `.\update-release.ps1` to automatically sync newly compiled APKs/Extensions, calculate SHA-256 hashes, and update `public/data/updates.json`.
- **UPI Pro Gateway**:
  - QR Code scanner & one-click copy for `kavyanshgautam1@ptyes` with UTR verification form.
- **Procedural Web Audio FX**:
  - Zero-dependency sound effects powered by standard browser Web Audio API (`AudioContext`).

---

## 🚀 Running Locally

### Option 1: Node.js Express Server
```bash
cd "C:\Users\Kavyansh\Documents\GhostTyper-Website"
npm.cmd start
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📦 How to Push New Updates to Users

Whenever you compile a new APK (e.g. `Kyper-v6.2.apk`):
1. Place it in `C:\Users\Kavyansh\Documents\GhostTyper-Android\Kyper-latest.apk`.
2. Open PowerShell in this folder and run:
   ```powershell
   .\update-release.ps1 -Version "v6.2" -Changelog "Your change notes here"
   ```
3. The script will:
   - Copy the new APK into `public/downloads/Kyper-latest.apk`
   - Compute its exact SHA-256 checksum
   - Update `public/data/updates.json`
   - The website will immediately show the new version, file size, and download link!
