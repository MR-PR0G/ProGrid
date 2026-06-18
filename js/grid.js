export class GridEngine {
    constructor() {
        this.CELL_SIZE = 92;
        this.GAP = 16;
        this.cols = 4;
        this.rows = 0;
        this.leftOffset = 0;
        this.topOffset = 60;
    }

    updateMetrics() {
        const width = window.innerWidth;
        if (width < 500) {
            this.cols = 4;
            this.CELL_SIZE = 76;
            this.GAP = 12;
        } else if (width < 900) {
            this.cols = 6;
            this.CELL_SIZE = 84;
            this.GAP = 14;
        } else {
            this.cols = 8;
            this.CELL_SIZE = 92;
            this.GAP = 16;
        }
        const gridWidth = this.cols * this.CELL_SIZE + (this.cols - 1) * this.GAP;
        this.leftOffset = Math.max(20, (width - gridWidth) / 2);
    }

    checkOverlap(w1, w2) {
        return (w1.x < w2.x + w2.w && w1.x + w1.w > w2.x && w1.y < w2.y + w2.h && w1.y + w1.h > w2.y);
    }

    resolveAllFinalOverlaps(widgets) {
        widgets.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        for (let i = 0; i < widgets.length; i++) {
            let item = widgets[i];
            item.x = Math.max(0, Math.min(item.x, this.cols - item.w));
            
            let hasOverlap = true;
            while (hasOverlap) {
                hasOverlap = false;
                for (let j = 0; j < i; j++) {
                    if (this.checkOverlap(item, widgets[j])) {
                        item.y = widgets[j].y + widgets[j].h;
                        hasOverlap = true;
                    }
                }
            }
        }
    }

    omniMagnetPush(activeWidget, widgets) {
        activeWidget.x = Math.max(0, Math.min(activeWidget.x, this.cols - activeWidget.w));
        if (activeWidget.y < 0) activeWidget.y = 0;

        let itemsToProcess = widgets.filter(w => w.id !== activeWidget.id);
        itemsToProcess.sort((a, b) => a.y - b.y);

        let changesMade = true;
        let counter = 0;

        while (changesMade && counter < 50) {
            changesMade = false;
            counter++;

            for (let item of itemsToProcess) {
                if (this.checkOverlap(item, activeWidget)) {
                    item.y = activeWidget.y + activeWidget.h;
                    changesMade = true;
                }
                for (let other of itemsToProcess) {
                    if (item.id !== other.id && this.checkOverlap(item, other)) {
                        if (item.y >= other.y) {
                            item.y = other.y + other.h;
                        } else {
                            other.y = item.y + item.h;
                        }
                        changesMade = true;
                    }
                }
            }
        }

        itemsToProcess.forEach(item => {
            const el = document.getElementById(item.id);
            if (el && !el.classList.contains('dragging') && !el.classList.contains('resizing')) {
                el.style.left = `${item.x * (this.CELL_SIZE + this.GAP) + this.leftOffset}px`;
                el.style.top = `${item.y * (this.CELL_SIZE + this.GAP) + this.topOffset}px`;
            }
        });
    }
}