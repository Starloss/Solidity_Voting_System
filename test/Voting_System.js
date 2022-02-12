const { expect } = require("chai");
const { ethers, network, upgrades } = require("hardhat");

describe("Upgrading Voting System", () => {
    it("Should let upgrade the contract", async () => {
        const votingSystemFactory = await ethers.getContractFactory("VotingSystem");
        const votingSystemFactoryV2 = await ethers.getContractFactory("VotingSystemV2");
    
        const instance = await upgrades.deployProxy(votingSystemFactory, ["First Owner Name"]);
        const upgraded = await upgrades.upgradeProxy(instance.address, votingSystemFactoryV2);
        [owner, _] = await ethers.getSigners();
    
        const ownerVoter = await upgraded.voters(owner.address);
        expect(ownerVoter.voterName).to.equal("First Owner Name");
    });
});

describe("Voting System contract", () => {
    let votingSystemFactory, VotingSystem, owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9;

    beforeEach(async () => {
        votingSystemFactory = await ethers.getContractFactory("VotingSystem");
        VotingSystem = await upgrades.deployProxy(votingSystemFactory, ["First Owner Name"]);
        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, _] = await ethers.getSigners();
    });

    describe("Deployment", () => {
        it("Should set the right owner", async () => {
            expect(await VotingSystem.owner()).to.equal(owner.address);
        });

        it("Should set the owner as the first voter", async () => {
            const ownerVoter = await VotingSystem.voters(owner.address);
            expect(ownerVoter.uid).to.equal(1);
            expect(ownerVoter.voterName).to.equal("First Owner Name");
        });
    });

    describe("User Register", () => {
        it("Should let register to all users", async () => {
            await VotingSystem.connect(addr1).register("Alice");
            const addr1Voter = await VotingSystem.voters(addr1.address);
            expect(addr1Voter.uid).to.equal(2);
            expect(addr1Voter.voterName).to.equal("Alice");

            await VotingSystem.connect(addr2).register("Bob");
            const addr2Voter = await VotingSystem.voters(addr2.address);
            expect(addr2Voter.uid).to.equal(3);
            expect(addr2Voter.voterName).to.equal("Bob");

            await VotingSystem.connect(addr3).register("Carl");
            const addr3Voter = await VotingSystem.voters(addr3.address);
            expect(addr3Voter.uid).to.equal(4);
            expect(addr3Voter.voterName).to.equal("Carl");

            await VotingSystem.connect(addr4).register("Dave");
            const addr4Voter = await VotingSystem.voters(addr4.address);
            expect(addr4Voter.uid).to.equal(5);
            expect(addr4Voter.voterName).to.equal("Dave");

            await VotingSystem.connect(addr5).register("Emily");
            const addr5Voter = await VotingSystem.voters(addr5.address);
            expect(addr5Voter.uid).to.equal(6);
            expect(addr5Voter.voterName).to.equal("Emily");

            await VotingSystem.connect(addr6).register("Fran");
            const addr6Voter = await VotingSystem.voters(addr6.address);
            expect(addr6Voter.uid).to.equal(7);
            expect(addr6Voter.voterName).to.equal("Fran");

            await VotingSystem.connect(addr7).register("Ginna");
            const addr7Voter = await VotingSystem.voters(addr7.address);
            expect(addr7Voter.uid).to.equal(8);
            expect(addr7Voter.voterName).to.equal("Ginna");

            await VotingSystem.connect(addr8).register("Homer");
            const addr8Voter = await VotingSystem.voters(addr8.address);
            expect(addr8Voter.uid).to.equal(9);
            expect(addr8Voter.voterName).to.equal("Homer");

            await VotingSystem.connect(addr9).register("Iris");
            const addr9Voter = await VotingSystem.voters(addr9.address);
            expect(addr9Voter.uid).to.equal(10);
            expect(addr9Voter.voterName).to.equal("Iris");
        });

        it("Should fail if some address tries to register twice", async () => {
            await VotingSystem.connect(addr1).register("Alice");
            const addr1Voter = await VotingSystem.voters(addr1.address);
            expect(addr1Voter.voterName).to.equal("Alice");

            await expect(
                VotingSystem
                .connect(addr1)
                .register("Alice")
            )
            .to
            .be
            .revertedWith("The user is already registered in the system.");
        });

        it("Should fail if some address tries to register without a name", async () => {
            await expect(
                VotingSystem
                .connect(addr1)
                .register("")
            )
            .to
            .be
            .revertedWith("You have to provide a name.");
        });
    });

    describe("Elections", () => {
        beforeEach("Registering some users", async () => {
            await VotingSystem.connect(addr1).register("Alice");
            await VotingSystem.connect(addr2).register("Bob");
            await VotingSystem.connect(addr3).register("Carl");
            await VotingSystem.connect(addr4).register("Dave");
            await VotingSystem.connect(addr5).register("Emily");
        });

        it("Should create an election correctly", async () => {
            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "First Election", "Test Election");
            const firstElection = await VotingSystem.elections(1);
            expect(firstElection.uid).to.be.equal(1);
            expect(firstElection.title).to.be.equal("First Election");
            expect(firstElection.description).to.be.equal("Test Election");
        });

        it("Should fail if none candidates has been provided", async () => {
            await expect(
                VotingSystem
                .createNewElection([], "First Election", "Test Election")
            )
            .to
            .be
            .revertedWith("Wrong number of candidates.");
        });

        it("Should fail if have provided more than 5 candidates", async () => {
            await VotingSystem.connect(addr6).register("Fran");

            await expect(
                VotingSystem
                .createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address, addr6.address], "First Election", "Test Election")
            )
            .to
            .be
            .revertedWith("Wrong number of candidates.");
        });

        it("Should fail if some candidate is not registered yet", async () => {
            await expect(
                VotingSystem
                .createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr6.address], "First Election", "Test Election")
            )
            .to
            .be
            .revertedWith("Candidate not registered.");
        });

        it("Should end an election correctly", async () => {
            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "First Election", "Test Election");

            await network.provider.send("evm_increaseTime", [604800]);
            await network.provider.send("evm_mine");

            await VotingSystem.endElection(1);
            const firstElection = await VotingSystem.elections(1);
            expect(firstElection.state).to.be.equal(1);
        });

        it("Should fail if tried to end the election twice", async () => {
            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "First Election", "Test Election");

            await network.provider.send("evm_increaseTime", [604800]);
            await network.provider.send("evm_mine");

            await VotingSystem.endElection(1);

            await expect(
                VotingSystem
                .endElection(1)
            )
            .to
            .be
            .revertedWith("Election has already been closed.");
        });

        it("Should fail if tried to end the election before endTime", async () => {
            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "First Election", "Test Election");

            await expect(
                VotingSystem
                .endElection(1)
            )
            .to
            .be
            .revertedWith("The time for vote hasn't finished.");
        });
    });

    describe("Voting System", () => {
        beforeEach("Setting up all registers and elections", async () => {
            await VotingSystem.connect(addr1).register("Alice");
            await VotingSystem.connect(addr2).register("Bob");
            await VotingSystem.connect(addr3).register("Carl");
            await VotingSystem.connect(addr4).register("Dave");
            await VotingSystem.connect(addr5).register("Emily");

            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "First Election", "Test Election");
            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "Second Election", "Test Election");
            await VotingSystem.createNewElection([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address], "Third Election", "Test Election");
        });

        it("Should let all registered addresses to vote in all elections.", async () => {
            await VotingSystem.connect(addr1).doVote(1, addr2.address);
            await VotingSystem.connect(addr2).doVote(1, addr1.address);
            await VotingSystem.connect(addr3).doVote(1, addr1.address);
            await VotingSystem.connect(addr4).doVote(1, addr3.address);
            await VotingSystem.connect(addr5).doVote(1, addr4.address);
            
            const firstElection = await VotingSystem.elections(1);

            expect(firstElection.totalVotes).to.be.equal(5);
            expect(await VotingSystem.getCounterElection(1, 0)).to.be.equal(2);
            expect(await VotingSystem.getCounterElection(1, 1)).to.be.equal(1);
            expect(await VotingSystem.getCounterElection(1, 2)).to.be.equal(1);
            expect(await VotingSystem.getCounterElection(1, 3)).to.be.equal(1);
            expect(await VotingSystem.getCounterElection(1, 4)).to.be.equal(0);

            await VotingSystem.connect(addr1).doVote(2, addr3.address);
            await VotingSystem.connect(addr2).doVote(2, addr3.address);
            await VotingSystem.connect(addr3).doVote(2, addr1.address);
            await VotingSystem.connect(addr4).doVote(2, addr3.address);
            await VotingSystem.connect(addr5).doVote(2, addr4.address);
            
            const secondElection = await VotingSystem.elections(2);

            expect(secondElection.totalVotes).to.be.equal(5);
            expect(await VotingSystem.getCounterElection(2, 0)).to.be.equal(1);
            expect(await VotingSystem.getCounterElection(2, 1)).to.be.equal(0);
            expect(await VotingSystem.getCounterElection(2, 2)).to.be.equal(3);
            expect(await VotingSystem.getCounterElection(2, 3)).to.be.equal(1);
            expect(await VotingSystem.getCounterElection(2, 4)).to.be.equal(0);

            await VotingSystem.connect(addr1).doVote(3, addr5.address);
            await VotingSystem.connect(addr2).doVote(3, addr5.address);
            await VotingSystem.connect(addr3).doVote(3, addr5.address);
            await VotingSystem.connect(addr4).doVote(3, addr5.address);
            await VotingSystem.connect(addr5).doVote(3, addr2.address);
            
            const thirdElection = await VotingSystem.elections(3);

            expect(thirdElection.totalVotes).to.be.equal(5);
            expect(await VotingSystem.getCounterElection(3, 0)).to.be.equal(0);
            expect(await VotingSystem.getCounterElection(3, 1)).to.be.equal(1);
            expect(await VotingSystem.getCounterElection(3, 2)).to.be.equal(0);
            expect(await VotingSystem.getCounterElection(3, 3)).to.be.equal(0);
            expect(await VotingSystem.getCounterElection(3, 4)).to.be.equal(4);
        });

        it("Should fail if someone not registered tries to vote in an election", async () => {
            await expect(
                VotingSystem
                .connect(addr6)
                .doVote(1, addr2.address)
            )
            .to
            .be
            .revertedWith("The user is not registered in the system.");
        });

        it("Should fail if someone tries to vote after the endTime of the election", async () => {
            await network.provider.send("evm_increaseTime", [604800]);
            await network.provider.send("evm_mine");

            await expect(
                VotingSystem
                .connect(addr1)
                .doVote(1, addr2.address)
            )
            .to
            .be
            .revertedWith("The time for vote has finished.");
        });
    
        it("Should fail if someone tries to vote for himself", async () => {
            await expect(
                VotingSystem
                .connect(addr1)
                .doVote(1, addr1.address)
            )
            .to
            .be
            .revertedWith("You cannot vote for yourself.");
        });

        it("Should fail if someone tries to vote twice in an election", async () => {
            await VotingSystem.connect(addr1).doVote(1, addr2.address);

            await expect(
                VotingSystem
                .connect(addr1)
                .doVote(1, addr2.address)
            )
            .to
            .be
            .revertedWith("You can only vote once per election.");
        });

        it("Should fail if someone tries to vote for an address wich is not a candidate in an election", async () => {
            await expect(
                VotingSystem
                .connect(addr1)
                .doVote(1, addr6.address)
            )
            .to
            .be
            .revertedWith("This person is not a candidate in this election.");
        });
    });
});