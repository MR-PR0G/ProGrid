<div align="center">
  <h1>🌌 ProSpace Workspace</h1>
  <p><b>Version 0.4.0 • Developed with passion by MR Prog</b></p>
  <p>An ultra-fluid, customizable, offline-first dashboard & workspace for Desktop, Mobile, and Browser Extensions.</p>

  <p>
    <a href="https://github.com/MR-PR0G/ProSpace/releases"><img src="https://img.shields.io/badge/Version-0.4.0-3b82f6.svg?style=flat-square" alt="Version 0.4.0"></a>
    <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Extension%20%7C%20PWA-10b981.svg?style=flat-square" alt="Platform">
    <img src="https://img.shields.io/badge/Engine-Fluid%20Matrix%201.6%20LTS-8b5cf6.svg?style=flat-square" alt="Engine">
    <img src="https://img.shields.io/badge/Offline-100%25%20First-a855f7.svg?style=flat-square" alt="Offline First">
    <img src="https://img.shields.io/badge/Dependencies-0%20Zero-f59e0b.svg?style=flat-square" alt="Zero Dependencies">
    <img src="https://img.shields.io/badge/License-GNU%20GPLv3-06b6d4.svg?style=flat-square" alt="GNU GPLv3">
  </p>
</div>

<div align="center">
  <img src="https://github.com/MR-PR0G/ProSpace/blob/main/Demos/ScreenShots.png" alt="ProSpace Workspace Screenshot" width="92%" style="border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
</div>

---

## 🌟 What is ProSpace?

**ProSpace Workspace** is a high-performance new-tab dashboard and progressive web application built from the ground up with **pure vanilla ES modules and zero runtime dependencies**. It combines fluid spring collision physics with multi-layered Frosted Glass and Google Material 3 aesthetics, delivering an inspiring start page across desktop monitors, tablets, and smartphones.

---

## ✨ Key Capabilities

### ⚡ 0ms Boot & 100% Offline-First Architecture
- **Stale-While-Revalidate Service Worker:** Boots instantly from local cache even without internet. Silent background synchronization keeps components updated.
- **Persistent Local State:** Widgets, custom skins, notes, tasks, weather forecasts, and market history persist reliably in `localStorage`.
- **Zero Framework Overhead:** No heavy bundles or render lags — fluid 60/120 FPS animations on all devices.

### 🌦️ Open-Meteo Live Weather & Offline Forecast
- **Accurate Real-Time Forecasting:** Powered by the open-source Open-Meteo API (identical to Breezy Weather accuracy) with zero API keys required.
- **7-Day Offline Storage:** Stores a full week of high/low temperatures, weather codes, and precipitation probability locally.
- **Worldwide City Search:** Integrated geocoding search for every city, capital, and province worldwide with coordinate auto-resolution.

### 🎨 Dual Design System & Customization
- **Frosted Glass:** Multi-layered translucent panels with backdrop blur (`28px`), specular chromatic borders, and depth lighting.
- **Material 3 (Material You):** Modern tonal surfaces with integrated **Dark Tone / Light Tone** palettes and zero-blur elevation.
- **Dual-Color Gradient Studio:** Built-in interactive studio to craft custom 2-color linear (135°, 90°, 180°) and radial gradient backgrounds with live preview and curated palettes.
- **Curated 4K Wallpaper Gallery:** High-resolution wallpapers with offline base64 image caching and custom file upload support.

### 🧩 ProSpace Fluid Matrix Engine (v1.6 LTS)
- **Locality-First Collision Cascade:** Continuous live collision resolution with downward displacement and mutual swapping — widgets never overlap or deadlock.
- **Dynamic Capacity Scaling:** Automatically expands rows on the fly during drag sessions to accommodate any layout.
- **Universal Pointer Interaction:** Smooth touch, pen, and mouse gesture handling with pointer capture to prevent ghost drags.

### 🗂️ Workspaces & Custom Skins Studio
- **Curated Workspaces:** Ready-to-use default setups featuring top clock, integrated search, task manager, and currency rates.
- **Multi-Slot Custom Skins:** Save and switch between personalized layouts with instant one-tap application.
- **Backup & Restore:** Export and import skin layouts as portable `.json` backup files anytime.

