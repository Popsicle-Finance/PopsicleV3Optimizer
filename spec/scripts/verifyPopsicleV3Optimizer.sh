certoraRun contracts/popsicle-v3-optimizer/PopsicleV3Optimizer.sol spec/harness/DummyERC20A.sol spec/harness/DummyERC20B.sol spec/harness/SymbolicUniswapV3Pool.sol spec/harness/PoolVariablesWrapper.sol \
	--link PopsicleV3Optimizer:token0=DummyERC20A PopsicleV3Optimizer:token1=DummyERC20B PopsicleV3Optimizer:pool=SymbolicUniswapV3Pool SymbolicUniswapV3Pool:token0=DummyERC20A SymbolicUniswapV3Pool:token1=DummyERC20B \
	--optimistic_loop \
	--rule $1 \
	--verify PopsicleV3Optimizer:spec/PopsicleV3Optimizer.spec \
	--solc solc7.6 \
	--staging shelly/forGadiPopsicle \
	--settings  -t=50,-enableEqualitySaturation=false,-copyLoopUnroll=4,-postProcessCounterExamples=true,-deleteSMTFile=false,-smt_hashingScheme=PlainInjectivity \
	--javaArgs '"-Dtopic.function.builder"' \
	--msg "PopsicleV3Optimizer : $1 - $2"