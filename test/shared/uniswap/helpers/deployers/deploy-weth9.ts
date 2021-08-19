import WETH9 from '../../constants/WETH9.json';
import { IWETH9} from '../../../../../typechain';
import { Signer } from 'ethers';
import { waffle } from "hardhat";

export const deployWeth9 = async (signer: Signer): Promise<IWETH9> => (await waffle.deployContract(signer, WETH9)) as IWETH9;