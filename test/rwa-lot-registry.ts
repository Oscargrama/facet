import { expect } from "chai";
import { ethers } from "hardhat";

describe("RwaLotRegistry", () => {
  const CARATS = 20;
  const SUPPLY = CARATS * 100;

  async function deployFixture() {
    const [admin, originator, custodian, holder, other] = await ethers.getSigners();

    const FacetLotToken = await ethers.getContractFactory("FacetLotToken");
    const FacetExtractNFT = await ethers.getContractFactory("FacetExtractNFT");
    const RwaLotRegistry = await ethers.getContractFactory("RwaLotRegistry");

    const token = await FacetLotToken.deploy(admin.address);
    await token.waitForDeployment();
    const nft = await FacetExtractNFT.deploy(admin.address);
    await nft.waitForDeployment();

    const registry = await RwaLotRegistry.deploy(
      await token.getAddress(),
      await nft.getAddress(),
      admin.address
    );
    await registry.waitForDeployment();

    await token.grantRole(await token.MINTER_ROLE(), await registry.getAddress());
    await nft.grantRole(await nft.MINTER_ROLE(), await registry.getAddress());

    await registry.grantRole(await registry.ORIGINATOR_ROLE(), originator.address);
    await registry.grantRole(await registry.CUSTODIAN_ROLE(), custodian.address);

    return { admin, originator, custodian, holder, other, token, nft, registry };
  }

  it("creates lot with custody fields and supply validation", async () => {
    const { registry, originator } = await deployFixture();

    await expect(
      registry.connect(originator).createLot(
        "Caja fuerte Facet, Medellin",
        "Facet Infraestructura Joyera",
        ethers.keccak256(ethers.toUtf8Bytes("CERT")),
        "QmCID",
        CARATS,
        SUPPLY
      )
    )
      .to.emit(registry, "LotCreated")
      .withArgs(
        1,
        CARATS,
        "Caja fuerte Facet, Medellin",
        "Facet Infraestructura Joyera",
        ethers.keccak256(ethers.toUtf8Bytes("CERT")),
        "QmCID",
        SUPPLY
      );

    const lot = await registry.lots(1);
    expect(lot.carats).to.equal(CARATS);
    expect(lot.lotTokenSupply).to.equal(SUPPLY);
    expect(lot.tokensMinted).to.equal(0);
  });

  it("rejects lot when supply mismatch", async () => {
    const { registry, originator } = await deployFixture();

    await expect(
      registry.connect(originator).createLot(
        "Location",
        "Custody",
        ethers.keccak256(ethers.toUtf8Bytes("CERT")),
        "QmCID",
        CARATS,
        1
      )
    ).to.be.revertedWithCustomError(registry, "SupplyMismatch");
  });

  it("rejects lot when carats or supply are zero", async () => {
    const { registry, originator } = await deployFixture();

    await expect(
      registry.connect(originator).createLot(
        "Location",
        "Custody",
        ethers.ZeroHash,
        "CID",
        0,
        100
      )
    ).to.be.revertedWithCustomError(registry, "InvalidAmount");

    await expect(
      registry.connect(originator).createLot(
        "Location",
        "Custody",
        ethers.ZeroHash,
        "CID",
        CARATS,
        0
      )
    ).to.be.revertedWithCustomError(registry, "InvalidAmount");
  });

  it("mints tokens within lot supply", async () => {
    const { registry, originator, token, holder } = await deployFixture();
    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);

    await expect(registry.connect(originator).mintLotTokens(1, holder.address, SUPPLY))
      .to.emit(registry, "LotTokensMinted")
      .withArgs(1, holder.address, SUPPLY);

    expect(await token.balanceOf(holder.address)).to.equal(SUPPLY);
    await expect(registry.connect(originator).mintLotTokens(1, holder.address, 1)).to.be.reverted;
  });

  it("rejects minting for invalid lot or invalid amount", async () => {
    const { registry, originator, holder } = await deployFixture();

    await expect(
      registry.connect(originator).mintLotTokens(1, holder.address, 1)
    ).to.be.revertedWithCustomError(registry, "LotNotFound");

    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);

    await expect(
      registry.connect(originator).mintLotTokens(1, holder.address, 0)
    ).to.be.revertedWithCustomError(registry, "InvalidAmount");
  });

  it("rejects minting from non-originator", async () => {
    const { registry, originator, holder, other } = await deployFixture();
    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);

    await expect(
      registry.connect(other).mintLotTokens(1, holder.address, 1)
    ).to.be.reverted;
  });

  it("burns tokens for redemption and updates carats", async () => {
    const { registry, originator, custodian, holder, token } = await deployFixture();
    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);
    await registry.connect(originator).mintLotTokens(1, holder.address, 500);

    await expect(
      registry.connect(holder).burnRedemption(1, holder.address, 500, "REDEEM-1")
    )
      .to.emit(registry, "LotTokensBurned")
      .withArgs(1, holder.address, 500, "REDEEM-1");

    const lot = await registry.lots(1);
    expect(lot.tokensRedeemed).to.equal(500);
    expect(lot.redeemedCarats).to.equal(5);
    expect(await token.balanceOf(holder.address)).to.equal(0);

    await registry.connect(originator).mintLotTokens(1, holder.address, 200);
    await expect(
      registry.connect(custodian).burnRedemption(1, holder.address, 200, "REDEEM-2")
    ).to.emit(registry, "LotTokensBurned");
  });

  it("rejects redemption for invalid lot or invalid amount", async () => {
    const { registry, originator, holder } = await deployFixture();

    await expect(
      registry.connect(holder).burnRedemption(1, holder.address, 1, "REDEEM")
    ).to.be.revertedWithCustomError(registry, "LotNotFound");

    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);
    await registry.connect(originator).mintLotTokens(1, holder.address, 10);

    await expect(
      registry.connect(holder).burnRedemption(1, holder.address, 0, "REDEEM")
    ).to.be.revertedWithCustomError(registry, "InvalidAmount");

    await expect(
      registry.connect(holder).burnRedemption(1, holder.address, 11, "REDEEM")
    ).to.be.revertedWithCustomError(registry, "InvalidAmount");
  });

  it("prevents unauthorized redemption on behalf of others", async () => {
    const { registry, originator, holder, other } = await deployFixture();
    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);
    await registry.connect(originator).mintLotTokens(1, holder.address, 100);

    await expect(
      registry.connect(other).burnRedemption(1, holder.address, 100, "REDEEM-FAIL")
    )
      .to.be.revertedWithCustomError(registry, "UnauthorizedRedemption")
      .withArgs(other.address, holder.address);
  });

  it("mints extract NFT through custodian", async () => {
    const { registry, originator, custodian, holder, nft } = await deployFixture();
    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);

    await expect(
      registry.connect(custodian).mintNFTextract(1, holder.address, "ipfs://extract")
    )
      .to.emit(registry, "ExtractNFTMinted")
      .withArgs(1, holder.address, 1, "ipfs://extract");

    expect(await nft.ownerOf(1)).to.equal(holder.address);
  });

  it("rejects extract mint from non-custodian", async () => {
    const { registry, originator, holder, other } = await deployFixture();
    await registry
      .connect(originator)
      .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY);

    await expect(
      registry.connect(other).mintNFTextract(1, holder.address, "ipfs://extract")
    ).to.be.reverted;
  });

  it("pauses critical actions", async () => {
    const { registry, admin, originator } = await deployFixture();
    await registry.connect(admin).pause();

    await expect(
      registry
        .connect(originator)
        .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY)
    ).to.be.revertedWith("Pausable: paused");

    await registry.connect(admin).unpause();
    await expect(
      registry
        .connect(originator)
        .createLot("Location", "Custody", ethers.ZeroHash, "CID", CARATS, SUPPLY)
    ).to.emit(registry, "LotCreated");
  });
});
