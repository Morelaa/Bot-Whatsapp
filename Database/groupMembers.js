'use strict';
import db from './sqlite.js';
const stmtUpsert = db.prepare(`
	INSERT INTO group_members (group_jid, member_jid, name, role, status, joined_at, left_at, updated_at)
	VALUES (@group_jid, @member_jid, @name, @role, @status, @joined_at, @left_at, @updated_at)
	ON CONFLICT(group_jid, member_jid) DO UPDATE SET
		name = COALESCE(excluded.name, name),
		role = excluded.role,
		status = excluded.status,
		joined_at = COALESCE(excluded.joined_at, joined_at),
		left_at = excluded.left_at,
		updated_at = excluded.updated_at
`);
const stmtGet = db.prepare('SELECT * FROM group_members WHERE group_jid = ? AND member_jid = ?');
const stmtListByGroup = db.prepare('SELECT * FROM group_members WHERE group_jid = ?');
const stmtListActiveByGroup = db.prepare("SELECT * FROM group_members WHERE group_jid = ? AND status = 'active'");
function rowToObj(row) {
    if (!row)
        return null;
    return {
        groupJid: row.group_jid,
        memberJid: row.member_jid,
        name: row.name,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at,
        leftAt: row.left_at,
        updatedAt: row.updated_at,
    };
}
export function getMember(groupJid, memberJid) {
    return rowToObj(stmtGet.get(groupJid, memberJid));
}
export function listGroupMembers(groupJid) {
    return stmtListByGroup.all(groupJid).map(rowToObj);
}
export function listActiveGroupMembers(groupJid) {
    return stmtListActiveByGroup.all(groupJid).map(rowToObj);
}
export function recordMemberJoin(groupJid, memberJid, name = null) {
    const now = Date.now();
    stmtUpsert.run({
        group_jid: groupJid,
        member_jid: memberJid,
        name,
        role: 'member',
        status: 'active',
        joined_at: now,
        left_at: null,
        updated_at: now,
    });
}
export function recordMemberLeave(groupJid, memberJid) {
    const existing = getMember(groupJid, memberJid);
    const now = Date.now();
    stmtUpsert.run({
        group_jid: groupJid,
        member_jid: memberJid,
        name: existing?.name ?? null,
        role: existing?.role ?? 'member',
        status: 'left',
        joined_at: existing?.joinedAt ?? null,
        left_at: now,
        updated_at: now,
    });
}
export function recordMemberPromote(groupJid, memberJid) {
    const existing = getMember(groupJid, memberJid);
    const now = Date.now();
    stmtUpsert.run({
        group_jid: groupJid,
        member_jid: memberJid,
        name: existing?.name ?? null,
        role: 'admin',
        status: existing?.status ?? 'active',
        joined_at: existing?.joinedAt ?? null,
        left_at: existing?.leftAt ?? null,
        updated_at: now,
    });
}
export function recordMemberDemote(groupJid, memberJid) {
    const existing = getMember(groupJid, memberJid);
    const now = Date.now();
    stmtUpsert.run({
        group_jid: groupJid,
        member_jid: memberJid,
        name: existing?.name ?? null,
        role: 'member',
        status: existing?.status ?? 'active',
        joined_at: existing?.joinedAt ?? null,
        left_at: existing?.leftAt ?? null,
        updated_at: now,
    });
}
export default {
    getMember,
    listGroupMembers,
    listActiveGroupMembers,
    recordMemberJoin,
    recordMemberLeave,
    recordMemberPromote,
    recordMemberDemote,
};
