import { BaseWidget } from '../base.js';

export default class PomodoroWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'pomodoro',
            label: 'Pomodoro Timer',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            defaultW: 2, defaultH: 1,
            minW: 2, minH: 1, maxW: 3, maxH: 2,
            category: 'productivity',
            author: 'FocusLab',
            version: '1.2.0',
            downloads: '5.1k',
            description: '25-minute focus session timer with audio chime and pause controls.',
            defaultConfig: { timeLeft: 1500, isRunning: false, isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const id = this.config.id;
        const totalSec = this.config.timeLeft !== undefined ? this.config.timeLeft : 1500;
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        const isRunning = this.config.isRunning || false;

        return `
            <div class="pomodoro-widget-box" id="pomo-${id}" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; box-sizing: border-box; user-select: none;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 10px; font-weight: 700; color: #f87171; text-transform: uppercase; letter-spacing: 0.8px;">Focus Session</span>
                    <span class="pomo-time" style="font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; line-height: 1.1;">${timeStr}</span>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="pomo-toggle-btn" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: ${isRunning ? '#ef4444' : '#3b82f6'}; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s;">
                        ${isRunning ? '❚❚' : '▶'}
                    </button>
                    <button class="pomo-reset-btn" style="width: 28px; height: 28px; border-radius: 50%; border: none; background: rgba(255,255,255,0.08); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 11px; cursor: pointer;">
                        ↺
                    </button>
                </div>
            </div>
        `;
    }

    postRender(el) {
        const box = el.querySelector(`#pomo-${this.config.id}`);
        if (!box) return;

        const timeEl = box.querySelector('.pomo-time');
        const toggleBtn = box.querySelector('.pomo-toggle-btn');
        const resetBtn = box.querySelector('.pomo-reset-btn');

        if (this._interval) clearInterval(this._interval);

        const format = (sec) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const tick = () => {
            if (this.config.timeLeft > 0) {
                this.config.timeLeft -= 1;
                if (timeEl) timeEl.textContent = format(this.config.timeLeft);
            } else {
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '▶';
                    toggleBtn.style.background = '#3b82f6';
                }
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        };

        if (this.config.isRunning) {
            this._interval = setInterval(tick, 1000);
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(20);
                this.config.isRunning = !this.config.isRunning;
                if (this.config.isRunning) {
                    toggleBtn.innerHTML = '❚❚';
                    toggleBtn.style.background = '#ef4444';
                    this._interval = setInterval(tick, 1000);
                } else {
                    toggleBtn.innerHTML = '▶';
                    toggleBtn.style.background = '#3b82f6';
                    if (this._interval) clearInterval(this._interval);
                }
                this.updateConfig({ isRunning: this.config.isRunning, timeLeft: this.config.timeLeft });
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this._interval) clearInterval(this._interval);
                this.config.isRunning = false;
                this.config.timeLeft = 1500;
                if (timeEl) timeEl.textContent = '25:00';
                if (toggleBtn) {
                    toggleBtn.innerHTML = '▶';
                    toggleBtn.style.background = '#3b82f6';
                }
                this.updateConfig({ isRunning: false, timeLeft: 1500 });
            });
        }
    }

    onDestroy() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(PomodoroWidget);
}
