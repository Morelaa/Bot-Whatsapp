'use strict';
import config from '../config.js';
import { isLidJid, resolveLidToPhone, normNum } from '../Library/resolve.js';
import { setLidMapping } from '../Database/db.js';
function getContentType(message) {
    if (!message)
        return null;
    return Object.keys(message).find((k) => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage') || null;
}
function extractText(message, type) {
    if (!message || !type)
        return '';
    const node = message[type];
    if (typeof node === 'string')
        return node;
    if (type === 'interactiveResponseMessage') {
        const nativeFlow = node?.nativeFlowResponseMessage;
        if (nativeFlow?.paramsJson) {
            try {
                const parsed = JSON.parse(nativeFlow.paramsJson);
                return parsed.id || parsed.display_text || node?.body?.text || '';
            } catch {
                return node?.body?.text || '';
            }
        }
        return node?.body?.text || '';
    }
    return node?.text || node?.caption || node?.selectedButtonId || node?.selectedRowId || node?.selectedId || '';
}
function extractQuoted(message, type) {
    const ctx = message?.[type]?.contextInfo;
    if (!ctx?.quotedMessage)
        return null;
    const quotedType = getContentType(ctx.quotedMessage);
    return {
        key: {
            remoteJid: ctx.remoteJid,
            id: ctx.stanzaId,
            participant: ctx.participant,
            fromMe: false,
        },
        sender: ctx.participant,
        message: ctx.quotedMessage,
        type: quotedType,
        text: extractText(ctx.quotedMessage, quotedType),
    };
}
function pickSenderAlt(raw, isGroup) {
    // Baileys (v6.8+/v7) attaches an "alt" JID alongside the primary one whenever
    // WhatsApp addresses a chat/participant via LID: participantAlt/participantPn
    // for groups, remoteJidAlt/remoteJidPn for DMs. Whichever side is the LID, the
    // Alt/Pn side is the real phone-number JID. We grab it directly from the raw
    // message instead of relying only on a locally-cached LID->phone table, so a
    // fresh/empty/corrupted cache doesn't block owner checks.
    const key = raw?.key || {};
    const alt = isGroup
        ? (key.participantAlt || key.participantPn || raw?.participantAlt || raw?.participantPn)
        : (key.remoteJidAlt || key.remoteJidPn || raw?.remoteJidAlt || raw?.remoteJidPn);
    return alt || null;
}
function resolveSenderPn(sender, senderAlt) {
    if (!isLidJid(sender)) {
        const num = normNum(sender);
        return num ? num + '@s.whatsapp.net' : sender;
    }
    if (senderAlt && !isLidJid(senderAlt)) {
        const phoneNum = normNum(senderAlt);
        const lidNum = normNum(sender);
        if (phoneNum) {
            if (lidNum) {
                try { setLidMapping(lidNum, phoneNum); } catch { }
            }
            return phoneNum + '@s.whatsapp.net';
        }
    }
    const dbPhone = resolveLidToPhone(sender);
    if (dbPhone) return dbPhone + '@s.whatsapp.net';
    return sender;
}
export function serializeMessage(raw, sock) {
    if (!raw?.message)
        return null;
    const type = getContentType(raw.message);
    const chat = raw.key.remoteJid;
    const isGroup = chat?.endsWith('@g.us');
    const fromMe = !!raw.key.fromMe;
    const botJid = sock?.user?.id ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : chat;
    const sender = isGroup
        ? (raw.key.participant || raw.participant)
        : (fromMe ? botJid : chat);
    const senderAlt = pickSenderAlt(raw, isGroup);
    const senderPn = resolveSenderPn(sender, senderAlt);
    const text = extractText(raw.message, type);
    const contextInfo = raw.message?.[type]?.contextInfo || {};
    const mentionedJid = contextInfo.mentionedJid || [];
    const quoted = extractQuoted(raw.message, type);
    const body = text.trim();
    const prefixUsed = config.prefix.find((p) => body.startsWith(p));
    const isCommand = !!prefixUsed || (config.allowNoPrefix && body.length > 0);
    const withoutPrefix = prefixUsed ? body.slice(prefixUsed.length) : body;
    const [commandRaw, ...args] = withoutPrefix.trim().split(/\s+/);
    const command = (commandRaw || '').toLowerCase();
    return {
        raw,
        key: raw.key,
        id: raw.key.id,
        chat,
        isGroup,
        sender,
        senderAlt,
        senderPn,
        fromMe,
        pushName: raw.pushName || '',
        message: raw.message,
        type,
        text,
        body,
        isCommand,
        prefixUsed: prefixUsed || '',
        command,
        args,
        argsText: args.join(' '),
        mentionedJid,
        quoted,
        timestamp: Number(raw.messageTimestamp) || Math.floor(Date.now() / 1000),
        reply: (content, options = {}) => {
            const payload = typeof content === 'string' ? { text: content } : content;
            return sock.sendMessage(chat, payload, { quoted: raw, ...options });
        },
    };
}
export default { serializeMessage };
