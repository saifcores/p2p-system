package com.p2p.node.service;

import com.p2p.node.config.NodeConfig;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/**
 * Fan-out replication to all registered peers with optional parallelism,
 * retries, and async
 * scheduling.
 */
@Service
@RequiredArgsConstructor
public class ReplicationService {

    private static final Logger log = LoggerFactory.getLogger(ReplicationService.class);

    private final PeerClient peerClient;
    private final PeerRegistry peerRegistry;
    private final NodeConfig nodeConfig;
    private final P2pMetrics p2pMetrics;

    @Qualifier("replicationExecutor")
    private final Executor replicationExecutor;

    /**
     * Replicates to every peer (best effort). Honours
     * {@link NodeConfig#isAsyncReplication()},
     * {@link NodeConfig#isParallelReplication()}, and retry settings.
     */
    public void replicateToPeers(String filename, byte[] data) {
        if (nodeConfig.isAsyncReplication()) {
            CompletableFuture.runAsync(() -> replicateSync(filename, data), replicationExecutor)
                    .whenComplete((r, ex) -> {
                        if (ex != null) {
                            log.error(
                                    "[node={}] Async replication task failed for {}: {}",
                                    nodeConfig.getId(),
                                    filename,
                                    ex.getMessage(),
                                    ex);
                        }
                    });
        } else {
            replicateSync(filename, data);
        }
    }

    void replicateSync(String filename, byte[] data) {
        List<String> targets = peerRegistry.replicationPeers();
        if (targets.isEmpty()) {
            log.info("[node={}] No peers configured; skip replication for {}", nodeConfig.getId(), filename);
            return;
        }
        log.info(
                "[node={}] Starting replication for '{}' to {} peer(s)",
                nodeConfig.getId(),
                filename,
                targets.size());

        if (nodeConfig.isParallelReplication()) {
            List<CompletableFuture<Void>> futures = new ArrayList<>();
            for (String peer : targets) {
                futures.add(CompletableFuture.runAsync(
                        () -> replicateToSinglePeerWithRetries(peer, filename, data), replicationExecutor));
            }
            CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
        } else {
            for (String peer : targets) {
                replicateToSinglePeerWithRetries(peer, filename, data);
            }
        }
    }

    private void replicateToSinglePeerWithRetries(String peer, String filename, byte[] data) {
        int maxAttempts = 1 + Math.max(0, nodeConfig.getReplicationRetryCount());
        Exception last = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info(
                        "[node={}] Replication attempt {}/{} → peer={} file={}",
                        nodeConfig.getId(),
                        attempt,
                        maxAttempts,
                        peer,
                        filename);
                peerClient.sendFileToPeer(peer, filename, data);
                log.info(
                        "[node={}] Replication success → peer={} file={}",
                        nodeConfig.getId(),
                        peer,
                        filename);
                p2pMetrics.replicationSuccess();
                return;
            } catch (Exception e) {
                last = e;
                log.warn(
                        "[node={}] Replication failure attempt {}/{} → peer={} file={}: {}",
                        nodeConfig.getId(),
                        attempt,
                        maxAttempts,
                        peer,
                        filename,
                        e.getMessage());
                if (attempt < maxAttempts && nodeConfig.getReplicationRetryDelayMs() > 0) {
                    try {
                        Thread.sleep(nodeConfig.getReplicationRetryDelayMs());
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.warn("[node={}] Replication retry sleep interrupted", nodeConfig.getId());
                        break;
                    }
                }
            }
        }
        log.error(
                "[node={}] Replication exhausted for peer={} file={}: {}",
                nodeConfig.getId(),
                peer,
                filename,
                last != null ? last.getMessage() : "unknown");
        p2pMetrics.replicationFailure();
    }
}
