// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC5192} from "./IERC5192.sol";

/// @title TEDU Pass Badge — Soulbound NFT (ERC-5192)
/// @notice Achievement badges issued to TEDU students. Non-transferable.
/// @dev Only the owner (server wallet) can mint. All tokens are permanently locked.
contract TEDUPassBadge is ERC721URIStorage, Ownable, IERC5192 {
    uint256 private _nextTokenId = 1;

    /// @dev External system identifier (e.g. Prisma Badge id) → tokenId
    mapping(bytes32 => uint256) public badgeRefToToken;

    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 indexed badgeRef,
        string tokenURI
    );

    error TransfersDisabled();
    error BadgeRefAlreadyMinted();

    constructor(address initialOwner)
        ERC721("TEDU Pass Badge", "TEDUP")
        Ownable(initialOwner)
    {}

    /// @notice Mint a soulbound badge to `to` with metadata `uri`.
    /// @param badgeRef stable identifier from the off-chain system (used to prevent double-mints)
    function mint(address to, string calldata uri, bytes32 badgeRef)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        if (badgeRefToToken[badgeRef] != 0) revert BadgeRefAlreadyMinted();
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        badgeRefToToken[badgeRef] = tokenId;
        emit Locked(tokenId);
        emit BadgeMinted(tokenId, to, badgeRef, uri);
    }

    /// @notice Batch mint for a closed event (gas-efficient).
    function batchMint(
        address[] calldata recipients,
        string[] calldata uris,
        bytes32[] calldata badgeRefs
    ) external onlyOwner returns (uint256[] memory tokenIds) {
        uint256 n = recipients.length;
        require(n == uris.length && n == badgeRefs.length, "len");
        tokenIds = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            if (badgeRefToToken[badgeRefs[i]] != 0) revert BadgeRefAlreadyMinted();
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
            badgeRefToToken[badgeRefs[i]] = tokenId;
            tokenIds[i] = tokenId;
            emit Locked(tokenId);
            emit BadgeMinted(tokenId, recipients[i], badgeRefs[i], uris[i]);
        }
    }

    /// @inheritdoc IERC5192
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    /// @dev Block all transfers. Allow only mint (from == 0) and burn (to == 0).
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert TransfersDisabled();
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert TransfersDisabled();
    }

    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert TransfersDisabled();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
