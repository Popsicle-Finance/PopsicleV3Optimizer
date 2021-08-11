import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { randomNumber } from '../utils';

use(chaiAsPromised);

const CONTRACT_PATH = "contracts/OptimizerStrategy.sol:OptimizerStrategy";

describe("OptimizerStrategy", function () {
  let addr1: Signer;
  let contract: Contract; 
  
  beforeEach(async function () {
    [, addr1] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory(CONTRACT_PATH);
    contract = await contractFactory.deploy(1 , 0 , 1, 1, 1);
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

    it("should execute only by the owner", function () {
      const action = contract.connect(addr1).setMaxTotalSupply(newMaxTotalSupply);
      expect(action).to.be.rejected;
    })

    it("should check input value", function () {
      const action = contract.setMaxTotalSupply(0);
      expect(action).to.be.rejected;
    })
  })

  describe('setTwapDuration', function() {
    let twapDuration: number;

    beforeEach(() => {
      twapDuration = randomNumber(4);
    })

    it("should set new twapDuration", async function () {
      await contract.setTwapDuration(twapDuration);

      const maxTwapDuration = await contract.twapDuration();

      expect(maxTwapDuration).to.equal(twapDuration);
    });

    it("should execute only by the owner", function () {
      const action = contract.connect(addr1).setTwapDuration(twapDuration);
      expect(action).to.be.rejected;
    })

    it("should check input value", function () {
      const action = contract.setMaxTotalSupply(0);
      expect(action).to.be.rejected;
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

    it("should execute only by the owner", function () {
      const action = contract.connect(addr1).setMaxTwapDeviation(newMaxTwapDeviation);
      expect(action).to.be.rejected;
    })

    it("should check input value", function () {
      const action = contract.setMaxTotalSupply(0);
      expect(action).to.be.rejected;
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

    it("should execute only by the owner", function () {
      const action = contract.connect(addr1).setTickRange(newTickRange);
      expect(action).to.be.rejected;
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

    it("should execute only by the owner", function () {
      const action = contract.connect(addr1).setPriceImpact(newPriceImpact);
      expect(action).to.be.rejected;
    })

    it("should check input value", function () {
      const action = contract.setMaxTotalSupply(0);
      expect(action).to.be.rejected;
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

    it("should execute only by the owner", function () {
      const action = contract.connect(addr1).setGovernance(newPendingGovernance);
      expect(action).to.be.rejected;
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

    it("should execute only by the pending governance", function () {
      const action = contract.acceptGovernance();
      expect(action).to.be.rejected;
    })
  })
});