import { BaseWidget } from '../base.js';

export default class CalculatorWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'calculator',
            label: 'Calculator',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>`,
            defaultW: 2, defaultH: 2,
            minW: 2, minH: 2, maxW: 2, maxH: 2,
            category: 'tools',
            author: 'MR Prog',
            version: '1.2.0',
            downloads: '5.3k',
            description: 'Compact glassmorphic calculator for rapid computations.',
            defaultConfig: { expression: '', result: '0', isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const id = this.config.id;
        const result = this.config.result || '0';
        return `
            <div class="calc-widget-container" id="calc-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; justify-content: space-between; user-select: none;">
                <div class="calc-screen" style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 8px 12px; text-align: right; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
                    <div class="calc-expr" style="font-size: 11px; color: var(--text-secondary); min-height: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.config.expression || ''}</div>
                    <div class="calc-val" style="font-size: 20px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${result}</div>
                </div>
                <div class="calc-keys" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 5px;">
                    <button class="calc-key op" data-val="C" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(239,68,68,0.25); color: #fca5a5; font-size: 11px; font-weight: 700; cursor: pointer;">C</button>
                    <button class="calc-key op" data-val="DEL" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.08); color: var(--text-primary); font-size: 11px; font-weight: 600; cursor: pointer;">⌫</button>
                    <button class="calc-key op" data-val="%" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(59,130,246,0.25); color: #93c5fd; font-size: 12px; font-weight: 700; cursor: pointer;">%</button>
                    <button class="calc-key op" data-val="/" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(59,130,246,0.25); color: #93c5fd; font-size: 13px; font-weight: 700; cursor: pointer;">÷</button>
                    
                    <button class="calc-key num" data-val="7" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">7</button>
                    <button class="calc-key num" data-val="8" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">8</button>
                    <button class="calc-key num" data-val="9" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">9</button>
                    <button class="calc-key op" data-val="*" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(59,130,246,0.25); color: #93c5fd; font-size: 13px; font-weight: 700; cursor: pointer;">×</button>

                    <button class="calc-key num" data-val="4" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">4</button>
                    <button class="calc-key num" data-val="5" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">5</button>
                    <button class="calc-key num" data-val="6" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">6</button>
                    <button class="calc-key op" data-val="-" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(59,130,246,0.25); color: #93c5fd; font-size: 14px; font-weight: 700; cursor: pointer;">−</button>

                    <button class="calc-key num" data-val="1" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">1</button>
                    <button class="calc-key num" data-val="2" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">2</button>
                    <button class="calc-key num" data-val="3" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">3</button>
                    <button class="calc-key op" data-val="+" style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(59,130,246,0.25); color: #93c5fd; font-size: 14px; font-weight: 700; cursor: pointer;">+</button>

                    <button class="calc-key num" data-val="0" style="grid-column: span 2; padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;">0</button>
                    <button class="calc-key num" data-val="." style="padding: 5px 0; border: none; border-radius: 7px; background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer;">.</button>
                    <button class="calc-key op" data-val="=" style="padding: 5px 0; border: none; border-radius: 7px; background: #3b82f6; color: white; font-size: 13px; font-weight: 700; cursor: pointer;">=</button>
                </div>
            </div>
        `;
    }

    postRender(el) {
        const root = el.querySelector(`#calc-${this.config.id}`);
        if (!root) return;

        const exprEl = root.querySelector('.calc-expr');
        const valEl = root.querySelector('.calc-val');
        let currentExpr = this.config.expression || '';
        let currentVal = this.config.result || '0';

        const updateDisplay = () => {
            if (exprEl) exprEl.textContent = currentExpr;
            if (valEl) valEl.textContent = currentVal;
            this.config.expression = currentExpr;
            this.config.result = currentVal;
            this.updateConfig({ expression: currentExpr, result: currentVal });
        };

        const calculateSafe = (expr) => {
            try {
                // Only allow numbers and basic math operators
                const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
                if (!sanitized) return '0';
                // Safe evaluation without eval()
                const fn = new Function(`'use strict'; return (${sanitized})`);
                const res = fn();
                if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
                    return String(Math.round(res * 10000) / 10000);
                }
                return 'Error';
            } catch {
                return 'Error';
            }
        };

        root.querySelectorAll('.calc-key').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = btn.getAttribute('data-val');
                if (navigator.vibrate) navigator.vibrate(15);

                if (val === 'C') {
                    currentExpr = '';
                    currentVal = '0';
                } else if (val === 'DEL') {
                    currentExpr = currentExpr.slice(0, -1);
                    currentVal = currentExpr ? currentExpr : '0';
                } else if (val === '=') {
                    if (currentExpr) {
                        const res = calculateSafe(currentExpr);
                        currentExpr = `${currentExpr} =`;
                        currentVal = res;
                    }
                } else if (val === '%') {
                    if (currentExpr && !currentExpr.includes('=')) {
                        const res = calculateSafe(`(${currentExpr})/100`);
                        currentExpr = `${currentExpr}%`;
                        currentVal = res;
                    }
                } else {
                    if (currentExpr.includes('=')) {
                        currentExpr = '';
                    }
                    currentExpr += val;
                    currentVal = currentExpr;
                }
                updateDisplay();
            });
        });
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(CalculatorWidget);
}
