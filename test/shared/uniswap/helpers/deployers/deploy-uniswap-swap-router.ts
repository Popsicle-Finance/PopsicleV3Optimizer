import { Signer } from 'ethers';
import { waffle } from "hardhat";
import { SwapRouter } from '../../../../../typechain';
import AUniswapSwapRouter from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';

export const deployUniswapSwapRouter = async (signer: Signer, factory: string, weth9: string): Promise<SwapRouter> => (await waffle.deployContract(signer, AUniswapSwapRouter, [factory, weth9])) as SwapRouter;