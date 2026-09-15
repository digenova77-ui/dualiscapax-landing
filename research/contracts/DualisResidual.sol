// SPDX-License-Identifier: LicenseRef-Dualis-Residual-Draft
pragma solidity ^0.8.24;

/// 90-day free break anytime after sign.
/// Break or late exit → live modeling OFF. Mask may remain off-chain. Feed does not.
contract DualisResidual {
    uint256 public constant WINDOW = 90 days;

    address public immutable dualis;
    address public client;
    address public attestor;
    uint64 public signedAt;
    uint64 public openedAt;
    uint256 public save;
    bool public frozen;
    bool public signed;
    bool public live; // ongoing Dualis modeling of their losses

    event Signed();
    event Opened(uint256 save);
    event Paid(uint256 toClient, uint256 toDualis);
    event Broke(bool inWindow);
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

    function inWindow() public view returns (bool) {
        return signed && block.timestamp < uint256(signedAt) + WINDOW;
    }

    function sign() external {
        require(msg.sender == client && !signed && !frozen);
        signed = true;
        live = true;
        signedAt = uint64(block.timestamp);
        emit Signed();
    }

    function open(uint256 measured) external {
        require(live && msg.sender == attestor && signed && !frozen && openedAt == 0 && measured > 0);
        save = measured;
        openedAt = uint64(block.timestamp);
        emit Opened(measured);
    }

    function pay() external {
        require(live && !frozen && openedAt != 0 && address(this).balance > 0);
        require(msg.sender == dualis || msg.sender == client || msg.sender == attestor);
        _split(keepBps());
    }

    /// Client may break anytime after sign.
    /// 90 days: pot back to client, live OFF.
    /// After 90: residual slice to Dualis, live OFF.
    function breakOff() external {
        require(msg.sender == client && signed && live && !frozen);
        live = false;
        frozen = true;
        bool early = inWindow();
        if (early) {
            uint256 pot = address(this).balance;
            if (pot > 0) {
                (bool x,) = client.call{value: pot}("");
                require(x);
            }
        } else if (address(this).balance > 0 && openedAt != 0) {
            _split(keepBps());
        }
        emit Broke(early);
    }

    function freeze() external {
        require(msg.sender == dualis || msg.sender == client || msg.sender == attestor);
        frozen = true;
        emit Frozen();
    }

    function _split(uint16 bps) internal {
        uint256 pot = address(this).balance;
        uint256 c = pot * bps / 10_000;
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

    receive() external payable {}
}
