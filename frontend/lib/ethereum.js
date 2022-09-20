import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import Giftdrop from './abis/contracts/drops/GiftContractV2.sol/GiftContractV2.json';
import MinionverseNFT from './abis/contracts/tokens/MinionverseNFT.sol/MinionverseNFT.json';
import RoosterwarsNFT from './abis/contracts/tokens/RoosterwarsNFT.sol/RoosterwarsNFT.json';

const networks = {
  '1' : {
    "name": "Ethereum Mainnet",
    "giftdrop": "0x9e6c8B2BA36C6D3bC6a7A053d6137Cf6dF9D6A4C",
    "mot": "0x5E972096a48C73bAb6b56DA3eb2D60cEDF48e21c",
    "rwt": "0xE7921C451C36b491Df65748b46013d58935b3B5c",

    "treasury" :  "0x21796bA19B1579F51d5177f56C656e8a2476E037",
    "admin" :  "0x21796bA19B1579F51d5177f56C656e8a2476E037",
    "signer" :  "0x3aC0e043AD218a854D7Fda76CEC09Cf932da56Ec",
  },

  '4': {
    "name": "Rinkeby Testnet",
    "giftdrop": "0xa19e782432417e22d5fd28B6437abc8903d5Ef93",
    "mot": "0x976806B2a61ce2C243cA12c5127A53d5f385d554",
    "rwt": "0x96D969955bBa8c166b61AF54e8Fb460B50C94018",

    "treasury" :  "0xF0d096D33559cDc5f527435b82073c108D6c3107",
    "admin" :  "0x09671368DdB64405d3F2E029E8c0DB9c80Ee7234",
    "signer" :  "0x05Be88DD6e26162184D897557a6e6d9652Efced4",
  },

  '80001': {
    "name": "Polygon Testnet",
    "giftdrop": "0xa64b85F52be9A78C04611B0E363DB53C1C9e030C",
    "mot": "0xbB70C9d0c25EdFAf6Bf03B738756140771d4096E",
    "rwt": "0xE55A593606C3c0b17bfC255D273dfAF3900F01b7",

    "treasury" :  "0xF0d096D33559cDc5f527435b82073c108D6c3107",
    "admin" :  "0x09671368DdB64405d3F2E029E8c0DB9c80Ee7234",
    "signer" :  "0x05Be88DD6e26162184D897557a6e6d9652Efced4",
  }
}

const getBlockchain = async () => {
  const provider = await detectEthereumProvider();
  if (provider) {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const networkId = await provider.request({ method: 'net_version' });

    if(networkId !== process.env.NEXT_PUBLIC_NETWORK_ID) {
      return (null, null, null, null);
    }
    const web3 = new Web3(provider);
    
    const giftdrop = new web3.eth.Contract(
      Giftdrop.abi,
      networks[networkId].giftdrop,
    );
    
    const minionverseContract = new web3.eth.Contract(
      MinionverseNFT.abi,
      networks[networkId].mot,
    );

    const roosterwarsContract = new web3.eth.Contract(
      RoosterwarsNFT.abi,
      networks[networkId].rwt,
    );

    const account = accounts[0];

    if(account.toLowerCase() == networks[networkId].treasury.toLowerCase()) { // treasure
      
      const isApprovedForAll1 = await minionverseContract.methods.isApprovedForAll(
        account, networks[networkId].giftdrop)
        .call();
      if(!isApprovedForAll1) {
        await minionverseContract.methods.setApprovalForAll(
          networks[networkId].giftdrop, true)
          .send({ from: account, gas: 400000 });
      }

      const isApprovedForAll2 = await roosterwarsContract.methods.isApprovedForAll(
        account, networks[networkId].giftdrop)
        .call();
      if(!isApprovedForAll2) {
        await roosterwarsContract.methods.setApprovalForAll(
          networks[networkId].giftdrop, true)
          .send({ from: account, gas: 400000 });
      } 
    } else { // admin or signer

    }
    return ({giftdrop, minionverseContract, roosterwarsContract, accounts});
  }
}
    
const getTreasury = async () => {
  const provider = await detectEthereumProvider();
  if(provider) {
    const networkId = await provider.request({ method: 'net_version' })
    const treasury = networks[networkId].treasury.toLowerCase()
    return treasury;
  }
  return "";
}

module.exports = {
  getBlockchain,
  getTreasury
}
