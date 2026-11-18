<div align="center">
  <h1>🌟 ProGrid Workspace</h1>
  <p><b>Version 0.1.7 | Developed by MR Prog</b></p>
  <p>A modern, modular, and fully customizable Liquid Glass workspace for your browser and mobile.</p>

  <img src="https://img.shields.io/badge/Version-0.1.7-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Extension%20%7C%20PWA-success.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Mobile-Optimized-brightgreen.svg" alt="Mobile Optimized">
</div>

<div align="center">
  <img src="https://github.com/MR-PR0G/ProGrid/blob/main/Demos/ScreenShots.png" alt="ScreenShot" width="90%" style="">
</div>

---

## 🚀 What's New in v0.1.7
- **🛡️ Fix Connection Security / Reset Error:**
  - Resolved `ERR_CONNECTION_RESET` / "Secure Connection Failed" by eliminating `undefined` responses in the Service Worker's fetch handler.
  - Bypassed cross-origin requests (e.g. Unsplash images, search engines) from Service Worker hijacking so they load natively without CORS or security errors.
  - Implemented ultra-fast **Stale-While-Revalidate** strategy for local assets: cached assets render in **0ms**, and are updated smoothly in the background.
  - Guaranteed offline and network fallback: navigation requests safely fall back to cached `index.html`.
- **⚡ Preload & Performance Optimizations:**
  - Added preconnect links for external CDNs and preloaded critical CSS & JavaScript bundles in `<head>` for instant paint.
- **✨ Redesigned Modern Install Banner:**
  - Replaced the awkward corner bubble with a native-style, glassmorphic bottom toast (`#web-install-banner`) featuring app icon, crisp typography, 1-click Install button, and a dismiss (`✕`) action that persists for 5 days.
  - Hidden automatically in standalone PWA mode and edit mode.

## ✨ Key Features in v0.1.5
- **🔒 Strictly Fixed Viewport Grid (No Unwanted Row Expansion):**
  - Completely resolved the grid expansion bug where dragging widgets downwards generated excess rows. The grid rows are strictly bounded by screen viewport metrics and remain 100% stable in both normal and edit modes.
  - Implemented smart **Position Swap Fallback** (SpringBoard style): when widgets collide against grid boundaries, they gracefully swap positions instead of failing or pushing out of bounds.
- **✨ Hover Clipping Fixed on Store Cards:**
  - Removed clipping `translateY` offset on `.store-card:hover` in favor of a soft blue glow ring and internal container padding, preventing cards from being cut off at the top border.
- **📱 Zero-Scroll Compact Appearance Tab:**
  - Redesigned the Appearance drawer tab into a streamlined dock fitting comfortably within the 260px drawer without any vertical scrollbar:
    - HD Wallpapers horizontal gallery with 1-click apply and offline storage.
    - Compact controls dock with gradient presets, blur slider with real-time value label, and theme toggle.
- **🔍 Responsive Search Toggle in Drawer:**
  - Solved cramped search input on mobile: by default, wide subnav pills (`Installed` & `Online Hub`) are displayed with a sleek glass search lens button.
  - Tapping the search icon smoothly expands a full-width search input with auto-focus and instant `✕` close action.
- **🚀 60/120fps Buttery-Smooth Drag & Drop:**
  - Eliminated forced layout reflows and cached scale/bounds at pointerdown.
- **✨ Ergonomic Bottom Action Bar:**
  - **Done** button and **Delete Zone** flank the top edge of the edit drawer and smoothly glide with shelf collapse.
- **🧹 Clean Minimalist Guidance Typography:**
  - Converted top hint pill to pure typography with subtle shadow and zero background box, harmonizing with the fluid wallpaper.
- **📲 Floating Web Install Bubble:**
  - Non-intrusive floating glass bubble (`#web-install-bubble`) shown only when visiting via browser. Completely hidden in standalone PWA mode.
- **💾 100% Offline Wallpapers:**
  - Selected gallery wallpapers are automatically downloaded and cached in device storage as offline base64 data, ensuring instant offline loading anytime.
