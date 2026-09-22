// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// DualisCapax DCLM vault. PAPER until Bind-continue.
/// Starts paused. routeUsdc is irisAdmin-only. Do not deploy funded on mainnet.
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
    error ZeroRecipient();

    event EmergencyPaused(address indexed admin, string reason);
    event UnpausedWithProof(int64 alpha, int64 delta, bytes32 postStateDigest);
    event RouteUsdc(address indexed recipient, uint256 amount);

    constructor(address _usdc, address _verifier, bytes32 _imageId, address _irisAdmin) {
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
            alpha := signextend(7, shrink_and_shift(sload(_slot0.slot), 8, 0xffffffffffffffff))
            function shrink_and_shift(val, shiftAmount, mask) -> res {
                res := and(shr(shiftAmount, val), mask)
            }
        }
    }

    function lastVerifiedDelta() public view returns (int64 delta) {
        assembly {
            delta := signextend(7, shrink_and_shift(sload(_slot0.slot), 72, 0xffffffffffffffff))
            function shrink_and_shift(val, shiftAmount, mask) -> res {
                res := and(shr(shiftAmount, val), mask)
            }
        }
    }

    function emergencyPause(string calldata reason) external {
        if (msg.sender != irisAdmin) revert Unauthorized();
        assembly {
            let currentSlot := sload(_slot0.slot)
            let updatedSlot := or(currentSlot, 0x01)
            sstore(_slot0.slot, updatedSlot)
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
        if (recipient == address(0)) revert ZeroRecipient();
        bool success = IERC20(usdcToken).transfer(recipient, amount);
        if (!success) revert TransferFailed();
        emit RouteUsdc(recipient, amount);
    }
}
