import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect, deployUniswapPool, IToken, FeeAmount, ZERO_ADDRESS } from './shared';
import { PopsicleV3Optimizer, OptimizerStrategy } from '../typechain';

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

    const deployStrategy = async (): Promise<OptimizerStrategy> => {
        const strategyFactory = await ethers.getContractFactory(STRATEGY_PATH);
        return (await strategyFactory.deploy(1 , 0 , 1, 1, 1)) as OptimizerStrategy;
    }

    beforeEach("deploy PopsicleV3Optimizer", async () => {
        [owner, other] = await ethers.getSigners();

        const pool = await deployUniswapPool(owner, TOKENS, FeeAmount.MEDIUM);
        const strategy = await deployStrategy();        

        const contractFactory = await ethers.getContractFactory(CONTRACT_PATH);
        contract = (await contractFactory.deploy(pool.address, strategy.address)) as PopsicleV3Optimizer;
    })
    
    describe("setGovernance", () => {
        let newPendingGovernance: string;

        beforeEach("get address of new governance", async () => {
            newPendingGovernance = await other.getAddress();
        })

        it("should set new pending governance" , async () => {
            await contract.setGovernance(newPendingGovernance);
            
            const pendingGovernance = await contract.pendingGovernance();
            expect(pendingGovernance).be.equal(newPendingGovernance);            
        });

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).setGovernance(newPendingGovernance);
            await expect(action).to.be.reverted;
        })
    });

    describe("acceptGovernance", () => {
        let newPendingGovernance: string;
        let oldGovernance: string;

        beforeEach("get address of new governance", async () => {
            newPendingGovernance = await other.getAddress();
            oldGovernance = await owner.getAddress();
        })

        beforeEach('set new governance', async () => {
            await contract.setGovernance(newPendingGovernance);
        })

        it('should emit event TransferGovernance', async () => {
            const action = contract.connect(other).acceptGovernance();

            await expect(action).to.emit(contract, "TransferGovernance").withArgs(oldGovernance, newPendingGovernance);
        })

        it('should accept new governance', async () => {
            await contract.connect(other).acceptGovernance();
            
            const governance = await contract.governance();
            expect(governance).be.equal(newPendingGovernance);
        })

        it("should execute only by the pending governance", async () => {
            const action = contract.acceptGovernance();
            await expect(action).to.be.reverted;
        })
    });

    describe("setStrategy", () => {
        let newStrategy: OptimizerStrategy;

        beforeEach('deploy new OptimizerStrategy', async () => {
            newStrategy = await deployStrategy();
        });

        it('should change strategy', async () => {
            await contract.setStrategy(newStrategy.address);

            const strategy = await contract.strategy();
            expect(strategy).be.equal(newStrategy.address);
        });

        it("should check for address(0)", async () => {
            const action = contract.setStrategy(ZERO_ADDRESS);
            await expect(action).to.be.reverted; 
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).setStrategy(newStrategy.address);
            await expect(action).to.be.reverted;
        })
    });

    describe("approveOperator", () => {
        let operator: string;

        beforeEach("get operator address", async () => {
            operator = await other.getAddress();
        });

        it('should approved operator', async () => {
            await contract.approveOperator(operator);

            const isOperator = await contract.isOperator(operator);
            expect(isOperator).be.true;
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).approveOperator(operator);
            await expect(action).to.be.reverted;
        })
    })

    describe("disableOperator", () => {
        let operator: string;

        beforeEach("get operator address", async () => {
            operator = await other.getAddress();
        });

        beforeEach("approved operator", async () => {
            await contract.approveOperator(operator);
        });

        it('should disable operator', async () => {
            await contract.disableOperator(operator);
            
            const isOperator = await contract.isOperator(operator);
            expect(isOperator).be.false;
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).disableOperator(operator);
            await expect(action).to.be.reverted;
        })
    })

    describe("isOperator", () => {
        let operator: string;

        beforeEach("get operator address", async () => {
            operator = await other.getAddress();
        });

        it('should check operator', async () => {
            const isOperator = await contract.isOperator(operator);
            expect(isOperator).be.false;
        })
    })

    describe("pause", () => {
        it('should paused', async () => {
            await contract.pause();
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).pause();
            await expect(action).to.be.reverted;
        })
    })

    describe("unpause", () => {
        beforeEach('paused contract', async () => {
            await contract.pause();
        })

        it('should unpause', async () => {
            await contract.unpause();
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).unpause();
            await expect(action).to.be.reverted;
        })
    })
});