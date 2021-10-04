

methods {
	floor(int24 tick, int24 tickSpacing) => NONDET
	getSqrtRatioAtTick(int24 tick) => NONDET
	getTickAtSqrtRatio(uint160 sqrtPriceX96) => NONDET

	//interface IOptimizerStrategy 
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

	// pool
	    mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes  data
    ) => DISPATCHER(true) 
	
    collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) => DISPATCHER(true) 
	
	burn(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) => DISPATCHER(true) 
	
	swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes data
    ) => DISPATCHER(true) 

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

rule zeroCharacteristicOfWithdraw(uint256 shares, address to){
    env e;
    uint256 amount0;
    uint256 amount1;
    amount0,amount1 =  withdraw(e, shares, to);

    assert (amount0 == 0 && amount1 == 0) || (amount0 != 0 && amount1 != 0);
}





// additivity of withdraw 

rule additivityOfWithdraw(uint256 sharesA, uint256 sharesB, address to){
    env e;
	storage init = lastStorage;
	address from = e.msg.sender;

    uint256 amount00;
    uint256 amount01;

    uint256 amount10;
    uint256 amount11;

    amount00, amount01 = withdraw(e, sharesA, to);
    amount10, amount11 = withdraw(e, sharesB, to);

    uint256 amount20;
    uint256 amount21;

    amount20, amount21 = withdraw(e, sharesA + sharesB, to) at init;

    assert((amount20 == amount00 + amount10) && (amount21 == amount01 + amount11));
}
        
// (this broke but looks like fixed now)

rule frontRunningOnWithdraw(uint256 shares1, address user1, uint256 shares2, address user2){
    require (user1 != user2);
    env e1;
    env e2;
    require (e1.msg.sender == user1 && e2.msg.sender == user2);
    require e1.block.number == e2.block.number;

    amount00, amount01 = withdraw(e1, shares1, user1);
    amount10, amount11 = withdraw(e2, shares2, user2);
    assert(token0.balanceOf(user1)==token0.balanceOf(user2) && 
           token1.balanceOf(user1)==token1.balanceOf(user2) );
}

// after calling rebalance, token0.balanceOf(this)==0 and token1.balanceOf(this)==0
rule zeroBalancesAfterRebalance(){
    env e;
    rebalance();
    assert (token0.balanceOf(this)==0 && token1.balanceOf(this)==0);
}

// total assets of user:
rule totalAssetsOfUser(){
    uint256 amount0;
    uint256 amount1;
    amount0, amount1 = positionAmounts(pool, tickLower, tickUpper)
    protocol0, protocol1 = amountsForLiquidity(pool, protocolFee0, _tickLower, _tickUpper)
        usersAmount0 = amount0 - protocolFees0
        token0.balanceOf(user) +  usersAmount0 * balanceOf[user] / totalSupply() 

        Should stay the same on deposit

        Should decrease on withdraw(share, user) by fee(share)

        should increase in any other function (by other users)

        ** we think this breaks on _compoundFees in case when the pool.mint returns values less than the current balance 
}