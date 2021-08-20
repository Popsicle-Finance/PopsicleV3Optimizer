import { UniswapV3Pool, PopsicleV3Optimizer } from '../../../../typechain';
import { getPositionKey, getTicks } from '../helpers';
import { BigNumber } from 'ethers';

export const liquidityLast = async (pool: UniswapV3Pool, contract: PopsicleV3Optimizer): Promise<BigNumber> => {
    const [tickLower, tickUpper] = await getTicks(contract);

    const positionKey = getPositionKey(contract.address, tickLower, tickUpper);

    const [liquidityLast] = await pool.positions(positionKey);

    return liquidityLast;
}