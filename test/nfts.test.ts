
import chai from "chai";
import { ethers } from "hardhat";
import { uritoJson } from "../scripts/helpers/cast-utils";
import { makeSuite, TestEnv, SignerWithAddress } from "./helpers/make-suite";
const { expect } = chai;
import { names, symbols } from "./helpers/constants";
import { any } from "hardhat/internal/core/params/argumentTypes";
import { BigNumber } from "ethers";

makeSuite("Test NFT Collections", (testEnv: TestEnv) => {
    let owner: any, holder: any, user: SignerWithAddress, userAddress: string;
    before(async () => {
        [owner, holder] = await ethers.getSigners();
        user = testEnv.users[0];
        userAddress = user.address;
    });

    it("Should be an owner", async () => {
        const deployer = await testEnv.minionverseNFT.owner();
        expect(owner.address).to.equal(deployer);
    });

    it("Shouldn't be minted by a user", async () => {
    });

    it("Should be minted by owner", async () => {
    });

    it("Should be transferred", async () => {
    });

    it("Should be locked", async () => {
    });

    it("Should be reverted with Member Maxium Limit", async () => {
    });

    it("Should check tokenURI boundary", async () => {
    });
});