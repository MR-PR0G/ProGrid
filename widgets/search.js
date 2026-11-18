import { BaseWidget } from './base.js';

const SEARCH_HISTORY_KEY = 'progrid_search_history';

function getSearchHistory() {
    try {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveSearchHistory(query) {
    if (!query || !query.trim()) return;
    query = query.trim();
    let history = getSearchHistory().filter(item => item.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > 15) history = history.slice(0, 15);
    try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('Failed to save search history:', e);
    }
}

function removeSearchHistoryItem(query) {
    let history = getSearchHistory().filter(item => item !== query);
    try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch {}
}

function clearAllSearchHistory() {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {}
}

let activeJsonpScript = null;
let jsonpTimeout = null;

function fetchGoogleSuggestions(query, callback) {
    if (activeJsonpScript) {
        activeJsonpScript.remove();
        activeJsonpScript = null;
    }
    if (jsonpTimeout) {
        clearTimeout(jsonpTimeout);
        jsonpTimeout = null;
    }

    const callbackName = '__progridSuggestCB';
    window[callbackName] = (data) => {
        if (activeJsonpScript) {
            activeJsonpScript.remove();
            activeJsonpScript = null;
        }
        if (data && Array.isArray(data[1])) {
            const results = data[1].slice(0, 6);
            callback(results);
        } else {
            callback([]);
        }
    };

    const script = document.createElement('script');
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&jsonp=${callbackName}&q=${encodeURIComponent(query)}`;
    script.async = true;
    script.onerror = () => {
        if (script.parentNode) script.remove();
        activeJsonpScript = null;
        callback([]);
    };
    activeJsonpScript = script;
    document.head.appendChild(script);

    jsonpTimeout = setTimeout(() => {
        if (activeJsonpScript && activeJsonpScript.parentNode) {
            activeJsonpScript.remove();
            activeJsonpScript = null;
        }
        callback([]);
    }, 2000);
}

export default class SearchWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'search',
            label: 'Search Bar',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
            defaultW: 3, defaultH: 1,
            minW: 2, minH: 1, maxW: 8, maxH: 1,
            defaultConfig: { engine: 'google', placeholder: 'Search...', searchShape: 'pill', showSuggestions: true, isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const id = this.config.id || 'search-default';
        const engine = this.config.engine || 'google';
        const shape = this.config.searchShape || 'pill';

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
                    position: relative;
                }
                .search-form {
                    width: 100%; height: 46px;
                    display: flex; align-items: center;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                    padding: 0 6px 0 14px;
                    gap: 8px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22);
                    box-sizing: border-box;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, border-radius 0.2s;
                }
                /* Shape Variants */
                .search-form.shape-pill { border-radius: 23px; }
                .search-form.shape-squircle { border-radius: 14px; }
                .search-form.shape-sharp { border-radius: 6px; }
                .search-form.shape-glow {
                    border-radius: 16px;
                    border: 1.5px solid rgba(59, 130, 246, 0.5);
                    box-shadow: 0 0 16px rgba(59, 130, 246, 0.28);
                }

                .search-form:focus-within {
                    border-color: #3b82f6;
                    background: rgba(255, 255, 255, 0.13);
                    box-shadow: 0 0 18px rgba(59, 130, 246, 0.38);
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
                    font-size: 15px;
                    font-weight: 500;
                    outline: none;
                    padding: 0 2px;
                    min-width: 0;
                }
                .search-input-field::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.65;
                    font-size: 13.5px;
                }
                .search-clear-btn {
                    width: 22px; height: 22px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 10px;
                    line-height: 1;
                    flex-shrink: 0;
                    padding: 0;
                    transition: background 0.15s, color 0.15s;
                }
                .search-clear-btn:hover {
                    background: rgba(255, 255, 255, 0.22);
                    color: var(--text-primary);
                }
                body.light-mode .search-clear-btn {
                    background: rgba(0, 0, 0, 0.08);
                }
                body.light-mode .search-clear-btn:hover {
                    background: rgba(0, 0, 0, 0.15);
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

                /* Live Suggestions & History Dropdown */
                .search-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 4px;
                    right: 4px;
                    background: rgba(18, 24, 38, 0.92);
                    backdrop-filter: blur(28px) saturate(190%);
                    -webkit-backdrop-filter: blur(28px) saturate(190%);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 16px;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25);
                    max-height: 260px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    z-index: 9999;
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    animation: searchDropFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes searchDropFade {
                    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                body.light-mode .search-dropdown-menu {
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0, 0, 0, 0.12);
                    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.12);
                }

                .search-suggest-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    color: var(--text-primary);
                    font-size: 13.5px;
                    transition: background 0.12s, color 0.12s;
                    user-select: none;
                    text-decoration: none;
                }
                .search-suggest-item:hover, .search-suggest-item.selected {
                    background: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                }
                body.light-mode .search-suggest-item:hover, body.light-mode .search-suggest-item.selected {
                    background: rgba(59, 130, 246, 0.1);
                    color: #2563eb;
                }

                .suggest-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex: 1;
                    min-width: 0;
                }
                .suggest-icon {
                    width: 15px;
                    height: 15px;
                    opacity: 0.65;
                    flex-shrink: 0;
                }
                .suggest-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 500;
                }
                .suggest-del-btn {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    opacity: 0.5;
                    cursor: pointer;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: opacity 0.15s, background 0.15s;
                }
                .suggest-del-btn:hover {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.15);
                    color: var(--text-primary);
                }
                body.light-mode .suggest-del-btn:hover {
                    background: rgba(0, 0, 0, 0.1);
                }

                .suggest-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 10px 2px 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-top: 2px;
                }
                body.light-mode .suggest-footer {
                    border-top-color: rgba(0, 0, 0, 0.08);
                }
                .suggest-clear-history-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 11px;
                    text-decoration: underline;
                    opacity: 0.7;
                    transition: opacity 0.15s, color 0.15s;
                }
                .suggest-clear-history-btn:hover {
                    opacity: 1;
                    color: #ef4444;
                }

                /* Focus & Edit Mode Safety */
                .widget-wrapper.search-focused {
                    z-index: 950 !important;
                    overflow: visible !important;
                }
                .widget-wrapper.search-focused .widget-content {
                    overflow: visible !important;
                    contain: none !important;
                }
                body.edit-mode .search-dropdown-menu { display: none !important; }
                body.edit-mode .search-input-field { pointer-events: none; }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="search-widget-container" id="container-${id}">
                <form class="search-form shape-${shape}" id="form-${id}" action="${actionUrl}" method="get" target="_blank" autocomplete="off">
                    <span class="search-leading-icon" title="${engineName}">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </span>
                    <input type="text" name="q" id="input-${id}" class="search-input-field" placeholder="${placeholder}" required autocomplete="off" spellcheck="false">
                    <button type="button" id="clear-${id}" class="search-clear-btn" aria-label="Clear query" style="display: none;" title="Clear">✕</button>
                    <button type="submit" class="search-submit-btn" aria-label="Search" title="Search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </form>
                <div class="search-dropdown-menu" id="dropdown-${id}" style="display: none;"></div>
            </div>
        `;
    }

    postRender(wrapper) {
        const id = this.config.id || 'search-default';
        const form = wrapper.querySelector(`#form-${id}`);
        const input = wrapper.querySelector(`#input-${id}`);
        const clearBtn = wrapper.querySelector(`#clear-${id}`);
        const dropdown = wrapper.querySelector(`#dropdown-${id}`);

        if (!form || !input || !dropdown) return;

        const showSuggestionsEnabled = this.config.showSuggestions !== false;
        let activeIndex = -1;
        let debounceTimer = null;

        const executeSearch = (query) => {
            if (!query || !query.trim()) return;
            input.value = query;
            saveSearchHistory(query);
            dropdown.style.display = 'none';
            wrapper.classList.remove('search-focused');
            form.submit();
        };

        const renderDropdown = (items, isHistory = false) => {
            activeIndex = -1;
            if (!items || items.length === 0) {
                dropdown.style.display = 'none';
                wrapper.classList.remove('search-focused');
                return;
            }

            let html = '';
            items.forEach((item, index) => {
                const iconSvg = isHistory
                    ? `<svg class="suggest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
                    : `<svg class="suggest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

                const delBtnHtml = isHistory
                    ? `<button type="button" class="suggest-del-btn" data-query="${encodeURIComponent(item)}" title="Remove from history">✕</button>`
                    : '';

                html += `
                    <div class="search-suggest-item" data-index="${index}" data-text="${encodeURIComponent(item)}">
                        <div class="suggest-left">
                            ${iconSvg}
                            <span class="suggest-text">${item}</span>
                        </div>
                        ${delBtnHtml}
                    </div>
                `;
            });

            if (isHistory) {
                html += `
                    <div class="suggest-footer">
                        <span>Recent Searches</span>
                        <button type="button" class="suggest-clear-history-btn">Clear All</button>
                    </div>
                `;
            }

            dropdown.innerHTML = html;
            dropdown.style.display = 'flex';
            wrapper.classList.add('search-focused');

            // Item clicks
            dropdown.querySelectorAll('.search-suggest-item').forEach(el => {
                el.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.suggest-del-btn')) return;
                    const text = decodeURIComponent(el.getAttribute('data-text'));
                    executeSearch(text);
                });
            });

            // Single item deletion
            dropdown.querySelectorAll('.suggest-del-btn').forEach(btn => {
                btn.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    const query = decodeURIComponent(btn.getAttribute('data-query'));
                    removeSearchHistoryItem(query);
                    showRelevantDropdown();
                });
            });

            // Clear all history
            const clearAllBtn = dropdown.querySelector('.suggest-clear-history-btn');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    clearAllSearchHistory();
                    dropdown.style.display = 'none';
                    wrapper.classList.remove('search-focused');
                });
            }
        };

        const showRelevantDropdown = () => {
            if (document.body.classList.contains('edit-mode')) return;
            if (!showSuggestionsEnabled) return;

            const q = input.value.trim();
            if (!q) {
                const history = getSearchHistory();
                if (history.length > 0) {
                    renderDropdown(history.slice(0, 6), true);
                } else {
                    dropdown.style.display = 'none';
                    wrapper.classList.remove('search-focused');
                }
                return;
            }

            const matchedHistory = getSearchHistory().filter(h => h.toLowerCase().includes(q.toLowerCase()) && h.toLowerCase() !== q.toLowerCase());

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchGoogleSuggestions(q, (suggestions) => {
                    const combined = Array.from(new Set([...matchedHistory.slice(0, 3), ...suggestions])).slice(0, 7);
                    if (combined.length > 0) {
                        renderDropdown(combined, false);
                    } else {
                        dropdown.style.display = 'none';
                        wrapper.classList.remove('search-focused');
                    }
                });
            }, 180);
        };

        const updateSelection = () => {
            const items = dropdown.querySelectorAll('.search-suggest-item');
            items.forEach((item, idx) => {
                if (idx === activeIndex) {
                    item.classList.add('selected');
                    item.scrollIntoView({ block: 'nearest' });
                    input.value = decodeURIComponent(item.getAttribute('data-text'));
                } else {
                    item.classList.remove('selected');
                }
            });
        };

        input.addEventListener('input', () => {
            if (clearBtn) clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
            showRelevantDropdown();
        });

        input.addEventListener('focus', () => {
            if (clearBtn) clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
            showRelevantDropdown();
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                input.value = '';
                clearBtn.style.display = 'none';
                input.focus();
                showRelevantDropdown();
            });
        }

        input.addEventListener('keydown', (e) => {
            if (dropdown.style.display === 'none') return;
            const items = dropdown.querySelectorAll('.search-suggest-item');
            if (items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
                updateSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                updateSelection();
            } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && items[activeIndex]) {
                    e.preventDefault();
                    const text = decodeURIComponent(items[activeIndex].getAttribute('data-text'));
                    executeSearch(text);
                } else {
                    saveSearchHistory(input.value);
                    dropdown.style.display = 'none';
                    wrapper.classList.remove('search-focused');
                }
            } else if (e.key === 'Escape') {
                dropdown.style.display = 'none';
                wrapper.classList.remove('search-focused');
            }
        });

        form.addEventListener('submit', () => {
            saveSearchHistory(input.value);
            dropdown.style.display = 'none';
            wrapper.classList.remove('search-focused');
        });

        const clickOutsideHandler = (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
                wrapper.classList.remove('search-focused');
            }
        };
        document.addEventListener('mousedown', clickOutsideHandler);
        document.addEventListener('touchstart', clickOutsideHandler, { passive: true });

        this._cleanupFn = () => {
            document.removeEventListener('mousedown', clickOutsideHandler);
            document.removeEventListener('touchstart', clickOutsideHandler);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }

    onDestroy() {
        if (this._cleanupFn) {
            this._cleanupFn();
            this._cleanupFn = null;
        }
    }
}

window.WidgetGlobals.register(SearchWidget);
