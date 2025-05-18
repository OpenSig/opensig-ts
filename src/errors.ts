

class LocalTypeError extends TypeError {
  constructor(method: string, value: any) {
    const message = `TypeError: OpenSig ${method} function: expected Uint8Array, received ${typeof value}`;
    super(message);
  }
}

export function assertUint8Array(value: any, method: string): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) throw new LocalTypeError(method, value);
}
