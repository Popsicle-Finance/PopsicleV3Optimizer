import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from './shared';
import { deployUniswapPool, IToken, FeeAmount } from './shared';
import { PopsicleV3Optimizer } from '../typechain';

const STRATEGY_PATH = "contracts/OptimizerStrategy.sol:OptimizerStrategy";
const CONTRACT_PATH = "contracts/PopsicleV3Optimizer.sol:PopsicleV3Optimizer";

const TOKENS: IToken[] = [
    { name: "T", symbol: "TT" },
    { name: "N", symbol: "NN" }
];

describe("PopsicleV3Optimizer", () => {
    let owner: Signer;
    let other: Signer;

    let contract: PopsicleV3Optimizer;

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

        const pool = await deployUniswapPool(owner, TOKENS, FeeAmount.MEDIUM);

        const strategyFactory = await ethers.getContractFactory(STRATEGY_PATH);
        const strategy = await strategyFactory.deploy(1 , 0 , 1, 1, 1);

        const contractFactory = await ethers.getContractFactory(CONTRACT_PATH);
        contract = (await contractFactory.deploy(pool.address, strategy.address)) as PopsicleV3Optimizer;
    })
    
    describe("init", () => {
        it("should init contract" , async () => {
            await contract.init();
        })
    })
});