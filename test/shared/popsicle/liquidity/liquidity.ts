import { UniswapV3Pool, PopsicleV3Optimizer } from '../../../../typechain';
import { getTicks } from '../helpers';
import { liquidityForAmounts } from './liquidity-for-amounts';

export const liquidity = async (pool: UniswapV3Pool, contract: PopsicleV3Optimizer, amount0Desired: number, amount1Desired: number) : Promise<string> => {
    const [tickLower, tickUpper] = await getTicks(contract);
    return await liquidityForAmounts(pool, amount0Desired, amount1Desired, tickLower, tickUpper);
}