# opensig-ts

Javascript e-signature library for digitally signing and verifying files on EVM-based blockchains using the [OpenSig standard](https://github.com/opensig/opensig-protocol).  See also https://opensig.net/about.  

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
import { OpenSig, BlockchainConfig, EthersProvider, SignatureData } from 'opensig-ts';
import { ethers } from 'ethers';

// Construct a blockchain provider (see Blockchain Providers section below)

const signer = ethers.Wallet.createRandom();

const rpcUrl = "https://polygon-rpc.com";

const providerConfig: BlockchainConfig = {
  chainId: 137,
  registryContract: {
    address: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
    creationBlock: 40031474,
  },
  blockTime: 2000,
  networkLatency: 5000
};

const provider = new EthersProvider(providerConfig, signer, rpcUrl);

// Construct an OpenSig instance that uses your provider

const opensig = new OpenSig(provider);

// Construct an OpenSig Document object from a File 
// (or construct one from a document hash)

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

## Blockchain Providers

OpenSig blockchain providers publish signature transactions to the blockchain and query the blockchain for signature events.

The bundled `EthersProvider` should be sufficient for most purposes, however you are free to implement your own.  See [src/providers.js](src/providers.js) for the `BlockchainProvider` interface.

### EthersProvider

An `EthersProvider` publishes and verifies signatures using `ethers-js` built in [Provider](https://docs.ethers.org/v6/api/providers/) instances. 

This allows OpenSig to be used with browser-installed wallets, RPC providers and community providers like Ankr and Infura (see [ethers community providers](https://docs.ethers.org/v6/api/providers/thirdparty/)).

The `EthersProvider` class takes a `provider` constructor parameter. The provider will be used for both publishing signatures and reading signature event logs. Alternatively, use the `transactionProvider` and `logProvider` parameters to set different providers for publishing to and reading from the blockchain.

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
