package com.p2p.node.exception;

/**
 * Raised when a requested object is not present on this node and could not be
 * fetched from any peer.
 */
public class StoredFileNotFoundException extends RuntimeException {

    public StoredFileNotFoundException(String message) {
        super(message);
    }

    public StoredFileNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
