import { hasValues } from "../helpers/cast-utils";
import { tEthereumAddress } from "../helpers/types";

export interface Addresses {
    deployerAddress: tEthereumAddress;
    treasury: tEthereumAddress;
    signerAddress: tEthereumAddress;
    ethersAddress: tEthereumAddress;
  }

// Mainnet
const main_addresses: Addresses = {
    deployerAddress: {} as tEthereumAddress,
    treasury: "0x21796bA19B1579F51d5177f56C656e8a2476E037", // Will's Live account
    signerAddress: "0x3aC0e043AD218a854D7Fda76CEC09Cf932da56Ec", // Kel's Live account
    ethersAddress: "0xDbA31A76eA8D99329Df0adA09B6668Ad17f0639D",
  }

// // Testnet
const test_addresses: Addresses = {
  deployerAddress: {} as tEthereumAddress,
  treasury: "0xF0d096D33559cDc5f527435b82073c108D6c3107",       // gods
  signerAddress: "0x05Be88DD6e26162184D897557a6e6d9652Efced4",  // my account2
  ethersAddress: "0xDbA31A76eA8D99329Df0adA09B6668Ad17f0639D",
}

/**
 *
  NFT treasury: 0x14220ef0a3D29553ad73829E036Fab6707c33Fc0
  ERC20 treasury: 0x7aE3D1377EFe811428D0D5522807FEd6A41DbF26
  Amount: 1,000,000,000
  Name: OWNED
  Symbol:OWND
  Ethers: 0xDbA31A76eA8D99329Df0adA09B6668Ad17f0639D
 */

export const initAddresses = (network: string, defaultAddress: tEthereumAddress) : Addresses => {

  // let addresses : Addresses = network.includes("main") ? main_addresses : test_addresses;
  let addresses : Addresses = main_addresses;

  if(!hasValues(addresses.deployerAddress))
    addresses.deployerAddress = defaultAddress;
  
  if(!hasValues(addresses.treasury))
    addresses.treasury = defaultAddress;
  
  if(!hasValues(addresses.signerAddress))
    addresses.signerAddress = defaultAddress;
    
  if(!hasValues(addresses.ethersAddress))
    addresses.ethersAddress = defaultAddress;
  return addresses;
}