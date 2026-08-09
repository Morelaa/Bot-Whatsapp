'use strict';
import db from './sqlite.js';
const stmtGetPhoneByLid = db.prepare('SELECT phone FROM lid_map WHERE lid = ?');
const stmtGetLidByPhone = db.prepare('SELECT lid FROM lid_map WHERE phone = ?');
const stmtUpsertLidMap = db.prepare(`
	INSERT INTO lid_map (lid, phone) VALUES (?, ?)
	ON CONFLICT(lid) DO UPDATE SET phone = excluded.phone
`);
export function getPhoneByLid(lid) {
    return stmtGetPhoneByLid.get(lid)?.phone || null;
}
export function getLidByPhone(phone) {
    return stmtGetLidByPhone.get(phone)?.lid || null;
}
export function setLidMapping(lid, phone) {
    stmtUpsertLidMap.run(lid, phone);
}
const stmtGetUser = db.prepare('SELECT * FROM users WHERE jid = ?');
const stmtUpsertUser = db.prepare(`
	INSERT INTO users (jid, lid, push_name, phone, name, age, premium, banned, registered_at)
	VALUES (@jid, @lid, @push_name, @phone, @name, @age, @premium, @banned, @registered_at)
	ON CONFLICT(jid) DO UPDATE SET
		lid = COALESCE(excluded.lid, lid),
		push_name = COALESCE(excluded.push_name, push_name),
		phone = COALESCE(excluded.phone, phone),
		name = COALESCE(excluded.name, name),
		age = COALESCE(excluded.age, age),
		premium = COALESCE(excluded.premium, premium),
		banned = COALESCE(excluded.banned, banned),
		registered_at = COALESCE(excluded.registered_at, registered_at)
`);
const stmtSetPushName = db.prepare(`
	INSERT INTO users (jid, push_name) VALUES (?, ?)
	ON CONFLICT(jid) DO UPDATE SET push_name = excluded.push_name
`);
export function getUser(jid) {
    return stmtGetUser.get(jid) || null;
}
export function upsertUser(jid, data = {}) {
    stmtUpsertUser.run({
        jid,
        lid: data.lid ?? null,
        push_name: data.pushName ?? null,
        phone: data.phone ?? null,
        name: data.name ?? null,
        age: data.age ?? null,
        premium: data.premium ? 1 : 0,
        banned: data.banned ? 1 : 0,
        registered_at: data.registeredAt ?? null,
    });
}
export function setPushName(jidOrNum, pushName) {
    if (!pushName)
        return;
    stmtSetPushName.run(jidOrNum, pushName);
}
export function getPushName(jidOrNum) {
    if (!jidOrNum)
        return null;
    return stmtGetUser.get(jidOrNum)?.push_name || null;
}
export function isRegistered(jid) {
    const user = getUser(jid);
    return !!user?.name;
}
export function registerUser(jid, name, age) {
    upsertUser(jid, { name, age, registeredAt: Date.now() });
    return true;
}
const stmtUpdateUser = db.prepare(`
	UPDATE users SET
		name = COALESCE(@name, name),
		age = COALESCE(@age, age),
		phone = COALESCE(@phone, phone),
		sn_code = COALESCE(@sn_code, sn_code),
		registered_at = COALESCE(@registered_at, registered_at)
	WHERE jid = @jid
`);
export function updateUser(jid, patch = {}) {
    stmtUpdateUser.run({
        jid,
        name: patch.name ?? null,
        age: patch.age ?? null,
        phone: patch.phone ?? null,
        sn_code: patch.sn_code ?? null,
        registered_at: patch.registered_at ?? null,
    });
    return getUser(jid);
}
const stmtUnregisterUser = db.prepare(`
	UPDATE users SET name = NULL, age = NULL, sn_code = NULL, registered_at = NULL
	WHERE jid = ?
`);
export function unregisterUser(jid) {
    const res = stmtUnregisterUser.run(jid);
    return res.changes > 0;
}
const stmtGetUsers = db.prepare(`SELECT * FROM users WHERE name IS NOT NULL`);
export function getUsers() {
    const rows = stmtGetUsers.all();
    const out = {};
    for (const row of rows)
        out[row.jid] = row;
    return out;
}
export function countUsers() {
    return stmtGetUsers.all().length;
}
export function setPremium(jid, premium = true) {
    upsertUser(jid, { premium });
}
export function setBanned(jid, banned = true) {
    upsertUser(jid, { banned });
}
const stmtGetGroup = db.prepare('SELECT * FROM groups WHERE jid = ?');
const stmtUpsertGroup = db.prepare(`
	INSERT INTO groups (jid, name, settings) VALUES (@jid, @name, @settings)
	ON CONFLICT(jid) DO UPDATE SET
		name = COALESCE(excluded.name, name),
		settings = excluded.settings
`);
export function getGroup(jid) {
    const row = stmtGetGroup.get(jid);
    if (!row)
        return null;
    return { ...row, settings: JSON.parse(row.settings || '{}') };
}
export function upsertGroupSettings(jid, name, settingsPatch = {}) {
    const existing = getGroup(jid);
    const merged = { ...(existing?.settings || {}), ...settingsPatch };
    stmtUpsertGroup.run({ jid, name: name ?? null, settings: JSON.stringify(merged) });
    return merged;
}
const stmtGetAllGroups = db.prepare('SELECT * FROM groups');
export function getAllGroups() {
    const rows = stmtGetAllGroups.all();
    const out = {};
    for (const row of rows) {
        out[row.jid] = { ...row, settings: JSON.parse(row.settings || '{}') };
    }
    return out;
}
export function updateGroup(jid, patch = {}) {
    return upsertGroupSettings(jid, null, patch);
}
export function isBotInGroup(jid) {
    const g = getGroup(jid);
    if (!g)
        return null;
    return g.settings?.botInGroup !== false;
}
export function isBotAdminInGroup(jid) {
    const g = getGroup(jid);
    return !!g?.settings?.isBotAdmin;
}
const stmtDeleteGroup = db.prepare('DELETE FROM groups WHERE jid = ?');
export function deleteGroup(jid) {
    stmtDeleteGroup.run(jid);
}
const stmtGetAllUsersRaw = db.prepare('SELECT * FROM users');
export function getAllUsersRaw() {
    const rows = stmtGetAllUsersRaw.all();
    const out = {};
    for (const row of rows)
        out[row.jid] = row;
    return out;
}
export default {
    getPhoneByLid,
    getLidByPhone,
    setLidMapping,
    getUser,
    upsertUser,
    setPushName,
    getPushName,
    isRegistered,
    registerUser,
    updateUser,
    unregisterUser,
    getUsers,
    countUsers,
    setPremium,
    setBanned,
    getGroup,
    upsertGroupSettings,
    getAllGroups,
    updateGroup,
    isBotInGroup,
    isBotAdminInGroup,
    deleteGroup,
    getAllUsersRaw,
};
