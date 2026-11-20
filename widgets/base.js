export class BaseWidget {
    constructor(config) {
        this.config = config || {};
    }

    /**
     * Render widget inner HTML markup.
     * @returns {string} HTML markup string
     */
    render() {
        return '';
    }

    /**
     * Post-mount lifecycle hook: initialize DOM listeners, timers, and animations.
     * @param {HTMLElement} el
     */
    postRender(el) {}

    /**
     * Resize lifecycle hook invoked when widget dimensions change on the grid.
     * @param {number} w Width in grid columns
     * @param {number} h Height in grid rows
     * @param {HTMLElement} el
     */
    onResize(w, h, el) {}

    /**
     * Teardown lifecycle hook: dispose timers, listeners, and resources upon destruction or re-render.
     * @param {HTMLElement} el
     */
    onDestroy(el) {}

    /**
     * Persist partial configuration changes to storage and global application state.
     * @param {Object} partialConfig
     * @param {boolean} [shouldRender=true]
     */
    updateConfig(partialConfig, shouldRender = true) {
        if (this.config && this.config.id && window.updateWidgetConfigDirectly) {
            window.updateWidgetConfigDirectly(this.config.id, partialConfig, shouldRender);
        }
    }
}
