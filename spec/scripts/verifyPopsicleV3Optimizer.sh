certoraRun ./contracts/popsicle-v3-optimizer/PopsicleV3Optimizer.sol \
./spec/harness/SymbolicUniswapV3Pool.sol \
--verify SymbolicUniswapV3Pool:spec/sanity.spec --solc solc7.6 --staging shelly/oomFirstAid --rule $1 --settings  -t=10,-depth=1,-enableStorageAnalysis=false --short_output --msg "PopsicleV3Optimizer : $1 - large machines"