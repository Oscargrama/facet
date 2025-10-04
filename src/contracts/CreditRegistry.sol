// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CreditRegistry {
    struct CreditRecord {
        address borrower;
        string cid;
        string pdfHash;
        uint256 timestamp;
    }

    mapping(uint256 => CreditRecord) public records;
    uint256 public totalCredits;

    event CreditRegistered(uint256 indexed id, address borrower, string cid, string pdfHash);

    function registerCredit(string memory cid, string memory pdfHash) external {
        totalCredits++;
        records[totalCredits] = CreditRecord(msg.sender, cid, pdfHash, block.timestamp);
        emit CreditRegistered(totalCredits, msg.sender, cid, pdfHash);
    }

    function getCredit(uint256 id) external view returns (CreditRecord memory) {
        return records[id];
    }
}
