//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
//    </>  𝐂𝐫𝐞𝐝𝐢𝐭𝐬  </>      //
//   𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐀𝐥𝐩𝐮𝐭𝐫𝐚𝐚       //
//   𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @𝐬𝐢𝐚𝐩𝐚𝐚𝐤𝐮𝟖𝟕𝟖     //
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import * as kv from '../Database/kvstore.js';
import config from '../config.js';
const KEY = 'replystyle:current';
const VALID = ['v1', 'v2', 'v3', 'v4', 'v5'];
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
