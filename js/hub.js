/**
 * ProGrid Widget Hub & Security Engine
 * Manages verified online registry discovery, sandbox validation, real download tracking, and offline persistence.
 */

const STORAGE_KEY_INSTALLED = 'progrid_installed_community_widgets';
const STORAGE_KEY_DOWNLOADS = 'progrid_widget_download_counts';
const STORAGE_KEY_LIKES = 'progrid_widget_likes_counts';
const STORAGE_KEY_USER_LIKED = 'progrid_widget_user_liked_set';

const BASE_DOWNLOADS = {
    checklist: 48,
    notes: 36,
    pomodoro: 52,
    finance: 64,
    weather: 42,
    quote: 29
};

const BASE_LIKES = {
    checklist: 14,
    notes: 9,
    pomodoro: 17,
    finance: 22,
    weather: 18,
    quote: 8
};

export class WidgetHubEngine {
    constructor() {
        this.registryCache = [];
        this.downloads = this.loadDownloads();
        this.likes = this.loadLikes();
        this.userLiked = this.loadUserLiked();
        this.installedIds = this.loadInstalledIds();
    }

    loadDownloads() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_DOWNLOADS);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Migrate any legacy inflated baseline (> 500)
                let needsReset = false;
                for (const k in parsed) {
                    if (typeof parsed[k] === 'number' && parsed[k] > 500) {
                        needsReset = true;
                        break;
                    }
                }
                if (!needsReset) return parsed;
            }
            localStorage.setItem(STORAGE_KEY_DOWNLOADS, JSON.stringify(BASE_DOWNLOADS));
            return { ...BASE_DOWNLOADS };
        } catch {
            return { ...BASE_DOWNLOADS };
        }
    }

    saveDownloads() {
        try {
            localStorage.setItem(STORAGE_KEY_DOWNLOADS, JSON.stringify(this.downloads));
        } catch {}
    }

    getDownloads(id) {
        const count = this.downloads[id] !== undefined ? this.downloads[id] : (BASE_DOWNLOADS[id] || 25);
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return String(count);
    }

    incrementDownload(id) {
        if (this.downloads[id] === undefined) {
            this.downloads[id] = BASE_DOWNLOADS[id] || 25;
        }
        this.downloads[id] += 1;
        this.saveDownloads();
    }

    loadLikes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_LIKES);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Migrate any legacy inflated baseline (> 500)
                let needsReset = false;
                for (const k in parsed) {
                    if (typeof parsed[k] === 'number' && parsed[k] > 500) {
                        needsReset = true;
                        break;
                    }
                }
                if (!needsReset) return parsed;
            }
            localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(BASE_LIKES));
            return { ...BASE_LIKES };
        } catch {
            return { ...BASE_LIKES };
        }
    }

    saveLikes() {
        try {
            localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(this.likes));
        } catch {}
    }

    loadUserLiked() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_USER_LIKED);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    saveUserLiked() {
        try {
            localStorage.setItem(STORAGE_KEY_USER_LIKED, JSON.stringify(this.userLiked));
        } catch {}
    }

    getLikes(id) {
        const count = this.likes[id] !== undefined ? this.likes[id] : (BASE_LIKES[id] || 10);
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return String(count);
    }

    isLiked(id) {
        return !!this.userLiked[id];
    }

    toggleLike(id) {
        if (this.likes[id] === undefined) {
            this.likes[id] = BASE_LIKES[id] || 10;
        }
        const currentlyLiked = !!this.userLiked[id];
        if (currentlyLiked) {
            delete this.userLiked[id];
            this.likes[id] = Math.max(0, this.likes[id] - 1);
        } else {
            this.userLiked[id] = true;
            this.likes[id] += 1;
        }
        this.saveLikes();
        this.saveUserLiked();
        return {
            liked: !currentlyLiked,
            countStr: this.getLikes(id)
        };
    }

    loadInstalledIds() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_INSTALLED);
            let list = [];
            
            // Clean legacy stale cache if user had unrequested defaults
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Filter out legacy automatic defaults if user never placed them
                    list = parsed.filter(id => !['folder', 'shortcut', 'search', 'clock', 'calculator'].includes(id));
                }
            }

            // Backward-compatibility: auto-include widgets already present on user's active grid
            const savedState = localStorage.getItem('dashboard_liquid_v4') || localStorage.getItem('progrid_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.widgets && Array.isArray(parsed.widgets)) {
                    parsed.widgets.forEach(w => {
                        if (w.type && !['shortcut', 'search', 'clock', 'folder', 'calculator'].includes(w.type) && !list.includes(w.type)) {
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
                downloads: this.getDownloads("checklist"),
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
                downloads: this.getDownloads("notes"),
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
                version: "1.5.0",
                downloads: this.getDownloads("pomodoro"),
                category: "productivity",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Minimalist Material 3 focus session timer with tap-to-set duration modal and alert chime.",
                scriptUrl: "./widgets/community/pomodoro.js"
            },
            {
                id: "finance",
                name: "Markets & Crypto",
                author: "MR Prog",
                version: "1.5.0",
                downloads: this.getDownloads("finance"),
                category: "finance",
                defaultW: 2,
                defaultH: 2,
                verified: true,
                description: "Professional live financial tracker with real-time crypto & forex rates, USD/IRT currency toggle, responsive tiles, and 24h charts.",
                scriptUrl: "./widgets/community/finance.js"
            },
            {
                id: "weather",
                name: "Live Weather",
                author: "MR Prog",
                version: "1.0.0",
                downloads: this.getDownloads("weather"),
                category: "lifestyle",
                defaultW: 2,
                defaultH: 2,
                minW: 2,
                minH: 1,
                maxW: 4,
                maxH: 3,
                verified: true,
                description: "Open-Meteo live weather tracker with 7-day offline storage, worldwide city search, and Breezy Weather accuracy.",
                scriptUrl: "./widgets/community/weather.js"
            },
            {
                id: "quote",
                name: "Daily Wisdom",
                author: "MR Prog",
                version: "1.5.0",
                downloads: this.getDownloads("quote"),
                category: "lifestyle",
                defaultW: 2,
                defaultH: 1,
                verified: true,
                description: "Curated wisdom quotes with Science, History & Philosophy category filters and language toggle.",
                scriptUrl: "./widgets/community/quote.js"
            }
        ];
    }

    resolveScriptUrl(url, version = '1.2.0') {
        const full = (typeof document !== 'undefined' && document.baseURI) 
            ? new URL(url, document.baseURI).href 
            : url;
        const sep = full.includes('?') ? '&' : '?';
        return `${full}${sep}v=${version}`;
    }

    async bootInstalledWidgets() {
        const list = await this.fetchRegistry();
        for (const item of list) {
            if (this.installedIds.includes(item.id)) {
                try {
                    const resolved = this.resolveScriptUrl(item.scriptUrl, item.version);
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
        
        // Strict Security Sandbox: Verify relative path origin
        if (!item.scriptUrl || item.scriptUrl.startsWith('http:') || item.scriptUrl.startsWith('//') || item.scriptUrl.includes('://')) {
            console.warn("Security sandbox check rejected: remote untrusted origin", item.scriptUrl);
            return false;
        }

        try {
            const resolved = this.resolveScriptUrl(item.scriptUrl, item.version);
            await import(resolved);
            if (!this.installedIds.includes(item.id)) {
                this.installedIds.push(item.id);
                this.saveInstalledIds();
                this.incrementDownload(item.id);
            }
            return true;
        } catch (err) {
            console.error("Installation failed:", err);
            return false;
        }
    }

    uninstallWidget(id) {
        if (!id || ['shortcut', 'search', 'clock', 'folder'].includes(id)) {
            return false; // Core widgets cannot be uninstalled
        }
        this.installedIds = this.installedIds.filter(x => x !== id);
        this.saveInstalledIds();
        return true;
    }
}

export const widgetHub = new WidgetHubEngine();
