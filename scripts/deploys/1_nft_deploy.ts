// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";
import { 
  deployLootlotNFT,
  deployRoosterwarsNFT
} from "../helpers/contracts-deployments";
import { names, symbols, totalsupply, treasury } from "../helpers/constants";
import { getEthersSigners } from "../helpers/contracts-helpers";
import { token } from "../../typechain-types/@openzeppelin/contracts";

async function main() {
  const currentNetwork = hre.network.name;
  const [deployer] = await getEthersSigners();
  console.log("Deploying nft contracts with the account: ", await deployer.getAddress());
  
  const monftInstance = await deployLootlotNFT(deployer, names[0], symbols[0], true, 5);  
  console.log(names[0], "deployed to: ", monftInstance.address);
  await monftInstance.setTreasury(treasury);

  // const rsnftInstance = await deployRoosterwarsNFT(deployer, names[1], symbols[1], true, 5);
  // console.log(names[1], "deployed to: ", rsnftInstance.address);
  // await rsnftInstance.setTreasury(treasury);

  // In the Polygon mainnet, Minted tokens(+10) are not appeared on Opensea, so split with 5 items for each request
  for (let i = 0; i < 40; i++) {
    await monftInstance.mint(await deployer.getAddress(), totalsupply, {gasLimit: '1000000'});
    // await rsnftInstance.mint(treasury, totalsupply, tokenType, {gasLimit: '10000000'});  
  }
 
  console.log("Finishied deploying process");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
