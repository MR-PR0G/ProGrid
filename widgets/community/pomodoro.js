import { BaseWidget } from '../base.js';

function playChimeAlert() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
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
            label: 'Focus Timer',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 2, minH: 1, maxW: 3, maxH: 2,
            category: 'productivity',
            author: 'MR Prog',
            version: '1.5.0',
            downloads: '7.4k',
            description: 'Minimalist Material 3 focus session timer with tap-to-set duration modal and chime notifications.',
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

        const injectStyles = !document.getElementById('pomodoro-widget-css') ? `
            <style id="pomodoro-widget-css">
                .pomo-m3-box {
                    width: 100%; height: 100%; box-sizing: border-box;
                    padding: 9px 12px; display: flex; flex-direction: column;
                    justify-content: space-between; position: relative;
                    user-select: none; overflow: hidden;
                }
                .pomo-m3-header {
                    display: flex; align-items: center; justify-content: space-between;
                    min-height: 20px;
                }
                .pomo-m3-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 2.5px 7px; border-radius: 999px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .pomo-m3-dot {
                    width: 6.5px; height: 6.5px; border-radius: 50%;
                    transition: background 0.3s;
                }
                .pomo-m3-label {
                    font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
                    color: var(--text-secondary); text-transform: uppercase;
                }
                .pomo-m3-target-tag {
                    font-size: 10px; font-weight: 600; color: var(--text-secondary);
                    padding: 2px 6px; border-radius: 6px;
                    background: rgba(255, 255, 255, 0.04);
                }
                .pomo-m3-main {
                    display: flex; align-items: center; justify-content: space-between;
                    margin: 4px 0;
                }
                .pomo-m3-time-btn {
                    display: inline-flex; align-items: baseline; gap: 4px;
                    background: transparent; border: 1px dashed rgba(255, 255, 255, 0.12);
                    border-radius: 10px; padding: 3px 7px; cursor: pointer;
                    transition: background 0.15s, border-color 0.15s;
                }
                .pomo-m3-time-btn:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(96, 165, 250, 0.4);
                }
                .pomo-m3-digits {
                    font-size: 26px; font-weight: 800; color: var(--text-primary);
                    letter-spacing: -0.5px; line-height: 1; font-variant-numeric: tabular-nums;
                }
                .pomo-m3-edit-hint {
                    color: var(--text-secondary); opacity: 0.6; display: flex; align-items: center;
                }
                .pomo-m3-controls {
                    display: flex; align-items: center; gap: 6px;
                }
                .pomo-m3-fab {
                    width: 34px; height: 34px; border-radius: 12px; border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: transform 0.12s, box-shadow 0.15s, background 0.15s;
                }
                .pomo-m3-fab:active { transform: scale(0.92); }
                .pomo-m3-reset {
                    width: 28px; height: 28px; border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(255, 255, 255, 0.05); color: var(--text-secondary);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: background 0.15s, color 0.15s;
                }
                .pomo-m3-reset:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
                .pomo-m3-track {
                    width: 100%; height: 4px; background: rgba(255, 255, 255, 0.08);
                    border-radius: 999px; overflow: hidden;
                }
                .pomo-m3-fill {
                    height: 100%; border-radius: 999px; transition: width 0.3s ease;
                }

                /* In-place Material 3 Setup Modal Overlay */
                .pomo-m3-overlay {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(18, 18, 22, 0.94);
                    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                    border-radius: inherit; z-index: 100;
                    display: none; flex-direction: column; justify-content: space-between;
                    padding: 8px 10px; box-sizing: border-box;
                    animation: pomoFadeIn 0.18s ease-out;
                }
                @keyframes pomoFadeIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
                .pomo-m3-overlay.active { display: flex; }
                .pomo-m3-dialog-top {
                    display: flex; align-items: center; justify-content: space-between;
                }
                .pomo-m3-dialog-title {
                    font-size: 11px; font-weight: 700; color: var(--text-primary);
                }
                .pomo-m3-close-btn {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: rgba(255, 255, 255, 0.08); border: none;
                    color: var(--text-secondary); display: flex; align-items: center;
                    justify-content: center; cursor: pointer;
                }
                .pomo-m3-stepper-row {
                    display: flex; align-items: center; justify-content: center;
                    gap: 10px; margin: 2px 0;
                }
                .pomo-m3-step-btn {
                    width: 28px; height: 28px; border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.06); color: var(--text-primary);
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                }
                .pomo-m3-stepper-val {
                    font-size: 20px; font-weight: 800; color: var(--text-primary);
                    min-width: 55px; text-align: center;
                }
                .pomo-m3-chips-row {
                    display: flex; gap: 4px; justify-content: center;
                }
                .pomo-m3-chip {
                    padding: 2.5px 6.5px; border-radius: 6px; font-size: 10px; font-weight: 600;
                    border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.05);
                    color: var(--text-secondary); cursor: pointer; transition: background 0.15s, color 0.15s;
                }
                .pomo-m3-chip:hover, .pomo-m3-chip.active {
                    background: rgba(56, 189, 248, 0.2);
                    color: #38bdf8; border-color: rgba(56, 189, 248, 0.35);
                }
                .pomo-m3-save-btn {
                    width: 100%; height: 26px; border-radius: 8px; border: none;
                    background: #38bdf8; color: #0f172a; font-size: 11px; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: background 0.15s;
                }
                .pomo-m3-save-btn:hover { background: #60a5fa; }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="pomo-m3-box" id="pomo-${id}">
                <div class="pomo-m3-header">
                    <div class="pomo-m3-badge">
                        <span class="pomo-m3-dot" style="background: ${isRunning ? '#ef4444' : '#38bdf8'}; box-shadow: 0 0 6px ${isRunning ? '#ef4444' : '#38bdf8'};"></span>
                        <span class="pomo-m3-label">${isRunning ? 'Focusing' : 'Focus'}</span>
                    </div>
                    <span class="pomo-m3-target-tag" id="pomo-tag-${id}">${targetMin}m goal</span>
                </div>

                <div class="pomo-m3-main">
                    <button type="button" class="pomo-m3-time-btn" id="pomo-time-btn-${id}" title="Tap to set duration">
                        <span class="pomo-m3-digits" id="pomo-time-${id}">${timeStr}</span>
                        <span class="pomo-m3-edit-hint">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        </span>
                    </button>

                    <div class="pomo-m3-controls">
                        <button type="button" class="pomo-m3-fab" id="pomo-toggle-${id}" style="background: ${isRunning ? '#ef4444' : '#38bdf8'}; box-shadow: 0 4px 10px ${isRunning ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.3)'}; color: #fff;" title="${isRunning ? 'Pause' : 'Start'}">
                            ${isRunning ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>` : `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`}
                        </button>
                        <button type="button" class="pomo-m3-reset" id="pomo-reset-${id}" title="Reset Timer">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <polyline points="3 3 3 8 8 8"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="pomo-m3-track">
                    <div class="pomo-m3-fill" id="pomo-fill-${id}" style="width: ${percent}%; background: ${isRunning ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #2563eb)'};"></div>
                </div>

                <!-- Material 3 Setup Modal Overlay -->
                <div class="pomo-m3-overlay" id="pomo-modal-${id}">
                    <div class="pomo-m3-dialog-top">
                        <span class="pomo-m3-dialog-title">Set Focus Duration</span>
                        <button type="button" class="pomo-m3-close-btn" id="pomo-modal-close-${id}" title="Close">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div class="pomo-m3-stepper-row">
                        <button type="button" class="pomo-m3-step-btn" id="pomo-step-dec-${id}">−</button>
                        <span class="pomo-m3-stepper-val" id="pomo-step-val-${id}">${targetMin}m</span>
                        <button type="button" class="pomo-m3-step-btn" id="pomo-step-inc-${id}">+</button>
                    </div>

                    <div class="pomo-m3-chips-row">
                        <button type="button" class="pomo-m3-chip ${targetMin === 10 ? 'active' : ''}" data-m="10">10m</button>
                        <button type="button" class="pomo-m3-chip ${targetMin === 15 ? 'active' : ''}" data-m="15">15m</button>
                        <button type="button" class="pomo-m3-chip ${targetMin === 25 ? 'active' : ''}" data-m="25">25m</button>
                        <button type="button" class="pomo-m3-chip ${targetMin === 45 ? 'active' : ''}" data-m="45">45m</button>
                        <button type="button" class="pomo-m3-chip ${targetMin === 60 ? 'active' : ''}" data-m="60">60m</button>
                    </div>

                    <button type="button" class="pomo-m3-save-btn" id="pomo-modal-save-${id}">Save & Apply</button>
                </div>
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const box = el.querySelector(`#pomo-${id}`);
        if (!box) return;

        const timeEl = box.querySelector(`#pomo-time-${id}`);
        const tagEl = box.querySelector(`#pomo-tag-${id}`);
        const toggleBtn = box.querySelector(`#pomo-toggle-${id}`);
        const resetBtn = box.querySelector(`#pomo-reset-${id}`);
        const fillEl = box.querySelector(`#pomo-fill-${id}`);
        const timeBtn = box.querySelector(`#pomo-time-btn-${id}`);

        // Modal elements
        const modal = box.querySelector(`#pomo-modal-${id}`);
        const modalClose = box.querySelector(`#pomo-modal-close-${id}`);
        const modalSave = box.querySelector(`#pomo-modal-save-${id}`);
        const stepDec = box.querySelector(`#pomo-step-dec-${id}`);
        const stepInc = box.querySelector(`#pomo-step-inc-${id}`);
        const stepVal = box.querySelector(`#pomo-step-val-${id}`);
        const chips = box.querySelectorAll('.pomo-m3-chip');

        let pendingMinutes = this.config.targetMinutes || 25;

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
            if (fillEl) fillEl.style.width = `${p}%`;
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
                    toggleBtn.style.boxShadow = '0 4px 10px rgba(56,189,248,0.3)';
                }
                updateProgress();
            }
        };

        if (this.config.isRunning) {
            this._interval = setInterval(tick, 1000);
        }

        // Play / Pause Toggle
        if (toggleBtn) {
            toggleBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.isRunning = !this.config.isRunning;
                if (this.config.isRunning) {
                    if (this.config.timeLeft <= 0) {
                        this.config.timeLeft = (this.config.targetMinutes || 25) * 60;
                    }
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
                    toggleBtn.style.background = '#ef4444';
                    toggleBtn.style.boxShadow = '0 4px 10px rgba(239,68,68,0.3)';
                    this._interval = setInterval(tick, 1000);
                } else {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                    toggleBtn.style.boxShadow = '0 4px 10px rgba(56,189,248,0.3)';
                    if (this._interval) clearInterval(this._interval);
                }
                this.updateConfig({ isRunning: this.config.isRunning, timeLeft: this.config.timeLeft });
            });
        }

        // Reset
        if (resetBtn) {
            resetBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);
                this.config.timeLeft = (this.config.targetMinutes || 25) * 60;
                if (timeEl) timeEl.textContent = format(this.config.timeLeft);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                    toggleBtn.style.boxShadow = '0 4px 10px rgba(56,189,248,0.3)';
                }
                updateProgress();
                this.updateConfig({ isRunning: false, timeLeft: this.config.timeLeft });
            });
        }

        // Open Setup Modal on Time Tap
        if (timeBtn && modal) {
            timeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            timeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                pendingMinutes = this.config.targetMinutes || 25;
                if (stepVal) stepVal.textContent = `${pendingMinutes}m`;
                chips.forEach(c => {
                    c.classList.toggle('active', parseInt(c.getAttribute('data-m'), 10) === pendingMinutes);
                });
                modal.classList.add('active');
            });
        }

        // Modal Controls
        if (modal) {
            modal.addEventListener('pointerdown', (e) => e.stopPropagation());
            modal.addEventListener('click', (e) => e.stopPropagation());
        }

        if (modalClose && modal) {
            modalClose.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.classList.remove('active');
            });
        }

        if (stepDec) {
            stepDec.addEventListener('click', (e) => {
                e.stopPropagation();
                pendingMinutes = Math.max(1, pendingMinutes - 5);
                if (stepVal) stepVal.textContent = `${pendingMinutes}m`;
                chips.forEach(c => c.classList.toggle('active', parseInt(c.getAttribute('data-m'), 10) === pendingMinutes));
            });
        }

        if (stepInc) {
            stepInc.addEventListener('click', (e) => {
                e.stopPropagation();
                pendingMinutes = Math.min(180, pendingMinutes + 5);
                if (stepVal) stepVal.textContent = `${pendingMinutes}m`;
                chips.forEach(c => c.classList.toggle('active', parseInt(c.getAttribute('data-m'), 10) === pendingMinutes));
            });
        }

        chips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const m = parseInt(chip.getAttribute('data-m'), 10);
                if (m) {
                    pendingMinutes = m;
                    if (stepVal) stepVal.textContent = `${pendingMinutes}m`;
                    chips.forEach(c => c.classList.toggle('active', c === chip));
                }
            });
        });

        if (modalSave && modal) {
            modalSave.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.targetMinutes = pendingMinutes;
                this.config.timeLeft = pendingMinutes * 60;
                this.config.isRunning = false;
                if (this._interval) clearInterval(this._interval);

                if (timeEl) timeEl.textContent = format(this.config.timeLeft);
                if (tagEl) tagEl.textContent = `${pendingMinutes}m goal`;
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                    toggleBtn.style.background = '#38bdf8';
                    toggleBtn.style.boxShadow = '0 4px 10px rgba(56,189,248,0.3)';
                }
                updateProgress();
                modal.classList.remove('active');
                this.updateConfig({ targetMinutes: pendingMinutes, timeLeft: this.config.timeLeft, isRunning: false });
            });
        }
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(PomodoroWidget);
}
