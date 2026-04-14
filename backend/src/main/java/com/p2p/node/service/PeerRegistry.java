package com.p2p.node.service;

import com.p2p.node.config.NodeConfig;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Mutable view of peer URLs: seeded from configuration and optionally extended
 * at runtime (dynamic
 * registration). Self-URLs are ignored so replication does not POST to the same
 * node.
 */
@Component
@RequiredArgsConstructor
public class PeerRegistry {

    private static final Logger log = LoggerFactory.getLogger(PeerRegistry.class);

    private final NodeConfig nodeConfig;
    private final CopyOnWriteArrayList<String> peers = new CopyOnWriteArrayList<>();

    @Value("${server.port}")
    private int serverPort;

    @PostConstruct
    void seedFromConfig() {
        peers.clear();
        if (nodeConfig.getPeers() != null) {
            for (String p : nodeConfig.getPeers()) {
                if (p != null && !p.isBlank()) {
                    String n = normalizeBaseUrl(p);
                    if (isSelfUrl(n)) {
                        log.warn(
                                "[node={}] Ignoring peer seed that points to this node: {}",
                                nodeConfig.getId(),
                                n);
                        continue;
                    }
                    peers.add(n);
                }
            }
        }
        log.info("[node={}] Peer registry seeded with {} peers: {}", nodeConfig.getId(), peers.size(), peers);
    }

    /** Base URL without trailing slash. */
    public static String normalizeBaseUrl(String url) {
        String t = url.trim();
        while (t.endsWith("/")) {
            t = t.substring(0, t.length() - 1);
        }
        return t;
    }

    private String resolvedSelfUrl() {
        String u = nodeConfig.getAdvertisedUrl();
        if (u != null && !u.isBlank()) {
            return normalizeBaseUrl(u);
        }
        return "http://localhost:" + serverPort;
    }

    /**
     * True if {@code candidate} refers to this JVM (same logical endpoint). Used to
     * block
     * registering self and to skip replication/search hops to self.
     */
    public boolean isSelfUrl(String candidate) {
        String peer = normalizeBaseUrl(candidate);
        String self = resolvedSelfUrl();
        if (peer.equals(self)) {
            return true;
        }
        try {
            URI pu = URI.create(peer);
            URI su = URI.create(self);
            int pp = portOrDefault(pu);
            int sp = portOrDefault(su);
            if (pp != sp) {
                return false;
            }
            return isLocalHost(pu.getHost()) && isLocalHost(su.getHost());
        } catch (Exception e) {
            return false;
        }
    }

    private static int portOrDefault(URI u) {
        if (u.getPort() > 0) {
            return u.getPort();
        }
        return "https".equalsIgnoreCase(u.getScheme()) ? 443 : 80;
    }

    private static boolean isLocalHost(String host) {
        if (host == null) {
            return false;
        }
        return host.equalsIgnoreCase("localhost")
                || host.equals("127.0.0.1")
                || "[::1]".equals(host);
    }

    public List<String> snapshot() {
        return Collections.unmodifiableList(new ArrayList<>(peers));
    }

    /**
     * Peers to replicate to / query (excludes this node's own URL if
     * mis-registered).
     */
    public List<String> replicationPeers() {
        return snapshot().stream().filter(p -> !isSelfUrl(p)).toList();
    }

    public void addPeer(String baseUrl) {
        String n = normalizeBaseUrl(baseUrl);
        if (isSelfUrl(n)) {
            log.warn("[node={}] Refusing to register self as peer: {}", nodeConfig.getId(), n);
            return;
        }
        if (!peers.contains(n)) {
            peers.add(n);
            log.info("[node={}] Dynamic peer registered: {}", nodeConfig.getId(), n);
        }
    }

    public boolean removePeer(String baseUrl) {
        String n = normalizeBaseUrl(baseUrl);
        boolean removed = peers.remove(n);
        if (removed) {
            log.info("[node={}] Peer removed: {}", nodeConfig.getId(), n);
        }
        return removed;
    }
}
