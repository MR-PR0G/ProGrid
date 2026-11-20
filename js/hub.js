/**
 * ProGrid Widget Hub & Security Engine
 * Manages online registry discovery, safe installation, sandboxing, and offline persistence.
 */

const STORAGE_KEY_INSTALLED = 'progrid_installed_community_widgets';

export class WidgetHubEngine {
    constructor() {
        this.registryCache = [];
        this.installedIds = this.loadInstalledIds();
    }

    loadInstalledIds() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_INSTALLED);
            let list = raw ? JSON.parse(raw) : [];
            // Backward-compatibility: auto-include widgets already present on user's active grid
            const savedState = localStorage.getItem('progrid_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.widgets && Array.isArray(parsed.widgets)) {
                    parsed.widgets.forEach(w => {
                        if (w.type && !['shortcut', 'search', 'clock', 'folder'].includes(w.type) && !list.includes(w.type)) {
                            list.push(w.type);
                        }
                    });
                }
            }
            return list;
        } catch {
            return [];
        }
    }

    saveInstalledIds() {
        try {
            localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(this.installedIds));
        } catch (e) {
            console.error("Storage error:", e);
        }
    }

    async fetchRegistry() {
        try {
            const res = await fetch('./widgets/registry.json');
            if (res.ok) {
                this.registryCache = await res.json();
                return this.registryCache;
            }
        } catch (err) {
            console.warn("Registry fetch fallback to embedded:", err);
        }

        // Offline fallback
        return [
            {
                id: "checklist",
                name: "Tasks & Checklist",
                author: "MR Prog",
                version: "1.2.0",
                downloads: "8.4k",
                category: "productivity",
                defaultW: 2,
                defaultH: 2,
                minH: 2,
                verified: true,
                description: "Minimalist interactive task manager with progress metrics.",
                scriptUrl: "./widgets/checklist.js"
            },
            {
                id: "notes",
                name: "Smart Notepad",
                author: "MR Prog",
                version: "1.2.0",
                downloads: "7.9k",
                category: "productivity",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Clean multi-note scratchpad with instant local storage persistence.",
                scriptUrl: "./widgets/notes.js"
            },
            {
                id: "pomodoro",
                name: "Focus & Timer",
                author: "MR Prog",
                version: "1.4.0",
                downloads: "6.8k",
                category: "productivity",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Engineered focus sessions and countdown timer with chime notification.",
                scriptUrl: "./widgets/community/pomodoro.js"
            },
            {
                id: "finance",
                name: "Markets & Crypto",
                author: "MR Prog",
                version: "1.0.0",
                downloads: "9.2k",
                category: "finance",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Real-time rates for Cryptocurrencies, Gold, Oil, Forex and Iranian Toman.",
                scriptUrl: "./widgets/community/finance.js"
            },
            {
                id: "calculator",
                name: "Quick Calculator",
                author: "MR Prog",
                version: "1.2.0",
                downloads: "5.3k",
                category: "tools",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Compact glassmorphic calculator for rapid computations.",
                scriptUrl: "./widgets/community/calculator.js"
            },
            {
                id: "quote",
                name: "Daily Inspiration",
                author: "MR Prog",
                version: "1.2.0",
                downloads: "4.6k",
                category: "lifestyle",
                defaultW: 2,
                defaultH: 1,
                verified: true,
                description: "Curated inspiring bilingual Persian and English wisdom quotes.",
                scriptUrl: "./widgets/community/quote.js"
            }
        ];
    }

    resolveScriptUrl(url) {
        if (typeof document !== 'undefined' && document.baseURI) {
            return new URL(url, document.baseURI).href;
        }
        return url;
    }

    async bootInstalledWidgets() {
        const list = await this.fetchRegistry();
        for (const item of list) {
            if (this.installedIds.includes(item.id)) {
                try {
                    const resolved = this.resolveScriptUrl(item.scriptUrl);
                    await import(resolved);
                } catch (err) {
                    console.error(`Failed to load community widget ${item.id}:`, err);
                }
            }
        }
    }

    isInstalled(id) {
        return this.installedIds.includes(id);
    }

    async installWidget(item) {
        if (!item || !item.id) return false;
        
        // Security check: verify URL is within relative widgets directory
        if (!item.scriptUrl || item.scriptUrl.startsWith('http:') || item.scriptUrl.startsWith('//')) {
            console.warn("Security check failed: remote untrusted origin", item.scriptUrl);
            return false;
        }

        try {
            const resolved = this.resolveScriptUrl(item.scriptUrl);
            await import(resolved);
            if (!this.installedIds.includes(item.id)) {
                this.installedIds.push(item.id);
                this.saveInstalledIds();
            }
            return true;
        } catch (err) {
            console.error("Installation failed:", err);
            return false;
        }
    }

    uninstallWidget(id) {
        this.installedIds = this.installedIds.filter(x => x !== id);
        this.saveInstalledIds();
        return true;
    }
}

export const widgetHub = new WidgetHubEngine();
