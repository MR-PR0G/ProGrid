import { GridEngine } from './grid.js';
import { StorageEngine } from './storage.js';
import { widgetHub } from './hub.js';
import { WALLPAPER_COLLECTION } from './wallpapers.js';

const DYNAMIC_WIDGET_LIST = ['shortcut', 'search', 'checklist', 'folder', 'clock', 'notes'];

async function loadSystemWidgets() {
    for (const name of DYNAMIC_WIDGET_LIST) {
        try { await import(`../widgets/${name}.js`); } catch (e) { console.error(e); }
    }
    try { await widgetHub.bootInstalledWidgets(); } catch (e) { console.error(e); }
}

let state = { editMode: false, blurValue: 27, presetBg: '1', theme: 'dark', customBg: null, widgets: [] };
window.appState = state;

const grid = new GridEngine();
let container, blurOverlay, ghost, deleteZone, folderOverlay, dynamicBgLayer;

let initialWidgetsState = null;
let currentShapeSelection = '20px';
let currentIconBgSelection = 'transparent';
let currentWidgetBgSelection = '#ffffff';
let touchStartY = 0;
let bgLongPressTimeout = null;
let potentialMergeTargetId = null;
let rAFActive = false;
let currentColumnsCount = 8;
let activeQuickMenuWidget = null;

async function init() {
    container = document.getElementById('grid-container');
    blurOverlay = document.getElementById('blur-overlay');
    ghost = document.getElementById('ghost-guide');
    deleteZone = document.getElementById('delete-zone');
    folderOverlay = document.getElementById('folder-overlay-view');
    dynamicBgLayer = document.getElementById('dynamic-bg-layer');

    await loadSystemWidgets();
    const loaded = StorageEngine.load();
    
    if (loaded && loaded.widgets && loaded.widgets.length > 0) {
        state.blurValue = loaded.blurValue ?? 27;
        state.presetBg = loaded.presetBg || '1';
        state.theme = loaded.theme || 'dark';
        state.customBg = loaded.customBg || null;
        state.widgets = loaded.widgets;
    } else {
        state.blurValue = 27;
        state.presetBg = "1";
        state.theme = "dark";
        state.widgets = [
            { id: "w-clock-default", type: "clock", x: 0, y: 0, w: 2, h: 1, format24: true, showDate: true, isGlass: true, bg: "#ffffff", idealLayout: { x: 0, y: 0, w: 2, h: 1, baseCols: 8 }, isHidden: false, centerDist: 0.5 },
            { id: "w-1781773568073", type: "search", x: 2, y: 0, w: 6, h: 1, engine: "google", placeholder: "Search...", isGlass: true, bg: "#ffffff", idealLayout: { x: 2, y: 0, w: 6, h: 1, baseCols: 8 }, isHidden: false, centerDist: 1 },
            { id: "w-1781791807875", type: "shortcut", x: 0, y: 1, w: 2, h: 1, title: "Give Star This Project", url: "https://github.com/MR-PR0G", icon: "", iconBg: "#f6d32d", shape: "50%", isGlass: true, bg: "#f6d32d", idealLayout: { x: 0, y: 1, w: 2, h: 1, baseCols: 8 }, isHidden: false, centerDist: 2 },
            { id: "w-1781791038045", type: "folder", x: 2, y: 1, w: 2, h: 2, title: "Google", url: "https://mail.google.com/mail/", icon: "", iconBg: "transparent", shape: "20px", isGlass: true, bg: "#ffffff", idealLayout: { x: 2, y: 1, w: 2, h: 2, baseCols: 8 }, isHidden: false, centerDist: 2.915, children: [
                { id: "ch-1781791128373-2", type: "shortcut", title: "Youtube", url: "https://www.youtube.com/", icon: "", shape: "20px", iconBg: "transparent" },
                { id: "ch-1781791401512", type: "shortcut", title: "Gmail", url: "https://mail.google.com/mail/", icon: "", shape: "20px", iconBg: "transparent" },
                { id: "ch-1781791526637", type: "shortcut", title: "Gemini", url: "https://gemini.google.com/app", icon: "", shape: "20px", iconBg: "transparent" },
                { id: "ch-1781791575443", type: "shortcut", title: "Drive", url: "https://drive.google.com/drive/", icon: "", shape: "20px", iconBg: "transparent" },
                { id: "ch-1781791634325", type: "shortcut", title: "Translate", url: "https://translate.google.com/", icon: "", shape: "20px", iconBg: "transparent" },
                { id: "ch-1781791711956", type: "shortcut", title: "Google", url: "https://google.com", icon: "", shape: "20px", iconBg: "transparent" },
                { id: "ch-1781791800065", type: "shortcut", title: "Cloud", url: "https://cloud.google.com/appengine", icon: "", shape: "20px", iconBg: "transparent" }
            ]}
        ];
    }

    grid.updateMetrics();
    currentColumnsCount = grid.columns;
    state.widgets.forEach(w => {
        if (w.w > currentColumnsCount) {
            w.w = currentColumnsCount;
            w.x = 0;
        }
        if (w.x + w.w > currentColumnsCount) {
            w.x = Math.max(0, currentColumnsCount - w.w);
        }
        if (!w.idealLayout) w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: currentColumnsCount };
    });

    grid.resolveAllFinalOverlaps(state.widgets);
    renderGrid();
    setupGlobalEvents();
    setupBackgroundActivationSensors();
    applyGlobalStyles();
    setupWidgetDrawer();
    setupWallpaperGallery();
    setupQuickMenuListeners();
}

function applyGlobalStyles() {
    if (blurOverlay) {
        blurOverlay.style.backdropFilter = `blur(${state.blurValue}px)`;
        blurOverlay.style.webkitBackdropFilter = `blur(${state.blurValue}px)`;
    }
    const slider = document.getElementById('blur-slider');
    if (slider) slider.value = state.blurValue;
    
    document.body.classList.toggle('light-mode', state.theme === 'light');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.checked = state.theme === 'light';

    document.querySelectorAll('.bg-thumb').forEach(t => t.style.borderColor = 'transparent');
    const activeThumb = document.querySelector(`.bg-thumb[data-preset="${state.presetBg}"]`);
    if (activeThumb) activeThumb.style.borderColor = 'var(--text-primary)';

    if (state.presetBg === 'custom' && state.customBg) {
        if (dynamicBgLayer) {
            dynamicBgLayer.className = 'bg-layer';
            dynamicBgLayer.style.backgroundImage = `url("${state.customBg}")`;
            dynamicBgLayer.style.backgroundSize = 'cover';
            dynamicBgLayer.style.backgroundPosition = 'center center';
            dynamicBgLayer.style.backgroundRepeat = 'no-repeat';
        }
    } else {
        if (dynamicBgLayer) {
            dynamicBgLayer.style.backgroundImage = 'none';
            dynamicBgLayer.className = `bg-layer bg-dynamic`;
            dynamicBgLayer.style.background = `var(--bg-preset-${state.presetBg})`;
        }
    }
}

