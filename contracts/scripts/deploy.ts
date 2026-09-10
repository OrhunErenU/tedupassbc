import hre from "hardhat";

/**
 * Deploys TEDUPassBadge and prints the environment wiring the web app needs.
 *
 * The deployer becomes the contract owner, i.e. the only address allowed to
 * mint. That must be the same key the web app uses as SERVER_WALLET_PRIVATE_KEY,
 * so the script checks the pieces line up before it spends any gas.
 */
async function main() {
  const net = await hre.ethers.provider.getNetwork();
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error(
      "No signer available. Set SERVER_WALLET_PRIVATE_KEY in .env.local before deploying."
    );
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Network:  ${hre.network.name} (chainId ${net.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error(
      `${deployer.address} has no balance on ${hre.network.name}. ` +
        "Fund it from a Base Sepolia faucet (https://www.alchemy.com/faucets/base-sepolia) and re-run."
    );
  }

  const Badge = await hre.ethers.getContractFactory("TEDUPassBadge");
  const contract = await Badge.deploy(deployer.address);
  console.log(`\nDeploy tx: ${contract.deploymentTransaction()?.hash}`);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  const owner = await contract.owner();

  // The app mints as the owner; if these ever diverge every mint reverts.
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Owner mismatch: contract owner is ${owner}, deployer is ${deployer.address}`);
  }

  console.log(`\n✅ TEDUPassBadge deployed: ${addr}`);
  console.log(`   Owner / minter: ${owner}`);
  console.log("\nAdd to .env.local (and to the Vercel project env):");
  console.log(`   TEDU_PASS_CONTRACT_ADDRESS=${addr}`);
  console.log(`   SERVER_WALLET_PRIVATE_KEY=<the key for ${deployer.address}>`);
  console.log(`   BASE_SEPOLIA_RPC_URL=${(hre.network.config as { url?: string }).url ?? "https://sepolia.base.org"}`);
  console.log(`\nVerify on Basescan:`);
  console.log(`   pnpm --filter @tedu-pass/contracts verify ${addr} ${owner}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
