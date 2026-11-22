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

        const isMobile = width < 640;

        if (isMobile) {
            // Mobile: 4-column layout with dynamically calculated cell size and comfortable row capacity
            this.cols = 4;
            this.GAP = 12;
            const availableW = Math.max(280, width - 24);
            const calculatedCell = Math.floor((availableW - (3 * this.GAP)) / 4);
            this.CELL_SIZE = Math.max(72, Math.min(84, calculatedCell));
            const availableH = Math.max(300, height - (height < 700 ? 70 : 90));
            // Minimum 6 rows or expanded based on viewport to prevent drag deadlocks
            this.rows = Math.max(6, Math.floor((availableH + this.GAP) / (this.CELL_SIZE + this.GAP)));
        } else {
            const availableW = width * 0.85;
            const availableH = height - 40;

            let baseGap = 16;
            let baseCell = 96;

            let calculatedCols = Math.floor((availableW + baseGap) / (baseCell + baseGap));
            if (calculatedCols % 2 !== 0) calculatedCols--;
            
            this.cols = Math.max(4, calculatedCols);
            this.rows = Math.max(4, Math.floor((availableH + baseGap) / (baseCell + baseGap)));

            const targetGridW = this.cols * baseCell + (this.cols - 1) * baseGap;
            const targetGridH = this.rows * baseCell + (this.rows - 1) * baseGap;

            let scale = 1;
            if (targetGridW > availableW || targetGridH > availableH) {
                scale = Math.min(availableW / targetGridW, availableH / targetGridH);
            }

            this.CELL_SIZE = Math.round(baseCell * scale);
            this.GAP = Math.round(baseGap * scale);
        }

        if (window.state && Array.isArray(window.state.widgets) && window.state.widgets.length > 0) {
            const maxY = window.state.widgets.reduce((max, w) => Math.max(max, (w.y || 0) + (w.h || 1)), 0);
            this.rows = Math.max(this.rows, maxY);
        }

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
        return this.findFirstAvailablePos(w, h, widgets, excludeId) !== null;
    }

    findFirstAvailablePos(w, h, widgets, excludeId = null) {
        if (w > this.cols || h > this.rows) return null;
        for (let r = 0; r <= this.rows - h; r++) {
            for (let c = 0; c <= this.cols - w; c++) {
                let overlap = widgets.some(widget => 
                    widget.id !== excludeId && !widget.isHidden &&
                    !(c + w <= widget.x || c >= widget.x + widget.w || r + h <= widget.y || r >= widget.y + widget.h)
                );
                if (!overlap) return { x: c, y: r };
            }
        }
        return null;
    }

    resolveAllFinalOverlaps(widgets) {
        const visible = widgets.filter(w => !w.isHidden);

        // Clamp dimensions and boundaries
        visible.forEach(w => {
            const minW = w.type === 'search' ? 2 : 1;
            const maxH = w.type === 'search' ? 1 : this.rows;
            w.w = Math.max(minW, Math.min(w.w, this.cols));
            w.h = Math.max(1, Math.min(w.h, maxH));
            w.x = Math.max(0, Math.min(w.x, this.cols - w.w));
            w.y = Math.max(0, Math.min(w.y, this.rows - w.h));
        });

        // Resolve any existing overlaps by placing conflict-free
        const placed = [];
        for (const item of visible) {
            const hasConflict = placed.some(p => this.checkOverlap(item, p));
            if (!hasConflict) {
                placed.push(item);
            } else {
                let found = false;
                for (let r = 0; r <= this.rows - item.h && !found; r++) {
                    for (let c = 0; c <= this.cols - item.w; c++) {
                        const candidate = { x: c, y: r, w: item.w, h: item.h };
                        if (!placed.some(p => this.checkOverlap(candidate, p))) {
                            item.x = c;
                            item.y = r;
                            placed.push(item);
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    this.rows = Math.max(this.rows, item.y + item.h + 1);
                    item.y = this.rows - item.h;
                    placed.push(item);
                }
            }
        }
    }

    omniMagnetPush(activeWidget, widgets) {
        const minW = activeWidget.type === 'search' ? 2 : 1;
        const maxH = activeWidget.type === 'search' ? 1 : this.rows;

        activeWidget.w = Math.max(minW, Math.min(activeWidget.w, this.cols));
        activeWidget.h = Math.max(1, Math.min(activeWidget.h, maxH));
        activeWidget.x = Math.max(0, Math.min(activeWidget.x, this.cols - activeWidget.w));
        activeWidget.y = Math.max(0, Math.min(activeWidget.y, this.rows - activeWidget.h));

        const others = widgets.filter(w => w.id !== activeWidget.id && !w.isHidden);
        const collisions = others.filter(w => this.checkOverlap(w, activeWidget));

        // If no overlap, snap cleanly
        if (collisions.length === 0) {
            return true;
        }

        const snapshots = others.map(item => ({ id: item.id, x: item.x, y: item.y }));

        // Fast mutual swap if exactly one item overlaps
        if (collisions.length === 1) {
            const victim = collisions[0];
            const priorX = activeWidget.idealLayout ? activeWidget.idealLayout.x : activeWidget.x;
            const priorY = activeWidget.idealLayout ? activeWidget.idealLayout.y : activeWidget.y;

            const swapRect = { x: priorX, y: priorY, w: victim.w, h: victim.h };
            if (swapRect.x >= 0 && swapRect.x + swapRect.w <= this.cols &&
                swapRect.y >= 0 && swapRect.y + swapRect.h <= this.rows) {
                const swapConflict = others.some(other => other.id !== victim.id && this.checkOverlap(swapRect, other));
                if (!swapConflict && !this.checkOverlap(swapRect, activeWidget)) {
                    victim.x = swapRect.x;
                    victim.y = swapRect.y;
                    return true;
                }
            }
        }

        // Multi-collision or swap not clean: push colliding items to adjacent free slots
        let allRelocated = true;
        const placed = [activeWidget];

        collisions.sort((a, b) => {
            const distA = Math.hypot(a.x - activeWidget.x, a.y - activeWidget.y);
            const distB = Math.hypot(b.x - activeWidget.x, b.y - activeWidget.y);
            return distA - distB;
        });

        for (const victim of collisions) {
            let found = false;
            const candidateOffsets = [
                { x: victim.x, y: activeWidget.y + activeWidget.h }, // below
                { x: activeWidget.x + activeWidget.w, y: victim.y }, // right
                { x: activeWidget.x - victim.w, y: victim.y },       // left
                { x: victim.x, y: activeWidget.y - victim.h }        // above
            ];

            for (const pos of candidateOffsets) {
                if (pos.x >= 0 && pos.x + victim.w <= this.cols &&
                    pos.y >= 0 && pos.y + victim.h <= this.rows) {
                    const conflict = others.some(o => o.id !== victim.id && this.checkOverlap(pos, o)) ||
                                     placed.some(p => this.checkOverlap(pos, p));
                    if (!conflict) {
                        victim.x = pos.x;
                        victim.y = pos.y;
                        placed.push(victim);
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                const freeSlot = this.findFirstAvailablePos(victim.w, victim.h, [...others.filter(o => o.id !== victim.id), ...placed], victim.id);
                if (freeSlot) {
                    victim.x = freeSlot.x;
                    victim.y = freeSlot.y;
                    placed.push(victim);
                    found = true;
                } else {
                    allRelocated = false;
                    break;
                }
            }
        }

        if (allRelocated) {
            return true;
        }

        // Restore snapshot if impossible
        snapshots.forEach(s => {
            const item = others.find(o => o.id === s.id);
            if (item) { item.x = s.x; item.y = s.y; }
        });
        return false;
    }
}