function renderGrid() {
    if (!container) return;
    const oldCols = currentColumnsCount;
    grid.updateMetrics();
    currentColumnsCount = grid.columns;

    grid.resolveAllFinalOverlaps(state.widgets, oldCols);
    
    Array.from(container.children).forEach(child => {
        if (child.id !== 'ghost-guide' && !child.classList.contains('grid-cell-visual')) {
            if (child._widgetInstance && child._widgetInstance.onDestroy) {
                try { child._widgetInstance.onDestroy(child); } catch (e) { console.error(e); }
            }
            child.remove();
        }
    });

    document.querySelectorAll('.grid-cell-visual').forEach(c => c.remove());
    for (let r = 0; r < grid.rowsCount; r++) {
        for (let c = 0; c < grid.columns; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell-visual';
            cell.style.width = `${grid.cellSize}px`;
            cell.style.height = `${grid.cellSize}px`;
            cell.style.left = `${c * (grid.cellSize + grid.gap)}px`;
            cell.style.top = `${r * (grid.cellSize + grid.gap)}px`;
            container.appendChild(cell);
        }
    }

    state.widgets.forEach(w => {
        if (w.isHidden) return;
        if (window.WidgetGlobals && window.WidgetGlobals.get(w.type)) {
            createWidgetDOM(w);
        }
    });

    updateEditModeScale();
}

