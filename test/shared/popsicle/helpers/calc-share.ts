import { BigNumber } from 'ethers';
import { PopsicleV3Optimizer, UniswapV3Pool } from '../../../../typechain';
import { liquidity, liquidityLast } from '../liquidity';

export const calcShare = async (pool: UniswapV3Pool, contract: PopsicleV3Optimizer, amount0Desired: number, amount1Desired: number): Promise<string> => {
    const _liquidity = await liquidity(pool, contract, amount0Desired, amount1Desired);
    const _liquidityLast = await liquidityLast(pool, contract);

    const totalSupply = await contract.totalSupply();

    return totalSupply.isZero() ? _liquidity: BigNumber.from(_liquidity).mul(totalSupply).div( BigNumber.from(_liquidityLast)).toString();
}