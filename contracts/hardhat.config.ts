import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });
dotenv.config({ path: "../.env" });

const PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY ?? "";
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const BASESCAN_KEY = process.env.BASESCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    }
  },
  networks: {
    // Same chain id as Base Sepolia so the web app (which is pinned to that
    // chain) can talk to a local node unmodified during development and tests.
    hardhat: { chainId: 84532 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 84532 },
    baseSepolia: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: { baseSepolia: BASESCAN_KEY },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};

export default config;