function hexToRgba(hex, alpha = 0.1) {
    if (!hex || !hex.startsWith('#')) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createWidgetDOM(w) {
    const coords = grid.getRenderCoords(w);
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-wrapper';
    wrapper.id = w.id;
    wrapper.style.width = `${coords.w * grid.cellSize + (coords.w - 1) * grid.gap}px`;
    wrapper.style.height = `${coords.h * grid.cellSize + (coords.h - 1) * grid.gap}px`;
    wrapper.style.left = `${coords.x * (grid.cellSize + grid.gap)}px`;
    wrapper.style.top = `${coords.y * (grid.cellSize + grid.gap)}px`;
    
    if (w.isGlass) {
        wrapper.style.background = hexToRgba(w.bg || '#ffffff', state.theme === 'light' ? 0.3 : 0.1);
        wrapper.style.backdropFilter = 'blur(20px)';
        wrapper.style.webkitBackdropFilter = 'blur(20px)';
        wrapper.style.border = '1px solid var(--panel-border)';
    } else {
        wrapper.style.background = w.bg || 'var(--panel-bg)';
        wrapper.style.border = '1px solid var(--panel-border)';
    }

    const content = document.createElement('div');
    content.className = 'widget-content';
    const WidgetClass = window.WidgetGlobals.get(w.type);
    let instance = null;
    if (WidgetClass) {
        instance = new WidgetClass(w);
        content.innerHTML = instance.render();
    }
    wrapper.appendChild(content);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    wrapper.appendChild(resizeHandle);
    wrapper._widgetInstance = instance;
    container.appendChild(wrapper);

    if (instance && instance.postRender) {
        instance.postRender(wrapper);
    }
    attachInteractionEngine(wrapper, w, instance);
}

function updateEditModeScale() {
    const scaleWrapper = document.getElementById('grid-scale-wrapper');
    const container = document.getElementById('grid-container');
    if (!scaleWrapper || !container) return;

    if (!state.editMode) {
        scaleWrapper.style.transform = '';
        return;
    }

    const isMobile = window.innerWidth < 640;
    const topMargin = isMobile ? 50 : 56;
    const bottomMargin = isMobile ? 220 : 236;
    const availH = Math.max(180, window.innerHeight - (topMargin + bottomMargin));
    const availW = Math.max(260, window.innerWidth - (isMobile ? 20 : 36));

    const gridW = container.offsetWidth || 1;
    const gridH = container.offsetHeight || 1;

    const scaleX = availW / gridW;
    const scaleY = availH / gridH;
    let targetScale = Math.min(scaleX, scaleY, 0.82);
    targetScale = Math.max(0.40, Math.min(0.82, targetScale));

    scaleWrapper.style.transform = `scale(${targetScale.toFixed(3)})`;
}

function getWrapperScale() {
    const scaleWrapper = document.getElementById('grid-scale-wrapper');
    if (!scaleWrapper) return 1;
    const style = window.getComputedStyle(scaleWrapper);
    const transform = style.transform || style.webkitTransform;
    if (transform && transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        return matrix.a || 1;
    }
    return 1;
}

function updateGhost(pos) {
    if (!ghost) return;
    const coords = grid.getRenderCoords(pos);
    ghost.style.width = `${coords.w * grid.cellSize + (coords.w - 1) * grid.gap}px`;
    ghost.style.height = `${coords.h * grid.cellSize + (coords.h - 1) * grid.gap}px`;
    ghost.style.left = `${coords.x * (grid.cellSize + grid.gap)}px`;
    ghost.style.top = `${coords.y * (grid.cellSize + grid.gap)}px`;
}

function checkCollisionWithDeleteZone(clientX, clientY) {
    if (!deleteZone) return false;
    const dzRect = deleteZone.getBoundingClientRect();
    const fuzz = 15;
    return (
        clientX >= (dzRect.left - fuzz) &&
        clientX <= (dzRect.right + fuzz) &&
        clientY >= (dzRect.top - fuzz) &&
        clientY <= (dzRect.bottom + fuzz)
    );
}

function attachInteractionEngine(el, w, instance) {
    let initialX, initialY, startW, startH;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let isDragging = false;
    let isResizing = false;
    let widgetLongPressTimer = null;
    let isPointerMoved = false;

    const meta = window.WidgetGlobals.getMetadata(w.type) || { minW: 1, minH: 1, maxW: 4, maxH: 4 };
    if (w.type === 'search') {
        meta.minW = 2; meta.maxH = 1; meta.minH = 1; meta.maxW = 99;
    }
    
    let minW = meta.minW || 1; let minH = meta.minH || 1;
    let maxW = meta.maxW || 4; let maxH = meta.maxH || 4;

    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (state.editMode) {
            openModal(w);
        } else {
            if (navigator.vibrate) navigator.vibrate(50);
            showWidgetQuickMenu(w, el, { x: e.clientX, y: e.clientY });
        }
    });

    el.addEventListener('pointerdown', (e) => {
        initialX = e.clientX;
        initialY = e.clientY;
        isPointerMoved = false;

        if (!state.editMode) {
            // پشتیبانی از لمس طولانی برای باز کردن منوی گزینه‌های هوشمند ویجت
            widgetLongPressTimer = setTimeout(() => {
                if (!isPointerMoved) {
                    if (navigator.vibrate) navigator.vibrate(50);
                    showWidgetQuickMenu(w, el, { x: initialX, y: initialY });
                }
            }, 460);
            return;
        }

        if (w.type === 'checklist') {
            if (e.target.closest('.checklist-item') || e.target.closest('.checklist-add') || e.target.closest('.checklist-input')) return;
        }
        
        if (w.type === 'shortcut' || w.type === 'folder') {
            if (e.target.closest('a')) e.preventDefault();
        }

        el.setPointerCapture(e.pointerId);
        initialWidgetsState = JSON.parse(JSON.stringify(state.widgets));

        const scale = getWrapperScale();

        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            el.classList.add('resizing');
            startW = el.offsetWidth;
            startH = el.offsetHeight;
            if (ghost) ghost.classList.add('active');
            updateGhost(w);
        } else {
            isDragging = true;
            el.classList.add('dragging');
            if (ghost) ghost.classList.add('active');
            
            const rect = el.getBoundingClientRect();
            dragOffsetX = (e.clientX - rect.left) / scale;
            dragOffsetY = (e.clientY - rect.top) / scale;
            
            updateGhost(w);
        }
        e.stopPropagation();
    });

    el.addEventListener('pointermove', (e) => {
        if (!state.editMode) {
            if (Math.hypot(e.clientX - initialX, e.clientY - initialY) > 10) {
                isPointerMoved = true;
                if (widgetLongPressTimer) clearTimeout(widgetLongPressTimer);
            }
            return;
        }

        if (!isDragging && !isResizing) return;

        if (rAFActive) return;
        rAFActive = true;

        requestAnimationFrame(() => {
            rAFActive = false;
            grid.updateMetrics();
            maxW = w.type === 'search' ? grid.columns : Math.min(meta.maxW || 4, grid.columns);
            maxH = Math.min(meta.maxH || 4, grid.rowsCount);

            const containerBounds = container.getBoundingClientRect();
            const scale = getWrapperScale();

            if (isDragging) {
                const targetLeft = ((e.clientX - containerBounds.left) / scale) - dragOffsetX;
                const targetTop = ((e.clientY - containerBounds.top) / scale) - dragOffsetY;

                el.style.left = `${targetLeft}px`;
                el.style.top = `${targetTop}px`;

                if (checkCollisionWithDeleteZone(e.clientX, e.clientY)) {
                    if (deleteZone) deleteZone.classList.add('hovered');
                    if (ghost) ghost.classList.remove('active');
                } else {
                    if (deleteZone) deleteZone.classList.remove('hovered');
                    if (ghost) ghost.classList.add('active');
                }

                let liveX = Math.round(targetLeft / (grid.cellSize + grid.gap));
                let liveY = Math.round(targetTop / (grid.cellSize + grid.gap));
                
                let effectiveW = Math.max(minW, Math.min(w.w, grid.columns));
                let effectiveH = Math.max(minH, Math.min(w.h, grid.rowsCount));
                
                liveX = Math.max(0, Math.min(liveX, grid.columns - effectiveW));
                liveY = Math.max(0, Math.min(liveY, grid.rowsCount - effectiveH));

                potentialMergeTargetId = null;
                document.querySelectorAll('.widget-wrapper:not(.dragging)').forEach(otherEl => {
                    const r = otherEl.getBoundingClientRect();
                    if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
                        const targetWidget = state.widgets.find(item => item.id === otherEl.id);
                        if (targetWidget && (targetWidget.type === 'shortcut' || targetWidget.type === 'folder') && w.type === 'shortcut') {
                            potentialMergeTargetId = targetWidget.id;
                            otherEl.classList.add('folder-merge-glow');
                        }
                    } else {
                        otherEl.classList.remove('folder-merge-glow');
                    }
                });

                if (!potentialMergeTargetId && initialWidgetsState) {
                    let tempWidgets = JSON.parse(JSON.stringify(initialWidgetsState));
                    let activeInState = tempWidgets.find(item => item.id === w.id);
                    if (activeInState) {
                        activeInState.w = effectiveW;
                        activeInState.h = effectiveH;
                        activeInState.x = liveX;
                        activeInState.y = liveY;
                        
                        const successfulPush = grid.omniMagnetPush(activeInState, tempWidgets);
                        if (successfulPush) {
                            updateGhost({ id: w.id, x: liveX, y: liveY, w: effectiveW, h: effectiveH });
                            tempWidgets.forEach(tw => {
                                if (tw.id !== w.id && !tw.isHidden) {
                                    const realEl = document.getElementById(tw.id);
                                    if (realEl && !realEl.classList.contains('dragging') && !realEl.classList.contains('resizing')) {
                                        realEl.style.left = `${tw.x * (grid.cellSize + grid.gap)}px`;
                                        realEl.style.top = `${tw.y * (grid.cellSize + grid.gap)}px`;
                                    }
                                }
                            });
                        } else if (ghost) {
                            const lastGhostX = Math.round(parseInt(ghost.style.left) / (grid.cellSize + grid.gap));
                            const lastGhostY = Math.round(parseInt(ghost.style.top) / (grid.cellSize + grid.gap));
                            updateGhost({ id: w.id, x: lastGhostX, y: lastGhostY, w: effectiveW, h: effectiveH });
                        }
                    }
                } else {
                    updateGhost({ id: w.id, x: liveX, y: liveY, w: effectiveW, h: effectiveH });
                }

            } else if (isResizing) {
                const deltaX = (e.clientX - initialX) / scale;
                const deltaY = (e.clientY - initialY) / scale;
                
                let rawW = startW + deltaX;
                let rawH = startH + deltaY;

                el.style.width = `${Math.max(50, rawW)}px`;
                el.style.height = `${Math.max(50, rawH)}px`;

                let gridW = Math.max(minW, Math.min(maxW, Math.round((rawW - grid.gap) / (grid.cellSize + grid.gap))));
                let gridH = Math.max(minH, Math.min(maxH, Math.round((rawH - grid.gap) / (grid.cellSize + grid.gap))));

                let isAtLimit = false;
                if ((rawW > (maxW * (grid.cellSize + grid.gap) - grid.gap + 15) && gridW >= maxW) ||
                    (rawH > (maxH * (grid.cellSize + grid.gap) - grid.gap + 15) && gridH >= maxH) ||
                    (w.x + gridW >= grid.columns && rawW > ((grid.columns - w.x) * (grid.cellSize + grid.gap) - grid.gap + 15)) ||
                    (w.y + gridH >= grid.rowsCount && rawH > ((grid.rowsCount - w.y) * (grid.cellSize + grid.gap) - grid.gap + 15))) {
                    isAtLimit = true;
                }

                if (isAtLimit) {
                    el.classList.add('max-limit-reached');
                    if (ghost) ghost.classList.add('max-limit-reached');
                } else {
                    el.classList.remove('max-limit-reached');
                    if (ghost) ghost.classList.remove('max-limit-reached');
                }

                if (w.x + gridW > grid.columns) gridW = grid.columns - w.x;
                if (w.y + gridH > grid.rowsCount) gridH = grid.rowsCount - w.y;

                if (initialWidgetsState) {
                    let tempWidgets = JSON.parse(JSON.stringify(initialWidgetsState));
                    let activeInState = tempWidgets.find(item => item.id === w.id);
                    if (activeInState) {
                        activeInState.w = gridW;
                        activeInState.h = gridH;
                        const successfulPush = grid.omniMagnetPush(activeInState, tempWidgets);
                        if (successfulPush) {
                            updateGhost({ id: w.id, x: activeInState.x, y: activeInState.y, w: gridW, h: gridH });
                            tempWidgets.forEach(tw => {
                                if (tw.id !== w.id && !tw.isHidden) {
                                    const realEl = document.getElementById(tw.id);
                                    if (realEl && !realEl.classList.contains('dragging') && !realEl.classList.contains('resizing')) {
                                        realEl.style.left = `${tw.x * (grid.cellSize + grid.gap)}px`;
                                        realEl.style.top = `${tw.y * (grid.cellSize + grid.gap)}px`;
                                    }
                                }
                            });
                        } else if (ghost) {
                            const lastGhostW = Math.round((parseInt(ghost.style.width) + grid.gap) / (grid.cellSize + grid.gap));
                            const lastGhostH = Math.round((parseInt(ghost.style.height) + grid.gap) / (grid.cellSize + grid.gap));
                            updateGhost({ id: w.id, x: activeInState.x, y: activeInState.y, w: lastGhostW, h: lastGhostH });
                        }
                    }
                }
            }
        });
    });

    el.addEventListener('pointerup', (e) => {
        if (widgetLongPressTimer) clearTimeout(widgetLongPressTimer);
        if (!state.editMode) return;
        el.releasePointerCapture(e.pointerId);
        
        el.classList.remove('dragging');
        el.classList.remove('resizing');
        el.classList.remove('burn-effect');
        el.classList.remove('max-limit-reached');
        if (ghost) {
            ghost.classList.remove('active');
            ghost.classList.remove('max-limit-reached');
        }

        if (deleteZone && deleteZone.classList.contains('hovered')) {
            deleteZone.classList.remove('hovered');
            state.widgets = state.widgets.filter(item => item.id !== w.id);
            StorageEngine.save(state);
            renderGrid();
            return;
        }

        if (potentialMergeTargetId) {
            const target = state.widgets.find(item => item.id === potentialMergeTargetId);
            if (target) {
                if (target.type === 'shortcut') {
                    target.type = 'folder';
                    target.w = 2;
                    target.h = 2;
                    target.title = "Folder";
                    target.children = [
                        { id: `ch-${Date.now()}-1`, type: 'shortcut', title: target.title || 'Link', url: target.url, icon: target.icon || '', shape: target.shape || '20px', iconBg: target.iconBg || 'transparent' },
                        { id: `ch-${Date.now()}-2`, type: 'shortcut', title: w.title || 'Link', url: w.url, icon: w.icon || '', shape: w.shape || '20px', iconBg: w.iconBg || 'transparent' }
                    ];
                } else if (target.type === 'folder') {
                    if (!target.children) target.children = [];
                    target.children.push({
                        id: `ch-${Date.now()}`, type: 'shortcut', title: w.title || 'Link', url: w.url, icon: w.icon || '', shape: w.shape || '20px', iconBg: w.iconBg || 'transparent'
                    });
                }
                state.widgets = state.widgets.filter(item => item.id !== w.id);
                potentialMergeTargetId = null;
                grid.resolveAllFinalOverlaps(state.widgets);
                StorageEngine.save(state);
                renderGrid();
                return;
            }
        }

        if (isDragging) {
            isDragging = false;
            if (ghost) {
                w.x = Math.round(parseInt(ghost.style.left) / (grid.cellSize + grid.gap));
                w.y = Math.round(parseInt(ghost.style.top) / (grid.cellSize + grid.gap));
            }
        } else if (isResizing) {
            isResizing = false;
            if (ghost) {
                w.w = Math.round((parseInt(ghost.style.width) + grid.gap) / (grid.cellSize + grid.gap));
                w.h = Math.round((parseInt(ghost.style.height) + grid.gap) / (grid.cellSize + grid.gap));
                w.w = Math.max(minW, Math.min(maxW, w.w));
                w.h = Math.max(minH, Math.min(maxH, w.h));
            }
            if (instance && instance.onResize) {
                try { instance.onResize(w.w, w.h, el); } catch (err) { console.error(err); }
            }
        }

        w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: grid.columns };

        grid.omniMagnetPush(w, state.widgets);
        grid.resolveAllFinalOverlaps(state.widgets);
        StorageEngine.save(state);
        renderGrid();
    });

    el.addEventListener('pointercancel', () => {
        if (widgetLongPressTimer) clearTimeout(widgetLongPressTimer);
    });
}

