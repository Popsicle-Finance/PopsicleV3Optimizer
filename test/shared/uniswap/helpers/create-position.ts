import { Token } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk';
import { UniswapV3Pool } from '../../../../typechain';

export const createPosition = async (uniswapPool: UniswapV3Pool, fee: FeeAmount, liquidity: string, tickLower: number, tickUpper: number) : Promise<Position> => {
    const token0 = new Token(0, await uniswapPool.token0(), 18);
    const token1 = new Token(0, await uniswapPool.token1(), 18);

    const { sqrtPriceX96, tick } = await uniswapPool.slot0();
    const poolLiquidity = await uniswapPool.liquidity();

    const pool = new Pool(token0, token1, fee, sqrtPriceX96.toString(), poolLiquidity.toString(), tick);

    return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper});
}