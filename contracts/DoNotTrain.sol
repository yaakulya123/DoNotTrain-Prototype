// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  DoNotTrain — On-chain opt-out registry for AI training data
/// @notice Creators register a SHA-256 + perceptual hash of their work to assert "do not train".
///         The blockchain is the vault: records are unforgeable, uncensorable, and verifiable
///         by anyone (AI labs, courts, the public) directly via Etherscan — no trust in our app required.
/// @dev    The on-chain pHash similarity scan is O(n). Acceptable for a class-scale demo
///         (a few thousand registrations); production would use off-chain indexing.
contract DoNotTrain {
    struct Registration {
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        bytes8 pHash;
        bool exists;
    }

    mapping(bytes32 => Registration) private registrations;
    bytes32[] public allHashes;
    bytes8[] public allPHashes;

    event HashRegistered(
        bytes32 indexed sha256Hash,
        bytes8 indexed pHash,
        address indexed owner,
        uint256 timestamp,
        uint256 blockNumber
    );

    error AlreadyRegistered();
    error NotRegistered();
    error HammingDistanceTooLarge();

    /// @notice Register a SHA-256 + perceptual hash pair on-chain.
    /// @param  sha256Hash The 32-byte SHA-256 of the file (computed in the user's browser).
    /// @param  pHash      The 8-byte perceptual hash for screenshot-resilient matching.
    ///                    Pass bytes8(0) for non-image files (only exact-hash matching applies).
    function register(bytes32 sha256Hash, bytes8 pHash) external {
        if (registrations[sha256Hash].exists) revert AlreadyRegistered();

        registrations[sha256Hash] = Registration({
            owner: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            pHash: pHash,
            exists: true
        });

        allHashes.push(sha256Hash);
        allPHashes.push(pHash);

        emit HashRegistered(sha256Hash, pHash, msg.sender, block.timestamp, block.number);
    }

    /// @notice Cheap exact-match check used by the lookup page before falling back to pHash.
    function isRegistered(bytes32 sha256Hash) external view returns (bool) {
        return registrations[sha256Hash].exists;
    }

    /// @notice Returns the full registration record. Reverts if not registered.
    function getRegistration(bytes32 sha256Hash)
        external
        view
        returns (address owner, uint256 timestamp, uint256 blockNumber, bytes8 pHash)
    {
        Registration memory r = registrations[sha256Hash];
        if (!r.exists) revert NotRegistered();
        return (r.owner, r.timestamp, r.blockNumber, r.pHash);
    }

    /// @notice Linear scan for pHash matches within `maxDistance` Hamming bits.
    /// @dev    O(n). Suitable for class demo. Returns the SHA-256 of every match.
    function findSimilar(bytes8 queryPHash, uint8 maxDistance)
        external
        view
        returns (bytes32[] memory)
    {
        if (maxDistance > 64) revert HammingDistanceTooLarge();

        uint256 len = allPHashes.length;
        bytes32[] memory matches = new bytes32[](len);
        uint256 count = 0;

        for (uint256 i = 0; i < len; i++) {
            // Skip the bytes8(0) sentinel used for non-image files so they don't false-match.
            if (allPHashes[i] == bytes8(0)) continue;
            if (_hammingDistance(allPHashes[i], queryPHash) <= maxDistance) {
                matches[count] = allHashes[i];
                count++;
            }
        }

        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = matches[i];
        }
        return result;
    }

    /// @notice Total registrations — drives the live counter on the landing page.
    function totalRegistrations() external view returns (uint256) {
        return allHashes.length;
    }

    /// @dev Brian Kernighan bit-count over the XOR of two 64-bit perceptual hashes.
    function _hammingDistance(bytes8 a, bytes8 b) private pure returns (uint8) {
        uint64 x = uint64(a) ^ uint64(b);
        uint8 distance = 0;
        while (x != 0) {
            x &= x - 1;
            distance++;
        }
        return distance;
    }
}
