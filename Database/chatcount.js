//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import db from './sqlite.js';
const stmtIncrement = db.prepare(`
	INSERT INTO chat_count (jid, command, count, last_used) VALUES (?, ?, 1, ?)
	ON CONFLICT(jid, command) DO UPDATE SET count = count + 1, last_used = excluded.last_used
`);
const stmtGetForJid = db.prepare('SELECT command, count, last_used FROM chat_count WHERE jid = ? ORDER BY count DESC');
const stmtTopCommands = db.prepare(`
	SELECT command, SUM(count) AS total FROM chat_count GROUP BY command ORDER BY total DESC LIMIT ?
`);
const stmtTopUsers = db.prepare(`
	SELECT jid, SUM(count) AS total FROM chat_count GROUP BY jid ORDER BY total DESC LIMIT ?
`);
export function increment(jid, command) {
    stmtIncrement.run(jid, command, Date.now());
}
export function getUsageByJid(jid) {
    return stmtGetForJid.all(jid);
}
export function getTopCommands(limit = 10) {
    return stmtTopCommands.all(limit);
}
export function getTopUsers(limit = 10) {
    return stmtTopUsers.all(limit);
}
export function clearAll() {
    db.prepare('DELETE FROM chat_count').run();
}
export default { increment, getUsageByJid, getTopCommands, getTopUsers, clearAll };
