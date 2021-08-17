import { ethers } from "hardhat";
import { Signer, constants, BigNumber } from "ethers";
import { 
    expect, 
    deployUniswapPool, 
    IToken, 
    FeeAmount, 
    ZERO_ADDRESS, 
    OPTIMIZER_STRATEGY_PATH, 
    POPSICLE_V3_OPTIMIZER_PATH, 
    randomNumber, 
    ticks,
    liquidity,
    calcShare,
    getPositionKey
} from './shared';
import { PopsicleV3Optimizer, OptimizerStrategy, UniswapV3Pool, ERC20 } from '../typechain';
import { mintAmounts, burnAmounts } from './shared/uniswap';

const TOKENS: IToken[] = [
    { name: "T", symbol: "TT" },
    { name: "N", symbol: "NN" }
];

describe("PopsicleV3Optimizer", () => {
    let owner: Signer;
    let other: Signer;

    let contract: PopsicleV3Optimizer;
    let pool: UniswapV3Pool;
    let token0: ERC20;
    let token1: ERC20;

    const deployStrategy = async (): Promise<OptimizerStrategy> => {
        const strategyFactory = await ethers.getContractFactory(OPTIMIZER_STRATEGY_PATH);
        return (await strategyFactory.deploy(1 , 40 , 16, 2000, constants.MaxUint256)) as OptimizerStrategy;
    }

    beforeEach("deploy PopsicleV3Optimizer", async () => {
        [owner, other] = await ethers.getSigners();

        [pool, token0, token1] = await deployUniswapPool(owner, TOKENS, FeeAmount.MEDIUM);
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

    describe('deposit', () => {
        let address: string;
        let amount0Desired: number;
        let amount1Desired: number;
        let share: string;
        let amount0: string;
        let amount1: string;

        beforeEach("init contract", async () => {
            await contract.init();
        })

        beforeEach("get address for deposit", async () => {
            address = await owner.getAddress();
        });

        beforeEach("generate amount0Desired", () => {
            amount0Desired = randomNumber(3);
        });

        beforeEach("generate amount1Desired", () => {
            amount1Desired = randomNumber(2);
        });

        beforeEach("cacl share, amount0, amount1", async () => {
            const [tickLower, tickUpper] = await ticks(contract);
            const _liquidity = await liquidity(pool, contract, amount0Desired, amount1Desired);
            
            share = await calcShare(pool, contract, amount0Desired, amount1Desired);

            [ amount0, amount1 ] = await mintAmounts(pool, tickLower, tickUpper, _liquidity);
        })

        it('should emit Deposit event', async () => {
            const action = contract.deposit(amount0Desired, amount1Desired , address, { value: ethers.utils.parseEther("1.0") });
            await expect(action).to.emit(contract, "Deposit").withArgs(address, share, amount0, amount1);
        });

        it('should check for zero amount', async () => {
            const action = contract.deposit(0, 0 , address, { value: ethers.utils.parseEther("1.0") });
            await expect(action).to.revertedWith("ANV");
        });
    })

    describe("withdraw", () => {
        let address: string;
        let share: string;
        let amount0Desired: number;
        let amount1Desired: number;
        let amount0: string;
        let amount1: string;

        beforeEach("init contract", async () => {
            await contract.init();
        })

        beforeEach("get address for deposit", async () => {
            address = await owner.getAddress();
        });

        beforeEach("generate amount0Desired", () => {
            amount0Desired = randomNumber(3);
        });

        beforeEach("generate amount1Desired", () => {
            amount1Desired = randomNumber(2);
        });

        beforeEach('deposit', async () => {
            await contract.deposit(amount0Desired, amount1Desired , address, { value: ethers.utils.parseEther("1.0") });
        })

        beforeEach("cacl share, amount0, amount1, userFees0, userFees1", async () => {          
            share = await calcShare(pool, contract, amount0Desired, amount1Desired);
            [amount0, amount1] = await burnAmounts(pool, contract, share, address);
        })

        it('should emit Withdraw event', async () => {
            const action = contract.withdraw(share, address);
            await expect(action).to.emit(contract, 'Withdraw').withArgs(address, share, amount0, amount1, 0, 0);
        })

        it('should check for shares amount', async () => {
            const action = contract.withdraw(0, address);
            await expect(action).to.revertedWith("S");
        });

        it('should check for address(0)', async () => {
            const action = contract.withdraw(share, ZERO_ADDRESS);
            await expect(action).to.revertedWith("WZA");
        });
    })

    // describe("rerange", () => {
    //     let balance0: BigNumber;
    //     let balance1: BigNumber;

    //     beforeEach("init contract", async () => {
    //         await contract.init();
    //     })

    //     beforeEach('deposit', async () => {
    //         const amount0Desired = randomNumber(3);
    //         const amount1Desired = randomNumber(2);

    //         const address = await owner.getAddress();

    //         await contract.deposit(amount0Desired, amount1Desired , address, { value: ethers.utils.parseEther("1.0") });
    //     })

    //     it('should emit CollectFees event', async () => {
    //         const action = contract.rerange({ value: ethers.utils.parseEther('0.1')});
    //         await expect(action).to.emit(contract, 'CollectFees').withArgs(0, 0, 0, 0);
    //     })

    //     it('should get pool tokens balances', async () => {
    //         balance0 = await token0.balanceOf(pool.address);
    //         balance1 = await token1.balanceOf(pool.address);
    //     })

    //     it('should emit Snapshot event', async () => {
    //         const action = contract.rerange({ value: ethers.utils.parseEther('0.1')});            
    //         await expect(action).to.emit(contract, 'Snapshot').withArgs(balance0.toNumber(), balance1.toNumber() - 1);
    //     })

    //     it('should emit Rerange event', async () => {
    //         const action = contract.rerange({ value: ethers.utils.parseEther('0.1')});
    //         await expect(action).to.emit(contract, 'Rerange').withArgs(0, 0 , 0, 0);
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

    describe("position", () => {
        let tickLower: number;
        let tickUpper: number;
        let positionKey: string;

        beforeEach('should get current pool ticks', async () => {
            [tickLower, tickUpper] = await ticks(contract);
        });

        beforeEach('should create position key', () => {
            positionKey = getPositionKey(contract.address, tickLower, tickUpper);
        });

        it('should return correct position', async () => {
            const { liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed0, tokensOwed1 } = await contract.position();
            const positions = await pool.positions(positionKey);

            expect(liquidity).be.equal(positions.liquidity);
            expect(feeGrowthInside0LastX128).be.equal(positions.feeGrowthInside0LastX128);
            expect(feeGrowthInside1LastX128).be.equal(positions.feeGrowthInside1LastX128);
            expect(tokensOwed0).be.equal(positions.tokensOwed0);
            expect(tokensOwed1).be.equal(positions.tokensOwed1);
        }) 
    })

    // describe("uniswapV3MintCallback", () => {})

    // describe("uniswapV3SwapCallback", () => {})

    describe("collectProtocolFees", () => {
        let address: string;

        beforeEach("init contract", async () => {
            await contract.init();
        });

        beforeEach("get address for deposit", async () => {
            address = await owner.getAddress();
        });

        it("should emit RewardPaid event", async () => {
            const action = contract.collectProtocolFees(0, 0);
            await expect(action).to.emit(contract, "RewardPaid").withArgs(address, 0, 0);
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).collectProtocolFees(0, 0);
            await expect(action).to.revertedWith("OG");
        })
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
            await expect(action).to.revertedWith("OG");
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
            await expect(action).to.revertedWith("PG");
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
            await expect(action).to.revertedWith("NA");
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).setStrategy(newStrategy.address);
            await expect(action).to.revertedWith("OG");
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
            await expect(action).to.revertedWith("OG");
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
            await expect(action).to.revertedWith("OG");
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
            await expect(action).to.revertedWith("OG");
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
            await expect(action).to.revertedWith("OG");
        })
    })
});