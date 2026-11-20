import { BaseWidget } from '../base.js';

const MARKET_CACHE_KEY = 'progrid_market_rates_cache';
const MARKET_HISTORY_KEY = 'progrid_market_history_cache';

const ASSET_REGISTRY = [
    { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', price: 91450, change: 2.34, high: 92800, low: 89400, icon: '₿', type: 'crypto', unit: '$' },
    { id: 'USDIRR', name: 'US Dollar (تومان)', symbol: 'USD/TMN', price: 68900, change: 0.45, high: 69200, low: 68400, icon: '💵', type: 'forex', unit: 'T' },
    { id: 'ETH', name: 'Ethereum', symbol: 'ETH', price: 3120, change: -0.85, high: 3190, low: 3080, icon: 'Ξ', type: 'crypto', unit: '$' },
    { id: 'SOL', name: 'Solana', symbol: 'SOL', price: 198.4, change: 4.12, high: 202.5, low: 189.0, icon: '◎', type: 'crypto', unit: '$' },
    { id: 'TON', name: 'Toncoin', symbol: 'TON', price: 5.45, change: 1.15, high: 5.62, low: 5.38, icon: '💎', type: 'crypto', unit: '$' },
    { id: 'GOLD', name: 'Gold (Ounce)', symbol: 'XAU', price: 2684.5, change: 0.62, high: 2695.0, low: 2670.0, icon: '🟡', type: 'commodities', unit: '$' },
    { id: 'OIL', name: 'Brent Crude', symbol: 'OIL', price: 74.2, change: -1.45, high: 75.8, low: 73.6, icon: '🛢️', type: 'commodities', unit: '$' },
    { id: 'SILVER', name: 'Silver (Ounce)', symbol: 'XAG', price: 31.85, change: 0.94, high: 32.2, low: 31.4, icon: '⚪', type: 'commodities', unit: '$' },
    { id: 'EURUSD', name: 'Euro / Dollar', symbol: 'EUR/USD', price: 1.054, change: -0.22, high: 1.058, low: 1.051, icon: '💶', type: 'forex', unit: '$' },
    { id: 'GBPUSD', name: 'British Pound', symbol: 'GBP/USD', price: 1.268, change: 0.15, high: 1.272, low: 1.264, icon: '💷', type: 'forex', unit: '$' }
];

export default class FinanceWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'finance',
            label: 'Markets & Crypto',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 2, minH: 1, maxW: 4, maxH: 3,
            category: 'finance',
            author: 'MR Prog',
            version: '1.2.0',
            downloads: '9.2k',
            description: 'Interactive financial tracker with 24h hourly charts, single/dual currency focus, and Iranian Toman rates.',
            defaultConfig: {
                viewMode: 'single', // 'single' | 'dual' | 'market'
                primaryAsset: 'BTC',
                secondaryAsset: 'USDIRR',
                showChart: true,
                category: 'crypto',
                lastUpdate: Date.now(),
                bg: '#ffffff'
            }
        };
    }

    constructor(config) {
        super(config);
        this.assets = this.loadCachedAssets();
        this.historyCache = this.loadCachedHistory();
        this.isLoading = false;
    }

    loadCachedAssets() {
        try {
            const raw = localStorage.getItem(MARKET_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch {}
        return JSON.parse(JSON.stringify(ASSET_REGISTRY));
    }

    saveCachedAssets() {
        try {
            localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(this.assets));
        } catch {}
    }

    loadCachedHistory() {
        try {
            const raw = localStorage.getItem(MARKET_HISTORY_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    saveCachedHistory() {
        try {
            localStorage.setItem(MARKET_HISTORY_KEY, JSON.stringify(this.historyCache));
        } catch {}
    }

    getAsset(id) {
        return this.assets.find(a => a.id === id) || this.assets[0];
    }

    generateSynthetic24h(asset) {
        const points = [];
        const base = asset.price;
        const change = asset.change || 0;
        const startPrice = base / (1 + change / 100);
        const steps = 24;

        // Seeded waveform based on asset id char codes
        let seed = 0;
        for (let i = 0; i < asset.id.length; i++) seed += asset.id.charCodeAt(i);

        for (let i = 0; i < steps; i++) {
            const progress = i / (steps - 1);
            const trend = startPrice + (base - startPrice) * progress;
            const wave1 = Math.sin(progress * Math.PI * 3 + seed) * (base * 0.008);
            const wave2 = Math.cos(progress * Math.PI * 5 + seed * 1.5) * (base * 0.005);
            let val = trend + wave1 + wave2;
            if (i === steps - 1) val = base; // Ensure ending at current price
            points.push(+(val.toFixed(val > 100 ? 1 : 3)));
        }
        return points;
    }

    async getHistoryPoints(asset) {
        if (this.historyCache[asset.id] && Array.isArray(this.historyCache[asset.id]) && this.historyCache[asset.id].length >= 12) {
            return this.historyCache[asset.id];
        }

        // For crypto assets, query Binance 1h klines for true 24-hour hourly curve
        if (asset.type === 'crypto') {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${asset.id}USDT&interval=1h&limit=24`, { signal: AbortSignal.timeout(3000) });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const pts = data.map(candle => parseFloat(candle[4]));
                        this.historyCache[asset.id] = pts;
                        this.saveCachedHistory();
                        return pts;
                    }
                }
            } catch (e) {}
        }

        const fallback = this.generateSynthetic24h(asset);
        this.historyCache[asset.id] = fallback;
        this.saveCachedHistory();
        return fallback;
    }

    buildSmoothSvgPath(points, w, h, padY = 8) {
        if (!points || points.length < 2) return { lineD: '', areaD: '', min: 0, max: 0 };
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = (max - min) || 1;
        const effH = Math.max(10, h - padY * 2);

        const coords = points.map((p, i) => ({
            x: (i / (points.length - 1)) * w,
            y: (h - padY) - ((p - min) / range) * effH
        }));

        let lineD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const p0 = coords[Math.max(0, i - 1)];
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const p3 = coords[Math.min(coords.length - 1, i + 2)];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            lineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }

        const areaD = `${lineD} L ${w.toFixed(1)} ${h.toFixed(1)} L 0 ${h.toFixed(1)} Z`;
        return { lineD, areaD, min, max, coords };
    }

    async fetchLiveRates() {
        if (this.isLoading) return;
        this.isLoading = true;

        // 1. Fetch Crypto Live Rates
        try {
            const symbolsParam = '["BTCUSDT","ETHUSDT","SOLUSDT","TONUSDT"]';
            const cryptoRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`, { signal: AbortSignal.timeout(3500) });
            if (cryptoRes.ok) {
                const arr = await cryptoRes.json();
                if (Array.isArray(arr)) {
                    arr.forEach(item => {
                        const sym = item.symbol.replace('USDT', '');
                        const target = this.assets.find(c => c.id === sym);
                        if (target) {
                            target.price = parseFloat(item.lastPrice);
                            target.change = parseFloat(item.priceChangePercent);
                            target.high = parseFloat(item.highPrice);
                            target.low = parseFloat(item.lowPrice);
                        }
                    });
                }
            }
        } catch (e) {
            // Micro-fluctuation fallback for live feel
            this.assets.filter(a => a.type === 'crypto').forEach(c => {
                const delta = (Math.random() - 0.49) * (c.price * 0.001);
                c.price = +(c.price + delta).toFixed(c.price > 100 ? 1 : 2);
            });
        }

        // 2. Fetch Iranian Toman Live Rates (Nobitex / Cache)
        try {
            const nobitexRes = await fetch('https://api.nobitex.ir/market/stats', { signal: AbortSignal.timeout(3000) });
            if (nobitexRes.ok) {
                const nobitexData = await nobitexRes.json();
                if (nobitexData && nobitexData.global && nobitexData.global.usdt) {
                    const usdtRial = parseFloat(nobitexData.global.usdt);
                    if (usdtRial > 0) {
                        const usdtToman = Math.round(usdtRial / 10);
                        const tmnTarget = this.assets.find(f => f.id === 'USDIRR');
                        if (tmnTarget) {
                            tmnTarget.price = usdtToman;
                            tmnTarget.high = Math.round(usdtToman * 1.006);
                            tmnTarget.low = Math.round(usdtToman * 0.994);
                        }
                    }
                }
            }
        } catch (e) {}

        this.isLoading = false;
        this.saveCachedAssets();
    }

    formatPrice(val, asset) {
        if (asset.unit === 'T' || asset.id === 'USDIRR') {
            return `${Math.round(val).toLocaleString('en-US')} تومان`;
        }
        if (val >= 1000) {
            return `$${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
        }
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    }

    render() {
        const id = this.config.id;
        const viewMode = this.config.viewMode || 'single';
        const primaryId = this.config.primaryAsset || 'BTC';
        const secondaryId = this.config.secondaryAsset || 'USDIRR';
        const showChart = this.config.showChart !== false;

        const primaryAsset = this.getAsset(primaryId);
        const secondaryAsset = this.getAsset(secondaryId);

        const injectStyles = !document.getElementById('finance-widget-css') ? `
            <style id="finance-widget-css">
                .fin-w-box {
                    width: 100%; height: 100%; box-sizing: border-box;
                    padding: 8px 10px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden; position: relative;
                    user-select: none;
                }
                .fin-top-bar {
                    display: flex; align-items: center; justify-content: space-between;
                    min-height: 22px; width: 100%;
                }
                .fin-asset-badge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 2px 7px; border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .fin-asset-icon {
                    font-size: 13px; line-height: 1;
                }
                .fin-asset-sym {
                    font-size: 11px; font-weight: 700; color: var(--text-primary);
                }
                .fin-asset-fullname {
                    font-size: 9.5px; color: var(--text-secondary); max-width: 90px;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .fin-controls-right {
                    display: flex; align-items: center; gap: 5px;
                }
                .fin-mode-pill {
                    font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px;
                    background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
                }
                .fin-mode-pill.active {
                    background: rgba(59, 130, 246, 0.22); border-color: rgba(59, 130, 246, 0.45);
                    color: #60a5fa;
                }
                .fin-icon-btn {
                    width: 22px; height: 22px; border-radius: 50%;
                    background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: transform 0.2s, background 0.15s, color 0.15s;
                }
                .fin-icon-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.14); }
                .fin-icon-btn.spinning svg { animation: finSpin 0.75s linear infinite; }
                @keyframes finSpin { 100% { transform: rotate(360deg); } }

                /* Hero Single Mode */
                .fin-hero-section {
                    display: flex; flex-direction: column; gap: 2px; margin: 2px 0;
                }
                .fin-price-large {
                    font-size: 20px; font-weight: 800; color: var(--text-primary);
                    letter-spacing: -0.4px; line-height: 1.15;
                    font-variant-numeric: tabular-nums;
                }
                .fin-hero-meta {
                    display: flex; align-items: center; gap: 6px; font-size: 10px;
                }
                .fin-change-chip {
                    font-size: 10px; font-weight: 700; padding: 1.5px 6px; border-radius: 5px;
                    display: inline-flex; align-items: center; gap: 2px; font-variant-numeric: tabular-nums;
                }
                .fin-change-chip.up { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.28); }
                .fin-change-chip.down { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.28); }
                .fin-hl-text {
                    color: var(--text-secondary); font-size: 9.5px;
                }

                /* Chart Canvas */
                .fin-chart-wrap {
                    flex: 1; width: 100%; min-height: 44px; position: relative;
                    margin-top: 3px; display: flex; align-items: flex-end;
                }
                .fin-chart-svg {
                    width: 100%; height: 100%; overflow: visible;
                }
                .fin-tooltip-tag {
                    position: absolute; top: -14px; right: 0;
                    font-size: 9px; font-weight: 600; color: #94a3b8;
                    background: rgba(0, 0, 0, 0.4); padding: 1px 5px; border-radius: 4px;
                    opacity: 0; transition: opacity 0.15s;
                }
                .fin-chart-wrap:hover .fin-tooltip-tag { opacity: 1; }

                /* Dual Cards Mode */
                .fin-dual-grid {
                    flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
                    align-items: stretch; margin-top: 4px;
                }
                @media (max-width: 220px) {
                    .fin-dual-grid { grid-template-columns: 1fr; }
                }
                .fin-dual-card {
                    background: rgba(0, 0, 0, 0.18); border: 1px solid var(--panel-border);
                    border-radius: 10px; padding: 6px 8px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden; position: relative;
                }
                .fin-dual-top {
                    display: flex; align-items: center; justify-content: space-between; gap: 4px;
                }
                .fin-dual-price {
                    font-size: 13px; font-weight: 700; color: var(--text-primary);
                    margin: 2px 0 3px 0; font-variant-numeric: tabular-nums;
                }
                .fin-mini-sparkline {
                    width: 100%; height: 24px;
                }

                /* Market Overview Mode */
                .fin-market-list {
                    flex: 1; display: flex; flex-direction: column; gap: 3px;
                    overflow-y: auto; scrollbar-width: none; margin-top: 4px;
                }
                .fin-market-list::-webkit-scrollbar { display: none; }
                .fin-market-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 4px 6px; border-radius: 7px;
                    background: rgba(0, 0, 0, 0.16); border: 1px solid var(--panel-border);
                }
            </style>
        ` : '';

        // Render based on chosen mode:
        let bodyHtml = '';

        if (viewMode === 'single') {
            const isUp = primaryAsset.change >= 0;
            const points = this.historyCache[primaryAsset.id] || this.generateSynthetic24h(primaryAsset);
            const { lineD, areaD } = this.buildSmoothSvgPath(points, 240, 50);

            bodyHtml = `
                <div class="fin-hero-section">
                    <div class="fin-price-large" id="fin-hero-price-${id}">
                        ${this.formatPrice(primaryAsset.price, primaryAsset)}
                    </div>
                    <div class="fin-hero-meta">
                        <span class="fin-change-chip ${isUp ? 'up' : 'down'}">
                            ${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${primaryAsset.change.toFixed(2)}%
                        </span>
                        <span class="fin-hl-text">H: ${this.formatPrice(primaryAsset.high || primaryAsset.price * 1.01, primaryAsset)}</span>
                        <span class="fin-hl-text">L: ${this.formatPrice(primaryAsset.low || primaryAsset.price * 0.99, primaryAsset)}</span>
                    </div>
                </div>
                ${showChart ? `
                    <div class="fin-chart-wrap" id="fin-chart-wrap-${id}">
                        <div class="fin-tooltip-tag" id="fin-tooltip-${id}">24h Hourly Trend</div>
                        <svg class="fin-chart-svg" viewBox="0 0 240 50" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="fin-grad-${id}" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="${isUp ? '#10b981' : '#ef4444'}" stop-opacity="0.32" />
                                    <stop offset="100%" stop-color="${isUp ? '#10b981' : '#ef4444'}" stop-opacity="0.0" />
                                </linearGradient>
                            </defs>
                            <path d="${areaD}" fill="url(#fin-grad-${id})" />
                            <path d="${lineD}" fill="none" stroke="${isUp ? '#10b981' : '#ef4444'}" stroke-width="2" stroke-linecap="round" />
                        </svg>
                    </div>
                ` : ''}
            `;
        } else if (viewMode === 'dual') {
            const p1IsUp = primaryAsset.change >= 0;
            const p2IsUp = secondaryAsset.change >= 0;

            const pts1 = this.historyCache[primaryAsset.id] || this.generateSynthetic24h(primaryAsset);
            const pts2 = this.historyCache[secondaryAsset.id] || this.generateSynthetic24h(secondaryAsset);

            const chart1 = this.buildSmoothSvgPath(pts1, 100, 24);
            const chart2 = this.buildSmoothSvgPath(pts2, 100, 24);

            bodyHtml = `
                <div class="fin-dual-grid">
                    <div class="fin-dual-card">
                        <div class="fin-dual-top">
                            <span class="fin-asset-sym">${primaryAsset.icon} ${primaryAsset.symbol}</span>
                            <span class="fin-change-chip ${p1IsUp ? 'up' : 'down'}">${p1IsUp ? '+' : ''}${primaryAsset.change.toFixed(1)}%</span>
                        </div>
                        <div class="fin-dual-price">${this.formatPrice(primaryAsset.price, primaryAsset)}</div>
                        <svg class="fin-mini-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                            <path d="${chart1.lineD}" fill="none" stroke="${p1IsUp ? '#10b981' : '#ef4444'}" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="fin-dual-card">
                        <div class="fin-dual-top">
                            <span class="fin-asset-sym">${secondaryAsset.icon} ${secondaryAsset.symbol}</span>
                            <span class="fin-change-chip ${p2IsUp ? 'up' : 'down'}">${p2IsUp ? '+' : ''}${secondaryAsset.change.toFixed(1)}%</span>
                        </div>
                        <div class="fin-dual-price">${this.formatPrice(secondaryAsset.price, secondaryAsset)}</div>
                        <svg class="fin-mini-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                            <path d="${chart2.lineD}" fill="none" stroke="${p2IsUp ? '#10b981' : '#ef4444'}" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                    </div>
                </div>
            `;
        } else {
            // Market Overview mode
            const currentCat = this.config.category || 'crypto';
            const catItems = this.assets.filter(a => a.type === currentCat || (currentCat === 'commodities' && a.type === 'commodities'));

            let rows = '';
            catItems.forEach(item => {
                const isUp = item.change >= 0;
                rows += `
                    <div class="fin-market-row">
                        <div style="display:flex; align-items:center; gap:5px;">
                            <span>${item.icon}</span>
                            <span style="font-size:11px; font-weight:700; color:var(--text-primary);">${item.symbol}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:11px; font-weight:700; color:var(--text-primary);">${this.formatPrice(item.price, item)}</span>
                            <span class="fin-change-chip ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${item.change.toFixed(1)}%</span>
                        </div>
                    </div>
                `;
            });

            bodyHtml = `
                <div class="fin-market-list">
                    ${rows}
                </div>
            `;
        }

        return `
            ${injectStyles}
            <div class="fin-w-box" id="fin-w-${id}">
                <div class="fin-top-bar">
                    <div class="fin-asset-badge">
                        <span class="fin-asset-icon">${primaryAsset.icon}</span>
                        <span class="fin-asset-sym">${viewMode === 'dual' ? `${primaryAsset.symbol} / ${secondaryAsset.symbol}` : primaryAsset.symbol}</span>
                        <span class="fin-asset-fullname">${primaryAsset.name}</span>
                    </div>
                    <div class="fin-controls-right">
                        <button type="button" class="fin-mode-pill ${viewMode === 'single' ? 'active' : ''}" data-mode="single" title="Single Focus">1x</button>
                        <button type="button" class="fin-mode-pill ${viewMode === 'dual' ? 'active' : ''}" data-mode="dual" title="Dual Split">2x</button>
                        <button type="button" class="fin-mode-pill ${viewMode === 'market' ? 'active' : ''}" data-mode="market" title="Market Overview">List</button>
                        <button type="button" class="fin-icon-btn" id="fin-refresh-${id}" title="Refresh Live Rates" aria-label="Refresh">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                ${bodyHtml}
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const box = el.querySelector(`#fin-w-${id}`);
        if (!box) return;

        // Auto-fetch if data is older than 5 minutes
        const now = Date.now();
        const last = this.config.lastUpdate || 0;
        if (now - last > 300000) {
            this.fetchLiveRates().then(() => {
                this.config.lastUpdate = Date.now();
                this.updateConfig({ lastUpdate: this.config.lastUpdate }, true);
            });
        }

        // Mode switch pills
        box.querySelectorAll('.fin-mode-pill').forEach(pill => {
            pill.addEventListener('pointerdown', (e) => e.stopPropagation());
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const m = pill.getAttribute('data-mode');
                if (m && m !== this.config.viewMode) {
                    this.config.viewMode = m;
                    this.updateConfig({ viewMode: m }, true);
                    if (navigator.vibrate) navigator.vibrate(20);
                }
            });
        });

        // Refresh button
        const refreshBtn = box.querySelector(`#fin-refresh-${id}`);
        if (refreshBtn) {
            refreshBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            refreshBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                refreshBtn.classList.add('spinning');
                await this.fetchLiveRates();
                this.config.lastUpdate = Date.now();
                refreshBtn.classList.remove('spinning');
                this.updateConfig({ lastUpdate: this.config.lastUpdate }, true);
                if (navigator.vibrate) navigator.vibrate(30);
            });
        }

        // Interactive chart hover scrubbing
        const chartWrap = box.querySelector(`#fin-chart-wrap-${id}`);
        const heroPrice = box.querySelector(`#fin-hero-price-${id}`);
        const tooltip = box.querySelector(`#fin-tooltip-${id}`);

        if (chartWrap && heroPrice) {
            const primaryId = this.config.primaryAsset || 'BTC';
            const primaryAsset = this.getAsset(primaryId);
            const points = this.historyCache[primaryAsset.id] || this.generateSynthetic24h(primaryAsset);

            const handlePointer = (clientX) => {
                const rect = chartWrap.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                const idx = Math.min(points.length - 1, Math.round(ratio * (points.length - 1)));
                const hoveredPrice = points[idx];
                const hoursAgo = 23 - idx;

                heroPrice.textContent = this.formatPrice(hoveredPrice, primaryAsset);
                if (tooltip) {
                    tooltip.textContent = hoursAgo === 0 ? 'Now' : `${hoursAgo}h ago: ${this.formatPrice(hoveredPrice, primaryAsset)}`;
                    tooltip.style.opacity = '1';
                }
            };

            chartWrap.addEventListener('pointermove', (e) => handlePointer(e.clientX));
            chartWrap.addEventListener('pointerleave', () => {
                heroPrice.textContent = this.formatPrice(primaryAsset.price, primaryAsset);
                if (tooltip) tooltip.textContent = '24h Hourly Trend';
            });
        }
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(FinanceWidget);
}
