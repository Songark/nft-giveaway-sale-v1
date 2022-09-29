// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import hre from "hardhat";
import { deploySaleContract } from "../helpers/contracts-deployments";
import { getEthersSigners } from "../helpers/contracts-helpers";
import { getMinionverseNFT } from "../helpers/contracts-getters";


async function main() {
  const [deployer] = await getEthersSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deploying contracts with the account: ", deployerAddress);
  const nftInstance = await getMinionverseNFT();
  const contract = await deploySaleContract(nftInstance.address, addresses.ownkTreasury, true);
  console.log("SaleContract deployed to: ", contract.address);
  for (let i = 0; i < DEFAULT_PRICES.length; i++)
   await contract.setDefaultPrice(i, ethers.utils.parseEther(DEFAULT_PRICES[i]));

  await contract.setSigner(addresses.signerAddress);
  await nftInstance.setApprovalForAll(contract.address, true, {from: addresses.ownkTreasury});
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
