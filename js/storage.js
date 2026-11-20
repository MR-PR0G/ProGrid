export class StorageEngine {
    static STORAGE_KEY = 'dashboard_liquid_v4';

    static save(state) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            blurValue: state.blurValue,
            presetBg: state.presetBg || '1',
            theme: state.theme || 'dark',
            designTheme: state.designTheme || 'liquid-glass',
            customBg: state.customBg || null,
            widgets: state.widgets
        }));
    }

    static load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return null;
        try { 
            const data = JSON.parse(raw);
            if (data && data.widgets) {
                data.widgets.forEach(w => {
                    if (w.type === 'shortcut' && (!w.icon || w.icon.startsWith('http') || w.icon.includes('/') || w.icon === '🔗' || w.icon === '🌐')) {
                        w.icon = '';
                    }
                });
            }
            return data;
        } catch (e) { 
            return null; 
        }
    }
}
