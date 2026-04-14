package com.p2p.node.controller;

import com.p2p.node.config.NodeConfig;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Simple liveness endpoint (in addition to Actuator {@code /actuator/health}).
 */
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final NodeConfig nodeConfig;

    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("nodeId", nodeConfig.getId());
        return body;
    }
}
