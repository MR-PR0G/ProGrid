export class BaseWidget {
    constructor(config) {
        this.config = config || {};
    }
    
    /**
     * رندر محتوای HTML داخلی ویجت
     */
    render() {
        return '';
    }
    
    /**
     * اجرای کدها، تایمرها و رویدادها پس از درج المان در DOM
     */
    postRender(el) {}

    /**
     * فراخوانی هنگام تغییر ابعاد ویجت توسط کاربر در گرید
     */
    onResize(w, h, el) {}

    /**
     * پاکسازی منابع، تایمرها و رویدادها هنگام تخریب یا ری‌رندر ویجت
     */
    onDestroy(el) {}

    /**
     * متد کمکی برای ذخیره و به‌روزرسانی کانفیگ ویجت در استوریج و استیت سراسری
     */
    updateConfig(partialConfig, shouldRender = true) {
        if (this.config && this.config.id && window.updateWidgetConfigDirectly) {
            window.updateWidgetConfigDirectly(this.config.id, partialConfig, shouldRender);
        }
    }
}