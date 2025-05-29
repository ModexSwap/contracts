// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Inheritance {
    address public owner;
    address public heir;
    uint256 public lastWithdrawal;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event HeirChanged(address indexed previousHeir, address indexed newHeir);
    event Withdrawal(address indexed by, uint256 amount);
    event FundsReceived(address indexed from, uint256 amount);

    constructor(address _heir) {
        require(_heir != address(0), "Heir cannot be the zero address.");
        owner = msg.sender;
        heir = _heir;
        lastWithdrawal = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    modifier onlyHeir() {
        require(msg.sender == heir, "Only the heir can call this function.");
        _;
    }

    function withdraw(uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance in contract.");

        // Emit event for withdrawal
        emit Withdrawal(msg.sender, _amount);

        // Using call to send ETH and prevent DoS
        (bool sent, ) = payable(owner).call{value: _amount}("");
        require(sent, "Failed to send Ether");
        
        // Reset the withdrawal timer
        lastWithdrawal = block.timestamp;
    }

    function checkInheritance() public {
        require(block.timestamp - lastWithdrawal > 30 days, "The withdrawal period has not expired.");
        require(msg.sender == heir, "Only the heir can take over after the period has expired.");

        // Emit event for ownership transfer
        emit OwnershipTransferred(owner, heir);
        owner = heir;
    }

    function designateNewHeir(address _newHeir) public onlyHeir {
        require(_newHeir != address(0), "New heir cannot be the zero address.");
        require(_newHeir != owner, "New heir cannot be the current owner.");
        require(_newHeir != heir, "New heir cannot be the current heir.");

        // Emit event for heir change
        emit HeirChanged(heir, _newHeir);
        heir = _newHeir;
    }

    // Fallback function to accept ETH with logging
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    // In case of sending ETH with data, logging included
    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
