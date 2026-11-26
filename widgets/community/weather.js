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
            version: '1.1.0',
            downloads: '42',
            description: 'Open-Meteo live weather tracker with interactive details popup, 7-day offline storage, hourly preview, and high accuracy.',
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
                    padding: 7px 9px; display: flex; flex-direction: column;
                    justify-content: space-between; overflow: hidden; position: relative;
                    user-select: none; min-height: 0; min-width: 0;
                }
                .wtr-top-bar {
                    display: flex; align-items: center; justify-content: space-between;
                    min-height: 18px; height: 18px; width: 100%; flex-shrink: 0;
                    margin-bottom: 2px;
                }
                .wtr-loc-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    font-size: 11px; font-weight: 700; color: var(--text-primary);
                    max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    letter-spacing: -0.1px;
                }
                .wtr-unit-badge {
                    font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 4px;
                    background: rgba(59, 130, 246, 0.15); color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.25); line-height: 1.2;
                }
                .wtr-icon-btn {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: rgba(255, 255, 255, 0.06); border: none;
                    color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: transform 0.2s, background 0.15s, color 0.15s;
                    flex-shrink: 0;
                }
                .wtr-icon-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.14); }
                .wtr-icon-btn.spinning svg { animation: wtrSpin 0.75s linear infinite; }
                @keyframes wtrSpin { 100% { transform: rotate(360deg); } }

                /* Compact 1-row layout */
                .wtr-compact-row {
                    display: flex; align-items: center; justify-content: space-between;
                    width: 100%; flex: 1; gap: 6px; min-width: 0; overflow: hidden;
                }
                .wtr-compact-temp {
                    font-size: 20px; font-weight: 800; color: var(--text-primary);
                    line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.5px;
                }
                .wtr-compact-meta {
                    display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0;
                }

                /* Hero Row in 2x2 */
                .wtr-hero-row {
                    display: flex; align-items: center; justify-content: space-between;
                    margin: 1px 0; gap: 4px; min-height: 0; flex-shrink: 0;
                }
                .wtr-hero-left {
                    display: flex; flex-direction: column; min-width: 0; flex: 1;
                }
                .wtr-temp-hero {
                    font-size: 26px; font-weight: 800; color: var(--text-primary);
                    line-height: 1; letter-spacing: -0.8px; font-variant-numeric: tabular-nums;
                }
                .wtr-desc-text {
                    font-size: 10px; font-weight: 600; color: var(--text-secondary);
                    margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .wtr-hl-text {
                    font-size: 9px; font-weight: 700; color: var(--text-secondary);
                    opacity: 0.85; margin-top: 1px; font-variant-numeric: tabular-nums;
                    white-space: nowrap;
                }
                .wtr-hero-icon {
                    width: 32px; height: 32px; display: flex; align-items: center;
                    justify-content: center; flex-shrink: 0;
                }

                /* Metrics Pills */
                .wtr-metrics-pills {
                    display: flex; align-items: center; gap: 3px; width: 100%;
                    margin: 2px 0; flex-shrink: 0; overflow: hidden;
                }
                .wtr-metric-pill {
                    flex: 1; min-width: 0; display: inline-flex; align-items: center;
                    justify-content: center; gap: 3px; padding: 2px 3px;
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.07); color: var(--text-secondary);
                    font-size: 8.5px; font-weight: 600; white-space: nowrap;
                    text-overflow: ellipsis; overflow: hidden; font-variant-numeric: tabular-nums;
                    line-height: 1.2;
                }
                .wtr-metric-pill svg { flex-shrink: 0; opacity: 0.8; }
                .wtr-metric-pill span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                /* Minimalist Forecast Strip in 2x2 */
                .wtr-forecast-strip {
                    display: flex; align-items: stretch; gap: 2.5px; width: 100%;
                    padding-top: 3px; border-top: 1px solid rgba(255, 255, 255, 0.07);
                    margin-top: auto; flex-shrink: 0; overflow: hidden;
                }
                .wtr-forecast-day {
                    flex: 1; min-width: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 1px;
                    padding: 2px 1px; border-radius: 6px;
                    background: rgba(255, 255, 255, 0.035); overflow: hidden;
                }
                .wtr-day-label {
                    font-weight: 600; color: var(--text-secondary); line-height: 1; font-size: 8px;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
                }
                .wtr-day-icon {
                    width: 14px; height: 14px; display: flex; align-items: center;
                    justify-content: center; margin: 1px 0; flex-shrink: 0;
                }
                .wtr-day-temp {
                    font-weight: 700; color: var(--text-primary); font-size: 9px;
                    font-variant-numeric: tabular-nums; line-height: 1;
                }
                .wtr-day-low {
                    font-size: 7.5px; color: var(--text-secondary); opacity: 0.75;
                    font-variant-numeric: tabular-nums; line-height: 1;
                }

                /* Wide 4x2 Dashboard Layout */
                .wtr-wide-dashboard {
                    display: grid; grid-template-columns: minmax(130px, 1fr) 1.55fr;
                    gap: 8px; width: 100%; height: calc(100% - 22px);
                    min-height: 0; overflow: hidden;
                }
                .wtr-wide-left {
                    display: flex; flex-direction: column; justify-content: space-between;
                    min-width: 0; height: 100%;
                }
                .wtr-wide-hero {
                    display: flex; align-items: center; gap: 8px; min-width: 0;
                }
                .wtr-wide-icon-box {
                    width: 42px; height: 42px; display: flex; align-items: center;
                    justify-content: center; flex-shrink: 0; border-radius: 10px;
                    background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07);
                }
                .wtr-wide-temp {
                    font-size: 32px; font-weight: 800; color: var(--text-primary);
                    line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums;
                }
                .wtr-wide-right {
                    display: flex; flex-direction: column; justify-content: space-between;
                    min-width: 0; height: 100%; background: rgba(0, 0, 0, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px;
                    padding: 5px 6px; overflow: hidden;
                }
                .wtr-wide-right-head {
                    display: flex; align-items: center; justify-content: space-between;
                    padding-bottom: 3px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    margin-bottom: 3px; font-size: 9px; font-weight: 700;
                    color: var(--text-secondary); letter-spacing: 0.3px; text-transform: uppercase;
                }
                .wtr-wide-forecast-row {
                    display: flex; align-items: stretch; gap: 3px; width: 100%;
                    flex: 1; min-height: 0;
                }
                .wtr-wide-day-card {
                    flex: 1; min-width: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: space-around;
                    padding: 3px 1px; border-radius: 6px;
                    background: rgba(255, 255, 255, 0.035); overflow: hidden;
                }

                /* Weather Detail Interactive Modal */
                .wtr-modal-overlay {
                    position: fixed; inset: 0; z-index: 99999;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(10, 15, 29, 0.72);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    padding: 16px; box-sizing: border-box;
                    animation: wtrFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes wtrFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .wtr-modal-sheet {
                    width: 100%; max-width: 440px; max-height: 88vh;
                    background: rgba(20, 25, 42, 0.94);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 22px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                    color: var(--text-primary, #f8fafc);
                    display: flex; flex-direction: column;
                    overflow-y: auto; overflow-x: hidden;
                    user-select: none;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .wtr-modal-sheet::-webkit-scrollbar { width: 4px; }
                .wtr-modal-sheet::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15); border-radius: 4px;
                }
                .wtr-modal-head {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 18px 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    position: sticky; top: 0; background: rgba(20, 25, 42, 0.96);
                    backdrop-filter: blur(12px); z-index: 2;
                }
                .wtr-modal-hero {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .wtr-modal-hero-left {
                    display: flex; flex-direction: column; gap: 2px;
                }
                .wtr-modal-temp-huge {
                    font-size: 38px; font-weight: 800; color: #fff;
                    line-height: 1; letter-spacing: -1.5px; font-variant-numeric: tabular-nums;
                }
                .wtr-modal-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
                    padding: 14px 18px;
                }
                .wtr-modal-grid-card {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    border-radius: 12px; padding: 10px 12px;
                    display: flex; flex-direction: column; gap: 4px;
                }
                .wtr-modal-hourly-sec {
                    padding: 12px 18px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .wtr-modal-track {
                    display: flex; align-items: stretch; gap: 8px;
                    overflow-x: auto; padding-bottom: 6px; margin-top: 8px;
                    scrollbar-width: none;
                }
                .wtr-modal-track::-webkit-scrollbar { display: none; }
                .wtr-modal-hour-pill {
                    flex-shrink: 0; min-width: 52px; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 4px;
                    padding: 8px 6px; border-radius: 10px;
                    background: rgba(255, 255, 255, 0.035);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                }
                .wtr-modal-daily-sec {
                    padding: 12px 18px 18px 18px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .wtr-modal-daily-item {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 7px 10px; border-radius: 9px;
                    background: rgba(255, 255, 255, 0.025);
                    margin-bottom: 5px; font-size: 11.5px;
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
                <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;">
                    <span class="wtr-unit-badge">${unitSymbol}</span>
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

        // 1. Compact Mode (2x1, 3x1, 4x1)
        if (isCompact) {
            bodyHtml = `
                <div class="wtr-compact-row">
                    <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                        <div style="width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="24" height="24"')}
                        </div>
                        <div style="min-width:0; flex:1;">
                            <div class="wtr-compact-temp">${temp}${unitSymbol}</div>
                            <div style="font-size:9.5px; color:var(--text-secondary); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${weatherInfo.desc}</div>
                        </div>
                    </div>
                    <div class="wtr-compact-meta">
                        <span style="font-size:10px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums;">H:${highToday}°</span>
                        <span style="font-size:9px; color:var(--text-secondary); font-variant-numeric:tabular-nums;">L:${lowToday}°</span>
                    </div>
                </div>
            `;
        } 
        // 2. Wide Dashboard Mode (4x2 or larger wide layout)
        else if (isWide) {
            let wideForecastHtml = '';
            if (daily && Array.isArray(daily.time)) {
                const count = Math.min(7, daily.time.length);
                for (let i = 0; i < count; i++) {
                    const dateStr = daily.time[i];
                    const dayDate = new Date(dateStr + 'T00:00:00');
                    const dayName = (i === 0) ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const code = daily.weather_code ? daily.weather_code[i] : 0;
                    const dayInfo = this.getWeatherInfo(code, 1);
                    const maxT = Math.round(daily.temperature_2m_max[i] || temp);
                    const minT = Math.round(daily.temperature_2m_min[i] || temp);

                    wideForecastHtml += `
                        <div class="wtr-wide-day-card" title="${dayName}: ${dayInfo.desc}, High: ${maxT}°, Low: ${minT}°">
                            <span class="wtr-day-label">${dayName}</span>
                            <div class="wtr-day-icon">
                                ${dayInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="15" height="15"')}
                            </div>
                            <span class="wtr-day-temp">${maxT}°</span>
                            <span class="wtr-day-low">${minT}°</span>
                        </div>
                    `;
                }
            }

            bodyHtml = `
                <div class="wtr-wide-dashboard">
                    <div class="wtr-wide-left">
                        <div class="wtr-wide-hero">
                            <div class="wtr-wide-icon-box">
                                ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="30" height="30"')}
                            </div>
                            <div style="min-width:0; flex:1;">
                                <div class="wtr-wide-temp">${temp}${unitSymbol}</div>
                                <div class="wtr-desc-text" style="font-size:11px;">${weatherInfo.desc}</div>
                                <div class="wtr-hl-text">H: ${highToday}° • L: ${lowToday}°</div>
                            </div>
                        </div>
                        <div class="wtr-metrics-pills">
                            <span class="wtr-metric-pill" title="Feels like">
                                <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                                <span>${feelsLike}°</span>
                            </span>
                            <span class="wtr-metric-pill" title="Humidity">
                                <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                                <span>${humidity}%</span>
                            </span>
                            <span class="wtr-metric-pill" title="Wind">
                                <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
                                <span>${wind} km/h</span>
                            </span>
                        </div>
                    </div>
                    <div class="wtr-wide-right">
                        <div class="wtr-wide-right-head">
                            <span>7-Day Outlook</span>
                            <span style="opacity:0.75; font-size:8px;">Forecast</span>
                        </div>
                        <div class="wtr-wide-forecast-row">
                            ${wideForecastHtml}
                        </div>
                    </div>
                </div>
            `;
        }
        // 3. Standard Medium Mode (2x2, 3x2)
        else {
            let forecastCardsHtml = '';
            // In 2x2, 4 days fit perfectly without any horizontal cramping or text clipping
            const daysCount = (coordsW >= 3) ? 5 : 4;
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
                            <div class="wtr-day-icon">
                                ${dayInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="14" height="14"')}
                            </div>
                            <span class="wtr-day-temp">${maxT}°</span>
                            <span class="wtr-day-low">${minT}°</span>
                        </div>
                    `;
                }
            }

            bodyHtml = `
                <div class="wtr-hero-row">
                    <div class="wtr-hero-left">
                        <div class="wtr-temp-hero">${temp}${unitSymbol}</div>
                        <div class="wtr-desc-text">${weatherInfo.desc}</div>
                        <div class="wtr-hl-text">H: ${highToday}° • L: ${lowToday}°</div>
                    </div>
                    <div class="wtr-hero-icon">
                        ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="32" height="32"')}
                    </div>
                </div>
                <div class="wtr-metrics-pills">
                    <span class="wtr-metric-pill" title="Feels like temperature">
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                        <span>${feelsLike}°</span>
                    </span>
                    <span class="wtr-metric-pill" title="Relative Humidity">
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                        <span>${humidity}%</span>
                    </span>
                    <span class="wtr-metric-pill" title="Wind Speed">
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
                        <span>${wind}k</span>
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

        // Tap/click on widget to open interactive details popup modal (especially valuable for 2x1 & 2x2)
        box.style.cursor = 'pointer';
        let pointerDownPos = null;
        box.addEventListener('pointerdown', (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });
        box.addEventListener('click', (e) => {
            if (e.target.closest(`#wtr-refresh-${id}`)) return;
            if (document.body.classList.contains('edit-mode') || window.isEditMode) return;
            // Prevent accidental opening when dragging
            if (pointerDownPos) {
                const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
                if (dist > 8) return;
            }
            this.openDetailModal();
        });

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

    openDetailModal() {
        const existing = document.getElementById('wtr-detail-modal');
        if (existing) existing.remove();

        const city = this.config.city || 'Tehran';
        const country = this.config.country || this.config.countryCode || 'Iran';
        const unitSymbol = this.config.unit === 'F' ? '°F' : '°C';
        const data = this.cachedData || this.loadCachedWeather();
        const current = data.current || {};
        const daily = data.daily || {};
        const hourly = data.hourly || null;

        const temp = (current.temperature_2m !== undefined) ? Math.round(current.temperature_2m) : '--';
        const feelsLike = (current.apparent_temperature !== undefined) ? Math.round(current.apparent_temperature) : temp;
        const humidity = current.relative_humidity_2m || 0;
        const wind = current.wind_speed_10m || 0;
        const precip = current.precipitation !== undefined ? current.precipitation : 0.0;
        const isDay = current.is_day !== undefined ? current.is_day : 1;
        const weatherInfo = this.getWeatherInfo(current.weather_code || 0, isDay);

        const highToday = (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined) ? Math.round(daily.temperature_2m_max[0]) : temp;
        const lowToday = (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined) ? Math.round(daily.temperature_2m_min[0]) : temp;

        // Build 24-hour hourly track
        let hourlyPills = '';
        if (hourly && Array.isArray(hourly.time) && hourly.time.length > 0) {
            const nowIsoHour = new Date().toISOString().slice(0, 13);
            let startIdx = hourly.time.findIndex(t => t.startsWith(nowIsoHour));
            if (startIdx === -1) startIdx = 0;
            const count = Math.min(24, hourly.time.length - startIdx);
            for (let i = startIdx; i < startIdx + count; i++) {
                const tStr = hourly.time[i];
                const hourNum = parseInt(tStr.split('T')[1].split(':')[0], 10);
                const isNow = (i === startIdx);
                const label = isNow ? 'Now' : `${hourNum}:00`;
                const code = hourly.weather_code ? hourly.weather_code[i] : 0;
                const isD = (hourNum >= 6 && hourNum < 18) ? 1 : 0;
                const info = this.getWeatherInfo(code, isD);
                const tVal = Math.round(hourly.temperature_2m[i] || temp);

                hourlyPills += `
                    <div class="wtr-modal-hour-pill" style="${isNow ? 'background:rgba(59,130,246,0.18); border-color:rgba(59,130,246,0.35);' : ''}">
                        <span style="font-size:10px; font-weight:600; color:${isNow ? '#60a5fa' : '#94a3b8'};">${label}</span>
                        <div style="width:20px; height:20px; display:flex; align-items:center; justify-content:center;">
                            ${info.iconSvg.replace(/width="\d+" height="\d+"/, 'width="18" height="18"')}
                        </div>
                        <span style="font-size:11px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${tVal}°</span>
                    </div>
                `;
            }
        } else {
            // Synthetic 12h preview when hourly is not in cache yet
            for (let h = 0; h < 12; h++) {
                const hourTime = new Date(Date.now() + h * 3600000);
                const hourNum = hourTime.getHours();
                const label = (h === 0) ? 'Now' : `${hourNum}:00`;
                const approxT = Math.round(temp + Math.sin(h / 3) * 2);
                hourlyPills += `
                    <div class="wtr-modal-hour-pill" style="${h === 0 ? 'background:rgba(59,130,246,0.18); border-color:rgba(59,130,246,0.35);' : ''}">
                        <span style="font-size:10px; font-weight:600; color:${h === 0 ? '#60a5fa' : '#94a3b8'};">${label}</span>
                        <div style="width:20px; height:20px; display:flex; align-items:center; justify-content:center;">
                            ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="18" height="18"')}
                        </div>
                        <span style="font-size:11px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${approxT}°</span>
                    </div>
                `;
            }
        }

        // Build 7-day daily forecast list
        let dailyItems = '';
        if (daily && Array.isArray(daily.time)) {
            for (let i = 0; i < Math.min(7, daily.time.length); i++) {
                const dateStr = daily.time[i];
                const dayDate = new Date(dateStr + 'T00:00:00');
                const dayName = (i === 0) ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const code = daily.weather_code ? daily.weather_code[i] : 0;
                const dayInfo = this.getWeatherInfo(code, 1);
                const maxT = Math.round(daily.temperature_2m_max[i] || temp);
                const minT = Math.round(daily.temperature_2m_min[i] || temp);
                const prob = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

                dailyItems += `
                    <div class="wtr-modal-daily-item">
                        <div style="display:flex; align-items:center; gap:8px; min-width:115px;">
                            <div style="width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
                                ${dayInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="20" height="20"')}
                            </div>
                            <span style="font-weight:700; color:#fff;">${dayName}</span>
                        </div>
                        <span style="color:#94a3b8; font-size:11px; flex:1; text-align:left; padding:0 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${dayInfo.desc}</span>
                        <div style="display:flex; align-items:center; gap:8px; font-variant-numeric:tabular-nums;">
                            ${prob > 15 ? `<span style="font-size:9.5px; color:#60a5fa; font-weight:600;">💧${prob}%</span>` : ''}
                            <span style="font-weight:700; color:#fff; font-size:12px;">${maxT}°</span>
                            <span style="color:#64748b; font-size:11px;">${minT}°</span>
                        </div>
                    </div>
                `;
            }
        }

        const modal = document.createElement('div');
        modal.id = 'wtr-detail-modal';
        modal.innerHTML = `
            <div class="wtr-modal-overlay">
                <div class="wtr-modal-sheet">
                    <!-- Modal Header -->
                    <div class="wtr-modal-head">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#60a5fa" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span style="font-size:14px; font-weight:700; letter-spacing:-0.2px;">${city}, ${country}</span>
                            <span class="wtr-unit-badge" style="margin-left:4px;">${unitSymbol}</span>
                        </div>
                        <button type="button" class="wtr-modal-close" style="background:rgba(255,255,255,0.08); border:none; color:#94a3b8; width:26px; height:26px; border-radius:50%; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s, color 0.15s;">✕</button>
                    </div>

                    <!-- Hero Section -->
                    <div class="wtr-modal-hero">
                        <div class="wtr-modal-hero-left">
                            <div class="wtr-modal-temp-huge">${temp}${unitSymbol}</div>
                            <div style="font-size:13px; font-weight:600; color:#cbd5e1; margin-top:2px;">${weatherInfo.desc}</div>
                            <div style="font-size:11px; font-weight:600; color:#94a3b8; margin-top:1px;">High: ${highToday}° • Low: ${lowToday}°</div>
                        </div>
                        <div style="width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);">
                            ${weatherInfo.iconSvg.replace(/width="\d+" height="\d+"/, 'width="42" height="42"')}
                        </div>
                    </div>

                    <!-- 4-Card Detailed Metrics Grid -->
                    <div class="wtr-modal-grid">
                        <div class="wtr-modal-grid-card">
                            <div style="display:flex; align-items:center; gap:5px; color:#94a3b8; font-size:10px; font-weight:600; text-transform:uppercase;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                                <span>Feels Like</span>
                            </div>
                            <div style="font-size:15px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${feelsLike}${unitSymbol}</div>
                        </div>
                        <div class="wtr-modal-grid-card">
                            <div style="display:flex; align-items:center; gap:5px; color:#94a3b8; font-size:10px; font-weight:600; text-transform:uppercase;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                                <span>Humidity</span>
                            </div>
                            <div style="font-size:15px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${humidity}%</div>
                        </div>
                        <div class="wtr-modal-grid-card">
                            <div style="display:flex; align-items:center; gap:5px; color:#94a3b8; font-size:10px; font-weight:600; text-transform:uppercase;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
                                <span>Wind Speed</span>
                            </div>
                            <div style="font-size:15px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${wind} km/h</div>
                        </div>
                        <div class="wtr-modal-grid-card">
                            <div style="display:flex; align-items:center; gap:5px; color:#94a3b8; font-size:10px; font-weight:600; text-transform:uppercase;">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>
                                <span>Precipitation</span>
                            </div>
                            <div style="font-size:15px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${precip} mm</div>
                        </div>
                    </div>

                    <!-- 24-Hour Hourly Timeline -->
                    <div class="wtr-modal-hourly-sec">
                        <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.4px;">
                            24-Hour Hourly Forecast
                        </div>
                        <div class="wtr-modal-track">
                            ${hourlyPills}
                        </div>
                    </div>

                    <!-- 7-Day Outlook -->
                    <div class="wtr-modal-daily-sec">
                        <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:8px;">
                            7-Day Extended Forecast
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            ${dailyItems}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding:10px 18px 16px 18px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.06); font-size:10px; color:#64748b;">
                        <span>Open-Meteo High-Resolution Model</span>
                        <button type="button" class="wtr-modal-done" style="padding:6px 14px; border-radius:8px; background:rgba(255,255,255,0.08); color:#f8fafc; font-size:11px; font-weight:600; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">Close</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => {
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.15s ease';
            setTimeout(() => modal.remove(), 150);
            document.removeEventListener('keydown', handleKey);
        };

        const handleKey = (e) => {
            if (e.key === 'Escape') closeModal();
        };

        modal.querySelector('.wtr-modal-close').addEventListener('click', closeModal);
        modal.querySelector('.wtr-modal-done').addEventListener('click', closeModal);
        modal.querySelector('.wtr-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        document.addEventListener('keydown', handleKey);
        document.body.appendChild(modal);
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(WeatherWidget);
}
