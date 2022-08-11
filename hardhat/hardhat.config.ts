import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv'
dotenv.config()

const ALCHEMY = process.env.ALCHEMY_API_KEY_URL 
const PRIVATE_KEY:string = process.env.PRIVATE_KEY as string


const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks:{
    rinkeby:{
      url:ALCHEMY,
      accounts:[PRIVATE_KEY]
    }
  }
};

export default config;
