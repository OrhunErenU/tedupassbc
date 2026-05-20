import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying TEDUPassBadge with ${deployer.address}`);
  console.log(`Balance: ${(await hre.ethers.provider.getBalance(deployer.address)).toString()}`);

  const Badge = await hre.ethers.getContractFactory("TEDUPassBadge");
  const contract = await Badge.deploy(deployer.address);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log(`\n✅ TEDUPassBadge deployed: ${addr}`);
  console.log(`   Set TEDU_PASS_CONTRACT_ADDRESS=${addr} in .env.local`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
