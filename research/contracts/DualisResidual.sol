// SPDX-License-Identifier: LicenseRef-Dualis-Residual-Draft
pragma solidity ^0.8.24;

/// One save. One split. Nothing else.
/// Client keep 81% Y1 → 100% Y5. Dualis remainder (10% + 10%) while it lasts.
contract DualisResidual {
    address public immutable dualis;
    address public client;
    address public attestor;
    uint64 public openedAt;
    uint256 public save;
    bool public frozen;

    event Opened(uint256 save);
    event Paid(uint256 toClient, uint256 toDualis);
    event Frozen();

    constructor(address d, address c, address a) {
        require(d != address(0) && c != address(0) && a != address(0));
        dualis = d;
        client = c;
        attestor = a;
    }

    function keepBps() public view returns (uint16) {
        if (openedAt == 0) return 8100;
        uint256 y = (block.timestamp - openedAt) / 365 days;
        if (y >= 4) return 10_000;
        return uint16(8100 + y * 475);
    }

    function open(uint256 measured) external {
        require(msg.sender == attestor && !frozen && openedAt == 0 && measured > 0);
        save = measured;
        openedAt = uint64(block.timestamp);
        emit Opened(measured);
    }

    function pay() external {
        require(!frozen && openedAt != 0 && address(this).balance > 0);
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

    function freeze() external {
        require(msg.sender == dualis || msg.sender == client || msg.sender == attestor);
        frozen = true;
        emit Frozen();
    }

    receive() external payable {}
}
