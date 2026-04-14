package com.p2p.node.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/**
 * Thin Micrometer wrappers for replication and peer-search visibility (Actuator
 * / Prometheus).
 */
@Component
public class P2pMetrics {

    private final Counter replicationSuccess;
    private final Counter replicationFailure;
    private final Counter peerSearchHits;
    private final Counter peerSearchMisses;

    public P2pMetrics(MeterRegistry registry) {
        this.replicationSuccess = Counter.builder("p2p.replication.success")
                .description("Successful replication POSTs to a peer")
                .register(registry);
        this.replicationFailure = Counter.builder("p2p.replication.failure")
                .description("Failed replication attempts after retries")
                .register(registry);
        this.peerSearchHits = Counter.builder("p2p.peer.search.hit")
                .description("Download satisfied by a peer")
                .register(registry);
        this.peerSearchMisses = Counter.builder("p2p.peer.search.miss")
                .description("Peer did not have the object")
                .register(registry);
    }

    public void replicationSuccess() {
        replicationSuccess.increment();
    }

    public void replicationFailure() {
        replicationFailure.increment();
    }

    public void peerSearchHit() {
        peerSearchHits.increment();
    }

    public void peerSearchMiss() {
        peerSearchMisses.increment();
    }
}
