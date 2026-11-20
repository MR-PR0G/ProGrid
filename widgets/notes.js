import { BaseWidget } from './base.js';

export default class NotesWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'notes',
            label: 'Quick Notes',
            author: 'ProGrid',
            version: '1.2.0',
            description: 'Refined liquid-glass scratchpad with live word/char count, autosave badge, and multi-language RTL support.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            defaultW: 2,
            defaultH: 2,
            minW: 1,
            minH: 1,
            maxW: 4,
            maxH: 4,
            defaultConfig: {
                content: '',
                placeholder: 'Type quick notes here...',
                isGlass: true,
                bg: '#ffffff'
            }
        };
    }

    render() {
        const id = this.config.id;
        const content = this.config.content || '';
        const placeholder = this.config.placeholder || 'Type quick notes here...';
        const charCount = content.length;

        const injectStyles = !document.getElementById('notes-widget-css') ? `
            <style id="notes-widget-css">
                .notes-w-container {
                    width: 100%; height: 100%;
                    box-sizing: border-box;
                    padding: 12px 14px;
                    display: flex; flex-direction: column;
                    justify-content: space-between;
                }
                .notes-w-header {
                    font-size: 13px; font-weight: 700;
                    margin-bottom: 8px;
                    display: flex; align-items: center; justify-content: space-between;
                    color: var(--text-primary);
                    user-select: none;
                }
                .notes-w-body-box {
                    flex: 1; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.22);
                    border: 1px solid var(--panel-border);
                    border-radius: 12px;
                    padding: 8px 10px;
                    box-sizing: border-box;
                    display: flex; flex-direction: column;
                    min-height: 0;
                }
                .notes-w-textarea {
                    flex: 1; width: 100%; height: 100%;
                    background: transparent; border: none;
                    outline: none; resize: none;
                    color: var(--text-primary);
                    font-size: 12.5px; line-height: 1.55;
                    font-family: inherit;
                    direction: auto;
                    text-align: start;
                    unicode-bidi: plaintext;
                    box-sizing: border-box;
                }
                .notes-w-textarea::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.55;
                }
                .notes-status-badge {
                    font-size: 10px; font-weight: 600;
                    color: #10b981;
                    display: flex; align-items: center; gap: 4px;
                    background: rgba(16, 185, 129, 0.12);
                    border: 1px solid rgba(16, 185, 129, 0.25);
                    border-radius: 10px;
                    padding: 1.5px 7px;
                    transition: all 0.2s ease;
                }
                .notes-status-dot {
                    width: 5px; height: 5px; border-radius: 50%;
                    background: #10b981;
                }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="notes-w-container" id="notes-container-${id}">
                <div class="notes-w-header">
                    <span style="display: flex; align-items: center; gap: 7px;">
                        <span style="width: 18px; height: 18px; border-radius: 6px; background: rgba(139, 92, 246, 0.2); display: flex; align-items: center; justify-content: center;">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#a78bfa" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        </span>
                        <span>Note</span>
                    </span>
                    <span class="notes-status-badge" id="notes-status-${id}">
                        <span class="notes-status-dot"></span>
                        <span class="notes-status-text">Saved</span>
                    </span>
                </div>
                <div class="notes-w-body-box">
                    <textarea class="notes-w-textarea" placeholder="${placeholder}" id="notes-text-${id}" dir="auto">${content}</textarea>
                </div>
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const textarea = el.querySelector(`#notes-text-${id}`);
        const statusEl = el.querySelector(`#notes-status-${id}`);
        if (!textarea) return;

        let saveTimeout = null;
        textarea.addEventListener('input', () => {
            if (statusEl) {
                statusEl.style.color = '#f59e0b';
                statusEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                statusEl.style.background = 'rgba(245, 158, 11, 0.12)';
                const dot = statusEl.querySelector('.notes-status-dot');
                if (dot) dot.style.background = '#f59e0b';
                const txt = statusEl.querySelector('.notes-status-text');
                if (txt) txt.textContent = 'Saving...';
            }

            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.config.content = textarea.value;
                window.updateWidgetConfigDirectly(this.config.id, { content: textarea.value }, false);
                
                if (statusEl) {
                    statusEl.style.color = '#10b981';
                    statusEl.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                    statusEl.style.background = 'rgba(16, 185, 129, 0.12)';
                    const dot = statusEl.querySelector('.notes-status-dot');
                    if (dot) dot.style.background = '#10b981';
                    const txt = statusEl.querySelector('.notes-status-text');
                    if (txt) txt.textContent = 'Saved';
                }
            }, 350);
        });

        // جلوگیری از تداخل انتخاب متن فقط در حالت عادی (در حالت ادیت درگ آزاد است)
        textarea.addEventListener('pointerdown', (e) => {
            if (!document.body.classList.contains('edit-mode')) {
                e.stopPropagation();
            }
        });
        textarea.addEventListener('touchstart', (e) => {
            if (!document.body.classList.contains('edit-mode')) {
                e.stopPropagation();
            }
        }, { passive: true });
    }
}

window.WidgetGlobals.register(NotesWidget);
