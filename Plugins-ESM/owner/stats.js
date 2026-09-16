//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import * as chatcount from '../../Database/chatcount.js';
import * as stats from '../../Database/stats.js';
import { resolveDisplayName } from '../../Library/resolve.js';
function uptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} hari ${h % 24} jam`;
    if (h > 0) return `${h} jam ${m % 60} menit`;
    return `${m} menit ${s % 60} detik`;
}
function medal(rank) {
    return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
}
const DAYS_ID = {
    0: 'Minggu', 1: 'Senin', 2: 'Selasa',
    3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu',
};
const RELAY_OPT = {
    additionalNodes: [{
        tag: 'biz', attrs: {},
        content: [{
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
        }],
    }],
};
const handler = async (m, { conn, command }) => {
    if (command === 'resetstats') {
        chatcount.clearAll();
        stats.resetAll();
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        return m.reply('✅ Stats direset!');
    }
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    const total = stats.get('commands_executed') || 0;
    const age = uptime(Date.now() - stats.ensureFirstStart());
    const topCmds = chatcount.getTopCommands(3);
    const topUsers = chatcount.getTopUsers(3);
    const allMetrics = stats.getAll();
    const topHours = allMetrics
        .filter((r) => r.metric.startsWith('hour_'))
        .map((r) => ({ hour: Number(r.metric.slice(5)), count: r.value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    const topDays = allMetrics
        .filter((r) => r.metric.startsWith('day_'))
        .map((r) => ({ day: Number(r.metric.slice(4)), count: r.value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    const resolvedNames = new Map();
    for (const u of topUsers) {
        try {
            const name = await resolveDisplayName(conn, m, u.jid, {});
            resolvedNames.set(u.jid, name);
        }
        catch {
            resolvedNames.set(u.jid, '+' + u.jid.split('@')[0].split(':')[0].slice(-8));
        }
    }
    const pollVotes = [
        ...topCmds.map((row, i) => ({
            optionName: `🏆 ${medal(i + 1)} .${row.command}`,
            optionVoteCount: String(row.total),
        })),
        ...topUsers.map((row, i) => {
            const name = resolvedNames.get(row.jid) || row.jid.split('@')[0];
            return {
                optionName: `👤 ${medal(i + 1)} ${name.slice(0, 15)}`,
                optionVoteCount: String(row.total),
            };
        }),
        ...topHours.map((row, i) => ({
            optionName: `🕐 ${medal(i + 1)} ${String(row.hour).padStart(2, '0')}:00-${String((row.hour + 1) % 24).padStart(2, '0')}:00`,
            optionVoteCount: String(row.count),
        })),
        ...topDays.map((row, i) => ({
            optionName: `📅 ${medal(i + 1)} ${DAYS_ID[row.day] || row.day}`,
            optionVoteCount: String(row.count),
        })),
    ];
    try {
        const content = {
            pollResultSnapshotMessage: {
                name: `📊 STATS DASHBOARD | ${total.toLocaleString()}x | ⏱ ${age}`,
                pollVotes,
                contextInfo: {
                    stanzaId: m.key?.id || ('STATS' + Date.now()),
                    participant: m.key?.participant || m.sender || '0@s.whatsapp.net',
                    quotedMessage: { conversation: `© ${config.copyrightName || config.botName}` },
                    mentionedJid: [],
                },
                pollType: 'POLL',
            },
        };
        await conn.relayMessage(m.chat, content, RELAY_OPT);
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    catch (err) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`❌ Error: ${err.message}`);
    }
};
handler.command = /^(stats|botstats|resetstats)$/i;
handler.owner = true;
handler.tags = ['owner'];
handler.help = ['stats — dashboard statistik bot'];
handler.noLimit = true;
export default handler;
