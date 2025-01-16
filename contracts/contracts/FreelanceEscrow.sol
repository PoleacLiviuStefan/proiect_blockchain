// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBiding {
    struct Job {
        uint256 id;
        address payable employer;
        string description;
        uint256 budget;
        bool isCompleted;
        address payable winner;
        uint256 lockedFunds;
    }
    
    function jobs(uint256 jobId) external view returns (
        uint256 id,
        address employer,
        string memory description,
        uint256 budget,
        bool isCompleted,
        address winner,
        uint256 lockedFunds
    );
}

contract FreelanceEscrow {
    IBiding public bidingContract;
    
    constructor(address _bidingContract) {
        bidingContract = IBiding(_bidingContract);
    }
    
    function verifyJob(uint256 jobId) external view returns (bool) {
        try bidingContract.jobs(jobId) returns (
            uint256 id,
            address,       
            string memory, 
            uint256,       
            bool,          
            address,       
            uint256 lockedFunds
        ) {
            // Verifica doar id și lockedFunds
            return (id > 0 && lockedFunds > 0);
        } catch {
            return false;
        }
    }
}