### 📱 Ergonomic Mobile Gestures
- **Universal Long-Press:** Hold down your finger anywhere on the background or directly on any widget for 440ms to activate Edit Mode with haptic feedback.
- **Double-Tap Shortcut:** Double-tap any empty background space to instantly enter customization mode.
- **Quick Customize Button:** Dedicated translucent floating button for rapid one-touch layout customization.
- **Retractable Bottom Shelf:** Thumb-friendly drawer for seamless browsing of widget catalog and appearance settings.

---

## 📦 Widgets Showcase

| Widget | Capabilities & Features |
| :--- | :--- |
| ⏰ **Clock & Date** | 12h/24h precision digital clock, live seconds toggle, Gregorian / Jalali Shamsi / Hijri calendars, worldwide timezones. |
| 🔍 **Multi-Search** | Unified search bar supporting Google, Bing, DuckDuckGo, Brave, and Yandex with Pill, Spotlight, and Minimal shapes. |
| 🌦️ **Live Weather** | Open-Meteo live weather, 7-day offline forecast, apparent temperature, humidity, wind speed, and worldwide geocoding. |
| 📈 **Markets & Finance** | Real-time crypto (BTC, ETH, SOL, TON), forex, gold/oil rates, 24h interactive SVG charts, USD/IRT Iranian Toman toggle. |
| 🔗 **Smart Shortcuts** | High-performance bookmarks with custom vector icons, web favicons, and shape customization (rounded, squircle, pill). |
| 📁 **Smart Folders** | Grouped shortcut collections with drag-to-merge, expanded modal preview, and fast app launching. |
| ⏳ **Focus Timer** | Minimalist Material 3 Pomodoro timer with tap-to-set duration modal and alert chime. |
| 💬 **Daily Wisdom** | Inspiring bilingual quotes (English & Persian) with Science, History, and Philosophy category filters. |
| 📝 **Smart Notes** | Scratchpad with debounced autosave, multi-note persistence, and responsive typography. |
| ✅ **Tasks & Checklist** | Clean task organizer with completed items counter and progress bar. |

---

## 🚀 Getting Started

### Method 1: Progressive Web App (PWA)
1. Open **[mr-pr0g.github.io/ProSpace](https://mr-pr0g.github.io/ProSpace/)** (or your hosted URL).
2. Click **Install ProSpace** from the header or select **Add to Home screen** in your browser menu.
3. Enjoy a full-screen, native application experience that works completely offline.

### Method 2: Browser Extension (Default New Tab)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/MR-PR0G/ProSpace.git
   ```
2. In Google Chrome, Brave, or Microsoft Edge, navigate to:
   ```text
   chrome://extensions/  (or edge://extensions/)
   ```
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** and select the cloned `ProSpace` directory.
5. Open a new tab (`Ctrl + T` / `Cmd + T`) to launch your personalized workspace!

### Method 3: Local Development
Serve the folder with any static HTTP server:
```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js
npx serve .
```
Navigate to `http://localhost:8080` in your browser.

---

## ⌨️ Shortcuts & Gestures

| Action | Mobile Gesture | Desktop / Mouse |
| :--- | :--- | :--- |
| **Enter Edit Mode** | Long-press (440ms) on background or any widget | Long-press left click / Right-click contextmenu |
| **Quick Customize** | Tap the floating **Customize** button | Click the floating **Customize** button |
| **Double-Tap Action** | Double-tap any empty background space | Double-click empty background |
| **Exit Edit Mode** | Tap the floating **Done** button | Click **Done** / Press `Escape` |
| **Move / Reorder** | Drag widget across cells in Edit Mode | Drag widget with mouse in Edit Mode |
| **Resize Widget** | Drag bottom-right corner resize handle | Drag corner handle |
| **Delete Widget** | Drag widget into top **Delete Zone** | Drag into Delete Zone or use Modal Delete |

---

## 📄 License & Author

- **Author:** [MR Prog](https://github.com/MR-PR0G)
- **Repository:** [MR-PR0G/ProSpace](https://github.com/MR-PR0G/ProSpace)
- **License:** Distributed under the **GNU General Public License v3.0 (GNU GPLv3)**. See [LICENSE](LICENSE) for details.
