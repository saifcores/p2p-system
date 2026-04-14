package com.p2p.node.exception;

/** Invalid or unsafe logical filename (e.g. path traversal). */
public class InvalidFilenameException extends RuntimeException {

    public InvalidFilenameException(String message) {
        super(message);
    }
}
