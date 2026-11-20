import { BaseWidget } from './base.js';

export default class ChecklistWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'checklist',
            label: 'Checklist',
            author: 'ProGrid',
            version: '1.0.0',
            description: 'Interactive checklist and to-do tracker with instant local storage save.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 2, minH: 2, maxW: 4, maxH: 4,
            defaultConfig: { tasks: [], isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const tasks = this.config.tasks || [];
        
        let tasksHtml = '';
        if (tasks.length === 0) {
            tasksHtml = `<div style="text-align:center; padding: 20px; color: var(--text-secondary); font-size: 12px;">No tasks yet</div>`;
        } else {
            tasks.forEach((t, i) => {
                tasksHtml += `
                    <div class="checklist-item" data-index="${i}" style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--panel-border);">
                        <input type="checkbox" class="checklist-check" ${t.done ? 'checked' : ''} style="accent-color: #3b82f6; width: 16px; height: 16px; cursor: pointer;">
                        <span dir="auto" style="flex: 1; font-size: 13px; color: var(--text-primary); text-decoration: ${t.done ? 'line-through' : 'none'}; opacity: ${t.done ? '0.5' : '1'}; text-align: start;">${t.text}</span>
                        <button class="checklist-del" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; opacity: 0.7;">✖</button>
                    </div>
                `;
            });
        }

        return `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 14px; box-sizing: border-box;">
                <div class="todo-header" style="font-weight: 600; font-size: 14px; margin-bottom: 10px; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between;">
                    <span>✅ Tasks</span>
                </div>
                <div class="todo-list-container" style="flex: 1; overflow-y: auto; padding-right: 4px; margin-bottom: 8px;">
                    ${tasksHtml}
                </div>
                <div style="display: flex; gap: 6px;">
                    <input type="text" class="checklist-input" placeholder="Add task..." dir="auto" style="flex: 1; background: var(--input-bg); border: 1px solid var(--panel-border); padding: 6px 10px; border-radius: 8px; color: var(--text-primary); font-size: 12px; text-align: start;">
                    <button class="checklist-add" style="background: #3b82f6; border: none; color: white; border-radius: 8px; width: 30px; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
        `;
    }

    postRender(el) {
        const input = el.querySelector('.checklist-input');
        const addBtn = el.querySelector('.checklist-add');
        
        const addTask = () => {
            const val = input.value.trim();
            if (val) {
                if (!this.config.tasks) this.config.tasks = [];
                this.config.tasks.push({ text: val, done: false });
                window.updateWidgetConfigDirectly(this.config.id, { tasks: this.config.tasks });
            }
        };

        addBtn.addEventListener('click', addTask);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        el.querySelectorAll('.checklist-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const idx = parseInt(e.target.closest('.checklist-item').getAttribute('data-index'));
                this.config.tasks[idx].done = e.target.checked;
                window.updateWidgetConfigDirectly(this.config.id, { tasks: this.config.tasks });
            });
        });

        el.querySelectorAll('.checklist-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.closest('.checklist-item').getAttribute('data-index'));
                this.config.tasks.splice(idx, 1);
                window.updateWidgetConfigDirectly(this.config.id, { tasks: this.config.tasks });
            });
        });
    }
}

window.WidgetGlobals.register(ChecklistWidget);