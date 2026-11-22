/**
 * ProGrid Matrix Engine v1.6 LTS
 * Viewport-adaptive dynamic grid system with fluid magnet physics,
 * continuous real-time collision cascade, zero-overlap guarantee, and non-blocking drag dynamics.
 */

export class GridEngine {
    constructor() {
        this.version = '1.6.0 ProGrid Matrix Engine';
        this.BASE_CELL_SIZE = 96;
        this.BASE_GAP = 16;
        this.CELL_SIZE = 96;
        this.GAP = 16;
        this.cols = 4;
        this.rows = 4;
        this.minRows = 4;
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
            this.minRows = Math.max(6, Math.floor((availableH + this.GAP) / (this.CELL_SIZE + this.GAP)));
            this.rows = this.minRows;
        } else {
            const availableW = width * 0.85;
            const availableH = height - 40;

            let baseGap = 16;
            let baseCell = 96;

            let calculatedCols = Math.floor((availableW + baseGap) / (baseCell + baseGap));
            if (calculatedCols % 2 !== 0) calculatedCols--;
            
            this.cols = Math.max(4, calculatedCols);
            this.minRows = Math.max(4, Math.floor((availableH + baseGap) / (baseCell + baseGap)));
            this.rows = this.minRows;

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
            const maxY = this.calculateMaxY(window.state.widgets);
            this.rows = Math.max(this.minRows, maxY);
        }

