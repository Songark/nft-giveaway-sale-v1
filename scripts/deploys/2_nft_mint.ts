// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";
import { names, symbols, totalsupply, treasury } from "../helpers/constants";
import { getEthersSigners } from "../helpers/contracts-helpers";
import { getLootlotNFT, getRoosterwarsNFT } from "../helpers/contracts-getters";
import { BigNumber } from "ethers";

async function main() {
  const currentNetwork = hre.network.name;
  const [deployer] = await getEthersSigners();
  const owner = await deployer.getAddress();
  console.log("Transfering nft tokens, owner account: ", owner);
  
  const monftInstance = await getLootlotNFT();
  await monftInstance.mint(await deployer.getAddress(), totalsupply, {gasLimit: '1000000'});

  console.log("Finishied transfering process");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
