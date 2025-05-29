// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WhitelistClaim is Ownable {
    uint256 public _currentAirdropAmount = 0;
    mapping(address => bool) public _processedAirdrop;
    mapping(address => uint256) public _claimableAmount;
    event AirdropProcessed(address _recipient, uint256 _amount, uint256 _date);
    address public tokenAddress;

    constructor(address tokenAddress_) {
        tokenAddress = tokenAddress_;
    }

    function claimToken() external {
        address _recipient = msg.sender;
        require(
            _processedAirdrop[_recipient] == false,
            "Airdrop already Processed for this address"
        );

        require(
            _claimableAmount[_recipient] > 0,
            "No claimable amount for this address"
        );

        _processedAirdrop[_recipient] = true;
        require (IERC20(tokenAddress).transfer(msg.sender,  _claimableAmount[_recipient]));
        
        emit AirdropProcessed(
            _recipient,
            _claimableAmount[_recipient],
            block.timestamp
        );
        _claimableAmount[_recipient] = 0;
    }

    function setAirdropForAddresses(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external onlyOwner {
        require(
            _recipients.length == _amounts.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < _recipients.length; i++) {
            _claimableAmount[_recipients[i]] = _amounts[i];
            _processedAirdrop[_recipients[i]] == false;
        }
    }

    function setAirdropForAddress(
        address _recipient,
        uint256 _amount
    ) external onlyOwner {
        _claimableAmount[_recipient] = _amount;
        _processedAirdrop[_recipient] == false;
    }

    function getClaimableAmount(address _recipient) external view returns (uint256) {
        return _claimableAmount[_recipient];
    }

    function deposit(uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
    }
}
