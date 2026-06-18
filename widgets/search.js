import { BaseWidget } from './base.js';

export default class SearchWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'search', label: 'Search Bar', icon: '🔍', defaultW: 3, defaultH: 1,
            minW: 2, minH: 1, maxW: 8, maxH: 1,
            defaultConfig: { engine: 'google', placeholder: 'Search...', isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        let actionUrl = 'https://google.com/search';
        if (this.config.engine === 'bing') actionUrl = 'https://bing.com/search';
        if (this.config.engine === 'duckduckgo') actionUrl = 'https://duckduckgo.com/';

        const injectStyles = !document.getElementById('search-internal-w-css') ? `
            <style id="search-internal-w-css">
                .search-widget-container { width: 100%; height: 100%; display: flex; align-items: center; padding: 0 14px; box-sizing: border-box; }
                .search-form { width: 100%; display: flex; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 5px 6px; gap: 6px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.15); box-sizing: border-box; }
                .search-input-field { flex: 1; background: none; border: none; color: white; font-size: 13px; outline: none; padding-left: 6px; min-width: 50px; }
                .search-input-field::placeholder { color: rgba(255,255,255,0.35); }
                .search-submit-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: white; cursor: pointer; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 10px; transition: background 0.2s; white-space: nowrap; flex-shrink: 0; }
                .search-submit-btn:hover { background: rgba(255, 255, 255, 0.16); }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="search-widget-container">
                <form class="search-form" action="${actionUrl}" method="get" target="_blank">
                    <input type="text" name="q" class="search-input-field" placeholder="${this.config.placeholder || 'Search...'}" required autocomplete="off">
                    <button type="submit" class="search-submit-btn">Search</button>
                </form>
            </div>
        `;
    }
}

window.WidgetGlobals.register(SearchWidget);