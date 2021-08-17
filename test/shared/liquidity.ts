import { UniswapV3Pool, PopsicleV3Optimizer } from '../../typechain';
import { getPositionKey } from './get-position-key';
import { ticks } from './ticks';
import { TickMath, maxLiquidityForAmounts } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import { BigNumber } from 'ethers';

export const liquidityLast = async (pool: UniswapV3Pool, contract: PopsicleV3Optimizer): Promise<BigNumber> => {
    const [tickLower, tickUpper] = await ticks(contract);

    const positionKey = getPositionKey(contract.address, tickLower, tickUpper);

    const [liquidityLast] = await pool.positions(positionKey);

    return liquidityLast;
}

export const liquidity = async (pool: UniswapV3Pool, contract: PopsicleV3Optimizer, amount0Desired: number, amount1Desired: number) : Promise<string> => {
    const [tickLower, tickUpper] = await ticks(contract);
    return await liquidityForAmounts(pool, amount0Desired, amount1Desired, tickLower, tickUpper);
}

export const liquidityForAmounts = async (pool: UniswapV3Pool, amount0: number, amount1: number, tickLower: number, tickUpper: number): Promise<string> => {
    const [sqrtRatioX96] = await pool.slot0();
    const _tickLower = TickMath.getSqrtRatioAtTick(tickLower);
    const _tickUpper = TickMath.getSqrtRatioAtTick(tickUpper);

    return maxLiquidityForAmounts(JSBI.BigInt(sqrtRatioX96), _tickLower, _tickUpper, amount0, amount1, true).toString();
}