import { FeeAmount } from "@uniswap/v3-sdk";
import { BigNumber } from "ethers";
import { getTicks, liquidityForAmounts, liquidityLast } from "../../popsicle";
import { UniswapV3Pool, PopsicleV3Optimizer } from "../../../../typechain";
import { createPosition } from "../helpers";
import { Percent } from '@uniswap/sdk-core';

export const burnAmounts = async (uniswapPool: UniswapV3Pool, contract: PopsicleV3Optimizer, share: string, to: string): Promise<string[]> => {
    const [ tickLower, tickUpper ] = await getTicks(contract);

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