import { GridEngine } from './grid.js';
import { StorageEngine } from './storage.js';

const DYNAMIC_WIDGET_LIST = ['shortcut', 'search', 'checklist', 'folder'];

async function loadSystemWidgets() {
    for (const name of DYNAMIC_WIDGET_LIST) {
        try { await import(`../widgets/${name}.js`); } catch (e) {}
    }
}

let state = { editMode: false, blurValue: 16, presetBg: '1', theme: 'dark', customBg: null, widgets: [] };
window.appState = state;

const grid = new GridEngine();
const container = document.getElementById('grid-container');
const blurOverlay = document.getElementById('blur-overlay');
const ghost = document.getElementById('ghost-guide');
const deleteZone = document.getElementById('delete-zone');
const folderOverlay = document.getElementById('folder-overlay-view');
const dynamicBgLayer = document.getElementById('dynamic-bg-layer');

let initialWidgetsState = null;
let currentShapeSelection = '20px';
let currentIconBgSelection = 'transparent';
let currentWidgetBgSelection = '#ffffff';
let touchStartY = 0;
let bgLongPressTimeout = null;
let potentialMergeTargetId = null;
let rAFActive = false;
let currentColumnsCount = 4;

async function init() {
    await loadSystemWidgets();
    const loaded = StorageEngine.load();
    if (loaded) {
        state.blurValue = loaded.blurValue ?? 16;
        state.presetBg = loaded.presetBg || '1';
        state.theme = loaded.theme || 'dark';
        state.customBg = loaded.customBg || null;
        state.widgets = loaded.widgets || [];
    } else {
        state.widgets = [
            { id: 'w-1', type: 'shortcut', x: 0, y: 0, w: 1, h: 1, title: 'Google', url: 'https://google.com', icon: '', iconBg: 'transparent', shape: '20px', isGlass: true, bg: '#ffffff' },
            { id: 'w-2', type: 'search', x: 1, y: 0, w: 2, h: 1, engine: 'google', placeholder: 'Search...', isGlass: true, bg: '#ffffff' }
        ];
    }

    grid.updateMetrics();
    currentColumnsCount = grid.columns;
    state.widgets.forEach(w => {
        if (!w.idealLayout) w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: currentColumnsCount };
    });

    grid.resolveAllFinalOverlaps(state.widgets);
    renderGrid();
    setupGlobalEvents();
    setupBackgroundActivationSensors();
    applyGlobalStyles();
    populateWidgetBottomStore();
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
        dynamicBgLayer.className = 'bg-layer';
        dynamicBgLayer.style.backgroundImage = `url(${state.customBg})`;
    } else {
        dynamicBgLayer.style.backgroundImage = 'none';
        dynamicBgLayer.className = `bg-layer bg-dynamic`;
        dynamicBgLayer.style.background = `var(--bg-preset-${state.presetBg})`;
    }
}

function renderGrid() {
    if (!container) return;
    const oldCols = currentColumnsCount;
    grid.updateMetrics();
    currentColumnsCount = grid.columns;

    grid.resolveAllFinalOverlaps(state.widgets, oldCols);
    
    Array.from(container.children).forEach(child => {
        if (child.id !== 'ghost-guide' && !child.classList.contains('grid-cell-visual')) child.remove();
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
        if (window.WidgetGlobals && window.WidgetGlobals.get(w.type)) createWidgetDOM(w);
    });
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
    container.appendChild(wrapper);

    if (instance && instance.postRender) instance.postRender(wrapper);
    attachInteractionEngine(wrapper, w, instance);
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
    return (clientX >= (dzRect.left - fuzz) && clientX <= (dzRect.right + fuzz) && clientY >= (dzRect.top - fuzz) && clientY <= (dzRect.bottom + fuzz));
}

