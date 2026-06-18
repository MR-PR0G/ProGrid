<div align="center">
  <h1>🌟 ProGrid Workspace</h1>
  <p><b>Version 0.0.5 | Developed by MR Prog</b></p>
  <p>A modern, modular, and fully customizable Liquid Glass workspace for your browser.</p>

  <img src="https://img.shields.io/badge/Version-0.0.5-blue.svg" alt="Version">
  
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Extension%20%7C%20PWA-success.svg" alt="Platform">
</div>

<div align="center">
  <img src="https://github.com/MR-PR0G/ProGrid/blob/main/Demos/ScreenShots.png" alt="ScreenShot" width="75%" style="">
</div>

---

## ✨ Key Features
- **Fluid Grid Engine:** Intelligent top-to-bottom gravity grid with collision resolution.
- **Glassmorphism UI:** Stunning frosted glass, dynamic animated backgrounds, and dark/light modes.
- **Universal Install:** Run as a Chrome/Edge Extension, or install as a PWA on iOS, Android, and Desktop.
- **Modular Widgets:** Shortcuts, Search bar, Checklist, and Smart Folders out of the box.
- **Privacy First:** 100% local storage. No servers, no tracking.

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

    render() {
        return `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <h3 style="color: var(--text-primary);">${this.config.text}</h3>
            </div>
        `;
    }
}

window.WidgetGlobals.register(MyWidget);‍‍
```
Note: Do not forget to add your widget filename to the DYNAMIC_WIDGET_LIST array inside js/app.js.
