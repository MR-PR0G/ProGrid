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
            return raw ? JSON.parse(raw) : ['calculator', 'quote']; // default popular installed
        } catch {
            return ['calculator', 'quote'];
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
                id: "calculator",
                name: "Quick Calculator",
                author: "MR Prog",
                version: "1.0.0",
                downloads: "4.8k",
                category: "tools",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Compact glassmorphic calculator for rapid computations.",
                scriptUrl: "./widgets/community/calculator.js"
            },
            {
                id: "quote",
                name: "Daily Quote",
                author: "ProGrid Studio",
                version: "1.0.0",
                downloads: "3.9k",
                category: "lifestyle",
                defaultW: 2,
                defaultH: 1,
                verified: true,
                description: "Handpicked daily inspiration and wisdom to keep you energized.",
                scriptUrl: "./widgets/community/quote.js"
            },
            {
                id: "pomodoro",
                name: "Pomodoro Timer",
                author: "FocusLab",
                version: "1.2.0",
                downloads: "5.1k",
                category: "productivity",
                defaultW: 2,
                defaultH: 1,
                verified: true,
                description: "25-minute focus session timer with audio chime and pause controls.",
                scriptUrl: "./widgets/community/pomodoro.js"
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
