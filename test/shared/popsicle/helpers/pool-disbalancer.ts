import { exactInputSingle } from '../../uniswap';
import { UniswapV3Pool, ERC20, SwapRouter } from '../../../../typechain';
import { Signer } from 'ethers';

export const poolDisbalancer = async (accounts: Signer[], router: SwapRouter, pool: UniswapV3Pool, token0: ERC20, token1: ERC20, percent: number = 0.3) => {
    const token0Balance = (await token0.balanceOf(pool.address)).toNumber();
    const token1Balance = (await token1.balanceOf(pool.address)).toNumber();

    let balance0: number = token0Balance;
    let balance1: number = token1Balance;

    while (balance1 > token1Balance * percent) {
        await exactInputSingle(router, accounts[0], token1.address, token0.address, Math.round(balance1 * 0.1), Math.round(balance1 * 0.08 * 2));
        await exactInputSingle(router, accounts[1], token0.address, token1.address, Math.round(balance0 * 0.15), Math.round(balance0 * 0.12 / 2));

        balance0 = (await token0.balanceOf(pool.address)).toNumber();
        balance1 = (await token1.balanceOf(pool.address)).toNumber();
    }
}