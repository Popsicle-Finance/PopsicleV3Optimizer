import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from './shared';
import { randomNumber, OPTIMIZER_STRATEGY_PATH } from './shared';
import { OptimizerStrategy } from '../typechain';

describe("OptimizerStrategy", function () {
  let addr1: Signer;
  let contract: OptimizerStrategy; 
  
  beforeEach(async function () {
    [, addr1] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory(OPTIMIZER_STRATEGY_PATH);
    contract = (await contractFactory.deploy(1 , 0 , 1, 1, 1)) as OptimizerStrategy;
  });

  describe('setMaxTotalSupply', function() {
    let newMaxTotalSupply: number;

    beforeEach(() => {
      newMaxTotalSupply = randomNumber(4);
    })

    it("should set new maxTotalSupply", async function () {
      await contract.setMaxTotalSupply(newMaxTotalSupply);

      const maxTotalSupply = await contract.maxTotalSupply();

      expect(maxTotalSupply).to.equal(newMaxTotalSupply);
    });

    it("should execute only by the owner", async function () {
      const action = contract.connect(addr1).setMaxTotalSupply(newMaxTotalSupply);
      await expect(action).to.revertedWith('NOT ALLOWED');
    })

    it("should check input value", async function () {
      const action = contract.setMaxTotalSupply(0);
      await expect(action).to.revertedWith('maxTotalSupply');
    })
  })

  describe('setTwapDuration', function() {
    let twapDuration: number;

    beforeEach(() => {
      twapDuration = randomNumber(2);
    })

    it("should set new twapDuration", async function () {
      await contract.setTwapDuration(twapDuration);

      const maxTwapDuration = await contract.twapDuration();

      expect(maxTwapDuration).to.equal(twapDuration);
    });

    it("should execute only by the owner", async function () {
      const action = contract.connect(addr1).setTwapDuration(twapDuration);
      await expect(action).to.revertedWith('NOT ALLOWED');
    })

    it("should check input value", async function () {
      const action = contract.setTwapDuration(0);
      await expect(action).to.revertedWith("twapDuration");
    })
  })

  describe('setMaxTwapDeviation', function() {
    let newMaxTwapDeviation: number;

    beforeEach(() => {
      newMaxTwapDeviation = randomNumber(1);
    })

    it("should set new maxTwapDeviation", async function () {
      await contract.setMaxTwapDeviation(newMaxTwapDeviation);

      const maxTwapDuration = await contract.maxTwapDeviation();

      expect(maxTwapDuration).to.equal(newMaxTwapDeviation);
    });

    it("should execute only by the owner", async function () {
      const action = contract.connect(addr1).setMaxTwapDeviation(newMaxTwapDeviation);
      await expect(action).to.revertedWith('NOT ALLOWED');
    })

    it("should check input value", async function () {
      const action = contract.setMaxTwapDeviation(0);
      await expect(action).to.revertedWith('PF');
    })
  })

  describe('setTickRange', function() {
    let newTickRange: number;

    beforeEach(() => {
      newTickRange = randomNumber(1);
    })

    it("should set new tickRangeMultiplier", async function () {
      await contract.setTickRange(newTickRange);

      const tickRange = await contract.tickRangeMultiplier();

      expect(tickRange).to.equal(newTickRange);
    });

    it("should execute only by the owner", async function () {
      const action = contract.connect(addr1).setTickRange(newTickRange);
      await expect(action).to.revertedWith('NOT ALLOWED');
    })
  })

  describe('setPriceImpact', function() {
    let newPriceImpact: number;

    beforeEach(() => {
      newPriceImpact = randomNumber(1);
    })

    it("should set new priceImpactPercentage", async function () {
      await contract.setPriceImpact(newPriceImpact);

      const priceImpact = await contract.priceImpactPercentage();

      expect(priceImpact).to.equal(newPriceImpact);
    });

    it("should execute only by the owner", async function () {
      const action = contract.connect(addr1).setPriceImpact(newPriceImpact);
      await expect(action).to.revertedWith('NOT ALLOWED');
    })

    it("should check input value", async function () {
      const action = contract.setPriceImpact(0);
      await expect(action).to.revertedWith('PIP');
    })
  })

  describe('setGovernance', function() {
    let newPendingGovernance: string;

    beforeEach(async () => {
      newPendingGovernance = await addr1.getAddress();
    })

    it("should set new pendingGovernance", async function () {
      await contract.setGovernance(newPendingGovernance);

      const pendingGovernance = await contract.pendingGovernance();

      expect(pendingGovernance).to.equal(newPendingGovernance);
    });

    it("should execute only by the owner", async function () {
      const action = contract.connect(addr1).setGovernance(newPendingGovernance);
      await expect(action).to.revertedWith('NOT ALLOWED');
    })
  })

  describe('acceptGovernance', function() {
    let newGovernance: string;

    beforeEach(async () => {
      newGovernance = await addr1.getAddress();

      await contract.setGovernance(newGovernance);
    })

    it("should accept new governance", async function () {
      await contract.connect(addr1).acceptGovernance();

      const governance = await contract.governance();

      expect(governance).to.equal(newGovernance);
    });

    it("should execute only by the pending governance", async function () {
      const action = contract.acceptGovernance();
      await expect(action).to.revertedWith('PG');
    })
  })
});