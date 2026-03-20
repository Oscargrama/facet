import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("FacetExtractNFT", () => {
  async function deployFixture() {
    const [admin, minter, holder, other] = await ethers.getSigners();
    const FacetExtractNFT = await ethers.getContractFactory("FacetExtractNFT");
    const nft = await FacetExtractNFT.deploy(admin.address);
    await nft.waitForDeployment();
    return { admin, minter, holder, other, nft };
  }

  it("mints only with minter role and increments token ids", async () => {
    const { minter, holder, nft } = await deployFixture();

    await expect(nft.safeMint(holder.address, "ipfs://1")).to.be.reverted;

    await nft.grantRole(await nft.MINTER_ROLE(), minter.address);
    await nft.connect(minter).safeMint(holder.address, "ipfs://1");
    await nft.connect(minter).safeMint(holder.address, "ipfs://2");

    expect(await nft.ownerOf(1)).to.equal(holder.address);
    expect(await nft.ownerOf(2)).to.equal(holder.address);
  });

  it("pauses transfers", async () => {
    const { admin, minter, holder, other, nft } = await deployFixture();
    await nft.grantRole(await nft.MINTER_ROLE(), minter.address);
    await nft.connect(minter).safeMint(holder.address, "ipfs://1");

    await nft.connect(admin).pause();
    await expect(
      nft.connect(holder)["safeTransferFrom(address,address,uint256)"](holder.address, other.address, 1)
    ).to.be.revertedWithCustomError(nft, "EnforcedPause");

    await nft.connect(admin).unpause();
    await nft.connect(holder)["safeTransferFrom(address,address,uint256)"](holder.address, other.address, 1);
    expect(await nft.ownerOf(1)).to.equal(other.address);
  });

  it("executes _update on normal transfers when not paused", async () => {
    const { admin, minter, holder, other, nft } = await deployFixture();
    await nft.grantRole(await nft.MINTER_ROLE(), minter.address);
    await nft.connect(minter).safeMint(holder.address, "ipfs://1");

    await nft.connect(admin).pause();
    await nft.connect(admin).unpause();
    await nft.connect(holder)["safeTransferFrom(address,address,uint256)"](holder.address, other.address, 1);
    expect(await nft.ownerOf(1)).to.equal(other.address);
  });

  it("restricts pause to pauser role", async () => {
    const { other, nft } = await deployFixture();
    await expect(nft.connect(other).pause()).to.be.reverted;
  });

  it("supports ERC721 interface", async () => {
    const { nft } = await deployFixture();
    expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true);
  });
});
