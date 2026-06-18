import { BaseWidget } from './base.js';

export default class ShortcutWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'shortcut', label: 'Shortcut', icon: '🔗', defaultW: 1, defaultH: 1,
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
            const favUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`;
            iconContent = `<img src="${favUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.outerHTML='🌐'" draggable="false" />`;
        }

        return `
            <a href="${url}" target="_blank" class="shortcut-link-wrapper" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none;">
                <div class="shortcut-icon-container" style="width: 56px; height: 56px; border-radius: ${shape}; background: ${iconBg}; display: flex; align-items: center; justify-content: center; font-size: 32px; user-select: none; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                    ${iconContent}
                </div>
                <span class="shortcut-label-text" style="font-size: 12px; margin-top: 8px; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-weight: 500;">${title}</span>
            </a>
        `;
    }
}

window.WidgetGlobals.register(ShortcutWidget);