// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Biding {
    struct Job {
        uint256 id;
        address payable employer;
        string description;
        uint256 budget;
        bool isCompleted;
        address payable winner;
        uint256 lockedFunds;    // Fonduri blocate pentru job
    }

    struct Bid {
        address payable freelancer;
        uint256 bidAmount;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Bid[]) public bids;
    uint256 public jobCounter;

    event JobPosted(uint256 indexed jobId, address indexed employer, uint256 budget);
    event BidPlaced(uint256 indexed jobId, address indexed freelancer, uint256 bidAmount);
    event WinnerSelected(uint256 indexed jobId, address indexed winner, uint256 winningBid);
    event PaymentReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);

    modifier onlyEmployer(uint256 jobId) {
        require(msg.sender == jobs[jobId].employer, "Only employer can call this function.");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].id == jobId, "Job does not exist.");
        _;
    }

    function postJob(string memory description) external payable {
        require(msg.value > 0, "Budget must be greater than zero.");
        jobCounter++;

        jobs[jobCounter] = Job({
            id: jobCounter,
            employer: payable(msg.sender),
            description: description,
            budget: msg.value,
            isCompleted: false,
            winner: payable(address(0)),
            lockedFunds: msg.value // Blocam fondurile când se creează job-ul
        });

        emit JobPosted(jobCounter, msg.sender, msg.value);
    }

  function placeBid(uint256 jobId, uint256 bidAmount) external jobExists(jobId) {
        require(msg.sender != jobs[jobId].employer, "Employer cannot bid on their own job");
        require(!jobs[jobId].isCompleted, "Job is already completed");
        require(jobs[jobId].winner == address(0), "Winner already selected");
        require(bidAmount > 0, "Bid amount must be greater than zero");
        require(bidAmount < jobs[jobId].budget, "Bid must be lower than job budget");

        // Verificăm dacă utilizatorul are deja o ofertă și o actualizăm
        bool bidExists = false;
        for(uint i = 0; i < bids[jobId].length; i++) {
            if(bids[jobId][i].freelancer == msg.sender) {
                require(bidAmount < bids[jobId][i].bidAmount, "New bid must be lower than your previous bid");
                bids[jobId][i].bidAmount = bidAmount;
                bidExists = true;
                break;
            }
        }

        // Dacă nu există o ofertă anterioară, adăugăm una nouă
        if (!bidExists) {
            bids[jobId].push(Bid({
                freelancer: payable(msg.sender),
                bidAmount: bidAmount
            }));
        }

        emit BidPlaced(jobId, msg.sender, bidAmount);
    }

    function selectWinner(uint256 jobId, uint256 bidIndex) external onlyEmployer(jobId) jobExists(jobId) {
        require(jobs[jobId].winner == address(0), "Winner already selected");
        require(bidIndex < bids[jobId].length, "Invalid bid index");
        require(!jobs[jobId].isCompleted, "Job is already completed");

        Bid memory winningBid = bids[jobId][bidIndex];
        jobs[jobId].winner = winningBid.freelancer;

        emit WinnerSelected(jobId, winningBid.freelancer, winningBid.bidAmount);
    }

 function completeJob(uint256 jobId) external onlyEmployer(jobId) jobExists(jobId) {
        require(jobs[jobId].winner != address(0), "No winner selected");
        require(!jobs[jobId].isCompleted, "Job already completed");
        require(jobs[jobId].lockedFunds > 0, "No funds locked for this job");

        // Gasim suma licitata de castigator
        uint256 winnerBid = 0;
        for(uint i = 0; i < bids[jobId].length; i++) {
            if(bids[jobId][i].freelancer == jobs[jobId].winner) {
                winnerBid = bids[jobId][i].bidAmount;
                break;
            }
        }

        require(winnerBid > 0, "Winner bid not found");

        // Transferam suma licitata catre castigator
        jobs[jobId].winner.transfer(winnerBid);

        // Calculam și transferam restul catre angajator
        uint256 remainingFunds = jobs[jobId].budget - winnerBid;
        if(remainingFunds > 0) {
            jobs[jobId].employer.transfer(remainingFunds);
        }

        jobs[jobId].isCompleted = true;
        jobs[jobId].lockedFunds = 0;

        emit PaymentReleased(jobId, jobs[jobId].winner, winnerBid);
    }

    function getBids(uint256 jobId) external view returns (Bid[] memory) {
        return bids[jobId];
    }

    // În caz că cineva trimite ETH direct către contract
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }
}