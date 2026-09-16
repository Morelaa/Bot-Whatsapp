//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

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
