import { Contract, Signer } from "ethers";
import { ethers, waffle } from "hardhat";
import { TOKEN_PATH } from './constants';
import UniswapV3Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import UniswapV3Pool from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { ERC20, IUniswapV3Pool } from '../../typechain';

export enum FeeAmount {
    LOW = 500,
    MEDIUM = 3000,
    HIGH = 10000,
}

export const deployToken = async (name: string, symbol: string): Promise<ERC20> => {
    const contract = await ethers.getContractFactory(TOKEN_PATH);
    return (await contract.deploy(name, symbol)) as ERC20;
}

export interface IToken{
    readonly name: string;
    readonly symbol: string;
}

export const deployUniswapPool = async (signer: Signer, tokens:IToken[], feeAmount: FeeAmount): Promise<IUniswapV3Pool> => {
    const factory = await waffle.deployContract(signer, UniswapV3Factory);
    
    const [token0, token1] = await Promise.all(tokens.map(({ name, symbol }) => deployToken(name, symbol)));

    await factory.createPool(token0.address, token1.address, feeAmount);

    const poolAddress: string = await factory.getPool(token0.address, token1.address, feeAmount); 

    return (await ethers.getContractAt(UniswapV3Pool.abi, poolAddress)) as IUniswapV3Pool;
}