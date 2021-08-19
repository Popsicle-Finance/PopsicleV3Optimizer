import { utils } from 'ethers';

export function getPositionKey(address: string, lowerTick: number, upperTick: number): string {
    return utils.keccak256(utils.solidityPack(['address', 'int24', 'int24'], [address, lowerTick, upperTick]))
}