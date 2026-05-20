import { expect } from "chai";
import hre from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("TEDUPassBadge (ERC-5192)", () => {
  async function deploy() {
    const [owner, alice, bob] = await hre.ethers.getSigners();
    const Badge = await hre.ethers.getContractFactory("TEDUPassBadge");
    const c = await Badge.deploy(owner.address);
    await c.waitForDeployment();
    return { c, owner, alice, bob };
  }

  it("mints and is locked", async () => {
    const { c, alice } = await deploy();
    const ref = keccak256(toUtf8Bytes("badge-1"));
    await expect(c.mint(alice.address, "ipfs://meta/1", ref))
      .to.emit(c, "Locked").withArgs(1n);
    expect(await c.ownerOf(1n)).to.equal(alice.address);
    expect(await c.locked(1n)).to.equal(true);
    expect(await c.tokenURI(1n)).to.equal("ipfs://meta/1");
  });

  it("rejects transfers", async () => {
    const { c, alice, bob } = await deploy();
    const ref = keccak256(toUtf8Bytes("badge-2"));
    await c.mint(alice.address, "ipfs://meta/2", ref);
    await expect(
      c.connect(alice).transferFrom(alice.address, bob.address, 1n)
    ).to.be.revertedWithCustomError(c, "TransfersDisabled");
  });

  it("rejects duplicate badgeRef", async () => {
    const { c, alice, bob } = await deploy();
    const ref = keccak256(toUtf8Bytes("dup"));
    await c.mint(alice.address, "ipfs://meta/a", ref);
    await expect(c.mint(bob.address, "ipfs://meta/b", ref))
      .to.be.revertedWithCustomError(c, "BadgeRefAlreadyMinted");
  });

  it("only owner can mint", async () => {
    const { c, alice } = await deploy();
    const ref = keccak256(toUtf8Bytes("nope"));
    await expect(c.connect(alice).mint(alice.address, "ipfs://x", ref))
      .to.be.revertedWithCustomError(c, "OwnableUnauthorizedAccount");
  });
});
