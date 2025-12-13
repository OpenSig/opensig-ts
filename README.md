# opensig-ts

Reference typescript e-signature library for digitally signing and verifying files on EVM-based blockchains using the [OpenSig standard](https://github.com/opensig/opensig-protocol).  See also https://opensig.net/webapp/about.  

Also supports public and private message notarisation to the blockchain.

## Usage

OpenSig notarises signatures on the blockchain via the [OpenSig Registry smart contract](https://github.com/OpenSig/opensig-protocol/blob/main/contracts/OpensigRegistry.sol). Registries are available on most major blockchains - see https://opensig.net/about#contracts for their addresses. To inform us of new public registries please contact [contribute@opensig.net](mailto:contribute@opensig.net).

### Node.js / React

#### Installation
```
npm install opensig-ts
```

#### Usage
```typescript
import { OpenSig, RegistryContract, EthersProvider, SignatureData } from 'opensig-ts';
import { ethers } from 'ethers';

const privateKey = ethers.randomBytes(32);
const chainId = 137;

const registryContract: RegistryContract = {
  address: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
  creationBlock: 40031474
};

// Construct an OpenSig blockchain provider (see Blockchain Providers section below)

const signer = new ethers.Wallet(
  privateKey, 
  new ethers.JsonRpcProvider("https://polygon-rpc.com")  // provider used for publishing signatures
);

const signatureProvider = new EthersProvider(
  chainId,
  registryContract, 
  signer, 
  new ethers.JsonRpcProvider("https://polygon-rpc.com")  // provider used for querying signatures
);

// Construct an OpenSig instance that uses your provider

const opensig = new OpenSig(signatureProvider);

// Construct an OpenSig Document object from a File (or from a document hash)

const myDoc = new opensig.createDocument(new File('./myfile.txt'));

// Verify signatures on the blockchain

const signatures = await myDoc.verify();

signatures.forEach(sig => console.log(sig.time, sig.signatory, sig.data));

// Sign a document. 
// NB: You must `verify()` a document at least once before signing. This brings the object's
// signature chain up to date with the blockchain. See https://opensig.net/about for 
// information about how and why OpenSig chains signatures.

const signData: SignatureData = {
  type: 'string',
  encrypted: true,
  content: 'some data'
};

const result = await myDoc.sign(signData);

console.log(result.txHash, result.signatory, result.signature);

const receipt = await result.confirmed;

console.log('signature published successfully', receipt);

```

## Signature Data

Signatures are published with an optional annotation. Annotations can be strings, objects or binary. By default annotations are encrypted using the document hash (`H_d`) as the encryption key. This ensures only those with the original document can decrypt the annotation.

Example annotations:

```typescript

const noData: SignatureData = { type: 'none' };

const unencryptedStringData: SignatureData = {
  type: 'string',
  encrypted: false,
  content: "Hello World!"
}

const encryptedBinaryData: SignatureData = {
  type: 'binary',
  encrypted: true,
  content: "0x010203040506" // binary in hex form
}

const encryptedObjectData: SignatureData = {
  type: 'object',
  encrypted: true,
  content: { foo: 'bar', baz: [1, 2, 3] }
}
```

Note:
- String data is unicode.
- Object data is packed with the [MessagePack](https://msgpack.org/) protocol.

## Blockchain Providers

OpenSig blockchain providers publish signature transactions to the blockchain and query the blockchain for signature events.

The bundled `EthersProvider` should be sufficient for most purposes, however you are free to implement your own.  See [src/providers](src/providers) for the `IBlockchainProvider` interface.

### EthersProvider

An `EthersProvider` publishes and verifies signatures using `ethers` built in [Provider](https://docs.ethers.org/v6/api/providers/) instances. 

This allows OpenSig to be used with browser-installed wallets, RPC providers and community providers like Ankr and Infura (see [ethers community providers](https://docs.ethers.org/v6/api/providers/thirdparty/)).

The `EthersProvider` class takes separate `signer` and `rpcProvider` constructor parameter. The signer must have a provider

### AbstractEVMProvider

Extend `AbstractEVMProvider` to verify signatures using an ethers provider and publish via a custom protocol.

## Testing

This project uses [Jest](https://jestjs.io/) for unit test.

```bash
npm test
```

## Contributing

Contributions are welcome. To submit a pull request:

1. Fork the repository

2. Create a new branch (git checkout -b feature/my-feature)

3. Make your changes and add tests if needed

4. Run the test suite with `npm test`

5. Submit a pull request

Please keep your changes focused and well-documented. Thanks for helping improve the project!

## Support

If you'd like to report a bug or suggest a feature then please open an issue in the Github repository.

For usage or any other support please contact [support@opensig.net](mailto:support@opensig.net).

## License

MIT License (including all dependencies)
