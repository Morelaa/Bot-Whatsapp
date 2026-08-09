'use strict';
import * as kv from '../Database/kvstore.js';
import config from '../config.js';
import { normNum } from '../Library/resolve.js';
const KEY = 'owners:extra';
function readExtra() {
    const stored = kv.get(KEY, []);
    return Array.isArray(stored) ? stored : [];
}
function writeExtra(list) {
    kv.set(KEY, list);
}

export function getExtraOwners() {
    return readExtra();
}
export function getAllOwners() {
    const fromConfig = Array.isArray(config.owners) ? config.owners.map(normNum) : [];
    const fromKv = readExtra();
    return [...new Set([...fromConfig, ...fromKv])];
}
export function addOwner(num) {
    const clean = normNum(num);
    if (!clean) return false;
    const list = readExtra();
    if (list.includes(clean)) return false;
    list.push(clean);
    writeExtra(list);
    return true;
}
export function removeOwner(num) {
    const clean = normNum(num);
    if (!clean) return false;
    const list = readExtra();
    const idx = list.indexOf(clean);
    if (idx === -1) return false;
    list.splice(idx, 1);
    writeExtra(list);
    return true;
}
export default { getExtraOwners, getAllOwners, addOwner, removeOwner };
