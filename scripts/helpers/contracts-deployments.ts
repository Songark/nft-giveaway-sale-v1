
import { 
  LootlotNFT__factory, 
  RoosterwarsNFT__factory, 
  SaleContract__factory, 
  GiftContractV2__factory } from "../../typechain-types";
import { getFirstSigner } from "./contracts-getters";
import { withSaveAndVerify } from "./contracts-helpers";
import { eContractid, tEthereumAddress } from "./types";
import { Signer } from 'ethers';

export const deployLootlotNFT = async (
  deployer: Signer,
  name: string,
  symbol: string,
  verify?: boolean,
  confirms: number = 1
) => {
  const instance = await withSaveAndVerify(
    await new LootlotNFT__factory(deployer).deploy(name, symbol),
    eContractid.LootlotNFT,
    [name, symbol],
    verify,
    confirms
  );
  return instance;
};

export const deployRoosterwarsNFT = async (
  deployer: Signer,
  name: string,
  symbol: string,
  verify?: boolean,
  confirms: number = 1
) => {
  const instance = await withSaveAndVerify(
    await new RoosterwarsNFT__factory(deployer).deploy(name, symbol),
    eContractid.RoosterwarsNFT,
    [name, symbol],
    verify,
    confirms
  );
  return instance;
};

export const deployGiftContractV2 = async (verify?: boolean, confirms: number = 1) => {
  const instance = await withSaveAndVerify(
    await new GiftContractV2__factory(await getFirstSigner()).deploy(),
    eContractid.GiftContractV2,
    [],
    verify,
    confirms
  );
  return instance;
}

export const deploySaleContract = async (token: tEthereumAddress, pool: tEthereumAddress, verify?: boolean, confirms: number = 1) => {
  const instance = await withSaveAndVerify(
    await new SaleContract__factory(await getFirstSigner()).deploy(),
    eContractid.SaleContract,
    [],
    verify,
    confirms
  );
  await instance.initialize(token, pool);
  return instance;
}

