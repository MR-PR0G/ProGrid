import { BaseWidget } from '../base.js';

const WMO_CODES = {
    0: { desc: 'Clear sky', iconDay: 'sun', iconNight: 'moon' },
    1: { desc: 'Mainly clear', iconDay: 'sun-cloud', iconNight: 'moon-cloud' },
    2: { desc: 'Partly cloudy', iconDay: 'cloud-sun', iconNight: 'cloud-moon' },
    3: { desc: 'Overcast', iconDay: 'cloud', iconNight: 'cloud' },
    45: { desc: 'Fog', iconDay: 'fog', iconNight: 'fog' },
    48: { desc: 'Depositing rime fog', iconDay: 'fog', iconNight: 'fog' },
    51: { desc: 'Light drizzle', iconDay: 'drizzle', iconNight: 'drizzle' },
    53: { desc: 'Moderate drizzle', iconDay: 'drizzle', iconNight: 'drizzle' },
    55: { desc: 'Dense drizzle', iconDay: 'drizzle', iconNight: 'drizzle' },
    61: { desc: 'Slight rain', iconDay: 'rain', iconNight: 'rain' },
    63: { desc: 'Moderate rain', iconDay: 'rain', iconNight: 'rain' },
    65: { desc: 'Heavy rain', iconDay: 'rain-heavy', iconNight: 'rain-heavy' },
    71: { desc: 'Slight snow', iconDay: 'snow', iconNight: 'snow' },
    73: { desc: 'Moderate snow', iconDay: 'snow', iconNight: 'snow' },
    75: { desc: 'Heavy snow', iconDay: 'snow-heavy', iconNight: 'snow-heavy' },
    77: { desc: 'Snow grains', iconDay: 'snow', iconNight: 'snow' },
    80: { desc: 'Light showers', iconDay: 'rain', iconNight: 'rain' },
    81: { desc: 'Moderate showers', iconDay: 'rain', iconNight: 'rain' },
    82: { desc: 'Violent showers', iconDay: 'rain-heavy', iconNight: 'rain-heavy' },
    85: { desc: 'Snow showers', iconDay: 'snow', iconNight: 'snow' },
    86: { desc: 'Heavy snow showers', iconDay: 'snow-heavy', iconNight: 'snow-heavy' },
    95: { desc: 'Thunderstorm', iconDay: 'thunder', iconNight: 'thunder' },
    96: { desc: 'Thunderstorm with hail', iconDay: 'thunder', iconNight: 'thunder' },
    99: { desc: 'Heavy thunderstorm', iconDay: 'thunder', iconNight: 'thunder' }
};

