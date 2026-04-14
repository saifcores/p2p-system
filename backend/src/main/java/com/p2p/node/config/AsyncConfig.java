package com.p2p.node.config;

import java.util.concurrent.Executor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Thread pool used for asynchronous replication so uploads return quickly while
 * fan-out continues.
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "replicationExecutor")
    public Executor replicationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(32);
        executor.setQueueCapacity(512);
        executor.setThreadNamePrefix("p2p-repl-");
        executor.initialize();
        return executor;
    }
}
