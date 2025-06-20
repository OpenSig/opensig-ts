class LocalTypeError extends TypeError {
    constructor(method, value) {
        const message = `TypeError: OpenSig ${method} function: expected Uint8Array, received ${typeof value}`;
        super(message);
    }
}
export function assertUint8Array(value, method) {
    if (!(value instanceof Uint8Array))
        throw new LocalTypeError(method, value);
}
