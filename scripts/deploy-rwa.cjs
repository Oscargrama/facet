const { ethers } = require("hardhat");

async function main() {
  if (!process.env.PRIVATE_KEY || !process.env.PRIVATE_KEY.trim()) {
    throw new Error("Missing PRIVATE_KEY in .env (must start with 0x).");
  }

  const [deployer] = await ethers.getSigners();

  const FacetLotToken = await ethers.getContractFactory("FacetLotToken");
  const FacetExtractNFT = await ethers.getContractFactory("FacetExtractNFT");
  const RwaLotRegistry = await ethers.getContractFactory("RwaLotRegistry");

  const facetToken = await FacetLotToken.deploy(deployer.address);
  await facetToken.waitForDeployment();

  const extractNft = await FacetExtractNFT.deploy(deployer.address);
  await extractNft.waitForDeployment();

  const registry = await RwaLotRegistry.deploy(
    await facetToken.getAddress(),
    await extractNft.getAddress(),
    deployer.address
  );
  await registry.waitForDeployment();

  const minterRole = await facetToken.MINTER_ROLE();
  const nftMinterRole = await extractNft.MINTER_ROLE();
  const originatorRole = await registry.ORIGINATOR_ROLE();
  const custodianRole = await registry.CUSTODIAN_ROLE();

  await (await facetToken.grantRole(minterRole, await registry.getAddress())).wait();
  await (await extractNft.grantRole(nftMinterRole, await registry.getAddress())).wait();
  await (await registry.grantRole(originatorRole, deployer.address)).wait();
  await (await registry.grantRole(custodianRole, deployer.address)).wait();

  console.log("FacetLotToken:", await facetToken.getAddress());
  console.log("FacetExtractNFT:", await extractNft.getAddress());
  console.log("RwaLotRegistry:", await registry.getAddress());
  console.log("Deployer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
