package com.p2p.node.service;

import com.p2p.node.config.NodeConfig;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * HTTP client for peer-to-peer file transfer. Uses {@link RestTemplate} with
 * timeouts from
 * {@link NodeConfig}.
 */
@Service
@RequiredArgsConstructor
public class PeerClient {

    private static final Logger log = LoggerFactory.getLogger(PeerClient.class);

    private final RestTemplate peerRestTemplate;
    private final NodeConfig nodeConfig;

    /**
     * Pushes a blob to a peer with {@code X-Replicated: true} to prevent further
     * fan-out on that hop.
     */
    public void sendFileToPeer(String peerBaseUrl, String filename, byte[] body) {
        String url = buildFileUrl(peerBaseUrl, filename);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.set("X-Replicated", "true");
        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);
        log.info(
                "[node={}] Replication: POST {} ({} bytes, X-Replicated=true)",
                nodeConfig.getId(),
                url,
                body.length);
        peerRestTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
    }

    /**
     * Attempts to download a blob from one peer. Returns empty on 404 or transport
     * failure (caller
     * decides next steps).
     */
    public Optional<byte[]> fetchFileFromPeer(String peerBaseUrl, String filename) {
        String url = buildFileUrl(peerBaseUrl, filename);
        log.info("[node={}] Peer search: GET {}", nodeConfig.getId(), url);
        try {
            ResponseEntity<byte[]> response = peerRestTemplate.exchange(url, HttpMethod.GET, null, byte[].class);
            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                log.warn("[node={}] Peer returned empty body: {}", nodeConfig.getId(), url);
                return Optional.empty();
            }
            return Optional.of(body);
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 404) {
                log.info("[node={}] Peer search miss (404): {}", nodeConfig.getId(), url);
                return Optional.empty();
            }
            log.warn(
                    "[node={}] Peer search HTTP error {} for {}: {}",
                    nodeConfig.getId(),
                    e.getStatusCode().value(),
                    url,
                    e.getMessage());
            return Optional.empty();
        } catch (ResourceAccessException e) {
            log.warn("[node={}] Peer unreachable (timeout/network): {} — {}", nodeConfig.getId(), url, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("[node={}] Peer search failed for {}: {}", nodeConfig.getId(), url, e.getMessage());
            return Optional.empty();
        }
    }

    private static String buildFileUrl(String peerBaseUrl, String filename) {
        return UriComponentsBuilder.fromUriString(PeerRegistry.normalizeBaseUrl(peerBaseUrl))
                .path("/files/")
                .pathSegment(filename)
                .build(true)
                .toUriString();
    }
}
