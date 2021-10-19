import { ethers } from "hardhat";
import { Signer, constants, BigNumber } from "ethers";
import { 
    expect, 
    deploy, 
    IErc20, 
    FeeAmount, 
    deployStrategy, 
    POPSICLE_V3_OPTIMIZER_PATH, 
    randomNumber, 
    getTicks,
    liquidity,
    calcShare,
    getPositionKey,
    mintAmounts, 
    burnAmounts,
    poolDisbalancer
} from './shared';
import { PopsicleV3Optimizer, OptimizerStrategy, UniswapV3Pool, ERC20, SwapRouter } from '../typechain';

const TOKENS: IErc20[] = [
    { name: "T", symbol: "TT" },
    { name: "N", symbol: "NN" }
];

describe("PopsicleV3Optimizer", () => {
    let owner: Signer;
    let other: Signer;

    let contract: PopsicleV3Optimizer;
    let pool: UniswapV3Pool;
    let router: SwapRouter;

    let token0: ERC20;
    let token1: ERC20;

    beforeEach("deploy PopsicleV3Optimizer", async () => {
        [owner, other] = await ethers.getSigners();

        const state = await deploy(owner, { feeAmount: FeeAmount.MEDIUM, tokens: TOKENS, priceSqrtRange: [1, 2] });

        pool = state.pool.pool;
        router = state.router;
        token0 = state.pool.token0;
        token1 = state.pool.token1;

        const strategy = await deployStrategy();        

        const contractFactory = await ethers.getContractFactory(POPSICLE_V3_OPTIMIZER_PATH);
        contract = (await contractFactory.deploy(pool.address, strategy.address)) as PopsicleV3Optimizer;


        for(let token of [token0, token1]){
            await token.approve(contract.address, constants.MaxUint256);
            await token.connect(other).approve(contract.address, constants.MaxUint256);
            await token.approve(router.address, constants.MaxUint256);
            await token.connect(other).approve(router.address, constants.MaxUint256);
            await token.transfer(await other.getAddress(), BigNumber.from(10).mul(BigNumber.from(10).pow(18)));
        }
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
            const [tickLower, tickUpper] = await getTicks(contract);
            const _liquidity = await liquidity(pool, contract, amount0Desired, amount1Desired);
            
            share = await calcShare(pool, contract, amount0Desired, amount1Desired);

            [ amount0, amount1 ] = await mintAmounts(pool, tickLower, tickUpper, _liquidity);
        });

        beforeEach("pool cardinality", async () => {
            await pool.increaseObservationCardinalityNext(100);
        });

        beforeEach(async () => {
            await new Promise((rec) => setTimeout(() => rec(""), 100 * 1000));
        })

        it('should emit Deposit event', async () => {
            const action = contract.deposit(amount0Desired, amount1Desired , address);
            const shareMultiplier = Number(share) * Math.pow(10, 6);

            await expect(action).to.emit(contract, "Deposit").withArgs(address, shareMultiplier, amount0, amount1);
        });

        it('should check for zero amount', async () => {
            const action = contract.deposit(0, 0 , address);
            await expect(action).to.revertedWith("ANV");
        });

        it('should check for don\'t paused', async () => {
            await contract.pause();

            const action = contract.deposit(amount0Desired, amount1Desired , address);
            await expect(action).to.revertedWith("P");
        })
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

        beforeEach("pool cardinality", async () => {
            await pool.increaseObservationCardinalityNext(100);
        });

        beforeEach(async () => {
            await new Promise((rec) => setTimeout(() => rec(""), 100 * 1000));
        })

        beforeEach('deposit', async () => {
            await contract.deposit(amount0Desired, amount1Desired , address);
        })

        beforeEach("cacl share, amount0, amount1, userFees0, userFees1", async () => {          
            share = await calcShare(pool, contract, amount0Desired, amount1Desired);
            [amount0, amount1] = await burnAmounts(pool, contract, share, address);
        })

        it('should emit Withdraw event', async () => {
            const action = contract.withdraw(share, address);
            await expect(action).to.emit(contract, 'Withdraw').withArgs(address, share, amount0, amount1);
        })

        it('should check for shares amount', async () => {
            const action = contract.withdraw(0, address);
            await expect(action).to.revertedWith("S");
        });

        it('should check for address(0)', async () => {
            const action = contract.withdraw(share, constants.AddressZero);
            await expect(action).to.revertedWith("WZA");
        });

        it('should check for don\'t paused', async () => {
            await contract.pause();

            const action = contract.withdraw(share, address);
            await expect(action).to.revertedWith("P");
        })
    })

    describe("rerange", () => {
        beforeEach("init contract", async () => {
            await contract.init();
        });

        beforeEach("pool cardinality", async () => {
            await pool.increaseObservationCardinalityNext(100);
        });

        beforeEach(async () => {
            await new Promise((rec) => setTimeout(() => rec(""), 100 * 1000));
        })

        beforeEach('deposit', async () => {
            const amount = 100000;

            await contract.deposit(amount, amount, await owner.getAddress());
            await contract.connect(other).deposit(amount, amount, await other.getAddress());
        });

        it('should emit Rerange event', async () => {
            const action = contract.rerange();
            await expect(action).to.emit(contract, 'Rerange').withArgs(-7980, -6000 , 188832, 105900);
        })

        it('should call only operator', async () => {
            const action = contract.connect(other).rerange();
            await expect(action).to.revertedWith("ONA");
        })
    })

    describe("rebalance", () => {
        let secondContract: PopsicleV3Optimizer;

        beforeEach("init contract", async () => {
            await contract.init();
        });

        beforeEach("deploy and init new contract", async() => {
            const strategy = await deployStrategy();        

            const contractFactory = await ethers.getContractFactory(POPSICLE_V3_OPTIMIZER_PATH);
            secondContract = (await contractFactory.deploy(pool.address, strategy.address)) as PopsicleV3Optimizer;

            await secondContract.init();

            for(let token of [token0, token1]){
                await token.approve(secondContract.address, constants.MaxUint256);
                await token.connect(other).approve(secondContract.address, constants.MaxUint256);
            }
        })

        beforeEach("pool cardinality", async () => {
            await pool.increaseObservationCardinalityNext(100);
        });

        beforeEach(async () => {
            await new Promise((rec) => setTimeout(() => rec(""), 100 * 1000));
        })

        beforeEach("deposit", async() => {
            const amount = 100000;

            await secondContract.deposit(amount, amount, await owner.getAddress());
            await secondContract.connect(other).deposit(amount, amount, await other.getAddress());

            await contract.deposit(amount, amount, await owner.getAddress());
            await contract.connect(other).deposit(amount, amount, await other.getAddress());
        });

        beforeEach("disbalance pool", async () => {
            await poolDisbalancer([owner, other], router, pool, token0, token1);

            await new Promise((rec) => setTimeout(() => rec(""), 100 * 1000));
        })

        it('should emit Rerange event', async () => {
            const action = contract.rebalance();
            await expect(action).to.emit(contract, 'Rerange').withArgs(-8700,-180,367021,25991);
        })

        it('should call only operator', async () => {
            const action = contract.connect(other).rebalance();
            await expect(action).to.revertedWith("ONA");
        })
    })

    describe("position", () => {
        let tickLower: number;
        let tickUpper: number;
        let positionKey: string;

        beforeEach('should get current pool ticks', async () => {
            [tickLower, tickUpper] = await getTicks(contract);
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

    describe("uniswapV3MintCallback", () => {
        beforeEach("init contract", async () => {
            await contract.init();
        })

        it("should call only pool", async () => {
            const action = contract.uniswapV3MintCallback(0, 0, '0x');
            await expect(action).to.revertedWith("FP");
        })
    })

    describe("uniswapV3SwapCallback", () => {
        beforeEach("init contract", async () => {
            await contract.init();
        })

        it("should call only pool", async () => {
            const action = contract.uniswapV3SwapCallback(0, 0, '0x');
            await expect(action).to.revertedWith("FP");
        })
    })

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

        it('should chack for protocolFees0 >= amount0', async () => {
            const action = contract.collectProtocolFees(1, 0);
            await expect(action).to.revertedWith("A0F");
        })

        it('should chack for protocolFees1 >= amount1', async () => {
            const action = contract.collectProtocolFees(0, 1);
            await expect(action).to.revertedWith("A1F");
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
            const action = contract.setStrategy(constants.AddressZero);
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

        it('should check for pause', async () => {
            await contract.pause();

            const actual = contract.pause();

            await expect(actual).to.revertedWith("P")
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

        it('should check for pause', async () => {
            await contract.unpause();

            const actual = contract.unpause();

            await expect(actual).to.revertedWith("NP")
        })

        it('should execute only by the owner', async () => {
            const action = contract.connect(other).unpause();
            await expect(action).to.revertedWith("OG");
        })
    })
});
