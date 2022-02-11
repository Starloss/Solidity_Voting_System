/// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';

/** 
 *  @title A voting system
 *  @author Starloss
 */
contract VotingSystem is Ownable {

    /// VARIABLES
    /** 
     *  @notice Struct used to store the votes in the system
     */
    struct vote {
        uint voterUID;
        address choice;
    }

    /**
     *  @notice Struct used to store the voters in the system
     *  @notice Only can access to this data if you know the address
     *  @dev We need to improve the privacy of the voter
     */
    struct voter {
        uint uid;
        string voterName;
    }

    /**
     *  @notice Struct used to store the elections in the system
     */
    struct election {
        uint uid;
        uint endTime;
        uint[] counters;
        string title;
        string description;
        address[] candidates;
        mapping(uint => vote) votes;
        State state;
    }

    /**
     *  @notice Variables for keeping counts of voters and elections
     */
    uint public totalVoters = 0;
    uint public totalElections = 0;

    /**
     *  @notice Storage for voters and elections
     */
    mapping(address => voter) public voters;
    mapping(uint => election) public elections;

    /// STATES
    /**
     *  @notice Enum used for tracking the state of the election
     */
    enum State { CREATED, VOTING, ENDED }

    /// EVENTS
    /**
     *  @notice Event emitted when a user is registered as a voter
     */
    event VoterRegistered(uint _totalVoters);

    /**
     *  @notice Event emitted when an Election is created by the owner
     */
    event ElectionCreated(uint _electionID, uint _createTime, uint _endTime, string _title, string _description, address[] _candidates);

    /**
     *  @notice Event emitted when an Election is finished.
     */
    event ElectionFinished(uint _electionID, uint[] _counters, uint[] _candidates, address _winner);

    /**
     *  @notice Event emitted when an vote is casted.
     */
    event VoteCasted(uint _electionID, address _choise);

    /// MODIFIERS
    /**
     *  @notice Modifier function that verifies the valid status of the candidates
     *  @notice The candidates has to be registered in the System, and can only be 5 or less.
     */
    modifier candidatesVerification(address[] memory _candidates) {
        require(_candidates.length > 0 && _candidates.length <= 5, "Wrong number of candidates.");

        for(uint i = 0; i < _candidates.length; i ++) {
            require(bytes(voters[_candidates[i]].voterName).length != 0, "Candidate not registered.");
        }

        _;
    }

    /**
     *  @notice Modifier function that verifies if the voter exist in the system.
     */
    modifier exist(address _voter) {
        require(bytes(voters[_voter].voterName).length != 0);
        _;
    }

    /**
     *  @notice Modifier function that verifies if the voter doesn't exist in the system.
     */
    modifier notExist(address _voter) {
        require(bytes(voters[_voter].voterName).length == 0);
        _;
    }

    /// FUNCTIONS
    constructor(string memory _ownerName) {
        register(_ownerName, true);
    }

    function register(string memory _voterName, bool _valid) public notExist(msg.sender) {
        require(bytes(_voterName).length != 0 && _valid);
    
        voter memory v;
        v.voterName = _voterName;
        v.uid = totalVoters;
        voters[msg.sender] = v;
        totalVoters++;
        
        emit VoterRegistered(totalVoters);
    }

    function createNewVote(address[] memory _candidates)
        public
        onlyOwner
        candidatesVerification(_candidates)
    {

    }

    function doVote(uint _election, address _choise) public exist(msg.sender) {
    }
}