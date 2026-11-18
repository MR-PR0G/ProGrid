<div align="center">
  <h1>🌟 ProGrid Workspace</h1>
  <p><b>Version 0.1.9 | Developed by MR Prog</b></p>
  <p>A high-performance, modular, and fully customizable Liquid Glass workspace & dashboard for web, mobile, and browser extensions.</p>

  <img src="https://img.shields.io/badge/Version-0.1.9-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Extension%20%7C%20PWA-success.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Performance-0ms%20Cached%20Start-emerald.svg" alt="0ms Start">
  <img src="https://img.shields.io/badge/Offline-100%25%20First-purple.svg" alt="Offline First">
  <img src="https://img.shields.io/badge/Mobile-Optimized-brightgreen.svg" alt="Mobile Optimized">
</div>

<div align="center">
  <img src="https://github.com/MR-PR0G/ProGrid/blob/main/Demos/ScreenShots.png" alt="ScreenShot" width="90%">
</div>

---

## ✨ Overview

**ProGrid Workspace** is a next-generation new-tab dashboard and progressive web application (PWA) inspired by Apple Liquid Glass aesthetics and modern desktop ergonomics. Built from the ground up with zero external framework dependencies, it provides an ultra-fluid 60/120fps customizable workspace with instant offline persistence.

---

## 💎 Key Features & Architecture

### ⚡ 0ms Instant Startup & Resilient Offline Caching
- **Stale-While-Revalidate Engine:** High-efficiency Service Worker delivers cached assets locally in **0ms**, performing silent background synchronization without network lag.
- **Offline-First Security & Isolation:** Dedicated origin boundary protection for all app assets, guaranteeing safe navigation fallbacks and native cross-origin search execution.
- **Preload Acceleration:** Strategic preconnect and asset preloading for immediate DOM paint.

### 🧩 Physics-Driven Fluid Grid
- **Strict Viewport Geometry:** Dimensioned dynamically against available viewport height with automatic aspect-ratio scaling.
- **SpringBoard Collision Physics:** iOS-style magnetic drag, drop, and automatic position swapping when widgets encounter grid boundaries.
- **Dynamic Scale Compensation:** Matrix scaling preserves pixel-perfect touch and drag coordinates across varying DPI and mobile displays.

### 🎨 Liquid Glass Design System
- **Deep Glassmorphism:** Translucent multi-layered surfaces with dynamic backdrop blur (`28px`), tonal specular highlights, and chromatic borders.
- **Minimalist Default Theme:** Subtle Space Gray / Graphite gradient paired with a curated 3-widget starter layout (Clock & Date, Search, and Shortcuts).
- **HD Offline Wallpapers:** Horizontal zero-scroll wallpaper gallery with 1-click apply and automated local storage persistence.

### 📱 Mobile-First Ergonomics
- **Retractable Bottom Shelf:** Expandable widget drawer and appearance dock tucked at the bottom edge for effortless single-hand thumb navigation.
- **Responsive Search Toggle:** Smooth expandable search lens inside the store drawer that preserves screen real estate on mobile devices.
- **Quick Vector Context Menu:** Long-press or right-click any widget for an instant SVG menu positioned snugly above the target.

### 📲 Modern Native PWA Installation
- **Dismissible Bottom Toast:** Elegant glassmorphic banner (`#web-install-banner`) offering single-tap installation on supported browsers, with persistent 5-day snooze memory.
- **Cross-Platform Compatibility:** Full support for Android (Chrome/Edge), iOS (Safari Add-to-Home-Screen), and Desktop standalone windows.

---

## 📦 Core Widgets & Online Hub

| Widget | Description | Capabilities |
| :--- | :--- | :--- |
| ⏰ **Clock & Date** | High-precision digital clock | 12h/24h formats, live calendar date, sleek typography |
| 🔍 **Multi-Search** | Instant web search bar | Google, Bing, DuckDuckGo, Brave, Yandex & Ecosia |
| 🔗 **Smart Shortcuts** | Fluid web bookmarks | Custom icons, automatic high-res favicons, rounded shape scale |
| 📁 **Smart Folders** | Grouped shortcut collections | Drag-to-merge, modal expansion, category tagging |
| 📝 **Quick Notes** | Glass notepad | Markdown support, auto-save with debounce |
| ✅ **Checklist** | Minimalist task tracker | Add, toggle, delete tasks with local sync |
| 🧮 **Calculator** | Glass numeric calculator | Clean arithmetic evaluation with haptic feedback |
| ⏳ **Pomodoro Timer** | Focus session manager | Work / break cycles with progress ring |
| 💬 **Daily Quote** | Inspirational thoughts | Daily curated offline quotes |

---

## 🚀 Installation & Usage

### 1. Progressive Web App (PWA)
Visit the live deployment at **[mr-pr0g.github.io/ProGrid](https://mr-pr0g.github.io/ProGrid/)** and click **Install** on the bottom banner or through your browser menu.

### 2. Browser Extension (Chrome, Edge & Brave)
Transform your New Tab into ProGrid:
1. Clone or download this repository as a `.zip` archive and extract it.
2. Navigate to `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer mode** in the top-right toolbar.
4. Click **Load unpacked** and select the project folder.

---

## 🛠️ Custom Widget Development

ProGrid features a modular plugin architecture. To create a new widget, create a file inside `widgets/` (e.g. `widgets/mywidget.js`):

```javascript
import { BaseWidget } from './base.js';

export default class MyWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'mywidget',
            label: 'My Widget',
            icon: '🚀',
            defaultW: 2, defaultH: 2,
            minW: 1, minH: 1,
            maxW: 4, maxH: 4,
            defaultConfig: { text: 'Hello ProGrid', isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        return `<div class="my-widget">${this.config.text}</div>`;
    }

    postRender(element) {
        // Event listeners, animations, or intervals
    }

    onDestroy(element) {
        // Resource cleanup
    }
}

window.WidgetGlobals.register(MyWidget);
```

Add your widget filename to `DYNAMIC_WIDGET_LIST` in `js/app.js` and `urlsToCache` in `sw.js`.

---

## 📄 License & Credits
Developed with ❤️ by **MR Prog**. Distributed under the MIT License.
