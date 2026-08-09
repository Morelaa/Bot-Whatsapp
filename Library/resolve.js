import { getPhoneByLid, getLidByPhone, getPushName, setLidMapping, } from '../Database/db.js';
import { isMainOwner as _isMainOwnerNum } from '../System/mainowner.js';
export function normNum(raw) {
    if (!raw)
        return '';
    return String(raw).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}
export function isLidJid(raw) {
    return !!raw && String(raw).endsWith('@lid');
}
export function resolveLidToPhone(rawLid) {
    if (!rawLid)
        return null;
    const lidNum = normNum(rawLid);
    if (!lidNum)
        return null;
    const phone = getPhoneByLid(lidNum);
    return phone ? normNum(phone) : null;
}
export function resolvePhoneToLid(phone) {
    if (!phone)
        return null;
    return getLidByPhone(normNum(phone));
}
export function toPhoneJid(raw) {
    if (!raw)
        return null;
    if (isLidJid(raw)) {
        const phone = resolveLidToPhone(raw);
        return phone ? phone + '@s.whatsapp.net' : raw;
    }
    const num = normNum(raw);
    return num && num.length >= 5 ? num + '@s.whatsapp.net' : null;
}
export function getMentionJid(raw) {
    if (!raw)
        return '';
    if (isLidJid(raw)) {
        const phone = resolveLidToPhone(raw);
        if (phone)
            return phone + '@s.whatsapp.net';
        return raw;
    }
    const num = normNum(raw);
    return num ? num + '@s.whatsapp.net' : raw;
}
export function findParticipant(participants, rawTarget) {
    if (!participants?.length || !rawTarget)
        return null;
    let found = participants.find(p => p.id === rawTarget);
    if (found)
        return found;
    if (isLidJid(rawTarget)) {
        const lidNum = rawTarget.split('@')[0];
        found = participants.find(p => {
            if (p.lid && normNum(p.lid) === lidNum)
                return true;
            if (p.id?.endsWith('@lid') && normNum(p.id) === lidNum)
                return true;
            return false;
        });
        if (found)
            return found;
        const phone = resolveLidToPhone(lidNum);
        if (phone) {
            found = participants.find(p => {
                const pNum = normNum(p.id);
                return pNum === phone && pNum.length > 4;
            });
            if (found)
                return found;
        }
    }
    else {
        const targetNum = normNum(rawTarget);
        found = participants.find(p => {
            const pNum = normNum(p.id);
            if (pNum === targetNum && pNum.length > 4)
                return true;
            if (p.phoneNumber) {
                const phoneNum = normNum(p.phoneNumber);
                if (phoneNum === targetNum && phoneNum.length > 4)
                    return true;
            }
            if (p.jid) {
                const jidNum = normNum(p.jid);
                if (jidNum === targetNum && jidNum.length > 4)
                    return true;
            }
            if (p.pn) {
                const pnNum = normNum(p.pn);
                if (pnNum === targetNum && pnNum.length > 4)
                    return true;
            }
            if (p.id?.endsWith('@lid')) {
                const resolved = resolveLidToPhone(p.id);
                if (resolved === targetNum)
                    return true;
            }
            return false;
        });
        if (found) {
            if (found.id?.endsWith('@lid')) {
                try {
                    setLidMapping(normNum(found.id), targetNum);
                }
                catch { }
            }
            return found;
        }
        if (targetNum.length >= 8) {
            const suffix = targetNum.slice(-8);
            const candidates = participants.filter(p => {
                const pNum = normNum(p.id);
                const phoneNum = p.phoneNumber ? normNum(p.phoneNumber) : '';
                const jidNum = p.jid ? normNum(p.jid) : '';
                const pnNum = p.pn ? normNum(p.pn) : '';
                return ((pNum.length > 4 && pNum.endsWith(suffix)) ||
                    (phoneNum.length > 4 && phoneNum.endsWith(suffix)) ||
                    (jidNum.length > 4 && jidNum.endsWith(suffix)) ||
                    (pnNum.length > 4 && pnNum.endsWith(suffix)));
            });
            if (candidates.length === 1)
                return candidates[0];
        }
    }
    return null;
}
export function findBotParticipant(participants, botNumberOrJid) {
    if (!participants?.length || !botNumberOrJid)
        return null;
    const botNumber = normNum(botNumberOrJid);
    if (!botNumber)
        return null;
    return participants.find(p => {
        const pNum = normNum(p.id);
        if (pNum === botNumber && pNum.length > 4)
            return true;
        if (p.phoneNumber) {
            const phoneNum = normNum(p.phoneNumber);
            if (phoneNum === botNumber && phoneNum.length > 4)
                return true;
        }
        if (p.jid) {
            const jidNum = normNum(p.jid);
            if (jidNum === botNumber && jidNum.length > 4)
                return true;
        }
        if (p.id?.endsWith('@lid')) {
            const resolved = resolveLidToPhone(p.id);
            if (resolved === botNumber)
                return true;
        }
        return false;
    }) ?? null;
}
export function isParticipantAdmin(p) {
    return !!p && (p.admin === 'admin' || p.admin === 'superadmin');
}
export function autoMapParticipantLids(participants) {
    if (!participants?.length)
        return;
    for (const p of participants) {
        try {
            if (!p?.id?.endsWith('@lid'))
                continue;
            const lidNum = normNum(p.id);
            if (!lidNum)
                continue;
            if (getPhoneByLid(lidNum))
                continue;
            const phoneRaw = p.phoneNumber || p.jid || p.pn || null;
            const phoneNum = phoneRaw ? normNum(phoneRaw) : null;
            if (phoneNum && phoneNum.length > 4) {
                setLidMapping(lidNum, phoneNum);
            }
        }
        catch { }
    }
}
export function mapSenderLid(senderRaw, participants) {
    if (!isLidJid(senderRaw))
        return null;
    const lidNum = normNum(senderRaw);
    if (!lidNum)
        return null;
    const existing = getPhoneByLid(lidNum);
    if (existing)
        return normNum(existing);
    const p = findParticipant(participants, senderRaw);
    const phoneRaw = p?.phoneNumber || (p?.id && !p.id.endsWith('@lid') ? p.id : null) || p?.jid || null;
    const phoneNum = phoneRaw ? normNum(phoneRaw) : null;
    if (phoneNum && phoneNum.length > 4) {
        setLidMapping(lidNum, phoneNum);
        return phoneNum;
    }
    return null;
}
const _liveFetchTs = new Map();
const LIVE_FETCH_COOLDOWN_MS = 15000;
export async function resolveSenderLidLive(sock, groupJid, senderRaw) {
    if (!isLidJid(senderRaw))
        return null;
    const now = Date.now();
    const last = _liveFetchTs.get(groupJid) || 0;
    if (now - last < LIVE_FETCH_COOLDOWN_MS)
        return null;
    _liveFetchTs.set(groupJid, now);
    try {
        const meta = await sock.groupMetadata(groupJid);
        autoMapParticipantLids(meta?.participants);
        globalThis.__botStore__?.setGroupMetadata?.(groupJid, meta);
        return mapSenderLid(senderRaw, meta?.participants);
    }
    catch {
        return null;
    }
}
export function getSenderCandidates(m, participants) {
    const out = new Set();
    const rawRemoteJid = m?.key?.remoteJid || '';
    const isPrivate = !rawRemoteJid.endsWith('@g.us');
    const rawSender = m?.sender || m?.key?.participant || rawRemoteJid || '';
    const add = (v) => {
        const n = normNum(v);
        if (n && n.length >= 5)
            out.add(n);
    };
    add(rawSender);
    add(m?.sender);
    add(m?.key?.participant);
    if (isPrivate)
        add(rawRemoteJid);
    // senderAlt comes straight from Baileys' own key.participantAlt/participantPn
    // (or remoteJidAlt/remoteJidPn for DMs) — the phone-number JID WhatsApp sends
    // alongside a LID, independent of our local cache. Use it directly, and if it
    // pairs with a LID we haven't cached yet, cache it immediately so future
    // messages (including DMs with no group participants to cross-check) resolve
    // right away instead of depending on group-metadata luck.
    if (m?.senderAlt) {
        add(m.senderAlt);
        if (isLidJid(rawSender) && !isLidJid(m.senderAlt)) {
            const lidNum = normNum(rawSender);
            const phoneNum = normNum(m.senderAlt);
            if (lidNum && phoneNum && !getPhoneByLid(lidNum)) {
                try {
                    setLidMapping(lidNum, phoneNum);
                }
                catch { }
            }
        }
    }
    if (isLidJid(rawSender)) {
        const resolved = resolveLidToPhone(rawSender) || mapSenderLid(rawSender, participants);
        if (resolved)
            add(resolved);
    }
    return [...out];
}
export async function resolveBotAdmin(sock, groupJid, participants) {
    try {
        const botJid = sock?.user?.id ?? '';
        let list = participants ?? [];
        let botEntry = findBotParticipant(list, botJid);
        if (!botEntry) {
            try {
                const liveMeta = await sock.groupMetadata(groupJid);
                list = liveMeta?.participants ?? [];
                botEntry = findBotParticipant(list, botJid);
            }
            catch { }
        }
        return isParticipantAdmin(botEntry);
    }
    catch {
        return false;
    }
}
export async function isSenderAdminInGroup(sock, groupJid, senderRaw, participants) {
    try {
        let list = participants ?? [];
        let p = findParticipant(list, senderRaw);
        if (!p) {
            try {
                const meta = await sock.groupMetadata(groupJid);
                list = meta?.participants ?? [];
                p = findParticipant(list, senderRaw);
            }
            catch { }
        }
        return isParticipantAdmin(p);
    }
    catch {
        return false;
    }
}
export function resolveTarget(m, args = [], opts = {}) {
    const { senderJid, argIndex = 0, fallbackSelf = false, minDigits = 8 } = opts;
    if (m?.quoted) {
        const raw = m.quoted.sender || m.quoted.key?.participant || m.quoted.key?.remoteJid;
        if (raw) {
            const quotedPushName = m.quoted.pushName || m.quoted.name || null;
            const jid = toPhoneJid(raw) || raw;
            return { jid, raw, quotedPushName, source: 'quoted' };
        }
    }
    if (m?.mentionedJid?.[0]) {
        const raw = m.mentionedJid[0];
        const jid = toPhoneJid(raw) || raw;
        return { jid, raw, quotedPushName: null, source: 'mention' };
    }
    if (args[argIndex]) {
        let combined = '';
        for (let i = argIndex; i < args.length; i++) {
            const token = args[i];
            if (/^[+()\-\d]+$/.test(token)) {
                combined += token;
            }
            else {
                break;
            }
        }
        let num = normNum(combined || args[argIndex]);
        if (num.startsWith('0') && num.length > 1) {
            num = '62' + num.slice(1);
        }
        if (num.length >= minDigits) {
            const jid = num + '@s.whatsapp.net';
            return { jid, raw: jid, quotedPushName: null, source: 'args' };
        }
    }
    if (fallbackSelf) {
        const raw = senderJid || m?.senderPn || m?.sender || null;
        const jid = raw ? (toPhoneJid(raw) || raw) : null;
        return { jid, raw, quotedPushName: null, source: jid ? 'self' : null };
    }
    return { jid: null, raw: null, quotedPushName: null, source: null };
}
export async function resolveDisplayName(sock, m, targetJid, opts = {}) {
    const { quotedPushName = null, participants = null, fallback } = opts;
    const num = normNum(targetJid);
    const store = globalThis.__botStore__;
    if (store?.groupMetadata && m?.isGroup) {
        const gmParticipants = store.groupMetadata[m.chat]?.participants;
        const p = findParticipant(gmParticipants, num);
        const n = p?.notify || p?.name || p?.verifiedName;
        if (typeof n === 'string' && n.trim())
            return n.trim();
    }
    if (store?.contacts) {
        for (const c of [targetJid, num + '@s.whatsapp.net', num + '@c.us']) {
            const n = store.contacts[c]?.notify || store.contacts[c]?.name || store.contacts[c]?.verifiedName;
            if (typeof n === 'string' && n.trim())
                return n.trim();
        }
    }
    const lidJid = resolvePhoneToLid(num);
    const lidNum = lidJid ? lidJid.split('@')[0] : null;
    const dbName = (lidNum ? getPushName(lidNum) : null) ||
        getPushName(num) ||
        getPushName(targetJid) ||
        getPushName(num + '@s.whatsapp.net');
    if (typeof dbName === 'string' && dbName.trim())
        return dbName.trim();
    if (participants?.length) {
        const p = findParticipant(participants, num);
        const n = p?.notify || p?.name || p?.verifiedName;
        if (typeof n === 'string' && n.trim())
            return n.trim();
    }
    if (quotedPushName?.trim())
        return quotedPushName.trim();
    if (typeof m?.pushName === 'string' && m.pushName.trim()) {
        const senderNum = normNum(m.sender);
        if (senderNum === num)
            return m.pushName.trim();
    }
    if (m?.isGroup && sock?.groupMetadata) {
        try {
            const meta = await sock.groupMetadata(m.chat);
            const p = findParticipant(meta?.participants, num);
            const n = p?.notify || p?.name || p?.verifiedName;
            if (typeof n === 'string' && n.trim())
                return n.trim();
        }
        catch { }
    }
    return fallback ?? ('+' + num);
}
export function resolveNameFromParticipant(p, fallbackPushName) {
    const raw = p.id;
    const isLid = isLidJid(raw);
    const lidNum = raw.split('@')[0];
    const phone = isLid ? resolveLidToPhone(lidNum) : null;
    const phoneNum = phone || normNum(raw);
    return (getPushName(raw) ||
        getPushName(lidNum) ||
        (phone ? getPushName(phoneNum + '@s.whatsapp.net') : null) ||
        (phone ? getPushName(phoneNum) : null) ||
        p.notify ||
        p.name ||
        fallbackPushName ||
        ('+' + phoneNum));
}
export function safeDeleteParticipant(senderRaw) {
    if (!senderRaw)
        return '';
    if (isLidJid(senderRaw)) {
        const phone = resolveLidToPhone(senderRaw);
        if (phone)
            return phone + '@s.whatsapp.net';
    }
    return senderRaw;
}
export function safeKickJid(participant) {
    return participant?.id ?? null;
}
function senderNumFromMsg(m) {
    const raw = m?.sender || m?.key?.participant || m?.key?.remoteJid || '';
    let num = normNum(raw);
    if (isLidJid(raw)) {
        const resolved = resolveLidToPhone(raw);
        if (resolved)
            num = resolved;
    }
    return num;
}
function looksLikeMsg(input) {
    return !!input && typeof input === 'object' && ('sender' in input || 'key' in input);
}
export function isMainOwner(input, participants) {
    if (!input)
        return false;
    if (looksLikeMsg(input)) {
        const candidates = getSenderCandidates(input, participants);
        return candidates.some(n => _isMainOwnerNum(n));
    }
    return _isMainOwnerNum(resolveAnyToNum(input));
}
function resolveAnyToNum(raw) {
    let num = normNum(raw);
    if (isLidJid(raw)) {
        const resolved = resolveLidToPhone(raw);
        if (resolved)
            num = resolved;
    }
    return num;
}
export function isOwner(input, ownerList = [], participants) {
    if (!input)
        return false;
    if (looksLikeMsg(input)) {
        const candidates = getSenderCandidates(input, participants);
        if (!candidates.length)
            return false;
        return candidates.some(n => _isMainOwnerNum(n) || ownerList.some(o => normNum(o) === n));
    }
    const num = resolveAnyToNum(input);
    if (!num)
        return false;
    if (_isMainOwnerNum(num))
        return true;
    return ownerList.some(o => normNum(o) === num);
}
export function isGroupAdmin(input, participants) {
    const rawSender = looksLikeMsg(input)
        ? (input.sender || input.key?.participant || input.key?.remoteJid || '')
        : input;
    const p = findParticipant(participants, rawSender);
    return isParticipantAdmin(p);
}
export default {
    normNum,
    isLidJid,
    resolveLidToPhone,
    resolvePhoneToLid,
    toPhoneJid,
    getMentionJid,
    findParticipant,
    findBotParticipant,
    isParticipantAdmin,
    autoMapParticipantLids,
    mapSenderLid,
    resolveSenderLidLive,
    getSenderCandidates,
    resolveBotAdmin,
    isSenderAdminInGroup,
    resolveTarget,
    resolveDisplayName,
    resolveNameFromParticipant,
    safeDeleteParticipant,
    safeKickJid,
    isMainOwner,
    isOwner,
    isGroupAdmin,
};
