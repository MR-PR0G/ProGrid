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
     * اجرای کدها و رویدادها پس از درج المان در DOM
     */
    postRender(el) {}

    /**
     * پاکسازی منابع، تایمرها و رویدادها هنگام تخریب ویجت
     */
    onDestroy(el) {}
}