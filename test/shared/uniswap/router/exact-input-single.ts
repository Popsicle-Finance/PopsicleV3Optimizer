import { FeeAmount } from "@uniswap/v3-sdk";
import { Signer, BigNumber } from "ethers";
import { SwapRouter } from "../../../../typechain";

export const exactInputSingle = async (router: SwapRouter, trader: Signer, tokenIn: string, tokenOut: string, amountIn: number, amountOutMinimum: number) => {
    const params = {
        tokenIn,
        tokenOut,
        fee: FeeAmount.MEDIUM,
        sqrtPriceLimitX96: tokenIn.toLowerCase() < tokenOut.toLowerCase()
            ? BigNumber.from('4295128740')
            : BigNumber.from('1461446703485210103287273052203988822378723970341'),
        recipient: await trader.getAddress(),
        deadline: Math.fround((Date.now() + 1000 * 60 * 20) / 1000),
        amountIn,
        amountOutMinimum,
    }

    return router.connect(trader).exactInputSingle(params);
}