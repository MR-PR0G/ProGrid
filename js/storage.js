export class StorageEngine {
    static save(state) {
        localStorage.setItem('dashboard_liquid_v3', JSON.stringify({
            blurValue: state.blurValue,
            presetBg: state.presetBg || '1',
            widgets: state.widgets
        }));
    }

    static load() {
        const raw = localStorage.getItem('dashboard_liquid_v3');
        if (!raw) return null;
        try { 
            const data = JSON.parse(raw);
            if(data && data.widgets) {
                data.widgets.forEach(w => {
                    if(w.type === 'shortcut' && (!w.icon || w.icon.startsWith('http') || w.icon.includes('/'))) {
                        w.icon = '🔗';
                    }
                });
            }
            return data;
        } catch (e) { 
            return null; 
        }
    }
}