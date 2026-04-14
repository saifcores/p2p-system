package com.p2p.node.config;

import java.time.Duration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Shared {@link RestTemplate} with connect/read timeouts derived from node
 * configuration.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate peerRestTemplate(RestTemplateBuilder builder, NodeConfig nodeConfig) {
        return builder
                .setConnectTimeout(Duration.ofMillis(nodeConfig.getPeerTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(nodeConfig.getPeerTimeoutMs()))
                .build();
    }
}
