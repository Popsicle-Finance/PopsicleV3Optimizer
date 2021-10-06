
methods {

    transfer(address,uint) => DISPATCHER(true)
    balanceOf(address) => DISPATCHER(true)
    transferFrom(address,address,uint) => DISPATCHER(true)
    mint(uint256) => DISPATCHER(true)

}
rule checkBurnLiquidityShare(
        int24 tickLower,
        int24 tickUpper,
        uint256 totalSupply,
        uint256 share,
        address to,
        uint128 protocolLiquidity){
    env e;
    require (share > 0 && share <= totalSupply);
    uint256 totalSupplyBefore = totalSupply;
    uint256 amount0;
    uint256 amount1;
    amount0, amount1 = callBurnLiquidityShare(e, tickLower, tickUpper, totalSupply, share, 
                       to, protocolLiquidity);
    // assert(totalSupply == totalSupplyBefore);
    assert(!lastReverted);
    // assert(amount0 < share && amount1 < share);
    // assert(amount0 + amount1 == share);
}

rule checkBurnLiquidityShareNoRevert(
        int24 tickLower,
        int24 tickUpper,
        uint256 totalSupply,
        uint256 share,
        address to,
        uint128 protocolLiquidity){
    env e;
    require (share > 0 && share <= totalSupply);
    uint256 totalSupplyBefore = totalSupply;
    uint256 amount0;
    uint256 amount1;
    amount0, amount1 = callBurnLiquidityShare(e, tickLower, tickUpper, totalSupply, share, 
                       to, protocolLiquidity);
    assert(!lastReverted);
}



rule checkBurnExactLiquidity(
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        address to
    ){
        env e;
        require to == e.msg.sender;
        uint256 amount0;
        uint256 amount1;
        amount0, amount1 = callBurnExactLiquidity(e,
            tickLower,
            tickUpper,
            liquidity,
            to);
        assert liquidity == 0 => amount0 == 0 && amount1 == 0;
        assert liquidity > 0 => amount0 > 0 && amount1 > 0;// && (amount0 <= liquidity || amount1 <= liquidity);
}