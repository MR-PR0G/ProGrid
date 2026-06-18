import { BaseWidget } from './base.js';
import { StorageEngine } from '../js/storage.js';

export default class ChecklistWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'checklist', label: 'Checklist', icon: '📋', defaultW: 2, defaultH: 2,
            minW: 2, minH: 2, maxW: 4, maxH: 4,
            defaultConfig: { isGlass: true, bg: '#ffffff', items: [{ id: 1, text: 'Task 1', done: false }] }
        };
    }

    render() {
        this.config.items = this.config.items || [];
        let itemsHtml = this.config.items.map(item => `
            <div class="todo-item ${item.done ? 'done' : ''}" data-item-id="${item.id}">
                <div class="todo-checkbox">${item.done ? '✓' : ''}</div>
                <span class="todo-text">${item.text}</span>
            </div>
        `).join('');

        const injectStyles = !document.getElementById('checklist-internal-w-css') ? `
            <style id="checklist-internal-w-css">
                .checklist-widget { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 16px; color: white; box-sizing: border-box; }
                .todo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; }
                .todo-title { font-size: 13px; font-weight: 600; opacity: 0.7; letter-spacing: 0.5px; }
                .add-todo-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white; width: 22px; height: 22px; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
                .add-todo-btn:hover { background: rgba(255,255,255,0.15); }
                .todo-list-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
                .todo-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
                .todo-item:hover { background: rgba(255,255,255,0.06); }
                .todo-checkbox { width: 16px; height: 16px; border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; font-size: 10px; display: flex; align-items: center; justify-content: center; color: white; background: rgba(0,0,0,0.1); }
                .todo-item.done { opacity: 0.5; }
                .todo-item.done .todo-checkbox { background: #3b82f6; border-color: #3b82f6; }
                .todo-item.done .todo-text { text-decoration: line-through; }
                .todo-text { font-size: 12px; font-weight: 500; }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="checklist-widget">
                <div class="todo-header">
                    <span class="todo-title">Tasks</span>
                    <button class="add-todo-btn">+</button>
                </div>
                <div class="todo-list-container">${itemsHtml}</div>
            </div>
        `;
    }

    postRender(el) {
        const containerEl = el.querySelector('.todo-list-container');
        const addBtn = el.querySelector('.add-todo-btn');

        if (containerEl) {
            containerEl.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.todo-item');
                if (!itemEl) return;
                
                e.stopPropagation();
                e.preventDefault();

                const id = parseInt(itemEl.getAttribute('data-item-id'));
                const item = this.config.items.find(i => i.id === id);
                if (item) {
                    item.done = !item.done;
                    itemEl.classList.toggle('done', item.done);
                    itemEl.querySelector('.todo-checkbox').innerHTML = item.done ? '✓' : '';
                    StorageEngine.save(window.appState);
                }
            });

            containerEl.addEventListener('pointerdown', (e) => e.stopPropagation());
            containerEl.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (addBtn) {
            addBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            addBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            
            addBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const text = prompt('Enter task description:');
                if (!text || !text.trim()) return;
                
                this.config.items.push({ id: Date.now(), text: text.trim(), done: false });
                StorageEngine.save(window.appState);
                
                const content = el.querySelector('.widget-content');
                if (content) {
                    content.innerHTML = this.render();
                    this.postRender(el);
                }
            };
        }
    }
}

window.WidgetGlobals.register(ChecklistWidget);