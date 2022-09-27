# Advanced NFT contract based on ERC-721Psi built on Hardhat framework, and Give away admin panel using React / Next

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

Currently it purposes issuing ERC-721Psi based NFT bulk minting and Give-away contract based Multisig over the ethereum network for further benefits on PlayEstate Rooster Wars NFT ecosystem.

The project comes with sample contracts, a few tests for that contract, some deploy scripts that deploys all contracts, and a frontend admin panel for nft give away. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat accounts
npx hardhat clean
npx hardhat compile
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploys/1_nft_deploy.ts --network rinkeby | ethmainnet
npx hardhat run scripts/deploys/2_giveaway_deploy.ts --network rinkeby | ethmainnet
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
