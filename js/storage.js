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
        try { return JSON.parse(raw); } catch (e) { return null; }
    }
}