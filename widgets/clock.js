import { BaseWidget } from './base.js';

export default class ClockWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'clock',
            label: 'Clock & Date',
            author: 'ProGrid',
            version: '0.2.4',
            description: 'Precision digital clock with 12/24h format, worldwide timezones, and Gregorian, Jalali & Hijri calendars.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            defaultW: 2,
            defaultH: 1,
            minW: 1,
            minH: 1,
            maxW: 4,
            maxH: 2,
            defaultConfig: {
                format24: true,
                showDate: true,
                calendarType: 'gregorian',
                timezone: 'local',
                showSeconds: false,
                isGlass: true,
                bg: '#ffffff'
            }
        };
    }

    render() {
        const id = this.config.id;
        const showDate = this.config.calendarType !== 'none' && this.config.showDate !== false;
        const hasTz = this.config.timezone && this.config.timezone !== 'local';
        const tzLabelMap = {
            'Asia/Tehran': 'THR',
            'UTC': 'UTC',
            'Europe/London': 'LON',
            'America/New_York': 'NYC',
            'Asia/Tokyo': 'TYO',
            'Asia/Dubai': 'DXB'
        };
        const tzShort = hasTz ? (tzLabelMap[this.config.timezone] || this.config.timezone.split('/').pop().toUpperCase()) : '';

        const injectStyles = !document.getElementById('clock-widget-css') ? `
            <style id="clock-widget-css">
                .clock-w-container {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 8px 12px; box-sizing: border-box;
                    color: var(--text-primary);
                    user-select: none;
                    text-align: center;
                }
                .clock-w-time-row {
                    display: flex;
                    align-items: baseline;
                    justify-content: center;
                    gap: 3px;
                }
                .clock-w-time {
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    line-height: 1.1;
                    font-variant-numeric: tabular-nums;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                .clock-w-sec {
                    font-size: 14px;
                    font-weight: 600;
                    opacity: 0.65;
                    font-variant-numeric: tabular-nums;
                    margin-left: 2px;
                }
                .clock-w-date {
                    font-size: 11px;
                    font-weight: 500;
                    opacity: 0.8;
                    margin-top: 4px;
                    text-transform: capitalize;
                    letter-spacing: 0.2px;
                }
                .clock-w-ampm {
                    font-size: 11px;
                    font-weight: 700;
                    margin-left: 4px;
                    opacity: 0.7;
                    text-transform: uppercase;
                }
                .clock-w-tz-pill {
                    font-size: 9.5px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    background: rgba(59, 130, 246, 0.18);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 6px;
                    padding: 1px 5px;
                    margin-left: 5px;
                }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="clock-w-container" id="clock-container-${id}">
                <div class="clock-w-time-row">
                    <span class="clock-w-time" id="clock-time-${id}">--:--</span>
                    <span class="clock-w-sec" id="clock-sec-${id}" style="${this.config.showSeconds ? '' : 'display:none;'}">:00</span>
                    <span class="clock-w-ampm" id="clock-ampm-${id}"></span>
                    ${tzShort ? `<span class="clock-w-tz-pill">${tzShort}</span>` : ''}
                </div>
                ${showDate ? `<div class="clock-w-date" id="clock-date-${id}">---</div>` : ''}
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const timeEl = el.querySelector(`#clock-time-${id}`);
        const secEl = el.querySelector(`#clock-sec-${id}`);
        const ampmEl = el.querySelector(`#clock-ampm-${id}`);
        const dateEl = el.querySelector(`#clock-date-${id}`);

        const update = () => {
            const now = new Date();
            const tz = (this.config.timezone && this.config.timezone !== 'local') ? this.config.timezone : undefined;

            let hours, minutes, seconds;
            if (tz) {
                const dtf = new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                    hour12: false, timeZone: tz
                });
                const parts = dtf.formatToParts(now);
                parts.forEach(p => {
                    if (p.type === 'hour') hours = parseInt(p.value, 10);
                    if (p.type === 'minute') minutes = p.value.padStart(2, '0');
                    if (p.type === 'second') seconds = p.value.padStart(2, '0');
                });
            } else {
                hours = now.getHours();
                minutes = String(now.getMinutes()).padStart(2, '0');
                seconds = String(now.getSeconds()).padStart(2, '0');
            }

            let ampm = '';
            if (!this.config.format24) {
                ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
            }

            const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
            if (timeEl) timeEl.textContent = timeStr;
            if (secEl && this.config.showSeconds) {
                secEl.textContent = `:${seconds}`;
                secEl.style.display = 'inline';
            }
            if (ampmEl) ampmEl.textContent = ampm ? ` ${ampm}` : '';

            if (dateEl) {
                const cal = this.config.calendarType || 'gregorian';
                try {
                    if (cal === 'jalali') {
                        dateEl.textContent = new Intl.DateTimeFormat('fa-IR', {
                            calendar: 'persian',
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            timeZone: tz
                        }).format(now);
                    } else if (cal === 'islamic') {
                        dateEl.textContent = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            timeZone: tz
                        }).format(now);
                    } else {
                        dateEl.textContent = new Intl.DateTimeFormat('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            timeZone: tz
                        }).format(now);
                    }
                } catch {
                    dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                }
            }
        };

        update();
        this.timer = setInterval(update, 1000);
    }

    onDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

window.WidgetGlobals.register(ClockWidget);
