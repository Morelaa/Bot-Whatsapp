'use strict';
import * as kv from '../Database/kvstore.js';
import config from '../config.js';
const KEY = 'replystyle:current';
const VALID = ['v1', 'v2'];
export function getReplyStyle() {
    const val = kv.get(KEY);
    return VALID.includes(val) ? val : config.defaultReplyStyle;
}
export function setReplyStyle(style) {
    if (!VALID.includes(style))
        throw new Error(`Reply style tidak valid: ${style}. Pakai salah satu dari ${VALID.join(', ')}.`);
    kv.set(KEY, style);
    return getReplyStyle();
}
export default { getReplyStyle, setReplyStyle };
