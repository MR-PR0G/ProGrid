<div align="center">
  <h1>🌟 ProGrid Workspace</h1>
  <p><b>Version 0.1.2 | Developed by MR Prog</b></p>
  <p>A modern, modular, and fully customizable Liquid Glass workspace for your browser and mobile.</p>

  <img src="https://img.shields.io/badge/Version-0.1.2-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Extension%20%7C%20PWA-success.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Mobile-Optimized-brightgreen.svg" alt="Mobile Optimized">
</div>

<div align="center">
  <img src="https://github.com/MR-PR0G/ProGrid/blob/main/Demos/ScreenShots.png" alt="ScreenShot" width="90%" style="">
</div>

---

## ✨ Key Features in v0.1.2
- **📲 Fixed & Robust PWA "Add to Home Screen":**
  - Fully compliant W3C Web App Manifest with proper standalone, maskable and standard icons, and `id` identity.
  - Early `beforeinstallprompt` capture in HTML head preventing missed events.
  - Interactive multi-platform install guide modal tailored for iOS Safari (Share -> Add to Home Screen), Android Chrome/Edge, and Desktop.
  - Removed service worker controller reload loops preventing install cancellation.
- **🎯 3 Clean Core Modules on Default Home Screen:**
  - Initial grid starts with only the 3 essential widgets: **Clock & Date**, **Search Bar**, and **Shortcut**.
  - All other modules (Quick Notes, Checklist, Calculator, Daily Quote, Pomodoro Timer, Smart Folders) are neatly stored in the Widget Store / Online Hub for users to add on demand.
- **🎨 Default Minimalist Graphite Gray Background:**
  - Sophisticated neutral Space Gray / Graphite gradient (`--bg-preset-1`) as the default aesthetic background, perfectly complementing liquid glass translucency.
- **📱 Solid Mobile Grid (iPhone SE & Compact Phones):** Fixed 4-column gravity layout with stable 74–82px cell metrics. Grid dimensions never shrink vertically or compress widgets into unusable sizes on small screens.
- **📐 High-Clearance Edit Mode Zoom-Out:** Clean separation between workspace and bottom shelf, ensuring the grid canvas never goes under or collides with the drawer.
- **✨ Minimalist Glass Widget Drawer:** Sleek, compact bottom shelf with centered segmented tabs (`Widgets`, `Appearance`), real-time search, and 1-tap quick add.
- **🎯 Snug SVG Context Menu:** Long-pressing any widget opens an ultra-crisp SVG vector menu placed snugly (5px offset) directly over the widget or touch target, eliminating excessive floating gaps.
- **🖼️ 100% Full-Cover HD Wallpapers:** Full-screen coverage (`position: fixed; inset: 0; background-size: cover !important`) without tiling, skewing, or distortion.
- **🧹 Cleaned Home Interface:** Removed unnecessary floating search overlay button from home canvas—integrated search is neatly centralized in the widget drawer.
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
