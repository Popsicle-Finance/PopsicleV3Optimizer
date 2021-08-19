import { ethers } from "hardhat";
import { TOKEN_PATH } from "../../../constants";
import { ERC20 } from "../../../../../typechain";

export interface IErc20{
    readonly name: string;
    readonly symbol: string;
}

export const deployErc20 = async (options: IErc20): Promise<ERC20> => {
    const contract = await ethers.getContractFactory(TOKEN_PATH);
    return (await contract.deploy(options.name, options.symbol)) as ERC20;
}