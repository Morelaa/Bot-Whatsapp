'use strict';
import fs from 'fs';
import * as baileys from '@itsliaaa/baileys';
import config from '../../config.js';
import db from '../../Database/db.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { isLidJid, resolveLidToPhone, normNum, findParticipant, findBotParticipant, isParticipantAdmin } from '../../Library/resolve.js';
const { prepareWAMessageMedia } = baileys;
function resolveOwnerName(ownerRaw, participants) {
    if (!ownerRaw || ownerRaw === '-') return '-';
    const isLid = isLidJid(ownerRaw);
    const num = isLid ? (resolveLidToPhone(ownerRaw) || normNum(ownerRaw)) : normNum(ownerRaw);
    const fromDB = db.getPushName(num) || db.getPushName(num + '@s.whatsapp.net');
    if (fromDB?.trim()) return fromDB.trim();
    if (participants?.length) {
        const p = findParticipant(participants, num);
        const name = p?.notify || p?.name || p?.verifiedName;
        if (typeof name === 'string' && name.trim()) return name.trim();
    }
    return num || ownerRaw;
}
async function getGroupPP(conn, groupJid) {
    try {
        const url = await conn.profilePictureUrl(groupJid, 'image');
        if (url) return url;
    } catch {  }
    return config.thumbnail;
}
async function isGroupBotAdmin(conn, groupJid, botJid) {
    try {
        const meta = await conn.groupMetadata(groupJid);
        const participants = meta?.participants || [];
        const botParticipant = findBotParticipant(participants, botJid);
        return isParticipantAdmin(botParticipant);
    } catch { return false; }
}
function buildRows(groups) {
    return groups.map((g, i) => ({
        header: `Grup ${i + 1}`,
        title: g.name.length > 40 ? g.name.slice(0, 37) + '...' : g.name,
        description: `Member : ${g.memberCount}  ◦  ${g.jid.replace('@g.us', '')}`,
        id: `.infogc ${g.jid}`,
    }));
}
const handler = async (m, { conn, command, text }) => {
    if (command === 'masukgc' || command === 'joingc') {
        if (!text) {
            return m.reply(`╭┈┈⬡「 *ᴍᴀꜱᴜᴋ ɢʀᴜᴘ* 」\n┃\n┃ ✧ ꜰᴏʀᴍᴀᴛ : .ᴍᴀꜱᴜᴋɢᴄ ʜᴛᴛᴘꜱ://ᴄʜᴀᴛ.ᴡʜᴀᴛꜱᴀᴘᴘ.ᴄᴏᴍ/xxxxx\n┃\n┃ ✧ ʙᴏᴛ ᴀᴋᴀɴ ʙᴇʀɢᴀʙᴜɴɢ ᴋᴇ ɢʀᴜᴘ ᴍᴇʟᴀʟᴜɪ ʟɪɴᴋ ɪɴᴠɪᴛᴇ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const codeMatch = text.match(/(?:chat\.whatsapp\.com\/|whatsapp\.com\/invite\/)([A-Za-z0-9_-]+)/i);
        if (!codeMatch) return m.reply(`╭┈┈⬡「 *ʟɪɴᴋ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ.* 」\n┃ ✧ ɢᴜɴᴀᴋᴀɴ ꜰᴏʀᴍᴀᴛ : ʜᴛᴛᴘꜱ://ᴄʜᴀᴛ.ᴡʜᴀᴛꜱᴀᴘᴘ.ᴄᴏᴍ/xxxxxx\n╰┈┈┈┈┈┈┈┈⬡`);
        const inviteCode = codeMatch[1];
        try {
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            const result = await conn.groupAcceptInvite(inviteCode);
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ʙᴇʀʜᴀꜱɪʟ ᴍᴀꜱᴜᴋ ɢʀᴜᴘ* 」\n┃\n┃ ✧ ᴋᴏᴅᴇ : ${inviteCode}\n┃ ✧ ᴊɪᴅ  : ${result || 'tidak tersedia'}\n╰┈┈┈┈┈┈┈┈⬡`);
        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            const msg = (e?.message || '').toLowerCase();
            const info = msg.includes('gone') ? 'Link sudah tidak valid / kedaluwarsa.'
                : msg.includes('not-authorized') || msg.includes('forbidden') ? 'Bot tidak diizinkan bergabung.'
                : msg.includes('already') || msg.includes('participant') ? 'Bot sudah ada di dalam grup.'
                : e?.message || 'Error tidak diketahui.';
            return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴍᴀꜱᴜᴋ ɢʀᴜᴘ* 」\n┃\n┃ ✧ ᴀʟᴀꜱᴀɴ : ${info}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
    if (command === 'outgc') {
        if (!text || !text.trim().endsWith('@g.us')) {
            return m.reply(`╭┈┈⬡「 *ᴏᴜᴛ ɢʀᴜᴘ* 」\n┃\n┃ ✧ ꜰᴏʀᴍᴀᴛ : .ᴏᴜᴛɢᴄ <ᴊɪᴅ@ɢ.ᴜꜱ>\n┃\n┃ ✧ ɢᴜɴᴀᴋᴀɴ .ɪɴꜰᴏɢᴄ ᴅᴜʟᴜ ᴜɴᴛᴜᴋ ᴘɪʟɪʜ ɢʀᴜᴘ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const targetJid = text.trim();
        let groupName = targetJid;
        try { const meta = await conn.groupMetadata(targetJid); groupName = meta?.subject || targetJid; } catch {  }
        try {
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            await conn.groupLeave(targetJid);
            db.deleteGroup(targetJid);
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ʙᴏᴛ ʙᴇʀʜᴀꜱɪʟ ᴋᴇʟᴜᴀʀ* 」\n┃\n┃ ✧ ɴᴀᴍᴀ : ${groupName}\n┃ ✧ ᴊɪᴅ  : ${targetJid.replace('@g.us', '')}\n╰┈┈┈┈┈┈┈┈⬡`);
        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴋᴇʟᴜᴀʀ* 」\n┃\n┃ ✧ ɴᴀᴍᴀ  : ${groupName}\n┃ ✧ ᴇʀʀᴏʀ : ${e?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
    }
    if (command === 'infogc' && text && text.trim().endsWith('@g.us')) {
        const targetJid = text.trim();
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        let meta = null;
        try { meta = await conn.groupMetadata(targetJid); } catch {  }
        const dbData = db.getGroup(targetJid);
        const settings = dbData?.settings || {};
        const name = meta?.subject || dbData?.name || targetJid;
        const members = meta?.participants?.length ?? 0;
        const ownerRaw = meta?.owner || '-';
        const desc = String(meta?.desc || '-').slice(0, 60);
        const parts = meta?.participants || [];
        const ownerName = resolveOwnerName(ownerRaw, parts);
        let botJid = '';
        try {
            const decoded = await conn.decodeJid(conn.user?.id ?? '');
            botJid = decoded.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } catch { botJid = conn.user?.id || ''; }
        const isBotAdmin = await isGroupBotAdmin(conn, targetJid, botJid);
        const onoff = (v) => (v ? 'ON' : 'OFF');
        const bodyText =
            `*Group Info*\n\n` +
            `◦ Nama   : ${name}\n` +
            `◦ Jid    : ${targetJid.replace('@g.us', '')}\n` +
            `◦ Member : ${members}\n` +
            `◦ Owner  : ${ownerName}\n` +
            `◦ Desc   : ${desc}\n\n` +
            `*Status Bot*\n\n` +
            `◦ Bot Admin : *${isBotAdmin ? 'YA' : 'TIDAK'}*\n\n` +
            `*Fitur*\n\n` +
            `◦ Welcome    : *${onoff(settings.welcome)}*\n` +
            `◦ Goodbye    : *${onoff(settings.goodbye)}*\n` +
            `◦ Antilink   : *${onoff(settings.antilink)}*\n` +
            `◦ Antigrup   : *${onoff(settings.antibot)}*\n` +
            `◦ Open/Close : *${onoff(settings.openclose)}*`;
        const ppThumb = await getGroupPP(conn, targetJid);
        try {
            const btn = new ButtonV2(conn).setTitle(name).setSubtitle(`Member : ${members}`).setBody(bodyText).setFooter(`© ${config.botName}`);
            btn.setThumbnail(ppThumb);
            btn.addButton('Out Grup', `.outgc ${targetJid}`);
            const msg = await btn.build(targetJid, { userJid: conn.user?.id });
            msg.key.remoteJid = m.chat;
            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        } catch (e) {
            console.error('[INFOGC] ButtonV2 error:', e?.message);
            await conn.sendMessage(m.chat, { text: bodyText });
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        return;
    }
    if (command === 'infogc') {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        let groupList = [];
        try {
            const dbGroups = db.getAllGroups();
            try {
                const activeGroups = await conn.groupFetchAllParticipating();
                const activeJids = new Set(Object.keys(activeGroups));
                for (const jid of Object.keys(dbGroups)) {
                    if (!activeJids.has(jid)) {
                        db.deleteGroup(jid);
                        delete dbGroups[jid];
                    }
                }
                for (const jid of activeJids) {
                    if (!dbGroups[jid] || dbGroups[jid]?.settings?.botInGroup !== true) {
                        db.updateGroup(jid, { botInGroup: true });
                        dbGroups[jid] = db.getGroup(jid) || dbGroups[jid];
                    }
                }
            } catch {  }
            const jids = Object.keys(dbGroups);
            if (!jids.length) {
                await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
                return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
            }
            const results = await Promise.allSettled(
                jids.slice(0, 50).map(async (jid) => {
                    try {
                        const meta = await conn.groupMetadata(jid);
                        return { jid, name: meta?.subject || dbGroups[jid]?.name || jid, memberCount: meta?.participants?.length ?? 0 };
                    } catch {
                        return { jid, name: dbGroups[jid]?.name || jid, memberCount: 0 };
                    }
                })
            );
            groupList = results.filter((r) => r.status === 'fulfilled').map((r) => r.value).sort((a, b) => a.name.localeCompare(b.name));
        } catch (e) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀꜰᴛᴀʀ ɢʀᴜᴘ : ${e?.message}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        if (!groupList.length) {
            await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        const MAX_PER_SECTION = 10;
        const sections = [];
        for (let i = 0; i < groupList.length; i += MAX_PER_SECTION) {
            const slice = groupList.slice(i, i + MAX_PER_SECTION);
            sections.push({ title: `Grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, groupList.length)} dari ${groupList.length}`, rows: buildRows(slice) });
        }
        const caption = `*Info Grup*\n\nTotal Grup : ${groupList.length}\n\n_Ketuk nama grup untuk lihat info lengkap._`;
        const thumb = fs.existsSync(config.registerImage) ? fs.readFileSync(config.registerImage) : undefined;
        let imgMsg = null;
        if (thumb) {
            try {
                const media = await prepareWAMessageMedia({ image: thumb }, { upload: conn.waUploadToServer });
                imgMsg = media?.imageMessage;
            } catch {  }
        }
        await conn.relayMessage(m.chat, {
            interactiveMessage: {
                ...(imgMsg ? { header: { hasMediaAttachment: true, imageMessage: imgMsg } } : { header: { hasMediaAttachment: false } }),
                body: { text: caption },
                footer: { text: `© ${config.botName}` },
                contextInfo: { forwardingScore: 1, isForwarded: true, quotedMessage: m.raw?.message },
                nativeFlowMessage: { buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Pilih Grup', sections }) }] },
            },
        }, { messageId: conn.generateMessageTag ? conn.generateMessageTag() : undefined });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
};
handler.command = /^(infogc|outgc|masukgc|joingc)$/i;
handler.owner = true;
handler.tags = ['owner'];
handler.help = ['infogc', 'infogc <jid@g.us>', 'outgc <jid@g.us>', 'masukgc <link>'];
handler.limit = true;
export default handler;
