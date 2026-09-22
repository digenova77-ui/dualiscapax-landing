// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// DualisCapax DCLMVault — PAPER copy of the attached spec with fail-closed patches.
/// Do not deploy mainnet. Do not fund. See HOLES.md.

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IRiscZeroVerifier {
    function verify(bytes calldata seal, bytes32 imageId, bytes32 postStateDigest, bytes32 journalHash) external view returns (bool);
}

contract DCLMVault {
    uint256 private _slot0;

    address public immutable usdcToken;
    address public immutable verifier;
    bytes32 public immutable starkImageId;
    address public irisAdmin;

    error ContractIsPaused();
    error Unauthorized();
    error InvalidJournalLength();
    error InvalidSTARKProof();
    error TransferFailed();
    error ZeroAddress();

    event EmergencyPaused(address indexed admin, string reason);
    event UnpausedWithProof(int64 alpha, int64 delta, bytes32 postStateDigest);
    event RouteUsdc(address indexed admin, address indexed recipient, uint256 amount);

    constructor(address _usdc, address _verifier, bytes32 _imageId, address _irisAdmin) {
        if (_usdc == address(0) || _verifier == address(0) || _irisAdmin == address(0)) revert ZeroAddress();
        usdcToken = _usdc;
        verifier = _verifier;
        starkImageId = _imageId;
        irisAdmin = _irisAdmin;
        assembly {
            sstore(_slot0.slot, 0x01)
        }
    }

    function isPaused() public view returns (bool paused) {
        assembly {
            paused := and(sload(_slot0.slot), 0xff)
        }
    }

    function lastVerifiedAlpha() public view returns (int64 alpha) {
        assembly {
            alpha := signextend(7, and(shr(8, sload(_slot0.slot)), 0xffffffffffffffff))
        }
    }

    function lastVerifiedDelta() public view returns (int64 delta) {
        assembly {
            delta := signextend(7, and(shr(72, sload(_slot0.slot)), 0xffffffffffffffff))
        }
    }

    function emergencyPause(string calldata reason) external {
        if (msg.sender != irisAdmin) revert Unauthorized();
        assembly {
            let currentSlot := sload(_slot0.slot)
            sstore(_slot0.slot, or(currentSlot, 0x01))
        }
        emit EmergencyPaused(msg.sender, reason);
    }

    function unpauseWithStarkProof(
        bytes calldata journal,
        bytes calldata seal,
        bytes32 postStateDigest
    ) external {
        if (journal.length != 64) revert InvalidJournalLength();

        bytes32 journalHash;
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, journal.offset, 64)
            if iszero(staticcall(gas(), 0x02, ptr, 64, ptr, 32)) {
                revert(0, 0)
            }
            journalHash := mload(ptr)
        }

        bool valid = IRiscZeroVerifier(verifier).verify(seal, starkImageId, postStateDigest, journalHash);
        if (!valid) revert InvalidSTARKProof();

        int64 alphaVal;
        int64 deltaVal;
        assembly {
            alphaVal := calldataload(journal.offset)
            deltaVal := calldataload(add(journal.offset, 32))
            let packed := or(shl(8, and(alphaVal, 0xffffffffffffffff)), shl(72, and(deltaVal, 0xffffffffffffffff)))
            sstore(_slot0.slot, packed)
        }

        emit UnpausedWithProof(alphaVal, deltaVal, postStateDigest);
    }

    function routeUsdc(address recipient, uint256 amount) external {
        if (msg.sender != irisAdmin) revert Unauthorized();
        if (isPaused()) revert ContractIsPaused();
        if (recipient == address(0) || amount == 0) revert TransferFailed();
        bool success = IERC20(usdcToken).transfer(recipient, amount);
        if (!success) revert TransferFailed();
        emit RouteUsdc(msg.sender, recipient, amount);
    }
}
