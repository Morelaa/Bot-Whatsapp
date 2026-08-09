'use strict';
import config from '../../config.js';
import db from '../../Database/db.js';
import { Button } from '../../Library/MessageBuilder.js';
import { loadConfigImage } from '../../Library/utils.js';
import { findBotParticipant, isParticipantAdmin } from '../../Library/resolve.js';

const MAX_PER_SECTION = 10;

async function getAdminGroups(conn) {
    const groups = await conn.groupFetchAllParticipating();
    const botJid = conn?.user?.id ?? '';
    const adminGroups = [];
    for (const [id, meta] of Object.entries(groups)) {
        const list = meta.participants ?? [];
        const botEntry = findBotParticipant(list, botJid);
        if (isParticipantAdmin(botEntry)) {
            adminGroups.push({ id, subject: meta.subject || 'Grup' });
        }
    }
    return adminGroups;
}

async function approveGroup(conn, groupId) {
    const pending = await conn.groupRequestParticipantsList(groupId);
    if (!pending?.length) return { total: 0, approved: 0 };
    const jids = pending.map((p) => p.jid);
    await conn.groupRequestParticipantsUpdate(groupId, jids, 'approve');
    return { total: jids.length, approved: jids.length };
}

const handler = async (m, { conn, args, command }) => {
    const botName = config.botName;

    // .acc --confirm <groupId> -> dipanggil otomatis saat tap salah satu grup di list
    if (command === 'acc' && args[0] === '--confirm' && args[1]) {
        const groupId = args[1];
        let groupName = 'Grup';
        try {
            const meta = await conn.groupMetadata(groupId);
            groupName = meta.subject || 'Grup';
        } catch {}
        await conn.sendMessage(m.chat, { react: { text: '🕕', key: m.key } });
        try {
            const { total } = await approveGroup(conn, groupId);
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            if (total === 0) {
                await m.reply(`╭┈┈⬡「 *ᴀᴄᴄ ᴍᴇᴍʙᴇʀ* 」\n┃\n┃ ✧ ɢʀᴜᴘ  : ${groupName}\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ʀᴇQᴜᴇꜱᴛ ʙᴇʀɢᴀʙᴜɴɢ ʏᴀɴɢ ᴘᴇɴᴅɪɴɢ.\n┃\n╰┈┈┈┈┈┈┈┈⬡`);
            } else {
                await m.reply(`╭┈┈⬡「 *ᴀᴄᴄ ʙᴇʀʜᴀꜱɪʟ* 」\n┃\n┃ ✧ ɢʀᴜᴘ    : ${groupName}\n┃ ✧ ᴅɪᴀᴄᴄ   : ${total} ᴍᴇᴍʙᴇʀ\n┃\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`);
            }
        } catch (err) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ᴀᴄᴄ ᴍᴇᴍʙᴇʀ ᴅɪ ɢʀᴜᴘ ɪɴɪ.\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return;
    }

    // .accall -> acc semua member pending di semua grup dimana bot jadi admin
    if (command === 'accall') {
        await conn.sendMessage(m.chat, { react: { text: '🕕', key: m.key } });
        let adminGroups;
        try {
            adminGroups = await getAdminGroups(conn);
        } catch (err) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ᴀᴍʙɪʟ ᴅᴀꜰᴛᴀʀ ɢʀᴜᴘ.\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        if (!adminGroups.length) {
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ᴊᴀᴅɪ ᴀᴅᴍɪɴ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        let totalApproved = 0;
        let groupsWithApproval = 0;
        const lines = [];
        for (const g of adminGroups) {
            try {
                const { total } = await approveGroup(conn, g.id);
                if (total > 0) {
                    totalApproved += total;
                    groupsWithApproval += 1;
                    lines.push(` ✧ ${g.subject} : ${total} ᴍᴇᴍʙᴇʀ`);
                }
            } catch {
                // lewati grup yang gagal, lanjut ke grup berikutnya
            }
        }
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        if (totalApproved === 0) {
            return m.reply(`╭┈┈⬡「 *ᴀᴄᴄᴀʟʟ* 」\n┃\n┃ ✧ ᴛɪᴅᴀᴋ ᴀᴅᴀ ʀᴇQᴜᴇꜱᴛ ʙᴇʀɢᴀʙᴜɴɢ ʏᴀɴɢ ᴘᴇɴᴅɪɴɢ ᴅɪ ${adminGroups.length} ɢʀᴜᴘ.\n┃\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        return m.reply(
            `╭┈┈⬡「 *ᴀᴄᴄᴀʟʟ ʙᴇʀʜᴀꜱɪʟ* 」\n┃\n` +
            `┃ ✧ ᴛᴏᴛᴀʟ ᴅɪᴀᴄᴄ : ${totalApproved} ᴍᴇᴍʙᴇʀ\n` +
            `┃ ✧ ᴅɪ ${groupsWithApproval} ᴅᴀʀɪ ${adminGroups.length} ɢʀᴜᴘ\n┃\n` +
            lines.join('\n') +
            `\n╰┈┈┈┈┈┈┈┈⬡\n\n꒰ © ${botName} ꒱`
        );
    }

    // .acc (tanpa argumen) -> tampilkan list grup dimana bot jadi admin (single select)
    let adminGroups;
    try {
        adminGroups = await getAdminGroups(conn);
    } catch (err) {
        return m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ* 」\n┃ ✧ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ᴀᴍʙɪʟ ᴅᴀꜰᴛᴀʀ ɢʀᴜᴘ.\n┃ ✧ ${err?.message || 'Unknown error'}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    if (!adminGroups.length) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ʙᴏᴛ ᴛɪᴅᴀᴋ ᴊᴀᴅɪ ᴀᴅᴍɪɴ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
    }

    const pendingCounts = await Promise.all(
        adminGroups.map(async (g) => {
            try {
                const list = await conn.groupRequestParticipantsList(g.id);
                return list?.length || 0;
            } catch {
                return 0;
            }
        })
    );

    const bodyText =
        `╭┈┈⬡「 *ᴀᴄᴄ ᴍᴇᴍʙᴇʀ* 」\n` +
        `┃ ✧ ᴛᴏᴛᴀʟ ɢʀᴜᴘ (ʙᴏᴛ ᴀᴅᴍɪɴ) : ${adminGroups.length}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `Pilih grup di bawah untuk acc semua request bergabung yang pending.\n` +
        `Ketik *accall* untuk acc semua grup sekaligus.`;

    const imgBuf = await loadConfigImage(config.menuImage);
    const btn = new Button(conn)
        .setBody(bodyText)
        .setFooter(`© ${botName} • Admin Panel`)
        .setImage(imgBuf)
        .addSelection(' Pilih Grup');

    for (let i = 0; i < adminGroups.length; i += MAX_PER_SECTION) {
        const slice = adminGroups.slice(i, i + MAX_PER_SECTION);
        const sectionTitle = `Grup ${i + 1}–${Math.min(i + MAX_PER_SECTION, adminGroups.length)} dari ${adminGroups.length}`;
        btn.makeSection(sectionTitle);
        slice.forEach((g, idx) => {
            const pending = pendingCounts[i + idx];
            btn.makeRow(
                pending > 0 ? ` ${pending} pending` : 'Tidak ada pending',
                g.subject.slice(0, 40),
                'Tap untuk acc semua member di grup ini',
                `.acc --confirm ${g.id}`
            );
        });
    }
    await btn.send(m.chat, { quoted: m.raw });
};

handler.help = ['acc', 'accall'];
handler.tags = ['admin'];
handler.command = /^(acc|accall)$/i;
handler.owner = true;
handler.limit = true;
export default handler;
