'use strict';
import db from './sqlite.js';
import config from '../config.js';
import { DateTime } from 'luxon';
const stmtGet = db.prepare('SELECT used FROM usage_limit WHERE jid = ? AND date = ?');
const stmtIncrementBy = db.prepare(`
	INSERT INTO usage_limit (jid, date, used) VALUES (?, ?, ?)
	ON CONFLICT(jid, date) DO UPDATE SET used = used + ?
`);
const stmtGetAllToday = db.prepare('SELECT jid, used FROM usage_limit WHERE date = ?');
const stmtDeleteByJid = db.prepare('DELETE FROM usage_limit WHERE jid = ?');
const stmtDeleteAll = db.prepare('DELETE FROM usage_limit');
function today() {
    // Pakai tanggal lokal Asia/Jakarta (WIB) biar limit harian reset persis
    // jam 00:00 WIB, bukan jam 00:00 UTC (yang jatuhnya jam 07:00 WIB).
    return DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-MM-dd');
}
export function getUsedToday(jid) {
    return stmtGet.get(jid, today())?.used || 0;
}
export function incrementUsage(jid, cost = 1) {
    stmtIncrementBy.run(jid, today(), cost, cost);
}
export function checkAndConsume(jid, { isPremium = false, limit = config.defaultUsageLimit, cost = 1 } = {}) {
    if (isPremium)
        return { allowed: true, used: 0, limit: Infinity };
    const used = getUsedToday(jid);
    if (used + cost > limit)
        return { allowed: false, used, limit };
    incrementUsage(jid, cost);
    return { allowed: true, used: used + cost, limit };
}
export function getAllUsageToday() {
    return stmtGetAllToday.all(today());
}
export function resetUsage(jid) {
    const res = stmtDeleteByJid.run(jid);
    return res.changes > 0;
}
export function resetAllUsage() {
    const res = stmtDeleteAll.run();
    return res.changes;
}
export default { getUsedToday, incrementUsage, checkAndConsume, getAllUsageToday, resetUsage, resetAllUsage };
