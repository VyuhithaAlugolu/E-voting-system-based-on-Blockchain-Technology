// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract Election {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public voters;

    uint256 public candidatesCount;
    address public admin;
    bool public electionStarted;
    bool public electionEnded;

    // Events
    event ElectionStarted();
    event ElectionEnded();
    event VoteCasted(uint256 indexed _candidateId, address indexed _voter);

    constructor() public {
        admin = msg.sender;
        electionStarted = false;
        electionEnded = false;
        addCandidate("John Wick");
        addCandidate("Browney Jr");
        addCandidate("Helena Williams");
    }

    // Modifier to restrict functions to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    // Modifier to check if election is active
    modifier electionActive() {
        require(electionStarted && !electionEnded, "Election is not active");
        _;
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    // Admin function to start election
    function startElection() public onlyAdmin {
        require(!electionStarted, "Election has already started");
        electionStarted = true;
        emit ElectionStarted();
    }

    // Admin function to end election
    function endElection() public onlyAdmin {
        require(electionStarted, "Election has not started yet");
        require(!electionEnded, "Election has already ended");
        electionEnded = true;
        emit ElectionEnded();
    }

    // Vote function - only allowed when election is active
    function vote(uint256 _candidateId) public electionActive {
        // require that they haven't voted before
        require(!voters[msg.sender], "Voter has already voted");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote count
        candidates[_candidateId].voteCount++;

        // trigger voted event
        emit VoteCasted(_candidateId, msg.sender);
    }

    // Function to get election status
    function getElectionStatus() public view returns (bool started, bool ended) {
        return (electionStarted, electionEnded);
    }

    // Function to reset election (admin only) - for testing purposes
    function resetElection() public onlyAdmin {
        electionStarted = false;
        electionEnded = false;
        // Reset all voters
        // Note: In a production system, you might want to handle this differently
    }
}
