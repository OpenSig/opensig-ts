import { EncryptionKey } from "./crypto";
import { SignatureData } from "./types";
export declare function encodeData(encryptionKey: EncryptionKey, data?: SignatureData): Promise<string>;
export declare function decodeData(encryptionKey: EncryptionKey, encData: string): Promise<SignatureData>;
