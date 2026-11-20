import { BaseWidget } from './base.js';

export default class ShortcutWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'shortcut',
            label: 'Web Shortcut',
            author: 'ProGrid',
            version: '1.0.0',
            description: 'One-tap fluid bookmark with automatic favicon fetch, custom icons, and shape controls.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
            defaultW: 1, defaultH: 1,
            minW: 1, minH: 1, maxW: 2, maxH: 2,
            defaultConfig: { title: 'Google', url: 'https://google.com', icon: '', iconBg: 'transparent', shape: '20px', isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const title = this.config.title || 'Link';
        const url = this.config.url || '#';
        const shape = this.config.shape || '20px';
        const iconBg = this.config.iconBg || 'transparent';
        
        let userIcon = (this.config.icon !== undefined ? this.config.icon : '').trim();
        // حذف هوشمند زنجیره‌های باگ شده قبلی
        if (userIcon === '🔗') userIcon = '';
        
        let iconContent = '';

        if (userIcon) {
            iconContent = userIcon;
        } else {
            const firstLetter = title.charAt(0).toUpperCase() || '🔗';
            const favUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`;
            iconContent = `<img src="${favUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.outerHTML='<span style=\\'font-weight:700;font-size:24px;color:var(--text-primary);\\'>${firstLetter}</span>'" draggable="false" />`;
        }

        const isHorizontal = (this.config.w || 1) >= 2 && (this.config.h || 1) === 1;
        const iconSize = isHorizontal ? '38px' : '42px';

        if (isHorizontal) {
            return `
                <a href="${url}" target="_blank" class="shortcut-link-wrapper" style="width: 100%; height: 100%; display: flex; flex-direction: row; align-items: center; justify-content: flex-start; padding: 0 14px; gap: 10px; text-decoration: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box;">
                    <div class="shortcut-icon-container" style="width: ${iconSize}; height: ${iconSize}; min-width: ${iconSize}; border-radius: ${shape}; background: ${iconBg}; display: flex; align-items: center; justify-content: center; font-size: 22px; user-select: none; box-shadow: 0 3px 8px rgba(0,0,0,0.18); overflow: hidden;">
                        ${iconContent}
                    </div>
                    <span class="shortcut-label-text" dir="auto" style="font-size: 13px; max-width: calc(100% - 50px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-weight: 600;">${title}</span>
                </a>
            `;
        }

        return `
            <a href="${url}" target="_blank" class="shortcut-link-wrapper" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto; padding: 4px; text-decoration: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box; text-align: center;">
                <div class="shortcut-icon-container" style="width: ${iconSize}; height: ${iconSize}; margin: 0 auto; border-radius: ${shape}; background: ${iconBg}; display: flex; align-items: center; justify-content: center; font-size: 24px; user-select: none; box-shadow: 0 3px 8px rgba(0,0,0,0.18); overflow: hidden;">
                    ${iconContent}
                </div>
                <span class="shortcut-label-text" dir="auto" style="font-size: 11px; margin-top: 4px; margin-left: auto; margin-right: auto; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-weight: 500; text-align: center; line-height: 1.2; display: block;">${title}</span>
            </a>
        `;
    }
}

window.WidgetGlobals.register(ShortcutWidget);