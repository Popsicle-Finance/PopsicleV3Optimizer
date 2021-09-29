pragma solidity 0.7.6;
pragma abicoder v2;

import {IUniswapV3Pool} from '../../contracts/popsicle-v3-optimizer/interfaces/IUniswapV3Pool.sol';
import {PoolVariables} from '../../contracts/popsicle-v3-optimizer/libraries/PoolVariables.sol';
import {SafeCast} from '../../contracts/popsicle-v3-optimizer/libraries/SafeCast.sol';
import {PoolActions} from '../../contracts/popsicle-v3-optimizer/libraries/PoolActions.sol';

contract PoolActionsWrapper{
    using PoolActions for *;
    

    function callBurnLiquidityShare(
        IUniswapV3Pool pool,
        int24 tickLower,
        int24 tickUpper,
        uint256 totalSupply,
        uint256 share,
        address to,
        uint128 protocolLiquidity
    ) external returns (uint256 amount0, uint256 amount1) {
        
        (amount0 , amount1) = PoolActions.burnLiquidityShare(pool, tickLower, tickUpper, 
                                  totalSupply, share, to, protocolLiquidity);
    }

    /* iuniswap pool;?? */
    function callBurnExactLiquidity(
        IUniswapV3Pool pool,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        address to
    ) external returns (uint256 amount0, uint256 amount1) {
        
        (amount0 , amount1) = PoolActions.burnExactLiquidity(pool, tickLower, tickUpper, liquidity, to);
    }

    function callBurnAllLiquidity(
        IUniswapV3Pool pool,
        int24 tickLower,
        int24 tickUpper
    ) external {
        
        PoolActions.burnAllLiquidity(pool, tickLower, tickUpper);
    }
}
