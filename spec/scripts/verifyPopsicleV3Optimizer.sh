certoraRun contracts/popsicle-v3-optimizer/PopsicleV3Optimizer.sol:PopsicleV3Optimizer spec/harness/DummyERC20A.sol spec/harness/DummyERC20B.sol spec/harness/SymbolicUniswapV3Pool.sol spec/harness/PoolVariablesWrapper.sol\
	--link PopsicleV3Optimizer:token0=DummyERC20A PopsicleV3Optimizer:token1=DummyERC20B PopsicleV3Optimizer:pool=SymbolicUniswapV3Pool SymbolicUniswapV3Pool:token0=DummyERC20A SymbolicUniswapV3Pool:token1=DummyERC20B\
	--verify PopsicleV3Optimizer:spec/PopsicleV3Optimizer.spec --solc solc7.6 --staging shelly/fixModPopsicle  \
	--rule $1  --settings  -enableEqualitySaturation=false,-copyLoopUnroll=4 \
	--msg "PopsicleV3Optimizer : $1 - $2"  
# spec/harness/DummyWeth.sol 
# contracts/popsicle-v3-optimizer/libraries/PoolVariables.sol \