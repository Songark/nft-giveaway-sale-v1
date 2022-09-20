// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";
import { 
  deployMinionverseNFT,
  deployRoosterwarsNFT
} from "../helpers/contracts-deployments";
import { names, symbols, totalsupply, treasury } from "../helpers/constants";
import { getEthersSigners } from "../helpers/contracts-helpers";
import { token } from "../../typechain-types/@openzeppelin/contracts";

async function main() {
  const currentNetwork = hre.network.name;
  const [deployer] = await getEthersSigners();
  console.log("Deploying nft contracts with the account: ", await deployer.getAddress());
  
  const monftInstance = await deployMinionverseNFT(deployer, names[0], symbols[0]);  
  console.log(names[0], "deployed to: ", monftInstance.address);
  await monftInstance.setTreasury(treasury);

  const rsnftInstance = await deployRoosterwarsNFT(deployer, names[1], symbols[1]);
  console.log(names[1], "deployed to: ", rsnftInstance.address);
  await rsnftInstance.setTreasury(treasury);

  for (let tokenType = 0; tokenType < 4; tokenType++) {
    await monftInstance.mint(treasury, totalsupply, tokenType);
    await rsnftInstance.mint(treasury, totalsupply, tokenType);
  }

  console.log("Finishied deploying process");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
