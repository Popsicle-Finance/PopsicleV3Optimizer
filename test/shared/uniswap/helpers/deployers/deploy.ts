import { Signer } from 'ethers';
import { deployUniswapFactory } from './deploy-uniswap-factory';
import { deployUniswapSwapRouter } from './deploy-uniswap-swap-router';
import { deployWeth9 } from './deploy-weth9';
import { deployUniswapPool } from '../deployers/deploy-uniswap-pool';
import { FeeAmount } from '../../constants';
import { IErc20, deployErc20 } from './deploy-erc20';

interface IPoolOptions {
    tokens: IErc20[],
    feeAmount: FeeAmount,
    priceSqrtRange: number[]
}

export const deploy = async (signer: Signer, poolOptions: IPoolOptions) => {
    const factory = await deployUniswapFactory(signer);
    const weth9 = await deployWeth9(signer);
    const router = await deployUniswapSwapRouter(signer, factory.address, weth9.address);

    const tokens = await Promise.all(poolOptions.tokens.map((options) => deployErc20(options)));

    const pool = await deployUniswapPool(factory, tokens, poolOptions.feeAmount, poolOptions.priceSqrtRange);

    return {factory, weth9, router, pool};
}