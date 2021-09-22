pragma solidity >=0.5.0;

import '../../contracts/popsicle-v3-optimizer/libraries/PoolVariabless.sol';

contract PoolVariablesWrapper{
    using poolVariables for *;
function callAmountsForLiquidity(
        IUniswapV3Pool pool,
        uint128 liquidity,
        int24 _tickLower,
        int24 _tickUpper
    ) internal view returns (uint256, uint256){

    } 
}