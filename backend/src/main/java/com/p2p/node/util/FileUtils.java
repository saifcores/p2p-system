package com.p2p.node.util;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import lombok.experimental.UtilityClass;

/**
 * Safe file names and SHA-256 hashing for integrity checks.
 */
@UtilityClass
public class FileUtils {

    /**
     * Rejects path traversal and absolute paths; returns a single-segment safe
     * name.
     */
    public static String sanitizeFilename(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("filename must not be empty");
        }
        String normalized = Path.of(raw).normalize().toString().replace('\\', '/');
        if (normalized.contains("..") || normalized.startsWith("/")) {
            throw new IllegalArgumentException("invalid filename: path traversal not allowed");
        }
        if (normalized.chars().filter(ch -> ch == '/').count() > 0) {
            throw new IllegalArgumentException("invalid filename: only a single path segment is allowed");
        }
        return normalized;
    }

    public static String sha256Hex(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public static String sha256Hex(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buf = new byte[8192];
            try (InputStream in = Files.newInputStream(path)) {
                int n;
                while ((n = in.read(buf)) != -1) {
                    digest.update(buf, 0, n);
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

}
