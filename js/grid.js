export class GridEngine {
    constructor() {
        this.BASE_CELL_SIZE = 96;
        this.BASE_GAP = 16;
        this.CELL_SIZE = 96;
        this.GAP = 16;
        this.cols = 4;
        this.rows = 4;
    }

    updateMetrics() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const availableW = width * 0.85;
        const availableH = height - (window.appState && window.appState.editMode ? 260 : 40);

        let calculatedCols = Math.floor((availableW + this.BASE_GAP) / (this.BASE_CELL_SIZE + this.BASE_GAP));
        if (calculatedCols % 2 !== 0) calculatedCols--;
        
        this.cols = Math.max(4, calculatedCols);
        this.rows = Math.max(4, Math.floor((availableH + this.BASE_GAP) / (this.BASE_CELL_SIZE + this.BASE_GAP)));

        const targetGridW = this.cols * this.BASE_CELL_SIZE + (this.cols - 1) * this.BASE_GAP;
        const targetGridH = this.rows * this.BASE_CELL_SIZE + (this.rows - 1) * this.BASE_GAP;

        let scale = 1;
        if (targetGridW > availableW || targetGridH > availableH) {
            scale = Math.min(availableW / targetGridW, availableH / targetGridH);
        }

        this.CELL_SIZE = this.BASE_CELL_SIZE * scale;
        this.GAP = this.BASE_GAP * scale;

        const finalGridW = this.cols * this.CELL_SIZE + (this.cols - 1) * this.GAP;
        const finalGridH = this.rows * this.CELL_SIZE + (this.rows - 1) * this.GAP;
        
        const container = document.getElementById('grid-container');
        if (container) {
            container.style.width = `${finalGridW}px`;
            container.style.height = `${finalGridH}px`;
        }
    }

    get columns() { return this.cols; }
    get rowsCount() { return this.rows; }
    get cellSize() { return this.CELL_SIZE; }
    get gap() { return this.GAP; }

    getRenderCoords(w) {
        return {
            x: w.x,
            y: w.y,
            w: Math.min(w.w, this.cols),
            h: Math.min(w.h, this.rows)
        };
    }

    checkOverlap(w1, w2) {
        return (w1.x < w2.x + w2.w && w1.x + w1.w > w2.x && w1.y < w2.y + w2.h && w1.y + w1.h > w2.y);
    }

    canFit(w, h, widgets, excludeId = null) {
        if (w > this.cols || h > this.rows) return false;
        for (let r = 0; r <= this.rows - h; r++) {
            for (let c = 0; c <= this.cols - w; c++) {
                let overlap = widgets.some(widget => 
                    widget.id !== excludeId && !widget.isHidden &&
                    !(c + w <= widget.x || c >= widget.x + widget.w || r + h <= widget.y || r >= widget.y + widget.h)
                );
                if (!overlap) return true;
            }
        }
        return false;
    }

    resolveAllFinalOverlaps(widgets) {
        const centerX = this.cols / 2;
        const centerY = this.rows / 2;

        widgets.forEach(w => {
            if (!w.idealLayout) w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: this.cols };
            
            let minAllowedW = w.type === 'search' ? 2 : 1;
            let maxAllowedH = w.type === 'search' ? 1 : this.rows;

            w.w = Math.max(minAllowedW, Math.min(w.idealLayout.w, this.cols));
            w.h = Math.max(1, Math.min(w.idealLayout.h, maxAllowedH));
            
            const shift = Math.floor((this.cols - w.idealLayout.baseCols) / 2);
            w.x = Math.max(0, Math.min(w.idealLayout.x + shift, this.cols - w.w));
            w.y = Math.max(0, Math.min(w.idealLayout.y, this.rows - w.h));
            w.isHidden = false;

            const distW = (w.x + w.w / 2) - centerX;
            const distH = (w.y + w.h / 2) - centerY;
            w.centerDist = Math.sqrt(distW * distW + distH * distH);
        });

        widgets.sort((a, b) => a.centerDist - b.centerDist);
        let availableCells = this.cols * this.rows;
        let usedCells = 0;

        widgets.forEach(w => {
            if (usedCells + (w.w * w.h) <= availableCells) {
                usedCells += (w.w * w.h);
            } else {
                w.isHidden = true;
            }
        });

        const visible = widgets.filter(w => !w.isHidden).sort((a, b) => {
            if (a.idealLayout.y !== b.idealLayout.y) return a.idealLayout.y - b.idealLayout.y;
            return a.idealLayout.x - b.idealLayout.x;
        });

        const placed = [];
        for (let item of visible) {
            let fits = false;
            let currentY = item.y;
            while (currentY <= this.rows - item.h) {
                let temp = { x: item.x, y: currentY, w: item.w, h: item.h };
                if (!placed.some(p => this.checkOverlap(temp, p))) {
                    item.y = currentY;
                    placed.push(item);
                    fits = true;
                    break;
                }
                currentY++;
            }
            if (!fits) item.isHidden = true;
        }
    }

    omniMagnetPush(activeWidget, widgets) {
        let minWLimit = activeWidget.type === 'search' ? 2 : 1;
        let maxHLimit = activeWidget.type === 'search' ? 1 : this.rows;

        if (activeWidget.w < minWLimit) activeWidget.w = minWLimit;
        if (activeWidget.h > maxHLimit) activeWidget.h = maxHLimit;
        if (activeWidget.w > this.cols) activeWidget.w = this.cols;

        if (activeWidget.x < 0) activeWidget.x = 0;
        if (activeWidget.x + activeWidget.w > this.cols) activeWidget.x = this.cols - activeWidget.w;
        if (activeWidget.y < 0) activeWidget.y = 0;
        if (activeWidget.y + activeWidget.h > this.rows) activeWidget.y = this.rows - activeWidget.h;

        let itemsToProcess = widgets.filter(w => w.id !== activeWidget.id && !w.isHidden);
        let snapshots = itemsToProcess.map(item => ({ id: item.id, x: item.x, y: item.y, w: item.w, h: item.h }));
        let queue = [];
        itemsToProcess.forEach(item => { if (this.checkOverlap(item, activeWidget)) queue.push(item); });

        let iterations = 0;
        let failed = false;

        while (queue.length > 0 && iterations < 300) {
            iterations++;
            let current = queue.shift();
            let directions = [
                { x: current.x, y: current.y + 1 }, { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y }, { x: current.x, y: current.y - 1 }
            ];

            let validPosFound = false;
            let bestDir = null;
            let minScore = Infinity;

            for (let dir of directions) {
                if (dir.x < 0 || dir.x + current.w > this.cols || dir.y < 0 || dir.y + current.h > this.rows) continue;
                let temp = { ...current, x: dir.x, y: dir.y };
                if (this.checkOverlap(temp, activeWidget)) continue;

                let score = Math.abs(dir.x - current.x) + Math.abs(dir.y - current.y) * 2;
                let overlapCount = itemsToProcess.filter(other => other.id !== current.id && this.checkOverlap(temp, other)).length;
                score += overlapCount * 10;

                if (score < minScore) {
                    minScore = score; bestDir = dir; validPosFound = true;
                }
            }

            if (validPosFound && bestDir) {
                current.x = bestDir.x; current.y = bestDir.y;
                itemsToProcess.forEach(other => {
                    if (other.id !== current.id && this.checkOverlap(current, other)) {
                        if (!queue.includes(other)) queue.push(other);
                    }
                });
            } else {
                failed = true; break;
            }
        }

        for (let item of itemsToProcess) {
            if (item.x < 0 || item.x + item.w > this.cols || item.y < 0 || item.y + item.h > this.rows || this.checkOverlap(item, activeWidget)) failed = true;
            for (let other of itemsToProcess) {
                if (item.id !== other.id && this.checkOverlap(item, other)) failed = true;
            }
        }

        const activeEl = document.getElementById(activeWidget.id);

        if (failed) {
            snapshots.forEach(snap => {
                let realItem = itemsToProcess.find(it => it.id === snap.id);
                if (realItem) { realItem.x = snap.x; realItem.y = snap.y; realItem.w = snap.w; realItem.h = snap.h; }
            });
            if (activeEl && !activeEl.classList.contains('shake-locked')) {
                activeEl.classList.add('shake-locked');
                setTimeout(() => activeEl.classList.remove('shake-locked'), 300);
            }
            return false;
        }

        activeWidget.idealLayout = { x: activeWidget.x, y: activeWidget.y, w: activeWidget.w, h: activeWidget.h, baseCols: this.cols };
        itemsToProcess.forEach(item => {
            item.idealLayout = { x: item.x, y: item.y, w: item.w, h: item.h, baseCols: this.cols };
            const el = document.getElementById(item.id);
            if (el && !el.classList.contains('dragging') && !el.classList.contains('resizing')) {
                el.style.left = `${item.x * (this.CELL_SIZE + this.GAP)}px`;
                el.style.top = `${item.y * (this.CELL_SIZE + this.GAP)}px`;
            }
        });
        
        return true;
    }
}
