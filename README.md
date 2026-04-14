# P2P file sharing — distributed mesh (lab project)

A **decentralized peer-to-peer file storage simulation**: each **Spring Boot** process is an autonomous node that stores files on disk, **replicates** uploads to configured peers over HTTP, and **falls back to peer GET** when serving a missing object. A **React (Vite)** dashboard aggregates health, inventory, and peer topology for operators.

There is **no central database or coordinator**; coordination is limited to **explicit peer URLs** (YAML + optional runtime registration).

---

## Repository layout

| Path | Contents |
|------|----------|
| [`backend/`](backend/) | Spring Boot 3 node application (Maven, Java 17). |
| [`frontend/`](frontend/) | Vite + React + TypeScript SPA (monitoring UI). |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | **System design**, data flows, and component boundaries. |

---

## Documentation

- **[Architecture & system design](docs/ARCHITECTURE.md)** — context diagrams, upload/replication and download/search sequences, backend layering, frontend role, security notes.  
- **Backend runbook** — [`backend/README.md`](backend/README.md) (multi-node profiles, curl test scenario, API table).  
- **Frontend tooling** — [`frontend/README.md`](frontend/README.md) (Vite template notes).

---

## Quick start

**1. Start three peers** (three terminals, from `backend/`):

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5010
mvn spring-boot:run -Dspring-boot.run.profiles=node5011
mvn spring-boot:run -Dspring-boot.run.profiles=node5012
```

**2. Start the UI** (`frontend/`):

```bash
npm install
cp .env.example .env   # optional
npm run dev
```

Default `VITE_P2P_NODE_URLS` targets `http://localhost:5010`–`5012`. Adjust if your ports differ.

---

## License / course use

Use and adapt for coursework or demos; harden security before any real deployment.
