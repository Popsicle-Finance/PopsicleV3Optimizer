import { SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
import { UniswapV3Pool, PopsicleV3Optimizer } from '../../../typechain';
import JSBI from 'jsbi';
import { ticks } from '../ticks';
import { liquidityForAmounts, liquidityLast } from '../liquidity';
import { BigNumber } from 'ethers';
import { Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '../utilities';
import { createPosition } from './helpers';
 
const ZERO = JSBI.BigInt(0)

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

export const burnAmounts = async (uniswapPool: UniswapV3Pool, contract: PopsicleV3Optimizer, share: string, to: string): Promise<string[]> => {
    const [ tickLower, tickUpper ] = await ticks(contract);

    const protocolFees0 = await contract.protocolFees0();
    const protocolFees1 = await contract.protocolFees1();

    const protocolLiquidity = await liquidityForAmounts(uniswapPool, protocolFees0.toNumber(), protocolFees1.toNumber(), tickLower, tickUpper);

    const liquidityInPool = await liquidityLast(uniswapPool, contract);

    const totalSupply = await contract.totalSupply();

    const liquidity = liquidityInPool.sub(protocolLiquidity).mul(BigNumber.from(share)).div(totalSupply);
    
    const position = await createPosition(uniswapPool, FeeAmount.MEDIUM, liquidity.toString(), tickLower, tickUpper);

    const { amount0, amount1 } = position.burnAmountsWithSlippage(new Percent(0));
    return [amount0.toString(), amount1.toString()];
}