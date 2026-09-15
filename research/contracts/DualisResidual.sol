// SPDX-License-Identifier: LicenseRef-Dualis-Residual-Draft
pragma solidity ^0.8.24;

/// @title DualisResidual
/// @notice Draft. Not deployed. Encodes the one worldwide residual.
/// Client keep: 81% year 1 → 100% year 5 of a MEASURED save.
/// Dualis remainder while insight earns it (10% work + 10% royalty).
/// No upfront. No private rate. No token. No scalp.
contract DualisResidual {
    address public immutable dualis;
    address public client;
    address public attestor;

    uint64 public saveOpenedAt;
    uint256 public measuredSave;
    bool public frozen;
    bool public opened;

    event Measured(uint256 amount, address attestor);
    event Split(uint256 toClient, uint256 toDualis, uint8 yearIndex);
    event Frozen(address by);
    event AttestorSet(address who);

    error NotParty();
    error FrozenErr();
    error NotOpen();
    error AlreadyOpen();
    error ZeroSave();
    error BadYear();

    modifier party() {
        if (msg.sender != dualis && msg.sender != client && msg.sender != attestor) revert NotParty();
        _;
    }

    constructor(address dualis_, address client_, address attestor_) {
        require(dualis_ != address(0) && client_ != address(0) && attestor_ != address(0), "zero");
        dualis = dualis_;
        client = client_;
        attestor = attestor_;
    }

    /// Client keep in bps. Y1 8100, then +475 bps/year to 10000 at Y5.
    function clientBps(uint8 yearIndex) public pure returns (uint16) {
        if (yearIndex > 4) return 10_000;
        return uint16(8100 + uint16(yearIndex) * 475);
    }

    function yearIndex() public view returns (uint8) {
        if (!opened || saveOpenedAt == 0) revert NotOpen();
        uint256 elapsed = block.timestamp - saveOpenedAt;
        uint256 y = elapsed / 365 days;
        if (y > 4) return 4;
        return uint8(y);
    }

    /// Only a measured save opens residual. Look stays off-chain at $0.
    function attestSave(uint256 amount) external {
        if (msg.sender != attestor) revert NotParty();
        if (frozen) revert FrozenErr();
        if (amount == 0) revert ZeroSave();
        if (opened) revert AlreadyOpen();
        measuredSave = amount;
        saveOpenedAt = uint64(block.timestamp);
        opened = true;
        emit Measured(amount, msg.sender);
    }

    function previewSplit() public view returns (uint256 toClient, uint256 toDualis, uint8 y) {
        if (!opened) revert NotOpen();
        y = yearIndex();
        uint256 keep = (measuredSave * clientBps(y)) / 10_000;
        return (keep, measuredSave - keep, y);
    }

    /// Pull-pattern. No silent drain. Frozen stops both sides.
    function release() external party {
        if (frozen) revert FrozenErr();
        if (!opened) revert NotOpen();
        (uint256 toClient, uint256 toDualis, uint8 y) = previewSplit();
        uint256 payC = toClient > address(this).balance ? address(this).balance : toClient;
        uint256 payD = address(this).balance - payC;
        if (payD > toDualis) {
            payD = toDualis;
            payC = address(this).balance - payD;
        }
        if (payC > 0) {
            (bool a, ) = client.call{value: payC}("");
            require(a, "client");
        }
        if (payD > 0) {
            (bool b, ) = dualis.call{value: payD}("");
            require(b, "dualis");
        }
        emit Split(payC, payD, y);
    }

    function freeze() external party {
        frozen = true;
        emit Frozen(msg.sender);
    }

    function setAttestor(address next) external {
        if (msg.sender != dualis && msg.sender != client) revert NotParty();
        if (frozen) revert FrozenErr();
        require(next != address(0), "zero");
        attestor = next;
        emit AttestorSet(next);
    }

    receive() external payable {}
}
