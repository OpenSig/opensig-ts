"use strict";
// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHexString = isHexString;
exports.bytesToHex = bytesToHex;
exports.hexToBytes = hexToBytes;
exports.concat = concat;
exports.unicodeStrToHex = unicodeStrToHex;
exports.unicodeHexToStr = unicodeHexToStr;
exports.isBlob = isBlob;
//
// General utility functions
//
const HEX_REGEX = /^(0x)?[0-9a-fA-F]+$/;
function isHexString(str) {
    return typeof str === 'string' && HEX_REGEX.test(str);
}
function bytesToHex(arr, prefix0x = true) {
    if (!(arr instanceof Uint8Array))
        throw new TypeError('TypeError: bytesToHex - expected Uint8Array');
    return (prefix0x ? '0x' : '') +
        Array.from(arr).map(x => x.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
    if (!isHexString(hex))
        throw new TypeError('TypeError: hexToBytes - expected hex string');
    if (hex.length % 2 !== 0)
        throw new TypeError('TypeError: hexToBytes - hex string must have even length');
    const matches = hex.replace('0x', '').match(/.{1,2}/g);
    if (!matches)
        return new Uint8Array();
    return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
}
function concat(buffers) {
    if (!Array.isArray(buffers) || buffers.length === 0) {
        throw new TypeError('TypeError: concat - expected non-empty array of Uint8Arrays');
    }
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const temp = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
        temp.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }
    return temp;
}
function unicodeStrToHex(str) {
    var result = "";
    for (let i = 0; i < str.length; i++) {
        const hex = str.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }
    return result;
}
function unicodeHexToStr(str) {
    var hexChars = str.replace('0x', '').match(/.{1,4}/g) || [];
    var result = "";
    for (let j = 0; j < hexChars.length; j++) {
        result += String.fromCharCode(parseInt(hexChars[j], 16));
    }
    return result;
}
/**
 * Checks if the given object implements the Blob interface.
 * @param obj The object to test.
 * @returns True if the object is a Blob, false otherwise.
 */
function isBlob(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.arrayBuffer === 'function' &&
        typeof obj.slice === 'function' &&
        typeof obj.type === 'string' &&
        typeof obj.size === 'number');
}
