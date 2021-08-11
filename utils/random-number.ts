import { randomHex, hexToNumber } from 'web3-utils';

export const randomNumber = (bytesSize: number): number => {
    const hex = randomHex(bytesSize);
    return hexToNumber(hex);
}