'use strict';
import fs from 'fs';
import config from '../../config.js';
import { getAllGroups, upsertGroupSettings } from '../../Database/db.js';
import { buildFkontak } from '../../Library/utils.js';
import { getMainOwnerNumber } from '../../System/mainowner.js';
import {
    isSelfMode,
    setSelfMode,
    isSelfModeGlobal,
    setSelfModeGlobal,
} from '../../System/selfmode.js';
const FOOTER = `© ${config.copyrightName || config.botName || 'Bot'}`;
const IMAGE_PATH = config.registerImage;
async function sendInteractive(conn, chatJid, headerTitle, bodyText, quoted) {
    const { generateWAMessageFromContent } = await import('@itsliaaa/baileys');
    const mainOwnerNum = getMainOwnerNumber();
    const now = new Date();
    const end = new Date(now.getTime() + 10 * 60000);
    const buttons = [];
    if (mainOwnerNum) {
        buttons.push({
            name: 'booking_confirmation',
            buttonParamsJson: JSON.stringify({
                start_datetime: now.toISOString(),
                end_datetime: end.toISOString(),
                location: 'Indonesia',
                booking_url: `https://wa.me/${mainOwnerNum}`,
                phone_number: mainOwnerNum,
                booking_management_url: `https://wa.me/${mainOwnerNum}`,
                description:
                    `*◦  Name  :*  ${config.ownerName || 'Owner'}\n` +
                    `*◦  Status  :*  _Real Owner_\n`,
                email: '',
                display_text: ` ᴍᴀɪɴ ᴏᴡɴᴇʀ`,
                display_content: {
                    display_language: 'id',
                    display_meeting_type: 'ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ',
                    display_bottom_sheet_header: '々   P R O F I L E     ◦     I N F O   々',
                    display_add_to_calendar_cta_text: 'CALENDAR',
                    display_view_on_maps_cta_text: 'O W N E R     ◦     C O U N T R Y',
                    display_manage_booking_cta_text: 'Follow for More',
                    display_manage_booking_not_supported_text: 'OWNER NOT REGISTERED',
                    display_read_more: 'READ MORE',
                },
            }),
        });
    } else {
        buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: ` ᴍᴀɪɴ ᴏᴡɴᴇʀ`,
                url: `https://wa.me/${mainOwnerNum}`,
                merchant_url: `https://wa.me/${mainOwnerNum}`,
            }),
        });
    }
    const msg = generateWAMessageFromContent(
        chatJid,
        {
            interactiveMessage: {
                header: { title: headerTitle, hasMediaAttachment: false },
                body: { text: bodyText },
                footer: { text: `${FOOTER}` },
                nativeFlowMessage: { messageParamsJson: '{}', buttons },
            },
        },
        {
            userJid: mainOwnerNum ? `${mainOwnerNum}@s.whatsapp.net` : conn.user.id,
            quoted,
        }
    );
    await conn.relayMessage(chatJid, msg.message, { messageId: msg.key.id });
}
function buildSelfmodeRows(groups, cmdPrefix = '.selfmode') {
    return groups.map((g, i) => {
        const emoji = g.selfOn ? '🟢' : '🔴';
        const status = g.selfOn ? 'Self Mode ON' : 'Public Mode';
        return {
            header: `𝔊𝔯𝔲𝔭 ${i + 1}`,
            title: g.name.length > 40 ? g.name.slice(0, 37) + '...' : g.name,
            description: `${emoji} ${status}  ◦  Member: ${g.memberCount}  ◦  Klik untuk toggle`,
            id: `${cmdPrefix} ${g.jid}`,
        };
    });
}
async function syncGroupsFromLive(conn) {
    let live;
    try {
        live = await conn.groupFetchAllParticipating();
    } catch {
        return null;
    }
    if (!live) return null;
    const dbGroups = getAllGroups();
    for (const [jid, meta] of Object.entries(live)) {
        if (!dbGroups[jid]) {
            try { upsertGroupSettings(jid, meta?.subject ?? null, { botInGroup: true }); } catch { }
        }
    }
    return live;
}
async function fetchGroupList(conn) {
    const live = await syncGroupsFromLive(conn);
    const dbGroups = getAllGroups();
    const jids = live
        ? Object.keys(live)
        : Object.keys(dbGroups).filter((jid) => dbGroups[jid]?.settings?.botInGroup !== false);
    if (!jids.length) return [];
    return jids
        .slice(0, 50)
        .map((jid) => {
            const meta = live?.[jid];
            return {
                jid,
                name: meta?.subject || dbGroups[jid]?.name || jid,
                memberCount: meta?.participants?.length ?? 0,
                selfOn: isSelfMode(jid),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}
async function sendGroupList(conn, from, m, quoted, groupList, cmdPrefix, extraCaption = '') {
    const selfOnCount = groupList.filter((g) => g.selfOn).length;
    const globalOn = isSelfModeGlobal();
    const MAX_PER = 10;
    const sections = [];
    for (let i = 0; i < groupList.length; i += MAX_PER) {
        const slice = groupList.slice(i, i + MAX_PER);
        sections.push({
            title: `𝔊𝔯𝔲𝔭 ${i + 1}–${Math.min(i + MAX_PER, groupList.length)} ᴅᴀʀɪ ${groupList.length}`,
            rows: buildSelfmodeRows(slice, cmdPrefix),
        });
    }
    const caption =
        `乂  *ꜱ ᴇ ʟ ꜰ   ᴍ ᴏ ᴅ ᴇ   ◦   ᴅ ᴀ ꜰ ᴛ ᴀ ʀ   ɢ ʀ ᴜ ᴘ*\n\n` +
        `\t◦  *ᴛᴏᴛᴀʟ ɢʀᴜᴘ*  : ${groupList.length}\n` +
        `\t◦  *ꜱᴇʟꜰ ᴍᴏᴅᴇ*  : 🟢 ${selfOnCount} ɢʀᴜᴘ  ◦  🔴 ${groupList.length - selfOnCount} ɢʀᴜᴘ\n` +
        (globalOn ? `\t◦  *ɢʟᴏʙᴀʟ*      :  _ᴀᴋᴛɪꜰ — ꜱᴇᴍᴜᴀ ɢʀᴜᴘ ᴏᴛᴏᴍᴀᴛɪꜱ ꜱᴇʟꜰ ᴍᴏᴅᴇ_\n` : '') +
        extraCaption +
        `\n_𝔎𝔩𝔦𝔨 𝔫𝔞𝔪𝔞 𝔤𝔯𝔲𝔭 𝔲𝔫𝔱𝔲𝔨 𝔩𝔞𝔫𝔤𝔰𝔲𝔫𝔤 𝔱𝔬𝔤𝔤𝔩𝔢 𝔰𝔢𝔩𝔣 𝔪𝔬𝔡𝔢_`;
    const thumb = IMAGE_PATH && fs.existsSync(IMAGE_PATH) ? fs.readFileSync(IMAGE_PATH) : undefined;
    let imgMsg = null;
    if (thumb) {
        try {
            const { prepareWAMessageMedia } = await import('@itsliaaa/baileys');
            const media = await prepareWAMessageMedia({ image: thumb }, { upload: conn.waUploadToServer });
            imgMsg = media?.imageMessage;
        } catch { }
    }
    const fk = quoted || m.raw;
    await conn.relayMessage(from, {
        interactiveMessage: {
            ...(imgMsg
                ? { header: { hasMediaAttachment: true, imageMessage: imgMsg } }
                : { header: { hasMediaAttachment: false } }),
            body: { text: caption },
            footer: { text: `${FOOTER}` },
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                quotedMessage: fk?.message,
            },
            nativeFlowMessage: {
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '𝔓𝔦𝔩𝔦𝔥 𝔊𝔯𝔲𝔭',
                        sections,
                    }),
                }],
            },
        },
    }, { messageId: conn.generateMessageTag() });
}
const handler = async (m, { conn }) => {
    const from = m.chat;
    const args = m.args;
    const command = m.command;
    const fkontak = await buildFkontak(conn, config);
    if (command === 'selfstatus') {
        const globalOn = isSelfModeGlobal();
        if (globalOn) {
            await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
            const groupList = await fetchGroupList(conn);
            if (!groupList.length) {
                await conn.sendMessage(from, { react: { text: '', key: m.key } });
                return m.reply(`╭┈┈⬡「 *乂  *ꜱᴇʟꜰ ꜱᴛᴀᴛᴜꜱ* 」\n┃\n┃ ✧ \ᴛ◦  ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
            }
            await sendGroupList(
                conn, from, m, fkontak,
                groupList,
                '.selfstatus_toggle',
                `\t◦  *ᴋʟɪᴋ ɢʀᴜᴘ ᴅɪ ʙᴀᴡᴀʜ* ᴜɴᴛᴜᴋ ᴊᴀᴅɪᴋᴀɴ ᴘᴜʙʟɪᴄ\n`
            );
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            return;
        }
        await syncGroupsFromLive(conn);
        const dbGroups = getAllGroups();
        const jids = Object.keys(dbGroups);
        const onGroups = jids
            .filter((jid) => isSelfMode(jid))
            .map((jid) => ({ jid, name: dbGroups[jid]?.name || jid }))
            .sort((a, b) => a.name.localeCompare(b.name));
        if (!onGroups.length) {
            return sendInteractive(
                conn, from,
                '𝗣 𝗨 𝗕 𝗟 𝗜 𝗖   ◦   𝗦 𝗧 𝗔 𝗧 𝗨 𝗦',
                `*乂  ꜱᴇʟꜰ ᴍᴏᴅᴇ   ◦   ꜱᴛᴀᴛᴜꜱ*\n\n` +
                ` ᴍᴏᴅᴇ   : 🔴 *PUBLIC — ᴛɪᴅᴀᴋ ᴀᴅᴀ ɢʀᴜᴘ ʏᴀɴɢ ꜱᴇʟꜰ ᴍᴏᴅᴇ*\n` +
                ` ɪɴꜰᴏ   : _Bot ʀᴇꜱᴘᴏɴ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ ᴅɪ ꜱᴇᴍᴜᴀ ɢʀᴜᴘ_\n` +
                ` ᴋᴇᴛɪᴋ : *.selfmode* _ᴜɴᴛᴜᴋ ᴀᴋᴛɪꜰᴋᴀɴ ᴅɪ ɢʀᴜᴘ ᴛᴇʀᴛᴇɴᴛᴜ_`,
                fkontak
            );
        }
        const listText = onGroups.map((g, i) => `   ${i + 1}. ${g.name}`).join('\n');
        return sendInteractive(
            conn, from,
            '𝗦 𝗘 𝗟 𝗙   ◦   𝗦 𝗧 𝗔 𝗧 𝗨 𝗦',
            `*乂  ꜱᴇʟꜰ ᴍᴏᴅᴇ   ◦   ꜱᴛᴀᴛᴜꜱ*\n\n` +
            ` ᴍᴏᴅᴇ   : 🟢 *PER-GRUP — ɢʟᴏʙᴀʟ ᴛɪᴅᴀᴋ ᴀᴋᴛɪꜰ*\n` +
            ` ᴛᴏᴛᴀʟ   : *${onGroups.length} ɢʀᴜᴘ* ꜱᴇᴅᴀɴɢ ꜱᴇʟꜰ ᴍᴏᴅᴇ\n\n` +
            `*乂 Daftar grup:*\n${listText}\n\n` +
            ` ᴋᴇᴛɪᴋ : *.selfmode* _ᴜɴᴛᴜᴋ ᴋᴇʟᴏʟᴀ ᴘᴇʀ ɢʀᴜᴘ_`,
            fkontak
        );
    }
    if (command === 'selfstatus_toggle' && args[0] && args[0].endsWith('@g.us')) {
        const grpJid = args[0];
        setSelfMode(grpJid, false);
        let grpName = grpJid;
        try {
            const meta = await conn.groupMetadata(grpJid);
            grpName = meta?.subject || grpJid;
        } catch { }
        return sendInteractive(
            conn, from,
            '𝗣 𝗨 𝗕 𝗟 𝗜 𝗖   ◦   𝗠 𝗢 𝗗 𝗘',
            `*乂  ꜱᴇʟꜰ ꜱᴛᴀᴛᴜꜱ   ◦   ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
            ` ɢʀᴜᴘ    : _${grpName}_\n` +
            ` ꜱᴛᴀᴛᴜꜱ : 🔴 *ᴘᴜʙʟɪᴄ ᴍᴏᴅᴇ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n` +
            ` ɴᴏᴛᴇ    : _ ɢʟᴏʙᴀʟ ꜱᴇʟꜰ ᴍᴀꜱɪʜ ᴀᴋᴛɪꜰ, ɴᴀᴍᴜɴ ɢʀᴜᴘ ɪɴɪ ᴅɪᴋᴇᴄᴜᴀʟɪᴋᴀɴ_\n` +
            ` ɪɴꜰᴏ    : _Bot ʀᴇꜱᴘᴏɴ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ ᴅɪ ɢʀᴜᴘ ɪɴɪ_\n` +
            ` ᴋᴇᴛɪᴋ  : *.selfstatus* _ᴜɴᴛᴜᴋ ʟɪʜᴀᴛ ꜱᴛᴀᴛᴜꜱ ʟᴇɴɢᴋᴀᴘ_`,
            fkontak
        );
    }
    if (command === 'selfglobal') {
        const wantOn = !isSelfModeGlobal();
        const total = setSelfModeGlobal(wantOn);
        return sendInteractive(
            conn, from,
            wantOn ? '𝗦 𝗘 𝗟 𝗙   ◦   𝗚 𝗟 𝗢 𝗕 𝗔 𝗟' : '𝗣 𝗨 𝗕 𝗟 𝗜 𝗖   ◦   𝗚 𝗟 𝗢 𝗕 𝗔 𝗟',
            `*乂  ꜱᴇʟꜰ ɢʟᴏʙᴀʟ   ◦   ${wantOn ? 'ᴅɪᴀᴋᴛɪꜰᴋᴀɴ' : 'ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ'}*\n\n` +
            ` ꜱᴛᴀᴛᴜꜱ : ${wantOn ? '🟢 *ɢʟᴏʙᴀʟ ꜱᴇʟꜰ ᴍᴏᴅᴇ ᴀᴋᴛɪꜰ*' : '🔴 *ɢʟᴏʙᴀʟ ᴍᴏᴅᴇ ᴘᴜʙʟɪᴄ*'}\n` +
            ` ᴛᴏᴛᴀʟ   : _${total} ɢʀᴜᴘ ᴅɪᴜᴘᴅᴀᴛᴇ ꜱᴇᴋᴀʟɪɢᴜꜱ_\n` +
            ` ɪɴꜰᴏ   : ${wantOn
                ? '_Bot ʜᴀɴʏᴀ ʀᴇꜱᴘᴏɴ ᴏᴡɴᴇʀ ᴅɪ ꜱᴇᴍᴜᴀ ɢʀᴜᴘ_'
                : '_Bot ʀᴇꜱᴘᴏɴ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ ꜱᴇᴘᴇʀᴛɪ ʙɪᴀꜱᴀ_'}\n` +
            (wantOn ? ` ᴛɪᴘ     : _ᴋᴇᴛɪᴋ *.selfstatus* ᴜɴᴛᴜᴋ ᴋᴇᴄᴜᴀʟɪᴋᴀɴ ɢʀᴜᴘ ᴛᴇʀᴛᴇɴᴛᴜ_` : ''),
            fkontak
        );
    }
    if (command === 'selfmode' && args[0] && args[0].endsWith('@g.us')) {
        const grpJid = args[0];
        const wantOn = !isSelfMode(grpJid);
        setSelfMode(grpJid, wantOn);
        let grpName = grpJid;
        try {
            const meta = await conn.groupMetadata(grpJid);
            grpName = meta?.subject || grpJid;
        } catch { }
        return sendInteractive(
            conn, from,
            wantOn ? '𝗦 𝗘 𝗟 𝗙   ◦   𝗠 𝗢 𝗗 𝗘' : '𝗣 𝗨 𝗕 𝗟 𝗜 𝗖   ◦   𝗠 𝗢 𝗗 𝗘',
            `*乂  ꜱᴇʟꜰ ᴍᴏᴅᴇ   ◦   ${wantOn ? 'ᴅɪᴀᴋᴛɪꜰᴋᴀɴ' : 'ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ'}*\n\n` +
            ` ꜱᴛᴀᴛᴜꜱ : ${wantOn ? '🟢 *ꜱᴇʟꜰ ᴍᴏᴅᴇ ᴀᴋᴛɪꜰ*' : '🔴 *ᴍᴏᴅᴇ ᴘᴜʙʟɪᴄ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*'}\n` +
            ` ɢʀᴜᴘ   : _${grpName}_\n` +
            (isSelfModeGlobal()
                ? ` ɴᴏᴛᴇ    : _ ɢʟᴏʙᴀʟ ꜱᴇʟꜰ ᴍᴀꜱɪʜ ᴀᴋᴛɪꜰ, ɢᴜɴᴀᴋᴀɴ *.selfstatus* ᴜɴᴛᴜᴋ ᴋᴇʟᴏʟᴀ ᴘᴇʀ-ɢʀᴜᴘ_\n`
                : ` ɪɴꜰᴏ   : ${wantOn
                    ? '_Bot ʜᴀɴʏᴀ ʀᴇꜱᴘᴏɴ ᴏᴡɴᴇʀ ᴅɪ ɢʀᴜᴘ ɪɴɪ_'
                    : '_Bot ʀᴇꜱᴘᴏɴ ꜱᴇᴍᴜᴀ ᴜꜱᴇʀ ᴅɪ ɢʀᴜᴘ ɪɴɪ_'}\n`),
            fkontak
        );
    }
    if (command === 'selfmode' || command === 'self') {
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        const groupList = await fetchGroupList(conn);
        if (!groupList.length) {
            await conn.sendMessage(from, { react: { text: '', key: m.key } });
            return m.reply(`╭┈┈⬡「 *乂  *ꜱᴇʟꜰ ᴍᴏᴅᴇ* 」\n┃\n┃ ✧ \ᴛ◦  ʙᴏᴛ ᴛɪᴅᴀᴋ ʙᴇʀᴀᴅᴀ ᴅɪ ɢʀᴜᴘ ᴍᴀɴᴀᴘᴜɴ.\n╰┈┈┈┈┈┈┈┈⬡`);
        }
        await sendGroupList(conn, from, m, fkontak, groupList, '.selfmode');
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    }
};
handler.help = [
    'selfmode                 — daftar semua grup, klik nama grup untuk toggle self mode per-grup',
    'selfglobal               — toggle SELF MODE GLOBAL, aktifkan/matikan di semua grup sekaligus',
    'selfstatus               — cek status global & per-grup; jika global ON, klik grup untuk jadikan public',
];
handler.tags = ['owner'];
handler.command = /^(selfmode|selfglobal|selfstatus|selfstatus_toggle|self)$/i;
handler.owner = true;
handler.ignoreRateLimit = true;
handler.limit = true;
export default handler;
