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
                .search-widget-container {
                    width: 100%; height: 100%;
                    display: flex; align-items: center;
                    padding: 0 8px; box-sizing: border-box;
                }
                .search-form {
                    width: 100%; height: 38px;
                    display: flex; align-items: center;
                    background: rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    padding: 3px 5px;
                    gap: 6px;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
                    box-sizing: border-box;
                }
                .search-input-field {
                    flex: 1; height: 100%;
                    background: none; border: none;
                    color: white; font-size: 13px;
                    outline: none; padding-left: 8px;
                    min-width: 0;
                }
                .search-input-field::placeholder { color: rgba(255, 255, 255, 0.4); }
                .search-submit-btn {
                    width: 32px; height: 30px;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 10px; transition: background 0.2s, transform 0.1s;
                    flex-shrink: 0; padding: 0;
                }
                .search-submit-btn:hover { background: rgba(255, 255, 255, 0.22); }
                .search-submit-btn:active { transform: scale(0.95); }
                .search-submit-btn svg { width: 14px; height: 14px; stroke: currentColor; }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="search-widget-container">
                <form class="search-form" action="${actionUrl}" method="get" target="_blank">
                    <input type="text" name="q" class="search-input-field" placeholder="${this.config.placeholder || 'Search...'}" required autocomplete="off">
                    <button type="submit" class="search-submit-btn" aria-label="Search" title="Search">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </form>
            </div>
        `;
    }
}

window.WidgetGlobals.register(SearchWidget);