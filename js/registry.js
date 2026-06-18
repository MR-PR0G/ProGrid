class WidgetRegistry {
    constructor() {
        this.map = {};
        this.metadata = {};
    }
    register(WidgetClass) {
        if (!WidgetClass || !WidgetClass.getMetadata) return;
        const meta = WidgetClass.getMetadata();
        this.map[meta.type] = WidgetClass;
        this.metadata[meta.type] = meta;
    }
    get(type) { return this.map[type]; }
    getAllMetadata() { return Object.values(this.metadata); }
    getMetadata(type) { return this.metadata[type]; }
}
window.WidgetGlobals = new WidgetRegistry();