function attachInteractionEngine(el, w, instance) {
    let initialX, initialY, startW, startH;
    let dragOffsetX = 0, dragOffsetY = 0;
    let isDragging = false, isResizing = false;

    const meta = window.WidgetGlobals.getMetadata(w.type) || { minW: 1, minH: 1, maxW: 4, maxH: 4 };
    if (w.type === 'search') { meta.minW = 2; meta.maxH = 1; meta.minH = 1; meta.maxW = 99; }
    let minW = meta.minW || 1; let minH = meta.minH || 1;
    let maxW = meta.maxW || 4; let maxH = meta.maxH || 4;

    el.addEventListener('contextmenu', (e) => { e.preventDefault(); if (state.editMode) openModal(w); });

    el.addEventListener('pointerdown', (e) => {
        if (!state.editMode) return;
        if (w.type === 'checklist' && (e.target.closest('.checklist-item') || e.target.closest('.checklist-add'))) return;
        if ((w.type === 'shortcut' || w.type === 'folder') && e.target.closest('a')) e.preventDefault();

        el.setPointerCapture(e.pointerId);
        initialWidgetsState = JSON.parse(JSON.stringify(state.widgets));
        initialX = e.clientX; initialY = e.clientY;

        if (e.target.classList.contains('resize-handle')) {
            isResizing = true; el.classList.add('resizing');
            startW = el.offsetWidth; startH = el.offsetHeight;
        } else {
            isDragging = true; el.classList.add('dragging');
            if (ghost) ghost.classList.add('active');
            const rect = el.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left; dragOffsetY = e.clientY - rect.top;
            updateGhost(w);
        }
        e.stopPropagation();
    });

    el.addEventListener('pointermove', (e) => {
        if (!state.editMode) return;
        if (!isDragging && !isResizing) return;
        if (rAFActive) return;
        rAFActive = true;

        requestAnimationFrame(() => {
            rAFActive = false;
            grid.updateMetrics();
            maxW = w.type === 'search' ? grid.columns : Math.min(meta.maxW || 4, grid.columns);
            maxH = Math.min(meta.maxH || 4, grid.rowsCount);
            const containerBounds = container.getBoundingClientRect();

            if (isDragging) {
                const targetLeft = e.clientX - dragOffsetX - containerBounds.left;
                const targetTop = e.clientY - dragOffsetY - containerBounds.top;
                el.style.left = `${targetLeft}px`; el.style.top = `${targetTop}px`;

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
                        activeInState.w = effectiveW; activeInState.h = effectiveH;
                        activeInState.x = liveX; activeInState.y = liveY;
                        
                        if (grid.omniMagnetPush(activeInState, tempWidgets)) {
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
                        }
                    }
                } else {
                    updateGhost({ id: w.id, x: liveX, y: liveY, w: effectiveW, h: effectiveH });
                }

            } else if (isResizing) {
                const deltaX = e.clientX - initialX; const deltaY = e.clientY - initialY;
                let currentW = startW + deltaX; let currentH = startH + deltaY;
                let maxAllowedPixelW = maxW * grid.cellSize + (maxW - 1) * grid.gap;
                let maxAllowedPixelH = maxH * grid.cellSize + (maxH - 1) * grid.gap;

                if (currentW > maxAllowedPixelW) currentW = maxAllowedPixelW;
                if (currentH > maxAllowedPixelH) currentH = maxAllowedPixelH;

                let gridW = Math.max(minW, Math.min(maxW, Math.round((currentW - grid.gap) / (grid.cellSize + grid.gap))));
                let gridH = Math.max(minH, Math.min(maxH, Math.round((currentH - grid.gap) / (grid.cellSize + grid.gap))));
                if (w.x + gridW > grid.columns) gridW = grid.columns - w.x;
                if (w.y + gridH > grid.rowsCount) gridH = grid.rowsCount - w.y;

                if (initialWidgetsState) {
                    let tempWidgets = JSON.parse(JSON.stringify(initialWidgetsState));
                    let activeInState = tempWidgets.find(item => item.id === w.id);
                    if (activeInState) {
                        activeInState.w = gridW; activeInState.h = gridH;
                        if (grid.omniMagnetPush(activeInState, tempWidgets)) {
                            currentW = gridW * grid.cellSize + (gridW - 1) * grid.gap;
                            currentH = gridH * grid.cellSize + (gridH - 1) * grid.gap;
                            el.style.width = `${currentW}px`; el.style.height = `${currentH}px`;
                            tempWidgets.forEach(tw => {
                                if (tw.id !== w.id && !tw.isHidden) {
                                    const realEl = document.getElementById(tw.id);
                                    if (realEl && !realEl.classList.contains('dragging') && !realEl.classList.contains('resizing')) {
                                        realEl.style.left = `${tw.x * (grid.cellSize + grid.gap)}px`;
                                        realEl.style.top = `${tw.y * (grid.cellSize + grid.gap)}px`;
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });
    });

    el.addEventListener('pointerup', (e) => {
        if (!state.editMode) return;
        el.releasePointerCapture(e.pointerId);
        el.classList.remove('dragging'); el.classList.remove('resizing');
        if (ghost) ghost.classList.remove('active');

        if (deleteZone && deleteZone.classList.contains('hovered')) {
            deleteZone.classList.remove('hovered');
            state.widgets = state.widgets.filter(item => item.id !== w.id);
            StorageEngine.save(state); renderGrid(); return;
        }

        if (potentialMergeTargetId) {
            const target = state.widgets.find(item => item.id === potentialMergeTargetId);
            if (target) {
                if (target.type === 'shortcut') {
                    target.type = 'folder'; target.w = 2; target.h = 2; target.title = "Folder";
                    target.children = [
                        { id: `ch-${Date.now()}-1`, type: 'shortcut', title: target.title || 'Link', url: target.url, icon: target.icon || '', shape: target.shape || '20px', iconBg: target.iconBg || 'transparent' },
                        { id: `ch-${Date.now()}-2`, type: 'shortcut', title: w.title || 'Link', url: w.url, icon: w.icon || '', shape: w.shape || '20px', iconBg: w.iconBg || 'transparent' }
                    ];
                } else if (target.type === 'folder') {
                    if (!target.children) target.children = [];
                    target.children.push({ id: `ch-${Date.now()}`, type: 'shortcut', title: w.title || 'Link', url: w.url, icon: w.icon || '', shape: w.shape || '20px', iconBg: w.iconBg || 'transparent' });
                }
                state.widgets = state.widgets.filter(item => item.id !== w.id);
                potentialMergeTargetId = null;
                grid.resolveAllFinalOverlaps(state.widgets);
                StorageEngine.save(state); renderGrid(); return;
            }
        }

        if (isDragging) {
            isDragging = false;
            w.w = Math.max(minW, Math.min(w.w, grid.columns));
            w.h = Math.max(minH, Math.min(w.h, grid.rowsCount));
            if (ghost) {
                w.x = Math.round(parseInt(ghost.style.left) / (grid.cellSize + grid.gap));
                w.y = Math.round(parseInt(ghost.style.top) / (grid.cellSize + grid.gap));
            }
        } else if (isResizing) {
            isResizing = false;
            let finalW = Math.round((el.offsetWidth - grid.gap) / (grid.cellSize + grid.gap));
            let finalH = Math.round((el.offsetHeight - grid.gap) / (grid.cellSize + grid.gap));
            w.w = Math.max(minW, Math.min(maxW, finalW));
            w.h = Math.max(minH, Math.min(maxH, finalH));
        }

        w.idealLayout = { x: w.x, y: w.y, w: w.w, h: w.h, baseCols: grid.columns };
        grid.omniMagnetPush(w, state.widgets);
        grid.resolveAllFinalOverlaps(state.widgets);
        StorageEngine.save(state); renderGrid();
    });
}

function setupBackgroundActivationSensors() {
    window.addEventListener('mousedown', (e) => {
        if (state.editMode || (e.target !== container && e.target !== document.getElementById('app-container') && e.target !== document.getElementById('grid-scale-wrapper'))) return;
        bgLongPressTimeout = setTimeout(() => { toggleEditMode(true); }, 750);
    });
    window.addEventListener('mouseup', () => { if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout); });
    
    window.addEventListener('touchstart', (e) => {
        if (state.editMode) return;
        if(e.touches && e.touches[0]) touchStartY = e.touches[0].clientY;
        if (e.target === container || e.target === document.getElementById('app-container') || e.target === document.getElementById('grid-scale-wrapper')) {
            bgLongPressTimeout = setTimeout(() => { toggleEditMode(true); }, 750);
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (state.editMode) return;
        if(e.touches && e.touches[0]) {
            let diffY = touchStartY - e.touches[0].clientY;
            if (diffY > 80) {
                if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout);
                toggleEditMode(true);
            }
        }
    }, { passive: true });
    window.addEventListener('touchend', () => { if (bgLongPressTimeout) clearTimeout(bgLongPressTimeout); });
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

function setupGlobalEvents() {
    window.addEventListener('resize', () => renderGrid());

    const doneBtn = document.getElementById('done-btn');
    if (doneBtn) doneBtn.addEventListener('click', () => toggleEditMode(false));

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
}

window.updateWidgetConfigDirectly = function(id, partialConfig) {
    const w = state.widgets.find(item => item.id === id);
    if (w) {
        Object.assign(w, partialConfig);
        StorageEngine.save(state);
        renderGrid();
    }
};

function populateWidgetBottomStore() {
    const store = document.getElementById('tab-widgets');
    if (!store || !window.WidgetGlobals) return;
    let html = '';
    window.WidgetGlobals.getAllMetadata().forEach(meta => {
        if (meta.type === 'folder') return;
        html += `
            <div class="store-item" data-type="${meta.type}">
                <span class="store-item-icon">${meta.icon || '📦'}</span>
                <span class="store-item-label">${meta.label}</span>
            </div>
        `;
    });
    store.innerHTML = html;
    store.querySelectorAll('.store-item').forEach(item => setupStoreDrag(item));
}

function setupStoreDrag(itemEl) {
    let type = itemEl.getAttribute('data-type');
    let meta = window.WidgetGlobals.getMetadata(type);
    if (!meta) return;
    if (type === 'search') { meta.defaultW = 2; meta.defaultH = 1; }

    let dummy = null;

    itemEl.addEventListener('pointerdown', (e) => {
        if (!state.editMode) return;
        itemEl.setPointerCapture(e.pointerId);
        initialWidgetsState = JSON.parse(JSON.stringify(state.widgets));
        grid.updateMetrics();

        let effectiveW = Math.min(meta.defaultW, grid.columns);
        let effectiveH = Math.min(meta.defaultH, grid.rowsCount);

        if (!grid.canFit(effectiveW, effectiveH, state.widgets)) {
            alert("No available space to add this widget!");
            return;
        }

        dummy = document.createElement('div');
        dummy.className = 'widget-wrapper dragging';
        dummy.style.width = `${effectiveW * grid.cellSize + (effectiveW - 1) * grid.gap}px`;
        dummy.style.height = `${effectiveH * grid.cellSize + (effectiveH - 1) * grid.gap}px`;
        dummy.style.left = `${e.clientX - 46}px`;
        dummy.style.top = `${e.clientY - 46}px`;
        dummy.style.background = 'rgba(255,255,255,0.15)';
        dummy.style.backdropFilter = 'blur(10px)';
        dummy.style.pointerEvents = 'none';
        container.appendChild(dummy);

        if (ghost) ghost.classList.add('active');
        updateGhost({ x: 0, y: 0, w: effectiveW, h: effectiveH });
        e.stopPropagation();
    });

    itemEl.addEventListener('pointermove', (e) => {
        if (!dummy) return;
        if (rAFActive) return;
        rAFActive = true;

        requestAnimationFrame(() => {
            if (!dummy) return;
            rAFActive = false;
            const containerBounds = container.getBoundingClientRect();
            dummy.style.left = `${e.clientX - 46 - containerBounds.left}px`;
            dummy.style.top = `${e.clientY - 46 - containerBounds.top}px`;

            grid.updateMetrics();
            let effectiveW = Math.min(meta.defaultW, grid.columns);
            let effectiveH = Math.min(meta.defaultH, grid.rowsCount);

            if (checkCollisionWithDeleteZone(e.clientX, e.clientY)) {
                if (deleteZone) deleteZone.classList.add('hovered');
                dummy.style.background = 'rgba(239, 68, 68, 0.4)';
                if (ghost) ghost.classList.remove('active');
            } else {
                if (deleteZone) deleteZone.classList.remove('hovered');
                dummy.style.background = 'rgba(255,255,255,0.15)';
                if (ghost) ghost.classList.add('active');
            }

            let liveX = Math.round((e.clientX - 46 - containerBounds.left) / (grid.cellSize + grid.gap));
            let liveY = Math.round((e.clientY - 46 - containerBounds.top) / (grid.cellSize + grid.gap));
            liveX = Math.max(0, Math.min(liveX, grid.columns - effectiveW));
            liveY = Math.max(0, Math.min(liveY, grid.rowsCount - effectiveH));
            updateGhost({ x: liveX, y: liveY, w: effectiveW, h: effectiveH });
        });
    });

    itemEl.addEventListener('pointerup', (e) => {
        if (!dummy) return;
        itemEl.releasePointerCapture(e.pointerId);
        dummy.remove();
        dummy = null;
        if (ghost) ghost.classList.remove('active');

        if (deleteZone && deleteZone.classList.contains('hovered')) {
            deleteZone.classList.remove('hovered');
            return;
        }

        grid.updateMetrics();
        let effectiveW = Math.min(meta.defaultW, grid.columns);
        let effectiveH = Math.min(meta.defaultH, grid.rowsCount);

        let finalX = 0; let finalY = 0;
        if (ghost) {
            finalX = Math.round(parseInt(ghost.style.left) / (grid.cellSize + grid.gap));
            finalY = Math.round(parseInt(ghost.style.top) / (grid.cellSize + grid.gap));
        }

        if (!grid.canFit(effectiveW, effectiveH, state.widgets)) {
            alert("No available space left!"); return;
        }

        const newWidget = {
            id: `w-${Date.now()}`, type: type, x: finalX, y: finalY, w: effectiveW, h: effectiveH,
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
                <div style="width:56px; height:56px; border-radius:${shape}; background:${iconBg}; margin-bottom:8px; display:flex; align-items:center; justify-content:center; font-size:32px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">${iconHtml}</div>
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
                    if (!state.editMode) toggleEditMode(true);
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
                    dummy.style.left = `${e.clientX - 46 - containerBounds.left}px`;
                    dummy.style.top = `${e.clientY - 46 - containerBounds.top}px`;

                    if (checkCollisionWithDeleteZone(e.clientX, e.clientY)) {
                        if (deleteZone) deleteZone.classList.add('hovered');
                        dummy.style.background = 'rgba(239, 68, 68, 0.4)';
                        if (ghost) ghost.classList.remove('active');
                    } else {
                        if (deleteZone) deleteZone.classList.remove('hovered');
                        dummy.style.background = 'rgba(255,255,255,0.15)';
                        if (ghost) ghost.classList.add('active');
                    }

                    let liveX = Math.round((e.clientX - 46 - containerBounds.left) / (grid.cellSize + grid.gap));
                    let liveY = Math.round((e.clientY - 46 - containerBounds.top) / (grid.cellSize + grid.gap));
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
    if (folderOverlay) folderOverlay.style.display = 'flex';
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

function toggleEditMode(forceState = null) {
    state.editMode = forceState !== null ? forceState : !state.editMode;
    document.body.classList.toggle('edit-mode', state.editMode);
    if (!state.editMode) {
        closeModal();
        grid.resolveAllFinalOverlaps(state.widgets);
    }
    renderGrid();
}

window.addEventListener('DOMContentLoaded', init);