import { GridEngine } from './grid.js';
import { StorageEngine } from './storage.js';
import { widgetHub } from './hub.js';
import { WALLPAPER_COLLECTION } from './wallpapers.js';

// Synchronously import core widgets so they register in 0ms with zero network delay
import '../widgets/shortcut.js';
import '../widgets/search.js';
import '../widgets/checklist.js';
import '../widgets/folder.js';
import '../widgets/clock.js';
import '../widgets/notes.js';
import '../widgets/community/finance.js';
import '../widgets/community/pomodoro.js';
import '../widgets/community/quote.js';

let state = { editMode: false, blurValue: 27, presetBg: '1', theme: 'dark', designTheme: 'frosted-glass', customBg: null, widgets: [] };
window.state = state;
window.appState = state;

const grid = new GridEngine();
let container, blurOverlay, ghost, deleteZone, folderOverlay, dynamicBgLayer;

let initialWidgetsState = null;
let currentShapeSelection = '20px';
let currentSearchShapeSelection = 'pill';
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

    const loaded = StorageEngine.load();
    
    if (loaded && loaded.widgets && loaded.widgets.length > 0) {
        state.blurValue = loaded.blurValue ?? 27;
        state.presetBg = loaded.presetBg || '1';
        state.theme = loaded.theme || 'dark';
        state.designTheme = (loaded.designTheme === 'liquid-glass') ? 'frosted-glass' : (loaded.designTheme || 'frosted-glass');
        state.customBg = loaded.customBg || null;
        state.widgets = (loaded.widgets || []).filter(w => w.type !== 'calculator');
    } else {
        state.blurValue = 27;
        state.presetBg = "1";
        state.theme = "dark";
        state.designTheme = "frosted-glass";
        state.widgets = [
            { id: "w-clock-default", type: "clock", x: 0, y: 0, w: 2, h: 1, format24: true, showDate: true, isGlass: true, bg: "#ffffff", idealLayout: { x: 0, y: 0, w: 2, h: 1, baseCols: 8 }, isHidden: false, centerDist: 0.5 },
            { id: "w-search-default", type: "search", x: 2, y: 0, w: 6, h: 1, engine: "google", placeholder: "Search...", isGlass: true, bg: "#ffffff", idealLayout: { x: 2, y: 0, w: 6, h: 1, baseCols: 8 }, isHidden: false, centerDist: 1 },
            { id: "w-shortcut-default", type: "shortcut", x: 0, y: 1, w: 1, h: 1, title: "GitHub", url: "https://github.com/MR-PR0G/ProGrid", icon: "", iconBg: "#3b82f6", shape: "50%", isGlass: true, bg: "#3b82f6", idealLayout: { x: 0, y: 1, w: 1, h: 1, baseCols: 8 }, isHidden: false, centerDist: 2 }
        ];
    }

    // Apply global background & theme immediately - eliminate any white flash!
    applyGlobalStyles();

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
    setupWidgetDrawer();
    setupWallpaperGallery();
    setupAppearanceSubtabs();
    setupWorkspacesUI();
    setupQuickMenuListeners();
    setupAboutModal();

    // First visit guidance banner (Clean auto-dismiss after 2.5s or on tap)
    try {
        const hasSeenTip = localStorage.getItem('progrid_edit_tip_seen');
        const tipEl = document.getElementById('first-visit-tip');
        const dismissBtn = document.getElementById('tip-dismiss-btn') || document.getElementById('first-visit-dismiss');
        if (!hasSeenTip && tipEl) {
            tipEl.style.display = 'flex';
            // Smooth entrance
            requestAnimationFrame(() => {
                tipEl.classList.add('show');
            });

            const hideTip = () => {
                tipEl.classList.remove('show');
                tipEl.classList.add('hide');
                localStorage.setItem('progrid_edit_tip_seen', '1');
                setTimeout(() => {
                    tipEl.style.display = 'none';
                }, 400);
            };

            // Auto-dismiss after 2.5 seconds
            const autoTimer = setTimeout(() => {
                hideTip();
            }, 2500);

            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    clearTimeout(autoTimer);
                    hideTip();
                });
            }
        }
    } catch (e) {
        console.warn('Storage tip check err:', e);
    }

    try {
        const updatedToast = sessionStorage.getItem('progrid_updated_toast');
        if (updatedToast) {
            sessionStorage.removeItem('progrid_updated_toast');
            setTimeout(() => {
                showUpdateSuccessToast(updatedToast);
            }, 350);
        }
    } catch (e) {}

    // Asynchronously boot community widgets in background without blocking screen
    widgetHub.bootInstalledWidgets().then(() => {
        const hasCommunityWidget = state.widgets.some(w => !['shortcut', 'search', 'checklist', 'folder', 'clock', 'notes'].includes(w.type));
        if (hasCommunityWidget) renderGrid();
        renderInstalledDrawerList();
    }).catch(e => console.error('Community widget boot notice:', e));
}

function applyGlobalStyles() {
    const currentTheme = state.designTheme || 'frosted-glass';
    document.body.classList.remove('theme-liquid-glass', 'theme-frosted-glass', 'theme-material3');
    document.body.classList.add(`theme-${currentTheme}`);
    document.body.classList.toggle('light-mode', state.theme === 'light');

    const m3DarkBtn = document.getElementById('m3-tone-dark-btn');
    const m3LightBtn = document.getElementById('m3-tone-light-btn');
    if (m3DarkBtn && m3LightBtn) {
        const isLight = state.theme === 'light';
        m3DarkBtn.classList.toggle('active', !isLight);
        m3LightBtn.classList.toggle('active', isLight);
    }

    if (blurOverlay) {
        blurOverlay.style.backdropFilter = `blur(${state.blurValue}px)`;
        blurOverlay.style.webkitBackdropFilter = `blur(${state.blurValue}px)`;
    }
    const slider = document.getElementById('blur-slider');
    if (slider) slider.value = state.blurValue;
    const blurValLabel = document.getElementById('blur-val-label');
    if (blurValLabel) blurValLabel.textContent = `${state.blurValue}px`;

    document.querySelectorAll('.bg-thumb').forEach(t => t.style.borderColor = 'transparent');
    const activeThumb = document.querySelector(`.bg-thumb[data-preset="${state.presetBg}"]`);
    if (activeThumb) activeThumb.style.borderColor = 'var(--text-primary)';

    if (state.presetBg === 'custom') {
        const cachedWp = localStorage.getItem('progrid_offline_wallpaper');
        const bgUrl = cachedWp || state.customBg;
        if (dynamicBgLayer && bgUrl) {
            dynamicBgLayer.className = 'bg-layer';
            const matchedWp = typeof WALLPAPER_COLLECTION !== 'undefined' ? WALLPAPER_COLLECTION.find(w => w.full === bgUrl || w.thumb === bgUrl) : null;
            const fallbackGrad = matchedWp && matchedWp.gradient ? matchedWp.gradient : 'radial-gradient(ellipse at 50% 20%, #1a2238 0%, #080a10 100%)';
            dynamicBgLayer.style.background = fallbackGrad;
            dynamicBgLayer.style.backgroundImage = `url("${bgUrl}"), ${fallbackGrad}`;
            dynamicBgLayer.style.backgroundSize = 'cover';
            dynamicBgLayer.style.backgroundPosition = 'center center';
            dynamicBgLayer.style.backgroundRepeat = 'no-repeat';
        }
    } else {
        if (dynamicBgLayer) {
            dynamicBgLayer.style.backgroundImage = 'none';
            dynamicBgLayer.className = state.presetBg === '2' ? 'bg-layer bg-dynamic' : 'bg-layer';
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
    w.h = coords.h;
    w.w = coords.w;
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-wrapper';
    wrapper.id = w.id;
    wrapper.setAttribute('data-h', coords.h);
    wrapper.setAttribute('data-w', coords.w);
    wrapper.classList.toggle('is-h1', coords.h === 1);
    wrapper.style.width = `${coords.w * grid.cellSize + (coords.w - 1) * grid.gap}px`;
    wrapper.style.height = `${coords.h * grid.cellSize + (coords.h - 1) * grid.gap}px`;
    wrapper.style.left = `${coords.x * (grid.cellSize + grid.gap)}px`;
    wrapper.style.top = `${coords.y * (grid.cellSize + grid.gap)}px`;
    
    const currentTheme = state.designTheme || 'frosted-glass';
    const isGlass = currentTheme !== 'material3';
    const isLightMode = state.theme === 'light';

    if (isGlass) {
        if (currentTheme === 'liquid-glass') {
            wrapper.style.background = hexToRgba(w.bg || '#ffffff', 0.12);
            wrapper.style.backdropFilter = 'blur(20px)';
            wrapper.style.webkitBackdropFilter = 'blur(20px)';
            wrapper.style.border = '1px solid var(--panel-border)';
            wrapper.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.35)';
        } else {
            // frosted-glass (default & refined)
            wrapper.style.background = hexToRgba(w.bg || '#ffffff', 0.08);
            wrapper.style.backdropFilter = 'blur(35px) saturate(180%)';
            wrapper.style.webkitBackdropFilter = 'blur(35px) saturate(180%)';
            wrapper.style.border = '1px solid rgba(255, 255, 255, 0.14)';
            wrapper.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.28)';
        }
    } else {
        // Solid Material 3 surface (Dark or Light)
        if (isLightMode) {
            wrapper.style.background = '#ffffff';
            wrapper.style.border = '1px solid rgba(0, 0, 0, 0.08)';
            wrapper.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
        } else {
            wrapper.style.background = (w.bg && w.bg !== '#ffffff') ? w.bg : '#1e222b';
            wrapper.style.border = '1px solid rgba(255, 255, 255, 0.08)';
            wrapper.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.35)';
        }
        wrapper.style.backdropFilter = 'none';
        wrapper.style.webkitBackdropFilter = 'none';
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

    const editPanel = document.getElementById('edit-panel');
    const isCollapsed = editPanel && editPanel.classList.contains('collapsed');

    const isMobile = window.innerWidth < 640;
    const topMargin = isMobile ? 44 : 50;
    const bottomMargin = isCollapsed ? 76 : (isMobile ? 295 : 290);
    const availH = Math.max(160, window.innerHeight - (topMargin + bottomMargin));
    const availW = Math.max(260, window.innerWidth - (isMobile ? 20 : 36));

    const gridW = container.offsetWidth || 1;
    const gridH = container.offsetHeight || 1;

    const scaleX = availW / gridW;
    const scaleY = availH / gridH;
    // Scale slightly more compact so user has clear breathing space and full visibility above drawer
    const maxAllowedScale = isCollapsed ? 0.95 : 0.76;
    let targetScale = Math.min(scaleX, scaleY, maxAllowedScale);
    targetScale = Math.max(0.35, Math.min(maxAllowedScale, targetScale));

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
    const fuzz = 22;
    return (
        clientX >= (dzRect.left - fuzz) &&
        clientX <= (dzRect.right + fuzz) &&
        clientY >= (dzRect.top - fuzz) &&
        clientY <= (dzRect.bottom + fuzz)
    );
}

