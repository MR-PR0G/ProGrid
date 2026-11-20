import { BaseWidget } from './base.js';

export default class FolderWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'folder',
            label: 'Smart Folder',
            author: 'ProGrid',
            version: '1.0.0',
            description: 'Group, organize, and manage multiple web shortcuts in an expandable frosted glass popup.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 1, minH: 1, maxW: 3, maxH: 3,
            defaultConfig: { title: 'Folder', children: [], isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const children = this.config.children || [];
        const w = this.config.w || 2;
        const h = this.config.h || 2;
        const totalCells = w * h;
        const folderId = this.config.id;
        
        const injectStyles = !document.getElementById('folder-internal-w-css') ? `
            <style id="folder-internal-w-css">
                .fw-container {
                    width: 100%; height: 100%;
                    box-sizing: border-box;
                    display: grid;
                    padding: 5px;
                    gap: 4px;
                    overflow: hidden;
                }
                .fw-direct-item {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    color: var(--text-primary);
                    transition: background 0.2s, transform 0.1s;
                    padding: 2px 3px;
                    box-sizing: border-box;
                    overflow: hidden;
                    min-height: 0; min-width: 0;
                }
                .fw-direct-item:hover {
                    background: rgba(255, 255, 255, 0.16);
                    transform: scale(1.02);
                }
                .fw-direct-icon {
                    width: 26px; height: 26px;
                    min-width: 26px; min-height: 26px;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 7px;
                    font-size: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                    overflow: hidden;
                    flex-shrink: 0;
                    margin-bottom: 2px;
                }
                .fw-direct-title {
                    font-size: 9px;
                    font-weight: 500;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    opacity: 0.95;
                    line-height: 1.1;
                    text-align: center;
                    display: block;
                }
                
                .fw-more-cell {
                    background: rgba(0, 0, 0, 0.18);
                    border-radius: 12px;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    gap: 3px;
                    padding: 5px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border: 1px solid rgba(255,255,255,0.06);
                    box-sizing: border-box;
                    min-height: 0; min-width: 0;
                }
                .fw-more-cell:hover { background: rgba(0, 0, 0, 0.28); }
                .fw-mini-icon {
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 5px;
                    width: 100%; height: 100%;
                    overflow: hidden;
                }
                
                .fw-layout-1x1 { padding: 0 !important; }
                .fw-layout-1x1 .fw-more-cell { border-radius: inherit; border: none; padding: 8px; gap: 4px; }
                .fw-layout-1x1 .fw-mini-icon { font-size: 16px; border-radius: 6px; }
            </style>
        ` : '';

        const getIconHtml = (ch) => {
            let uIcon = (ch.icon !== undefined ? ch.icon : '').trim();
            if (uIcon === '🔗') uIcon = '';
            if (uIcon) return uIcon;
            const favUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(ch.url || '')}&size=128`;
            return `<img src="${favUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.outerHTML='🌐'" draggable="false" />`;
        };

        let gridTemplate = `grid-template-columns: repeat(${w}, 1fr); grid-template-rows: repeat(${h}, 1fr);`;
        let contentHtml = '';

        if (totalCells === 1) {
            let miniIcons = '';
            for (let i = 0; i < Math.min(children.length, 4); i++) {
                let bg = children[i].iconBg && children[i].iconBg !== 'transparent' ? children[i].iconBg : 'rgba(255,255,255,0.1)';
                miniIcons += `<div class="fw-mini-icon" style="background: ${bg}">${getIconHtml(children[i])}</div>`;
            }
            return `
                ${injectStyles}
                <div class="fw-container fw-layout-1x1" style="${gridTemplate}" onclick="window.openFolderPopup('${folderId}')">
                    <div class="fw-more-cell">
                        ${miniIcons}
                    </div>
                </div>
            `;
        }

        const directCount = totalCells - 1;
        for (let i = 0; i < Math.min(children.length, directCount); i++) {
            const ch = children[i];
            let bg = ch.iconBg && ch.iconBg !== 'transparent' ? ch.iconBg : 'transparent';
            contentHtml += `
                <a href="${ch.url}" target="_blank" class="fw-direct-item" title="${ch.title}" onclick="event.stopPropagation()">
                    <div class="fw-direct-icon" style="background: ${bg}">${getIconHtml(ch)}</div>
                    <span class="fw-direct-title">${ch.title}</span>
                </a>
            `;
        }

        let miniIcons = '';
        const remainingChildren = children.slice(directCount);
        if (remainingChildren.length > 0) {
            for (let i = 0; i < Math.min(remainingChildren.length, 4); i++) {
                let bg = remainingChildren[i].iconBg && remainingChildren[i].iconBg !== 'transparent' ? remainingChildren[i].iconBg : 'rgba(255,255,255,0.1)';
                miniIcons += `<div class="fw-mini-icon" style="background: ${bg}">${getIconHtml(remainingChildren[i])}</div>`;
            }
            contentHtml += `
                <div class="fw-more-cell" onclick="window.openFolderPopup('${folderId}')">
                    ${miniIcons}
                </div>
            `;
        } else {
            contentHtml += `
                <div class="fw-more-cell" style="opacity: 0.35; align-items: center; justify-content: center; font-size: 20px; color: var(--text-primary);" onclick="window.openFolderPopup('${folderId}')">
                    +
                </div>
            `;
        }

        return `
            ${injectStyles}
            <div class="fw-container" style="${gridTemplate}">
                ${contentHtml}
            </div>
        `;
    }
}

window.WidgetGlobals.register(FolderWidget);