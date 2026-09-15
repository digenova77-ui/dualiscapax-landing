// SPDX-License-Identifier: LicenseRef-Dualis-Residual-Draft
pragma solidity ^0.8.24;

/// Before sign: walk free, live dies.
/// After sign: bound until endsAt. No early kill.
contract DualisResidual {
    address public immutable dualis;
    address public client;
    address public attestor;
    uint64 public signedAt;
    uint64 public endsAt;
    uint64 public openedAt;
    uint256 public save;
    bool public frozen;
    bool public signed;
    bool public live;

    event Signed(uint64 endsAt);
    event Opened(uint256 save);
    event Paid(uint256 toClient, uint256 toDualis);
    event Walked();
    event Frozen();

    constructor(address d, address c, address a) {
        require(d != address(0) && c != address(0) && a != address(0));
        dualis = d;
        client = c;
        attestor = a;
        live = true; // Look / pre-sign modeling may run
    }

    function keepBps() public view returns (uint16) {
        if (openedAt == 0) return 8100;
        uint256 y = (block.timestamp - openedAt) / 365 days;
        if (y >= 4) return 10_000;
        return uint16(8100 + y * 475);
    }

    function active() public view returns (bool) {
        return signed && live && !frozen && block.timestamp <= endsAt;
    }

    /// Client walks before sign. Live modeling off. Mask may remain off-chain.
    function walk() external {
        require(msg.sender == client && !signed);
        live = false;
        frozen = true;
        uint256 pot = address(this).balance;
        if (pot > 0) {
            (bool x,) = client.call{value: pot}("");
            require(x);
        }
        emit Walked();
    }

    /// Stamp the end. After this, no walk(). Runs until endsAt.
    function sign(uint64 end) external {
        require(msg.sender == client && !signed && live && !frozen);
        require(end > block.timestamp);
        signed = true;
        signedAt = uint64(block.timestamp);
        endsAt = end;
        emit Signed(end);
    }

    function open(uint256 measured) external {
        require(active() && msg.sender == attestor && openedAt == 0 && measured > 0);
        save = measured;
        openedAt = uint64(block.timestamp);
        emit Opened(measured);
    }

    function pay() external {
        require(active() && openedAt != 0 && address(this).balance > 0);
        require(msg.sender == dualis || msg.sender == client || msg.sender == attestor);
        uint256 pot = address(this).balance;
        uint256 c = pot * keepBps() / 10_000;
        uint256 d = pot - c;
        if (c > 0) {
            (bool x,) = client.call{value: c}("");
            require(x);
        }
        if (d > 0) {
            (bool y,) = dualis.call{value: d}("");
            require(y);
        }
        emit Paid(c, d);
    }

    /// Dispute the measure. Does not end a signed term early.
    function freeze() external {
        require(msg.sender == dualis || msg.sender == client || msg.sender == attestor);
        frozen = true;
        emit Frozen();
    }

    receive() external payable {}
}
