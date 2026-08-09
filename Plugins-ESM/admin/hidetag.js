'use strict';
const handler = async (m, { conn, text, participants, groupMeta }) => {
    const list = participants || groupMeta?.participants || (await conn.groupMetadata(m.chat)).participants;
    const mentions = list.map((p) => p.id);
    await conn.sendMessage(m.chat, { text: text || '', mentions }, { quoted: m.raw });
};
handler.help = ['hidetag <pesan>'];
handler.tags = ['admin'];
handler.command = /^(hidetag|ht)$/i;
handler.admin = true;
handler.group = true;
handler.limit = true;
export default handler;
