// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./FacetLotToken.sol";
import "./FacetExtractNFT.sol";

contract RwaLotRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ORIGINATOR_ROLE = keccak256("ORIGINATOR_ROLE");
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");

    struct LotInfo {
        uint256 carats;
        string physicalLocation;
        string custodyProvider;
        bytes32 certHash;
        string metadataCid;
        uint256 lotTokenSupply;
        uint256 redeemedCarats;
        uint256 tokensMinted;
        uint256 tokensRedeemed;
    }

    uint256 public totalLots;
    mapping(uint256 => LotInfo) public lots;

    FacetLotToken public facetToken;
    FacetExtractNFT public extractNft;

    event LotCreated(
        uint256 indexed lotId,
        uint256 carats,
        string physicalLocation,
        string custodyProvider,
        bytes32 certHash,
        string metadataCid,
        uint256 lotTokenSupply
    );
    event LotTokensMinted(uint256 indexed lotId, address indexed to, uint256 amount);
    event LotTokensBurned(uint256 indexed lotId, address indexed from, uint256 amount, string redemptionRef);
    event ExtractNFTMinted(uint256 indexed lotId, address indexed to, uint256 tokenId, string tokenUri);

    error LotNotFound(uint256 lotId);
    error SupplyMismatch(uint256 expectedSupply);
    error InvalidAmount();
    error UnauthorizedRedemption(address caller, address from);

    constructor(address tokenAddress, address nftAddress, address admin) {
        require(tokenAddress != address(0), "TOKEN_ADDRESS_REQUIRED");
        require(nftAddress != address(0), "NFT_ADDRESS_REQUIRED");
        require(admin != address(0), "ADMIN_REQUIRED");

        facetToken = FacetLotToken(tokenAddress);
        extractNft = FacetExtractNFT(nftAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORIGINATOR_ROLE, admin);
        _grantRole(CUSTODIAN_ROLE, admin);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function createLot(
        string memory physicalLocation,
        string memory custodyProvider,
        bytes32 certHash,
        string memory metadataCid,
        uint256 carats,
        uint256 lotTokenSupply
    ) external onlyRole(ORIGINATOR_ROLE) whenNotPaused nonReentrant returns (uint256 lotId) {
        if (carats == 0 || lotTokenSupply == 0) revert InvalidAmount();

        uint256 expectedSupply = carats * 100;
        if (lotTokenSupply != expectedSupply) revert SupplyMismatch(expectedSupply);

        lotId = ++totalLots;
        lots[lotId] = LotInfo({
            carats: carats,
            physicalLocation: physicalLocation,
            custodyProvider: custodyProvider,
            certHash: certHash,
            metadataCid: metadataCid,
            lotTokenSupply: lotTokenSupply,
            redeemedCarats: 0,
            tokensMinted: 0,
            tokensRedeemed: 0
        });

        emit LotCreated(
            lotId,
            carats,
            physicalLocation,
            custodyProvider,
            certHash,
            metadataCid,
            lotTokenSupply
        );
    }

    function mintLotTokens(uint256 lotId, address to, uint256 amount)
        external
        onlyRole(ORIGINATOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        LotInfo storage lot = _getLot(lotId);
        if (amount == 0) revert InvalidAmount();

        uint256 available = lot.lotTokenSupply - lot.tokensMinted;
        if (amount > available) revert InvalidAmount();

        lot.tokensMinted += amount;
        facetToken.mint(to, amount);

        emit LotTokensMinted(lotId, to, amount);
    }

    function burnRedemption(uint256 lotId, address from, uint256 amount, string memory redemptionRef)
        external
        whenNotPaused
        nonReentrant
    {
        if (msg.sender != from && !hasRole(CUSTODIAN_ROLE, msg.sender)) {
            revert UnauthorizedRedemption(msg.sender, from);
        }

        LotInfo storage lot = _getLot(lotId);
        if (amount == 0) revert InvalidAmount();

        uint256 available = lot.tokensMinted - lot.tokensRedeemed;
        if (amount > available) revert InvalidAmount();

        lot.tokensRedeemed += amount;
        lot.redeemedCarats = lot.tokensRedeemed / 100;

        facetToken.burnFrom(from, amount);

        emit LotTokensBurned(lotId, from, amount, redemptionRef);
    }

    function mintNFTextract(uint256 lotId, address to, string memory tokenUri)
        external
        onlyRole(CUSTODIAN_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        _getLot(lotId);
        tokenId = extractNft.safeMint(to, tokenUri);
        emit ExtractNFTMinted(lotId, to, tokenId, tokenUri);
    }

    function _getLot(uint256 lotId) internal view returns (LotInfo storage lot) {
        if (lotId == 0 || lotId > totalLots) revert LotNotFound(lotId);
        lot = lots[lotId];
    }
}
