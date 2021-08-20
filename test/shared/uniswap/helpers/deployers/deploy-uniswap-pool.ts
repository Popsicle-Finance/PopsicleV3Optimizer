import { ethers } from 'hardhat';
import { ERC20, UniswapV3Factory } from '../../../../../typechain';
import { FeeAmount } from '../../constants';
import AUniswapV3Pool from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { UniswapV3Pool } from '../../../../../typechain';
import { encodePriceSqrt } from '../encode-price-sqrt';
import { abi as TokenAbi } from '../../../../../artifacts/contracts/helpers/token/ERC20.sol/ERC20.json';

export const deployUniswapPool = async (factory: UniswapV3Factory, tokens: ERC20[], feeAmount: FeeAmount, priceSqrtRange: number[]) => {
    await factory.createPool(tokens[0].address, tokens[1].address, feeAmount);

    const poolAddress: string = await factory.getPool(tokens[0].address, tokens[1].address, feeAmount); 

    const pool = (await ethers.getContractAt(AUniswapV3Pool.abi, poolAddress)) as UniswapV3Pool;

    await pool.initialize(encodePriceSqrt(priceSqrtRange[0], priceSqrtRange[1]));

    const token0PoolAddress = await pool.token0();
    const token1PoolAddress = await pool.token1();

    const token0Pool = (await ethers.getContractAt(TokenAbi, token0PoolAddress)) as ERC20;
    const token1Pool = (await ethers.getContractAt(TokenAbi, token1PoolAddress)) as ERC20;

    return {pool, token0: token0Pool, token1: token1Pool};
}