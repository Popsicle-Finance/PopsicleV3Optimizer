methods {
	floor(int24 tick, int24 tickSpacing) => NONDET
	getSqrtRatioAtTick(int24 tick) => NONDET
	getTickAtSqrtRatio(uint160 sqrtPriceX96) => NONDET

	//	interface IOptimizerStrategy 
    maxTotalSupply() => NONDET
    twapDuration() => NONDET
	maxTwapDeviation() => NONDET
	tickRangeMultiplier() => NONDET
	priceImpactPercentage() => NONDET

	// ERC20
    transfer(address, uint256) => DISPATCHER(true) 
    transferFrom(address, address, uint256) => DISPATCHER(true) 
    totalSupply() => DISPATCHER(true)
    balanceOf(address) returns (uint256) => DISPATCHER(true)

    // WETH
    withdraw(uint256) => DISPATCHER(true)

}

	

rule sanity(method f) filtered { f -> !f.isView  && f.selector != rebalance().selector  }  {
	env e;
	calldataarg args;
	f(e,args);
	assert(false);
}


rule sanityForView(method f) filtered { f -> f.isView }  {
	env e;
	calldataarg args;
	f(e,args);
	assert(false);
}


rule reentrency(method f) filtered { f -> !f.isView } {
	env e;
	calldataarg args;
	require _status(e) == 2;
	f@withrevert(e,args);
	assert lastReverted; 
}

/*
amountsForLiquidity(pool, totalSupply()
        uint128 liquidity,
        int24 _tickLower,
        int24 _tickUpper
    )
	*/ 