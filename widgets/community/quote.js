import { BaseWidget } from '../base.js';

export default class QuoteWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'quote',
            label: 'Daily Inspiration',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>`,
            defaultW: 2, defaultH: 1,
            minW: 2, minH: 1, maxW: 3, maxH: 2,
            category: 'lifestyle',
            author: 'MR Prog',
            version: '1.2.0',
            downloads: '4.6k',
            description: 'Curated inspiring bilingual Persian and English wisdom quotes with one-tap refresh.',
            defaultConfig: { quoteIndex: 0, bg: '#ffffff' }
        };
    }

    static get QUOTES() {
        return [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain", lang: "en" },
            { text: "سفر هزار فرسنگی با یک گام آغاز می‌شود.", author: "کنفوسیوس", lang: "fa" },
            { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", lang: "en" },
            { text: "زندگی آنچه برایت پیش می‌آید نیست، نحوه پاسخ تو به آن است.", author: "اپیکتتوس", lang: "fa" },
            { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", lang: "en" },
            { text: "آینده به کسانی تعلق دارد که به زیبایی رویاهایشان باور دارند.", author: "النور روزولت", lang: "fa" },
            { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", lang: "en" },
            { text: "پیروزی متعلق به کسانی است که هرگز تسلیم نمی‌شوند.", author: "وینستون چرچیل", lang: "fa" },
            { text: "Creativity is intelligence having fun.", author: "Albert Einstein", lang: "en" },
            { text: "بزرگ‌ترین افتخار ما هرگز زمین نخوردن نیست، بلکه برخاستن پس از هر سقوط است.", author: "نلسون ماندلا", lang: "fa" },
            { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", lang: "en" }
        ];
    }

    render() {
        const id = this.config.id;
        const quotes = QuoteWidget.QUOTES;
        const index = (this.config.quoteIndex || 0) % quotes.length;
        const current = quotes[index];
        const isFa = current.lang === 'fa';

        return `
            <div class="quote-widget-box" id="quote-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 10px 14px; box-sizing: border-box; cursor: pointer; user-select: none; position: relative; overflow: hidden;">
                <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor" style="position: absolute; right: 8px; bottom: 4px; opacity: 0.04; pointer-events: none;"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>
                <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #38bdf8; display: flex; align-items: center; justify-content: space-between;">
                    <span style="display: flex; align-items: center; gap: 5px;">
                        <span style="width: 5px; height: 5px; border-radius: 50%; background: #38bdf8;"></span>
                        <span>Daily Wisdom</span>
                    </span>
                    <span style="font-size: 9px; opacity: 0.6; padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,0.08);">${isFa ? 'فارسی' : 'EN'}</span>
                </div>
                <div class="quote-text" dir="${isFa ? 'rtl' : 'ltr'}" style="font-size: 12px; font-weight: 500; line-height: 1.45; color: var(--text-primary); ${isFa ? '' : 'font-style: italic;'} overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; transition: opacity 0.15s;">“${current.text}”</div>
                <div class="quote-author" dir="${isFa ? 'rtl' : 'ltr'}" style="font-size: 10px; color: var(--text-secondary); margin-top: 4px; font-weight: 600; text-align: ${isFa ? 'left' : 'right'}; transition: opacity 0.15s;">— ${current.author}</div>
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
            const langEl = box.querySelector('.quote-widget-box span:last-child');
            const nextQuote = quotes[nextIndex];
            const isFa = nextQuote.lang === 'fa';

            if (textEl && authorEl) {
                textEl.style.opacity = '0';
                authorEl.style.opacity = '0';
                setTimeout(() => {
                    textEl.textContent = `“${nextQuote.text}”`;
                    textEl.setAttribute('dir', isFa ? 'rtl' : 'ltr');
                    textEl.style.fontStyle = isFa ? 'normal' : 'italic';
                    authorEl.textContent = `— ${nextQuote.author}`;
                    authorEl.setAttribute('dir', isFa ? 'rtl' : 'ltr');
                    authorEl.style.textAlign = isFa ? 'left' : 'right';
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
