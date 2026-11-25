import { BaseWidget } from '../base.js';

const MARKET_CACHE_KEY = 'progrid_market_rates_cache';
const MARKET_HISTORY_KEY = 'progrid_market_history_cache';

const ASSET_SVGS = {
    BTC: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#f7931a"/><path d="M15.2 10.3c.3-.8.2-1.7-.5-2.2-.6-.5-1.5-.7-2.6-.7V6h-1.2v1.4h-.9V6H8.8v1.4H7v1.4h1.1c.3 0 .4.2.4.4v5.6c0 .2-.1.4-.4.4H7v1.4h1.8V18h1.2v-1.4h.9V18h1.2v-1.4c2.1 0 3.5-.8 3.6-2.5 0-1-.5-1.7-1.3-2.1.9-.3 1.2-1 1-1.7zm-4-1.9h1.7c.9 0 1.5.3 1.5 1s-.6 1-1.5 1h-1.7V8.4zm2.1 6.2h-2.1v-2.2h2.1c1 0 1.7.4 1.7 1.1s-.7 1.1-1.7 1.1z" fill="#fff"/></svg>`,
    ETH: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#627eea"/><path d="M12 4l-4.5 7.5L12 14l4.5-2.5L12 4z" fill="#fff" fill-opacity=".8"/><path d="M7.5 11.5L12 14v-5.5L7.5 11.5z" fill="#fff" fill-opacity=".5"/><path d="M12 14l4.5-2.5L12 8.5V14z" fill="#fff" fill-opacity=".8"/><path d="M7.5 12.5L12 19l4.5-6.5L12 15l-4.5-2.5z" fill="#fff" fill-opacity=".8"/><path d="M12 15v4l4.5-6.5L12 15z" fill="#fff" fill-opacity=".5"/></svg>`,
    USDIRR: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#10b981"/><path d="M7 8h10v8H7z" stroke="#fff" stroke-width="1.4" rx="1.5"/><circle cx="12" cy="12" r="2.2" stroke="#fff" stroke-width="1.3"/><path d="M12 6.5v1.5m0 8V17.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    USDT: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#26a17b"/><path d="M13.4 12.8c-1 .08-2 .08-3 0v4.2H8.6v-4.2c-2.4-.2-4-1-4-2 0-1.1 1.7-1.9 4-2.1V6.2h6.8v2.5c2.3.2 4 1 4 2.1 0 1-1.6 1.8-4 2zm-4.7-1c1.1.1 2.3.1 3.4 0 .7-.1 1.8-.4 2.2-.7-.5-.4-1.7-.6-2.5-.7-1-.1-2.1-.1-3.1 0-.9.1-2 .3-2.5.7.5.3 1.5.6 2.5.7z" fill="#fff"/></svg>`,
    SOL: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#141414"/><path d="M7 8h8.5l1.5 1.5-1.5 1.5H7l-1.5-1.5L7 8zm10 3.5H8.5L7 13l1.5 1.5H17l1.5-1.5-1.5-1.5zM7 16h8.5l1.5 1.5-1.5 1.5H7l-1.5-1.5L7 16z" fill="#a855f7"/></svg>`,
    TON: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#0088cc"/><path d="M12 5l6.5 4.5L12 19 5.5 9.5 12 5zm0 2.2L7.6 9.8 12 16.5l4.4-6.7L12 7.2z" fill="#fff"/></svg>`,
    GOLD: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#f59e0b"/><path d="M6 14.5l2.5-5h7L18 14.5H6z" fill="#fef3c7" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
    OIL: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#334155"/><path d="M12 5c-2.5 3.5-5 6.5-5 9.5a5 5 0 0 0 10 0c0-3-2.5-6-5-9.5z" fill="#94a3b8"/></svg>`,
    SILVER: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#64748b"/><path d="M6 14.5l2.5-5h7L18 14.5H6z" fill="#e2e8f0" stroke="#475569" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
    EURUSD: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#0284c7"/><path d="M14.5 8.5a4 4 0 0 0-5.5 3.5h5.5m-5.5 1.5h5.5a4 4 0 0 1-5.5 3.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 12h3.5" stroke="#fff" stroke-width="1.6"/></svg>`,
    GBPUSD: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="11" fill="#4f46e5"/><path d="M15 7.5a3 3 0 0 0-4.5 2.5c0 2.5 3 4 3 6h-6m5-3.5H9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`
};