        this.syncContainerDimensions();
    }

    syncContainerDimensions() {
        const finalGridW = this.cols * this.CELL_SIZE + (this.cols - 1) * this.GAP;
        const finalGridH = this.rows * this.CELL_SIZE + (this.rows - 1) * this.GAP;
        
        const container = document.getElementById('grid-container');
        if (container) {
            container.style.width = `${finalGridW}px`;
            container.style.height = `${finalGridH}px`;
        }
    }

    calculateMaxY(widgets) {
        if (!Array.isArray(widgets) || widgets.length === 0) return 0;
        return widgets.reduce((max, w) => {
            if (w.isHidden) return max;
            return Math.max(max, (w.y || 0) + (w.h || 1));
        }, 0);
    }

    get columns() { return this.cols; }
    get rowsCount() { return this.rows; }
    get cellSize() { return this.CELL_SIZE; }
    get gap() { return this.GAP; }

    getRenderCoords(w) {
        return {
            x: Math.max(0, w.x || 0),
            y: Math.max(0, w.y || 0),
            w: Math.min(w.w || 1, this.cols),
            h: Math.max(1, w.h || 1)
        };
    }

    checkOverlap(w1, w2) {
        return (
            w1.x < (w2.x + w2.w) &&
            (w1.x + w1.w) > w2.x &&
            w1.y < (w2.y + w2.h) &&
            (w1.y + w1.h) > w2.y
        );
    }

    canFit(w, h, widgets, excludeId = null) {
        return w <= this.cols;
    }

    findFirstAvailablePos(w, h, widgets, excludeId = null) {
        if (w > this.cols) return null;
        
        // Search existing row capacity first
        for (let r = 0; r <= this.rows - h; r++) {
            for (let c = 0; c <= this.cols - w; c++) {
                const overlap = widgets.some(widget => 
                    widget.id !== excludeId && !widget.isHidden &&
                    !(c + w <= widget.x || c >= widget.x + widget.w || r + h <= widget.y || r >= widget.y + widget.h)
                );
                if (!overlap) return { x: c, y: r };
            }
        }

        // Seamless dynamic expansion: place on next free row below without artificial errors
        const maxY = this.calculateMaxY(widgets.filter(widget => widget.id !== excludeId));
        return { x: 0, y: maxY };
    }

    /**
     * Continuous Real-Time Collision Cascade Solver (v1.6)
     * Real-time calculation during drag/resize with physics-inspired downward displacement,
     * mutual swapping, and deterministic zero-overlap guarantee.
     */
    computeLiveDragLayout(activeId, targetX, targetY, targetW, targetH, snapshotWidgets) {
        if (!Array.isArray(snapshotWidgets) || snapshotWidgets.length === 0) {
            return { widgets: [], totalRows: this.rows };
        }

        const safeW = Math.max(1, Math.min(targetW, this.cols));
        const safeH = Math.max(1, targetH);
        const safeX = Math.max(0, Math.min(targetX, this.cols - safeW));
        const safeY = Math.max(0, targetY);

        // Deep clone snapshot to keep state immutable until final commit
        const layout = snapshotWidgets.map(w => ({
            ...w,
            x: Math.max(0, Math.min(w.x || 0, this.cols - (w.w || 1))),
            y: Math.max(0, w.y || 0),
            w: Math.max(1, Math.min(w.w || 1, this.cols)),
            h: Math.max(1, w.h || 1)
        }));

        const activeWidget = layout.find(w => w.id === activeId);
        if (!activeWidget) {
            return { widgets: layout, totalRows: this.rows };
        }

        const origX = activeWidget.x;
        const origY = activeWidget.y;
        const origW = activeWidget.w;
        const origH = activeWidget.h;

        // Position active widget at the desired drop target
        activeWidget.x = safeX;
        activeWidget.y = safeY;
        activeWidget.w = safeW;
        activeWidget.h = safeH;

        const others = layout.filter(w => w.id !== activeId && !w.isHidden);
        const collisions = others.filter(w => this.checkOverlap(w, activeWidget));

        // If no overlap, snap cleanly
        if (collisions.length === 0) {
            const maxRows = Math.max(this.minRows || 4, this.calculateMaxY(layout));
            return { widgets: layout, totalRows: maxRows };
        }

        // Fast mutual swap if exactly one item overlaps and fits cleanly into activeWidget's vacated slot
        if (collisions.length === 1) {
            const victim = collisions[0];
            const swapRect = { x: origX, y: origY, w: victim.w, h: victim.h };
            const canSwapIntoOrig = (
                swapRect.x >= 0 &&
                swapRect.x + swapRect.w <= this.cols &&
                !others.some(other => other.id !== victim.id && this.checkOverlap(swapRect, other)) &&
                !this.checkOverlap(swapRect, activeWidget)
            );

            if (canSwapIntoOrig) {
                victim.x = origX;
                victim.y = origY;
                const maxRows = Math.max(this.minRows || 4, this.calculateMaxY(layout));
                return { widgets: layout, totalRows: maxRows };
            }
        }

        // Multi-collision or swap not clean: run cascade downward displacement
        const placed = [activeWidget];
        const unplaced = new Set(others);
        const queue = [...collisions];

        // Sort initial queue by proximity to active widget
        queue.sort((a, b) => {
            const distA = Math.hypot(a.x - activeWidget.x, a.y - activeWidget.y);
            const distB = Math.hypot(b.x - activeWidget.x, b.y - activeWidget.y);
            return distA - distB;
        });

        const inQueue = new Set(queue.map(item => item.id));

        while (queue.length > 0) {
            const victim = queue.shift();
            inQueue.delete(victim.id);
            unplaced.delete(victim);

            // Candidate positions ranked by spatial naturalness:
            const candidatePositions = [];

            // 1. Directly below the activeWidget in victim's current column
            candidatePositions.push({ x: victim.x, y: activeWidget.y + activeWidget.h });

            // 2. To the right of activeWidget
            if (activeWidget.x + activeWidget.w + victim.w <= this.cols) {
                candidatePositions.push({ x: activeWidget.x + activeWidget.w, y: victim.y });
            }

            // 3. To the left of activeWidget
            if (activeWidget.x - victim.w >= 0) {
                candidatePositions.push({ x: activeWidget.x - victim.w, y: victim.y });
            }

            // 4. In activeWidget's vacated original slot
            if (origX + victim.w <= this.cols) {
                candidatePositions.push({ x: origX, y: origY });
            }

            // 5. General downward slots
            const searchLimit = Math.max(this.rows, activeWidget.y + activeWidget.h + 8);
            for (let r = 0; r <= searchLimit; r++) {
                for (let c = 0; c <= this.cols - victim.w; c++) {
                    candidatePositions.push({ x: c, y: r });
                }
            }

            // Find first candidate that has NO collision with any already placed widgets
            let bestPos = null;
            for (const pos of candidatePositions) {
                if (pos.x < 0 || pos.x + victim.w > this.cols || pos.y < 0) continue;
                const rect = { x: pos.x, y: pos.y, w: victim.w, h: victim.h };
                const collidesWithPlaced = placed.some(p => this.checkOverlap(rect, p));
                if (!collidesWithPlaced) {
                    bestPos = pos;
                    break;
                }
            }

            if (!bestPos) {
                // Failsafe: append at the very bottom
                const currentMaxY = placed.reduce((max, p) => Math.max(max, p.y + p.h), 0);
                bestPos = { x: 0, y: currentMaxY };
            }

            victim.x = bestPos.x;
            victim.y = bestPos.y;
            placed.push(victim);

            // Check if victim's new position collides with any remaining unplaced widgets
            const victimRect = { x: victim.x, y: victim.y, w: victim.w, h: victim.h };
            unplaced.forEach(candidate => {
                if (!inQueue.has(candidate.id) && this.checkOverlap(victimRect, candidate)) {
                    queue.push(candidate);
                    inQueue.add(candidate.id);
                }
            });
        }

        const totalRows = Math.max(this.minRows || 4, this.calculateMaxY(layout));
        return { widgets: layout, totalRows };
    }

    omniMagnetPush(activeWidget, widgets) {
        const activeId = activeWidget.id;
        const res = this.computeLiveDragLayout(activeId, activeWidget.x, activeWidget.y, activeWidget.w, activeWidget.h, widgets);
        
        res.widgets.forEach(resolved => {
            const target = widgets.find(w => w.id === resolved.id);
            if (target) {
                target.x = resolved.x;
                target.y = resolved.y;
                target.w = resolved.w;
                target.h = resolved.h;
            }
        });

        if (res.totalRows > this.rows) {
            this.rows = res.totalRows;
            this.syncContainerDimensions();
        }
        return true;
    }

    resolveAllFinalOverlaps(widgets) {
        const visible = widgets.filter(w => !w.isHidden);
        if (visible.length === 0) return;

        // Clamp boundaries
        visible.forEach(w => {
            const minW = w.type === 'search' ? 2 : 1;
            const maxH = w.type === 'search' ? 1 : 99;
            w.w = Math.max(minW, Math.min(w.w || 1, this.cols));
            w.h = Math.max(1, Math.min(w.h || 1, maxH));
            w.x = Math.max(0, Math.min(w.x || 0, this.cols - w.w));
            w.y = Math.max(0, w.y || 0);
        });

        const placed = [];
        for (const item of visible) {
            const hasConflict = placed.some(p => this.checkOverlap(item, p));
            if (!hasConflict) {
                placed.push(item);
            } else {
                let found = false;
                const maxSearchRows = Math.max(this.rows, this.calculateMaxY(placed) + item.h + 6);
                for (let r = 0; r <= maxSearchRows && !found; r++) {
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
                    item.y = this.calculateMaxY(placed);
                    item.x = 0;
                    placed.push(item);
                }
            }
        }

        const maxRows = Math.max(this.minRows || 4, this.calculateMaxY(visible));
        this.rows = maxRows;
        this.syncContainerDimensions();
    }
}
