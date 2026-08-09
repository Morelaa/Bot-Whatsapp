'use strict';
import util from 'util';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkMainOwner } from '../Core/permissions.js';
import { logError } from '../Core/logutil.js';
const execPromise = promisify(exec);
const RESTART_CMD_RE = /\b(pm2\s+(restart|stop|reload|kill)|systemctl\s+restart|kill\s+-9\s+\$\$|reboot)\b/i;
const INVISIBLE_CHARS_RE = /[\u200e\u200f\u200b\u200d\u2028\u2029\ufeff\u00a0]/g;
const MAX_OUTPUT = 3500;
function cleanCode(raw) {
    return raw.replace(INVISIBLE_CHARS_RE, ' ').trim();
}
function truncate(str) {
    return str.length > MAX_OUTPUT ? str.slice(0, MAX_OUTPUT) + '\n\n…(terpotong)' : str;
}
async function runEval(code, m, sock) {
    const conn = sock; void conn;
    try {
        return await eval(`(async () => { return ${code} })()`);
    }
    catch (e1) {
        if (e1 instanceof SyntaxError) {
            return await eval(`(async () => { ${code} })()`);
        }
        throw e1;
    }
}
export async function handleSuperOwnerShortcut(m, participants, sock) {
    const body = (typeof m?.text === 'string' ? m.text : m?.body || '').trim();
    if (!body)
        return false;
    if (!body.startsWith('>') && !body.startsWith('$') && !body.startsWith('=>'))
        return false;
    if (!checkMainOwner(m, participants))
        return false;
    if (body.startsWith('=>')) {
        const code = cleanCode(body.slice(2));
        if (!code)
            return false;
        try {
            const result = await runEval(code, m, sock);
            let out = result === undefined ? ' Done (no return value)' : util.format(result);
            await m.reply(truncate(out));
        }
        catch (err) {
            await m.reply(` Error:\n${err?.message || err}`);
        }
        return true;
    }
    if (body.startsWith('>')) {
        const code = cleanCode(body.slice(1));
        if (!code)
            return false;
        try {
            const evaled = await runEval(code, m, sock);
            let out;
            if (evaled === undefined)
                out = ' Done (no return value)';
            else if (typeof evaled === 'string')
                out = evaled;
            else
                out = util.inspect(evaled, { depth: 4, colors: false });
            await m.reply(truncate(out));
        }
        catch (err) {
            await m.reply(` Error:\n${err?.message || err}`);
        }
        return true;
    }
    if (body.startsWith('$')) {
        const shellCmd = body.slice(1).trim();
        if (!shellCmd)
            return false;
        const isRestartCmd = RESTART_CMD_RE.test(shellCmd);
        if (isRestartCmd) {
            try {
                await m.reply(` Menjalankan: \`${shellCmd}\`\n\n_Bot akan restart dalam beberapa detik..._`);
            }
            catch { }
            await new Promise((r) => setTimeout(r, 2500));
            logError(`[SHELL] $ ${shellCmd} (restart command)`);
            execPromise(shellCmd).catch(() => { });
            return true;
        }
        try {
            const { stdout, stderr } = await execPromise(shellCmd);
            const out = stdout?.trim();
            const err = stderr?.trim();
            if (err) {
                await m.reply(` *stderr:*\n\`\`\`\n${truncate(err)}\n\`\`\``);
            }
            else if (out) {
                await m.reply(` *stdout:*\n\`\`\`\n${truncate(out)}\n\`\`\``);
            }
            else {
                await m.reply(' Command executed (no output)');
            }
        }
        catch (error) {
            await m.reply(` *Error:*\n\`\`\`\n${truncate(error?.message || String(error))}\n\`\`\``);
        }
        return true;
    }
    return false;
}
export default { handleSuperOwnerShortcut };
