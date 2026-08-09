'use strict';
const WINDOW_MS = 10_000;
const MAX_MESSAGES = 8;
const windows = new Map();
export function recordMessage(jid) {
    const now = Date.now();
    const arr = (windows.get(jid) || []).filter((t) => now - t < WINDOW_MS);
    arr.push(now);
    windows.set(jid, arr);
    return arr.length;
}
export function isFlooding(jid) {
    const count = recordMessage(jid);
    return count > MAX_MESSAGES;
}
export function resetFlood(jid) {
    windows.delete(jid);
}
export function isMentionSpam(mentionedJid = [], threshold = 15) {
    return mentionedJid.length >= threshold;
}
const lastMessageByJid = new Map();
export function isRepeatedMessage(jid, text) {
    if (!text)
        return false;
    const last = lastMessageByJid.get(jid);
    lastMessageByJid.set(jid, text);
    return last === text;
}
export default { recordMessage, isFlooding, resetFlood, isMentionSpam, isRepeatedMessage };
