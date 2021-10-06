

using DummyERC20A as token0
using DummyERC20B as token1
using IUniswapV3Pool as pool

methods {
	//math functions
	floor(int24 tick, int24 tickSpacing) => NONDET
	getSqrtRatioAtTick(int24 tick) => NONDET
	getTickAtSqrtRatio(uint160 sqrtPriceX96) => NONDET
    sqrt(uint256 x) => approximateSqrt(x)
	mulDiv(uint256 a, uint256 b, uint256 denominator) => NONDET
	mulDivRoundingUp(uint256 a, uint256 b, uint256 denominator) => NONDET
	amountsForLiquidity(address pool,
        uint128 liquidity,
        int24 _tickLower,
        int24 _tickUpper) => NONDET
	liquidityForAmounts(address pool,
        uint256 amount0,
        uint256 amount1,
        int24 _tickLower,
        int24 _tickUpper) => NONDET
	positionLiquidity(address pool, int24 _tickLower, int24 _tickUpper) => NONDET
	getPositionTicks(address pool, uint256 amount0Desired, uint256 amount1Desired, int24 baseThreshold, int24 tickSpacing) => NONDET
	amountsForTicks(address pool, uint256 amount0Desired, uint256 amount1Desired, int24 _tickLower, int24 _tickUpper) => NONDET
	baseTicks(int24 currentTick, int24 baseThreshold, int24 tickSpacing) => NONDET
	amountsDirection(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0, uint256 amount1) => NONDET
	checkDeviation(address pool, int24 maxTwapDeviation, uint32 twapDuration) => NONDET
	getTwap(address pool, uint32 twapDuration) => NONDET

	//interface IOptimizerStrategy 
    maxTotalSupply() => NONDET
    twapDuration() => NONDET
	maxTwapDeviation() => NONDET
	tickRangeMultiplier() => NONDET
	priceImpactPercentage() => NONDET

	// ERC20
 // transfer(address, uint256) => DISPATCHER(true) 
   // transferFrom(address, address, uint256) => DISPATCHER(true) 
   // totalSupply() => DISPATCHER(true)
   // balanceOf(address) returns (uint256) => DISPATCHER(true)

    // WETH
    withdraw(uint256, address) => DISPATCHER(true)

	// pool
	/*
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
*/

	// pool callback
	uniswapV3MintCallback(
        uint256 amount0,
        uint256 amount1,
        bytes data
    ) => DISPATCHER(true)

	uniswapV3SwapCallback(
        int256 amount0,
        int256 amount1,
        bytes  data
    ) => DISPATCHER(true)

}

ghost approximateSqrt(uint256) returns uint256;
/* {
  axiom forall uint256 x.
	(x == 0 => approximateSqrt(x) ==0) &&
	( x > 0 => approximateSqrt(x) == x/4 +1 );
}*/
	

rule sanity(method f) filtered { f -> !f.isView  && f.selector != rebalance().selector  }  {
	env e;
	calldataarg args;
	withdraw(e,args);
	assert(false);
}


rule sanityForView(method f) filtered { f -> f.isView }  {
	env e;
	calldataarg args;
	f(e,args);
	assert(false);
}

/*
rule reentrency(method f) filtered { f -> !f.isView } {
	env e;
	calldataarg args;
	require _status(e) == 2;
	f@withrevert(e,args);
	assert lastReverted; 
}
*/

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
// withdrawing the same amount at the same block yields the same token amounts 
// why do we need to withdraw the same amounts?
// We only need the user2 to succeed withdrawing.            
rule frontRunningOnWithdraw(uint256 shares1, address user1, uint256 shares2, address user2){
    require (user1 != user2);
    env e1;
    env e2;
    require (e1.msg.sender == user1 && e2.msg.sender == user2);
    require e1.block.number == e2.block.number;

    uint256 amount00;
    uint256 amount01;
    uint256 amount10;
    uint256 amount11;

    amount00, amount01 = withdraw(e1, shares1, user1);
    amount10, amount11 = withdraw(e2, shares2, user2);
    //assert(token0.balanceOf(user1)==token0.balanceOf(user2) && 
    //       token1.balanceOf(user1)==token1.balanceOf(user2) );
    assert(!lastReverted);
}

// after calling rebalance, token0.balanceOf(this)==0 and token1.balanceOf(this)==0
rule zeroBalancesAfterRebalance(){
    env e;
    rebalance(e);
    assert (token0.balanceOf(e, currentContract)==0 && 
                             token1.balanceOf(e, currentContract)==0);
}


// total assets of user:
/*
rule totalAssetsOfUser(address user, int24 tickLower, int24 tickUpper, method f){
    env e;
    uint256 amount0;
    uint256 amount1;
    amount0, amount1 = positionAmounts(pool, tickLower, tickUpper);

    uint256 protocol0;
    uint256 protocol1;
    // protocol0, protocol1 = amountsForLiquidity(pool, protocolFee0, tickLower, tickUpper);
    uint256 usersAmount0 = amount0 - currentContract.protocolFees0;
    uint256 totalAssetsBefore0 = token0.balanceOf(user) +  usersAmount0 * token0.balanceOf[user] / totalSupply() 
    calldataarg args;
	f(e,args);


    
    Should stay the same on deposit

    Should decrease on withdraw(share, user) by fee(share)

    should increase in any other function (by other users)

    ** we think this breaks on _compoundFees in case when the pool.mint returns values less than the current balance 
    
}
*/