function setupBackgroundActivationSensors() {
    let touchStartedOnBg = false;

    window.addEventListener('mousedown', (e) => {
        if (state.editMode || (e.target !== container && e.target !== document.getElementById('app-container') && e.target !== document.getElementById('grid-scale-wrapper'))) return;
        bgLongPressTimeout = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            window.toggleEditMode(true);
        }, 700);
    });
    window.addEventListener('mouseup', () => { if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout); });
    
    window.addEventListener('touchstart', (e) => {
        if (state.editMode) return;
        touchStartedOnBg = (
            e.target === container ||
            e.target === document.getElementById('app-container') ||
            e.target === document.getElementById('grid-scale-wrapper') ||
            e.target === dynamicBgLayer
        );
        if (e.touches && e.touches[0]) {
            touchStartY = e.touches[0].clientY;
        }
        if (touchStartedOnBg) {
            bgLongPressTimeout = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(50);
                window.toggleEditMode(true);
            }, 650);
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (state.editMode) return;
        if (touchStartedOnBg && e.touches && e.touches[0]) {
            let diffY = touchStartY - e.touches[0].clientY;
            if (diffY > 90) {
                if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout);
                if (navigator.vibrate) navigator.vibrate(50);
                window.toggleEditMode(true);
                touchStartedOnBg = false;
            }
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout);
        touchStartedOnBg = false;
    });
}

function updateColorUI(target, color) {
    document.querySelectorAll(`.color-swatch-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
    const pickerWrapper = document.querySelector(`.color-picker-wrapper[data-target="${target}"]`);
    if (pickerWrapper) pickerWrapper.classList.remove('active');

    const predefinedBtn = document.querySelector(`.color-swatch-btn[data-target="${target}"][data-color="${color}"]`);
    if (predefinedBtn) {
        predefinedBtn.classList.add('active');
    } else if (pickerWrapper && color !== 'transparent') {
        pickerWrapper.classList.add('active');
        pickerWrapper.querySelector('input').value = color;
    }
}

let isInputActive = false;
document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select')) isInputActive = true;
});
document.addEventListener('focusout', (e) => {
    if (e.target.matches('input, textarea, select')) {
        setTimeout(() => { isInputActive = false; }, 350);
    }
});

function setupGlobalEvents() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        // جلوگیری از تغییرات ناخواسته ساختار گرید هنگام بالا آمدن کیبورد در گوشی
        if (isInputActive) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderGrid();
        }, 120);
    });

    const doneBtn = document.getElementById('done-btn');
    if (doneBtn) doneBtn.addEventListener('click', () => window.toggleEditMode(false));

    if (folderOverlay) {
        folderOverlay.addEventListener('click', (e) => {
            if (e.target === folderOverlay) folderOverlay.style.display = 'none';
        });
    }

    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            const targetTab = document.getElementById(`tab-${e.target.getAttribute('data-tab')}`);
            if (targetTab) targetTab.classList.add('active');
        });
    });

    document.querySelectorAll('.bg-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            state.presetBg = thumb.getAttribute('data-preset');
            applyGlobalStyles();
            StorageEngine.save(state);
        });
    });

    const customBgInput = document.getElementById('custom-bg-input');
    const customBgBtn = document.getElementById('custom-bg-btn');
    if (customBgBtn && customBgInput) {
        customBgBtn.addEventListener('click', () => customBgInput.click());
        customBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    state.customBg = ev.target.result;
                    state.presetBg = 'custom';
                    applyGlobalStyles();
                    StorageEngine.save(state);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            state.theme = e.target.checked ? 'light' : 'dark';
            applyGlobalStyles();
            StorageEngine.save(state);
        });
    }

    const slider = document.getElementById('blur-slider');
    if (slider) {
        slider.addEventListener('input', (e) => {
            state.blurValue = e.target.value;
            applyGlobalStyles();
            StorageEngine.save(state);
        });
    }

    document.querySelectorAll('.color-swatch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            const color = btn.getAttribute('data-color');
            if (target === 'iconBg') currentIconBgSelection = color;
            if (target === 'widgetBg') currentWidgetBgSelection = color;
            updateColorUI(target, color);
        });
    });

    document.querySelectorAll('.color-picker-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            const target = wrapper.getAttribute('data-target');
            const input = wrapper.querySelector('input');
            const color = input.value;
            if (target === 'iconBg') currentIconBgSelection = color;
            if (target === 'widgetBg') currentWidgetBgSelection = color;
            updateColorUI(target, color);
        });

        const input = wrapper.querySelector('input');
        input.addEventListener('input', (e) => {
            const target = wrapper.getAttribute('data-target');
            const color = e.target.value;
            if (target === 'iconBg') currentIconBgSelection = color;
            if (target === 'widgetBg') currentWidgetBgSelection = color;
            updateColorUI(target, color);
        });
    });

    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('modal-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveWidgetSettings);
    
    const delBtn = document.getElementById('modal-delete-btn');
    if (delBtn) delBtn.addEventListener('click', deleteCurrentWidget);

    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentShapeSelection = btn.getAttribute('data-shape');
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    // PWA Install Prompt Support
    let deferredPrompt = null;
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaInstallBtn) pwaInstallBtn.style.display = 'inline-flex';
    });

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                alert("To install on iOS: Tap the Share button and select 'Add to Home Screen'.");
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                pwaInstallBtn.style.display = 'none';
            }
            deferredPrompt = null;
        });
    }

    // Export / Backup JSON Configuration
    const exportBtn = document.getElementById('export-cfg-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `progrid-backup-${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
        });
    }

    // Import / Restore JSON Configuration
    const importBtn = document.getElementById('import-cfg-btn');
    const importInput = document.getElementById('import-cfg-input');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const parsed = JSON.parse(ev.target.result);
                    if (parsed && Array.isArray(parsed.widgets)) {
                        state.widgets = parsed.widgets;
                        state.blurValue = parsed.blurValue ?? state.blurValue;
                        state.presetBg = parsed.presetBg || state.presetBg;
                        state.theme = parsed.theme || state.theme;
                        state.customBg = parsed.customBg || null;
                        StorageEngine.save(state);
                        applyGlobalStyles();
                        renderGrid();
                        alert("Settings restored successfully!");
                    } else {
                        alert("Invalid backup file format!");
                    }
                } catch (err) {
                    alert("Error parsing JSON file!");
                }
            };
            reader.readAsText(file);
        });
    }

    // Close Modals / Exit Edit Mode on Escape Key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-overlay');
            const infoModal = document.getElementById('widget-info-modal');
            const qmMenu = document.getElementById('widget-quick-menu');
            if (qmMenu && qmMenu.style.display === 'flex') {
                closeWidgetQuickMenu();
            } else if (infoModal && infoModal.classList.contains('active')) {
                closeWidgetInfo();
            } else if (modal && modal.style.display === 'flex') {
                closeModal();
            } else if (folderOverlay && folderOverlay.classList.contains('active')) {
                window.closeFolderPopup();
            } else if (state.editMode) {
                window.toggleEditMode(false);
            }
        }
    });
}

