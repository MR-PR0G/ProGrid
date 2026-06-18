export class BaseWidget {
    constructor(config) { this.config = config; }
    render() { return ''; }
    postRender(el) {}
}