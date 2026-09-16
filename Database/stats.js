//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import db from './sqlite.js';
const stmtGet = db.prepare('SELECT value FROM stats WHERE metric = ?');
const stmtUpsert = db.prepare(`
	INSERT INTO stats (metric, value) VALUES (?, ?)
	ON CONFLICT(metric) DO UPDATE SET value = excluded.value
`);
export function get(metric) {
    return stmtGet.get(metric)?.value || 0;
}
export function increment(metric, by = 1) {
    const current = get(metric);
    stmtUpsert.run(metric, current + by);
    return current + by;
}
export function set(metric, value) {
    stmtUpsert.run(metric, value);
}
export function getAll() {
    return db.prepare('SELECT * FROM stats').all();
}
export function resetAll() {
    db.exec('DELETE FROM stats');
}
export function ensureFirstStart() {
    const existing = get('first_started_at');
    if (existing)
        return existing;
    let seed = Date.now();
    try {
        const row = db.prepare('SELECT MIN(created_at) AS m FROM users').get();
        if (row?.m)
            seed = Math.min(seed, row.m);
    }
    catch { }
    set('first_started_at', seed);
    return seed;
}
export default { get, increment, set, getAll, resetAll, ensureFirstStart };
