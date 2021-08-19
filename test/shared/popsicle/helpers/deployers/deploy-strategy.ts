import { constants } from "ethers";
import { ethers } from "hardhat";
import { OptimizerStrategy } from "../../../../../typechain";
import { OPTIMIZER_STRATEGY_PATH } from "../../../constants";

export const deployStrategy = async (): Promise<OptimizerStrategy> => {
    const strategyFactory = await ethers.getContractFactory(OPTIMIZER_STRATEGY_PATH);
    return (await strategyFactory.deploy(1 , 40 , 16, 2000, constants.MaxUint256)) as OptimizerStrategy;
}