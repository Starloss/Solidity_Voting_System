/// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/** 
 *  @title A voting system
 *  @author Starloss
 */
contract VotingSystem is Ownable, ReentrancyGuard {

    /// VARIABLES
    /** 
     *  @notice Struct used to store the votes in the system
     */
    struct Vote {
        uint voterUID;
        address choice;
    }

    /**
     *  @notice Struct used to store the voters in the system
     *  @notice Only can access to this data if you know the address
     *  @dev We need to improve the privacy of the voter
     */
    struct Voter {
        uint uid;
        string voterName;
    }

    /**
     *  @notice Struct used to store the elections in the system
     */
    struct Election {
        uint uid;
        uint endTime;
        uint totalVotes;
        uint[] counters;
        string title;
        string description;
        address[] candidates;
        State state;
    }

    /**
     *  @notice Variables for keeping counts of voters and elections
     */
    uint public totalVoters = 0;
    uint public totalElections = 0;

    /**
     *  @notice Storage for votes, voters and elections
     */
    mapping(address => Voter) public voters;
    mapping(uint => Election) public elections;
    mapping(uint => mapping(uint => Vote)) public votes;

    /// STATES
    /**
     *  @notice Enum used for tracking the state of the election
     */
    enum State { OPEN, CLOSED }

    /// EVENTS
    /**
     *  @notice Event emitted when a user is registered as a voter
     */
    event VoterRegistered(uint _totalVoters);

    /**
     *  @notice Event emitted when an Election is created by the owner
     */
    event ElectionCreated(
        uint _electionID,
        uint _createTime,
        uint _endTime,
        string _title,
        string _description,
        address[] _candidates
    );

    /**
     *  @notice Event emitted when an Election is finished
     */
    event ElectionFinished(uint _electionID, uint[] _counters, address[] _candidates);

    /**
     *  @notice Event emitted when an vote is casted
     */
    event VoteCasted(uint _electionID, address _choice);

    /// MODIFIERS
    /**
     *  @notice Modifier function that verifies the valid status of the candidates
     *  @notice The candidates has to be registered in the System, and can only be 5 or less
     */
    modifier candidatesVerification(address[] memory _candidates) {
        require(_candidates.length > 0 && _candidates.length <= 5, "Wrong number of candidates.");

        for(uint i = 0; i < _candidates.length; i ++) {
            require(bytes(voters[_candidates[i]].voterName).length != 0, "Candidate not registered.");
        }

        _;
    }

    /**
     *  @notice Modifier function that verifies the valid status of the choice
     *  @notice The choice cannot be the same as msg.sender and has to be in the candidates array of the election
     *  @notice Every voter can only vote once per election
     */
    modifier choiceVerification(uint _electionID, address _candidate) {
        require(_candidate != msg.sender, "You cannot vote for yourself.");
        require(votes[_electionID][voters[msg.sender].uid].voterUID == 0, "You can only vote once per election.");

        bool found = false;

        for (uint i = 0; i < elections[_electionID].candidates.length; i++) {
            if (_candidate == elections[_electionID].candidates[i]) {
                found = true;
            }
        }

        require(found, "This person is not a candidate in this election.");

        _;
    }

    /**
     *  @notice Modifier function that verifies if the voter exist in the system
     */
    modifier exist(address _voter) {
        require(bytes(voters[_voter].voterName).length != 0, "The user is not registered in the system.");
        _;
    }

    /**
     *  @notice Modifier function that verifies if the voter doesn't exist in the system
     */
    modifier notExist(address _voter) {
        require(bytes(voters[_voter].voterName).length == 0, "The user is already registered in the system.");
        _;
    }

    /**
     *  @notice Modifier function that verifies if the election has not ended yet
     */
    modifier onlyBefore(uint _electionID) {
        require(elections[_electionID].endTime > block.timestamp, "The time for vote has finished.");
        _;
    }

    /**
     *  @notice Modifier function that verifies if the election has ended already
     */
    modifier onlyAfter(uint _electionID) {
        require(elections[_electionID].endTime < block.timestamp, "The time for vote hasn't finished.");
        _;
    }

    /**
     *  @notice Modifier function that verifies if the election is open
     */
    modifier onlyOpen(uint _electionID) {
        require(elections[_electionID].state == State.OPEN, "Election has already been closed.");
        _;
    }

    /// FUNCTIONS
    /**
     *  @notice Constructor function that initialice the contract and register the owner as first voter
     *  @param _ownerName must be an string with length > 0, wich will be used to register the owner as a voter
     */
    constructor(string memory _ownerName) {
        register(_ownerName);
    }

    /**
     *  @notice Function that allows to register a voter with a name
     *  @dev Every address could only call this function once
     *  @param _voterName must be an string with length > 0
     */
    function register(string memory _voterName) public notExist(msg.sender) {
        require(bytes(_voterName).length != 0, "You have to provide a name.");
    
        totalVoters++;
        Voter memory newVoter;
        newVoter.uid = totalVoters;
        newVoter.voterName = _voterName;
        voters[msg.sender] = newVoter;
        
        emit VoterRegistered(totalVoters);
    }

    /**
     *  @notice Function that allows to the Owner create an election
     *  @param _candidates must be an array with 0 < length <= 5 of addresses registered in the System
     *  @param _title must be an String with the Title of the election.
     *  @param _description must be an String with the Description of the election.
     */
    function createNewElection(
        address[] memory _candidates,
        string memory _title,
        string memory _description
    )
        public
        onlyOwner
        candidatesVerification(_candidates)
    {
        uint[] memory _counters = new uint[](_candidates.length);

        totalElections++;
        Election memory newElection;
        newElection.uid = totalElections;
        newElection.endTime = block.timestamp + 1 weeks;
        newElection.totalVotes = 0;
        newElection.counters = _counters;
        newElection.title = _title;
        newElection.description = _description;
        newElection.candidates = _candidates;
        newElection.state = State.OPEN;
        elections[totalElections] = newElection;

        emit ElectionCreated(totalElections, block.timestamp, newElection.endTime, _title, _description, _candidates);
    }

    /**
     *  @notice Function that allows the user vote in an election
     *  @dev Every address could only call this function once for every election
     *  @param _electionID must be an integer representing the ID of the election created by the owner
     *  @param _choice is the address of the account who the user wants to win the election
     */
    function doVote(uint _electionID, address _choice)
        public
        nonReentrant
        exist(msg.sender)
        onlyBefore(_electionID)
        choiceVerification(_electionID, _choice)
    {
        Vote memory newVote;
        newVote.choice = _choice;
        newVote.voterUID = voters[msg.sender].uid;
        votes[_electionID][newVote.voterUID] = newVote;
        
        for(uint i = 0; i < elections[_electionID].candidates.length; i++) {
            if (elections[_electionID].candidates[i] == _choice) {
                elections[_electionID].counters[i]++;
                elections[_electionID].totalVotes++;
            }
        }

        emit VoteCasted(_electionID, _choice);
    }

    /**
     *  @notice Function that allows the owner to close the election
     *  @notice Every election can be closed only 1 week after his start date
     *  @param _electionID must be an integer representing the ID of the election created by the owner
     */
    function endElection(uint _electionID)
        public
        onlyOwner
        onlyOpen(_electionID)
        onlyAfter(_electionID)
    {
        elections[_electionID].state = State.CLOSED;

        address[] memory candidates = elections[_electionID].candidates;

        emit ElectionFinished(_electionID, elections[_electionID].counters, candidates);
    }

    function getCounterElection(uint _electionID, uint index) public view returns (uint) {
        return elections[_electionID].counters[index];
    }

    function getCandidateElection(uint _electionID, uint index) public view returns (address) {
        return elections[_electionID].candidates[index];
    }
}