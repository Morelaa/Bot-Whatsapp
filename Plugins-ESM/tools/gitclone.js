'use strict';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_SIZE = 300 * 1024 * 1024;
function parseRepoInput(raw) {
    if (!raw) return null;
    let str = raw.trim().replace(/\.git$/i, '');
    if (/^[\w.-]+\/[\w.-]+$/.test(str)) {
        const [owner, repo] = str.split('/');
        return { owner, repo, branch: null };
    }
    try {
        const url = new URL(str);
        if (!/github\.com$/i.test(url.hostname)) return null;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        const [owner, repo] = parts;
        let branch = null;
        if (parts[2] === 'tree' && parts[3]) {
            branch = parts.slice(3).join('/');
        }
        return { owner, repo: repo.replace(/\.git$/i, ''), branch };
    } catch {
        return null;
    }
}
async function getDefaultBranch(owner, repo) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' },
    });
    if (res.status === 404) throw new Error('Repo tidak ditemukan (private/salah nama?)');
    if (!res.ok) throw new Error(`GitHub API error (HTTP ${res.status})`);
    const j = await res.json();
    return j.default_branch || 'main';
}
async function downloadZip(owner, repo, branch) {
    const url = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`Gagal download zip (HTTP ${res.status}). Cek nama branch-nya.`);
    const lenHeader = res.headers.get('content-length');
    if (lenHeader && Number(lenHeader) > MAX_SIZE) {
        throw new Error(`Repo terlalu besar (${(Number(lenHeader) / 1024 / 1024).toFixed(1)}MB). Batas ${MAX_SIZE / 1024 / 1024}MB.`);
    }
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > MAX_SIZE) {
        throw new Error(`Repo terlalu besar (${(buf.length / 1024 / 1024).toFixed(1)}MB). Batas ${MAX_SIZE / 1024 / 1024}MB.`);
    }
    return buf;
}
const handler = async (m, { conn, args }) => {
    const input = args[0];
    if (!input) {
        return m.reply(
            `╭┈┈⬡「 *ɢɪᴛᴄʟᴏɴᴇ* 」\n┃\n┃ ✧ .ɢɪᴛᴄʟᴏɴᴇ <ᴏᴡɴᴇʀ/ʀᴇᴘᴏ ᴀᴛᴀᴜ ᴜʀʟ> [ʙʀᴀɴᴄʜ]\n┃\n┃ ✧ ᴄᴏɴᴛᴏʜ:\n┃ ✧ .ɢɪᴛᴄʟᴏɴᴇ ꜰᴀᴄᴇʙᴏᴏᴋ/ʀᴇᴀᴄᴛ\n┃ ✧ .ɢɪᴛᴄʟᴏɴᴇ ʜᴛᴛᴘꜱ://ɢɪᴛʜᴜʙ.ᴄᴏᴍ/ꜰᴀᴄᴇʙᴏᴏᴋ/ʀᴇᴀᴄᴛ\n┃ ✧ .ɢɪᴛᴄʟᴏɴᴇ ꜰᴀᴄᴇʙᴏᴏᴋ/ʀᴇᴀᴄᴛ ᴍᴀɪɴ\n┃\n╰┈┈┈┈┈┈┈┈⬡`
        );
    }
    const parsed = parseRepoInput(input);
    if (!parsed) {
        return m.reply(`╭┈┈⬡「 *ɪɴꜰᴏ* 」\n┃ ✧ ꜰᴏʀᴍᴀᴛ ʀᴇᴘᴏ ɴɢɢᴀᴋ ᴅɪᴋᴇɴᴀʟɪ. ᴄᴏɴᴛᴏʜ: *.ɢɪᴛᴄʟᴏɴᴇ ᴏᴡɴᴇʀ/ʀᴇᴘᴏ*\n╰┈┈┈┈┈┈┈┈⬡`);
    }
    const branchArg = args[1] || parsed.branch;
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        const branch = branchArg || (await getDefaultBranch(parsed.owner, parsed.repo));
        const buf = await downloadZip(parsed.owner, parsed.repo, branch);
        await conn.sendMessage(
            m.chat,
            {
                document: buf,
                fileName: `${parsed.repo}-${branch}.zip`,
                mimetype: 'application/zip',
                caption: `📦 *${parsed.owner}/${parsed.repo}* (${branch})\nUkuran: ${(buf.length / 1024 / 1024).toFixed(2)} MB`,
            },
            { quoted: m }
        );
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭┈┈⬡「 *ɢᴀɢᴀʟ ᴄʟᴏɴᴇ ʀᴇᴘᴏ:* 」\n┃ ✧ ${e.message}\n╰┈┈┈┈┈┈┈┈⬡`);
    }
};
handler.help = ['gitclone <owner/repo|url> [branch]'];
handler.tags = ['tools'];
handler.command = /^gitclone$/i;
handler.limit = true;
export default handler;