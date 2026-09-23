// SPDX-License-Identifier: LicenseRef-eFuse-Sandbox
pragma solidity ^0.8.24;

/// eFuse sandbox token. Not issued. Not listed. Not a mainnet address.
/// Fixed supply. No later mint. This contract must not hold other people's money as a vault.
/// DualisCapax Inc is not a payee here.
contract EFuseToken {
    string public constant name = "eFuse";
    string public constant symbol = "EFUSE";
    uint8 public constant decimals = 18;

    uint256 public immutable totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 genesis, address founder) {
        require(genesis > 0, "genesis");
        require(founder != address(0), "founder");
        totalSupply = genesis;
        balanceOf[founder] = genesis;
        emit Transfer(address(0), founder, genesis);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        return _move(msg.sender, to, value);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "allowance");
        if (allowed != type(uint256).max) {
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
        }
        return _move(from, to, value);
    }

    function _move(address from, address to, uint256 value) internal returns (bool) {
        require(to != address(0), "to");
        require(to != address(this), "no pot");
        uint256 have = balanceOf[from];
        require(have >= value, "balance");
        unchecked {
            balanceOf[from] = have - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
        return true;
    }

    receive() external payable {
        revert("no pot");
    }

    fallback() external payable {
        revert("no pot");
    }
}
