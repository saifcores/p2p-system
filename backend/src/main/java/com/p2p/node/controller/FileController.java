package com.p2p.node.controller;

import com.p2p.node.model.FileMetadata;
import com.p2p.node.service.FileService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST surface for uploads, downloads, and inventory. Replication loops are
 * prevented with
 * {@code X-Replicated}.
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * Upload or ingest a replica. Binary body; {@code X-Replicated=true} skips
     * further replication.
     */
    @PostMapping(value = "/files/{filename:.+}", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<FileMetadata> upload(
            @PathVariable("filename") String filename,
            @RequestHeader(value = "X-Replicated", defaultValue = "false") String replicatedHeader,
            @RequestBody byte[] body) {
        boolean replicated = parseBooleanHeader(replicatedHeader);
        FileMetadata meta = fileService.saveFile(filename, body, replicated);
        return ResponseEntity.ok(meta);
    }

    /**
     * Download: local first, then sequential peer search.
     */
    @GetMapping(value = "/files/{filename:.+}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> download(@PathVariable("filename") String filename) {
        byte[] data = fileService.getFileBytes(filename);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(data);
    }

    /** Lists files stored on this node with size and SHA-256. */
    @GetMapping(value = "/files", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<FileMetadata>> listLocal() {
        return ResponseEntity.ok(fileService.listLocalFiles());
    }

    private static boolean parseBooleanHeader(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        return "true".equalsIgnoreCase(raw.trim()) || "1".equals(raw.trim());
    }
}
