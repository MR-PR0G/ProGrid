class ShortcutWidget {
    constructor(config) {
        this.config = config || {};
    }

    render() {
        const title = this.config.title || 'Link';
        const url = this.config.url || '#';
        const shape = this.config.shape || '20px';
        
        let hostname = 'google.com';
        if (url && url !== '#' && typeof url === 'string' && url.startsWith('http')) {
            try {
                hostname = new URL(url).hostname;
            } catch (e) {
                hostname = 'invalid-url';
            }
        }

        const iconSrc = this.config.cachedIcon || `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;

        return `
            <a href="${url}" target="_blank" class="shortcut-link-wrapper" style="border-radius: ${shape}; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none;">
                <div class="shortcut-icon-container" style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                    <img class="shortcut-icon-img" src="${iconSrc}" alt="${title}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.5)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'12\' cy=\'12\' r=\'10\'></circle><line x1=\'2\' y1=\'12\' x2=\'22\' y2=\'12\'></line><path d=\'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\'></path></svg>';">
                </div>
                <span class="shortcut-label-text" style="font-size: 12px; margin-top: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
            </a>
        `;
    }
}

if (typeof window !== 'undefined' && window.WidgetGlobals) {
    window.WidgetGlobals.register('shortcut', ShortcutWidget, {
        type: 'shortcut',
        label: 'Shortcut',
        icon: '🔗',
        defaultW: 1,
        defaultH: 1,
        minW: 1,
        minH: 1,
        maxW: 2,
        maxH: 2,
        defaultConfig: {
            title: 'Google',
            url: 'https://google.com',
            icon: 'AUTO_FAVICON',
            shape: '20px',
            isGlass: true,
            bg: '#ffffff'
        }
    });
}