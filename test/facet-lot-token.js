import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("FacetLotToken", () => {
  async function deployFixture() {
    const [admin, minter, holder, other] = await ethers.getSigners();
    const FacetLotToken = await ethers.getContractFactory("FacetLotToken");
    const token = await FacetLotToken.deploy(admin.address);
    await token.waitForDeployment();
    return { admin, minter, holder, other, token };
  }

  it("uses 0 decimals", async () => {
    const { token } = await deployFixture();
    expect(await token.decimals()).to.equal(0);
  });

  it("allows mint and burn only for minter role", async () => {
    const { minter, holder, token } = await deployFixture();

    await expect(token.mint(holder.address, 1)).to.be.reverted;

    await token.grantRole(await token.MINTER_ROLE(), minter.address);
    await token.connect(minter).mint(holder.address, 10);
    expect(await token.balanceOf(holder.address)).to.equal(10);

    await expect(token.connect(holder).burnFrom(holder.address, 1)).to.be.reverted;
    await token.connect(minter).burnFrom(holder.address, 5);
    expect(await token.balanceOf(holder.address)).to.equal(5);
  });

  it("pauses transfers and minting", async () => {
    const { admin, minter, holder, other, token } = await deployFixture();
    await token.grantRole(await token.MINTER_ROLE(), minter.address);
    await token.connect(minter).mint(holder.address, 10);

    await token.connect(admin).pause();
    await expect(token.connect(holder).transfer(other.address, 1)).to.be.revertedWithCustomError(
      token,
      "EnforcedPause"
    );
    await expect(token.connect(minter).mint(holder.address, 1)).to.be.revertedWithCustomError(
      token,
      "EnforcedPause"
    );

    await token.connect(admin).unpause();
    await token.connect(holder).transfer(other.address, 2);
    expect(await token.balanceOf(other.address)).to.equal(2);
  });

  it("restricts pause to pauser role", async () => {
    const { other, token } = await deployFixture();
    await expect(token.connect(other).pause()).to.be.reverted;
  });
});
