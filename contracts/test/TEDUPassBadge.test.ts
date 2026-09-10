import { expect } from "chai";
import hre from "hardhat";
import { keccak256, toUtf8Bytes, ZeroHash } from "ethers";

const ref = (s: string) => keccak256(toUtf8Bytes(s));
const hash = (s: string) => keccak256(toUtf8Bytes(s));

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
    await expect(c.mint(alice.address, "ipfs://meta/1", ref("badge-1"), hash("doc-1")))
      .to.emit(c, "Locked").withArgs(1n);
    expect(await c.ownerOf(1n)).to.equal(alice.address);
    expect(await c.locked(1n)).to.equal(true);
    expect(await c.tokenURI(1n)).to.equal("ipfs://meta/1");
  });

  it("rejects transfers", async () => {
    const { c, alice, bob } = await deploy();
    await c.mint(alice.address, "ipfs://meta/2", ref("badge-2"), ZeroHash);
    await expect(
      c.connect(alice).transferFrom(alice.address, bob.address, 1n)
    ).to.be.revertedWithCustomError(c, "TransfersDisabled");
  });

  it("rejects duplicate badgeRef", async () => {
    const { c, alice, bob } = await deploy();
    await c.mint(alice.address, "ipfs://meta/a", ref("dup"), ZeroHash);
    await expect(c.mint(bob.address, "ipfs://meta/b", ref("dup"), ZeroHash))
      .to.be.revertedWithCustomError(c, "BadgeRefAlreadyMinted");
  });

  it("only owner can mint", async () => {
    const { c, alice } = await deploy();
    await expect(c.connect(alice).mint(alice.address, "ipfs://x", ref("nope"), ZeroHash))
      .to.be.revertedWithCustomError(c, "OwnableUnauthorizedAccount");
  });

  it("stores the metadata content hash and reports it in the event", async () => {
    const { c, alice } = await deploy();
    const doc = hash('{"name":"Web3 101"}');
    await expect(c.mint(alice.address, "ipfs://meta/3", ref("badge-3"), doc))
      .to.emit(c, "BadgeMinted")
      .withArgs(1n, alice.address, ref("badge-3"), "ipfs://meta/3", doc);
    expect(await c.badgeContentHash(1n)).to.equal(doc);
  });

  it("batchMint assigns each badge its own tokenId, ref and content hash", async () => {
    const { c, alice, bob } = await deploy();
    const refs = [ref("b-1"), ref("b-2")];
    const hashes = [hash("doc-a"), hash("doc-b")];
    await c.batchMint(
      [alice.address, bob.address],
      ["ipfs://a", "ipfs://b"],
      refs,
      hashes
    );
    expect(await c.badgeRefToToken(refs[0])).to.equal(1n);
    expect(await c.badgeRefToToken(refs[1])).to.equal(2n);
    expect(await c.badgeContentHash(1n)).to.equal(hashes[0]);
    expect(await c.badgeContentHash(2n)).to.equal(hashes[1]);
    expect(await c.ownerOf(1n)).to.equal(alice.address);
    expect(await c.ownerOf(2n)).to.equal(bob.address);
  });

  it("batchMint rejects mismatched array lengths", async () => {
    const { c, alice, bob } = await deploy();
    await expect(
      c.batchMint([alice.address, bob.address], ["ipfs://a"], [ref("x"), ref("y")], [ZeroHash, ZeroHash])
    ).to.be.revertedWith("len");
  });
});