const ASSET_REGISTRY = [
    { id: 'USDIRR', name: 'US Dollar', symbol: 'USD', price: 292890, change: 3.17, high: 293890, low: 283890, icon: ASSET_SVGS.USDIRR, type: 'forex', unit: 'Toman' },
    { id: 'USDT', name: 'Tether (Nobitex)', symbol: 'USDT', price: 294200, change: 1.14, high: 298888, low: 290329, icon: ASSET_SVGS.USDT, type: 'crypto', unit: 'Toman' },
    { id: 'GOLD', name: 'Gold (Ounce)', symbol: 'GOLD', price: 3554.89, change: 0.62, high: 3675.0, low: 3550.0, icon: ASSET_SVGS.GOLD, type: 'commodities', unit: '$' },
    { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', price: 91450, change: 2.34, high: 92800, low: 89400, icon: ASSET_SVGS.BTC, type: 'crypto', unit: '$' },
    { id: 'ETH', name: 'Ethereum', symbol: 'ETH', price: 3120, change: -0.85, high: 3190, low: 3080, icon: ASSET_SVGS.ETH, type: 'crypto', unit: '$' },
    { id: 'SOL', name: 'Solana', symbol: 'SOL', price: 198.4, change: 4.12, high: 202.5, low: 189.0, icon: ASSET_SVGS.SOL, type: 'crypto', unit: '$' },
    { id: 'TON', name: 'Toncoin', symbol: 'TON', price: 5.45, change: 1.15, high: 5.62, low: 5.38, icon: ASSET_SVGS.TON, type: 'crypto', unit: '$' },
    { id: 'OIL', name: 'Brent Crude', symbol: 'OIL', price: 74.2, change: -1.45, high: 75.8, low: 73.6, icon: ASSET_SVGS.OIL, type: 'commodities', unit: '$' },
    { id: 'SILVER', name: 'Silver (Ounce)', symbol: 'SILVER', price: 31.85, change: 0.94, high: 32.2, low: 31.4, icon: ASSET_SVGS.SILVER, type: 'commodities', unit: '$' },
    { id: 'EURUSD', name: 'Euro / Dollar', symbol: 'EUR', price: 1.054, change: -0.22, high: 1.058, low: 1.051, icon: ASSET_SVGS.EURUSD, type: 'forex', unit: '$' },
    { id: 'GBPUSD', name: 'British Pound', symbol: 'GBP', price: 1.268, change: 0.15, high: 1.272, low: 1.264, icon: ASSET_SVGS.GBPUSD, type: 'forex', unit: '$' }
];

export default class FinanceWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'finance',
            label: 'Markets & Crypto',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 1, minH: 1, maxW: 4, maxH: 3,
            category: 'finance',
            author: 'MR Prog',
            version: '1.7.0',
            downloads: '10.5k',
            description: 'Professional financial tracker with live market rates, per-asset USD/TMN currency toggle, and responsive layouts.',
            defaultConfig: {
                assets: ['USDIRR', 'GOLD'],
                primaryAsset: 'USDIRR',
                secondaryAsset: 'GOLD',
                baseCurrency: 'IRT',
                assetCurrencies: {},
                showChart: true,
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
                    parsed.forEach(a => {
                        if (ASSET_SVGS[a.id]) a.icon = ASSET_SVGS[a.id];
                        if (a.id === 'USDIRR') {
                            a.name = 'US Dollar';
                            a.symbol = 'USD';
                            if (a.price > 2000000 || a.price < 50000) {
                                a.price = 292890;
                                a.high = 293890;
                                a.low = 283890;
                            }
                        }
                        if (a.id === 'USDT') {
                            a.name = 'Tether (Nobitex)';
                            a.symbol = 'USDT';
                            if (a.price > 2000000 || a.price < 50000) {
                                a.price = 294200;
                                a.high = 298888;
                                a.low = 290329;
                            }
                        }
                        if (a.id === 'GOLD') {
                            a.name = 'Gold (Ounce)';
                            a.symbol = 'GOLD';
                        }
                    });
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
        const found = this.assets.find(a => a.id === id);
        if (found) {
            if (ASSET_SVGS[found.id]) found.icon = ASSET_SVGS[found.id];
            return found;
        }
        return this.assets[0];
    }

    getUsdToTomanRate() {
        const usdirr = this.assets.find(a => a.id === 'USDIRR');
        if (usdirr && usdirr.price >= 50000 && usdirr.price <= 2000000) {
            return usdirr.price;
        }
        const usdt = this.assets.find(a => a.id === 'USDT');
        if (usdt && usdt.price >= 50000 && usdt.price <= 2000000) {
            return usdt.price;
        }
        return 292890;
    }

    getAssetCurrency(asset) {
        if (!asset) return this.config.baseCurrency || 'IRT';
        if (asset.id === 'USDIRR') return 'IRT';
        const map = this.config.assetCurrencies || {};
        if (map[asset.id] === 'USD' || map[asset.id] === 'IRT') {
            return map[asset.id];
        }
        return this.config.baseCurrency || 'IRT';
    }

    generateSynthetic24h(asset) {
        const points = [];
        const base = asset.price;
        const change = asset.change || 0;
        const startPrice = base / (1 + change / 100);
        const steps = 24;

        let seed = 0;
        for (let i = 0; i < asset.id.length; i++) seed += asset.id.charCodeAt(i);

        for (let i = 0; i < steps; i++) {
            const progress = i / (steps - 1);
            const trend = startPrice + (base - startPrice) * progress;
            const wave1 = Math.sin(progress * Math.PI * 3 + seed) * (base * 0.008);
            const wave2 = Math.cos(progress * Math.PI * 5 + seed * 1.5) * (base * 0.005);
            let val = trend + wave1 + wave2;

            if (i === steps - 1) val = base;
            points.push(+val.toFixed(base > 100 ? 1 : 4));
        }
        return points;
    }

    buildSmoothSvgPath(points, width, height) {
        if (!points || points.length === 0) return { lineD: '', areaD: '' };
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = (max - min) || 1;
        const padY = 4;
        const effectiveH = height - padY * 2;

        const coords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - padY - ((p - min) / range) * effectiveH;
            return [x, y];
        });

        let lineD = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const p0 = coords[i === 0 ? 0 : i - 1];
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

            const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
            const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
            const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
            const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

            lineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
        }

        const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
        return { lineD, areaD };
    }

    async fetchLiveRates() {
        if (this.isLoading) return;
        if (!navigator.onLine) return;
        this.isLoading = true;

        // 1. Fetch Crypto & Spot Gold Live Rates via Binance Public API
        try {
            const symbolsParam = '["BTCUSDT","ETHUSDT","SOLUSDT","TONUSDT","PAXGUSDT"]';
            const cryptoRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`, { signal: AbortSignal.timeout(4000) });
            if (cryptoRes.ok) {
                const arr = await cryptoRes.json();
                if (Array.isArray(arr)) {
                    arr.forEach(item => {
                        if (item.symbol === 'PAXGUSDT') {
                            const target = this.assets.find(c => c.id === 'GOLD');
                            if (target) {
                                target.price = parseFloat(item.lastPrice);
                                target.change = parseFloat(item.priceChangePercent);
                                target.high = parseFloat(item.highPrice);
                                target.low = parseFloat(item.lowPrice);
                            }
                        } else {
                            const sym = item.symbol.replace('USDT', '');
                            const target = this.assets.find(c => c.id === sym);
                            if (target) {
                                target.price = parseFloat(item.lastPrice);
                                target.change = parseFloat(item.priceChangePercent);
                                target.high = parseFloat(item.highPrice);
                                target.low = parseFloat(item.lowPrice);
                            }
                        }
                    });
                }
            }
        } catch {
            // Secondary Fallback: CoinGecko Free Public API
            try {
                const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,the-open-network&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=false', { signal: AbortSignal.timeout(3500) });
                if (cgRes.ok) {
                    const cg = await cgRes.json();
                    if (cg.bitcoin && this.getAsset('BTC')) {
                        const btc = this.getAsset('BTC');
                        btc.price = cg.bitcoin.usd;
                        btc.change = cg.bitcoin.usd_24h_change || btc.change;
                    }
                    if (cg.ethereum && this.getAsset('ETH')) {
                        const eth = this.getAsset('ETH');
                        eth.price = cg.ethereum.usd;
                        eth.change = cg.ethereum.usd_24h_change || eth.change;
                    }
                    if (cg.solana && this.getAsset('SOL')) {
                        const sol = this.getAsset('SOL');
                        sol.price = cg.solana.usd;
                        sol.change = cg.solana.usd_24h_change || sol.change;
                    }
                    if (cg['the-open-network'] && this.getAsset('TON')) {
                        const ton = this.getAsset('TON');
                        ton.price = cg['the-open-network'].usd;
                        ton.change = cg['the-open-network'].usd_24h_change || ton.change;
                    }
                }
            } catch {}
        }

        // 2. Fetch Live USD/Toman & Free Market Exchange Rates
        // Tier 1: Real-time Multi-Exchange Aggregator (Nobitex & TGJU Open Market Stream) with 100% CORS support
        let irRateFetched = false;
        try {
            const openRes = await fetch('https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/popular.json', { signal: AbortSignal.timeout(4000) });
            if (openRes.ok) {
                const openData = await openRes.json();
                if (openData && Array.isArray(openData.data)) {
                    const usdItem = openData.data.find(d => d.symbol === 'USD_IRR_FREE') || openData.data.find(d => d.symbol === 'USDT_IRR');
                    if (usdItem && usdItem.price >= 50000) {
                        const tmnTarget = this.assets.find(f => f.id === 'USDIRR');
                        if (tmnTarget) {
                            tmnTarget.price = Math.round(usdItem.price);
                            if (usdItem.high) tmnTarget.high = Math.round(usdItem.high);
                            if (usdItem.low) tmnTarget.low = Math.round(usdItem.low);
                            if (usdItem.change_pct !== undefined && usdItem.change_pct !== null) {
                                tmnTarget.change = parseFloat(usdItem.change_pct) || tmnTarget.change;
                            }
                        }
                        irRateFetched = true;
                    }

                    const usdtItem = openData.data.find(d => d.symbol === 'USDT_IRR');
                    if (usdtItem && usdtItem.price >= 50000) {
                        const usdtTarget = this.assets.find(f => f.id === 'USDT');
                        if (usdtTarget) {
                            usdtTarget.price = Math.round(usdtItem.price);
                            if (usdtItem.high) usdtTarget.high = Math.round(usdtItem.high);
                            if (usdtItem.low) usdtTarget.low = Math.round(usdtItem.low);
                            if (usdtItem.change_pct !== undefined && usdtItem.change_pct !== null) {
                                usdtTarget.change = parseFloat(usdtItem.change_pct) || usdtTarget.change;
                            }
                        }
                    }

                    const eurItem = openData.data.find(d => d.symbol === 'EUR_IRR_FREE');
                    if (eurItem && eurItem.price >= 50000) {
                        const eurTarget = this.assets.find(f => f.id === 'EURUSD');
                        if (eurTarget && this.getAssetCurrency(eurTarget) === 'IRT') {
                            // If user tracks EUR directly in IRT
                        }
                    }
                }
            }
        } catch (_) {}

        // Tier 2: Wallex Iranian Exchange Direct API (if environment / proxy allows)
        if (!irRateFetched) {
            try {
                const wallexRes = await fetch('https://api.wallex.ir/v1/markets', { signal: AbortSignal.timeout(3500) });
                if (wallexRes.ok) {
                    const wallexData = await wallexRes.json();
                    const usdtSymbol = wallexData?.result?.symbols?.USDTTMN;
                    if (usdtSymbol?.stats?.lastPrice) {
                        const wallexPrice = parseFloat(usdtSymbol.stats.lastPrice);
                        if (wallexPrice >= 50000) {
                            const tmnTarget = this.assets.find(f => f.id === 'USDIRR');
                            if (tmnTarget) {
                                tmnTarget.price = Math.round(wallexPrice);
                                if (usdtSymbol.stats['24h_high']) tmnTarget.high = Math.round(parseFloat(usdtSymbol.stats['24h_high']));
                                if (usdtSymbol.stats['24h_low']) tmnTarget.low = Math.round(parseFloat(usdtSymbol.stats['24h_low']));
                                if (usdtSymbol.stats['24h_ch']) tmnTarget.change = parseFloat(usdtSymbol.stats['24h_ch']) || tmnTarget.change;
                            }
                            const usdtTarget = this.assets.find(f => f.id === 'USDT');
                            if (usdtTarget) {
                                usdtTarget.price = Math.round(wallexPrice);
                            }
                            irRateFetched = true;
                        }
                    }
                }
            } catch (_) {}
        }

        // Tier 3: Exir Exchange Direct API
        if (!irRateFetched) {
            try {
                const exirRes = await fetch('https://api.exir.io/v2/ticker?symbol=usdt-irt', { signal: AbortSignal.timeout(3500) });
                if (exirRes.ok) {
                    const exirData = await exirRes.json();
                    if (exirData && exirData.last && exirData.last >= 50000) {
                        const exirPrice = Math.round(exirData.last);
                        const tmnTarget = this.assets.find(f => f.id === 'USDIRR');
                        if (tmnTarget) {
                            tmnTarget.price = exirPrice;
                            if (exirData.high) tmnTarget.high = Math.round(exirData.high);
                            if (exirData.low) tmnTarget.low = Math.round(exirData.low);
                        }
                        const usdtTarget = this.assets.find(f => f.id === 'USDT');
                        if (usdtTarget) {
                            usdtTarget.price = exirPrice;
                        }
                        irRateFetched = true;
                    }
                }
            } catch (_) {}
        }

        // Tier 4: TGJU Direct API fallback
        if (!irRateFetched) {
            try {
                const tgjuRes = await fetch('https://api.tgju.org/v1/market/indicator/summary-table-data/price_dollar_rl', { signal: AbortSignal.timeout(4500) });
                if (tgjuRes.ok) {
                    const tgjuData = await tgjuRes.json();
                    if (tgjuData && Array.isArray(tgjuData.data) && tgjuData.data.length > 0) {
                        const row = tgjuData.data[0];
                        const priceRls = parseInt(String(row[3]).replace(/,/g, ''), 10);
                        if (priceRls > 500000) {
                            const priceTmn = Math.round(priceRls / 10);
                            const highTmn = row[2] ? Math.round(parseInt(String(row[2]).replace(/,/g, ''), 10) / 10) : Math.round(priceTmn * 1.008);
                            const lowTmn = row[1] ? Math.round(parseInt(String(row[1]).replace(/,/g, ''), 10) / 10) : Math.round(priceTmn * 0.992);
                            const chStr = String(row[5] || '').replace(/<[^>]+>/g, '').replace('%', '').trim();
                            const isDown = String(row[5] || '').includes('low') || String(row[5] || '').includes('danger');
                            const chVal = parseFloat(chStr);

                            const tmnTarget = this.assets.find(f => f.id === 'USDIRR');
                            if (tmnTarget) {
                                tmnTarget.price = priceTmn;
                                tmnTarget.high = highTmn;
                                tmnTarget.low = lowTmn;
                                if (!isNaN(chVal)) {
                                    tmnTarget.change = isDown ? -Math.abs(chVal) : Math.abs(chVal);
                                }
                            }
                            irRateFetched = true;
                        }
                    }
                }
            } catch (_) {}
        }

        // Also fetch live Gold Ounce from TGJU if available
        try {
            const onsRes = await fetch('https://api.tgju.org/v1/market/indicator/summary-table-data/ons', { signal: AbortSignal.timeout(3500) });
            if (onsRes.ok) {
                const onsData = await onsRes.json();
                if (onsData && Array.isArray(onsData.data) && onsData.data.length > 0) {
                    const row = onsData.data[0];
                    const goldVal = parseFloat(String(row[3]).replace(/,/g, ''));
                    const goldTarget = this.assets.find(f => f.id === 'GOLD');
                    if (goldTarget && goldVal > 1000) {
                        goldTarget.price = goldVal;
                        if (row[2]) goldTarget.high = parseFloat(String(row[2]).replace(/,/g, '')) || goldTarget.high;
                        if (row[1]) goldTarget.low = parseFloat(String(row[1]).replace(/,/g, '')) || goldTarget.low;
                    }
                }
            }
        } catch (_) {}

        // 3. Update synthetic 24h history points from real prices
        this.assets.forEach(a => {
            this.historyCache[a.id] = this.generateSynthetic24h(a);
        });
        this.saveCachedHistory();

        this.isLoading = false;
        this.saveCachedAssets();
    }

    formatPrice(val, asset, isCompact = false) {
        if (val === undefined || val === null || isNaN(val)) return '---';
        const isIRT = (this.getAssetCurrency(asset) === 'IRT');
        const usdToTmn = this.getUsdToTomanRate();

        // Converted to Toman per-asset currency
        if (isIRT) {
            const tomanVal = (asset.id === 'USDIRR' || asset.unit === 'Toman') ? val : (val * usdToTmn);

            if (tomanVal >= 1e9) {
                return `${(tomanVal / 1e9).toFixed(2)}B TMN`;
            } else if (tomanVal >= 1e6) {
                return `${(tomanVal / 1e6).toFixed(1)}M TMN`;
            } else if (!isCompact && tomanVal >= 1e3 && tomanVal < 1e6) {
                return `${Math.round(tomanVal).toLocaleString('en-US')} TMN`;
            } else if (tomanVal >= 1e3) {
                return `${(tomanVal / 1e3).toFixed(1)}k TMN`;
            }
            return `${Math.round(tomanVal)} TMN`;
        }

        // Standard USD pricing (baseCurrency === 'USD')
        if (asset.id === 'USDIRR') {
            return '$1.00';
        }

        if (isCompact) {
            if (val >= 1e6) {
                return `$${(val / 1e6).toFixed(2)}M`;
            }
            if (val >= 1000) {
                return `$${(val / 1000).toFixed(1)}k`;
            }
            if (val >= 1) {
                return `$${val.toFixed(2)}`;
            }
            return `$${val.toFixed(3)}`;
        }

        if (val >= 1000) {
            return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
        }
        if (val >= 1) {
            return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 })}`;
    }

    render() {
        const id = this.config.id;
        
        let trackedIds = [];
        if (Array.isArray(this.config.assets) && this.config.assets.length > 0) {
            trackedIds = this.config.assets.slice(0, 4);
        } else {
            trackedIds = [this.config.primaryAsset || 'BTC', this.config.secondaryAsset || 'USDIRR'].filter(Boolean);
        }
        if (trackedIds.length === 0) trackedIds = ['BTC', 'USDIRR'];

        const trackedAssets = trackedIds.map(assetId => this.getAsset(assetId));
        const showChart = this.config.showChart !== false;
        const count = trackedAssets.length;
        const isIRT = this.config.baseCurrency === 'IRT';
        const usdToTmn = this.getUsdToTomanRate();
        const coordsH = (this.config.h !== undefined) ? this.config.h : (this.config.defaultH || 1);
        const isCompact = (coordsH === 1);

        const injectStyles = !document.getElementById('finance-widget-css') ? `
            <style id="finance-widget-css">
                .fin-w-box {
                    width: 100%; height: 100%; box-sizing: border-box;
                    padding: 7px 9px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden; position: relative;
                    user-select: none;
                }
                .fin-top-bar {
                    display: flex; align-items: center; justify-content: space-between;
                    min-height: 22px; width: 100%; flex-shrink: 0;
                }
                .fin-asset-badge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 2.5px 7px; border-radius: 7px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .fin-asset-icon {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 16px; height: 16px; flex-shrink: 0;
                }
                .fin-asset-icon svg { width: 16px; height: 16px; display: block; }
                .fin-asset-sym {
                    font-size: 11px; font-weight: 700; color: var(--text-primary);
                }
                .fin-asset-fullname {
                    font-size: 9.5px; color: var(--text-secondary); max-width: 85px;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .fin-currency-indicator {
                    font-size: 9px; font-weight: 700; padding: 1px 4.5px; border-radius: 4px;
                    background: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.25);
                }
                .fin-controls-right {
                    display: flex; align-items: center; gap: 5px;
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

                /* Compact Horizontal 1-Row Layout */
                .fin-compact-row {
                    display: flex; align-items: stretch; gap: 4px; width: 100%;
                    flex: 1; min-height: 0; margin-top: 2px;
                }
                .fin-compact-card {
                    flex: 1; min-width: 0; background: rgba(0, 0, 0, 0.18);
                    border: 1px solid var(--panel-border); border-radius: 8px;
                    padding: 2.5px 4.5px; display: flex; flex-direction: column;
                    justify-content: center; gap: 1px; overflow: hidden;
                    box-sizing: border-box;
                }
                .fin-compact-head {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 2px; min-width: 0; width: 100%;
                }
                .fin-compact-sym {
                    font-size: 9px; font-weight: 700; color: var(--text-primary);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .fin-mini-chip {
                    font-size: 7.5px !important; padding: 0.5px 2px !important; line-height: 1.1;
                    letter-spacing: -0.2px; border-radius: 4px;
                }
                .fin-compact-price {
                    font-size: clamp(9.5px, 2.5vw, 11px); font-weight: 800; color: var(--text-primary);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    font-variant-numeric: tabular-nums; margin-top: 1px;
                    letter-spacing: -0.3px;
                }
                .fin-cur-toggle {
                    font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 4px;
                    background: rgba(59, 130, 246, 0.14); color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.25); cursor: pointer;
                    transition: background 0.15s, transform 0.12s; line-height: 1.2; flex-shrink: 0;
                }
                .fin-cur-toggle:hover { background: rgba(59, 130, 246, 0.28); }
                .fin-cur-toggle:active { transform: scale(0.92); }
                .fin-compact-single {
                    flex: 1; display: flex; align-items: center; justify-content: space-between;
                    padding: 4px 10px; background: rgba(0, 0, 0, 0.18);
                    border: 1px solid var(--panel-border); border-radius: 9px; margin-top: 3px;
                }

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
                    font-size: 9.5px; font-weight: 700; padding: 1.5px 5.5px; border-radius: 5px;
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

                /* Dual Cards Mode (2 assets) */
                .fin-dual-grid {
                    flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
                    align-items: stretch; margin-top: 4px;
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
                    font-size: 12.5px; font-weight: 700; color: var(--text-primary);
                    margin: 2px 0 3px 0; font-variant-numeric: tabular-nums;
                }
                .fin-mini-sparkline {
                    width: 100%; height: 24px;
                }

                /* Tri-Asset Mode (3 assets, Expanded) */
                .fin-tri-container {
                    flex: 1; display: grid; grid-template-columns: 1fr 1fr;
                    grid-template-rows: auto 1fr; gap: 6px; margin-top: 4px; overflow: hidden;
                }
                .fin-tri-featured {
                    grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between;
                    padding: 6px 9px; border-radius: 9px;
                    background: rgba(0, 0, 0, 0.22); border: 1px solid var(--panel-border);
                    gap: 8px;
                }
                .fin-tri-featured-left {
                    display: flex; flex-direction: column; gap: 1px;
                }
                .fin-tri-featured-right {
                    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
                }
                .fin-tri-subcard {
                    background: rgba(0, 0, 0, 0.16); border: 1px solid var(--panel-border);
                    border-radius: 9px; padding: 5px 7px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden; min-width: 0;
                }
                .fin-tri-subcard-top {
                    display: flex; align-items: center; justify-content: space-between; gap: 4px;
                }
                .fin-tri-subcard-price {
                    font-size: 11.5px; font-weight: 700; color: var(--text-primary);
                    margin: 2px 0 1px 0; font-variant-numeric: tabular-nums;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }

                /* Quad Grid Mode (4 assets, Expanded) */
                .fin-quad-grid {
                    flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
                    gap: 5px; margin-top: 4px;
                }
                .fin-quad-card {
                    background: rgba(0, 0, 0, 0.18); border: 1px solid var(--panel-border);
                    border-radius: 8px; padding: 4px 6px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden;
                }
                .fin-quad-top {
                    display: flex; align-items: center; justify-content: space-between; gap: 2px;
                }
                .fin-quad-price {
                    font-size: 11px; font-weight: 700; color: var(--text-primary);
                    margin: 1px 0; font-variant-numeric: tabular-nums; white-space: nowrap;
                    overflow: hidden; text-overflow: ellipsis;
                }
                .fin-quad-sparkline {
                    width: 100%; height: 16px;
                }
            </style>
        ` : '';

        // Universal Top Bar
        const topBarHtml = `
            <div class="fin-top-bar">
                <div class="fin-asset-badge">
                    <span class="fin-asset-icon">
                        ${count === 1 ? trackedAssets[0].icon : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`}
                    </span>
                    <span class="fin-asset-sym">${count === 1 ? trackedAssets[0].symbol : (count === 2 ? `${trackedAssets[0].symbol} & ${trackedAssets[1].symbol}` : `Markets (${count})`)}</span>
                    ${count === 1 ? `<span class="fin-asset-fullname">${trackedAssets[0].name}</span>` : ''}
                    <span class="fin-currency-indicator">${isIRT ? 'TMN' : 'USD'}</span>
                </div>
                <div class="fin-controls-right">
                    <button type="button" class="fin-icon-btn" id="fin-refresh-${id}" title="Refresh Live Rates" aria-label="Refresh">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        let bodyHtml = '';

        // ----------------------------------------------------
        // COMPACT MODE: (Height = 1, e.g. 2x1, 3x1, 4x1)
        // Render 100% horizontally side-by-side without vertical clipping
        // ----------------------------------------------------
        if (isCompact) {
            if (count === 1) {
                const asset = trackedAssets[0];
                const isUp = asset.change >= 0;
                bodyHtml = `
                    <div class="fin-compact-single">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span class="fin-asset-icon">${asset.icon}</span>
                            <span style="font-size:12px; font-weight:700; color:var(--text-primary);">${asset.symbol}</span>
                            <span class="fin-change-chip ${isUp ? 'up' : 'down'}" style="font-size:9px; padding:1px 4.5px;">${isUp ? '+' : ''}${asset.change.toFixed(1)}%</span>
                        </div>
                        <div style="font-size:14px; font-weight:800; color:var(--text-primary); font-variant-numeric:tabular-nums;">
                            ${this.formatPrice(asset.price, asset)}
                        </div>
                    </div>
                `;
            } else {
                let cardsHtml = '';
                trackedAssets.forEach(asset => {
                    const isUp = asset.change >= 0;
                    cardsHtml += `
                        <div class="fin-compact-card" title="${asset.name || asset.symbol}: ${this.formatPrice(asset.price, asset, false)}">
                            <div class="fin-compact-head">
                                <span class="fin-asset-icon">${asset.icon}</span>
                                <span class="fin-compact-sym">${asset.symbol}</span>
                                <span class="fin-change-chip ${isUp ? 'up' : 'down'} fin-mini-chip">${isUp ? '+' : ''}${asset.change.toFixed(1)}%</span>
                            </div>
                            <div class="fin-compact-price">${this.formatPrice(asset.price, asset, true)}</div>
                        </div>
                    `;
                });
                bodyHtml = `<div class="fin-compact-row">${cardsHtml}</div>`;
            }
        } 
        // ----------------------------------------------------
        // EXPANDED MODE: (Height >= 2)
        // ----------------------------------------------------
        else {
            if (count === 1) {
                const asset = trackedAssets[0];
                const isUp = asset.change >= 0;
                const points = this.historyCache[asset.id] || this.generateSynthetic24h(asset);
                const { lineD, areaD } = this.buildSmoothSvgPath(points, 240, 50);

                bodyHtml = `
                    <div class="fin-hero-section">
                        <div class="fin-price-large" id="fin-hero-price-${id}">
                            ${this.formatPrice(asset.price, asset)}
                        </div>
                        <div class="fin-hero-meta">
                            <span class="fin-change-chip ${isUp ? 'up' : 'down'}">
                                ${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${asset.change.toFixed(2)}%
                            </span>
                            <span class="fin-hl-text">H: ${this.formatPrice(asset.high || asset.price * 1.01, asset)}</span>
                            <span class="fin-hl-text">L: ${this.formatPrice(asset.low || asset.price * 0.99, asset)}</span>
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
            } else if (count === 2) {
                let cardsHtml = '';
                trackedAssets.forEach(asset => {
                    const isUp = asset.change >= 0;
                    const pts = this.historyCache[asset.id] || this.generateSynthetic24h(asset);
                    const chart = this.buildSmoothSvgPath(pts, 100, 24);
                    const fullPriceStr = this.formatPrice(asset.price, asset);
                    const curBtn = asset.id === 'USDIRR' ? '' : `<button type="button" class="fin-cur-toggle" data-asset-id="${asset.id}" title="Switch USD / TMN">${this.getAssetCurrency(asset) === 'IRT' ? 'TMN' : 'USD'}</button>`;
                    cardsHtml += `
                        <div class="fin-dual-card" title="${asset.name || asset.symbol}: ${fullPriceStr}">
                            <div class="fin-dual-top">
                                <div style="display:flex; align-items:center; gap:4px; min-width:0;">
                                    <span class="fin-asset-icon">${asset.icon}</span>
                                    <span class="fin-asset-sym">${asset.symbol}</span>
                                    ${curBtn}
                                </div>
                                <span class="fin-change-chip ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${asset.change.toFixed(1)}%</span>
                            </div>
                            <div class="fin-dual-price">${fullPriceStr}</div>
                            <svg class="fin-mini-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                                <path d="${chart.lineD}" fill="none" stroke="${isUp ? '#10b981' : '#ef4444'}" stroke-width="1.8" stroke-linecap="round"/>
                            </svg>
                        </div>
                    `;
                });
                bodyHtml = `<div class="fin-dual-grid">${cardsHtml}</div>`;
            } else if (count === 3) {
                const heroAsset = trackedAssets[0];
                const heroIsUp = heroAsset.change >= 0;
                const subAssets = trackedAssets.slice(1);

                let subCardsHtml = '';
                subAssets.forEach(sub => {
                    const isUp = sub.change >= 0;
                    const pts = this.historyCache[sub.id] || this.generateSynthetic24h(sub);
                    const chart = this.buildSmoothSvgPath(pts, 70, 16);
                    subCardsHtml += `
                        <div class="fin-tri-subcard">
                            <div class="fin-tri-subcard-top">
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <span class="fin-asset-icon">${sub.icon}</span>
                                    <span style="font-size:10.5px; font-weight:700; color:var(--text-primary);">${sub.symbol}</span>
                                </div>
                                <span class="fin-change-chip ${isUp ? 'up' : 'down'}" style="font-size:8.5px; padding:1px 3.5px;">${isUp ? '+' : ''}${sub.change.toFixed(1)}%</span>
                            </div>
                            <div class="fin-tri-subcard-price">${this.formatPrice(sub.price, sub)}</div>
                            <svg style="width:100%; height:14px;" viewBox="0 0 70 14" preserveAspectRatio="none">
                                <path d="${chart.lineD}" fill="none" stroke="${isUp ? '#10b981' : '#ef4444'}" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                        </div>
                    `;
                });

                bodyHtml = `
                    <div class="fin-tri-container">
                        <div class="fin-tri-featured">
                            <div class="fin-tri-featured-left">
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <span class="fin-asset-icon">${heroAsset.icon}</span>
                                    <span style="font-size:11px; font-weight:700; color:var(--text-primary);">${heroAsset.symbol}</span>
                                    <span style="font-size:9px; color:var(--text-secondary);">${heroAsset.name}</span>
                                </div>
                                <div style="font-size:13px; font-weight:800; color:var(--text-primary); margin-top:1px;">${this.formatPrice(heroAsset.price, heroAsset)}</div>
                            </div>
                            <div class="fin-tri-featured-right">
                                <span class="fin-change-chip ${heroIsUp ? 'up' : 'down'}">${heroIsUp ? '▲' : '▼'} ${heroIsUp ? '+' : ''}${heroAsset.change.toFixed(1)}%</span>
                                <span style="font-size:8.5px; color:var(--text-secondary);">H: ${this.formatPrice(heroAsset.high || heroAsset.price * 1.01, heroAsset)}</span>
                            </div>
                        </div>
                        ${subCardsHtml}
                    </div>
                `;
            } else {
                let quadHtml = '';
                trackedAssets.forEach(asset => {
                    const isUp = asset.change >= 0;
                    const pts = this.historyCache[asset.id] || this.generateSynthetic24h(asset);
                    const chart = this.buildSmoothSvgPath(pts, 70, 16);
                    quadHtml += `
                        <div class="fin-quad-card">
                            <div class="fin-quad-top">
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <span class="fin-asset-icon">${asset.icon}</span>
                                    <span style="font-size:10px; font-weight:700; color:var(--text-primary);">${asset.symbol}</span>
                                </div>
                                <span class="fin-change-chip ${isUp ? 'up' : 'down'}" style="font-size:8.5px; padding:1px 3px;">${isUp ? '+' : ''}${asset.change.toFixed(1)}%</span>
                            </div>
                            <div class="fin-quad-price">${this.formatPrice(asset.price, asset)}</div>
                            <svg class="fin-quad-sparkline" viewBox="0 0 70 16" preserveAspectRatio="none">
                                <path d="${chart.lineD}" fill="none" stroke="${isUp ? '#10b981' : '#ef4444'}" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                        </div>
                    `;
                });
                bodyHtml = `<div class="fin-quad-grid">${quadHtml}</div>`;
            }
        }

        return `
            ${injectStyles}
            <div class="fin-w-box" id="fin-w-${id}">
                ${topBarHtml}
                ${bodyHtml}
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const box = el.querySelector(`#fin-w-${id}`);
        if (!box) return;

        // Failsafe height detection: ensure compact horizontal row on single-row heights
        try {
            const h = box.offsetHeight || box.clientHeight || 0;
            if (h > 0 && h <= 115) {
                const tri = box.querySelector('.fin-tri-container');
                if (tri) {
                    tri.style.display = 'flex';
                    tri.style.flexDirection = 'row';
                    tri.style.gap = '5px';
                    tri.querySelectorAll('.fin-tri-featured, .fin-tri-subcard').forEach(card => {
                        card.style.flex = '1';
                        card.style.minWidth = '0';
                        card.style.padding = '3px 5px';
                    });
                }
            }
        } catch (_) {}

        // Auto-fetch if data is older than 5 minutes and online
        const now = Date.now();
        const last = this.config.lastUpdate || 0;
        if (navigator.onLine && (now - last > 300000)) {
            this.fetchLiveRates().then(() => {
                this.config.lastUpdate = Date.now();
                this.updateConfig({ lastUpdate: this.config.lastUpdate }, true);
            });
        }

        // Per-asset currency toggle (USD <-> TMN)
        box.querySelectorAll('.fin-cur-toggle').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => e.stopPropagation());
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const assetId = btn.getAttribute('data-asset-id');
                if (!assetId) return;
                const map = Object.assign({}, this.config.assetCurrencies || {});
                const current = map[assetId] || this.config.baseCurrency || 'IRT';
                map[assetId] = (current === 'IRT') ? 'USD' : 'IRT';
                this.config.assetCurrencies = map;
                this.updateConfig({ assetCurrencies: map }, true);
                if (navigator.vibrate) try { navigator.vibrate(20); } catch(_) {}
            });
        });

        // Refresh button
        const refreshBtn = box.querySelector(`#fin-refresh-${id}`);
        if (refreshBtn) {
            refreshBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            refreshBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!navigator.onLine) {
                    if (window.showToast) window.showToast('You are currently offline');
                    return;
                }
                refreshBtn.classList.add('spinning');
                await this.fetchLiveRates();
                this.config.lastUpdate = Date.now();
                refreshBtn.classList.remove('spinning');
                this.updateConfig({ lastUpdate: this.config.lastUpdate }, true);
                if (navigator.vibrate) navigator.vibrate(30);
            });
        }

        // Interactive chart hover scrubbing (available in single asset focus)
        const chartWrap = box.querySelector(`#fin-chart-wrap-${id}`);
        const heroPrice = box.querySelector(`#fin-hero-price-${id}`);
        const tooltip = box.querySelector(`#fin-tooltip-${id}`);

        if (chartWrap && heroPrice) {
            let trackedIds = [];
            if (Array.isArray(this.config.assets) && this.config.assets.length > 0) {
                trackedIds = this.config.assets;
            } else {
                trackedIds = [this.config.primaryAsset || 'BTC'];
            }
            const primaryAsset = this.getAsset(trackedIds[0] || 'BTC');
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
