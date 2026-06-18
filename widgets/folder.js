import { BaseWidget } from './base.js';

export default class FolderWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'folder', label: 'Folder', icon: '📁', defaultW: 1, defaultH: 1,
            minW: 1, minH: 1, maxW: 4, maxH: 4,
            defaultConfig: { title: 'Folder', children: [], isGlass: true, bg: '#ffffff' }
        };
    }

    render() {
        const children = this.config.children || [];
        const layoutClass = `grid-${this.config.w}x${this.config.h}`;
        
        let contentHtml = '';

        // وضعیت ۱ در ۱: پاپ آپ شیشه‌ای یکپارچه کامپکت
        if (this.config.w === 1 && this.config.h === 1) {
            const previewItems = children.slice(0, 4);
            previewItems.forEach(ch => {
                contentHtml += `<div class="folder-mini-icon">🌐</div>`;
            });
            return `
                <div class="folder-embed-container ${layoutClass}" onclick="window.openFolderPopup(${JSON.stringify(this.config).replace(/"/g, '&quot;')})">
                    ${contentHtml}
                </div>
            `;
        }

        // وضعیت ۲ در ۲ یا بزرگتر: ماتریس تعاملی هوشمند
        // سلول‌های اول لینک مستقیم هستند و آخرین سلول دکمه باز کردن اکشن فولدر است
        const maxDirectSlots = (this.config.w * this.config.h === 4) ? 3 : (this.config.w * this.config.h) - 1;
        
        for (let i = 0; i < this.config.w * this.config.h; i++) {
            if (i === (this.config.w * this.config.h) - 1 || i >= children.length) {
                // دکمه باز کردن کل فولدر در آخرین اسلات گرید بندی
                const remainingCount = Math.max(0, children.length - maxDirectSlots);
                contentHtml += `
                    <div class="folder-mini-icon folder-action-trigger" onclick="window.openFolderPopup(${JSON.stringify(this.config).replace(/"/g, '&quot;')})">
                        +${remainingCount || '•'}
                    </div>
                `;
                break;
            } else {
                const ch = children[i];
                contentHtml += `
                    <a href="${ch.url}" target="_blank" class="folder-mini-icon" style="text-decoration:none; color:white;" title="${ch.title}">
                        🌐
                    </a>
                `;
            }
        }

        return `
            <div class="folder-embed-container ${layoutClass}">
                ${contentHtml}
            </div>
        `;
    }
}

window.WidgetGlobals.register(FolderWidget);