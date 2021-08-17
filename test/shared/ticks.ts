import { PopsicleV3Optimizer } from '../../typechain';

export const ticks = async (contract: PopsicleV3Optimizer): Promise<number[]> => {
    const tickLower = await contract.tickLower();
    const tickUpper = await contract.tickUpper();

    return [tickLower, tickUpper];
}