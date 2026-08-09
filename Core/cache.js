'use strict';
class TTLCache {
    constructor({ defaultTTL = 5 * 60 * 1000, sweepInterval = 60 * 1000 } = {}) {
        this.store = new Map();
        this.defaultTTL = defaultTTL;
        this._sweeper = setInterval(() => this.sweep(), sweepInterval).unref();
    }
    set(key, value, ttl = this.defaultTTL) {
        this.store.set(key, { value, expiresAt: Date.now() + ttl });
        return value;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.store.delete(key);
    }
    sweep() {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt)
                this.store.delete(key);
        }
    }
    clear() {
        this.store.clear();
    }
}
export const messageCache = new TTLCache({ defaultTTL: 60 * 1000 });
export const rateLimitCache = new TTLCache({ defaultTTL: 10 * 1000 });
export const apiCache = new TTLCache({ defaultTTL: 10 * 60 * 1000 });
export function isDuplicateMessage(msgId) {
    if (!msgId)
        return false;
    if (messageCache.has(msgId))
        return true;
    messageCache.set(msgId, true);
    return false;
}
export function isRateLimited(userJid, command, cooldownMs = 3000) {
    const key = `${userJid}:${command}`;
    if (rateLimitCache.has(key))
        return true;
    rateLimitCache.set(key, true, cooldownMs);
    return false;
}
export { TTLCache };
export default { messageCache, rateLimitCache, apiCache, isDuplicateMessage, isRateLimited, TTLCache };