function attachInteractionEngine(el, w, instance) {
    let initialPointerX = 0;
    let initialPointerY = 0;
    let startW = 0, startH = 0;
    let dragOffsetX = 0, dragOffsetY = 0;
    let isDragging = false;
    let isResizing = false;
    let hasMovedPastThreshold = false;
    let pointerDownTime = 0;
    let widgetLongPressTimer = null;
    let cachedScale = 1;
    let cachedContainerBounds = null;

    const meta = window.WidgetGlobals.getMetadata(w.type) || { minW: 1, minH: 1, maxW: 4, maxH: 4 };
    if (w.type === 'search') {
        meta.minW = 2; meta.maxH = 1; meta.minH = 1; meta.maxW = 99;
    }
    const minW = meta.minW || 1;
    const minH = meta.minH || 1;

    // Context menu / long-press handler
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (state.editMode) {
            openModal(w);
        } else {
            if (navigator.vibrate) navigator.vibrate(50);
            showWidgetQuickMenu(w, el, { x: e.clientX, y: e.clientY });
        }
    });

    const onGlobalPointerMove = (e) => {
        if (!state.editMode) return;

        const moveDist = Math.hypot(e.clientX - initialPointerX, e.clientY - initialPointerY);
        if (!isDragging && !isResizing) {
            if (moveDist > 5) {
                hasMovedPastThreshold = true;
                if (e.target && e.target.classList.contains('resize-handle')) {
                    isResizing = true;
                    el.classList.add('resizing');
                } else {
                    isDragging = true;
                    el.classList.add('dragging');
                }
                if (ghost) ghost.classList.add('active');
                updateGhost(w);
            } else {
                return;
            }
        }

        if (e.cancelable) e.preventDefault();
        if (rAFActive) return;
        rAFActive = true;

        requestAnimationFrame(() => {
            rAFActive = false;
            if (!isDragging && !isResizing) return;

            const scale = cachedScale || 1;
            const containerBounds = cachedContainerBounds || container.getBoundingClientRect();
            const step = grid.cellSize + grid.gap;

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

                // Snap ghost
                let targetCol = Math.round(targetLeft / step);
                let targetRow = Math.round(targetTop / step);

                const effW = Math.max(minW, Math.min(w.w, grid.columns));
                const effH = Math.max(minH, Math.min(w.h, grid.rowsCount));

                targetCol = Math.max(0, Math.min(targetCol, grid.columns - effW));
                targetRow = Math.max(0, Math.min(targetRow, grid.rowsCount - effH));

                // Shortcut merge into folder
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
                        activeInState.x = targetCol;
                        activeInState.y = targetRow;
                        activeInState.w = effW;
                        activeInState.h = effH;

                        const pushed = grid.omniMagnetPush(activeInState, tempWidgets);
                        if (pushed) {
                            updateGhost({ id: w.id, x: targetCol, y: targetRow, w: effW, h: effH });
                            tempWidgets.forEach(tw => {
                                if (tw.id !== w.id && !tw.isHidden) {
                                    const otherDOM = document.getElementById(tw.id);
                                    if (otherDOM && !otherDOM.classList.contains('dragging') && !otherDOM.classList.contains('resizing')) {
                                        otherDOM.style.transition = 'left 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), top 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)';
                                        otherDOM.style.left = `${tw.x * step}px`;
                                        otherDOM.style.top = `${tw.y * step}px`;
                                    }
                                }
                            });
                        } else if (ghost) {
                            const lastGhostX = Math.max(0, Math.min(Math.round(parseInt(ghost.style.left) / step), grid.columns - effW));
                            const lastGhostY = Math.max(0, Math.min(Math.round(parseInt(ghost.style.top) / step), grid.rowsCount - effH));
                            updateGhost({ id: w.id, x: lastGhostX, y: lastGhostY, w: effW, h: effH });
                        }
                    }
                } else {
                    updateGhost({ id: w.id, x: targetCol, y: targetRow, w: effW, h: effH });
                }
            } else if (isResizing) {
                const deltaX = (e.clientX - initialPointerX) / scale;
                const deltaY = (e.clientY - initialPointerY) / scale;

                let rawW = startW + deltaX;
                let rawH = startH + deltaY;

                el.style.width = `${Math.max(50, rawW)}px`;
                el.style.height = `${Math.max(50, rawH)}px`;

                let maxAllowedW = w.type === 'search' ? grid.columns : Math.min(meta.maxW || 4, grid.columns);
                let maxAllowedH = Math.min(meta.maxH || 4, grid.rowsCount);

                let gridW = Math.max(minW, Math.min(maxAllowedW, Math.round((rawW - grid.gap) / step)));
                let gridH = Math.max(minH, Math.min(maxAllowedH, Math.round((rawH - grid.gap) / step)));

                if (w.x + gridW > grid.columns) gridW = grid.columns - w.x;
                if (w.y + gridH > grid.rowsCount) gridH = grid.rowsCount - w.y;

                updateGhost({ id: w.id, x: w.x, y: w.y, w: gridW, h: gridH });
            }
        });
    };

    const onGlobalPointerUp = (e) => {
        window.removeEventListener('pointermove', onGlobalPointerMove);
        window.removeEventListener('pointerup', onGlobalPointerUp);
        window.removeEventListener('pointercancel', onGlobalPointerUp);
        window.removeEventListener('blur', onGlobalPointerUp);

        if (widgetLongPressTimer) clearTimeout(widgetLongPressTimer);
        if (!state.editMode) return;

        const duration = Date.now() - pointerDownTime;
        const wasTap = !hasMovedPastThreshold && !isDragging && !isResizing && duration < 280;

        el.classList.remove('dragging', 'resizing', 'burn-effect', 'max-limit-reached');
        if (ghost) ghost.classList.remove('active', 'max-limit-reached');

        // Reset inline animation transitions on all sibling elements
        document.querySelectorAll('.widget-wrapper').forEach(wrapper => {
            wrapper.style.transition = '';
        });

        if (wasTap) {
            if (Date.now() - (window.__lastDragEndTime || 0) > 350) {
                openModal(w);
            }
            return;
        }

        window.__lastDragEndTime = Date.now();

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
                    target.w = 2; target.h = 2;
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

        const step = grid.cellSize + grid.gap;
        if (isDragging) {
            isDragging = false;
            if (ghost) {
                const finalCol = Math.round(parseInt(ghost.style.left) / step);
                const finalRow = Math.round(parseInt(ghost.style.top) / step);
                w.x = Math.max(0, Math.min(finalCol, grid.columns - w.w));
                w.y = Math.max(0, Math.min(finalRow, grid.rowsCount - w.h));
            }
            grid.omniMagnetPush(w, state.widgets);
        } else if (isResizing) {
            isResizing = false;
            if (ghost) {
                const finalW = Math.round((parseInt(ghost.style.width) + grid.gap) / step);
                const finalH = Math.round((parseInt(ghost.style.height) + grid.gap) / step);
                let maxAllowedW = w.type === 'search' ? grid.columns : Math.min(meta.maxW || 4, grid.columns);
                let maxAllowedH = Math.min(meta.maxH || 4, grid.rowsCount);
                w.w = Math.max(minW, Math.min(maxAllowedW, finalW));
                w.h = Math.max(minH, Math.min(maxAllowedH, finalH));
            }
            if (instance && instance.onResize) {
                try { instance.onResize(w.w, w.h, el); } catch (err) { console.error(err); }
            }
            grid.omniMagnetPush(w, state.widgets);
        }

        w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: grid.columns };
        grid.resolveAllFinalOverlaps(state.widgets);
        StorageEngine.save(state);
        renderGrid();
    };

    el.addEventListener('pointerdown', (e) => {
        initialPointerX = e.clientX;
        initialPointerY = e.clientY;
        hasMovedPastThreshold = false;
        isDragging = false;
        isResizing = false;
        pointerDownTime = Date.now();

        if (widgetLongPressTimer) {
            clearTimeout(widgetLongPressTimer);
            widgetLongPressTimer = null;
        }

        if (!state.editMode) {
            const onNormalPointerMove = (moveEv) => {
                const dx = moveEv.clientX - initialPointerX;
                const dy = moveEv.clientY - initialPointerY;
                if (Math.hypot(dx, dy) > 8) {
                    hasMovedPastThreshold = true;
                    if (widgetLongPressTimer) {
                        clearTimeout(widgetLongPressTimer);
                        widgetLongPressTimer = null;
                    }
                }
            };

            const onNormalPointerUp = () => {
                window.removeEventListener('pointermove', onNormalPointerMove);
                window.removeEventListener('pointerup', onNormalPointerUp);
                window.removeEventListener('pointercancel', onNormalPointerUp);
                if (widgetLongPressTimer) {
                    clearTimeout(widgetLongPressTimer);
                    widgetLongPressTimer = null;
                }
            };

            window.addEventListener('pointermove', onNormalPointerMove, { passive: true });
            window.addEventListener('pointerup', onNormalPointerUp);
            window.addEventListener('pointercancel', onNormalPointerUp);

            widgetLongPressTimer = setTimeout(() => {
                if (!hasMovedPastThreshold) {
                    if (navigator.vibrate) navigator.vibrate(50);
                    showWidgetQuickMenu(w, el, { x: initialPointerX, y: initialPointerY });
                }
            }, 460);
            return;
        }

        grid.updateMetrics();
        cachedScale = getWrapperScale() || 1;
        cachedContainerBounds = container.getBoundingClientRect();
        initialWidgetsState = JSON.parse(JSON.stringify(state.widgets));

        if (e.target.classList.contains('resize-handle')) {
            startW = el.offsetWidth;
            startH = el.offsetHeight;
        } else {
            const rect = el.getBoundingClientRect();
            dragOffsetX = (e.clientX - rect.left) / cachedScale;
            dragOffsetY = (e.clientY - rect.top) / cachedScale;
        }

        window.addEventListener('pointermove', onGlobalPointerMove, { passive: false });
        window.addEventListener('pointerup', onGlobalPointerUp);
        window.addEventListener('pointercancel', onGlobalPointerUp);
        window.addEventListener('blur', onGlobalPointerUp);

        e.stopPropagation();
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
            let diffY = Math.abs(touchStartY - e.touches[0].clientY);
            if (diffY > 10) {
                if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout);
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
        setTimeout(() => { 
            isInputActive = false; 
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }, 150);
    }
});

