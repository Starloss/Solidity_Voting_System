// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract VotingSystem {

  // VARIABLES
  struct vote {
    address voterAddress;
    bool choice;
  }

  struct voter {
    string voterName;
    bool voted;
  }

  uint private countResult = 0;
  uint public finalResult = 0;
  uint public totalVoter = 0;
  uint public totalVote = 0;

  address public ballotOfficialAddress;
  
  string public ballotOfficialName;
  string public proposal;

  mapping(uint => vote) private votes;
  mapping(address => voter) public voterRegister;

  enum State { CREATED, VOTING, ENDED }

  State public state;

  // MODIFIERS
  modifier condition(bool _condition) { require(_condition); _; }
  modifier onlyOfficial() { require(msg.sender == ballotOfficialAddress); _; }
  modifier inState(State _state) { require(state == _state); _; }
  modifier exist(address _voter) { require(bytes(voterRegister[_voter].voterName).length != 0); _; }
  modifier notExist(address _voter) { require(bytes(voterRegister[_voter].voterName).length == 0); _; }

  // FUNCTIONS
  constructor(string memory _ballotOfficialName, string memory _proposal) {
    ballotOfficialAddress = msg.sender;
    ballotOfficialName = _ballotOfficialName;
    proposal = _proposal;
    state = State.CREATED;
  }

  function addVoter(address _voterAddress, string memory _voterName) public inState(State.CREATED) notExist(_voterAddress) onlyOfficial {
    require(bytes(_voterName).length != 0);
  
    voter memory v;
    v.voterName = _voterName;
    v.voted = false;
    voterRegister[_voterAddress] = v;
    totalVoter++;
  }

  function startVote() public inState(State.CREATED) onlyOfficial {
    state = State.VOTING;
  }

  function doVote(bool _choice) public inState(State.VOTING) exist(msg.sender) {
    require(!voterRegister[msg.sender].voted);

    voterRegister[msg.sender].voted = true;
    vote memory v;
    v.voterAddress = msg.sender;
    v.choice = _choice;

    if (_choice) {
      countResult++;
    }
    votes[totalVote] = v;
    totalVote++;
  }

  function endVote() public inState(State.VOTING) onlyOfficial {
    state = State.ENDED;
    finalResult = countResult;
  }
}