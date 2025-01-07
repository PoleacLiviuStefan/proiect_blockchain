import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    mainnet: {
      url: process.env.RPC_URL,
      accounts: [process.env.TESTNET_PRIVATE_KEY],
    },
  },
};

export default config;
