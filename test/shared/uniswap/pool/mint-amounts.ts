import { UniswapV3Pool } from "../../../../typechain";
import JSBI from 'jsbi';
import { SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';

const ZERO = JSBI.BigInt(0);

export const mintAmounts = async (pool: UniswapV3Pool, tickLower: number, tickUpper: number, liquidity: string): Promise<string[]> => {
    const { sqrtPriceX96, tick } = await pool.slot0();

    let amount0: JSBI;
    let amount1: JSBI;

    const tickLowerX96 = TickMath.getSqrtRatioAtTick(tickLower);
    const tickUpperX96 = TickMath.getSqrtRatioAtTick(tickUpper);
    const _liquidity = JSBI.BigInt(liquidity);
    const _sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96);

    if(tick < tickLower){
        amount0 = SqrtPriceMath.getAmount0Delta(tickLowerX96, tickUpperX96 , _liquidity, true);
        amount1 = ZERO;
    } else {
        if(tick < tickUpper){
            amount0 = SqrtPriceMath.getAmount0Delta(_sqrtPriceX96, tickUpperX96, _liquidity, true);
            amount1 = SqrtPriceMath.getAmount1Delta(tickLowerX96, _sqrtPriceX96, _liquidity, true);
        } else {
            amount0 = ZERO;
            amount1 = SqrtPriceMath.getAmount1Delta(tickLowerX96, tickUpperX96, _liquidity, true);
        }
    }

    return [amount0.toString(), amount1.toString()];
}