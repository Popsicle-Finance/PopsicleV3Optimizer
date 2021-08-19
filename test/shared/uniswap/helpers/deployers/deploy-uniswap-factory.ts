import { Signer } from 'ethers';
import { waffle } from "hardhat";
import { UniswapV3Factory } from '../../../../../typechain';
import AUniswapV3Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';

export const deployUniswapFactory = async (signer: Signer): Promise<UniswapV3Factory> => (await waffle.deployContract(signer, AUniswapV3Factory)) as UniswapV3Factory;