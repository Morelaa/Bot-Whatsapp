//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import db from '../Database/db.js';
import { logError, logInfo, logWarn } from '../Core/logutil.js';
import {
    resolveBotAdmin,
    findParticipant,
    safeKickJid,
    isLidJid,
    resolveLidToPhone,
    normNum,
    isSenderAdminInGroup,
} from '../Library/resolve.js';
const _ghostMap = new Map();
const _lastAlert = new Map();
const GHOST_TTL_MS = 15_000; 
const ALERT_COOLDOWN_MS = 10_000;
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _ghostMap) {
        if (now - v.ts > GHOST_TTL_MS) _ghostMap.delete(k);
    }
    for (const [k, ts] of _lastAlert) {
        if (now - ts > 60_000) _lastAlert.delete(k);
    }
}, 30_000);
function isGroupJid(jid) {
    return typeof jid === 'string' && jid.endsWith('@g.us');
}
function antiEnabled(chat) {
    const grp = db.getGroup(chat);
    return !!grp?.settings?.antifakeedit;
}
function resolveDisplay(senderJid, pushName) {
    const isLid = isLidJid(senderJid);
    const rawLidNum = senderJid.split('@')[0];
    const resolvedPhone = isLid ? resolveLidToPhone(senderJid) : null;
    const phoneNum = resolvedPhone || normNum(senderJid);
    const mentionJid = resolvedPhone ? `${phoneNum}@s.whatsapp.net` : senderJid;
    const displayName =
        db.getPushName?.(senderJid) ||
        db.getPushName?.(rawLidNum) ||
        pushName ||
        (resolvedPhone ? `+${phoneNum}` : rawLidNum);
    return { phoneNum, mentionJid, displayName };
}
function trackGhostIfMatch(msg, chat) {
    const ext = msg.message?.extendedTextMessage;
    if (!ext) return;
    if (ext.contextInfo?.isGroupStatus !== true) return;
    const id = msg.key?.id;
    const sender = msg.key?.participant || msg.key?.remoteJid;
    if (!id || !sender) return;
    _ghostMap.set(`${chat}:${id}`, { sender, ts: Date.now(), pushName: msg.pushName });
}
async function checkEditExploit(sock, msg, chat) {
    const proto = msg.message?.protocolMessage;
    if (!proto || proto.type !== 14) return null;
    const editId = proto.key?.id;
    const attacker = msg.key?.participant || msg.key?.remoteJid;
    if (!editId || !attacker) return null;
    const ghostKey = `${chat}:${editId}`;
    const ghost = _ghostMap.get(ghostKey);
    if (!ghost) return null;
    if (ghost.sender !== attacker) return null; 
    const editedExt = proto.editedMessage?.extendedTextMessage;
    const suspicious = editedExt ? editedExt.contextInfo?.isGroupStatus === false : true;
    _ghostMap.delete(ghostKey);
    if (!suspicious) return null;
    return { attacker, editId, pushName: msg.pushName };
}
export function bindAntiFakeEdit(sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages || []) {
            try {
                const chat = msg.key?.remoteJid;
                if (!isGroupJid(chat)) continue;
                if (chat === 'status@broadcast') continue;
                trackGhostIfMatch(msg, chat);
                if (!antiEnabled(chat)) continue;
                const hit = await checkEditExploit(sock, msg, chat);
                if (!hit) continue;
                const { attacker } = hit;
                if (msg.key?.fromMe) continue;
                const key = `${chat}:${attacker}`;
                const lastAt = _lastAlert.get(key) || 0;
                if (Date.now() - lastAt < ALERT_COOLDOWN_MS) continue;
                _lastAlert.set(key, Date.now());
                logWarn(`[ANTI-FAKEEDIT] Pola ghost-edit terdeteksi di ${chat} dari ${attacker}`);
                const { phoneNum, mentionJid, displayName } = resolveDisplay(attacker, hit.pushName);
                const botAdmin = await resolveBotAdmin(sock, chat);
                await sock.sendMessage(chat, {
                    text:
                        ` *Anti Fake-Edit — Terdeteksi!*\n\n` +
                        `Kedeteksi ngirim pesan hantu lalu langsung nge-edit ` +
                        `pesan (pola bot manipulasi pesan/hapus pesan orang lain).\n\n` +
                        `Pelaku: @${phoneNum}` +
                        (displayName && displayName !== phoneNum ? ` (${displayName})` : '') +
                        `\n\n${botAdmin ? '*Tindakan: Kick otomatis*' : ' Bot bukan admin, tidak bisa kick otomatis. Admin mohon tindak manual.'}`,
                    mentions: [mentionJid],
                });
                if (botAdmin) {
                    try {
                        const meta = await sock.groupMetadata(chat);
                        const target = findParticipant(meta?.participants, attacker);
                        const kickJid = safeKickJid(target) || attacker;
                        await sock.groupParticipantsUpdate(chat, [kickJid], 'remove');
                        logInfo(`[ANTI-FAKEEDIT] Kick ${kickJid} dari ${chat}`);
                    } catch (e) {
                        logError('[ANTI-FAKEEDIT] Gagal kick:', e?.message);
                    }
                }
            } catch (e) {
                logError('[ANTI-FAKEEDIT] error proses pesan:', e?.stack || e?.message);
            }
        }
    });
    logInfo('Fitur Anti Fake-Edit (deteksi ghost message + edit) siap. Aktifkan per grup dengan .antifakeedit on');
}
export default { bindAntiFakeEdit };
