package com.p2p.node.controller;

import com.p2p.node.service.PeerRegistry;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Optional runtime peer registration (bonus). Not authenticated — protect in
 * real deployments.
 */
@RestController
@RequestMapping("/internal/peers")
@RequiredArgsConstructor
public class PeerAdminController {

    private final PeerRegistry peerRegistry;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<String> listPeers() {
        return peerRegistry.snapshot();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> addPeer(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "url required"));
        }
        String normalized = PeerRegistry.normalizeBaseUrl(url);
        if (peerRegistry.isSelfUrl(normalized)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "cannot register this node's own URL as a peer", "url", normalized));
        }
        peerRegistry.addPeer(url);
        return ResponseEntity.ok(Map.of("status", "registered", "url", normalized));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> removePeer(@RequestParam String url) {
        boolean removed = peerRegistry.removePeer(url);
        return ResponseEntity.ok(Map.of("removed", String.valueOf(removed)));
    }
}