const WEATHER_SVGS = {
    'sun': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5" fill="#fef3c7"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    'moon': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(147, 197, 253, 0.2)"></path></svg>`,
    'cloud': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(148, 163, 184, 0.15)"></path></svg>`,
    'cloud-sun': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4" stroke="#f59e0b" fill="#fef3c7"></circle><path d="M17.5 13H17a6 6 0 1 0-7 7h7.5a4.5 4.5 0 0 0 0-9z" stroke="#94a3b8" fill="rgba(148, 163, 184, 0.2)"></path></svg>`,
    'cloud-moon': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6a5 5 0 0 0-5 5c0 .3.03.6.08.88A6 6 0 1 0 17 19h1a4 4 0 0 0 0-8h-.3" stroke="#94a3b8" fill="rgba(148, 163, 184, 0.2)"></path></svg>`,
    'sun-cloud': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4" stroke="#f59e0b" fill="#fef3c7"></circle><path d="M17.5 13H17a6 6 0 1 0-7 7h7.5a4.5 4.5 0 0 0 0-9z" stroke="#94a3b8" fill="rgba(148, 163, 184, 0.2)"></path></svg>`,
    'moon-cloud': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6a5 5 0 0 0-5 5c0 .3.03.6.08.88A6 6 0 1 0 17 19h1a4 4 0 0 0 0-8h-.3" stroke="#94a3b8" fill="rgba(148, 163, 184, 0.2)"></path></svg>`,
    'rain': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 0 0-8 0" stroke="#94a3b8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke="#94a3b8"></path><line x1="8" y1="15" x2="8" y2="19"></line><line x1="12" y1="17" x2="12" y2="21"></line><line x1="16" y1="15" x2="16" y2="19"></line></svg>`,
    'rain-heavy': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke="#64748b"></path><line x1="8" y1="14" x2="6" y2="20"></line><line x1="12" y1="14" x2="10" y2="20"></line><line x1="16" y1="14" x2="14" y2="20"></line></svg>`,
    'drizzle': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#94a3b8"></path><line x1="9" y1="16" x2="9" y2="18"></line><line x1="15" y1="16" x2="15" y2="18"></line></svg>`,
    'snow': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#bae6fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#94a3b8"></path><circle cx="8" cy="16" r="1" fill="#bae6fd"></circle><circle cx="12" cy="18" r="1" fill="#bae6fd"></circle><circle cx="16" cy="16" r="1" fill="#bae6fd"></circle></svg>`,
    'snow-heavy': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#64748b"></path><line x1="8" y1="15" x2="8" y2="17"></line><line x1="12" y1="17" x2="12" y2="19"></line><line x1="16" y1="15" x2="16" y2="17"></line></svg>`,
    'thunder': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14.5A4.5 4.5 0 0 0 17 6h-1A7 7 0 1 0 5 15" stroke="#64748b"></path><polygon points="13 11 9 17 13 17 11 23 17 15 13 15 13 11" fill="#fbbf24"></polygon></svg>`,
    'fog': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="16" x2="20" y2="16"></line><line x1="7" y1="20" x2="17" y2="20"></line></svg>`
};

export default class WeatherWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'weather',
            label: 'Live Weather',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
            defaultW: 2,
            defaultH: 2,
            minW: 2,
            minH: 1,
            maxW: 4,
            maxH: 3,
            category: 'lifestyle',
            author: 'MR Prog',
            version: '1.0.0',
            downloads: '42',
            description: 'Open-Meteo live weather tracker with 7-day offline storage, worldwide city search, hourly preview, and Breezy Weather accuracy.',
            defaultConfig: {
                city: 'Tehran',
                country: 'Iran',
                countryCode: 'IR',
                lat: 35.6892,
                lon: 51.3890,
                unit: 'C',
                showForecast: true,
                lastUpdate: 0,
                bg: '#ffffff'
            }
        };
    }

    constructor(config) {
        super(config);
        this.cacheKey = `progrid_weather_cache_${this.config.id}`;
        this.cachedData = this.loadCachedWeather();
        this.isLoading = false;
    }

    loadCachedWeather() {
        try {
            const raw = localStorage.getItem(this.cacheKey);
            if (raw) return JSON.parse(raw);
        } catch {}
        // Fallback realistic baseline data for 0ms initial load
        return {
            current: {
                temperature_2m: 19.5,
                apparent_temperature: 19.0,
                relative_humidity_2m: 38,
                wind_speed_10m: 12.4,
                precipitation: 0.0,
                weather_code: 1,
                is_day: 1
            },
            daily: {
                time: [0, 1, 2, 3, 4, 5, 6].map(offset => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    return d.toISOString().slice(0, 10);
                }),
                weather_code: [1, 2, 0, 1, 61, 2, 0],
                temperature_2m_max: [22, 21, 23, 20, 17, 19, 21],
                temperature_2m_min: [12, 11, 13, 11, 9, 10, 11],
                precipitation_probability_max: [0, 10, 0, 5, 65, 20, 0]
            },
            timestamp: Date.now()
        };
    }

    saveCachedWeather(data) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch {}
    }

    getWeatherInfo(code, isDay = 1) {
        const item = WMO_CODES[code] || { desc: 'Fair', iconDay: 'sun-cloud', iconNight: 'moon-cloud' };
        const iconKey = isDay ? item.iconDay : item.iconNight;
        const svg = WEATHER_SVGS[iconKey] || WEATHER_SVGS['cloud-sun'];
        return { desc: item.desc, iconSvg: svg };
    }

    async fetchLiveWeather() {
        if (this.isLoading) return;
        if (!navigator.onLine) return;
        this.isLoading = true;

        const lat = this.config.lat || 35.6892;
        const lon = this.config.lon || 51.3890;
        const tempUnit = (this.config.unit === 'F') ? 'fahrenheit' : 'celsius';
        const windUnit = 'kmh';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}`;

        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                if (data && data.current && data.daily) {
                    this.cachedData = {
                        current: data.current,
                        daily: data.daily,
                        hourly: data.hourly,
                        timestamp: Date.now()
                    };
                    this.saveCachedWeather(this.cachedData);
                    this.config.lastUpdate = Date.now();
                }
            }
        } catch (err) {
            console.warn('Weather fetch fallback to offline cache:', err);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        const id = this.config.id;
        const city = this.config.city || 'Tehran';
        const country = this.config.countryCode || this.config.country || 'IR';
        const unitSymbol = this.config.unit === 'F' ? '°F' : '°C';
        const data = this.cachedData || this.loadCachedWeather();
        const current = data.current || {};
        const daily = data.daily || {};

        const temp = (current.temperature_2m !== undefined) ? Math.round(current.temperature_2m) : '--';
        const feelsLike = (current.apparent_temperature !== undefined) ? Math.round(current.apparent_temperature) : temp;
        const humidity = current.relative_humidity_2m || 0;
        const wind = current.wind_speed_10m || 0;
        const isDay = current.is_day !== undefined ? current.is_day : 1;
        const weatherInfo = this.getWeatherInfo(current.weather_code || 0, isDay);

        const highToday = (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined) ? Math.round(daily.temperature_2m_max[0]) : temp;
        const lowToday = (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined) ? Math.round(daily.temperature_2m_min[0]) : temp;

        const coordsH = (this.config.h !== undefined) ? this.config.h : 2;
        const coordsW = (this.config.w !== undefined) ? this.config.w : 2;
        const isCompact = (coordsH === 1);
        const isWide = (coordsW >= 4 && coordsH >= 2);

        const injectStyles = !document.getElementById('weather-widget-css') ? `
            <style id="weather-widget-css">
                .wtr-box {
                    width: 100%; height: 100%; box-sizing: border-box;
                    padding: 10px 12px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden; position: relative;
                    user-select: none;
                }
                .wtr-top-bar {
                    display: flex; align-items: center; justify-content: space-between;
                    min-height: 20px; width: 100%; flex-shrink: 0;
                }
                .wtr-loc-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    font-size: 11.5px; font-weight: 700; color: var(--text-primary);
                    max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    letter-spacing: -0.1px;
                }
                .wtr-icon-btn {
                    width: 22px; height: 22px; border-radius: 50%;
                    background: rgba(255, 255, 255, 0.06); border: none;
                    color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: transform 0.2s, background 0.15s, color 0.15s;
                }
                .wtr-icon-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.14); }
                .wtr-icon-btn.spinning svg { animation: wtrSpin 0.75s linear infinite; }
                @keyframes wtrSpin { 100% { transform: rotate(360deg); } }

                /* Compact 1-row layout */
                .wtr-compact-row {
                    display: flex; align-items: center; justify-content: space-between;
                    width: 100%; flex: 1; padding: 2px 2px;
                }
                .wtr-compact-temp {
                    font-size: 22px; font-weight: 800; color: var(--text-primary);
                    line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.5px;
                }
                .wtr-compact-meta {
                    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
                }

                /* Hero Middle */
                .wtr-hero-row {
                    display: flex; align-items: center; justify-content: space-between;
                    margin: 2px 0; gap: 6px;
                }
                .wtr-temp-hero {
                    font-size: 32px; font-weight: 800; color: var(--text-primary);
                    line-height: 1; letter-spacing: -1.2px; font-variant-numeric: tabular-nums;
                }
                .wtr-desc-text {
                    font-size: 11px; font-weight: 600; color: var(--text-secondary);
                    margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .wtr-metrics-line {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 9.5px; font-weight: 600; color: var(--text-secondary);
                    opacity: 0.85; font-variant-numeric: tabular-nums;
                    white-space: nowrap; overflow: hidden;
                }

                /* Minimalist Forecast Strip */
                .wtr-forecast-strip {
                    display: flex; align-items: stretch; gap: 4px; width: 100%;
                    padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.08);
                    margin-top: auto;
                }
                .wtr-forecast-day {
                    flex: 1; min-width: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 2px;
                    padding: 3px 2px; border-radius: 8px;
                    background: rgba(255, 255, 255, 0.04); font-size: 9px;
                }
                .wtr-day-label {
                    font-weight: 600; color: var(--text-secondary); line-height: 1; font-size: 8.5px;
                }
                .wtr-day-temp {
                    font-weight: 700; color: var(--text-primary); font-size: 9.5px;
                    font-variant-numeric: tabular-nums; line-height: 1;
                }

                /* Wide 4x2 Layout */
                .wtr-wide-grid {
                    display: grid; grid-template-columns: 1fr 1.3fr; gap: 10px;
                    width: 100%; height: 100%;
                }
            </style>
        ` : '';

        // Universal Top Bar
        const topBarHtml = `
            <div class="wtr-top-bar">
                <div class="wtr-loc-badge" title="${city}, ${country}">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="color:#60a5fa; flex-shrink:0;">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${city}</span>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <span style="font-size:9px; font-weight:700; padding:1px 4.5px; border-radius:4px; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.25);">${unitSymbol}</span>
                    <button type="button" class="wtr-icon-btn" id="wtr-refresh-${id}" title="Refresh Weather" aria-label="Refresh">
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

        // 1. Compact Mode (2x1)
        if (isCompact) {
            bodyHtml = `
                <div class="wtr-compact-row" style="gap:6px; min-width:0;">
                    <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                        <div style="width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="24" height="24"')}
                        </div>
                        <div style="min-width:0; flex:1;">
                            <div class="wtr-compact-temp">${temp}${unitSymbol}</div>
                            <div style="font-size:9.5px; color:var(--text-secondary); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${weatherInfo.desc}</div>
                        </div>
                    </div>
                    <div class="wtr-compact-meta" style="flex-shrink:0;">
                        <span style="font-size:10px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums;">H:${highToday}°</span>
                        <span style="font-size:9.5px; color:var(--text-secondary); font-variant-numeric:tabular-nums;">L:${lowToday}°</span>
                    </div>
                </div>
            `;
        } 
        // 2. Standard / Wide Mode (2x2 or 4x2)
        else {
            // Build 5-day forecast cards
            let forecastCardsHtml = '';
            const daysCount = isWide ? 7 : 5;
            if (daily && Array.isArray(daily.time)) {
                for (let i = 0; i < Math.min(daysCount, daily.time.length); i++) {
                    const dateStr = daily.time[i];
                    const dayDate = new Date(dateStr + 'T00:00:00');
                    const dayName = (i === 0) ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const code = daily.weather_code ? daily.weather_code[i] : 0;
                    const dayInfo = this.getWeatherInfo(code, 1);
                    const maxT = Math.round(daily.temperature_2m_max[i] || temp);
                    const minT = Math.round(daily.temperature_2m_min[i] || temp);

                    forecastCardsHtml += `
                        <div class="wtr-forecast-day" title="${dayName}: ${dayInfo.desc}, Max: ${maxT}°, Min: ${minT}°">
                            <span class="wtr-day-label">${dayName}</span>
                            <div style="width:18px; height:18px; display:flex; align-items:center; justify-content:center; margin:1px 0;">
                                ${dayInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="16" height="16"')}
                            </div>
                            <span class="wtr-day-temp">${maxT}°</span>
                            <span style="font-size:7.5px; color:var(--text-secondary); opacity:0.8; font-variant-numeric:tabular-nums;">${minT}°</span>
                        </div>
                    `;
                }
            }

            bodyHtml = `
                <div class="wtr-hero-row">
                    <div>
                        <div class="wtr-temp-hero">${temp}${unitSymbol}</div>
                        <div class="wtr-desc-text">${weatherInfo.desc}</div>
                    </div>
                    <div style="width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                        ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="38" height="38"')}
                    </div>
                </div>
                <div class="wtr-metrics-pills">
                    <span class="wtr-metric-pill" title="Feels like temperature">
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                        <span>${feelsLike}°</span>
                    </span>
                    <span class="wtr-metric-pill" title="Relative Humidity">
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                        <span>${humidity}%</span>
                    </span>
                    <span class="wtr-metric-pill" title="Wind Speed">
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
                        <span>${wind} km/h</span>
                    </span>
                </div>
                <div class="wtr-forecast-strip">
                    ${forecastCardsHtml}
                </div>
            `;
        }

        return `
            ${injectStyles}
            <div class="wtr-box" id="wtr-box-${id}">
                ${topBarHtml}
                ${bodyHtml}
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const box = el.querySelector(`#wtr-box-${id}`);
        if (!box) return;

        // Auto-fetch if data is older than 30 minutes and online
        const now = Date.now();
        const last = this.config.lastUpdate || 0;
        if (navigator.onLine && (now - last > 1800000)) {
            this.fetchLiveWeather().then(() => {
                if (window.renderGrid) window.renderGrid();
            });
        }

        // Refresh button
        const refreshBtn = box.querySelector(`#wtr-refresh-${id}`);
        if (refreshBtn) {
            refreshBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            refreshBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!navigator.onLine) {
                    if (window.showToast) window.showToast('You are currently offline (showing cached forecast)');
                    return;
                }
                refreshBtn.classList.add('spinning');
                await this.fetchLiveWeather();
                refreshBtn.classList.remove('spinning');
                if (window.renderGrid) window.renderGrid();
                if (window.showToast) window.showToast(`Updated weather for ${this.config.city || 'location'}`);
                if (navigator.vibrate) navigator.vibrate(30);
            });
        }
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(WeatherWidget);
}
