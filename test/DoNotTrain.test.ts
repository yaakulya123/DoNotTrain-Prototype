import { expect } from "chai";
import hre from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";
import { DoNotTrain } from "../typechain-types";

const { ethers } = hre;

// 32-byte SHA-256 fixtures (deterministic, easy to read in failure output)
const SHA_A = "0x" + "a".repeat(64);
const SHA_B = "0x" + "b".repeat(64);
const SHA_C = "0x" + "c".repeat(64);

// 8-byte (64-bit) perceptual-hash fixtures.
// PHASH_A and PHASH_A_NEAR differ in 5 bits (Hamming distance 5).
// PHASH_FAR differs from PHASH_A in 30 bits.
const PHASH_A      = "0xff00ff00ff00ff00";
const PHASH_A_NEAR = "0xff00ff00ff00ff1f"; // last byte 0x00 -> 0x1f flips 5 bits
const PHASH_FAR    = "0x0fa0a0a0a0a0a0af";

describe("DoNotTrain", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DoNotTrain");
    const c = (await Factory.deploy()) as unknown as DoNotTrain;
    await c.waitForDeployment();
    return { c, owner, alice, bob };
  }

  it("registers a new hash, emits HashRegistered, and isRegistered returns true", async () => {
    const { c, alice } = await deploy();

    await expect(c.connect(alice).register(SHA_A, PHASH_A))
      .to.emit(c, "HashRegistered")
      .withArgs(SHA_A, PHASH_A, alice.address, anyValue, anyValue);

    expect(await c.isRegistered(SHA_A)).to.equal(true);
  });

  it("reverts with AlreadyRegistered when the same SHA-256 is registered twice", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).register(SHA_A, PHASH_A);
    await expect(c.connect(alice).register(SHA_A, PHASH_A)).to.be.revertedWithCustomError(
      c,
      "AlreadyRegistered"
    );
  });

  it("getRegistration on an unregistered hash reverts with NotRegistered", async () => {
    const { c } = await deploy();
    await expect(c.getRegistration(SHA_A)).to.be.revertedWithCustomError(c, "NotRegistered");
  });

  it("getRegistration returns full record for a registered hash", async () => {
    const { c, alice } = await deploy();
    const tx = await c.connect(alice).register(SHA_A, PHASH_A);
    const receipt = await tx.wait();

    const [owner, timestamp, blockNumber, pHash] = await c.getRegistration(SHA_A);
    expect(owner).to.equal(alice.address);
    expect(blockNumber).to.equal(receipt!.blockNumber);
    expect(pHash).to.equal(PHASH_A);
    expect(timestamp).to.be.gt(0n);
  });

  it("findSimilar returns the registered hash for an identical pHash", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).register(SHA_A, PHASH_A);

    const matches = await c.findSimilar(PHASH_A, 0);
    expect(matches).to.deep.equal([SHA_A]);
  });

  it("findSimilar returns the registered hash when pHash differs by 5 bits and maxDistance is 10", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).register(SHA_A, PHASH_A);

    const matches = await c.findSimilar(PHASH_A_NEAR, 10);
    expect(matches).to.deep.equal([SHA_A]);
  });

  it("findSimilar returns empty when pHash differs by ~30 bits and maxDistance is 10", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).register(SHA_A, PHASH_A);

    const matches = await c.findSimilar(PHASH_FAR, 10);
    expect(matches).to.deep.equal([]);
  });

  it("findSimilar reverts with HammingDistanceTooLarge when maxDistance > 64", async () => {
    const { c } = await deploy();
    await expect(c.findSimilar(PHASH_A, 65)).to.be.revertedWithCustomError(
      c,
      "HammingDistanceTooLarge"
    );
  });

  it("findSimilar skips bytes8(0) sentinels (non-image registrations) so they don't false-match", async () => {
    const { c, alice } = await deploy();
    // Register a non-image (pHash sentinel) — should never appear in similarity results.
    await c.connect(alice).register(SHA_B, "0x0000000000000000");
    const matches = await c.findSimilar("0x0000000000000000", 10);
    expect(matches).to.deep.equal([]);
  });

  it("totalRegistrations increments correctly", async () => {
    const { c, alice, bob } = await deploy();
    expect(await c.totalRegistrations()).to.equal(0n);

    await c.connect(alice).register(SHA_A, PHASH_A);
    expect(await c.totalRegistrations()).to.equal(1n);

    await c.connect(bob).register(SHA_C, PHASH_FAR);
    expect(await c.totalRegistrations()).to.equal(2n);
  });
});

