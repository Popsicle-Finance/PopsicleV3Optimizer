certoraRun contracts/popsicle-v3-optimizer/PopsicleV3Optimizer.sol:PopsicleV3Optimizer spec/harness/DummyERC20A.sol spec/harness/DummyERC20B.sol spec/harness/DummyWeth.sol \
	--verify PopsicleV3Optimizer:spec/popsicleV3Optimizer.spec --solc solc7.6 --staging \
	--rule $1 --settings  -depth=1,-enableStorageAnalysis=false,-enableEqualitySaturation=false \
	--short_output --msg "PopsicleV3Optimizer : $1 - $2"
# --settings  -t=5,-depth=1,-s=bitwuzla,-smt_liaBeforeBv=false,-smt_bitVectorTheory=true #Alex settings