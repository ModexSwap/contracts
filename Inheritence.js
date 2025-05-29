const { expect } = require("chai");

const { ethers, provider } = require("hardhat");

describe("Inheritance Smart Contract", function () {
  let Inheritance;
  let inheritance;
  let owner;
  let heir;
  let newHeir;
  let accounts;

  // `beforeEach` is run before each test, deploying a new contract every time
  beforeEach(async function () {
    // Get the ContractFactory and signers here
    Inheritance = await ethers.getContractFactory("Inheritance");
    [owner, heir, newHeir, ...accounts] = await ethers.getSigners();

    // Deploy a new Inheritance contract before each test
    inheritance = await Inheritance.deploy(heir.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await inheritance.owner()).to.equal(owner.address);
    });

    it("Should set the right heir", async function () {
      expect(await inheritance.heir()).to.equal(heir.address);
    });

    it("Should receive and store ETH correctly", async function () {
      const transaction = { to: inheritance.address, value: ethers.utils.parseEther("1.0") };
      await owner.sendTransaction(transaction);
      expect(await provider.getBalance(inheritance.address)).to.equal(ethers.utils.parseEther("1.0"));
    });
  });

  describe("Withdrawals", function () {
    it("Should allow the owner to withdraw", async function () {
      // Send 1 ether to the contract for testing withdrawal
      await owner.sendTransaction({ to: inheritance.address, value: ethers.utils.parseEther("1.0") });

      // Attempt withdrawal
      await inheritance.withdraw(ethers.utils.parseEther("1.0"));

      // Check if the contract balance has been updated
      expect(await provider.getBalance(inheritance.address)).to.equal(0);
    });

    it("Should reset the withdrawal timer when the owner withdraws", async function () {
      // Assuming the initial `lastWithdrawal` state is set by the constructor
      const initialTimestamp = await inheritance.lastWithdrawal();

      // Move time forward by 15 days
      await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Owner withdraws, which should reset the withdrawal timer
      await inheritance.withdraw(0);

      // The `lastWithdrawal` time should be greater than the initialTimestamp
      expect(await inheritance.lastWithdrawal()).to.be.gt(initialTimestamp);
    });

    it("Should emit a Withdrawal event when the owner withdraws", async function () {
      // Send some ether to the contract
      await owner.sendTransaction({ to: inheritance.address, value: ethers.utils.parseEther("0.5") });

      // Expect the withdraw to emit an event
      await expect(inheritance.withdraw(ethers.utils.parseEther("0.5")))
        .to.emit(inheritance, 'Withdrawal')
        .withArgs(owner.address, ethers.utils.parseEther("0.5"));
    });
  });

  describe("Inheritance", function () {
    it("Should transfer ownership if the owner does not withdraw for more than 1 month", async function () {
      // Move time forward to simulate 1 month of inactivity
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Heir checks inheritance and should be able to claim ownership
      await inheritance.connect(heir).checkInheritance();
      expect(await inheritance.owner()).to.equal(heir.address);
    });
  });

  describe("Heir Management", function () {
    beforeEach(async function () {
        // Send some ether to the contract to ensure it has a balance
        await owner.sendTransaction({ to: inheritance.address, value: ethers.utils.parseEther("1.0") });
    });

    it("Should allow the heir to designate a new heir", async function () {
        // Heir designates a new heir
        await inheritance.connect(heir).designateNewHeir(newHeir.address);
        // Check if the new heir is set correctly
        expect(await inheritance.heir()).to.equal(newHeir.address);
    });

    it("Should not allow non-heirs to designate a new heir", async function () {
        // Attempt to designate a new heir from an account that is not the current heir
        await expect(
            inheritance.connect(accounts[0]).designateNewHeir(newHeir.address)
        ).to.be.revertedWith("Only the heir can call this function.");
    });

    it("Should emit a HeirChanged event when a new heir is designated", async function () {
        // Expect the designateNewHeir to emit an event
        await expect(inheritance.connect(heir).designateNewHeir(newHeir.address))
            .to.emit(inheritance, 'HeirChanged')
            .withArgs(heir.address, newHeir.address);
    });

    it("Should not allow setting the current owner or the current heir as the new heir", async function () {
        // Attempt to set the current owner as the new heir
        await expect(
            inheritance.connect(heir).designateNewHeir(owner.address)
        ).to.be.revertedWith("New heir cannot be the current owner.");

        // Attempt to set the current heir as the new heir (to themselves)
        await expect(
            inheritance.connect(heir).designateNewHeir(heir.address)
        ).to.be.revertedWith("New heir cannot be the current heir.");
    });

    it("Should not allow setting the zero address as the new heir", async function () {
        // Attempt to set the zero address as the new heir
        await expect(
            inheritance.connect(heir).designateNewHeir(ethers.constants.AddressZero)
        ).to.be.revertedWith("New heir cannot be the zero address.");
    });
});


});


