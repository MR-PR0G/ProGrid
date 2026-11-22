import { BaseWidget } from './base.js';

export const KNOWN_SERVICES = {
    gmail: {
        matches: ['mail.google.com', 'gmail.com', 'gmail'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" opacity=".12"/><path fill="#4285F4" d="M22 6.5V18c0 1.1-.9 2-2 2h-2V9.8l4-3.3z"/><path fill="#34A853" d="M6 20H4c-1.1 0-2-.9-2-2V6.5l4 3.3V20z"/><path fill="#EA4335" d="M18 9.8L12 14.8 6 9.8V6.5l6 4.9 6-4.9v3.3z"/><path fill="#FBBC05" d="M18 6.5l4-3.3c-.6-.7-1.5-1.2-2.5-1.2H4.5c-1 0-1.9.5-2.5 1.2l4 3.3 6 4.9 6-4.9z"/></svg>`
    },
    google: {
        matches: ['google.com', 'google'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`
    },
    youtube: {
        matches: ['youtube.com', 'youtu.be', 'youtube'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon fill="#FFFFFF" points="9.545 15.568 15.818 12 9.545 8.432"/></svg>`
    },
    github: {
        matches: ['github.com', 'github'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`
    },
    telegram: {
        matches: ['telegram.org', 't.me', 'telegram'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#2AABEE"/><path fill="#FFF" d="M17.5 7.5L5.5 12.2c-.8.3-.8.8-.2 1l3.1 1 7.2-4.5c.3-.2.6-.1.4.1l-5.8 5.2-.2 3.1c.3 0 .4-.1.6-.3l1.5-1.5 3.1 2.3c.6.3 1 .1 1.2-.6l2-9.4c.2-.9-.3-1.3-.9-1.1z"/></svg>`
    },
    twitter: {
        matches: ['twitter.com', 'x.com', 'twitter'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    },
    instagram: {
        matches: ['instagram.com', 'instagram', 'instagr.am'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><defs><radialGradient id="igG" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#fdf497"/><stop offset="10%" stop-color="#fdf497"/><stop offset="50%" stop-color="#fd5949"/><stop offset="68%" stop-color="#d6249f"/><stop offset="100%" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#igG)"/><path fill="#fff" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/><path fill="none" stroke="#fff" stroke-width="1.8" rx="5" d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8z"/></svg>`
    },
    chatgpt: {
        matches: ['chatgpt.com', 'chat.openai.com', 'openai.com', 'chatgpt'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M22.28 10.15a6.01 6.01 0 0 0-.52-4.98 6.09 6.09 0 0 0-5.85-3.04 6.03 6.03 0 0 0-4.38 1.93 6.02 6.02 0 0 0-8.23 2.97 6.07 6.07 0 0 0 .74 6.72 6.01 6.01 0 0 0 .52 4.98 6.09 6.09 0 0 0 5.85 3.04 6.03 6.03 0 0 0 4.38-1.93 6.02 6.02 0 0 0 8.23-2.97 6.07 6.07 0 0 0-.74-6.72zm-8.8 11.2a4.48 4.48 0 0 1-3.02-.9l.15-.09 5.01-2.9a.8.8 0 0 0 .4-.7v-7.07l2.25 1.3a.07.07 0 0 1 .04.06v5.82a4.5 4.5 0 0 1-4.83 4.48zM3.6 17.5a4.48 4.48 0 0 1-.54-3.1 4.5 4.5 0 0 1 2.37-2.9l.16.1 5 2.89a.8.8 0 0 0 .8 0l6.12-3.53v2.6a.07.07 0 0 1-.03.06l-5.04 2.91a4.5 4.5 0 0 1-8.88 1zm-1.12-9.6a4.48 4.48 0 0 1 2.48-2.2 4.5 4.5 0 0 1 3.73.3l-.15.1-5.01 2.89a.8.8 0 0 0-.4.7v7.07l-2.25-1.3a.07.07 0 0 1-.04-.06V9.58a4.52 4.52 0 0 1 1.64-1.68zm14.1-1.36l-6.13 3.54v-2.6a.07.07 0 0 1 .03-.06l5.04-2.91a4.5 4.5 0 0 1 8.88-1 4.48 4.48 0 0 1 .54 3.1 4.5 4.5 0 0 1-2.37 2.9l-.16-.1-5-2.89a.8.8 0 0 0-.83.02zm3.82 4.76v-7.07l2.25 1.3a.07.07 0 0 1 .04.06v5.82a4.5 4.5 0 0 1-4.12 4.48 4.48 4.48 0 0 1-3.02-.9l.15-.09 5.01-2.9a.8.8 0 0 0 .4-.7zm-8.6 3.44l-2.25-1.3a.07.07 0 0 1-.04-.06v-2.6l6.12-3.54a.8.8 0 0 0 .4-.7v-3.53l2.25 1.3a.07.07 0 0 1 .04.06v6.14l-6.52 4.23z"/></svg>`
    },
    whatsapp: {
        matches: ['whatsapp.com', 'web.whatsapp.com', 'whatsapp'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#FFF" d="M17.5 14.4c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.3.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3z"/></svg>`
    },
    spotify: {
        matches: ['spotify.com', 'spotify'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#1ED760"/><path fill="#000" d="M17.9 16.2c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.3-2.9c-.3.4-.8.5-1.2.3-2.9-1.8-7.3-2.3-10.7-1.3-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.9-1.2 8.8-.6 12.1 1.4.4.3.5.8.3 1.3zm.1-3.1c-3.5-2.1-9.2-2.3-12.6-1.2-.5.2-1.1-.1-1.3-.7-.2-.5.1-1.1.7-1.3 3.9-1.2 10.2-1 14.3 1.4.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.3z"/></svg>`
    },
    discord: {
        matches: ['discord.com', 'discord.gg', 'discord'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`
    },
    reddit: {
        matches: ['reddit.com', 'reddit'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path fill="#FFF" d="M19.4 12.5c0-.8-.6-1.4-1.4-1.4-.4 0-.8.2-1 .5-1.2-.8-2.8-1.3-4.5-1.4l.8-3.6 2.5.5c0 .6.5 1 1.1 1 .6 0 1.1-.5 1.1-1.1 0-.6-.5-1.1-1.1-1.1-.4 0-.8.3-1 .7l-2.8-.6c-.2 0-.3.1-.4.3l-.9 4.2c-1.8.1-3.4.6-4.6 1.4-.3-.3-.6-.5-1.1-.5-.8 0-1.4.6-1.4 1.4 0 .5.3.9.7 1.2-.1.3-.1.6-.1.9 0 2.6 3 4.7 6.8 4.7s6.8-2.1 6.8-4.7c0-.3 0-.6-.1-.9.5-.3.8-.7.8-1.2zm-10.3 0c0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1 0 .6-.5 1.1-1.1 1.1-.6 0-1.1-.5-1.1-1.1zm6 3c-.8.8-2.3.8-3.1.8s-2.3 0-3.1-.8c-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .6.6 1.9.6 2.7.6.8 0 2.1 0 2.7-.6.1-.1.3-.1.4 0 .1.1.1.3 0 .4zm-.2-1.9c-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1 0 .6-.5 1.1-1.1 1.1z"/></svg>`
    },
    linkedin: {
        matches: ['linkedin.com', 'linkedin'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#FFF" d="M5.5 8.5h3v11h-3zm1.5-5.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM11.5 8.5h2.9v1.5h.1c.4-.8 1.4-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.9v6.3h-3v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7h-3v-11z"/></svg>`
    },
    pinterest: {
        matches: ['pinterest.com', 'pinterest'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#E60023"/><path fill="#FFF" d="M12 4a8 8 0 0 0-2.9 15.5c0-.7.1-1.7.3-2.5l1.1-4.7s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.3 0 .8-.5 2-1 3.1-.2.9.4 1.7 1.3 1.7 1.6 0 2.8-1.7 2.8-4.1 0-2.1-1.5-3.6-3.7-3.6-2.5 0-4 1.9-4 3.9 0 .8.3 1.6.7 2.1.1.1.1.2.1.3l-.2 1c0 .2-.1.2-.3.1-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.5 2.6 6.5 6.1 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.4-1.2l-.7 2.6c-.3 1-1 2.2-1.5 3 .8.2 1.6.4 2.5.4 4.4 0 8-3.6 8-8s-3.6-8-8-8z"/></svg>`
    },
    wikipedia: {
        matches: ['wikipedia.org', 'wikipedia'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#FFFFFF"/><path fill="#000" d="M19.5 6h-2.1l-3.3 8.3-2.6-6.5h-1.6l-2.6 6.5L4 6H1.9L6.5 17h1.7l2.8-7 2.8 7h1.7l4-11z"/></svg>`
    },
    netflix: {
        matches: ['netflix.com', 'netflix'],
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="4" fill="#000000"/><path fill="#E50914" d="M5.5 3.5h3.2v17H5.5zm9.8 0h3.2v17h-3.2z"/><path fill="#B81D24" d="M5.5 3.5l9.8 17h3.2l-9.8-17z"/></svg>`
    }
};

export function detectServiceIcon(url, title = '') {
    const rawUrl = (url || '').toLowerCase().trim();
    const rawTitle = (title || '').toLowerCase().trim();

    for (const [key, svc] of Object.entries(KNOWN_SERVICES)) {
        for (const m of svc.matches) {
            if (rawUrl.includes(m) || rawTitle === m || (rawTitle.length > 2 && rawTitle.includes(m))) {
                return svc.svg;
            }
        }
    }
    return null;
}

export function extractDomain(url) {
    if (!url) return 'google.com';
    try {
        let clean = url.trim();
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = `https://${clean}`;
        }
        return new URL(clean).hostname;
    } catch {
        return url.replace(/^https?:\/\//, '').split('/')[0] || 'google.com';
    }
}

export default class ShortcutWidget extends BaseWidget {
    static getMetadata() {
        return {
            type: 'shortcut',
            label: 'Web Shortcut',
            author: 'ProGrid',
            version: '1.5.0',
            description: 'One-tap fluid bookmark with intelligent vector logo detection, multi-source favicon engine, and shape controls.',
            icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
            defaultW: 1, defaultH: 1,
            minW: 1, minH: 1, maxW: 2, maxH: 2,
            defaultConfig: { title: 'Google', url: 'https://google.com', icon: '', iconUrl: '', iconBg: 'transparent', shape: '20px', bg: '#ffffff' }
        };
    }

    render() {
        const title = this.config.title || 'Link';
        const url = this.config.url || '#';
        const shape = this.config.shape || '20px';
        const iconBg = this.config.iconBg || 'transparent';
        
        let customIconUrl = (this.config.iconUrl || '').trim();
        let userIcon = (this.config.icon !== undefined ? this.config.icon : '').trim();
        if (userIcon === '🔗' || userIcon === '🌐') userIcon = '';
        
        let iconContent = '';
        const firstLetter = title.charAt(0).toUpperCase() || '•';

        // 1. User specified direct custom image URL
        if (customIconUrl) {
            iconContent = `<img src="${customIconUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-weight:700;font-size:22px;color:var(--text-primary);\\'>${firstLetter}</span>'" draggable="false" />`;
        } 
        // 2. User specified explicit text/symbol/emoji
        else if (userIcon) {
            iconContent = `<span style="font-size: 20px; font-weight: 600; color: var(--text-primary);">${userIcon}</span>`;
        } 
        // 3. Smart Detection: Built-in verified SVG for popular services (Gmail, YouTube, etc.)
        else {
            const serviceSvg = detectServiceIcon(url, title);
            if (serviceSvg) {
                iconContent = serviceSvg;
            } else {
                // 4. Multi-tier CDN Favicon Fallback for other websites
                const domain = extractDomain(url);
                const primaryFav = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
                const secondaryFav = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
                const tertiaryFav = `https://api.faviconkit.com/${encodeURIComponent(domain)}/144`;

                iconContent = `
                    <img src="${primaryFav}" alt="${title}" 
                        style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" 
                        onerror="if (!this.dataset.step) { this.dataset.step='1'; this.src='${secondaryFav}'; } else if (this.dataset.step === '1') { this.dataset.step='2'; this.src='${tertiaryFav}'; } else { this.onerror=null; this.outerHTML='<span style=\\'font-weight:700;font-size:22px;color:var(--text-primary);\\'>${firstLetter}</span>'; }" 
                        draggable="false" />
                `;
            }
        }

        const isHorizontal = (this.config.w || 1) >= 2 && (this.config.h || 1) === 1;
        const iconSize = isHorizontal ? '38px' : '42px';

        if (isHorizontal) {
            return `
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="shortcut-link-wrapper" style="width: 100%; height: 100%; display: flex; flex-direction: row; align-items: center; justify-content: flex-start; padding: 0 14px; gap: 10px; text-decoration: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box;">
                    <div class="shortcut-icon-container" style="width: ${iconSize}; height: ${iconSize}; min-width: ${iconSize}; border-radius: ${shape}; background: ${iconBg}; display: flex; align-items: center; justify-content: center; user-select: none; box-shadow: 0 3px 8px rgba(0,0,0,0.18); overflow: hidden;">
                        ${iconContent}
                    </div>
                    <span class="shortcut-label-text" dir="auto" style="font-size: 13px; max-width: calc(100% - 50px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-weight: 600;">${title}</span>
                </a>
            `;
        }

        return `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="shortcut-link-wrapper" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto; padding: 4px; text-decoration: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box; text-align: center;">
                <div class="shortcut-icon-container" style="width: ${iconSize}; height: ${iconSize}; margin: 0 auto; border-radius: ${shape}; background: ${iconBg}; display: flex; align-items: center; justify-content: center; user-select: none; box-shadow: 0 3px 8px rgba(0,0,0,0.18); overflow: hidden;">
                    ${iconContent}
                </div>
                <span class="shortcut-label-text" dir="auto" style="font-size: 11px; margin-top: 5px; margin-left: auto; margin-right: auto; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-weight: 500; text-align: center; line-height: 1.2; display: block;">${title}</span>
            </a>
        `;
    }
}

if (window.WidgetGlobals) {
    window.WidgetGlobals.register(ShortcutWidget);
}
