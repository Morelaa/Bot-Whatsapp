//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { Button } from '../../Library/MessageBuilder.js';
import config from '../../config.js';
const handler = async (m, { conn }) => {
    const btn = new Button(conn).addButton('payment_key_info', {
        currency: 'IDR',
        total_amount: { value: 0, offset: 100 },
        reference_id: `DONASI${Date.now()}`,
        type: 'physical-goods',
        order: {
            status: 'pending',
            subtotal: { value: 0, offset: 100 },
            order_type: 'ORDER',
            items: [
                {
                    name: 'Donasi',
                    amount: { value: 0, offset: 100 },
                    quantity: 0,
                    sale_amount: { value: 0, offset: 100 },
                },
            ],
        },
        payment_settings: [
            {
                type: 'payment_key',
                payment_key: {
                    type: 'IDPAYMENTACCOUNT',
                    key: config.donation.number,
                    name: config.donation.method,
                    institution_name: config.donation.method,
                    full_name_on_account: config.donation.accountName,
                },
            },
        ],
        share_payment_status: false,
        is_soft_deleted: false,
        referral: 'quick_reply',
    });
    const msg = await btn.build(m.chat);
    await conn.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [
            {
                tag: 'biz',
                attrs: {},
                content: [
                    {
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{ tag: 'native_flow', attrs: { name: 'payment_key_info' } }],
                    },
                ],
            },
        ],
    });
};
handler.command = /^donasi$/i;
handler.tags = ['info'];
handler.help = ['donasi — kirim info donasi'];
export default handler;
