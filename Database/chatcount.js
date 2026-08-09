'use strict';
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
export default { increment, getUsageByJid, getTopCommands, getTopUsers };