function setupGlobalEvents() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        // Prevent layout reflow when mobile soft keyboard triggers viewport resize
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

    const collapseBtn = document.getElementById('panel-collapse-btn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const editPanel = document.getElementById('edit-panel');
            if (!editPanel) return;
            const willCollapse = !editPanel.classList.contains('collapsed');
            editPanel.classList.toggle('collapsed', willCollapse);
            document.body.classList.toggle('shelf-collapsed', willCollapse);
            collapseBtn.setAttribute('title', willCollapse ? 'Expand Shelf' : 'Collapse Shelf');
            updateEditModeScale();
        });
    }

    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const editPanel = document.getElementById('edit-panel');
            if (editPanel && editPanel.classList.contains('collapsed')) {
                editPanel.classList.remove('collapsed');
                document.body.classList.remove('shelf-collapsed');
                if (collapseBtn) collapseBtn.setAttribute('title', 'Collapse Shelf');
                updateEditModeScale();
            }
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


    const slider = document.getElementById('blur-slider');
    const blurValLabel = document.getElementById('blur-val-label');
    if (slider) {
        slider.addEventListener('input', (e) => {
            state.blurValue = parseInt(e.target.value);
            if (blurValLabel) blurValLabel.textContent = `${state.blurValue}px`;
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

    document.querySelectorAll('.search-shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSearchShapeSelection = btn.getAttribute('data-shape');
            document.querySelectorAll('.search-shape-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    // PWA Install Engine & Multi-Platform Guide
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaModal = document.getElementById('pwa-install-modal');
    const pwaCloseBtn = document.getElementById('pwa-modal-close-btn');
    const pwaTriggerBtn = document.getElementById('pwa-prompt-trigger-btn');
    const pwaInstructions = document.getElementById('pwa-install-instructions');
    const pwaSubtitle = document.getElementById('pwa-install-subtitle');

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isStandalone && pwaInstallBtn) {
        pwaInstallBtn.textContent = 'Installed';
        pwaInstallBtn.style.opacity = '0.6';
        pwaInstallBtn.style.pointerEvents = 'none';
    }

    const webBanner = document.getElementById('web-install-banner');
    const webActionBtn = document.getElementById('web-install-action-btn');
    const webDismissBtn = document.getElementById('web-install-dismiss-btn');

    const openInstallModal = () => {
        if (webBanner) webBanner.style.display = 'none';
        if (!pwaModal) return;

        // If native prompt is available right now, trigger immediately!
        if (window.deferredPWAInstallPrompt) {
            window.deferredPWAInstallPrompt.prompt();
            window.deferredPWAInstallPrompt.userChoice.then(({ outcome }) => {
                if (outcome === 'accepted') {
                    if (pwaInstallBtn) {
                        pwaInstallBtn.textContent = 'Installed';
                        pwaInstallBtn.style.opacity = '0.6';
                    }
                    if (webBanner) webBanner.style.display = 'none';
                }
                window.deferredPWAInstallPrompt = null;
            }).catch(() => {});
            return;
        }

        // Otherwise display step-by-step modal guide tailored to user device
        if (pwaInstructions) {
            if (isIOS) {
                if (pwaSubtitle) pwaSubtitle.textContent = 'Follow these simple steps in Safari to add ProGrid to your iPhone / iPad home screen:';
                pwaInstructions.innerHTML = `
                    <div class="pwa-step-item">
                        <span class="pwa-step-num">1</span>
                        <span class="pwa-step-text">Tap the <strong>Share</strong> button in Safari toolbar at the bottom.</span>
                    </div>
                    <div class="pwa-step-item">
                        <span class="pwa-step-num">2</span>
                        <span class="pwa-step-text">Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                    </div>
                    <div class="pwa-step-item">
                        <span class="pwa-step-num">3</span>
                        <span class="pwa-step-text">Tap <strong>Add</strong> in the top right corner to finish.</span>
                    </div>
                `;
                if (pwaTriggerBtn) pwaTriggerBtn.style.display = 'none';
            } else {
                if (pwaSubtitle) pwaSubtitle.textContent = 'Install ProGrid for instant offline access and native app mode:';
                pwaInstructions.innerHTML = `
                    <div class="pwa-step-item">
                        <span class="pwa-step-num">1</span>
                        <span class="pwa-step-text">Tap the browser menu (<strong>⋮</strong>) in the top-right corner.</span>
                    </div>
                    <div class="pwa-step-item">
                        <span class="pwa-step-num">2</span>
                        <span class="pwa-step-text">Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                    </div>
                    <div class="pwa-step-item">
                        <span class="pwa-step-num">3</span>
                        <span class="pwa-step-text">Confirm installation to launch ProGrid anytime from your apps list.</span>
                    </div>
                `;
                if (pwaTriggerBtn) {
                    pwaTriggerBtn.style.display = 'block';
                    pwaTriggerBtn.textContent = 'Try Direct Install';
                }
            }
        }

        pwaModal.style.display = 'flex';
    };

    const closeInstallModal = () => {
        if (pwaModal) pwaModal.style.display = 'none';
    };

    if (pwaInstallBtn) pwaInstallBtn.addEventListener('click', openInstallModal);

    if (webBanner && !isStandalone) {
        const dismissedAt = localStorage.getItem('progrid_install_banner_dismissed');
        const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
        const isDismissedRecently = dismissedAt && (Date.now() - parseInt(dismissedAt, 10) < fiveDaysMs);

        if (!isDismissedRecently) {
            setTimeout(() => {
                if (!document.body.classList.contains('edit-mode')) {
                    webBanner.style.display = 'flex';
                }
            }, 1200);
        }

        if (webActionBtn) {
            webActionBtn.addEventListener('click', openInstallModal);
        }

        if (webDismissBtn) {
            webDismissBtn.addEventListener('click', () => {
                webBanner.style.display = 'none';
                localStorage.setItem('progrid_install_banner_dismissed', Date.now().toString());
            });
        }
    }

    if (pwaCloseBtn) pwaCloseBtn.addEventListener('click', closeInstallModal);
    if (pwaModal) {
        pwaModal.addEventListener('click', (e) => {
            if (e.target === pwaModal) closeInstallModal();
        });
    }

    if (pwaTriggerBtn) {
        pwaTriggerBtn.addEventListener('click', async () => {
            if (window.deferredPWAInstallPrompt) {
                window.deferredPWAInstallPrompt.prompt();
                const { outcome } = await window.deferredPWAInstallPrompt.userChoice;
                if (outcome === 'accepted') {
                    closeInstallModal();
                    if (pwaInstallBtn) {
                        pwaInstallBtn.textContent = 'Installed';
                        pwaInstallBtn.style.opacity = '0.6';
                    }
                    if (webBanner) webBanner.style.display = 'none';
                }
                window.deferredPWAInstallPrompt = null;
            } else {
                alert("Direct prompt is ready via browser menu (⋮) -> 'Install app' or 'Add to Home screen'.");
            }
        });
    }

    window.addEventListener('pwa-prompt-ready', () => {
        if (pwaInstallBtn && !isStandalone) {
            pwaInstallBtn.classList.add('ready');
        }
    });

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

window.updateWidgetConfigDirectly = function(id, partialConfig, shouldRender = true) {
    const w = state.widgets.find(item => item.id === id);
    if (w) {
        Object.assign(w, partialConfig);
        StorageEngine.save(state);
        if (shouldRender) {
            renderGrid();
        }
    }
};

window.toggleEditMode = function(forceState = null) {
    closeWidgetQuickMenu();
    closeWidgetInfo();
    state.editMode = forceState !== null ? forceState : !state.editMode;
    document.body.classList.toggle('edit-mode', state.editMode);
    if (!state.editMode) {
        closeModal();
        const editPanel = document.getElementById('edit-panel');
        if (editPanel) editPanel.classList.remove('collapsed');
        document.body.classList.remove('shelf-collapsed');
        const collapseBtn = document.getElementById('panel-collapse-btn');
        if (collapseBtn) collapseBtn.setAttribute('title', 'Collapse Shelf');
        grid.resolveAllFinalOverlaps(state.widgets);
    } else {
        const tipEl = document.getElementById('first-visit-tip');
        if (tipEl) {
            tipEl.style.display = 'none';
            try { localStorage.setItem('progrid_edit_tip_seen', '1'); } catch (e) {}
        }
    }
    renderGrid();
    updateEditModeScale();
};

let currentDrawerSearch = '';
let activeDrawerSubtab = 'installed';

function addWidgetDirectly(type) {
    const meta = window.WidgetGlobals ? window.WidgetGlobals.getMetadata(type) : null;
    if (!meta) return null;

    grid.updateMetrics();
    const effW = type === 'search' ? 2 : Math.min(meta.defaultW || 1, grid.columns);
    const effH = type === 'search' ? 1 : Math.min(meta.defaultH || 1, grid.rowsCount);

    const pos = grid.findFirstAvailablePos(effW, effH, state.widgets);
    if (!pos) {
        alert("No space available on grid! Rearrange or resize existing widgets.");
        return null;
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
    return newWidget;
}

function getWidgetIconSvg(type) {
    if (window.WidgetGlobals) {
        const meta = window.WidgetGlobals.getMetadata(type);
        if (meta && meta.icon && typeof meta.icon === 'string' && meta.icon.includes('<svg')) {
            return meta.icon;
        }
    }
    const svgMap = {
        clock: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        search: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
        shortcut: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
        folder: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        notes: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
        checklist: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
        calculator: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>`,
        quote: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>`,
        pomodoro: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        finance: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
    };
    return svgMap[type] || `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
}

const CORE_WIDGET_TYPES = ['shortcut', 'search', 'clock'];

function openModalForConfig(type) {
    const meta = window.WidgetGlobals ? window.WidgetGlobals.getMetadata(type) : null;
    if (!meta) return;
    const previewWidget = {
        id: `pending-add-${type}-${Date.now()}`,
        type: type,
        w: type === 'search' ? 2 : (meta.defaultW || 1),
        h: type === 'search' ? 1 : (meta.defaultH || 1),
        isGlass: state.designTheme !== 'material3',
        bg: '#ffffff',
        ...JSON.parse(JSON.stringify(meta.defaultConfig || {}))
    };
    openModal(previewWidget, true);
}

function configureWidgetType(type) {
    openModalForConfig(type);
}

function renderInstalledDrawerList() {
    const listEl = document.getElementById('store-installed-list');
    const badgeEl = document.getElementById('installed-count-pill');
    if (!listEl || !window.WidgetGlobals) return;

    const allMetas = window.WidgetGlobals.getAllMetadata().filter(m => {
        if (m.type === 'folder') return false;
        if (CORE_WIDGET_TYPES.includes(m.type)) return true;
        return widgetHub.isInstalled(m.type);
    });
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
        const isCore = CORE_WIDGET_TYPES.includes(m.type);
        const author = isCore ? 'ProGrid' : (m.author || 'MR Prog');
        const rawVer = m.version || '1.5.0';
        const verStr = rawVer.startsWith('v') ? rawVer : `v${rawVer}`;
        const iconSvg = getWidgetIconSvg(m.type);
        html += `
            <div class="store-card" data-type="${m.type}">
                <div class="store-card-header">
                    <div class="store-card-icon">${iconSvg}</div>
                    <div class="store-card-meta">
                        <span class="store-card-title" title="${m.label || m.name}">${m.label || m.name}</span>
                        <span class="store-card-size">${m.defaultW || 1}×${m.defaultH || 1}</span>
                    </div>
                </div>
                <div class="store-card-author-row">
                    <span class="store-card-author">By ${author} • ${verStr}</span>
                    <button class="store-card-info-btn" data-type="${m.type}" title="Widget details" aria-label="Widget details">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>
                <div class="store-card-subactions">
                    <button class="store-config-btn" data-type="${m.type}" title="Configure widget" aria-label="Configure widget">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span>Config</span>
                    </button>
                    ${!isCore ? `
                        <button class="store-uninstall-btn" data-type="${m.type}" title="Uninstall widget from device" aria-label="Uninstall widget">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="store-card-actions">
                    <button class="store-add-btn" data-type="${m.type}">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>Add to Grid</span>
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.store-card').forEach(card => {
        setupStoreDrag(card);
    });

    listEl.querySelectorAll('.store-card-info-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            const meta = window.WidgetGlobals.getMetadata(type);
            if (meta) openWidgetInfo(meta);
        });
    });

    listEl.querySelectorAll('.store-uninstall-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            if (!type || CORE_WIDGET_TYPES.includes(type)) return;

            widgetHub.uninstallWidget(type);
            const hadInstances = state.widgets.some(w => w.type === type);
            if (hadInstances) {
                state.widgets = state.widgets.filter(w => w.type !== type);
                StorageEngine.save(state);
                renderGrid();
            }

            renderInstalledDrawerList();
            renderMarketplaceDrawerList();
            if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
        });
    });

    listEl.querySelectorAll('.store-config-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            openModalForConfig(type);
        });
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
        const iconSvg = getWidgetIconSvg(item.id);
        const downloadsStr = widgetHub.getDownloads(item.id);
        const isLiked = widgetHub.isLiked(item.id);
        const likesStr = widgetHub.getLikes(item.id);
        html += `
            <div class="market-card" data-id="${item.id}">
                <div class="market-card-top">
                    <div class="store-card-icon">${iconSvg}</div>
                    <div class="market-card-info">
                        <span class="market-card-name" title="${item.name}">${item.name}</span>
                        <span class="market-card-author">By ${item.author || 'MR Prog'}</span>
                    </div>
                    <button class="store-card-info-btn market-info-btn" data-id="${item.id}" title="Widget details" aria-label="Widget details">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>
                <div class="market-card-desc" title="${item.description}">${item.description}</div>
                <div class="market-card-footer">
                    <div class="market-card-stats-row">
                        <button type="button" class="market-like-btn ${isLiked ? 'liked' : ''}" data-id="${item.id}" title="${isLiked ? 'Liked' : 'Like'}">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="${isLiked ? '#ef4444' : 'none'}" stroke="${isLiked ? '#ef4444' : 'currentColor'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span class="like-count">${likesStr}</span>
                        </button>
                        <span class="market-downloads-tag">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>${downloadsStr}</span>
                        </span>
                    </div>
                    <button class="market-install-btn ${isInstalled ? 'installed' : ''}" data-id="${item.id}">
                        ${isInstalled ? `
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Added</span>
                        ` : `
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>Install</span>
                        `}
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.market-like-btn').forEach(likeBtn => {
        likeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = likeBtn.getAttribute('data-id');
            const res = widgetHub.toggleLike(id);
            likeBtn.classList.toggle('liked', res.liked);
            const countEl = likeBtn.querySelector('.like-count');
            const svgEl = likeBtn.querySelector('svg');
            if (countEl) countEl.textContent = res.countStr;
            if (svgEl) {
                svgEl.setAttribute('fill', res.liked ? '#ef4444' : 'none');
                svgEl.setAttribute('stroke', res.liked ? '#ef4444' : 'currentColor');
            }
            if (navigator.vibrate) navigator.vibrate(25);
        });
    });

    listEl.querySelectorAll('.market-info-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const targetItem = items.find(x => x.id === id);
            if (targetItem) openWidgetInfo(targetItem);
        });
    });

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
                widgetHub.incrementDownload(id);
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Added</span>
                `;
                btn.classList.add('installed');
                const tagSpan = btn.closest('.market-card')?.querySelector('.market-downloads-tag span');
                if (tagSpan) tagSpan.textContent = widgetHub.getDownloads(id);
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
    const searchToggleBtn = document.getElementById('store-search-toggle-btn');
    const searchCloseBtn = document.getElementById('store-search-close-btn');
    const searchField = document.getElementById('store-search-field');
    const subnavPills = document.getElementById('store-subnav-pills');
    const installedList = document.getElementById('store-installed-list');
    const marketList = document.getElementById('store-marketplace-list');
    const pillInstalled = document.getElementById('subtab-installed-btn');
    const pillMarket = document.getElementById('subtab-marketplace-btn');

    if (searchToggleBtn && searchField && subnavPills) {
        searchToggleBtn.addEventListener('click', () => {
            subnavPills.style.display = 'none';
            searchToggleBtn.style.display = 'none';
            searchField.style.display = 'flex';
            if (searchInput) searchInput.focus();
        });
    }

    const closeSearch = () => {
        if (!searchField || !subnavPills) return;
        searchField.style.display = 'none';
        subnavPills.style.display = 'flex';
        if (searchToggleBtn) searchToggleBtn.style.display = 'flex';
        if (searchInput) {
            searchInput.value = '';
            currentDrawerSearch = '';
            if (searchClear) searchClear.style.display = 'none';
            if (activeDrawerSubtab === 'installed') {
                renderInstalledDrawerList();
            } else {
                renderMarketplaceDrawerList();
            }
        }
    };

    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', closeSearch);
    }

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

async function downloadAndCacheWallpaper(url) {
    try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                try {
                    localStorage.setItem('progrid_offline_wallpaper', base64);
                } catch (e) {
                    console.warn('LocalStorage wallpaper save overflow:', e);
                }
                resolve(base64);
            };
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.warn('Wallpaper offline caching failed:', err);
        return url;
    }
}

function setupWallpaperGallery() {
    const galleryContainer = document.getElementById('wallpaper-gallery-container');
    const resetBgBtn = document.getElementById('reset-bg-btn');
    if (!galleryContainer) return;

    let html = `
        <div class="wallpaper-thumb-card upload-custom-wp-card" id="gallery-upload-card" title="Upload Custom Photo / Wallpaper">
            <div class="upload-wp-content">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span>Upload</span>
            </div>
        </div>
    `;
    WALLPAPER_COLLECTION.forEach(wp => {
        const isCurrent = state.presetBg === 'custom' && (state.customBg === wp.full || localStorage.getItem('progrid_offline_wallpaper'));
        const fallbackGrad = wp.gradient || 'linear-gradient(135deg, #1e293b, #0f172a)';
        html += `
            <div class="wallpaper-thumb-card ${isCurrent ? 'active' : ''}" data-url="${wp.full}" data-id="${wp.id}" title="${wp.name}" style="background: ${fallbackGrad};">
                <img src="${wp.thumb}" alt="${wp.name}" loading="lazy" onerror="this.style.opacity='0';" />
                <span class="wp-label">${wp.name}</span>
            </div>
        `;
    });

    galleryContainer.innerHTML = html;

    const uploadCard = document.getElementById('gallery-upload-card');
    const customBgInput = document.getElementById('custom-bg-input');
    if (uploadCard && customBgInput) {
        uploadCard.addEventListener('click', () => {
            customBgInput.click();
        });
    }

    galleryContainer.querySelectorAll('.wallpaper-thumb-card:not(.upload-custom-wp-card)').forEach(card => {
        card.addEventListener('click', () => {
            galleryContainer.querySelectorAll('.wallpaper-thumb-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const url = card.getAttribute('data-url');
            state.presetBg = 'custom';
            state.customBg = url;
            applyGlobalStyles();
            StorageEngine.save(state);
            if (navigator.vibrate) navigator.vibrate(25);

            downloadAndCacheWallpaper(url).then(cached => {
                if (cached && cached.startsWith('data:')) {
                    state.customBg = cached;
                    StorageEngine.save(state);
                }
            });
        });
    });

    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            galleryContainer.querySelectorAll('.wallpaper-thumb-card').forEach(c => c.classList.remove('active'));
            localStorage.removeItem('progrid_offline_wallpaper');
            state.presetBg = '1';
            state.customBg = null;
            applyGlobalStyles();
            StorageEngine.save(state);
            if (navigator.vibrate) navigator.vibrate(25);
        });
    }
}

/* ==========================================================================
   Workspaces & Skins Engine (Curated Presets + Custom Slots 1-3)
   ========================================================================== */
const WORKSPACE_PRESETS = {
    default: {
        id: 'default',
        name: 'Minimalist Daily',
        widgets: [
            { id: "w-search-default", type: "search", x: 0, y: 0, w: 4, h: 1, engine: "google", placeholder: "Search web, apps & bookmarks...", searchShape: "pill", isGlass: true, bg: "#ffffff" },
            { id: "w-clock-default", type: "clock", x: 0, y: 1, w: 2, h: 1, format24: true, showDate: true, calendarType: "gregorian", isGlass: true, bg: "#ffffff" },
            { id: "w-quote-default", type: "quote", x: 2, y: 1, w: 2, h: 1, category: "all", language: "all", quoteTheme: "default", isGlass: true, bg: "#ffffff" },
            {
                id: "w-folder-google",
                type: "folder",
                title: "Google Apps",
                x: 0, y: 2, w: 2, h: 2,
                isGlass: true,
                bg: "#ffffff",
                children: [
                    { id: "g-search", type: "shortcut", title: "Google", url: "https://google.com", icon: "", shape: "20px", iconBg: "#4285F4" },
                    { id: "g-mail", type: "shortcut", title: "Gmail", url: "https://mail.google.com", icon: "", shape: "20px", iconBg: "#EA4335" },
                    { id: "g-drive", type: "shortcut", title: "Drive", url: "https://drive.google.com", icon: "", shape: "20px", iconBg: "#34A853" },
                    { id: "g-yt", type: "shortcut", title: "YouTube", url: "https://youtube.com", icon: "", shape: "20px", iconBg: "#FF0000" },
                    { id: "g-maps", type: "shortcut", title: "Maps", url: "https://maps.google.com", icon: "", shape: "20px", iconBg: "#FBBC05" },
                    { id: "g-trans", type: "shortcut", title: "Translate", url: "https://translate.google.com", icon: "", shape: "20px", iconBg: "#4285F4" }
                ]
            }
        ]
    },
    trading: {
        id: 'trading',
        name: 'Trading & Market Hub',
        widgets: [
            { id: "w-search-trading", type: "search", x: 0, y: 0, w: 4, h: 1, engine: "google", placeholder: "Search ticker, crypto, markets...", searchShape: "pill", isGlass: true, bg: "#ffffff" },
            { id: "w-finance-trading", type: "finance", x: 0, y: 1, w: 2, h: 2, assets: ["BTC", "USDIRR", "ETH"], primaryAsset: "BTC", secondaryAsset: "USDIRR", baseCurrency: "USD", showChart: true, isGlass: true, bg: "#ffffff" },
            { id: "w-quote-trading", type: "quote", x: 2, y: 1, w: 2, h: 1, category: "philosophy", language: "all", quoteTheme: "amber", isGlass: true, bg: "#ffffff" },
            {
                id: "w-folder-trading",
                type: "folder",
                title: "Financial Hub",
                x: 2, y: 2, w: 2, h: 2,
                isGlass: true,
                bg: "#ffffff",
                children: [
                    { id: "f-tv", type: "shortcut", title: "TradingView", url: "https://tradingview.com", icon: "", shape: "20px", iconBg: "#2962FF" },
                    { id: "f-nobitex", type: "shortcut", title: "Nobitex", url: "https://nobitex.ir", icon: "", shape: "20px", iconBg: "#10B981" },
                    { id: "f-binance", type: "shortcut", title: "Binance", url: "https://binance.com", icon: "", shape: "20px", iconBg: "#F3BA2F" },
                    { id: "f-cmc", type: "shortcut", title: "CoinMarketCap", url: "https://coinmarketcap.com", icon: "", shape: "20px", iconBg: "#172554" }
                ]
            }
        ]
    },
    productivity: {
        id: 'productivity',
        name: 'Focus & Tasks Desk',
        widgets: [
            { id: "w-clock-prod", type: "clock", x: 0, y: 0, w: 2, h: 1, format24: true, showDate: true, calendarType: "gregorian", isGlass: true, bg: "#ffffff" },
            { id: "w-quote-prod", type: "quote", x: 2, y: 0, w: 2, h: 1, category: "science", language: "all", quoteTheme: "emerald", isGlass: true, bg: "#ffffff" },
            { id: "w-pomo-prod", type: "pomodoro", x: 0, y: 1, w: 2, h: 2, targetMinutes: 25, timeLeft: 1500, isRunning: false, isGlass: true, bg: "#ffffff" },
            {
                id: "w-check-prod",
                type: "checklist",
                x: 2, y: 1, w: 2, h: 2,
                isGlass: true,
                bg: "#ffffff",
                tasks: [
                    { id: 1, text: "Sprint goals & review", done: true },
                    { id: 2, text: "Focus block (25m)", done: false },
                    { id: 3, text: "Check inbox & updates", done: false }
                ]
            }
        ]
    }
};

function loadCustomWorkspaces() {
    try {
        const raw = localStorage.getItem('progrid_user_workspaces');
        return raw ? JSON.parse(raw) : { slot1: null, slot2: null, slot3: null };
    } catch {
        return { slot1: null, slot2: null, slot3: null };
    }
}

function saveCustomWorkspaces(data) {
    try {
        localStorage.setItem('progrid_user_workspaces', JSON.stringify(data));
    } catch {}
}

function applyWorkspacePreset(presetId) {
    let targetWidgets = null;
    let name = '';

    if (WORKSPACE_PRESETS[presetId]) {
        targetWidgets = JSON.parse(JSON.stringify(WORKSPACE_PRESETS[presetId].widgets));
        name = WORKSPACE_PRESETS[presetId].name;
    } else {
        const customSlots = loadCustomWorkspaces();
        if (customSlots[presetId] && customSlots[presetId].widgets) {
            targetWidgets = JSON.parse(JSON.stringify(customSlots[presetId].widgets));
            name = customSlots[presetId].name || 'Custom Skin';
        }
    }

    if (!targetWidgets) return;

    // Ensure all community widgets required by this workspace are registered as installed
    targetWidgets.forEach(w => {
        if (!['shortcut', 'search', 'clock', 'folder'].includes(w.type)) {
            if (!widgetHub.isInstalled(w.type)) {
                widgetHub.installedIds.push(w.type);
            }
        }
    });
    widgetHub.saveInstalledIds();

    grid.updateMetrics();
    state.widgets = targetWidgets;
    state.widgets.forEach(w => {
        w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: grid.columns };
    });
    grid.resolveAllFinalOverlaps(state.widgets);
    StorageEngine.save(state);
    renderGrid();
    renderInstalledDrawerList();

    if (window.showToast) window.showToast(`Applied '${name}' layout`);
    if (navigator.vibrate) navigator.vibrate(40);
}

function saveCurrentLayoutToSlot(slotKey) {
    const customSlots = loadCustomWorkspaces();
    const count = (state.widgets || []).filter(w => !w.isHidden).length;
    const slotNum = slotKey.replace('slot', '');
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    customSlots[slotKey] = {
        name: `Custom Skin ${slotNum}`,
        date: dateStr,
        count: count,
        widgets: JSON.parse(JSON.stringify(state.widgets))
    };

    saveCustomWorkspaces(customSlots);
    renderCustomWorkspacesUI();
    if (window.showToast) window.showToast(`Saved layout as Custom Skin ${slotNum}`);
    if (navigator.vibrate) navigator.vibrate(35);
}

function clearCustomWorkspaceSlot(slotKey) {
    const customSlots = loadCustomWorkspaces();
    customSlots[slotKey] = null;
    saveCustomWorkspaces(customSlots);
    renderCustomWorkspacesUI();
    if (window.showToast) window.showToast('Skin slot reset');
}

function renderCustomWorkspacesUI() {
    const container = document.getElementById('custom-workspaces-slots-container');
    if (!container) return;

    const customSlots = loadCustomWorkspaces();
    let html = '';

    ['slot1', 'slot2', 'slot3'].forEach((slotKey, idx) => {
        const slotData = customSlots[slotKey];
        const num = idx + 1;
        if (!slotData) {
            html += `
                <div class="custom-workspace-slot empty" data-slot="${slotKey}">
                    <div class="custom-slot-save-icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                    <span class="custom-slot-empty-title">Save Skin ${num}</span>
                    <span style="font-size: 8.5px; color: var(--text-secondary); opacity: 0.7;">Click to save current</span>
                </div>
            `;
        } else {
            html += `
                <div class="custom-workspace-slot" data-slot="${slotKey}">
                    <div class="custom-slot-active-top">
                        <span class="custom-slot-name">${slotData.name || `Skin ${num}`}</span>
                        <span class="custom-slot-meta">${slotData.count || 0} widgets</span>
                    </div>
                    <div style="font-size: 8.5px; color: var(--text-secondary); margin: 2px 0;">Saved ${slotData.date || 'Recently'}</div>
                    <div class="custom-slot-actions">
                        <button type="button" class="custom-slot-apply-btn" data-slot="${slotKey}">Apply</button>
                        <button type="button" class="custom-slot-icon-btn custom-slot-overwrite-btn" data-slot="${slotKey}" title="Overwrite with current layout">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                            </svg>
                        </button>
                        <button type="button" class="custom-slot-icon-btn custom-slot-clear-btn" data-slot="${slotKey}" title="Clear slot">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;

    container.querySelectorAll('.custom-workspace-slot.empty').forEach(emptySlot => {
        emptySlot.addEventListener('click', () => {
            const slotKey = emptySlot.getAttribute('data-slot');
            saveCurrentLayoutToSlot(slotKey);
        });
    });

    container.querySelectorAll('.custom-slot-apply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotKey = btn.getAttribute('data-slot');
            applyWorkspacePreset(slotKey);
        });
    });

    container.querySelectorAll('.custom-slot-overwrite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotKey = btn.getAttribute('data-slot');
            saveCurrentLayoutToSlot(slotKey);
        });
    });

    container.querySelectorAll('.custom-slot-clear-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotKey = btn.getAttribute('data-slot');
            clearCustomWorkspaceSlot(slotKey);
        });
    });
}

