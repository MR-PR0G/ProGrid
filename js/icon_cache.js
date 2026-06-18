export class IconCacheManager {
    static async getBase64Icon(url) {
        const hostname = new URL(url).hostname;
        const localKey = `cached_ico_${hostname}`;
        const cached = localStorage.getItem(localKey);
        if (cached) return cached;

        const apiFallback = `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;
        try {
            const response = await fetch(apiFallback);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    try {
                        localStorage.setItem(localKey, base64data);
                    } catch (e) {}
                    resolve(base64data);
                };
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return apiFallback;
        }
    }
}