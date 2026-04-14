package com.p2p.node.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Describes a stored object: logical name, size, SHA-256 digest, and when it
 * was written.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadata {

    private String filename;
    private long sizeBytes;
    private String sha256Hex;
    private Instant storedAt;
}
