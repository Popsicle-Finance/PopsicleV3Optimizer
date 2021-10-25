

using DummyERC20A as token0
using DummyERC20B as token1
using SymbolicUniswapV3Pool as pool

methods {
	//math functions
	floor(int24 tick, int24 tickSpacing) => NONDET
	getSqrtRatioAtTick(int24 tick) => NONDET
	getTickAtSqrtRatio(uint160 sqrtPriceX96) => NONDET
    sqrt(uint256 x) => approximateSqrt(x)
	mulDiv(uint256 a, uint256 b, uint256 denominator) => NONDET
	mulDivRoundingUp(uint256 a, uint256 b, uint256 denominator) => NONDET
	
    
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
    // withdraw(uint256, address) returns (uint256,uint256) envfree
    // collectProtocolFees(uint256,uint256) envfree

    balanceOf(address) returns(uint256) envfree
    totalSupply() returns(uint256) envfree

    //harness
    position_Liquidity() returns(uint128) envfree
    protocol_Liquidity() returns(uint128) envfree
    governance() returns(address) envfree
    // acceptGovernance() envfree
    protocolFees0() returns (uint256) envfree
    protocolFees1() returns (uint256) envfree
    totalFees0() returns (uint256) envfree
    totalFees1() returns (uint256) envfree
    token0.balanceOf(address) returns(uint256) envfree
    token1.balanceOf(address) returns(uint256) envfree
    pool.liquidity() returns (uint256) envfree
    pool.balance0() returns (uint256) envfree
    pool.balance1() returns (uint256) envfree
    pool.owed0() returns (uint128) envfree
    pool.owed1() returns (uint128) envfree
    
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

////////////////////////////////////////////
/////////       rules
/////////////////////////////////////////////

rule zeroCharacteristicOfWithdraw(uint256 shares, address to){
    env e;
    uint256 amount0;
    uint256 amount1;

    amount0,amount1 =  withdraw(e,shares, to);

    assert (amount0 == 0 && amount1 == 0 => shares == 0);
}

rule more_shares_more_amounts_to_withdraw( address to){
env e;
    uint256 sharesX;
    uint256 sharesY;
    uint256 amount0X;
    uint256 amount1X;
    uint256 amount0Y;
    uint256 amount1Y;

    require sharesX > sharesY;// + 100000000000;
    // require totalSupply() <= pool.liquidity();
    storage init = lastStorage;
    
    amount0X,amount1X =  withdraw(e,sharesX, to);
    amount0Y,amount1Y =  withdraw(e,sharesY, to) at init;
    

    assert amount0X >= amount0Y && amount1X >= amount1Y;

}
//   ## validity of total supply : Gadi
//       totalSupply >=  positionLiquidity - protocolLiquidity

rule totalSupply_vs_positionAmounts(method f){
   env e;

   uint256 totalSupplyBefore = totalSupply();
   uint256 posLiquidityBefore = position_Liquidity();
   
   require lastCompoundLiquidity(e) == 0;

   calldataarg args;
	f(e,args);

   uint256 totalSupplyAfter = totalSupply();
   uint256 posLiquidityAfter = position_Liquidity();   
   uint256 compoundAfter = lastCompoundLiquidity(e);

    assert totalSupplyAfter < totalSupplyBefore =>
            posLiquidityAfter - compoundAfter < posLiquidityBefore;
}

// rule reentrency(method f) filtered { f -> !f.isView } {
// 	env e;
// 	calldataarg args;
// 	require _status(e) == 2;
// 	f@withrevert(e,args);
// 	assert lastReverted; 
// }


    rule protocolFees_state(env e, method f, uint256 shares, address to)
    filtered { f -> f.selector != uniswapV3MintCallback(uint256,uint256,bytes).selector && f.selector != uniswapV3SwapCallback(int256,int256,bytes).selector && f.selector != acceptGovernance().selector }
    {
        require governance() != currentContract;
        require governance() != pool;
        require pool.owed0() == 0;
        requireInvariant  total_vs_protocol_Fees();
        
        uint256 balanceGovBefore = token0.balanceOf(governance());
        uint256 balanceProBefore = protocolFees0();
        
        calldataarg args;
        if (f.selector==withdraw(uint256,address).selector){
            require(to!=governance());
            withdraw(e,shares, to);
        }
        else {
	        f(e,args);
        }
        
        uint256 balanceGovAfter = token0.balanceOf(governance());
        uint256 balanceProAfter = protocolFees0();
        uint256 proChange = balanceProAfter > balanceProBefore ? balanceProAfter - balanceProBefore : balanceProBefore - balanceProAfter;

        assert balanceGovAfter <= balanceGovBefore + proChange;
    }
    
    invariant total_vs_protocol_Fees()
    totalFees0() > protocolFees0()    
// invariant currentContract_Holding_Zero_Assets()
//     token0.balanceOf(currentContract) == 0 && token1.balanceOf(currentContract) == 0


// rule verify_transfer_to_uniswap(method f){
//     env e;
//     uint256 _balance0 = token0.balanceOf(e,currentContract);
//     uint256 _balance1 = token1.balanceOf(e,currentContract);
    
//     calldataarg args;
// 	f(e,args);
    
// }
    invariant balance_vs_protocol_Liquidity()
    (totalSupply() == 0) => token0.balanceOf(currentContract) == protocolFees0()
    filtered { f -> f.selector != uniswapV3MintCallback(uint256,uint256,bytes).selector && f.selector != uniswapV3SwapCallback(int256,int256,bytes).selector }
    // filtered { f -> f.selector == rebalance().selector }
    // filtered { f -> f.selector == collectProtocolFees(uint256, uint256).selector }
        {
    preserved withdraw(uint256 amount,address to) with (env e){
             require to != governance() && to != currentContract && to != pool;
             require e.msg.sender != currentContract && e.msg.sender != pool;
         } 
    preserved collectProtocolFees(uint256 amount0, uint256 amount1) with (env e) {
             require e.msg.sender != currentContract && e.msg.sender != pool;
        } 
    }

    invariant empty_pool_state()
    pool.liquidity() == 0 <=> totalSupply() == 0
    filtered { f -> excludeCallback(f) }
    {
    preserved withdraw(uint256 amount,address to) with (env e){//with (env e2){
             require to != governance() && to != currentContract && to != pool;
             require e.msg.sender != currentContract && e.msg.sender != pool && e.msg.sender != governance();
         } 
    }

    invariant empty_pool_state_reverseImply()
    totalSupply() == 0 => (pool.balance0() - pool.owed0() == 0 && pool.balance1() - pool.owed1() == 0 && pool.liquidity() == 0)
    filtered { f -> excludeCallback(f) }

    // invariant empty_pool_zero_liquidity(env e)
    //     pool.balance0(e) == 0 && pool.balance1(e) == 0 <=> position_Liquidity() == 0
    invariant balance_vs_liquidity(env e)
    (pool.balance0() == 0 && pool.balance1() == 0 && pool.owed0() == 0 && pool.owed1() == 0) <=> pool.liquidity() == 0 filtered { f -> excludeCallback(f) }
    {
    preserved {
        require e.msg.sender != pool && e.msg.sender != currentContract;
        requireInvariant empty_pool_state();
              } 
    }

    invariant zero_totalSupply_zero_owed(env e)
    totalSupply() == 0 => (pool.owed0() == 0 && pool.owed1() == 0){ // filtered { f -> f.selector == withdraw(uint256,address).selector } 
    preserved {
        requireInvariant empty_pool_state();
    } 
    }
    
    definition excludeCallback(method f) returns bool = f.selector != uniswapV3MintCallback(uint256,uint256,bytes).selector && f.selector != uniswapV3SwapCallback(int256,int256,bytes).selector;

    rule empty_pool_zero_totalSupply(method f, address to) filtered { f -> excludeCallback(f) }{
        env e;
        require (pool.balance0() - pool.owed0() == 0 && pool.balance1() - pool.owed1() == 0 ) <=> totalSupply() == 0;
        require (to!=governance() && to != pool && to != currentContract);
        requireInvariant pool_balance_vs_owed();

        calldataarg args;
        if (f.selector==withdraw(uint256,address).selector){
            uint256 shares;
            require e.msg.sender != pool && e.msg.sender != currentContract && e.msg.sender != governance();
            require shares == totalSupply();
            withdraw(e,shares, to);
            require pool.balance0() - pool.owed0() == 0 && pool.balance1() - pool.owed1() == 0 ;
        }
        else         
        if (f.selector==deposit(uint256,uint256,address).selector){
            uint256 amount0Desired;
            uint256 amount1Desired;
            require e.msg.sender != pool && e.msg.sender != currentContract && e.msg.sender != governance();
            // require pool.balance0() >= pool.owed0() && pool.balance1() >= pool.owed1();
            deposit(e,amount0Desired,amount1Desired,to);
        }
        else {
	        f(e,args);
        }
        assert (pool.balance0() - pool.owed0() == 0 && pool.balance1() - pool.owed1() == 0 ) <=> totalSupply() == 0;
    }

    invariant pool_balance_vs_owed()
    pool.balance0() >= pool.owed0() && pool.balance1() >= pool.owed1()
    filtered { f -> excludeCallback(f) }

    invariant zero_pool_balance_zero_owed()
    (pool.balance0() == 0 => pool.owed0() == 0) && 
    (pool.balance1() == 0 => pool.owed1() == 0)
    filtered { f -> excludeCallback(f) }

    // invariant totalSupply_LE_liquidity()
    // totalSupply() <= pool.balance0()

    // invariant pos_vs_protocol_liquidity(env e)
    // pool.liquidity() >= protocolFees0()
    // {
    // preserved {
    //     requireInvariant empty_pool_state(e);
    //           } 
    // }

    // invariant protocol_Greater_poolLiquidity()
    // pool.liquidity() >= protocol_Liquidity() <=>
    // totalSupply() >= 0

// additivity of withdraw 
// rule additivityOfWithdraw(uint256 sharesA, uint256 sharesB, address to){
//     env e;


//     uint256 amount00;
//     uint256 amount01;

//     uint256 amount10;
//     uint256 amount11;

//     storage init = lastStorage;
	
//     amount00, amount01 = withdraw(e, sharesA, to);
//     amount10, amount11 = withdraw(e, sharesB, to);

//     uint256 amount20;
//     uint256 amount21;

//     amount20, amount21 = withdraw(e, sharesA + sharesB, to) at init;

//     assert((amount20 == amount00 + amount10) && (amount21 == amount01 + amount11));
// }
        

// after calling rebalance, token0.balanceOf(this)==0 and token1.balanceOf(this)==0
/* rule zeroBalancesAfterRebalance(){
    env e;
    rebalance(e);
    assert (token0.balanceOf(e, currentContract)==0 && 
                             token1.balanceOf(e, currentContract)==0);
} */

/*

// total assets of user:       
// f - external
        // Should stay the same on external functions
// we think this breaks on _compoundFees in case when the pool.mint returns values less than the current balance 

rule totalAssetsOfUser(address user, int24 tickLower, int24 tickUpper, method f){
    env e; 

   // maybe collectprotocolfees?
    _earnFees();
    uint256 amount0;
    uint256 amount1;
    amount0, amount1 = this._compoundFees();
    amount0, amount1 = positionAmounts(pool, tickLower, tickUpper);
    uint256 protocol0;
    uint256 protocol1;
    protocol0, protocol1 = PoolVariableWrapper.callAmountsForLiquidity(e, pool, protocolFee0(), tickLower, tickUpper);
    uint256 usersAmount0 = amount0 - protocolFees0(e);
    uint256 usersAmount1 = amount1 - protocolFees1(e);
    uint256 totalAssetsBefore0 = token0.balanceOf(e, user) +  usersAmount0 * token0.balanceOf(e, user) / totalSupply(e) ;
    uint256 totalAssetsBefore1 = token1.balanceOf(user) +  usersAmount1 * token1.balanceOf(e, user) / totalSupply(e) ;
    calldataarg args;
	f(e,args);
    uint256 totalAssetsAfter0 = token0.balanceOf(e, user) +  usersAmount0 * token0.balanceOf(e, user) / totalSupply(e) ;
    if (f.select == withdraw || f.select == deposit || f.select == init || f.select == rebalance || 
        f.select == reaarange || f.select == collectProtocolFees || f.select  == position)
    assert(totalAssetsBefore0 == totalAssetsAfter0);   
}
*/


// if fees collected amountInUniswapPerShare can only increase
/*
 rule solvencyOfTheSystem(int24 tickLower, int24 tickUpper){
   uint256 amount0;
    uint256 amount1;
    amount0, amount1 = PoolVariables.positionAmounts(pool, tickLower, tickUpper); 
    uint256 userAmount0 = amount0 - protocolFees0();
    uint256 userAmount1 = amount1 - protocolFees1();
    uint256 amountInUniswapPerShare0 = usersAmount0 / totalSupply();
    uint256 amountInUniswapPerShare1 = usersAmount1 / totalSupply();
    amount0, amount1 = collectProtocolFees(amount0Before, amount1Before);
    uint256 userAmount0After = amount0 - protocolFees0();
    uint256 userAmount1After = amount1 - protocolFees1();
    uint256 amountInUniswapPerShare0After = usersAmount0After / totalSupply();
    uint256 amountInUniswapPerShare1After = usersAmount1After / totalSupply();
    assert(amountInUniswapPerShare0 <= amountInUniswapPerShare0After &&
           amountInUniswapPerShare1 <= amountInUniswapPerShare1After);
} 
*/




// if f is swap the before <= after
/*
swap(token0 to token1); swap(token1 to token0) 
earnfees
compoundfees;
amountInUniswapPerShare should increase.
*/

// invariant balanceAtMostTotalSupply(address user) token0.balanceOf(e, user) + token1.balanceOf(e, user) <= totalSupply(e)

    ghost sumAllBalances() returns uint256 {
    init_state axiom sumAllBalances() == 0;
}


// the hook that updates the ghost function as follows
// "At every write to the value at key 'a' in 'balances'
// increase ghostTotalSupply by the difference between
// tho old value and the new value"
//                              the new value ↓ written:
 hook Sstore _balances[KEY address a] uint256 balance
// the old value ↓ already there
    (uint256 old_balance) STORAGE {
  havoc sumAllBalances assuming sumAllBalances@new() == sumAllBalances@old() +
      (balance - old_balance);
}

 hook Sload uint256 balance _balances[KEY address a] STORAGE {
     require balance <= sumAllBalances();
 }

    invariant totalSupplyIntegrity() 
    totalSupply() == sumAllBalances()
  

// Calculated by liquidty
// amountInUniswapPerShare should stay the same on withdraw, deposit, ERC20 functions 
// rule fixedSolvencyOfTheSystem(method f){
//     env e;
// 	calldataarg args;
//     require(totalSupply() == sumAllBalances());
//     require(balanceOf(e.msg.sender) <= totalSupply() );
//     // require(f.select == withdraw || f.select == deposit || f.select == transfer || f.select == transferFrom)
    
//     uint128 amountInUniswapPerShareBefore = amountInUniswapPerShare(e);
//     f(e, args);
//     uint128  amountInUniswapPerShareAfter = amountInUniswapPerShare(e);
//   //  if (f.selector == "withdraw" || f.selector == "deposit" || f.selector == "transfer" || f.selector == "transferFrom")
//         assert (amountInUniswapPerShareBefore == amountInUniswapPerShareAfter);
// }
// invariant userAtMostTotalSupply(adress user) token.balanceOf(user) <= totalSupply()


