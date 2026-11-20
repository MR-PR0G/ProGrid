import { BaseWidget } from './base.js';

export default class NotesWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'notes',
            label: 'Smart Notepad',
            author: 'MR Prog',
            version: '1.2.0',
            description: 'Clean multi-note scratchpad with instant local storage persistence and responsive tab switcher.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            defaultW: 2,
            defaultH: 2,
            minW: 1,
            minH: 1,
            maxW: 4,
            maxH: 4,
            defaultConfig: {
                notes: [{ id: '1', title: 'Note 1', content: '' }],
                activeNoteIndex: 0,
                bg: '#ffffff'
            }
        };
    }

    getNotesList() {
        let notes = this.config.notes;
        if (!Array.isArray(notes) || notes.length === 0) {
            notes = [{ id: '1', title: 'Note 1', content: this.config.content || '' }];
            this.config.notes = notes;
        }
        return notes;
    }

    render() {
        const id = this.config.id;
        const notes = this.getNotesList();
        let activeIdx = typeof this.config.activeNoteIndex === 'number' ? this.config.activeNoteIndex : 0;
        if (activeIdx < 0 || activeIdx >= notes.length) activeIdx = 0;
        const activeNote = notes[activeIdx] || { content: '' };

        const injectStyles = !document.getElementById('notes-widget-css') ? `
            <style id="notes-widget-css">
                .notes-w-container {
                    width: 100%; height: 100%;
                    box-sizing: border-box;
                    padding: 8px 10px;
                    display: flex; flex-direction: column;
                    gap: 6px;
                }
                .notes-w-tabs-row {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 6px; user-select: none;
                    min-height: 24px;
                }
                .notes-tabs-scroll {
                    display: flex; align-items: center; gap: 4px;
                    overflow-x: auto; scrollbar-width: none;
                    flex: 1; min-width: 0;
                }
                .notes-tabs-scroll::-webkit-scrollbar { display: none; }
                .note-tab-pill {
                    padding: 2.5px 8px; border-radius: 8px;
                    font-size: 11px; font-weight: 600;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-secondary);
                    cursor: pointer; white-space: nowrap;
                    transition: all 0.15s ease;
                }
                .note-tab-pill:hover {
                    background: rgba(255, 255, 255, 0.12);
                    color: var(--text-primary);
                }
                .note-tab-pill.active {
                    background: rgba(139, 92, 246, 0.25);
                    border-color: rgba(139, 92, 246, 0.45);
                    color: #c4b5fd;
                }
                .note-add-btn {
                    width: 22px; height: 22px; border-radius: 7px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: var(--text-secondary);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; flex-shrink: 0;
                    transition: all 0.15s ease;
                }
                .note-add-btn:hover {
                    background: rgba(139, 92, 246, 0.3);
                    color: #fff;
                }
                .note-del-btn {
                    width: 20px; height: 20px; border-radius: 6px;
                    background: transparent; border: none;
                    color: var(--text-secondary);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; flex-shrink: 0; opacity: 0.6;
                    transition: all 0.15s ease;
                }
                .note-del-btn:hover {
                    opacity: 1; color: #ef4444; background: rgba(239, 68, 68, 0.15);
                }
                .notes-w-body-box {
                    flex: 1; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.22);
                    border: 1px solid var(--panel-border);
                    border-radius: 10px;
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
                    opacity: 0.5;
                }
            </style>
        ` : '';

        let tabsHtml = '';
        notes.forEach((n, idx) => {
            const isActive = idx === activeIdx;
            tabsHtml += `
                <button type="button" class="note-tab-pill ${isActive ? 'active' : ''}" data-index="${idx}">
                    ${n.title || `Note ${idx + 1}`}
                </button>
            `;
        });

        const showDel = notes.length > 1;

        return `
            ${injectStyles}
            <div class="notes-w-container" id="notes-container-${id}">
                <div class="notes-w-tabs-row">
                    <div class="notes-tabs-scroll">
                        ${tabsHtml}
                        <button type="button" class="note-add-btn" id="notes-add-btn-${id}" title="New note" aria-label="Add note">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>
                    ${showDel ? `
                        <button type="button" class="note-del-btn" id="notes-del-btn-${id}" title="Delete active note" aria-label="Delete note">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="notes-w-body-box">
                    <textarea class="notes-w-textarea" placeholder="Type notes here..." id="notes-text-${id}" dir="auto">${activeNote.content || ''}</textarea>
                </div>
            </div>
        `;
    }

    postRender(el) {
        const id = this.config.id;
        const textarea = el.querySelector(`#notes-text-${id}`);
        const notes = this.getNotesList();
        let activeIdx = typeof this.config.activeNoteIndex === 'number' ? this.config.activeNoteIndex : 0;
        if (activeIdx < 0 || activeIdx >= notes.length) activeIdx = 0;

        if (textarea) {
            let saveTimeout = null;
            textarea.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    notes[activeIdx].content = textarea.value;
                    this.config.notes = notes;
                    this.config.content = textarea.value;
                    window.updateWidgetConfigDirectly(this.config.id, { notes, activeNoteIndex: activeIdx, content: textarea.value }, false);
                }, 300);
            });

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

        // Tab click listeners
        el.querySelectorAll('.note-tab-pill').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => e.stopPropagation());
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetIdx = parseInt(btn.getAttribute('data-index'), 10);
                if (!isNaN(targetIdx) && targetIdx !== activeIdx) {
                    this.config.activeNoteIndex = targetIdx;
                    window.updateWidgetConfigDirectly(this.config.id, { activeNoteIndex: targetIdx }, true);
                }
            });
        });

        // Add note listener
        const addBtn = el.querySelector(`#notes-add-btn-${id}`);
        if (addBtn) {
            addBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newNoteNum = notes.length + 1;
                notes.push({ id: String(Date.now()), title: `Note ${newNoteNum}`, content: '' });
                this.config.notes = notes;
                this.config.activeNoteIndex = notes.length - 1;
                window.updateWidgetConfigDirectly(this.config.id, { notes, activeNoteIndex: this.config.activeNoteIndex }, true);
            });
        }

        // Delete active note listener
        const delBtn = el.querySelector(`#notes-del-btn-${id}`);
        if (delBtn) {
            delBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (notes.length <= 1) return;
                notes.splice(activeIdx, 1);
                const nextIdx = Math.max(0, activeIdx - 1);
                this.config.notes = notes;
                this.config.activeNoteIndex = nextIdx;
                window.updateWidgetConfigDirectly(this.config.id, { notes, activeNoteIndex: nextIdx }, true);
            });
        }
    }
}

window.WidgetGlobals.register(NotesWidget);