window.updateWidgetConfigDirectly = function(id, partialConfig) {
    const w = state.widgets.find(item => item.id === id);
    if (w) {
        Object.assign(w, partialConfig);
        StorageEngine.save(state);
        renderGrid();
    }
};

window.toggleEditMode = function(forceState = null) {
    closeWidgetQuickMenu();
    closeWidgetInfo();
    state.editMode = forceState !== null ? forceState : !state.editMode;
    document.body.classList.toggle('edit-mode', state.editMode);
    if (!state.editMode) {
        closeModal();
        grid.resolveAllFinalOverlaps(state.widgets);
    }
    renderGrid();
    updateEditModeScale();
};

let currentDrawerSearch = '';
let activeDrawerSubtab = 'installed';

function addWidgetDirectly(type) {
    const meta = window.WidgetGlobals ? window.WidgetGlobals.getMetadata(type) : null;
    if (!meta) return;

    grid.updateMetrics();
    const effW = type === 'search' ? 2 : Math.min(meta.defaultW || 1, grid.columns);
    const effH = type === 'search' ? 1 : Math.min(meta.defaultH || 1, grid.rowsCount);

    const pos = grid.findFirstAvailablePos(effW, effH, state.widgets);
    if (!pos) {
        alert("No space available on grid! Rearrange or resize existing widgets.");
        return;
    }

    const newWidget = {
        id: `w-${Date.now()}`,
        type: type,
        x: pos.x,
        y: pos.y,
        w: effW,
        h: effH,
        ...JSON.parse(JSON.stringify(meta.defaultConfig || {}))
    };
    newWidget.idealLayout = { x: newWidget.x, y: newWidget.y, w: newWidget.w, h: newWidget.h, baseCols: grid.columns };
    
    state.widgets.push(newWidget);
    grid.resolveAllFinalOverlaps(state.widgets);
    StorageEngine.save(state);
    renderGrid();

    if (navigator.vibrate) navigator.vibrate(35);
}

function renderInstalledDrawerList() {
    const listEl = document.getElementById('store-installed-list');
    const badgeEl = document.getElementById('installed-count-pill');
    if (!listEl || !window.WidgetGlobals) return;

    const allMetas = window.WidgetGlobals.getAllMetadata().filter(m => m.type !== 'folder');
    if (badgeEl) badgeEl.textContent = allMetas.length;

    const q = currentDrawerSearch.toLowerCase().trim();
    const filtered = allMetas.filter(m => {
        if (!q) return true;
        const name = (m.label || m.name || '').toLowerCase();
        const type = (m.type || '').toLowerCase();
        const desc = (m.description || '').toLowerCase();
        return name.includes(q) || type.includes(q) || desc.includes(q);
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div style="padding: 16px; font-size: 12px; color: var(--text-secondary); text-align: center; width: 100%;">
                No installed widgets matching "${currentDrawerSearch}".
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(m => {
        html += `
            <div class="store-card" data-type="${m.type}">
                <div class="store-card-header">
                    <div class="store-card-icon">${m.icon || '📦'}</div>
                    <div class="store-card-meta">
                        <span class="store-card-title">${m.label || m.name}</span>
                        <span class="store-card-size">${m.defaultW || 1}×${m.defaultH || 1}</span>
                    </div>
                </div>
                <div class="store-card-actions">
                    <button class="store-add-btn" data-type="${m.type}">
                        <span>+ Add</span>
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.store-card').forEach(card => {
        setupStoreDrag(card);
    });

    listEl.querySelectorAll('.store-add-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            addWidgetDirectly(type);
        });
    });
}

async function renderMarketplaceDrawerList() {
    const listEl = document.getElementById('store-marketplace-list');
    if (!listEl) return;

    listEl.innerHTML = `
        <div style="padding: 14px; font-size: 12px; color: var(--text-secondary); text-align: center; width: 100%;">
            Loading verified online widgets...
        </div>
    `;

    const items = await widgetHub.fetchRegistry();
    const q = currentDrawerSearch.toLowerCase().trim();
    const filtered = items.filter(m => {
        if (!q) return true;
        const name = (m.name || '').toLowerCase();
        const desc = (m.description || '').toLowerCase();
        const author = (m.author || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || author.includes(q);
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div style="padding: 16px; font-size: 12px; color: var(--text-secondary); text-align: center; width: 100%;">
                No online widgets matching "${currentDrawerSearch}".
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(item => {
        const isInstalled = widgetHub.isInstalled(item.id);
        html += `
            <div class="market-card" data-id="${item.id}">
                <div class="market-card-top">
                    <div class="store-card-icon">${item.icon || '🧩'}</div>
                    <div class="market-card-info">
                        <span class="market-card-name">${item.name}</span>
                        <span class="market-card-author">by ${item.author}</span>
                    </div>
                </div>
                <div class="market-card-desc">${item.description}</div>
                <div class="market-card-footer">
                    <span class="market-downloads-tag">↓ ${item.downloads}</span>
                    <button class="market-install-btn ${isInstalled ? 'installed' : ''}" data-id="${item.id}">
                        ${isInstalled ? '✓ Added' : 'Install'}
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.market-install-btn:not(.installed)').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const targetItem = items.find(x => x.id === id);
            if (!targetItem) return;

            btn.textContent = 'Installing...';
            const ok = await widgetHub.installWidget(targetItem);
            if (ok) {
                btn.textContent = '✓ Added';
                btn.classList.add('installed');
                renderInstalledDrawerList();
                if (navigator.vibrate) navigator.vibrate(30);
            } else {
                btn.textContent = 'Retry';
            }
        });
    });
}

