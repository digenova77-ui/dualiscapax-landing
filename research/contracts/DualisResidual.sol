// SPDX-License-Identifier: LicenseRef-Dualis-Residual-Draft
pragma solidity ^0.8.24;

/// Look off-chain. Sign on-chain. 90 days free exit.
/// After that, exit pays Dualis the residual slice (keepBps remainder), not the whole save.
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

    event Signed();
    event Opened(uint256 save);
    event Paid(uint256 toClient, uint256 toDualis);
    event Exited(bool inWindow, uint256 toClient, uint256 toDualis);
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
        signedAt = uint64(block.timestamp);
        emit Signed();
    }

    function open(uint256 measured) external {
        require(msg.sender == attestor && signed && !frozen && openedAt == 0 && measured > 0);
        save = measured;
        openedAt = uint64(block.timestamp);
        emit Opened(measured);
    }

    function pay() external {
        require(!frozen && openedAt != 0 && address(this).balance > 0);
        require(msg.sender == dualis || msg.sender == client || msg.sender == attestor);
        _split(keepBps());
    }

    /// Client may leave anytime after sign.
    /// Inside 90 days: pot returns to client.
    /// After 90: Dualis keeps the residual slice; client keeps the rest.
    function exit() external {
        require(msg.sender == client && signed && !frozen && address(this).balance > 0);
        bool early = inWindow();
        if (early) {
            uint256 pot = address(this).balance;
            (bool x,) = client.call{value: pot}("");
            require(x);
            frozen = true;
            emit Exited(true, pot, 0);
        } else {
            _split(keepBps());
            frozen = true;
            emit Exited(false, 0, 0);
        }
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
