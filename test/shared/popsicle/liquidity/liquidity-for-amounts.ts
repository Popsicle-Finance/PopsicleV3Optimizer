import { UniswapV3Pool } from '../../../../typechain';
import { TickMath, maxLiquidityForAmounts } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';

export const liquidityForAmounts = async (pool: UniswapV3Pool, amount0: number, amount1: number, tickLower: number, tickUpper: number): Promise<string> => {
    const [sqrtRatioX96] = await pool.slot0();
    const _tickLower = TickMath.getSqrtRatioAtTick(tickLower);
    const _tickUpper = TickMath.getSqrtRatioAtTick(tickUpper);

    return maxLiquidityForAmounts(JSBI.BigInt(sqrtRatioX96), _tickLower, _tickUpper, amount0, amount1, true).toString();
}