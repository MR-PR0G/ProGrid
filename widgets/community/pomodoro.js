import { BaseWidget } from '../base.js';

function playChimeAlert() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
        console.warn('Audio alert unavailable:', e);
    }
}

export default class PomodoroWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'pomodoro',
            label: 'Focus & Timer',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 2, minH: 1, maxW: 3, maxH: 2,
            category: 'productivity',
            author: 'MR Prog',
            version: '1.4.0',
            downloads: '6.8k',
            description: 'Engineered focus sessions and countdown timer with chime notification and custom durations.',
            defaultConfig: { targetMinutes: 25, timeLeft: 1500, isRunning: false, bg: '#ffffff' }
        };
    }

    render() {
        const id = this.config.id;
        const targetMin = this.config.targetMinutes || 25;
        const totalSec = this.config.timeLeft !== undefined ? this.config.timeLeft : (targetMin * 60);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        const isRunning = !!this.config.isRunning;
        const maxSec = targetMin * 60;
        const percent = Math.min(100, Math.max(0, Math.round(((maxSec - totalSec) / maxSec) * 100)));

        return `
            <div class="pomodoro-widget-box" id="pomo-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 14px; box-sizing: border-box; user-select: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isRunning ? '#ef4444' : '#38bdf8'}; box-shadow: 0 0 8px ${isRunning ? '#ef4444' : '#38bdf8'};"></span>
                        <span style="font-size: 11px; font-weight: 700; color: ${isRunning ? '#f87171' : 'var(--text-secondary)'}; text-transform: uppercase; letter-spacing: 0.6px;">${isRunning ? 'Focusing' : 'Focus Timer'}</span>
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button class="pomo-dur-pill ${targetMin === 15 ? 'active' : ''}" data-min="15" style="padding: 2px 6px; font-size: 10px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: ${targetMin === 15 ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}; color: ${targetMin === 15 ? '#38bdf8' : 'var(--text-secondary)'}; cursor: pointer;">15m</button>
                        <button class="pomo-dur-pill ${targetMin === 25 ? 'active' : ''}" data-min="25" style="padding: 2px 6px; font-size: 10px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: ${targetMin === 25 ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}; color: ${targetMin === 25 ? '#38bdf8' : 'var(--text-secondary)'}; cursor: pointer;">25m</button>
                        <button class="pomo-dur-pill ${targetMin === 45 ? 'active' : ''}" data-min="45" style="padding: 2px 6px; font-size: 10px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: ${targetMin === 45 ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}; color: ${targetMin === 45 ? '#38bdf8' : 'var(--text-secondary)'}; cursor: pointer;">45m</button>
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin: 6px 0;">
                    <span class="pomo-time" style="font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; line-height: 1; font-variant-numeric: tabular-nums;">${timeStr}</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="pomo-toggle-btn" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: ${isRunning ? '#ef4444' : '#38bdf8'}; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.12s, background 0.15s; box-shadow: 0 4px 12px ${isRunning ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.35)'};" title="${isRunning ? 'Pause' : 'Start'}">
                            ${isRunning ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>` : `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`}
                        </button>
                        <button class="pomo-reset-btn" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--panel-border); background: rgba(255,255,255,0.06); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity 0.15s;" title="Reset Timer">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                        </button>
                    </div>
                </div>

                <div style="width: 100%; height: 3.5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div class="pomo-progress" style="width: ${percent}%; height: 100%; background: ${isRunning ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #2563eb)'}; border-radius: 3px; transition: width 0.3s ease;"></div>
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
        const progressEl = box.querySelector('.pomo-progress');

        if (this._interval) clearInterval(this._interval);

        const format = (sec) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const updateProgress = () => {
            const targetMin = this.config.targetMinutes || 25;
            const maxSec = targetMin * 60;
            const p = Math.min(100, Math.max(0, Math.round(((maxSec - this.config.timeLeft) / maxSec) * 100)));
            if (progressEl) progressEl.style.width = `${p}%`;
        };

        const tick = () => {
            if (this.config.timeLeft > 0) {
                this.config.timeLeft -= 1;
                if (timeEl) timeEl.textContent = format(this.config.timeLeft);
                updateProgress();
            } else {
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);
                playChimeAlert();
                if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                }
                updateProgress();
            }
        };

        if (this.config.isRunning) {
            this._interval = setInterval(tick, 1000);
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.isRunning = !this.config.isRunning;
                if (this.config.isRunning) {
                    if (this.config.timeLeft <= 0) {
                        this.config.timeLeft = (this.config.targetMinutes || 25) * 60;
                    }
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
                    toggleBtn.style.background = '#ef4444';
                    this._interval = setInterval(tick, 1000);
                } else {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                    if (this._interval) clearInterval(this._interval);
                }
                this.updateConfig({ isRunning: this.config.isRunning, timeLeft: this.config.timeLeft });
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);
                this.config.timeLeft = (this.config.targetMinutes || 25) * 60;
                if (timeEl) timeEl.textContent = format(this.config.timeLeft);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                }
                updateProgress();
                this.updateConfig({ isRunning: false, timeLeft: this.config.timeLeft });
            });
        }

        // Duration pill buttons
        box.querySelectorAll('.pomo-dur-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const m = parseInt(pill.getAttribute('data-min'), 10) || 25;
                this.config.targetMinutes = m;
                this.config.timeLeft = m * 60;
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);
                this.updateConfig({ targetMinutes: m, timeLeft: this.config.timeLeft, isRunning: false });
                
                box.querySelectorAll('.pomo-dur-pill').forEach(p => {
                    const isCur = parseInt(p.getAttribute('data-min'), 10) === m;
                    p.style.background = isCur ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)';
                    p.style.color = isCur ? '#38bdf8' : 'var(--text-secondary)';
                });
                if (timeEl) timeEl.textContent = format(this.config.timeLeft);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                }
                updateProgress();
            });
        });
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(PomodoroWidget);
}
