
rule checkBurnLiquidityShare(
        address pool,
        int24 tickLower,
        int24 tickUpper,
        uint256 totalSupply,
        uint256 share,
        address to,
        uint128 protocolLiquidity){
    env e;
    require (share > 0 && share <= totalSupply);
    uint256 totalSupplyBefore = totalSupply;
    uint256 amount0 = 0;
    uint256 amount1 = 0;
    amount0, amount1 = callBurnLiquidityShare(e, pool, tickLower, tickUpper, totalSupply, share, 
                       to, protocolLiquidity);
    assert(totalSupply == totalSupplyBefore);
    assert(!lastReverted);
    assert(amount0 < share && amount1 < share);
    assert(amount0 + amount1 == share);
}

rule checkBurnLiquidityShareNoRevert(
        address pool,
        int24 tickLower,
        int24 tickUpper,
        uint256 totalSupply,
        uint256 share,
        address to,
        uint128 protocolLiquidity){
    env e;
    require (share > 0 && share <= totalSupply);
    uint256 totalSupplyBefore = totalSupply;
    uint256 amount0 = 0;
    uint256 amount1 = 0;
    amount0, amount1 = callBurnLiquidityShare(e, pool, tickLower, tickUpper, totalSupply, share, 
                       to, protocolLiquidity);
    assert(!lastReverted);
}



rule checkBurnExactLiquidity(address pool,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        address to
    ){
        env e;
        uint256 amount0 = 0;
        uint256 amount1 = 0;
        amount0, amount1 = callBurnExactLiquidity(e, pool,
            tickLower,
            tickUpper,
            liquidity,
            to);
        assert (amount0 > 0 && amount1 > 0 && (amount0 + amount1) <= liquidity);
}