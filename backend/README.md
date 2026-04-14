# P2P file-sharing node (Spring Boot)

Each process is a **peer**: it stores files under a local directory, **replicates** uploads to configured peers over HTTP, and **searches** peers sequentially when a download misses locally. There is no central coordinator—only peer URLs in configuration (plus optional runtime registration).

System-wide design (frontend + flows): see [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Requirements

- Java 17+
- Maven 3.9+

## Build

```bash
cd backend
mvn clean package
```

## Run three nodes (simulation)

Open three terminals from the `backend` directory. Each command uses a Spring profile that sets `server.port`, `node.id`, `node.storage`, and `node.peers`.

**Terminal 1 — node A (5010)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5010
```

**Terminal 2 — node B (5011)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5011
```

**Terminal 3 — node C (5012)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5012
```

Alternatively, run the JAR with profiles:

```bash
java -jar target/p2p-node-1.0.0.jar --spring.profiles.active=node5010
```

Storage directories (`storage_node_5010`, etc.) are created next to the working directory.

## Test scenario (manual)

1. **Upload** a file to node A (replication fan-out is asynchronous by default; wait a second or two):

   ```bash
   echo 'hello-p2p' > /tmp/hello.txt
   curl -sS -X POST --data-binary @/tmp/hello.txt \
     -H 'Content-Type: application/octet-stream' \
     http://localhost:5010/files/hello.txt
   ```

2. **List** files on B and C and confirm `hello.txt` appears:

   ```bash
   curl -sS http://localhost:5011/files | jq .
   curl -sS http://localhost:5012/files | jq .
   ```

3. **Stop node B** (Ctrl+C in its terminal).

4. **Download** from C (still works; search is not needed if the file was replicated):

   ```bash
   curl -sS http://localhost:5012/files/hello.txt
   ```

5. **Delete the file locally on C** (remove `backend/storage_node_5012/hello.txt`) while A is still up, then download again from C: the node should **fetch from a remaining peer** (e.g. A on 5010) and cache locally.

## API

| Method | Path                   | Description                                                                            |
| ------ | ---------------------- | -------------------------------------------------------------------------------------- |
| `POST` | `/files/{filename}`    | Body: raw bytes. Header `X-Replicated: true` skips further replication (avoids loops). |
| `GET`  | `/files/{filename}`    | Local read, else sequential peer GET until success.                                    |
| `GET`  | `/files`               | JSON list of local files (name, size, SHA-256, modified time).                         |
| `GET`  | `/health`              | JSON `{ "status": "UP", "nodeId": "..." }`.                                            |
| `GET`  | `/actuator/health`     | Spring Boot health.                                                                    |
| `GET`  | `/actuator/metrics`    | Micrometer metrics (`p2p.replication.*`, `p2p.peer.search.*`).                         |
| `GET`  | `/actuator/prometheus` | Prometheus scrape format.                                                              |

## Dynamic peers (optional)

```bash
curl -sS -X POST http://localhost:5010/internal/peers \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:5013"}'
```

These endpoints are not authenticated; protect them if you expose the service beyond localhost.

## Web UI (React)

The repository `frontend/` app polls each Spring Boot node (`/health`, `/files`, `/internal/peers`) from the browser. **CORS** is enabled via `p2p.cors.allowed-origin-patterns` in `application.yml` (defaults match the Vite dev server on port 5173).

Run the UI after the three nodes are up:

```bash
cd ../frontend
cp .env.example .env   # optional; defaults match 5010–5012
npm install
npm run dev
```

Configure `VITE_P2P_NODE_URLS` in `.env` if your peers use different hosts or ports.

## Configuration

See `src/main/resources/application.yml` and profile files `application-node5010.yml`, `application-node5011.yml`, `application-node5012.yml`. Override any property with environment variables (Spring relaxed binding), for example `NODE_PEERS_0=http://host:5011`.

**Upload size:** `server.tomcat.max-http-form-post-size` is set to **100MB** so large `application/octet-stream` uploads succeed (Tomcat’s default is 2MB and would reject multi-megabyte sample uploads).
