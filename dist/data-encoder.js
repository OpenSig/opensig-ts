"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeData = encodeData;
exports.decodeData = decodeData;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const msgpackr_1 = require("msgpackr");
//
// Signature Data encoders - encode and decode signature data in accordance with OpenSig standard v0.1
//
async function encodeData(encryptionKey, data) {
    if (!data || data.type === 'none' || data.content === '' || data.content === '0x')
        return '0x';
    if (data.encrypted && typeof data.encrypted !== 'boolean')
        throw new TypeError("TypeError: invalid data encrypted flag");
    let typeField = data.encrypted ? constants_1.SIG_DATA_ENCRYPTED_FLAG : 0;
    let encData = '';
    switch (data.type) {
        case 'string':
            if (typeof data.content !== 'string' || data.content.length === 0)
                throw new Error("invalid data content");
            typeField += constants_1.SIG_DATA_TYPE_STRING;
            encData = (0, utils_1.unicodeStrToHex)(data.content);
            break;
        case 'object':
            if (typeof data.content !== 'object')
                throw new Error("invalid data content");
            typeField += constants_1.SIG_DATA_TYPE_OBJECT;
            encData = (0, utils_1.bytesToHex)((0, msgpackr_1.pack)(data.content));
            break;
        case 'binary':
            if (typeof data.content !== 'string' || !(0, utils_1.isHexString)(data.content))
                throw new Error("invalid data content");
            typeField += constants_1.SIG_DATA_TYPE_BYTES;
            encData = data.content.slice(0, 2) === '0x' ? data.content.slice(2) : data.content;
            break;
        default:
            throw new Error("invalid data type '" + data.type + "'");
    }
    const typeStr = ('00' + typeField.toString(16)).slice(-2);
    const prefix = '0x' + constants_1.SIG_DATA_VERSION + typeStr;
    if (data.encrypted) {
        const encDataBytes = await encryptionKey.encrypt((0, utils_1.hexToBytes)(encData));
        encData = (0, utils_1.bytesToHex)(encDataBytes, false);
    }
    return prefix + encData;
}
async function decodeData(encryptionKey, encData) {
    if (!encData || encData === '' || encData === '0x')
        return { type: 'none' };
    if (encData.slice(0, 2) !== '0x')
        return { type: "invalid", content: "corrupt hex data" };
    if (encData.length < 6)
        return { type: "invalid", content: "data is < 6 bytes" };
    const versionStr = encData.slice(2, 4);
    const version = toIntVersion(versionStr);
    if (!isValidVersion(version))
        return { type: "invalid", content: "unsupported data version: " + versionStr };
    const typeField = parseInt(encData.slice(4, 6), 16);
    const encrypted = typeField & constants_1.SIG_DATA_ENCRYPTED_FLAG ? true : false;
    const type = typeField & ~constants_1.SIG_DATA_ENCRYPTED_FLAG;
    const data = {
        type: 'invalid',
        content: 'unsupported data type: ' + type + ' (version=' + versionStr + ')',
        encrypted: encrypted
    };
    let sigData = encData.slice(6);
    if (encrypted && sigData.length > 0) {
        try {
            sigData = (0, utils_1.bytesToHex)(await encryptionKey.decrypt((0, utils_1.hexToBytes)(sigData)), false);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return { type: "invalid", content: "failed to decrypt data", encrypted: true, error: msg };
        }
    }
    switch (type) {
        case constants_1.SIG_DATA_TYPE_STRING:
            data.type = 'string';
            data.content = (0, utils_1.unicodeHexToStr)(sigData);
            break;
        case constants_1.SIG_DATA_TYPE_OBJECT:
            if (version < 1)
                break;
            data.type = 'object';
            try {
                data.content = (0, msgpackr_1.unpack)((0, utils_1.hexToBytes)(sigData));
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { type: "invalid", content: "failed to parse object data", encrypted: encrypted, error: msg };
            }
            break;
        case constants_1.SIG_DATA_TYPE_BYTES:
            data.type = 'binary';
            data.content = '0x' + sigData;
            break;
    }
    return data;
}
const SIG_DATA_VERSION_INT = toIntVersion(constants_1.SIG_DATA_VERSION);
function isValidVersion(version) {
    return version >= 0 && version <= SIG_DATA_VERSION_INT;
}
function toIntVersion(version) {
    const vInt = parseInt(version, 16);
    if (isNaN(vInt))
        return -1;
    return vInt;
}
