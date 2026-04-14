package com.p2p.node.service;

import com.p2p.node.config.NodeConfig;
import com.p2p.node.exception.InvalidFilenameException;
import com.p2p.node.exception.StoredFileNotFoundException;
import com.p2p.node.model.FileMetadata;
import com.p2p.node.util.FileUtils;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Local filesystem storage, integrity hashing, distributed lookup via
 * {@link PeerClient}, and
 * replication orchestration via {@link ReplicationService}.
 */
@Service
@RequiredArgsConstructor
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final NodeConfig nodeConfig;
    private final ReplicationService replicationService;
    private final PeerClient peerClient;
    private final PeerRegistry peerRegistry;
    private final P2pMetrics p2pMetrics;

    private Path storageDirectory;

    @PostConstruct
    void initStorage() throws IOException {
        storageDirectory = Path.of(nodeConfig.getStorage()).toAbsolutePath().normalize();
        Files.createDirectories(storageDirectory);
        log.info("[node={}] Local storage ready at {}", nodeConfig.getId(), storageDirectory);
    }

    /**
     * Persists an upload. When {@code alreadyReplicated} is false, schedules
     * replication to all
     * peers (unless this upload is itself a replica).
     */
    public FileMetadata saveFile(String rawFilename, byte[] data, boolean alreadyReplicated) {
        String filename = safeName(rawFilename);
        log.info(
                "[node={}] File save requested: name={} bytes={} alreadyReplicated={}",
                nodeConfig.getId(),
                filename,
                data.length,
                alreadyReplicated);

        FileMetadata meta = writeToDisk(filename, data);

        if (!alreadyReplicated) {
            log.info("[node={}] Scheduling replication for {}", nodeConfig.getId(), filename);
            replicationService.replicateToPeers(filename, data);
        } else {
            log.info("[node={}] Skipping replication (replica ingest) for {}", nodeConfig.getId(), filename);
        }
        return meta;
    }

    /**
     * Reads from local disk, or sequentially asks peers until one responds (then
     * caches locally
     * without re-replicating).
     */
    public byte[] getFileBytes(String rawFilename) {
        String filename = safeName(rawFilename);
        Path path = storageDirectory.resolve(filename);
        if (Files.isRegularFile(path)) {
            log.info("[node={}] Local hit for {}", nodeConfig.getId(), filename);
            try {
                return Files.readAllBytes(path);
            } catch (IOException e) {
                throw new StoredFileNotFoundException("cannot read local file: " + filename, e);
            }
        }

        log.info("[node={}] Local miss for {}; querying peers sequentially", nodeConfig.getId(), filename);
        for (String peer : peerRegistry.replicationPeers()) {
            Optional<byte[]> fromPeer = peerClient.fetchFileFromPeer(peer, filename);
            if (fromPeer.isPresent()) {
                log.info("[node={}] Peer hit from {} for {}", nodeConfig.getId(), peer, filename);
                p2pMetrics.peerSearchHit();
                byte[] blob = fromPeer.get();
                try {
                    saveFile(filename, blob, true);
                    log.info("[node={}] Cached peer copy locally: {}", nodeConfig.getId(), filename);
                } catch (Exception e) {
                    log.warn(
                            "[node={}] Failed to cache file locally (returning peer bytes anyway): {}",
                            nodeConfig.getId(),
                            e.getMessage());
                }
                return blob;
            }
            p2pMetrics.peerSearchMiss();
        }

        log.warn("[node={}] File not found locally or on any peer: {}", nodeConfig.getId(), filename);
        throw new StoredFileNotFoundException("file not found: " + filename);
    }

    public List<FileMetadata> listLocalFiles() {
        try (Stream<Path> stream = Files.list(storageDirectory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(p -> {
                        try {
                            String name = p.getFileName().toString();
                            long size = Files.size(p);
                            String hash = FileUtils.sha256Hex(p);
                            return FileMetadata.builder()
                                    .filename(name)
                                    .sizeBytes(size)
                                    .sha256Hex(hash)
                                    .storedAt(Files.getLastModifiedTime(p).toInstant())
                                    .build();
                        } catch (IOException e) {
                            throw new IllegalStateException(e);
                        }
                    })
                    .sorted(Comparator.comparing(FileMetadata::getFilename))
                    .toList();
        } catch (IOException e) {
            throw new IllegalStateException("cannot list storage", e);
        }
    }

    private FileMetadata writeToDisk(String filename, byte[] data) {
        Path path = storageDirectory.resolve(filename);
        try {
            Files.write(path, data);
            String hash = FileUtils.sha256Hex(data);
            Instant storedAt = Files.getLastModifiedTime(path).toInstant();
            log.info(
                    "[node={}] File saved: path={} size={} sha256={}",
                    nodeConfig.getId(),
                    path,
                    data.length,
                    hash);
            return FileMetadata.builder()
                    .filename(filename)
                    .sizeBytes(data.length)
                    .sha256Hex(hash)
                    .storedAt(storedAt)
                    .build();
        } catch (IOException e) {
            throw new IllegalStateException("failed to write file: " + filename, e);
        }
    }

    private static String safeName(String raw) {
        try {
            return FileUtils.sanitizeFilename(raw);
        } catch (IllegalArgumentException e) {
            throw new InvalidFilenameException(e.getMessage());
        }
    }
}
