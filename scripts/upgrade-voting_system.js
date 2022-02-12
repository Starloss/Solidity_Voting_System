const { ethers, upgrades } = require("hardhat");

async function main() {
  const votingSystemFactoryV2 = await ethers.getContractFactory("VotingSystemV2");
  const votingSystem = await upgrades.upgradeProxy(VOTINGSYSTEM_ADDRESS, votingSystemFactoryV2);
  console.log("VotingSystem upgraded");
}

main();