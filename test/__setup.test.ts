import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import hre from "hardhat";
import { initializeMakeSuite } from './helpers/make-suite';
import { getEthersSigners } from "../scripts/helpers/contracts-helpers";
import { 
  deployMinionverseNFT, 
  deployRoosterwarsNFT, 
  deployGiftContractV2,   
  deploySaleContract,
} from "../scripts/helpers/contracts-deployments";
import {names, symbols} from "./helpers/constants";

const buildTestEnv = async (deployer: Signer) => {
  const motInstance = await deployMinionverseNFT(deployer, names[0], symbols[0]);
  const rwtInstance = await deployRoosterwarsNFT(deployer, names[1], symbols[1]);
  // const saleInstance = await deploySaleContract(nftInstance.address, poolAddress);
  // const giftInstance = await deployGiftContractV2();
}


before(async () => {
  const [deployer] = await getEthersSigners();
  console.log('-> Deploying test environment...');
  await buildTestEnv(deployer);
  console.log('--> Deploying test environment...\n');
  await initializeMakeSuite();
  console.log('\n--> Setup finished...\n');
});
