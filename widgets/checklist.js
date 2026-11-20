import { BaseWidget } from './base.js';

export default class ChecklistWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'checklist',
            label: 'Tasks & Checklist',
            author: 'ProGrid',
            version: '1.2.0',
            description: 'Redesigned liquid-glass to-do tracker with completion progress, custom checkboxes, and instant autosave.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 2, minH: 1, maxW: 4, maxH: 4,
            defaultConfig: { tasks: [], isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const id = this.config.id;
        const tasks = this.config.tasks || [];
        const totalCount = tasks.length;
        const doneCount = tasks.filter(t => t.done).length;
        const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        let tasksHtml = '';
        if (tasks.length === 0) {
            tasksHtml = `
                <div style="height: 100%; min-height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--text-secondary); opacity: 0.75; user-select: none;">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.45;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                    <span style="font-size: 12px; font-weight: 600;">No tasks yet</span>
                    <span style="font-size: 10px; opacity: 0.65;">Type below to add a task</span>
                </div>
            `;
        } else {
            tasks.forEach((t, i) => {
                const isDone = !!t.done;
                tasksHtml += `
                    <div class="checklist-item" data-index="${i}" style="display: flex; align-items: center; gap: 9px; padding: 5px 6px; border-radius: 9px; margin-bottom: 3px; transition: background 0.15s;">
                        <button type="button" class="checklist-check-btn" style="width: 18px; height: 18px; min-width: 18px; border-radius: 50%; border: 1.6px solid ${isDone ? '#3b82f6' : 'rgba(255,255,255,0.3)'}; background: ${isDone ? '#3b82f6' : 'rgba(255,255,255,0.05)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: all 0.18s ease;" title="${isDone ? 'Mark undone' : 'Mark done'}">
                            ${isDone ? `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                        </button>
                        <span class="checklist-text" dir="auto" style="flex: 1; font-size: 12.5px; line-height: 1.35; color: var(--text-primary); text-decoration: ${isDone ? 'line-through' : 'none'}; opacity: ${isDone ? '0.45' : '1'}; text-align: start; word-break: break-word; transition: opacity 0.2s, text-decoration 0.2s;">${this.escapeHtml(t.text)}</span>
                        <button type="button" class="checklist-del" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; opacity: 0.5; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s;" title="Delete task">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            });
        }

        return `
            <div class="checklist-root" id="checklist-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 12px 14px; box-sizing: border-box; justify-content: space-between;">
                <!-- Header with completion badge & progress -->
                <div style="margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 13.5px; color: var(--text-primary); letter-spacing: -0.2px;">
                            <span style="width: 18px; height: 18px; border-radius: 6px; background: rgba(59,130,246,0.2); display: flex; align-items: center; justify-content: center;">
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#3b82f6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </span>
                            <span>Tasks</span>
                        </span>
                        <span class="checklist-badge" style="font-size: 10px; font-weight: 700; color: #60a5fa; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 1.5px 7px;">${totalCount > 0 ? `${doneCount}/${totalCount}` : '0'}</span>
                    </div>
                    ${totalCount > 0 ? `
                        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-top: 6px; overflow: hidden;">
                            <div class="checklist-progress-bar" style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 2px; transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);"></div>
                        </div>
                    ` : ''}
                </div>

                <!-- Scrollable tasks container -->
                <div class="checklist-list-container" style="flex: 1; overflow-y: auto; padding-right: 2px; margin-bottom: 8px; min-height: 0;">
                    ${tasksHtml}
                </div>

                <!-- Integrated Pill Input Container (Prevents any clipping against rounded corners) -->
                <div class="checklist-input-pill" style="display: flex; align-items: center; background: rgba(0,0,0,0.28); border: 1px solid var(--panel-border); border-radius: 12px; padding: 3px 4px 3px 11px; margin-top: auto; box-sizing: border-box; width: 100%;">
                    <input type="text" class="checklist-input" placeholder="Add task..." dir="auto" style="flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 12px; padding: 4px 0; text-align: start; font-family: inherit;">
                    <button type="button" class="checklist-add-btn" style="width: 26px; height: 26px; min-width: 26px; border-radius: 8px; border: none; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s, background 0.15s; margin-left: 6px;" title="Add task">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    postRender(el) {
        const root = el.querySelector(`#checklist-${this.config.id}`);
        if (!root) return;

        const input = root.querySelector('.checklist-input');
        const addBtn = root.querySelector('.checklist-add-btn');

        const addTask = () => {
            if (!input) return;
            const val = input.value.trim();
            if (val) {
                if (!this.config.tasks) this.config.tasks = [];
                this.config.tasks.push({ text: val, done: false });
                input.value = '';
                if (navigator.vibrate) navigator.vibrate(20);
                window.updateWidgetConfigDirectly(this.config.id, { tasks: this.config.tasks }, true);
            }
        };

        if (addBtn) addBtn.addEventListener('click', addTask);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addTask();
            });
        }

        root.querySelectorAll('.checklist-check-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.checklist-item');
                if (!item) return;
                const idx = parseInt(item.getAttribute('data-index'), 10);
                if (isNaN(idx) || !this.config.tasks[idx]) return;

                const willBeDone = !this.config.tasks[idx].done;
                this.config.tasks[idx].done = willBeDone;
                if (navigator.vibrate) navigator.vibrate(15);

                // Instant local DOM update
                btn.style.borderColor = willBeDone ? '#3b82f6' : 'rgba(255,255,255,0.3)';
                btn.style.background = willBeDone ? '#3b82f6' : 'rgba(255,255,255,0.05)';
                btn.innerHTML = willBeDone ? `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : '';
                
                const span = item.querySelector('.checklist-text');
                if (span) {
                    span.style.textDecoration = willBeDone ? 'line-through' : 'none';
                    span.style.opacity = willBeDone ? '0.45' : '1';
                }

                // Update badge & progress bar
                const total = this.config.tasks.length;
                const done = this.config.tasks.filter(t => t.done).length;
                const badge = root.querySelector('.checklist-badge');
                if (badge) badge.textContent = `${done}/${total}`;
                const bar = root.querySelector('.checklist-progress-bar');
                if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`;

                // Silent save without destroying DOM focus
                window.updateWidgetConfigDirectly(this.config.id, { tasks: this.config.tasks }, false);
            });
        });

        root.querySelectorAll('.checklist-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.checklist-item');
                if (!item) return;
                const idx = parseInt(item.getAttribute('data-index'), 10);
                if (isNaN(idx) || !this.config.tasks[idx]) return;

                this.config.tasks.splice(idx, 1);
                if (navigator.vibrate) navigator.vibrate(25);
                window.updateWidgetConfigDirectly(this.config.id, { tasks: this.config.tasks }, true);
            });
        });
    }
}

window.WidgetGlobals.register(ChecklistWidget);
