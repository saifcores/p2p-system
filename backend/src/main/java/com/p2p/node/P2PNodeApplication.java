package com.p2p.node;

import com.p2p.node.config.NodeConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Standalone P2P file-sharing node. Each JVM instance is one peer; nodes
 * coordinate only via HTTP.
 */
@SpringBootApplication
@EnableConfigurationProperties(NodeConfig.class)
public class P2PNodeApplication {

    public static void main(String[] args) {
        SpringApplication.run(P2PNodeApplication.class, args);
    }
}