- **🛍️ Bespoke 142px Widget Store Cards:**
  - Tailored card dimensions (135px width × 142px height) with 34px rounded glass icons, clean typography, and full-width actions filling the 260px drawer perfectly.
- **🎯 3 Clean Core Modules on Default Home Screen:**
  - Initial grid starts with only the 3 essential widgets: **Clock & Date**, **Search Bar**, and **Shortcut**.
  - All other modules (Quick Notes, Checklist, Calculator, Daily Quote, Pomodoro Timer, Smart Folders) are neatly stored in the Widget Store / Online Hub for users to add on demand.
- **🎨 Default Minimalist Graphite Gray Background:**
  - Sophisticated neutral Space Gray / Graphite gradient (`--bg-preset-1`) as the default aesthetic background, perfectly complementing liquid glass translucency.
- **📲 Fixed & Robust PWA "Add to Home Screen":**
  - Fully compliant W3C Web App Manifest with proper standalone, maskable and standard icons, and `id` identity.
  - Interactive multi-platform install guide modal tailored for iOS Safari, Android Chrome/Edge, and Desktop.
- **🎯 Snug SVG Context Menu:** Long-pressing any widget opens an ultra-crisp SVG vector menu placed snugly (5px offset) directly over the widget or touch target.
- **🖼️ 100% Full-Cover HD Wallpapers:** Full-screen coverage (`position: fixed; inset: 0; background-size: cover !important`) without tiling, skewing, or distortion.
- **⚡ Hardware-Accelerated 60/120fps Fluidity:** GPU composition with `transform: translateZ(0)`, CSS `contain: layout style content`, and optimized touch-action handling for butter-smooth mobile performance.
- **Fluid Grid Engine:** Intelligent top-to-bottom gravity grid with 4-column mobile adaptation and multi-column desktop responsiveness.
- **Universal Install (PWA & New Tab):** 1-Click native app installation on Android, iOS, Windows, Mac, and Linux, plus Chrome/Edge/Brave extension support.
- **Modular Widgets:** 
  - ⏰ **Digital Clock & Calendar:** Real-time clock with 12/24h toggle and date display.
  - 📝 **Quick Notes:** Auto-saving sticky notes with debounce storage.
  - 🔗 **Shortcuts & Smart Folders:** Grouping, drag-to-merge, and drag-out capabilities.
  - 🔍 **Search Bar:** Multi-engine instant web search.
  - ✅ **Checklist / Tasks:** Interactive task tracking.
- **📥 Backup & Restore:** 1-Click JSON export and import for seamless cross-device migration.
- **🔒 Privacy First & 100% Offline:** Local caching with high-res local icons. Zero telemetry, zero external trackers.

## 🚀 Installation

### 1. Web App (PWA) - Mobile & Desktop
Simply visit the live GitHub Pages link. Your browser will prompt you to **"Install App"** or **"Add to Home Screen"**. Accept it to install as a standalone native app!

### 2. Browser Extension - Chrome, Edge & Brave
Replace your boring New Tab page with ProGrid:
1. Download this repository as a `.zip` file and extract it.
2. Open your browser and go to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the extracted folder.

## 🛠️ Create Custom Widgets

<details>
<summary><b>Click here to view the developer guide</b></summary>

Every widget is an independent class. Create a new file in the `widgets/` folder (e.g., `mywidget.js`):

```javascript
import { BaseWidget } from './base.js';

export default class MyWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'mywidget', label: 'My Widget', icon: '🚀',
            defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 4,
            defaultConfig: { text: 'Hello from MR Prog', isGlass: true, bg: '#ffffff' }
        };
    }

    postRender(el) {
        // Setup events or timers
    }

    onDestroy(el) {
        // Cleanup timers or listeners
    }
}

window.WidgetGlobals.register(MyWidget);
```
Note: Add your widget filename to the `DYNAMIC_WIDGET_LIST` array inside `js/app.js` and `sw.js`.