function setupWorkspacesUI() {
    const curatedSubtabBtn = document.getElementById('ws-subtab-curated');
    const customSubtabBtn = document.getElementById('ws-subtab-custom');
    const curatedView = document.getElementById('ws-view-curated');
    const customView = document.getElementById('ws-view-custom');

    if (curatedSubtabBtn && customSubtabBtn) {
        curatedSubtabBtn.addEventListener('click', () => {
            curatedSubtabBtn.classList.add('active');
            customSubtabBtn.classList.remove('active');
            if (curatedView) curatedView.classList.add('active');
            if (customView) customView.classList.remove('active');
        });

        customSubtabBtn.addEventListener('click', () => {
            customSubtabBtn.classList.add('active');
            curatedSubtabBtn.classList.remove('active');
            if (customView) customView.classList.add('active');
            if (curatedView) curatedView.classList.remove('active');
            renderCustomWorkspacesUI();
        });
    }

    document.querySelectorAll('.workspace-apply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const presetId = btn.getAttribute('data-preset');
            applyWorkspacePreset(presetId);
        });
    });

    renderCustomWorkspacesUI();
}

function setupAppearanceSubtabs() {
    const subtabWallpapers = document.getElementById('app-subtab-wallpapers');
    const subtabThemes = document.getElementById('app-subtab-themes');
    const viewWallpapers = document.getElementById('appearance-view-wallpapers');
    const viewThemes = document.getElementById('appearance-view-themes');

    if (subtabWallpapers && subtabThemes && viewWallpapers && viewThemes) {
        subtabWallpapers.addEventListener('click', () => {
            subtabWallpapers.classList.add('active');
            subtabThemes.classList.remove('active');
            viewWallpapers.classList.add('active');
            viewThemes.classList.remove('active');
        });

        subtabThemes.addEventListener('click', () => {
            subtabThemes.classList.add('active');
            subtabWallpapers.classList.remove('active');
            viewThemes.classList.add('active');
            viewWallpapers.classList.remove('active');
        });
    }

    // Initialize Theme Option Cards
    document.querySelectorAll('.theme-option-card').forEach(card => {
        const theme = card.getAttribute('data-theme');
        const isComingSoon = card.classList.contains('coming-soon');
        const isActive = (state.designTheme || 'frosted-glass') === theme;
        card.classList.toggle('active', isActive);
        const badge = card.querySelector('.theme-card-badge');
        if (badge && !isComingSoon) {
            badge.textContent = isActive ? 'Active' : 'Select';
        }

        card.addEventListener('click', () => {
            if (isComingSoon) {
                // Show subtle toast or feedback that Liquid Glass is coming in next update
                return;
            }
            if (navigator.vibrate) navigator.vibrate(25);
            applyDesignTheme(theme);
        });
    });

    const m3DarkBtn = document.getElementById('m3-tone-dark-btn');
    const m3LightBtn = document.getElementById('m3-tone-light-btn');

    if (m3DarkBtn && m3LightBtn) {
        m3DarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.theme = 'dark';
            document.body.classList.remove('light-mode');
            m3DarkBtn.classList.add('active');
            m3LightBtn.classList.remove('active');
            if (state.designTheme !== 'material3') {
                applyDesignTheme('material3');
            } else {
                StorageEngine.save(state);
                applyGlobalStyles();
                renderGrid();
            }
            if (navigator.vibrate) navigator.vibrate(25);
        });

        m3LightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.theme = 'light';
            document.body.classList.add('light-mode');
            m3LightBtn.classList.add('active');
            m3DarkBtn.classList.remove('active');
            if (state.designTheme !== 'material3') {
                applyDesignTheme('material3');
            } else {
                StorageEngine.save(state);
                applyGlobalStyles();
                renderGrid();
            }
            if (navigator.vibrate) navigator.vibrate(25);
        });
    }
}

