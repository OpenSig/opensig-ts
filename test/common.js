// Common functions and constants used in tests


//
// ------ Constants ------
//

// Sample OpenSig signature for testing retrieved from Ethereum signature transaction:
// https://etherscan.io/tx/0x31ab0029c6eea3085c4f71aae757f06822a12c3ac7848ddf2a67adeaeb0dd6dc
// 2nd signature of the public notice board (the empty file)
export const OPENSIG_SAMPLE_SIGNATURE = {
  chainId: 1,
  documentHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // SHA-256 hash of the empty file
  signature: "0xa4e8ded9c314e48967a335281e57b5b76599af5d12b160d5da074b18e5d23e65",
  data: {
    unencrypted: "Treasure Hunt! IPFS: Qme6ebV5xkqeSUW3MMc6WLjE6NFB8yiVGpLwuneV2H82sb",
    encrypted: "0x008055fb4811b96d5d759e1ba59f015c92f43655a07ae8c1ce75860406102d50a1189542ade41101f7d009f9a8dd703194d6247c49a6ebc1bc98ffb417036237b7084e4cf9bcf168dfc41e71dbbd960519a2c5253e3a77f5008c923efaffd280d04ae40cf6d76b6b0e4bedd730f1bc1faa5074aae0fb946d406d2c2102af27da5af29f0c8e5d8d5355519f40bf725a965f895518b982fe87a5633ae0c4c91497192bb652"
  }
}


//
// ------ Helper functions ------
//

export function getSubtleCrypto() {
  const _crypto = crypto || window.crypto || {};
  if (!_crypto.subtle) throw new Error("Missing crypto capability");
  return _crypto.subtle;
}

// Independent function to hash data using SHA-256. Used by the first version of opensig-js
export async function aesgcmEncrypt(keyBuffer, nonce, data) {
  const key = await getSubtleCrypto().importKey("raw", keyBuffer, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);
  const algorithm = { name: 'AES-GCM', iv: nonce, };
  const encryptedData = await getSubtleCrypto().encrypt(algorithm, key, data);
  return new Uint8Array([...nonce, ...new Uint8Array(encryptedData)]);
}

// Independent function to hash data using SHA-256. Used by the first version of opensig-js
export async function sha256(data) {
  const hash = await getSubtleCrypto().digest('SHA-256', data);
  return new Uint8Array(hash);
}

// Helper function to convert a string to a UTF-16 (big endian) hex string
export function encodeUTF16BE(str) {
  const buf = new Uint8Array(str.length * 2); // 2 bytes per char
  for (let i = 0; i < str.length; i++) {
    const codeUnit = str.charCodeAt(i); // UTF-16 code unit
    buf[i * 2] = (codeUnit >> 8) & 0xFF;     // High byte first (big endian)
    buf[i * 2 + 1] = codeUnit & 0xFF;        // Low byte second
  }
  return buf;
}

export function decodeUTF16BE(buf) {
  let str = '';
  for (let i = 0; i < buf.length; i += 2) {
    const codeUnit = (buf[i] << 8) | buf[i + 1]; // Combine high and low bytes
    str += String.fromCharCode(codeUnit);
  }
  return str;
}
