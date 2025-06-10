import { SIG_DATA_ENCRYPTED_FLAG, SIG_DATA_TYPE_BYTES, SIG_DATA_TYPE_STRING, SIG_DATA_VERSION } from "./constants";
import { EncryptionKey } from "./crypto";
import { SignatureData } from "./types";
import { bytesToHex, hexToBytes, isHexString, unicodeHexToStr, unicodeStrToHex } from "./utils";


//
// Signature Data encoders - encode and decode signature data in accordance with OpenSig standard v0.1
//

export async function encodeData(encryptionKey: EncryptionKey, data?: SignatureData): Promise<string> {
  if (!data || data.type === 'none' || data.content === '' || data.content === '0x') return '0x';
  if (data.encrypted && typeof data.encrypted !== 'boolean') throw new TypeError("TypeError: invalid data encrypted flag");

  let typeField = data.encrypted ? SIG_DATA_ENCRYPTED_FLAG : 0;
  let encData = '';

  switch (data.type) {
    case 'string':
      if (typeof data.content !== 'string' || data.content.length === 0) throw new Error("invalid data content");
      typeField += SIG_DATA_TYPE_STRING;
      encData = unicodeStrToHex(data.content);
      break;

    case 'binary':
      if (typeof data.content !== 'string' || !isHexString(data.content)) throw new Error("invalid data content");
      typeField += SIG_DATA_TYPE_BYTES;
      encData = data.content.slice(0,2) === '0x' ? data.content.slice(2) : data.content;
      break;

    default:
      throw new Error("invalid data type '"+data.type+"'");
  }

  const typeStr = ('00' + typeField.toString(16)).slice(-2);
  const prefix = '0x'+SIG_DATA_VERSION + typeStr;

  if (data.encrypted) {
    const encDataBytes = await encryptionKey.encrypt(hexToBytes(encData));
    encData = bytesToHex(encDataBytes, false);
  }
  
  return prefix + encData;
}


export async function decodeData(encryptionKey: EncryptionKey, encData: string): Promise<SignatureData> {
  if (!encData || encData === '' || encData === '0x') return {type: 'none'};
  if (encData.slice(0,2) !== '0x') return {type: "invalid", content: "corrupt hex data"};
  if (encData.length < 6) return {type: "invalid", content: "data is < 6 bytes"}

  const version = encData.slice(2,4);
  if (version !== SIG_DATA_VERSION) return {type: "invalid", content: "unsupported data version: "+version};
  const typeField = parseInt(encData.slice(4,6), 16);
  const encrypted = typeField & SIG_DATA_ENCRYPTED_FLAG ? true : false;
  const type = typeField & ~SIG_DATA_ENCRYPTED_FLAG;
  const data: SignatureData = {
    type: 'none',
    encrypted: encrypted
  }
  
  let sigData = encData.slice(6);
  if (encrypted && sigData.length > 0) {
    try {
      sigData = bytesToHex(await encryptionKey.decrypt(hexToBytes(sigData)), false);
    }
    catch(error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {type: "invalid", content: "failed to decrypt data", encrypted: true, error: msg};
    }
  }

  switch (type) {
    case SIG_DATA_TYPE_STRING:
      data.type = 'string';
      data.content = unicodeHexToStr(sigData);
      break;
    
    case SIG_DATA_TYPE_BYTES:
      data.type = 'binary';
      data.content = '0x'+sigData
      break;

    default:
      data.type = 'invalid';
      data.content = "unsupported data type: "+type+" (version="+version+")";
  }

  return data;
}
