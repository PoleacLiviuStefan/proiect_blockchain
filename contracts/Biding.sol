// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UpworkPlatform {
    // Struct pentru job-uri
    struct Job {
        uint256 id;
        address payable employer;
        string description;
        uint256 budget;
        bool isCompleted;
        address payable winner;
    }

    // Struct pentru licitații
    struct Bid {
        address payable freelancer;
        uint256 bidAmount;
    }

    // Mappings
    mapping(uint256 => Job) public jobs; // Job ID -> Job
    mapping(uint256 => Bid[]) public bids; // Job ID -> Listă de licitații

    uint256 public jobCounter;

    // Events
    event JobPosted(uint256 indexed jobId, address indexed employer, uint256 budget);
    event BidPlaced(uint256 indexed jobId, address indexed freelancer, uint256 bidAmount);
    event WinnerSelected(uint256 indexed jobId, address indexed winner, uint256 winningBid);
    event PaymentReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);

    // Modifiers
    modifier onlyEmployer(uint256 jobId) {
        require(msg.sender == jobs[jobId].employer, "Only employer can call this function.");
        _;
    }

    modifier onlyWinner(uint256 jobId) {
        require(msg.sender == jobs[jobId].winner, "Only winner can call this function.");
        _;
    }

    // Funcție pentru postarea unui job
    function postJob(string memory description, uint256 budget) external {
        require(budget > 0, "Budget must be greater than zero.");
        jobCounter++;

        jobs[jobCounter] = Job({
            id: jobCounter,
            employer: payable(msg.sender),
            description: description,
            budget: budget,
            isCompleted: false,
            winner: payable(address(0))
        });

        emit JobPosted(jobCounter, msg.sender, budget);
    }

    // Funcție pentru plasarea unei licitații
    function placeBid(uint256 jobId) external payable {
        require(jobs[jobId].id == jobId, "Job does not exist.");
        require(msg.value > 0, "Bid amount must be greater than zero.");
        bids[jobId].push(Bid({freelancer: payable(msg.sender), bidAmount: msg.value}));

        emit BidPlaced(jobId, msg.sender, msg.value);
    }

    // Funcție pentru alegerea unui câștigător
    function selectWinner(uint256 jobId, uint256 bidIndex) external onlyEmployer(jobId) {
        require(jobs[jobId].winner == address(0), "Winner already selected.");
        require(bidIndex < bids[jobId].length, "Invalid bid index.");

        Bid memory winningBid = bids[jobId][bidIndex];
        jobs[jobId].winner = winningBid.freelancer;

        emit WinnerSelected(jobId, winningBid.freelancer, winningBid.bidAmount);
    }

    // Funcție pentru marcarea job-ului ca finalizat și trimiterea plății
    function completeJob(uint256 jobId) external onlyEmployer(jobId) {
        require(jobs[jobId].winner != address(0), "No winner selected.");
        require(!jobs[jobId].isCompleted, "Job already completed.");

        jobs[jobId].isCompleted = true;

        uint256 paymentAmount = jobs[jobId].budget;
        jobs[jobId].winner.transfer(paymentAmount);

        emit PaymentReleased(jobId, jobs[jobId].winner, paymentAmount);
    }

    // Funcție view pentru obținerea tuturor licitațiilor pentru un job
    function getBids(uint256 jobId) external view returns (Bid[] memory) {
        return bids[jobId];
    }
}