function applyDesignTheme(theme) {
    if (theme === 'liquid-glass') return; // disabled until future release
    state.designTheme = theme;
    state.widgets.forEach(w => {
        w.isGlass = (theme !== 'material3');
        w.manualGlassConfig = false;
    });
    document.body.classList.remove('theme-liquid-glass', 'theme-frosted-glass', 'theme-material3');
    document.body.classList.add(`theme-${theme}`);
    StorageEngine.save(state);

    document.querySelectorAll('.theme-option-card').forEach(card => {
        const cardTheme = card.getAttribute('data-theme');
        const isComingSoon = card.classList.contains('coming-soon');
        const isActive = cardTheme === theme;
        card.classList.toggle('active', isActive);
        const badge = card.querySelector('.theme-card-badge');
        if (badge && !isComingSoon) {
            badge.textContent = isActive ? 'Active' : 'Select';
        }
    });

    renderGrid();
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
        startX = e.clientX;
        startY = e.clientY;
        isDraggingInitiated = false;
    });

    itemEl.addEventListener('pointermove', (e) => {
        if (!state.editMode) return;

        // Only engage drag session when swipe gesture is directed upward towards the grid
        if (!isDraggingInitiated) {
            const diffY = startY - e.clientY;
            const diffX = Math.abs(e.clientX - startX);
            
            if (diffY > 24 && diffY > diffX * 1.2) {
                grid.updateMetrics();
                effectiveW = Math.min(meta.defaultW, grid.columns);
                effectiveH = Math.min(meta.defaultH, grid.rowsCount);

                if (!grid.canFit(effectiveW, effectiveH, state.widgets)) {
                    return;
                }

                try {
                    itemEl.setPointerCapture(e.pointerId);
                } catch (err) {}

                isDraggingInitiated = true;
                itemEl.style.transform = 'scale(0.94)';
                itemEl.style.opacity = '0.75';
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

        // If user tapped without dragging towards grid, abort without adding widget
        if (!isDraggingInitiated || !dummy) {
            try {
                if (itemEl.hasPointerCapture && itemEl.hasPointerCapture(e.pointerId)) {
                    itemEl.releasePointerCapture(e.pointerId);
                }
            } catch (err) {}
            return;
        }

        try {
            if (itemEl.hasPointerCapture && itemEl.hasPointerCapture(e.pointerId)) {
                itemEl.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}
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

    itemEl.addEventListener('pointercancel', (e) => {
        itemEl.style.transform = '';
        itemEl.style.opacity = '';
        if (dummy) {
            dummy.remove();
            dummy = null;
        }
        isDraggingInitiated = false;
        if (ghost) ghost.classList.remove('active');
        try {
            if (itemEl.hasPointerCapture && itemEl.hasPointerCapture(e.pointerId)) {
                itemEl.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}
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
            if (uIcon === '🔗' || uIcon === '🌐') uIcon = '';
            let iconHtml = uIcon;
            let iconBg = ch.iconBg || 'transparent';
            let shape = ch.shape || '20px';

            if (!iconHtml) {
                const favUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(ch.url || '')}&size=128`;
                const fallbackSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
                iconHtml = `<img src="${favUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.outerHTML='${fallbackSvg.replace(/"/g, '&quot;')}'" draggable="false" />`;
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

const FINANCE_ASSET_ICONS = {
    'BTC': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#f7931a"/><path d="M15.2 10.3c.3-.8.2-1.7-.5-2.2-.6-.5-1.5-.7-2.6-.7V6h-1.2v1.4h-.9V6H8.8v1.4H7v1.4h1.1c.3 0 .4.2.4.4v5.6c0 .2-.1.4-.4.4H7v1.4h1.8V18h1.2v-1.4h.9V18h1.2v-1.4c2.1 0 3.5-.8 3.6-2.5 0-1-.5-1.7-1.3-2.1.9-.3 1.2-1 1-1.7zm-4-1.9h1.7c.9 0 1.5.3 1.5 1s-.6 1-1.5 1h-1.7V8.4zm2.1 6.2h-2.1v-2.2h2.1c1 0 1.7.4 1.7 1.1s-.7 1.1-1.7 1.1z" fill="#fff"/></svg>`,
    'USDIRR': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#10b981"/><path d="M7 8h10v8H7z" stroke="#fff" stroke-width="1.4" rx="1.5"/><circle cx="12" cy="12" r="2.2" stroke="#fff" stroke-width="1.3"/><path d="M12 6.5v1.5m0 8V17.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    'ETH': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#627eea"/><path d="M12 4l-4.5 7.5L12 14l4.5-2.5L12 4z" fill="#fff" fill-opacity=".8"/><path d="M7.5 11.5L12 14v-5.5L7.5 11.5z" fill="#fff" fill-opacity=".5"/><path d="M12 14l4.5-2.5L12 8.5V14z" fill="#fff" fill-opacity=".8"/><path d="M7.5 12.5L12 19l4.5-6.5L12 15l-4.5-2.5z" fill="#fff" fill-opacity=".8"/><path d="M12 15v4l4.5-6.5L12 15z" fill="#fff" fill-opacity=".5"/></svg>`,
    'SOL': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#141414"/><path d="M7 8h8.5l1.5 1.5-1.5 1.5H7l-1.5-1.5L7 8zm10 3.5H8.5L7 13l1.5 1.5H17l1.5-1.5-1.5-1.5zM7 16h8.5l1.5 1.5-1.5 1.5H7l-1.5-1.5L7 16z" fill="#a855f7"/></svg>`,
    'TON': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#0088cc"/><path d="M12 5l6.5 4.5L12 19 5.5 9.5 12 5zm0 2.2L7.6 9.8 12 16.5l4.4-6.7L12 7.2z" fill="#fff"/></svg>`,
    'GOLD': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#f59e0b"/><path d="M6 14.5l2.5-5h7L18 14.5H6z" fill="#fef3c7" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
    'OIL': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#334155"/><path d="M12 5c-2.5 3.5-5 6.5-5 9.5a5 5 0 0 0 10 0c0-3-2.5-6-5-9.5z" fill="#94a3b8"/></svg>`,
    'SILVER': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#64748b"/><path d="M6 14.5l2.5-5h7L18 14.5H6z" fill="#e2e8f0" stroke="#475569" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
    'EURUSD': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#0284c7"/><path d="M14.5 8.5a4 4 0 0 0-5.5 3.5h5.5m-5.5 1.5h5.5a4 4 0 0 1-5.5 3.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 12h3.5" stroke="#fff" stroke-width="1.6"/></svg>`,
    'GBPUSD': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="11" fill="#4f46e5"/><path d="M15 7.5a3 3 0 0 0-4.5 2.5c0 2.5 3 4 3 6h-6m5-3.5H9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`
};

const FINANCE_ASSET_INFO = {
    'BTC': { name: 'Bitcoin', symbol: 'BTC', icon: FINANCE_ASSET_ICONS.BTC },
    'USDIRR': { name: 'US Dollar (Toman)', symbol: 'USD/TMN', icon: FINANCE_ASSET_ICONS.USDIRR },
    'ETH': { name: 'Ethereum', symbol: 'ETH', icon: FINANCE_ASSET_ICONS.ETH },
    'SOL': { name: 'Solana', symbol: 'SOL', icon: FINANCE_ASSET_ICONS.SOL },
    'TON': { name: 'Toncoin', symbol: 'TON', icon: FINANCE_ASSET_ICONS.TON },
    'GOLD': { name: 'Gold (Ounce)', symbol: 'XAU', icon: FINANCE_ASSET_ICONS.GOLD },
    'OIL': { name: 'Brent Crude', symbol: 'OIL', icon: FINANCE_ASSET_ICONS.OIL },
    'SILVER': { name: 'Silver (Ounce)', symbol: 'XAG', icon: FINANCE_ASSET_ICONS.SILVER },
    'EURUSD': { name: 'Euro / Dollar', symbol: 'EUR', icon: FINANCE_ASSET_ICONS.EURUSD },
    'GBPUSD': { name: 'British Pound', symbol: 'GBP', icon: FINANCE_ASSET_ICONS.GBPUSD }
};

let currentFinanceAssets = ['BTC', 'USDIRR'];

function renderFinanceAssetChips() {
    const chipsContainer = document.getElementById('finance-asset-chips');
    const countEl = document.getElementById('finance-asset-count');
    const hiddenInput = document.getElementById('edit-finance-assets');
    const addBtn = document.getElementById('edit-finance-add-btn');
    const addSelect = document.getElementById('edit-finance-add-select');
    if (!chipsContainer || !hiddenInput) return;

    hiddenInput.value = JSON.stringify(currentFinanceAssets);
    if (countEl) countEl.textContent = `${currentFinanceAssets.length} / 4`;

    chipsContainer.innerHTML = '';
    currentFinanceAssets.forEach((assetId, index) => {
        const info = FINANCE_ASSET_INFO[assetId] || { name: assetId, symbol: assetId, icon: '📈' };
        const chip = document.createElement('div');
        chip.className = 'finance-chip';
        chip.innerHTML = `
            <span class="finance-chip-icon">${info.icon}</span>
            <span class="finance-chip-name">${info.symbol}</span>
            ${currentFinanceAssets.length > 1 ? `
                <button type="button" class="finance-chip-remove" title="Remove ${info.symbol}">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            ` : ''}
        `;
        const removeBtn = chip.querySelector('.finance-chip-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentFinanceAssets.length > 1) {
                    currentFinanceAssets.splice(index, 1);
                    renderFinanceAssetChips();
                }
            });
        }
        chipsContainer.appendChild(chip);
    });

    const isFull = currentFinanceAssets.length >= 4;
    if (addBtn) addBtn.disabled = isFull;
    if (addSelect) addSelect.disabled = isFull;
}

function openModal(w, isPreAdd = false) {
    if (!isPreAdd && Date.now() - (window.__lastDropTimestamp || 0) < 450) return;
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    
    document.getElementById('edit-w-id').value = w.id;

    const modalTitle = document.getElementById('modal-header-title');
    const saveBtn = document.getElementById('modal-save-btn');
    const deleteBtn = document.getElementById('modal-delete-btn');

    if (modalTitle) {
        modalTitle.textContent = isPreAdd ? `Configure & Add ${w.type.charAt(0).toUpperCase() + w.type.slice(1)}` : 'Configure Widget';
    }
    if (saveBtn) {
        saveBtn.innerHTML = isPreAdd ? `
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-2px; margin-right:4px;">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add to Grid</span>
        ` : '<span>Save</span>';
    }
    if (deleteBtn) {
        deleteBtn.style.display = isPreAdd ? 'none' : 'block';
    }
    
    document.querySelectorAll('.id-shortcut-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-search-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-folder-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-clock-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-finance-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.id-quote-only').forEach(el => el.style.display = 'none');

    if (w.type === 'shortcut') {
        document.querySelectorAll('.id-shortcut-only').forEach(el => el.style.display = 'flex');
        const titleInput = document.getElementById('edit-w-title');
        const urlInput = document.getElementById('edit-w-url');
        const iconUrlInput = document.getElementById('edit-w-icon-url');
        const iconLetterInput = document.getElementById('edit-w-icon');

        titleInput.value = w.title || '';
        urlInput.value = w.url || '';
        if (iconUrlInput) iconUrlInput.value = w.iconUrl || '';
        if (iconLetterInput) iconLetterInput.value = w.icon !== undefined ? w.icon : '';
        
        currentShapeSelection = w.shape || '20px';
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-shape') === currentShapeSelection));
        
        currentIconBgSelection = w.iconBg || 'transparent';
        updateColorUI('iconBg', currentIconBgSelection);

        // Smart dynamic auto-fill when URL changes
        urlInput.oninput = () => {
            const val = urlInput.value.toLowerCase().trim();
            if (!titleInput.value || titleInput.value === 'Link' || titleInput.value === 'Google') {
                if (val.includes('mail.google.com') || val.includes('gmail.com')) titleInput.value = 'Gmail';
                else if (val.includes('youtube.com') || val.includes('youtu.be')) titleInput.value = 'YouTube';
                else if (val.includes('github.com')) titleInput.value = 'GitHub';
                else if (val.includes('telegram.org') || val.includes('t.me')) titleInput.value = 'Telegram';
                else if (val.includes('twitter.com') || val.includes('x.com')) titleInput.value = 'X';
                else if (val.includes('instagram.com')) titleInput.value = 'Instagram';
                else if (val.includes('chatgpt.com') || val.includes('openai.com')) titleInput.value = 'ChatGPT';
                else if (val.includes('whatsapp.com')) titleInput.value = 'WhatsApp';
                else if (val.includes('spotify.com')) titleInput.value = 'Spotify';
                else if (val.includes('discord.com')) titleInput.value = 'Discord';
                else if (val.includes('reddit.com')) titleInput.value = 'Reddit';
                else if (val.includes('linkedin.com')) titleInput.value = 'LinkedIn';
            }
        };

    } else if (w.type === 'folder') {
        document.querySelectorAll('.id-folder-only').forEach(el => el.style.display = 'flex');
        document.getElementById('edit-folder-title').value = w.title || '';
    } else if (w.type === 'search') {
        document.querySelectorAll('.id-search-only').forEach(el => el.style.display = 'flex');
        document.getElementById('edit-search-engine').value = w.engine || 'google';
        document.getElementById('edit-search-placeholder').value = w.placeholder || '';
        document.getElementById('edit-search-suggestions').checked = w.showSuggestions !== false;

        currentSearchShapeSelection = w.searchShape || 'pill';
        document.querySelectorAll('.search-shape-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-shape') === currentSearchShapeSelection));
    } else if (w.type === 'clock') {
        document.querySelectorAll('.id-clock-only').forEach(el => {
            el.style.display = el.classList.contains('glass-toggle-switch') ? 'inline-block' : 'flex';
        });
        const calSelect = document.getElementById('edit-clock-calendar');
        if (calSelect) calSelect.value = w.calendarType || (w.showDate === false ? 'none' : 'gregorian');
        const tzSelect = document.getElementById('edit-clock-timezone');
        if (tzSelect) tzSelect.value = w.timezone || 'local';
        const h24Check = document.getElementById('edit-clock-24h');
        if (h24Check) h24Check.checked = w.format24 !== false;
        const secCheck = document.getElementById('edit-clock-seconds');
        if (secCheck) secCheck.checked = !!w.showSeconds;
    } else if (w.type === 'finance') {
        document.querySelectorAll('.id-finance-only').forEach(el => {
            el.style.display = el.classList.contains('glass-toggle-switch') ? 'inline-block' : 'flex';
        });

        if (Array.isArray(w.assets) && w.assets.length > 0) {
            currentFinanceAssets = [...w.assets.slice(0, 4)];
        } else {
            currentFinanceAssets = [w.primaryAsset || 'BTC', w.secondaryAsset || 'USDIRR'].filter(Boolean);
        }
        if (currentFinanceAssets.length === 0) currentFinanceAssets = ['BTC', 'USDIRR'];

        renderFinanceAssetChips();

        const addBtn = document.getElementById('edit-finance-add-btn');
        const addSelect = document.getElementById('edit-finance-add-select');
        if (addBtn && addSelect) {
            addBtn.onclick = (e) => {
                e.preventDefault();
                const sel = addSelect.value;
                if (currentFinanceAssets.length < 4 && !currentFinanceAssets.includes(sel)) {
                    currentFinanceAssets.push(sel);
                    renderFinanceAssetChips();
                }
            };
        }

        const chartToggle = document.getElementById('edit-finance-chart');
        if (chartToggle) chartToggle.checked = w.showChart !== false;

        const curSelect = document.getElementById('edit-finance-currency');
        if (curSelect) curSelect.value = w.baseCurrency || 'USD';
    } else if (w.type === 'quote') {
        document.querySelectorAll('.id-quote-only').forEach(el => {
            el.style.display = el.classList.contains('modal-field') ? 'flex' : 'block';
        });
        const catSelect = document.getElementById('edit-quote-category');
        if (catSelect) catSelect.value = w.category || 'all';
        const langSelect = document.getElementById('edit-quote-lang');
        if (langSelect) langSelect.value = w.language || 'all';
        const themeSelect = document.getElementById('edit-quote-theme');
        if (themeSelect) themeSelect.value = w.quoteTheme || 'default';
    }
    
    currentWidgetBgSelection = w.bg || '#ffffff';
    updateColorUI('widgetBg', currentWidgetBgSelection);
    overlay.style.display = 'flex';
}

function closeModal() { 
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none'; 
}

function saveWidgetSettings() {
    const id = document.getElementById('edit-w-id').value;
    const isPreAdd = id.startsWith('pending-add-');

    if (isPreAdd) {
        const type = id.split('-')[2];
        const meta = window.WidgetGlobals ? window.WidgetGlobals.getMetadata(type) : null;
        if (!meta) {
            closeModal();
            return;
        }

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
            ...JSON.parse(JSON.stringify(meta.defaultConfig || {})),
            isGlass: state.designTheme !== 'material3',
            manualGlassConfig: true,
            bg: currentWidgetBgSelection
        };

        if (type === 'shortcut') {
            newWidget.title = document.getElementById('edit-w-title').value || 'Link';
            newWidget.url = document.getElementById('edit-w-url').value || 'https://google.com';
            const iconUrlInput = document.getElementById('edit-w-icon-url');
            if (iconUrlInput) newWidget.iconUrl = iconUrlInput.value.trim();
            newWidget.icon = document.getElementById('edit-w-icon').value;
            newWidget.shape = currentShapeSelection;
            newWidget.iconBg = currentIconBgSelection;
        } else if (type === 'folder') {
            newWidget.title = document.getElementById('edit-folder-title').value || 'Folder';
        } else if (type === 'search') {
            newWidget.engine = document.getElementById('edit-search-engine').value;
            newWidget.placeholder = document.getElementById('edit-search-placeholder').value;
            newWidget.searchShape = currentSearchShapeSelection || 'pill';
            newWidget.showSuggestions = document.getElementById('edit-search-suggestions').checked;
        } else if (type === 'clock') {
            const cal = document.getElementById('edit-clock-calendar').value;
            newWidget.calendarType = cal;
            newWidget.showDate = cal !== 'none';
            newWidget.timezone = document.getElementById('edit-clock-timezone').value;
            newWidget.format24 = document.getElementById('edit-clock-24h').checked;
            newWidget.showSeconds = document.getElementById('edit-clock-seconds').checked;
        } else if (type === 'finance') {
            const rawAssets = JSON.parse(document.getElementById('edit-finance-assets').value || '["BTC"]');
            newWidget.assets = Array.isArray(rawAssets) && rawAssets.length > 0 ? rawAssets.slice(0, 4) : ['BTC'];
            newWidget.primaryAsset = newWidget.assets[0];
            newWidget.secondaryAsset = newWidget.assets[1] || 'USDIRR';
            newWidget.viewMode = newWidget.assets.length === 1 ? 'single' : (newWidget.assets.length === 2 ? 'dual' : 'grid');
            newWidget.showChart = document.getElementById('edit-finance-chart').checked;
            const curSelect = document.getElementById('edit-finance-currency');
            newWidget.baseCurrency = curSelect ? curSelect.value : 'USD';
        } else if (type === 'quote') {
            const cat = document.getElementById('edit-quote-category');
            if (cat) newWidget.category = cat.value;
            const lang = document.getElementById('edit-quote-lang');
            if (lang) newWidget.language = lang.value;
            const theme = document.getElementById('edit-quote-theme');
            if (theme) newWidget.quoteTheme = theme.value;
        }

        newWidget.idealLayout = { x: newWidget.x, y: newWidget.y, w: newWidget.w, h: newWidget.h, baseCols: grid.columns };
        state.widgets.push(newWidget);
        grid.resolveAllFinalOverlaps(state.widgets);
        StorageEngine.save(state);
        renderGrid();
        if (navigator.vibrate) navigator.vibrate(35);
        closeModal();
        return;
    }

    const w = state.widgets.find(item => item.id === id);
    if (w) {
        w.isGlass = state.designTheme !== 'material3';
        w.manualGlassConfig = true;
        w.bg = currentWidgetBgSelection;
        if (w.type === 'shortcut') {
            w.title = document.getElementById('edit-w-title').value;
            w.url = document.getElementById('edit-w-url').value;
            const iconUrlInput = document.getElementById('edit-w-icon-url');
            if (iconUrlInput) w.iconUrl = iconUrlInput.value.trim();
            w.icon = document.getElementById('edit-w-icon').value;
            w.shape = currentShapeSelection;
            w.iconBg = currentIconBgSelection;
        } else if (w.type === 'folder') {
            w.title = document.getElementById('edit-folder-title').value;
        } else if (w.type === 'search') {
            w.engine = document.getElementById('edit-search-engine').value;
            w.placeholder = document.getElementById('edit-search-placeholder').value;
            w.searchShape = currentSearchShapeSelection || 'pill';
            w.showSuggestions = document.getElementById('edit-search-suggestions').checked;
        } else if (w.type === 'clock') {
            const cal = document.getElementById('edit-clock-calendar').value;
            w.calendarType = cal;
            w.showDate = cal !== 'none';
            w.timezone = document.getElementById('edit-clock-timezone').value;
            w.format24 = document.getElementById('edit-clock-24h').checked;
            w.showSeconds = document.getElementById('edit-clock-seconds').checked;
        } else if (w.type === 'finance') {
            const rawAssets = JSON.parse(document.getElementById('edit-finance-assets').value || '["BTC"]');
            w.assets = Array.isArray(rawAssets) && rawAssets.length > 0 ? rawAssets.slice(0, 4) : ['BTC'];
            w.primaryAsset = w.assets[0];
            w.secondaryAsset = w.assets[1] || 'USDIRR';
            w.viewMode = w.assets.length === 1 ? 'single' : (w.assets.length === 2 ? 'dual' : 'grid');
            w.showChart = document.getElementById('edit-finance-chart').checked;
            const curSelect = document.getElementById('edit-finance-currency');
            w.baseCurrency = curSelect ? curSelect.value : 'USD';
        } else if (w.type === 'quote') {
            const cat = document.getElementById('edit-quote-category');
            if (cat) w.category = cat.value;
            const lang = document.getElementById('edit-quote-lang');
            if (lang) w.language = lang.value;
            const theme = document.getElementById('edit-quote-theme');
            if (theme) w.quoteTheme = theme.value;
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
    pomodoro: 'Engineered focus sessions and countdown timer with chime notification.',
    finance: 'Interactive financial tracker with 24h hourly charts, single/dual currency focus, and Iranian Toman rates.',
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

function openWidgetInfo(wOrMeta) {
    if (!wOrMeta) return;
    const modal = document.getElementById('widget-info-modal');
    if (!modal) return;

    let meta = null;
    let title = '';
    let type = '';
    let w = 1, h = 1;
    let author = 'ProGrid';
    let version = '1.0.0';
    let desc = '';

    if (wOrMeta.type && window.WidgetGlobals) {
        meta = window.WidgetGlobals.getMetadata(wOrMeta.type);
    }
    if (!meta && wOrMeta.id && window.WidgetGlobals) {
        meta = window.WidgetGlobals.getMetadata(wOrMeta.id);
    }
    if (!meta) {
        meta = wOrMeta;
    }

    type = wOrMeta.type || (meta && meta.type) || (meta && meta.id) || 'widget';
    title = wOrMeta.title || (meta && (meta.label || meta.name)) || type;
    w = wOrMeta.w || (meta && (meta.defaultW || meta.w)) || 1;
    h = wOrMeta.h || (meta && (meta.defaultH || meta.h)) || 1;
    const isCore = CORE_WIDGET_TYPES.includes(type);
    author = (meta && meta.author) || wOrMeta.author || (isCore ? 'ProGrid' : 'MR Prog');
    version = (meta && meta.version) || wOrMeta.version || '1.5.0';
    if (!version.startsWith('v')) version = `v${version}`;
    desc = (meta && meta.description) || widgetDescriptions[type] || 'Modular ProGrid fluid widget component.';

    const iconEl = document.getElementById('info-w-icon');
    const labelEl = document.getElementById('info-w-label');
    const typeEl = document.getElementById('info-w-type');
    const sizeEl = document.getElementById('info-w-size');
    const descEl = document.getElementById('info-w-desc');
    const authorEl = document.getElementById('info-w-author');
    const versionEl = document.getElementById('info-w-version');
    const downloadsEl = document.getElementById('info-w-downloads');
    const actionBtn = document.getElementById('info-action-btn');

    if (iconEl) iconEl.innerHTML = getWidgetIconSvg(type);
    if (labelEl) labelEl.textContent = title;
    if (typeEl) typeEl.textContent = `${type} widget`;
    if (sizeEl) sizeEl.textContent = `${w} × ${h}`;
    if (descEl) descEl.textContent = desc;
    if (authorEl) authorEl.textContent = author;
    if (versionEl) versionEl.textContent = version;
    if (downloadsEl) downloadsEl.textContent = widgetHub.getDownloads(type);

    if (actionBtn) {
        const isInstalled = isCore || widgetHub.isInstalled(type);
        if (isInstalled) {
            actionBtn.textContent = 'Add to Grid';
            actionBtn.style.background = '#3b82f6';
            actionBtn.onclick = () => {
                closeWidgetInfo();
                addWidgetDirectly(type);
            };
        } else {
            actionBtn.textContent = 'Install Widget';
            actionBtn.style.background = '#10b981';
            actionBtn.onclick = async () => {
                actionBtn.textContent = 'Installing...';
                const items = await widgetHub.fetchRegistry();
                const target = items.find(x => x.id === type) || meta;
                const ok = await widgetHub.installWidget(target);
                if (ok) {
                    renderInstalledDrawerList();
                    renderMarketplaceDrawerList();
                    if (downloadsEl) downloadsEl.textContent = widgetHub.getDownloads(type);
                    actionBtn.textContent = 'Add to Grid';
                    actionBtn.style.background = '#3b82f6';
                    actionBtn.onclick = () => {
                        closeWidgetInfo();
                        addWidgetDirectly(type);
                    };
                } else {
                    actionBtn.textContent = 'Retry Install';
                }
            };
        }
    }

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

function isNewerVersion(remote, current) {
    if (!remote || !current) return false;
    const r = remote.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const c = current.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(r.length, c.length); i++) {
        const rv = r[i] || 0;
        const cv = c[i] || 0;
        if (rv > cv) return true;
        if (rv < cv) return false;
    }
    return false;
}

function launchUpdateSplashScreen(targetVer = 'v0.3.1') {
    const splash = document.getElementById('update-splash-screen');
    const stepEl = document.getElementById('update-splash-step');
    const fillEl = document.getElementById('update-splash-bar-progress');
    const verEl = document.getElementById('update-splash-ver');
    
    const formattedVer = targetVer.startsWith('v') ? targetVer : `v${targetVer}`;
    if (verEl) verEl.textContent = `Upgrading to ${formattedVer}`;
    
    if (splash) {
        splash.style.display = 'flex';
        requestAnimationFrame(() => splash.classList.add('active'));
    }

    const setStep = (text, percent) => {
        if (stepEl) {
            stepEl.style.opacity = '0';
            setTimeout(() => {
                stepEl.textContent = text;
                stepEl.style.opacity = '1';
            }, 80);
        }
        if (fillEl) fillEl.style.width = `${percent}%`;
    };

    setStep('Fetching latest update from repository...', 30);

    // Stage 1: Purge existing CacheStorage
    try {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
    } catch (e) {}

    // Stage 2: Service Worker Skip Waiting
    setTimeout(async () => {
        setStep(`Installing ${formattedVer} engine...`, 70);
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    await reg.update();
                }
            } catch (e) {}
        }
        try {
            sessionStorage.setItem('progrid_updated_toast', formattedVer);
        } catch (e) {}
    }, 450);

    // Stage 3: Workspace reload
    setTimeout(() => {
        setStep('Restarting ProGrid Workspace...', 95);
    }, 900);

    setTimeout(() => {
        if (fillEl) fillEl.style.width = '100%';
        window.location.href = window.location.pathname + '?upgraded=' + Date.now();
    }, 1250);
}

