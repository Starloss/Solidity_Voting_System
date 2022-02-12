const { ethers, upgrades } = require("hardhat");

async function main() {
  const votingSystemFactory = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await upgrades.deployProxy(votingSystemFactory, ["Owner First Name"]);
  await votingSystem.deployed();
  console.log("VotingSystem deployed to:", votingSystem.address);
}

main();