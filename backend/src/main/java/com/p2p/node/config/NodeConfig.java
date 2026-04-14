package com.p2p.node.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Node identity, local storage path, peer URLs, and replication tuning. All
 * values come from YAML or env.
 */
@Data
@Validated
@ConfigurationProperties(prefix = "node")
public class NodeConfig {

    @NotBlank
    private String id;

    /**
     * Directory name (relative to working directory) where this node stores file
     * blobs.
     */
    @NotBlank
    private String storage;

    /**
     * Initial seed peers; runtime list is managed by
     * {@link com.p2p.node.service.PeerRegistry}.
     */
    private List<String> peers = new ArrayList<>();

    @Min(100)
    private long peerTimeoutMs = 5000;

    @Min(0)
    private int replicationRetryCount = 2;

    @Min(0)
    private long replicationRetryDelayMs = 300;

    private boolean parallelReplication = true;

    private boolean asyncReplication = true;

    /**
     * Public base URL of this node (what other peers use in their registry). If
     * unset, the mesh
     * assumes {@code http://localhost:{server.port}} for self-detection when adding
     * peers.
     */
    private String advertisedUrl;
}
