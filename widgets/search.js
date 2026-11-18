import { BaseWidget } from './base.js';

export default class SearchWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'search',
            label: 'Search Bar',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
            defaultW: 3, defaultH: 1,
            minW: 2, minH: 1, maxW: 8, maxH: 1,
            defaultConfig: { engine: 'google', placeholder: 'Search...', isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const engine = this.config.engine || 'google';
        let actionUrl = 'https://google.com/search';
        let engineName = 'Google';
        if (engine === 'bing') { actionUrl = 'https://bing.com/search'; engineName = 'Bing'; }
        if (engine === 'duckduckgo') { actionUrl = 'https://duckduckgo.com/'; engineName = 'DuckDuckGo'; }
        if (engine === 'brave') { actionUrl = 'https://search.brave.com/search'; engineName = 'Brave'; }
        if (engine === 'yandex') { actionUrl = 'https://yandex.com/search/'; engineName = 'Yandex'; }
        if (engine === 'ecosia') { actionUrl = 'https://www.ecosia.org/search'; engineName = 'Ecosia'; }

        const placeholder = this.config.placeholder && this.config.placeholder !== 'Search...'
            ? this.config.placeholder
            : `Search with ${engineName}...`;

        const injectStyles = !document.getElementById('search-internal-w-css') ? `
            <style id="search-internal-w-css">
                .search-widget-container {
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 4px; box-sizing: border-box;
                }
                .search-form {
                    width: 100%; height: 46px;
                    display: flex; align-items: center;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                    border-radius: 23px;
                    padding: 0 6px 0 14px;
                    gap: 8px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22);
                    box-sizing: border-box;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .search-form:focus-within {
                    border-color: #3b82f6;
                    background: rgba(255, 255, 255, 0.13);
                    box-shadow: 0 0 16px rgba(59, 130, 246, 0.35);
                }
                body.light-mode .search-form {
                    background: rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
                }
                body.light-mode .search-form:focus-within {
                    background: rgba(255, 255, 255, 0.95);
                    border-color: #3b82f6;
                    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
                }
                .search-leading-icon {
                    width: 18px; height: 18px;
                    color: var(--text-secondary);
                    opacity: 0.8;
                    flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                }
                .search-input-field {
                    flex: 1; height: 100%;
                    background: none; border: none;
                    color: var(--text-primary);
                    font-size: 16px !important;
                    font-weight: 500;
                    outline: none;
                    padding: 0 4px;
                    min-width: 0;
                }
                .search-input-field::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.65;
                    font-size: 13.5px;
                }
                .search-submit-btn {
                    width: 34px; height: 34px;
                    background: #3b82f6;
                    border: none;
                    color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 50%;
                    transition: background 0.15s, transform 0.1s;
                    flex-shrink: 0; padding: 0;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                }
                .search-submit-btn:hover { background: #2563eb; }
                .search-submit-btn:active { transform: scale(0.92); }
                .search-submit-btn svg { width: 15px; height: 15px; stroke: currentColor; }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="search-widget-container">
                <form class="search-form" action="${actionUrl}" method="get" target="_blank">
                    <span class="search-leading-icon">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </span>
                    <input type="text" name="q" class="search-input-field" placeholder="${placeholder}" required autocomplete="off" spellcheck="false">
                    <button type="submit" class="search-submit-btn" aria-label="Search" title="Search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </form>
            </div>
        `;
    }
}

window.WidgetGlobals.register(SearchWidget);
