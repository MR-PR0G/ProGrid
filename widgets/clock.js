import { BaseWidget } from './base.js';

export default class ClockWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'clock',
            label: 'Clock & Date',
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
                isGlass: true,
                bg: '#ffffff'
            }
        };
    }

    render() {
        const id = this.config.id;
        const showDate = this.config.showDate !== false;

        const injectStyles = !document.getElementById('clock-widget-css') ? `
            <style id="clock-widget-css">
                .clock-w-container {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 8px; box-sizing: border-box;
                    color: var(--text-primary);
                    user-select: none;
                }
                .clock-w-time {
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    line-height: 1.1;
                    font-variant-numeric: tabular-nums;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                .clock-w-date {
                    font-size: 11px;
                    font-weight: 500;
                    opacity: 0.8;
                    margin-top: 4px;
                    text-transform: capitalize;
                }
                .clock-w-ampm {
                    font-size: 12px;
                    font-weight: 600;
                    margin-left: 4px;
                    opacity: 0.7;
                }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="clock-w-container" id="clock-container-${id}">
                <div class="clock-w-time" id="clock-time-${id}">--:--</div>
                ${showDate ? `<div class="clock-w-date" id="clock-date-${id}">---</div>` : ''}
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const timeEl = el.querySelector(`#clock-time-${id}`);
        const dateEl = el.querySelector(`#clock-date-${id}`);

        const update = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            let ampm = '';
            if (!this.config.format24) {
                ampm = hours >= 12 ? ' PM' : ' AM';
                hours = hours % 12 || 12;
            }

            const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
            if (timeEl) {
                timeEl.innerHTML = `${timeStr}${ampm ? `<span class="clock-w-ampm">${ampm}</span>` : ''}`;
            }

            if (dateEl) {
                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                dateEl.textContent = now.toLocaleDateString(undefined, options);
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
