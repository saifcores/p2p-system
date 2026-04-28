# Nœud de partage de fichiers P2P (Spring Boot)

Chaque processus est un **pair** : il stocke les fichiers dans un répertoire local, **réplique** les envois vers les pairs configurés en HTTP et **interroge** les pairs successivement lorsqu’un téléchargement échoue localement. Il n’y a pas de coordinateur central — seulement des URL de pairs dans la configuration (avec enregistrement dynamique optionnel à l’exécution).

## Prérequis

- Java 17+
- Maven 3.9+

## Compilation

```bash
cd backend
mvn clean package
```

## Lancer trois nœuds (simulation)

Ouvrez trois terminaux depuis le répertoire `backend`. Chaque commande utilise un profil Spring qui définit `server.port`, `node.id`, `node.storage` et `node.peers`.

**Terminal 1 — nœud A (5010)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5010
```

**Terminal 2 — nœud B (5011)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5011
```

**Terminal 3 — nœud C (5012)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=node5012
```

Sinon, lancez le JAR avec les profils :

```bash
java -jar target/p2p-node-1.0.0.jar --spring.profiles.active=node5010
```

Les répertoires de stockage (`storage_node_5010`, etc.) sont créés à côté du répertoire de travail courant.

## Scénario de test (manuel)

1. **Envoyer** un fichier vers le nœud A (la diffusion de réplication est asynchrone par défaut ; attendez une ou deux secondes) :

   ```bash
   echo 'hello-p2p' > /tmp/hello.txt
   curl -sS -X POST --data-binary @/tmp/hello.txt \
     -H 'Content-Type: application/octet-stream' \
     http://localhost:5010/files/hello.txt
   ```

2. **Lister** les fichiers sur B et C et vérifier que `hello.txt` apparaît :

   ```bash
   curl -sS http://localhost:5011/files | jq .
   curl -sS http://localhost:5012/files | jq .
   ```

3. **Arrêter le nœud B** (Ctrl+C dans son terminal).

4. **Télécharger** depuis C (ça fonctionne toujours ; la recherche distante n’est pas nécessaire si le fichier a été répliqué) :

   ```bash
   curl -sS http://localhost:5012/files/hello.txt
   ```

5. **Supprimer le fichier localement sur C** (retirer `backend/storage_node_5012/hello.txt`) pendant que A tourne encore, puis retélécharger depuis C : le nœud doit **récupérer le fichier depuis un pair restant** (par ex. A sur le port 5010) et le mettre en cache localement.

## API

| Méthode | Chemin                 | Description                                                                                                   |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/files/{filename}`    | Corps : octets bruts. L’en-tête `X-Replicated: true` évite une nouvelle réplication (prévention des boucles). |
| `GET`   | `/files/{filename}`    | Lecture locale, sinon enchaînement de requêtes GET vers les pairs jusqu’à succès.                             |
| `GET`   | `/files`               | Liste JSON des fichiers locaux (nom, taille, SHA-256, date de modification).                                  |
| `GET`   | `/health`              | JSON `{ "status": "UP", "nodeId": "..." }`.                                                                   |
| `GET`   | `/actuator/health`     | Santé Spring Boot.                                                                                            |
| `GET`   | `/actuator/metrics`    | Métriques Micrometer (`p2p.replication.*`, `p2p.peer.search.*`).                                              |
| `GET`   | `/actuator/prometheus` | Format d’export Prometheus.                                                                                   |

## Pairs dynamiques (optionnel)

```bash
curl -sS -X POST http://localhost:5010/internal/peers \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:5013"}'
```

Ces points de terminaison ne sont pas authentifiés ; sécurisez-les si vous exposez le service au-delà de localhost.

## Interface web (React)

L’application `frontend/` du dépôt interroge depuis le navigateur chaque nœud Spring Boot (`/health`, `/files`, `/internal/peers`). Le **CORS** est activé via `p2p.cors.allowed-origin-patterns` dans `application.yml` (les valeurs par défaut correspondent au serveur de dev Vite sur le port 5173).

Lancez l’interface une fois les trois nœuds démarrés :

```bash
cd ../frontend
cp .env.example .env   # optionnel ; valeurs par défaut = 5010–5012
npm install
npm run dev
```

Configurez `VITE_P2P_NODE_URLS` dans `.env` si vos pairs utilisent d’autres hôtes ou ports.

## Configuration

Voir `src/main/resources/application.yml` et les fichiers de profil `application-node5010.yml`, `application-node5011.yml`, `application-node5012.yml`. Toute propriété peut être surchargée par des variables d’environnement (binding relaxé Spring), par exemple `NODE_PEERS_0=http://host:5011`.

**Taille des envois :** `server.tomcat.max-http-form-post-size` est fixé à **100 Mo** pour que les gros envois `application/octet-stream` réussissent (la valeur par défaut Tomcat est 2 Mo et ferait échouer les exemples multi-mégaoctets).
