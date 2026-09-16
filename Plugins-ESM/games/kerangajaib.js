//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import config from '../../config.js';
import { pickRandom } from '../../Library/utils.js';
import { ButtonV2 } from '../../Library/MessageBuilder.js';
import { toPhoneJid, normNum } from '../../Library/resolve.js';
const THUMB = config.buttonv2Img;
const FOOTER = `© ${config.copyrightName || config.botName || 'Bot'}`;
async function sendBtn(conn, chat, {
    title = 'Kerang Ajaib 🐚',
    body = '',
    mentions = [],
} = {}) {
    try {
        const btn = new ButtonV2(conn)
            .setTitle(title)
            .setSubtitle('')
            .setBody(body)
            .setFooter(FOOTER)
            .setContextInfo({ mentionedJid: mentions });
        if (THUMB) btn.setThumbnail(THUMB);
        btn.addButton('📋 Menu', '.menu');
        const msg = await btn.build(chat, { userJid: conn.user?.id });
        await conn.relayMessage(chat, msg.message, { messageId: msg.key.id });
    } catch (e) {
        await conn.sendMessage(chat, { text: body, mentions });
    }
}
function getMention(id) {
    const phoneJid = toPhoneJid(id) || id;
    const phoneNum = normNum(phoneJid);
    return { id, phoneJid, phoneNum };
}
const handler = async (m, { conn, text, command, participants }) => {
    if (!participants?.length) return m.reply('❌ Gagal ambil data grup.');
    const botNum = normNum(conn.user?.id);
    const botLidNum = normNum(conn.user?.lid);
    const rawMembers = participants
        .map((u) => u.id)
        .filter((v) => {
            const n = normNum(v);
            return n && n !== botNum && n !== botLidNum;
        });
    switch (command) {
        case 'bego': case 'goblok': case 'janda': case 'perawan': case 'babi':
        case 'tolol': case 'pekok': case 'jancok': case 'pinter': case 'pintar':
        case 'asu': case 'bodoh': case 'lesby': case 'bajingan': case 'anjing':
        case 'anjg': case 'anjj': case 'anj': case 'ngentod': case 'ngentot':
        case 'monyet': case 'mastah': case 'newbie': case 'bangsat': case 'bangke':
        case 'sange': case 'sangean': case 'dakjal': case 'horny': case 'wibu':
        case 'puki': case 'puqi': case 'peak': case 'pantex': case 'pantek':
        case 'setan': case 'iblis': case 'cacat': case 'yatim': case 'piatu': {
            if (!rawMembers.length) return m.reply('❌ Tidak ada member.');
            const { phoneJid, phoneNum } = getMention(pickRandom(rawMembers));
            await sendBtn(conn, m.chat, {
                title: 'Kerang Ajaib 🐚',
                body: `Anak ${command} di sini adalah @${phoneNum}`,
                mentions: [phoneJid],
            });
            break;
        }
        case 'sangecek': case 'ceksange': case 'gaycek':
        case 'cekgay': case 'lesbicek': case 'ceklesbi': {
            if (!text) return m.reply(`Penggunaan: .${command} Nama\n\nContoh: .${command} Lisaa`);
            const sangeh = ['5','10','15','20','25','30','35','40','45','50','55','60','65','70','75','80','85','90','95','100'];
            m.reply(`Nama : ${text}\nJawaban : *${pickRandom(sangeh)}%*`);
            break;
        }
        case 'kapankah': {
            if (!text) return m.reply(`Penggunaan: .kapankah Pertanyaan\n\nContoh: .kapankah Saya Mati`);
            const kapan = [
                '5 Hari Lagi','10 Hari Lagi','15 Hari Lagi','20 Hari Lagi','25 Hari Lagi',
                '30 Hari Lagi','35 Hari Lagi','40 Hari Lagi','45 Hari Lagi','50 Hari Lagi',
                '1 Bulan Lagi','2 Bulan Lagi','3 Bulan Lagi','6 Bulan Lagi',
                '1 Tahun Lagi','2 Tahun Lagi','3 Tahun Lagi','5 Tahun Lagi',
                'Besok','Lusa',`Abis Command Ini Juga Lu ${text}`
            ];
            m.reply(`Pertanyaan : ${text}\nJawaban : *${pickRandom(kapan)}*`);
            break;
        }
        case 'siapa': {
            if (!text) return m.reply(`Penggunaan: .siapa <pertanyaan>\n\nContoh: .siapa yang paling ganteng?`);
            if (!rawMembers.length) return m.reply('❌ Tidak ada member.');
            const { phoneJid, phoneNum } = getMention(pickRandom(rawMembers));
            await sendBtn(conn, m.chat, {
                title: 'Kerang Ajaib 🐚',
                body: `${text}?\nJawabnya adalah @${phoneNum}!`,
                mentions: [phoneJid],
            });
            break;
        }
        case 'dimana': {
            if (!text) return m.reply(`Penggunaan: .dimana <pertanyaan>\n\nContoh: .dimana dia sekarang?`);
            const tempat = [
                'Di Rumah 🏠','Di Warung ☕','Di Mall 🛍️','Di Sekolah 📚','Di Kantor 💼',
                'Di Toilet 🚽','Di Kasur 🛏️','Di Dapur 🍳','Di Surga 😇','Di Neraka 😈',
                'Di Hati Kamu ❤️','Di Tempat Tersembunyi 🕵️','Di Planet Lain 🪐',
                'Entah Kemana 🤷','Di Bawah Bantal 😂'
            ];
            m.reply(`Pertanyaan: ${text}\nJawaban: *${pickRandom(tempat)}*`);
            break;
        }
        case 'bagaimana': {
            if (!text) return m.reply(`Penggunaan: .bagaimana <pertanyaan>\n\nContoh: .bagaimana cara sukses?`);
            const cara = [
                'Dengan Sabar 🙏','Dengan Uang 💸','Dengan Doa 🤲','Dengan Usaha Keras 💪',
                'Dengan Nangis Dulu 😭','Dengan Tidur Aja 😴','Nggak Akan Bisa 💀',
                'Gampang Banget Kok 😎','Tanya Google Aja 🔍','Tanya Mama Lu 👩',
                'Minta Tolong Tetangga 🏘️','Beli Aja Di Shopee 🛒'
            ];
            m.reply(`Pertanyaan: ${text}\nJawaban: *${pickRandom(cara)}*`);
            break;
        }
        case 'sulap': {
            if (!rawMembers.length) return m.reply('❌ Tidak ada member.');
            const { phoneJid: orgJid, phoneNum: orgNum } = getMention(pickRandom(rawMembers));
            await sendBtn(conn, m.chat, {
                title: '✨ Sulap Bot',
                body: `🪄 Sim Salabim!\nYang Menghilang Adalah @${orgNum}! ✨`,
                mentions: [orgJid],
            });
            break;
        }
        case 'top5': {
            if (rawMembers.length < 5) return m.reply('❌ Member kurang dari 5.');
            const shuffled = [...rawMembers].sort(() => 0.5 - Math.random()).slice(0, 5).map(getMention);
            const list = shuffled.map((v, i) => `${i + 1}. @${v.phoneNum}`).join('\n');
            await sendBtn(conn, m.chat, {
                title: '🏆 Top 5 Pilihan Bot',
                body: `🏆 Top 5 Member Pilihan Bot:\n\n${list}`,
                mentions: shuffled.map((v) => v.phoneJid),
            });
            break;
        }
        case 'bucin': {
            if (!rawMembers.length) return m.reply('❌ Tidak ada member.');
            const { phoneJid: orgJid, phoneNum: orgNum } = getMention(pickRandom(rawMembers));
            await sendBtn(conn, m.chat, {
                title: '💘 Bucin Detector',
                body: `💘 Bucin paling parah di sini adalah @${orgNum}!\nSanggup ngorbanin segalanya demi doi 😭`,
                mentions: [orgJid],
            });
            break;
        }
        case 'cekhodam': case 'khodam': {
            if (!text) return m.reply(`Penggunaan: .cekhodam <nama>\n\nContoh: .cekhodam Budi`);
            const hodam = [
                'Macan Putih 🐯','Ular Naga 🐉','Harimau Hitam 🐅','Buaya Putih 🐊',
                'Elang Sakti 🦅','Kuda Hitam 🐴','Kera Sakti 🐒','Singa Gaib 🦁',
                'Tidak Punya Khodam 💀','Khodam Kucing Garong 🐱','Jin Tomang 👻',
                'Khodam Tuyul 👶','Wewe Gombel 👩','Pocong VIP 👻','Genderuwo Jadul 🧌',
                'Khodam Batu Bata 🧱','Nyi Roro Kidul 🌊','Khodam Mie Ayam 🍜'
            ];
            m.reply(`Nama: *${text}*\nKhodam: *${pickRandom(hodam)}*\n\n_Hasil bersifat hiburan semata_ 😄`);
            break;
        }
        case 'cp': case 'couple': {
            if (rawMembers.length < 2) return m.reply('❌ Member kurang dari 2.');
            const orang = pickRandom(rawMembers);
            const { phoneJid: orangJid, phoneNum: orangNum } = getMention(orang);
            const { phoneJid: jodohJid, phoneNum: jodohNum } = getMention(pickRandom(rawMembers.filter((v) => v !== orang)));
            await sendBtn(conn, m.chat, {
                title: '💞 Ship Alert!',
                body: `@${orangNum} ❤️ @${jodohNum}\nCieeee, What's Going On❤️💖👀`,
                mentions: [orangJid, jodohJid],
            });
            break;
        }
        case 'gay': {
            if (!rawMembers.length) return m.reply('❌ Tidak ada member.');
            const { phoneJid: orangJid, phoneNum: orangNum } = getMention(pickRandom(rawMembers));
            await sendBtn(conn, m.chat, {
                title: '🌈 Gay Detector',
                body: `*@${orangNum} Adalah Orang Paling Gay Di Group Ini*`,
                mentions: [orangJid],
            });
            break;
        }
        case 'jodoh': case 'jodohku': {
            if (rawMembers.length < 2) return m.reply('❌ Member kurang dari 2.');
            const meM = getMention(m.sender);
            const { phoneJid: jodohJid, phoneNum: jodohNum } = getMention(pickRandom(rawMembers.filter((v) => v !== m.sender)));
            await sendBtn(conn, m.chat, {
                title: '💕 Jodoh Detector',
                body: `jodoh @${meM.phoneNum} adalah @${jodohNum}`,
                mentions: [meM.phoneJid, jodohJid],
            });
            break;
        }
    }
};
handler.command = /^(bego|goblok|janda|perawan|babi|tolol|pekok|jancok|pinter|pintar|asu|bodoh|lesby|bajingan|anjing|anjg|anjj|anj|ngentod|ngentot|monyet|mastah|newbie|bangsat|bangke|sange|sangean|dakjal|horny|wibu|puki|puqi|peak|pantex|pantek|setan|iblis|cacat|yatim|piatu|sangecek|ceksange|gaycek|cekgay|lesbicek|ceklesbi|kapankah|siapa|dimana|bagaimana|sulap|top5|bucin|cekhodam|khodam|cp|couple|gay|jodoh|jodohku)$/i;
handler.tags = ['games'];
handler.help = [
    'bego', 'goblok', 'janda', 'perawan', 'babi', 'tolol', 'pekok', 'jancok',
    'pinter', 'pintar', 'asu', 'bodoh', 'lesby', 'bajingan', 'anjing',
    'anjg', 'anjj', 'anj', 'ngentod', 'ngentot', 'monyet', 'mastah', 'newbie',
    'bangsat', 'bangke', 'sange', 'sangean', 'dakjal', 'horny', 'wibu', 'puki',
    'puqi', 'peak', 'pantex', 'pantek', 'setan', 'iblis', 'cacat', 'yatim', 'piatu',
    'sangecek <nama>', 'ceksange <nama>', 'gaycek <nama>', 'cekgay <nama>',
    'lesbicek <nama>', 'ceklesbi <nama>',
    'kapankah <tanya>', 'siapa <tanya>', 'dimana <tanya>', 'bagaimana <tanya>',
    'sulap', 'top5', 'bucin',
    'cekhodam <nama>', 'khodam <nama>',
    'cp', 'couple', 'gay',
    'jodoh', 'jodohku'
];
handler.group = true;
handler.limit = true;
export default handler;
