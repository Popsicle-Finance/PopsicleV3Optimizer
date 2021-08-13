import { ethers } from "hardhat";
import { Signer, constants } from "ethers";
import { expect, deployUniswapPool, IToken, FeeAmount, ZERO_ADDRESS, OPTIMIZER_STRATEGY_PATH, POPSICLE_V3_OPTIMIZER_PATH } from './shared';
import { PopsicleV3Optimizer, OptimizerStrategy } from '../typechain';

const TOKENS: IToken[] = [
    { name: "T", symbol: "TT" },
    { name: "N", symbol: "NN" }
];

describe("PopsicleV3Optimizer", () => {
    let owner: Signer;
    let other: Signer;

    let contract: PopsicleV3Optimizer;

    const deployStrategy = async (): Promise<OptimizerStrategy> => {
        const strategyFactory = await ethers.getContractFactory(OPTIMIZER_STRATEGY_PATH);
        return (await strategyFactory.deploy(1 , 40 , 16, 2000, constants.MaxUint256)) as OptimizerStrategy;
    }

    beforeEach("deploy PopsicleV3Optimizer", async () => {
        [owner, other] = await ethers.getSigners();

        const [pool, token0, token1] = await deployUniswapPool(owner, TOKENS, FeeAmount.MEDIUM);
        const strategy = await deployStrategy();        

        const contractFactory = await ethers.getContractFactory(POPSICLE_V3_OPTIMIZER_PATH);
        contract = (await contractFactory.deploy(pool.address, strategy.address)) as PopsicleV3Optimizer;

        await token0.approve(contract.address, constants.MaxUint256);
        await token1.approve(contract.address, constants.MaxUint256);
    })

    describe('init' , () => {
        it('should init contract', async () => {
            await contract.init();

            const initialized = await contract.initialized();
            expect(initialized).be.true;
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).init();
            await expect(action).to.revertedWith('OG');
        })

        it("fails if already initialized", async () => {
            await contract.init();

            const action = contract.init();
            await expect(action).to.revertedWith("F");
        })
    })

    // describe('deposit', () => {
    //     let address: string;

    //     beforeEach("get address for deposit", async () => {
    //         address = await owner.getAddress();
    //     });

    //     beforeEach("init contract", async () => {
    //         await contract.init();
    //     })

    //     it('should emit Deposit event', async () => {
    //         const action = contract.deposit(randomNumber(3), randomNumber(2) , address, { value: ethers.utils.parseEther("1.0") });
    //         await expect(action).to.emit(contract, "Deposit").withArgs('')
    //     });

    //     it('should check for zero amount', async () => {
    //         const action = contract.deposit(0, 0 , address, { value: ethers.utils.parseEther("1.0") });
    //         await expect(action).to.revertedWith("ANV");
    //     });
    // })

    // describe("withdraw", () => {
    //     let address: string;

    //     beforeEach("get address for deposit", async () => {
    //         address = await owner.getAddress();
    //     });

    //     it('should emit Withdraw event', async () => {
    //         const action = contract.withdraw(randomNumber(1), address);
    //         await expect(action).to.emit(contract, 'Withdraw').withArgs("");
    //     })
    // })

    // describe("rerange", () => {
    //     beforeEach("init contract", async () => {
    //         await contract.init();
    //     })

    //     it('should emit Snapshot event', async () => {
    //         const action = contract.rerange({ value: ethers.utils.parseEther('0.1')});
    //         await expect(action).to.emit(contract, 'Snapshot').withArgs("");
    //     })

    //     it('should emit Rerange event', async () => {
    //         const action = contract.rerange({ value: ethers.utils.parseEther('0.1')});
    //         await expect(action).to.emit(contract, 'Rerange').withArgs("");
    //     })
    // })

    // describe("rebalance", () => {
    //     it('should emit Snapshot event', async () => {
    //         const action = contract.rebalance({ value: ethers.utils.parseEther('0.1')});
    //         await expect(action).to.emit(contract, 'Snapshot').withArgs("");
    //     })

    //     it('should emit Rerange event', async () => {
    //         const action = contract.rebalance({ value: ethers.utils.parseEther('0.1')});
    //         await expect(action).to.emit(contract, 'Rerange').withArgs("");
    //     })
    // })

    // describe("position", () => {})

    // describe("uniswapV3MintCallback", () => {})

    // describe("uniswapV3SwapCallback", () => {})

    // describe("collectProtocolFees", () => {
    //     beforeEach("init contract", async () => {
    //         await contract.init();
    //     })

    //     it("should emit RewardPaid event", async () => {
    //         const action = contract.collectProtocolFees(randomNumber(1), randomNumber(2));
    //         await expect(action).to.emit(contract, "RewardPaid").withArgs("");
    //     })

    //     it('should execute only by the owner', async () => {
    //         const action = contract.connect(other).collectProtocolFees(randomNumber(1), randomNumber(2));
    //         await expect(action).to.be.reverted;
    //     })
    // })
    
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