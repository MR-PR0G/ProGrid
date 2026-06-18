import { BaseWidget } from './base.js';

export default class FolderWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'folder', label: 'Folder', icon: '📁', defaultW: 2, defaultH: 2,
            minW: 1, minH: 1, maxW: 3, maxH: 3,
            defaultConfig: { title: 'Folder', children: [], isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const children = this.config.children || [];
        const w = this.config.w;
        const h = this.config.h;
        const totalCells = w * h;
        const folderId = this.config.id;
        
        const injectStyles = !document.getElementById('folder-internal-w-css') ? `
            <style id="folder-internal-w-css">
                .fw-container { width: 100%; height: 100%; box-sizing: border-box; display: grid; padding: 12px; gap: 10px; }
                .fw-direct-item { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none; color: white; transition: background 0.2s, transform 0.1s; }
                .fw-direct-item:hover { background: rgba(255, 255, 255, 0.15); transform: scale(1.02); }
                .fw-direct-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; border-radius: 8px; font-size: 24px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .fw-direct-title { font-size: 10px; font-weight: 500; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.9; }
                
                .fw-more-cell { background: rgba(0, 0, 0, 0.15); border-radius: 18px; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 4px; padding: 8px; cursor: pointer; transition: background 0.2s; border: 1px solid rgba(255,255,255,0.05); }
                .fw-more-cell:hover { background: rgba(0, 0, 0, 0.25); }
                .fw-mini-icon { display: flex; align-items: center; justify-content: center; font-size: 14px; background: rgba(255,255,255,0.1); border-radius: 6px; width: 100%; height: 100%; overflow: hidden; }
                
                .fw-layout-1x1 { padding: 0 !important; }
                .fw-layout-1x1 .fw-more-cell { border-radius: inherit; border: none; padding: 12px; gap: 6px; }
                .fw-layout-1x1 .fw-mini-icon { font-size: 20px; border-radius: 8px; }
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
                <div class="fw-more-cell" style="opacity: 0.3; align-items: center; justify-content: center; font-size: 24px;" onclick="window.openFolderPopup('${folderId}')">
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