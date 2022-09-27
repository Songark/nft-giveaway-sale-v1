// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";
import { deployGiftContractV2 } from "../helpers/contracts-deployments";
import { getEthersSigners } from "../helpers/contracts-helpers";
import { initAddresses } from "./common";
import { getMinionverseNFT, getRoosterwarsNFT } from "../helpers/contracts-getters";


async function main() {
  const [deployer] = await getEthersSigners();
  const deployerAddress = await deployer.getAddress();
  const currentNetwork = hre.network.name;

  const addresses = initAddresses(currentNetwork, deployerAddress);
  console.log("Deploying contracts with the account: ", deployerAddress);
  // const minionverseContract = await getMinionverseNFT();
  const roosterwarsContract = await getRoosterwarsNFT();

  if (currentNetwork == "rinkeby") {
    // console.log("MOT addresss: ", minionverseContract.address);
    console.log("RWT addresss: ", roosterwarsContract.address);
    console.log("God's address: ", addresses.treasury);
    console.log("My account2 address: ", addresses.signerAddress);
  } else if (currentNetwork == "mumbai") {
    // console.log("MOT addresss: ", minionverseContract.address);
    console.log("RWT addresss: ", roosterwarsContract.address);
    console.log("God's address: ", addresses.treasury);
    console.log("My account2 address: ", addresses.signerAddress);
  } else if (currentNetwork == "ethmainnet") {
    // console.log("MOT addresss: ", minionverseContract.address);
    console.log("RWT addresss: ", roosterwarsContract.address);
    console.log("William's address: ", addresses.treasury);
    console.log("Kelvin's address: ", addresses.signerAddress);
  } else {
    // console.log("MOT addresss: ", minionverseContract.address);
    console.log("RWT addresss: ", roosterwarsContract.address);
    console.log("William's address: ", addresses.treasury);
    console.log("Kelvin's address: ", addresses.signerAddress);
  }

  if ( /*!minionverseContract ||*/ !roosterwarsContract || addresses.treasury == "" ) {
    console.log("Not initialized");
    return
  }
  const contract = await deployGiftContractV2(true, 5);
  await (
    await contract.initialize(
    roosterwarsContract.address, 
    roosterwarsContract.address, 
    addresses.treasury,
    addresses.treasury
    )
  ).wait(1);

  console.log("GiftContractV2 deployed to: ", contract.address);

  await (await contract.grantRole(await contract.OWNER_ROLE(), addresses.treasury)).wait(1);
  await (await contract.grantRole(await contract.MINTER_ROLE(), addresses.signerAddress)).wait(1);
  console.log("Granted GiftContractV2 a Minter role to: ", addresses.signerAddress);
  console.log("Granted GiftContractV2 a Minter role to: ", addresses.treasury);

  //await nftInstance.setApprovalForAll(contract.address, true, { from: addresses.treasury });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
