import { BaseWidget } from '../base.js';

export default class QuoteWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'quote',
            label: 'Daily Wisdom',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>`,
            defaultW: 2, defaultH: 1,
            minW: 2, minH: 1, maxW: 3, maxH: 2,
            category: 'lifestyle',
            author: 'MR Prog',
            version: '1.5.0',
            downloads: '5.2k',
            description: 'Inspirational wisdom quotes with category filters (Science, History, Philosophy) and language toggle.',
            defaultConfig: { quoteIndex: 0, category: 'all', language: 'all', quoteTheme: 'default', bg: '#ffffff' }
        };
    }

    static get QUOTES() {
        return [
            // Science (علمی)
            { text: "Creativity is intelligence having fun.", author: "Albert Einstein", lang: "en", cat: "science" },
            { text: "نظم جهان بر پایه ریاضیات و قوانین تغییرناپذیر طبیعت استوار است.", author: "ابن سینا", lang: "fa", cat: "science" },
            { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan", lang: "en", cat: "science" },
            { text: "دانش نوری است که تاریکی جهل را می‌شکافد و راه حقیقت را می‌نمایاند.", author: "ابوریحان بیرونی", lang: "fa", cat: "science" },
            { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", lang: "en", cat: "science" },
            { text: "آنچه می‌دانیم قطره‌ای است و آنچه نمی‌دانیم اقیانوسی بی‌پایان.", author: "اسحاق نیوتن", lang: "fa", cat: "science" },
            { text: "Science is the poetry of reality.", author: "Richard Dawkins", lang: "en", cat: "science" },
            { text: "تلاش برای فهمیدن جهان، یکی از معدود کارهایی است که انسان را تعالی می‌بخشد.", author: "استیون هاوکینگ", lang: "fa", cat: "science" },

            // History (تاریخی)
            { text: "A people without the knowledge of their past history is like a tree without roots.", author: "Marcus Garvey", lang: "en", cat: "history" },
            { text: "گفتار نیک، پندار نیک و کردار نیک پایه پایداری هر سرزمینی است.", author: "کوروش بزرگ", lang: "fa", cat: "history" },
            { text: "History will be kind to me for I intend to write it.", author: "Winston Churchill", lang: "en", cat: "history" },
            { text: "توانا بود هر که دانا بود، ز دانش دل پیر برنا بود.", author: "فردوسی", lang: "fa", cat: "history" },
            { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", lang: "en", cat: "history" },
            { text: "سفر هزار فرسنگی با یک گام آغاز می‌شود.", author: "کنفوسیوس", lang: "fa", cat: "history" },
            { text: "Those who do not remember the past are condemned to repeat it.", author: "George Santayana", lang: "en", cat: "history" },

            // Philosophy & Motivation (فلسفی و انگیزشی)
            { text: "The unexamined life is not worth living.", author: "Socrates", lang: "en", cat: "philosophy" },
            { text: "زندگی آنچه برایت پیش می‌آید نیست، نحوه پاسخ تو به آن است.", author: "اپیکتتوس", lang: "fa", cat: "philosophy" },
            { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", lang: "en", cat: "philosophy" },
            { text: "هر چیزی که در جستن آنی، آنی؛ دل قوی دار که سحر نزدیک است.", author: "مولانا", lang: "fa", cat: "philosophy" },
            { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", lang: "en", cat: "philosophy" },
            { text: "در ناامیدی بسی امید است، پایان شب سیه سپید است.", author: "نظامی گنجوی", lang: "fa", cat: "philosophy" },
            { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", lang: "en", cat: "philosophy" },
            { text: "آسایش دو گیتی تفسیر این دو حرف است: با دوستان مروت، با دشمنان مدارا.", author: "حافظ", lang: "fa", cat: "philosophy" },
            { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", lang: "en", cat: "philosophy" }
        ];
    }

    getFilteredQuotes() {
        const cat = this.config.category || 'all';
        const lang = this.config.language || 'all';
        const all = QuoteWidget.QUOTES;

        return all.filter(q => {
            const matchesCat = cat === 'all' || q.cat === cat;
            const matchesLang = lang === 'all' || q.lang === lang;
            return matchesCat && matchesLang;
        });
    }

    render() {
        const id = this.config.id;
        const quotes = this.getFilteredQuotes();
        const safeQuotes = quotes.length > 0 ? quotes : QuoteWidget.QUOTES;
        const index = Math.abs(this.config.quoteIndex || 0) % safeQuotes.length;
        const current = safeQuotes[index] || safeQuotes[0];
        const isFa = current.lang === 'fa';

        const catLabels = {
            science: 'Science',
            history: 'History',
            philosophy: 'Philosophy',
            all: 'Daily Wisdom'
        };
        const catName = catLabels[current.cat] || 'Daily Wisdom';

        const themeAccents = {
            default: '#38bdf8',
            amber: '#f59e0b',
            emerald: '#10b981',
            violet: '#a855f7'
        };
        const accent = themeAccents[this.config.quoteTheme] || '#38bdf8';

        return `
            <div class="quote-widget-box" id="quote-${id}" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 14px; box-sizing: border-box; cursor: pointer; user-select: none; position: relative; overflow: hidden;">
                <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor" style="position: absolute; right: 8px; bottom: 4px; opacity: 0.04; pointer-events: none;"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>
                
                <div style="font-size: 9.5px; opacity: 0.85; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: ${accent}; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <span style="display: flex; align-items: center; gap: 5px;">
                        <span style="width: 5px; height: 5px; border-radius: 50%; background: ${accent};"></span>
                        <span class="quote-cat-tag">${catName}</span>
                    </span>
                    <span style="font-size: 9px; opacity: 0.6; padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,0.06); font-weight: 600;">${isFa ? 'FA' : 'EN'}</span>
                </div>

                <div class="quote-text" dir="${isFa ? 'rtl' : 'ltr'}" style="font-size: 11.5px; font-weight: 500; line-height: 1.38; color: var(--text-primary); ${isFa ? '' : 'font-style: italic;'} overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; margin: 3px 0; transition: opacity 0.15s ease;">“${current.text}”</div>

                <div class="quote-author" dir="${isFa ? 'rtl' : 'ltr'}" style="font-size: 10px; color: var(--text-secondary); font-weight: 600; text-align: ${isFa ? 'left' : 'right'}; transition: opacity 0.15s ease; flex-shrink: 0;">— ${current.author}</div>
            </div>
        `;
    }

    postRender(el) {
        const box = el.querySelector(`#quote-${this.config.id}`);
        if (!box) return;

        box.addEventListener('click', (e) => {
            e.stopPropagation();
            const quotes = this.getFilteredQuotes();
            const safeQuotes = quotes.length > 0 ? quotes : QuoteWidget.QUOTES;
            let nextIndex = ((this.config.quoteIndex || 0) + 1) % safeQuotes.length;
            this.config.quoteIndex = nextIndex;
            this.updateConfig({ quoteIndex: nextIndex });

            const textEl = box.querySelector('.quote-text');
            const authorEl = box.querySelector('.quote-author');
            const catEl = box.querySelector('.quote-cat-tag');
            const badgeEl = box.querySelector('.quote-widget-box span:last-child');
            const nextQuote = safeQuotes[nextIndex];
            const isFa = nextQuote.lang === 'fa';

            const catLabels = {
                science: 'Science',
                history: 'History',
                philosophy: 'Philosophy',
                all: 'Daily Wisdom'
            };

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
                    if (catEl) catEl.textContent = catLabels[nextQuote.cat] || 'Daily Wisdom';
                    if (badgeEl) badgeEl.textContent = isFa ? 'FA' : 'EN';
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
