
import chai from "chai";
import { ethers } from "hardhat";
import { makeSuite, TestEnv, SignerWithAddress } from "./helpers/make-suite";
const { expect } = chai;
import { GiftContractV2 } from "../typechain-types";
import { BigNumber } from "ethers";

makeSuite("GiftContractV2", (testEnv: TestEnv) => {
    let admin: SignerWithAddress, owner: SignerWithAddress, minter: SignerWithAddress, contract: GiftContractV2;
    before(async () => {

    });


});