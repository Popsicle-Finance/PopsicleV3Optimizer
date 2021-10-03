certoraRun contracts/popsicle-v3-optimizer/PopsicleV3Optimizer.sol:PopsicleV3Optimizer spec/harness/DummyERC20A.sol spec/harness/DummyERC20B.sol spec/harness/DummyWeth.sol ./spec/harness/SymbolicUniswapV3Pool.sol \
	--verify PopsicleV3Optimizer:spec/PopsicleV3Optimizer.spec --solc solc7.6 --staging   \
	--rule $1 --settings  -depth=1,-enableStorageAnalysis=false,-enableEqualitySaturation=false \
	--short_output --msg "PopsicleV3Optimizer : $1 - $2"