function setupWidgetDrawer() {
    const searchInput = document.getElementById('widget-store-search');
    const searchClear = document.getElementById('widget-store-search-clear');
    const installedList = document.getElementById('store-installed-list');
    const marketList = document.getElementById('store-marketplace-list');
    const pillInstalled = document.getElementById('subtab-installed-btn');
    const pillMarket = document.getElementById('subtab-marketplace-btn');

    if (pillInstalled && pillMarket) {
        pillInstalled.addEventListener('click', () => {
            activeDrawerSubtab = 'installed';
            pillInstalled.classList.add('active');
            pillMarket.classList.remove('active');
            if (installedList) installedList.style.display = 'flex';
            if (marketList) marketList.style.display = 'none';
        });

        pillMarket.addEventListener('click', () => {
            activeDrawerSubtab = 'marketplace';
            pillMarket.classList.add('active');
            pillInstalled.classList.remove('active');
            if (marketList) marketList.style.display = 'flex';
            if (installedList) installedList.style.display = 'none';
            renderMarketplaceDrawerList();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentDrawerSearch = e.target.value;
            if (searchClear) searchClear.style.display = currentDrawerSearch ? 'block' : 'none';
            if (activeDrawerSubtab === 'installed') {
                renderInstalledDrawerList();
            } else {
                renderMarketplaceDrawerList();
            }
        });
    }

    if (searchClear && searchInput) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            currentDrawerSearch = '';
            searchClear.style.display = 'none';
            if (activeDrawerSubtab === 'installed') {
                renderInstalledDrawerList();
            } else {
                renderMarketplaceDrawerList();
            }
        });
    }

    renderInstalledDrawerList();
}

function setupWallpaperGallery() {
    const galleryContainer = document.getElementById('wallpaper-gallery-container');
    const resetBgBtn = document.getElementById('reset-bg-btn');
    if (!galleryContainer) return;

    let html = '';
    WALLPAPER_COLLECTION.forEach(wp => {
        const isCurrent = state.presetBg === 'custom' && state.customBg === wp.full;
        html += `
            <div class="wallpaper-thumb-card ${isCurrent ? 'active' : ''}" data-url="${wp.full}" data-id="${wp.id}" title="${wp.name}">
                <img src="${wp.thumb}" alt="${wp.name}" loading="lazy" />
                <span class="wp-label">${wp.name}</span>
            </div>
        `;
    });

    galleryContainer.innerHTML = html;

    galleryContainer.querySelectorAll('.wallpaper-thumb-card').forEach(card => {
        card.addEventListener('click', () => {
            galleryContainer.querySelectorAll('.wallpaper-thumb-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const url = card.getAttribute('data-url');
            state.presetBg = 'custom';
            state.customBg = url;
            applyGlobalStyles();
            StorageEngine.save(state);
            if (navigator.vibrate) navigator.vibrate(25);
        });
    });

    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            galleryContainer.querySelectorAll('.wallpaper-thumb-card').forEach(c => c.classList.remove('active'));
            state.presetBg = '1';
            state.customBg = null;
            applyGlobalStyles();
            StorageEngine.save(state);
            if (navigator.vibrate) navigator.vibrate(25);
        });
    }
}

function setupStoreDrag(itemEl) {
    let type = itemEl.getAttribute('data-type');
    let meta = window.WidgetGlobals.getMetadata(type);
    if (!meta) return;

    if (type === 'search') {
        meta.defaultW = 2; meta.defaultH = 1;
    }

    let dummy = null;
    let isDraggingInitiated = false;
    let startX = 0, startY = 0;
    let effectiveW = 1, effectiveH = 1;

    itemEl.addEventListener('pointerdown', (e) => {
        if (!state.editMode) return;
        itemEl.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        isDraggingInitiated = false;
        itemEl.style.transform = 'scale(0.94)';
        itemEl.style.opacity = '0.75';
    });

    itemEl.addEventListener('pointermove', (e) => {
        if (!state.editMode) return;

        // فقط در صورتی که کاربر دستش را به سمت بالا (به طرف گرید) کشید درگ فعال شود
        if (!isDraggingInitiated) {
            const diffY = startY - e.clientY;
            const diffX = Math.abs(e.clientX - startX);
            
            if (diffY > 24 && diffY > diffX) {
                grid.updateMetrics();
                effectiveW = Math.min(meta.defaultW, grid.columns);
                effectiveH = Math.min(meta.defaultH, grid.rowsCount);

                if (!grid.canFit(effectiveW, effectiveH, state.widgets)) {
                    itemEl.releasePointerCapture(e.pointerId);
                    itemEl.style.transform = '';
                    itemEl.style.opacity = '';
                    return;
                }

                isDraggingInitiated = true;
                if (navigator.vibrate) navigator.vibrate(40);
                initialWidgetsState = JSON.parse(JSON.stringify(state.widgets));

                const containerBounds = container.getBoundingClientRect();
                const scale = getWrapperScale();
                const posX = ((e.clientX - containerBounds.left) / scale) - 46;
                const posY = ((e.clientY - containerBounds.top) / scale) - 46;

                dummy = document.createElement('div');
                dummy.className = 'widget-wrapper dragging';
                dummy.style.width = `${effectiveW * grid.cellSize + (effectiveW - 1) * grid.gap}px`;
                dummy.style.height = `${effectiveH * grid.cellSize + (effectiveH - 1) * grid.gap}px`;
                dummy.style.left = `${posX}px`;
                dummy.style.top = `${posY}px`;
                dummy.style.background = 'rgba(255,255,255,0.18)';
                dummy.style.backdropFilter = 'blur(10px)';
                dummy.style.pointerEvents = 'none';
                container.appendChild(dummy);

                if (ghost) ghost.classList.add('active');
                updateGhost({ x: 0, y: 0, w: effectiveW, h: effectiveH });
            }
            return;
        }

        if (!dummy) return;
        if (rAFActive) return;
        rAFActive = true;

        requestAnimationFrame(() => {
            if (!dummy) return;
            rAFActive = false;
            
            const containerBounds = container.getBoundingClientRect();
            const scale = getWrapperScale();
            const posX = ((e.clientX - containerBounds.left) / scale) - 46;
            const posY = ((e.clientY - containerBounds.top) / scale) - 46;
            dummy.style.left = `${posX}px`;
            dummy.style.top = `${posY}px`;

            grid.updateMetrics();
            effectiveW = Math.min(meta.defaultW, grid.columns);
            effectiveH = Math.min(meta.defaultH, grid.rowsCount);

            if (checkCollisionWithDeleteZone(e.clientX, e.clientY)) {
                if (deleteZone) deleteZone.classList.add('hovered');
                dummy.style.background = 'rgba(239, 68, 68, 0.4)';
                if (ghost) ghost.classList.remove('active');
            } else {
                if (deleteZone) deleteZone.classList.remove('hovered');
                dummy.style.background = 'rgba(255,255,255,0.18)';
                if (ghost) ghost.classList.add('active');
            }

            let liveX = Math.round(posX / (grid.cellSize + grid.gap));
            let liveY = Math.round(posY / (grid.cellSize + grid.gap));
            liveX = Math.max(0, Math.min(liveX, grid.columns - effectiveW));
            liveY = Math.max(0, Math.min(liveY, grid.rowsCount - effectiveH));
            updateGhost({ x: liveX, y: liveY, w: effectiveW, h: effectiveH });
        });
    });

    itemEl.addEventListener('pointerup', (e) => {
        itemEl.style.transform = '';
        itemEl.style.opacity = '';

        // اگر انگشت فقط تپ شده بود و به سمت گرید کشیده نشده بود: هیچ کاری نکن و ویجت اضافه نکن
        if (!isDraggingInitiated || !dummy) {
            itemEl.releasePointerCapture(e.pointerId);
            return;
        }

        itemEl.releasePointerCapture(e.pointerId);
        dummy.remove();
        dummy = null;
        isDraggingInitiated = false;
        if (ghost) ghost.classList.remove('active');

        if (deleteZone && deleteZone.classList.contains('hovered')) {
            deleteZone.classList.remove('hovered');
            return;
        }

        grid.updateMetrics();
        let finalX = 0;
        let finalY = 0;
        if (ghost) {
            finalX = Math.round(parseInt(ghost.style.left) / (grid.cellSize + grid.gap));
            finalY = Math.round(parseInt(ghost.style.top) / (grid.cellSize + grid.gap));
        }

        if (!grid.canFit(effectiveW, effectiveH, state.widgets)) {
            alert("No available space left!");
            return;
        }

        const newWidget = {
            id: `w-${Date.now()}`,
            type: type,
            x: finalX,
            y: finalY,
            w: effectiveW,
            h: effectiveH,
            ...JSON.parse(JSON.stringify(meta.defaultConfig || {}))
        };
        
        newWidget.idealLayout = { x: newWidget.x, y: newWidget.y, w: newWidget.w, h: newWidget.h, baseCols: grid.columns };
        
        state.widgets.push(newWidget);
        grid.resolveAllFinalOverlaps(state.widgets);
        StorageEngine.save(state);
        renderGrid();
    });
}

