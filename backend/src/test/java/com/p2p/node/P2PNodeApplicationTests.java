package com.p2p.node;

import static org.assertj.core.api.Assertions.assertThat;

import com.p2p.node.config.NodeConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class P2PNodeApplicationTests {

    @Autowired
    private NodeConfig nodeConfig;

    @Test
    void contextLoads() {
        assertThat(nodeConfig.getId()).isNotBlank();
    }
}
