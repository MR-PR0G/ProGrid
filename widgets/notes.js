import { BaseWidget } from './base.js';

export default class NotesWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'notes',
            label: 'Quick Notes',
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

        const injectStyles = !document.getElementById('notes-widget-css') ? `
            <style id="notes-widget-css">
                .notes-w-container {
                    width: 100%; height: 100%;
                    box-sizing: border-box;
                    padding: 12px;
                    display: flex; flex-direction: column;
                }
                .notes-w-header {
                    font-size: 12px; font-weight: 600;
                    margin-bottom: 6px;
                    display: flex; align-items: center; justify-content: space-between;
                    color: var(--text-primary);
                    opacity: 0.9;
                }
                .notes-w-textarea {
                    flex: 1; width: 100%; height: 100%;
                    background: transparent; border: none;
                    outline: none; resize: none;
                    color: var(--text-primary);
                    font-size: 13px; line-height: 1.5;
                    font-family: inherit;
                }
                .notes-w-textarea::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.6;
                }
            </style>
        ` : '';

        return `
            ${injectStyles}
            <div class="notes-w-container">
                <div class="notes-w-header">
                    <span>📝 Note</span>
                </div>
                <textarea class="notes-w-textarea" placeholder="${placeholder}" id="notes-text-${id}">${content}</textarea>
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const textarea = el.querySelector(`#notes-text-${id}`);
        if (!textarea) return;

        let saveTimeout = null;
        textarea.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.config.content = textarea.value;
                window.updateWidgetConfigDirectly(this.config.id, { content: textarea.value });
            }, 300);
        });

        // جلوگیری از درگ شدن ویجت هنگام انتخاب متن یا نوشتن
        textarea.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });
        textarea.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
    }
}

window.WidgetGlobals.register(NotesWidget);
