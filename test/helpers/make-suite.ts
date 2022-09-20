import { Signer } from 'ethers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
// @ts-ignore
import bignumberChai from 'chai-bignumber';
import { almostEqual } from './almost-equal';
import { tEthereumAddress } from '../../scripts/helpers/types';
import { 
  MinionverseNFT, 
  RoosterwarsNFT,
  GiftContractV2, 
  SaleContract } from '../../typechain-types';
import { getEthersSigners } from '../../scripts/helpers/contracts-helpers';
import { 
  getMinionverseNFT, 
  getRoosterwarsNFT, 
  getGiftContractV2, 
  getSaleContract } from '../../scripts/helpers/contracts-getters';
import { evmRevert, evmSnapshot } from '../../scripts/helpers/misc-utils';

chai.use(bignumberChai());
chai.use(almostEqual());
chai.use(solidity);

export interface SignerWithAddress {
    signer: Signer;
    address: tEthereumAddress;
  }

let buidlerevmSnapshotId: string = '0x1';
const setBuidlerevmSnapshotId = (id: string) => {
  buidlerevmSnapshotId = id;
};

export interface TestEnv {
  deployer: SignerWithAddress;
  admin: SignerWithAddress;
  owner: SignerWithAddress;
  minter: SignerWithAddress;
  signer: SignerWithAddress;
  users: SignerWithAddress[];
  minionverseNFT: MinionverseNFT;
  roosterwarsNFT: RoosterwarsNFT;
  giftContractV2: GiftContractV2;
  saleContract: SaleContract;
}

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  admin: {} as SignerWithAddress,
  owner: {} as SignerWithAddress,
  minter: {} as SignerWithAddress,
  signer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  minionverseNFT: {} as MinionverseNFT,
  roosterwarsNFT: {} as RoosterwarsNFT,
  giftContractV2: {} as GiftContractV2,
  saleContract: {} as SaleContract,
}

export async function initializeMakeSuite() {
  const [_deployer, ...restSigners] = await getEthersSigners();

  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const sg of restSigners) {
    testEnv.users.push({
      address: await sg.getAddress(),
      signer:sg,
    });
  }
  testEnv.deployer = deployer;
  testEnv.minionverseNFT = await getMinionverseNFT();
  testEnv.roosterwarsNFT = await getRoosterwarsNFT();
  testEnv.giftContractV2 = await getGiftContractV2();
  testEnv.saleContract =  await getSaleContract();
}

const setSnapshot = async () => {
  setBuidlerevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  await evmRevert(buidlerevmSnapshotId);
};

export function makeSuite(name: string, tests: (testEnv: TestEnv) => void) {
  describe(name, () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
}