function showUpdateSuccessToast(verStr) {
    const toast = document.getElementById('update-success-toast');
    const textEl = document.getElementById('update-toast-text');
    if (!toast) return;

    if (textEl) {
        textEl.textContent = `ProGrid updated to ${verStr} successfully!`;
    }

    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3800);
}

function setupAboutModal() {
    const aboutBtn = document.getElementById('panel-about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeBtn = document.getElementById('about-close-btn');
    const checkUpdateBtn = document.getElementById('about-check-update-btn');
    const updateDot = document.getElementById('update-indicator-dot');
    const updateTitle = document.getElementById('update-status-title');
    const updateSub = document.getElementById('update-status-sub');
    const btnLabel = document.getElementById('update-btn-label');

    if (!aboutModal) return;

    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            const verBadge = document.getElementById('about-app-version');
            if (verBadge) verBadge.textContent = 'v0.3.1';
            const subTitle = document.getElementById('update-status-sub');
            if (subTitle && !subTitle.textContent.includes('v0.3.1')) {
                subTitle.textContent = 'Running official v0.3.1 release';
            }
            aboutModal.style.display = 'flex';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            aboutModal.style.display = 'none';
        });
    }

    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) aboutModal.style.display = 'none';
    });

    if (checkUpdateBtn) {
        let isChecking = false;
        checkUpdateBtn.addEventListener('click', async () => {
            if (isChecking) return;

            // Only launch splash screen if an actual new update was found and verified
            if (checkUpdateBtn.getAttribute('data-action') === 'apply-update') {
                const targetVer = checkUpdateBtn.getAttribute('data-target-ver') || 'v0.3.1';
                aboutModal.style.display = 'none';
                launchUpdateSplashScreen(targetVer);
                return;
            }

            isChecking = true;
            checkUpdateBtn.classList.add('spin');
            if (btnLabel) btnLabel.textContent = 'Checking...';
            if (updateDot) updateDot.className = 'update-indicator-dot checking';
            if (updateTitle) updateTitle.textContent = 'Checking for updates...';
            if (updateSub) updateSub.textContent = 'Querying repository & cache verification...';

            try {
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg) await reg.update();
                }

                let remoteVersion = null;
                const currentVersion = '0.3.1';

                // 1. Direct GitHub Releases API check
                try {
                    const releaseRes = await fetch('https://api.github.com/repos/MR-PR0G/ProGrid/releases/latest', {
                        headers: { 'Accept': 'application/vnd.github.v3+json' },
                        signal: AbortSignal.timeout(3500)
                    });
                    if (releaseRes.ok) {
                        const relData = await releaseRes.json();
                        if (relData && relData.tag_name) {
                            remoteVersion = relData.tag_name.replace(/^v/, '');
                        }
                    }
                } catch (_) {}

                // 2. Raw Repository Manifest Check
                if (!remoteVersion) {
                    try {
                        const gitRes = await fetch(`https://raw.githubusercontent.com/MR-PR0G/ProGrid/main/manifest.json?t=${Date.now()}`, {
                            cache: 'no-store',
                            signal: AbortSignal.timeout(3500)
                        });
                        if (gitRes.ok) {
                            const gitData = await gitRes.json();
                            if (gitData && gitData.version) {
                                remoteVersion = gitData.version;
                            }
                        }
                    } catch (_) {}
                }

                if (!remoteVersion) {
                    const res = await fetch(`./manifest.json?t=${Date.now()}`, { cache: 'no-store' });
                    if (res.ok) {
                        const localData = await res.json();
                        remoteVersion = localData.version || currentVersion;
                    }
                }

                if (remoteVersion && isNewerVersion(remoteVersion, currentVersion)) {
                    if (updateDot) updateDot.className = 'update-indicator-dot update-found';
                    if (updateTitle) updateTitle.textContent = `New Update v${remoteVersion} Available!`;
                    if (updateSub) updateSub.textContent = 'A new release is ready on GitHub. Click to upgrade.';
                    if (btnLabel) btnLabel.textContent = `Update to v${remoteVersion}`;
                    checkUpdateBtn.setAttribute('data-action', 'apply-update');
                    checkUpdateBtn.setAttribute('data-target-ver', `v${remoteVersion}`);
                } else {
                    if (updateDot) updateDot.className = 'update-indicator-dot';
                    if (updateTitle) updateTitle.textContent = 'System Up to Date';
                    if (updateSub) updateSub.textContent = `ProGrid v${currentVersion} is the latest verified release.`;
                    if (btnLabel) btnLabel.textContent = 'Check Updates';
                    checkUpdateBtn.setAttribute('data-action', 'check');
                    checkUpdateBtn.removeAttribute('data-target-ver');
                }
            } catch (err) {
                console.warn('Update check error:', err);
                if (updateDot) updateDot.className = 'update-indicator-dot';
                if (updateTitle) updateTitle.textContent = 'Up to Date (Offline)';
                if (updateSub) updateSub.textContent = 'Running standalone v0.3.1 release.';
                if (btnLabel) btnLabel.textContent = 'Check Updates';
                checkUpdateBtn.setAttribute('data-action', 'check');
                checkUpdateBtn.removeAttribute('data-target-ver');
            } finally {
                isChecking = false;
                checkUpdateBtn.classList.remove('spin');
            }
        });
    }
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
            const editPanel = document.getElementById('edit-panel');
            const collapseBtn = document.getElementById('panel-collapse-btn');
            if (editPanel) editPanel.classList.add('collapsed');
            document.body.classList.add('shelf-collapsed');
            if (collapseBtn) collapseBtn.setAttribute('title', 'Expand Shelf');
            updateEditModeScale();
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

// Global lock against mobile virtual keyboard viewport scrolling (guarded during drag)
window.addEventListener('scroll', () => {
    if (document.querySelector('.widget-wrapper.dragging')) return;
    if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
    }
}, { passive: false });