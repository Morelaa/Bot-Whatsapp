'use strict';
import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();
export function runUnbranded(fn) {
    return als.run({ unbranded: true }, fn);
}
export function isUnbranded() {
    return !!als.getStore()?.unbranded;
}
export default { runUnbranded, isUnbranded };
