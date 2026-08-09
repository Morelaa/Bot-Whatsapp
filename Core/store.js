'use strict';
import { normNum, isLidJid, resolveLidToPhone, findBotParticipant, autoMapParticipantLids } from '../Library/resolve.js';
import events, { EVENTS } from './events.js';
import { upsertGroupSettings, getGroup } from '../Database/db.js';
import { recordMemberJoin, recordMemberLeave, recordMemberPromote, recordMemberDemote } from '../Database/groupMembers.js';
import { logError } from './logutil.js';
const MAX_MESSAGES_PER_CHAT = 100;
function extractParticipantJid(p) {
    if (typeof p === 'string')
        return p;
    if (p && typeof p === 'object')
        return p.jid || p.id || p.lid || null;
    return null;
}
class Store {
    constructor() {
        this.contacts = {};
        this.chats = {};
        this.groupMetadata = {};
        this.messages = {};
    }
    upsertContact(jid, data = {}) {
        if (!jid)
            return;
        this.contacts[jid] = { ...(this.contacts[jid] || {}), id: jid, ...data };
    }
    getContact(jid) {
        return this.contacts[jid] || null;
    }
    upsertChat(jid, data = {}) {
        if (!jid)
            return;
        this.chats[jid] = { ...(this.chats[jid] || {}), id: jid, ...data };
    }
    getChat(jid) {
        return this.chats[jid] || null;
    }
    setGroupMetadata(groupJid, metadata) {
        if (!groupJid || !metadata)
            return;
        this.groupMetadata[groupJid] = metadata;
    }
    getGroupMetadata(groupJid) {
        return this.groupMetadata[groupJid] || null;
    }
    patchGroupParticipants(groupJid, participants) {
        const meta = this.groupMetadata[groupJid];
        if (!meta)
            return;
        meta.participants = participants;
    }
    saveMessage(chatJid, msg) {
        if (!chatJid || !msg?.key?.id)
            return;
        if (!this.messages[chatJid])
            this.messages[chatJid] = new Map();
        const bucket = this.messages[chatJid];
        bucket.set(msg.key.id, msg);
        if (bucket.size > MAX_MESSAGES_PER_CHAT) {
            const oldestKey = bucket.keys().next().value;
            bucket.delete(oldestKey);
        }
    }
    getMessage(chatJid, msgId) {
        return this.messages[chatJid]?.get(msgId) || null;
    }
    bind(sock) {
        sock.ev.on('contacts.upsert', (contacts) => {
            for (const c of contacts)
                this.upsertContact(c.id, c);
        });
        sock.ev.on('contacts.update', (updates) => {
            for (const u of updates)
                this.upsertContact(u.id, u);
        });
        sock.ev.on('chats.upsert', (chats) => {
            for (const c of chats)
                this.upsertChat(c.id, c);
        });
        sock.ev.on('chats.update', (updates) => {
            for (const u of updates)
                this.upsertChat(u.id, u);
        });
        sock.ev.on('groups.update', (updates) => {
            for (const u of updates) {
                const existing = this.groupMetadata[u.id] || {};
                this.groupMetadata[u.id] = { ...existing, ...u };
            }
        });
        sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
            let meta = null;
            try {
                meta = await sock.groupMetadata(id);
                this.groupMetadata[id] = meta;
                autoMapParticipantLids(meta?.participants);
            }
            catch {
                meta = this.groupMetadata[id] || null;
                if (action === 'remove')
                    delete this.groupMetadata[id];
            }
            const botNum = normNum(sock?.user?.id);
            const botEntry = meta ? findBotParticipant(meta.participants, sock?.user?.id) : null;
            const botIdSet = new Set([botNum].filter(Boolean));
            if (botEntry) {
                if (botEntry.id) botIdSet.add(normNum(botEntry.id));
                if (botEntry.lid) botIdSet.add(normNum(botEntry.lid));
                if (botEntry.jid) botIdSet.add(normNum(botEntry.jid));
                if (botEntry.phoneNumber) botIdSet.add(normNum(botEntry.phoneNumber));
            }
            const list = participants || [];
            const groupSettings = getGroup(id)?.settings;
            const memberCount = meta?.participants?.length || 0;
            for (const raw of list) {
                const p = extractParticipantJid(raw);
                if (!p)
                    continue;
                try {
                    const pNum = normNum(p);
                    let isBot = !!botNum && botIdSet.has(pNum);
                    if (!isBot && isLidJid(p)) {
                        const resolved = resolveLidToPhone(p);
                        if (resolved && resolved === botNum)
                            isBot = true;
                    }
                    const contactName = this.getContact(p)?.notify || this.getContact(p)?.name || null;
                    if (action === 'add') {
                        recordMemberJoin(id, p, contactName);
                        if (isBot)
                            upsertGroupSettings(id, meta?.subject ?? null, { botInGroup: true, isBotAdmin: false, joinedAt: Date.now() });
                        else if (groupSettings?.welcome) {
                            import('../Plugins-ESM/admin/welcome.js')
                                .then(({ sendWelcome }) => sendWelcome(sock, id, p, meta?.subject ?? 'Group', memberCount, contactName))
                                .catch((err) => logError('Gagal kirim welcome:', err?.message || err));
                        }
                    }
                    else if (action === 'remove') {
                        recordMemberLeave(id, p);
                        if (isBot)
                            upsertGroupSettings(id, meta?.subject ?? null, { botInGroup: false, isBotAdmin: false, leftAt: Date.now() });
                        else if (groupSettings?.goodbye) {
                            import('../Plugins-ESM/admin/goodbye.js')
                                .then(({ sendGoodbye }) => sendGoodbye(sock, id, p, meta?.subject ?? 'Group', memberCount, contactName))
                                .catch((err) => logError('Gagal kirim goodbye:', err?.message || err));
                        }
                    }
                    else if (action === 'promote') {
                        recordMemberPromote(id, p);
                        if (isBot)
                            upsertGroupSettings(id, meta?.subject ?? null, { isBotAdmin: true });
                    }
                    else if (action === 'demote') {
                        recordMemberDemote(id, p);
                        if (isBot)
                            upsertGroupSettings(id, meta?.subject ?? null, { isBotAdmin: false });
                    }
                }
                catch (err) {
                    logError(`Gagal simpan perubahan grup (${action}) ke database:`, err?.message || err);
                }
            }
            events.emitLogged(EVENTS.GROUP_PARTICIPANTS_UPDATE, { id, participants: list, action, meta });
        });
        sock.ev.on('groups.upsert', (groups) => {
            for (const g of groups || []) {
                if (!g?.id)
                    continue;
                this.groupMetadata[g.id] = { ...(this.groupMetadata[g.id] || {}), ...g };
                autoMapParticipantLids(g.participants);
                try {
                    upsertGroupSettings(g.id, g.subject ?? null, { botInGroup: true });
                }
                catch (err) {
                    logError('Gagal simpan grup baru (groups.upsert) ke database:', err?.message || err);
                }
            }
        });
        sock.ev.on('messages.upsert', ({ messages }) => {
            for (const m of messages) {
                this.saveMessage(m.key.remoteJid, m);
            }
        });
        globalThis.__botStore__ = this;
    }
    async reconcileGroups(sock) {
        try {
            const active = await sock.groupFetchAllParticipating();
            for (const [jid, meta] of Object.entries(active || {})) {
                this.groupMetadata[jid] = meta;
                autoMapParticipantLids(meta?.participants);
                upsertGroupSettings(jid, meta?.subject ?? null, { botInGroup: true });
            }
            return Object.keys(active || {}).length;
        }
        catch (err) {
            logError('Gagal reconcile daftar grup:', err?.message || err);
            return 0;
        }
    }
}
const store = new Store();
export default store;
