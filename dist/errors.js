"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUint8Array = assertUint8Array;
class LocalTypeError extends TypeError {
    constructor(method, value) {
        const message = `TypeError: OpenSig ${method} function: expected Uint8Array, received ${typeof value}`;
        super(message);
    }
}
function assertUint8Array(value, method) {
    if (!(value instanceof Uint8Array))
        throw new LocalTypeError(method, value);
}
