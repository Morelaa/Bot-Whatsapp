'use strict';
import fs from 'fs';
const BOLD_SANS_UPPER_BASE = 0x1d5d4;
const BOLD_SANS_LOWER_BASE = 0x1d5ee;
const BOLD_SANS_DIGIT_BASE = 0x1d7ec;
export function toBoldSans(text) {
    return String(text).replace(/[A-Za-z0-9]/g, (ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(BOLD_SANS_UPPER_BASE + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(BOLD_SANS_LOWER_BASE + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(BOLD_SANS_DIGIT_BASE + (code - 48));
        return ch;
    });
}
const _imageBufferCache = new Map();
const IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
export async function loadConfigImage(source) {
    if (!source)
        return Buffer.alloc(0);
    if (/^https?:\/\//i.test(source)) {
        const cached = _imageBufferCache.get(source);
        if (cached && Date.now() < cached.expireAt)
            return cached.buffer;
        try {
            const res = await fetch(source);
            const buffer = Buffer.from(await res.arrayBuffer());
            _imageBufferCache.set(source, { buffer, expireAt: Date.now() + IMAGE_CACHE_TTL_MS });
            return buffer;
        }
        catch {
            return Buffer.alloc(0);
        }
    }
    try {
        if (fs.existsSync(source))
            return fs.readFileSync(source);
    }
    catch {
    }
    return Buffer.alloc(0);
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function pickRandom(arr) {
    return arr[randomInt(0, arr.length - 1)];
}
export function formatBytes(bytes, decimals = 2) {
    if (!bytes)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
export function formatDuration(seconds) {
    seconds = Math.floor(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h)
        parts.push(`${h}j`);
    if (m)
        parts.push(`${m}m`);
    parts.push(`${s}d`);
    return parts.join(' ');
}
export function formatUptime(ms) {
    return formatDuration(ms / 1000);
}
export function truncate(str, max = 100) {
    if (!str || str.length <= max)
        return str;
    return str.slice(0, max - 1) + '…';
}
export function capitalize(str) {
    if (!str)
        return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function parseDuration(str) {
    const match = /^(\d+)([smhd])$/i.exec(str?.trim());
    if (!match)
        return null;
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
    return value * mult;
}
export function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
    return out;
}
const BOLD_SERIF_MAP = {
    A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
    K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
    U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
    a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
    k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
    u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
    0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗',
};
export function bi(text) {
    return String(text ?? '')
        .split('')
        .map((c) => BOLD_SERIF_MAP[c] ?? c)
        .join('');
}
let fkontakCache = null;
let fkontakExpireAt = 0;
const FKONTAK_TTL_MS = 30_000;
export async function buildFkontak(sock, config) {
    const now = Date.now();
    if (fkontakCache && now < fkontakExpireAt)
        return fkontakCache;
    const botName = config?.botName;
    const metaAiNumber = '13135550002';
    const metaAiJid = `${metaAiNumber}@s.whatsapp.net`;
    let photo;
    try {
        const url = await sock.profilePictureUrl(metaAiJid, 'image');
        const res = await fetch(url);
        photo = Buffer.from(await res.arrayBuffer());
    }
    catch {
        photo = Buffer.alloc(0);
    }
    const contact = {
        key: {
            participant: '0@s.whatsapp.net',
            fromMe: false,
            id: 'StatusBiz',
            remoteJid: 'status@broadcast',
        },
        message: {
            contactMessage: {
                displayName: bi(botName),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${bi(botName + ' Multidevice')}\nFN:${bi(botName + ' Multidevice')}\nORG:${botName};\nTEL;type=CELL;type=VOICE;waid=${metaAiNumber}:+${metaAiNumber}\nEND:VCARD`,
                jpegThumbnail: photo
            },
        },
    };
    fkontakCache = contact;
    fkontakExpireAt = now + FKONTAK_TTL_MS;
    return contact;
}
export function buildForwardContext(config) {
    const baseContext = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedAiBotMessageInfo: {
            botName: 'Meta AI',
            botJid: '13135550002@bot'
        }
    };
    if (!config.channelJid) {
        return baseContext;
    }
    return {
        ...baseContext,
        forwardedNewsletterMessageInfo: {
            newsletterJid: config.channelJid,
            newsletterName: config.channelName,
            serverMessageId: Math.floor(Math.random() * 9_999_999),
        },
    };
}
export default {
    loadConfigImage,
    sleep,
    randomInt,
    pickRandom,
    formatBytes,
    formatDuration,
    formatUptime,
    truncate,
    capitalize,
    escapeRegex,
    parseDuration,
    chunkArray,
    bi,
    buildFkontak,
    buildForwardContext,
};
