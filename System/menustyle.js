'use strict';
import * as kv from '../Database/kvstore.js';
const KEY = 'menustyle:current';
const VALID = ['v1', 'v2'];
const DEFAULT = 'v1';
export function getMenuStyle() {
    const val = kv.get(KEY);
    return VALID.includes(val) ? val : DEFAULT;
}
export function setMenuStyle(style) {
    if (!VALID.includes(style))
        throw new Error(`Menu style tidak valid: ${style}. Pakai salah satu dari ${VALID.join(', ')}.`);
    kv.set(KEY, style);
    return getMenuStyle();
}
export default { getMenuStyle, setMenuStyle };
