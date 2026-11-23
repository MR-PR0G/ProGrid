/**
 * ProGrid Matrix Engine v1.6 LTS
 * Viewport-adaptive dynamic grid system with fluid magnet physics,
 * locality-first collision resolution, zero-overlap guarantee, and lightweight drag dynamics.
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

    /**
     * Locality-First Spatial Search:
     * Finds the nearest collision-free slot ordered strictly by proximity to (preferredX, preferredY),
     * heavily prioritizing staying in the same column and nearby rows.
     * Prevents widgets from jumping to far-away corners or arbitrary top rows.
     */
    findNearestAvailableSlot(w, h, preferredX, preferredY, placedWidgets, excludeId = null) {
        const safeW = Math.max(1, Math.min(w, this.cols));
        const safeH = Math.max(1, h);
        const prefX = Math.max(0, Math.min(preferredX, this.cols - safeW));
        const prefY = Math.max(0, preferredY);

        const candidates = [];
        const maxScanRows = Math.max(this.rows + 6, prefY + safeH + 8);

        for (let r = 0; r <= maxScanRows; r++) {
            for (let c = 0; c <= this.cols - safeW; c++) {
                const rect = { x: c, y: r, w: safeW, h: safeH };
                const collides = placedWidgets.some(p => 
                    p.id !== excludeId && !p.isHidden && this.checkOverlap(rect, p)
                );
                if (!collides) {
                    const colDist = Math.abs(c - prefX);
                    const rowDist = Math.abs(r - prefY);
                    
                    // Column jumping penalty (heavily keep in same column)
                    // Space directly above (r = prefY - safeH, c = prefX) gets a small bonus
                    const isDirectlyAbove = (c === prefX && r === prefY - safeH);
                    const isDirectlyBelow = (c === prefX && r === prefY + safeH);
                    
                    let cost = (colDist * 4) + (rowDist * 1.5);
                    if (isDirectlyAbove) cost -= 0.6;
                    if (isDirectlyBelow) cost -= 0.3;

                    candidates.push({ x: c, y: r, cost });
                }
            }
        }

        if (candidates.length === 0) {
            const maxY = this.calculateMaxY(placedWidgets);
            return { x: prefX, y: maxY };
        }

        candidates.sort((a, b) => a.cost - b.cost);
        return { x: candidates[0].x, y: candidates[0].y };
    }

    findFirstAvailablePos(w, h, widgets, excludeId = null) {
        if (w > this.cols) return null;
        
        // Search existing row capacity
        for (let r = 0; r <= this.rows - h; r++) {
            for (let c = 0; c <= this.cols - w; c++) {
                const overlap = widgets.some(widget => 
                    widget.id !== excludeId && !widget.isHidden &&
                    !(c + w <= widget.x || c >= widget.x + widget.w || r + h <= widget.y || r >= widget.y + widget.h)
                );
                if (!overlap) return { x: c, y: r };
            }
        }

        // Seamless dynamic expansion: place on next free row below
        const maxY = this.calculateMaxY(widgets.filter(widget => widget.id !== excludeId));
        return { x: 0, y: maxY };
    }

    /**
     * Continuous Real-Time Collision Cascade Solver (v1.6)
     * High-speed, locality-preserving collision resolver.
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

        // Fast mutual swap if exactly 1 item overlaps and fits cleanly into activeWidget's vacated slot
        // and is a direct immediate neighbor (prevent far-away teleportation)
        if (collisions.length === 1) {
            const victim = collisions[0];
            const swapRect = { x: origX, y: origY, w: victim.w, h: victim.h };
            const canSwap = (
                swapRect.x >= 0 &&
                swapRect.x + swapRect.w <= this.cols &&
                !others.some(other => other.id !== victim.id && this.checkOverlap(swapRect, other)) &&
                !this.checkOverlap(swapRect, activeWidget)
            );

            const isDirectNeighbor = (Math.abs(victim.x - origX) <= 2 && Math.abs(victim.y - origY) <= 2);

            if (canSwap && isDirectNeighbor) {
                victim.x = origX;
                victim.y = origY;
                const maxRows = Math.max(this.minRows || 4, this.calculateMaxY(layout));
                return { widgets: layout, totalRows: maxRows };
            }
        }

        // Multi-collision or downward push:
        // Placed set begins with the active widget
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

            // Find nearest slot using the proximity cost function
            const bestSlot = this.findNearestAvailableSlot(victim.w, victim.h, victim.x, victim.y, placed, victim.id);
            victim.x = bestSlot.x;
            victim.y = bestSlot.y;
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

        // Stable top-to-bottom, left-to-right sort
        visible.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        const placed = [];
        for (const item of visible) {
            const hasConflict = placed.some(p => this.checkOverlap(item, p));
            if (!hasConflict) {
                placed.push(item);
            } else {
                // Find nearest slot using proximity cost function - NEVER jump to top-right
                const bestSlot = this.findNearestAvailableSlot(item.w, item.h, item.x, item.y, placed, item.id);
                item.x = bestSlot.x;
                item.y = bestSlot.y;
                placed.push(item);
            }
        }

        const maxRows = Math.max(this.minRows || 4, this.calculateMaxY(visible));
        this.rows = maxRows;
        this.syncContainerDimensions();
    }
}