window.openFolderPopup = function(folderId) {
    const folderConfig = state.widgets.find(w => w.id === folderId);
    if (!folderConfig) return;

    const titleEl = document.getElementById('folder-popup-title');
    const gridEl = document.getElementById('folder-popup-grid');
    if (!titleEl || !gridEl) return;
    
    titleEl.innerText = folderConfig.title || "Folder";
    gridEl.innerHTML = "";

    if (folderConfig.children) {
        folderConfig.children.forEach(ch => {
            const item = document.createElement('div');
            item.className = "folder-expanded-item";
            item.style.cursor = "pointer";
            
            let uIcon = (ch.icon !== undefined ? ch.icon : '').trim();
            if (uIcon === '🔗') uIcon = '';
            let iconHtml = uIcon;
            let iconBg = ch.iconBg || 'transparent';
            let shape = ch.shape || '20px';

            if (!iconHtml) {
                const favUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(ch.url || '')}&size=128`;
                iconHtml = `<img src="${favUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.outerHTML='🌐'" draggable="false" />`;
            }
            
            item.innerHTML = `
                <div class="folder-expanded-icon-box" style="border-radius:${shape}; background:${iconBg};">${iconHtml}</div>
                <span class="folder-expanded-label">${ch.title}</span>
            `;

            let pressTimer = null;
            let isDragging = false;
            let dummy = null;
            let startX, startY;

            item.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                item.setPointerCapture(e.pointerId);
                startX = e.clientX;
                startY = e.clientY;

                pressTimer = setTimeout(() => {
                    isDragging = true;
                    if (!state.editMode) window.toggleEditMode(true);
                    if (folderOverlay) folderOverlay.style.display = 'none';

                    const parentFolder = state.widgets.find(w => w.id === folderConfig.id);
                    if (parentFolder) {
                        parentFolder.children = parentFolder.children.filter(c => c.id !== ch.id);
                        StorageEngine.save(state);
                        renderGrid();
                    }

                    dummy = document.createElement('div');
                    dummy.className = 'widget-wrapper dragging';
                    dummy.style.width = `${grid.cellSize}px`;
                    dummy.style.height = `${grid.cellSize}px`;
                    dummy.style.left = `${e.clientX - 46}px`;
                    dummy.style.top = `${e.clientY - 46}px`;
                    dummy.style.background = 'rgba(255,255,255,0.15)';
                    dummy.style.backdropFilter = 'blur(10px)';
                    dummy.style.pointerEvents = 'none';
                    container.appendChild(dummy);

                    if (ghost) ghost.classList.add('active');
                    updateGhost({ x: 0, y: 0, w: 1, h: 1 });
                }, 400);
            });

            item.addEventListener('pointermove', (e) => {
                if (!isDragging) {
                    if (pressTimer && (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10)) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                    return;
                }

                if (rAFActive) return;
                rAFActive = true;

                requestAnimationFrame(() => {
                    rAFActive = false;
                    if (!dummy) return;
                    
                    const containerBounds = container.getBoundingClientRect();
                    const scale = getWrapperScale();
                    const posX = ((e.clientX - containerBounds.left) / scale) - (grid.cellSize / 2);
                    const posY = ((e.clientY - containerBounds.top) / scale) - (grid.cellSize / 2);
                    dummy.style.left = `${posX}px`;
                    dummy.style.top = `${posY}px`;

                    if (checkCollisionWithDeleteZone(e.clientX, e.clientY)) {
                        if (deleteZone) deleteZone.classList.add('hovered');
                        dummy.style.background = 'rgba(239, 68, 68, 0.4)';
                        if (ghost) ghost.classList.remove('active');
                    } else {
                        if (deleteZone) deleteZone.classList.remove('hovered');
                        dummy.style.background = 'rgba(255,255,255,0.15)';
                        if (ghost) ghost.classList.add('active');
                    }

                    let liveX = Math.round(posX / (grid.cellSize + grid.gap));
                    let liveY = Math.round(posY / (grid.cellSize + grid.gap));
                    liveX = Math.max(0, Math.min(liveX, grid.columns - 1));
                    liveY = Math.max(0, Math.min(liveY, grid.rowsCount - 1));
                    updateGhost({ x: liveX, y: liveY, w: 1, h: 1 });
                });
            });

            item.addEventListener('pointerup', (e) => {
                clearTimeout(pressTimer);
                item.releasePointerCapture(e.pointerId);

                if (!isDragging) {
                    if (!state.editMode && ch.url) {
                        window.open(ch.url, '_blank');
                    }
                    return;
                }

                isDragging = false;
                if (dummy) dummy.remove();
                if (ghost) ghost.classList.remove('active');

                if (deleteZone && deleteZone.classList.contains('hovered')) {
                    deleteZone.classList.remove('hovered');
                    return;
                }

                let finalX = 0;
                let finalY = 0;
                if (ghost) {
                    finalX = Math.round(parseInt(ghost.style.left) / (grid.cellSize + grid.gap));
                    finalY = Math.round(parseInt(ghost.style.top) / (grid.cellSize + grid.gap));
                }

                ch.x = finalX;
                ch.y = finalY;
                ch.w = 1;
                ch.h = 1;
                ch.idealLayout = { x: finalX, y: finalY, w: 1, h: 1, baseCols: grid.columns };

                state.widgets.push(ch);
                grid.resolveAllFinalOverlaps(state.widgets);
                StorageEngine.save(state);
                renderGrid();
            });

            gridEl.appendChild(item);
        });
    }
    if (folderOverlay) {
        folderOverlay.style.display = 'flex';
        requestAnimationFrame(() => {
            folderOverlay.classList.add('active');
        });
    }
};

window.closeFolderPopup = function() {
    if (!folderOverlay) return;
    folderOverlay.classList.remove('active');
    setTimeout(() => {
        folderOverlay.style.display = 'none';
    }, 220);
};

function openModal(w) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    
    document.getElementById('edit-w-id').value = w.id;
    
    document.querySelectorAll('.id-shortcut-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-search-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-folder-only').forEach(el => el.style.display = 'none');

    if (w.type === 'shortcut') {
        document.querySelectorAll('.id-shortcut-only').forEach(el => el.style.display = 'flex');
        document.getElementById('edit-w-title').value = w.title || '';
        document.getElementById('edit-w-url').value = w.url || '';
        document.getElementById('edit-w-icon').value = w.icon !== undefined ? w.icon : '';
        
        currentShapeSelection = w.shape || '20px';
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-shape') === currentShapeSelection));
        
        currentIconBgSelection = w.iconBg || 'transparent';
        updateColorUI('iconBg', currentIconBgSelection);

    } else if (w.type === 'folder') {
        document.querySelectorAll('.id-folder-only').forEach(el => el.style.display = 'flex');
        document.getElementById('edit-folder-title').value = w.title || '';
    } else if (w.type === 'search') {
        document.querySelectorAll('.id-search-only').forEach(el => el.style.display = 'flex');
        document.getElementById('edit-search-engine').value = w.engine || 'google';
        document.getElementById('edit-search-placeholder').value = w.placeholder || '';
    }
    
    currentWidgetBgSelection = w.bg || '#ffffff';
    updateColorUI('widgetBg', currentWidgetBgSelection);
    
    document.getElementById('edit-w-glass-toggle').checked = w.isGlass !== false;
    overlay.style.display = 'flex';
}

function closeModal() { 
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none'; 
}

function saveWidgetSettings() {
    const id = document.getElementById('edit-w-id').value;
    const w = state.widgets.find(item => item.id === id);
    if (w) {
        w.isGlass = document.getElementById('edit-w-glass-toggle').checked;
        w.bg = currentWidgetBgSelection;
        if (w.type === 'shortcut') {
            w.title = document.getElementById('edit-w-title').value;
            w.url = document.getElementById('edit-w-url').value;
            w.icon = document.getElementById('edit-w-icon').value;
            w.shape = currentShapeSelection;
            w.iconBg = currentIconBgSelection;
        } else if (w.type === 'folder') {
            w.title = document.getElementById('edit-folder-title').value;
        } else if (w.type === 'search') {
            w.engine = document.getElementById('edit-search-engine').value;
            w.placeholder = document.getElementById('edit-search-placeholder').value;
        }
        
        w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: grid.columns };
        grid.resolveAllFinalOverlaps(state.widgets);
        StorageEngine.save(state);
        renderGrid();
    }
    closeModal();
}

function deleteCurrentWidget() {
    const id = document.getElementById('edit-w-id').value;
    state.widgets = state.widgets.filter(item => item.id !== id);
    StorageEngine.save(state);
    renderGrid();
    closeModal();
}

const widgetDescriptions = {
    shortcut: 'Direct launcher for your favorite web link with custom icon styling and fast access.',
    folder: 'Smart container organizing multiple bookmarks into an expandable grid collection.',
    search: 'Integrated multi-engine search bar with instant query switching (Google, Bing, DuckDuckGo).',
    clock: 'Aesthetic digital clock with live seconds, dynamic greeting, and system time synchronization.',
    notes: 'Quick scratchpad for thoughts, memos, and checklists with instant local autosave.',
    checklist: 'Interactive daily tasks checklist to prioritize and manage everyday todos.',
    quote: 'Daily motivational wisdom to keep you inspired while working in your new tab.'
};

function showWidgetQuickMenu(w, el, touchPos = null) {
    activeQuickMenuWidget = w;
    const menu = document.getElementById('widget-quick-menu');
    if (!menu || !el) return;

    menu.style.visibility = 'hidden';
    menu.style.display = 'flex';
    const menuWidth = menu.offsetWidth || 170;
    const menuHeight = menu.offsetHeight || 160;

    const rect = el.getBoundingClientRect();
    // Position snugly 5px above widget; if tight on top, place 5px below
    let top = rect.top - menuHeight - 5;
    if (top < 12) {
        top = rect.bottom + 5;
    }
    if (top + menuHeight > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - menuHeight - 12);
    }

    let anchorX = (touchPos && touchPos.x) ? touchPos.x : (rect.left + rect.width / 2);
    let left = anchorX - (menuWidth / 2);
    left = Math.max(10, Math.min(window.innerWidth - menuWidth - 10, left));

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.visibility = 'visible';
}

function closeWidgetQuickMenu() {
    const menu = document.getElementById('widget-quick-menu');
    if (menu) menu.style.display = 'none';
    activeQuickMenuWidget = null;
}

function openWidgetInfo(w) {
    if (!w) return;
    const modal = document.getElementById('widget-info-modal');
    if (!modal) return;

    const meta = window.WidgetGlobals ? window.WidgetGlobals.getMetadata(w.type) : null;
    const iconEl = document.getElementById('info-w-icon');
    const labelEl = document.getElementById('info-w-label');
    const typeEl = document.getElementById('info-w-type');
    const sizeEl = document.getElementById('info-w-size');
    const descEl = document.getElementById('info-w-desc');

    if (iconEl) iconEl.innerHTML = (meta && meta.icon) ? meta.icon : '📦';
    if (labelEl) labelEl.textContent = w.title || (meta && meta.label) || w.type;
    if (typeEl) typeEl.textContent = `${w.type} widget`;
    if (sizeEl) sizeEl.textContent = `${w.w || 1} × ${w.h || 1}`;
    if (descEl) descEl.textContent = widgetDescriptions[w.type] || 'Modular ProGrid fluid widget component.';

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

function closeWidgetInfo() {
    const modal = document.getElementById('widget-info-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 220);
}

function setupQuickMenuListeners() {
    const qmEdit = document.getElementById('qm-edit-btn');
    const qmInfo = document.getElementById('qm-info-btn');
    const qmLayout = document.getElementById('qm-layout-btn');
    const qmDelete = document.getElementById('qm-delete-btn');
    const qmMenu = document.getElementById('widget-quick-menu');

    if (qmEdit) {
        qmEdit.addEventListener('click', () => {
            if (activeQuickMenuWidget) {
                const target = activeQuickMenuWidget;
                closeWidgetQuickMenu();
                openModal(target);
            }
        });
    }

    if (qmInfo) {
        qmInfo.addEventListener('click', () => {
            if (activeQuickMenuWidget) {
                const target = activeQuickMenuWidget;
                closeWidgetQuickMenu();
                openWidgetInfo(target);
            }
        });
    }

    if (qmLayout) {
        qmLayout.addEventListener('click', () => {
            closeWidgetQuickMenu();
            window.toggleEditMode(true);
        });
    }

    if (qmDelete) {
        qmDelete.addEventListener('click', () => {
            if (activeQuickMenuWidget) {
                const targetId = activeQuickMenuWidget.id;
                closeWidgetQuickMenu();
                state.widgets = state.widgets.filter(item => item.id !== targetId);
                StorageEngine.save(state);
                renderGrid();
            }
        });
    }

    window.addEventListener('pointerdown', (e) => {
        if (qmMenu && qmMenu.style.display === 'flex' && !qmMenu.contains(e.target)) {
            closeWidgetQuickMenu();
        }
    });

    const infoCloseBtn = document.getElementById('info-close-btn');
    const infoModal = document.getElementById('widget-info-modal');
    if (infoCloseBtn) {
        infoCloseBtn.addEventListener('click', closeWidgetInfo);
    }
    if (infoModal) {
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) closeWidgetInfo();
        });
    }
}

window.addEventListener('DOMContentLoaded', init);