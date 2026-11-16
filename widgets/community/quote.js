import { BaseWidget } from '../base.js';

export default class QuoteWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'quote',
            label: 'Daily Quote',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>`,
            defaultW: 2, defaultH: 1,
            minW: 2, minH: 1, maxW: 3, maxH: 2,
            category: 'lifestyle',
            author: 'ProGrid Studio',
            version: '1.0.0',
            downloads: '3.9k',
            description: 'Handpicked daily inspiration and wisdom to keep you energized.',
            defaultConfig: { quoteIndex: 0, isGlass: true, bg: '#ffffff' }
        };
    }

    static get QUOTES() {
        return [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
            { text: "Make each day your masterpiece.", author: "John Wooden" },
            { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
            { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
            { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
            { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" }
        ];
    }

    render() {
        const id = this.config.id;
        const quotes = QuoteWidget.QUOTES;
        const index = (this.config.quoteIndex || 0) % quotes.length;
        const current = quotes[index];

        return `
            <div class="quote-widget-box" id="quote-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 12px 16px; box-sizing: border-box; cursor: pointer; user-select: none;">
                <div style="font-size: 11px; opacity: 0.5; margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Quote of the day</div>
                <div class="quote-text" style="font-size: 12px; font-weight: 500; line-height: 1.4; color: var(--text-primary); font-style: italic; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">“${current.text}”</div>
                <div class="quote-author" style="font-size: 10.5px; color: var(--text-secondary); margin-top: 4px; font-weight: 600; text-align: right;">— ${current.author}</div>
            </div>
        `;
    }

    postRender(el) {
        const box = el.querySelector(`#quote-${this.config.id}`);
        if (!box) return;

        box.addEventListener('click', (e) => {
            e.stopPropagation();
            const quotes = QuoteWidget.QUOTES;
            let nextIndex = ((this.config.quoteIndex || 0) + 1) % quotes.length;
            this.config.quoteIndex = nextIndex;
            this.updateConfig({ quoteIndex: nextIndex });

            const textEl = box.querySelector('.quote-text');
            const authorEl = box.querySelector('.quote-author');
            if (textEl && authorEl) {
                textEl.style.opacity = '0';
                authorEl.style.opacity = '0';
                setTimeout(() => {
                    textEl.textContent = `“${quotes[nextIndex].text}”`;
                    authorEl.textContent = `— ${quotes[nextIndex].author}`;
                    textEl.style.opacity = '1';
                    authorEl.style.opacity = '1';
                }, 150);
            }
        });
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(QuoteWidget);
}
