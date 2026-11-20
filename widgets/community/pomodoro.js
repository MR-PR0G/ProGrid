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
            author: 'ProGrid',
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
            <div class="pomodoro-widget-box" id="pomo-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 12px 14px; box-sizing: border-box; user-select: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="width: 16px; height: 16px; border-radius: 50%; background: ${isRunning ? '#ef4444' : '#3b82f6'}; display: flex; align-items: center; justify-content: center; opacity: 0.85;">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>
                        </span>
                        <span style="font-size: 11px; font-weight: 700; color: ${isRunning ? '#f87171' : 'var(--text-secondary)'}; text-transform: uppercase; letter-spacing: 0.7px;">${isRunning ? 'Focusing' : 'Focus Session'}</span>
                    </div>
                    <span style="font-size: 10px; font-weight: 600; color: var(--text-secondary); background: rgba(255,255,255,0.06); padding: 1.5px 6px; border-radius: 8px;">25m</span>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0;">
                    <span class="pomo-time" style="font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; line-height: 1; font-variant-numeric: tabular-nums;">${timeStr}</span>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="pomo-toggle-btn" style="width: 34px; height: 34px; border-radius: 50%; border: none; background: ${isRunning ? '#ef4444' : '#3b82f6'}; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.12s, background 0.15s;" title="${isRunning ? 'Pause' : 'Start'}">
                            ${isRunning ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>` : `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`}
                        </button>
                        <button class="pomo-reset-btn" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--panel-border); background: rgba(255,255,255,0.06); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity 0.15s;" title="Reset Timer">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                        </button>
                    </div>
                </div>

                <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
                    <div class="pomo-progress" style="width: ${Math.round(((1500 - totalSec) / 1500) * 100)}%; height: 100%; background: ${isRunning ? '#ef4444' : '#3b82f6'}; border-radius: 2px; transition: width 0.3s ease;"></div>
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
                const prog = box.querySelector('.pomo-progress');
                if (prog) prog.style.width = `${Math.round(((1500 - this.config.timeLeft) / 1500) * 100)}%`;
            } else {
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#3b82f6';
                }
                const prog = box.querySelector('.pomo-progress');
                if (prog) prog.style.width = '100%';
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
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                    toggleBtn.style.background = '#ef4444';
                    this._interval = setInterval(tick, 1000);
                } else {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
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
                const prog = box.querySelector('.pomo-progress');
                if (prog) prog.style.width = '0%';
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
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
