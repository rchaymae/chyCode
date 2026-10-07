# chyCode

An AI vibe-coding workspace: chat with an agent that reads and edits your project, review every change as a diff, and drive bigger work through specs (requirements → design → tasks).

```
chycode/
├── backend/    Spring Boot (Java 21) + Spring AI — pom.xml + empty skeleton files
├── frontend/   Angular — complete UI, runs on sample data until the backend exists
├── sandbox/    Dockerfile for the container that runs agent commands
└── docker-compose.yml   PostgreSQL + Ollama for local development
```

## Run the frontend

```bash
cd frontend
npm install
npm start          # http://localhost:4200
```

The UI starts in **sample mode** (`src/app/core/config.ts` → `mock: true`): a fake agent streams steps, proposes a diff, and you can accept or reject it. Set `mock: false` to use the real backend through the `/api` proxy (`proxy.conf.json` → `localhost:8080`).

## Run the backend (once you fill it in)

```bash
docker compose up -d      # PostgreSQL + Ollama
cd backend
./mvnw spring-boot:run    # or: mvn spring-boot:run
```

## API contract the frontend expects

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects/{id}/files/tree` | File tree: `[{name, path, type, children?}]` |
| GET | `/api/projects/{id}/files?path=` | `{content}` |
| PUT | `/api/projects/{id}/files?path=` | Body `{content}` |
| POST | `/api/projects/{id}/chat/stream` | Body `{message}` → `text/event-stream`, each `data:` line is one JSON event |
| GET | `/api/projects/{id}/specs` | `[{kind, content, approved}]` |
| PUT | `/api/projects/{id}/specs/{kind}` | Body `{content}` |
| POST | `/api/projects/{id}/specs/{kind}/approve` | Approve a spec |
| PUT | `/api/llm-settings` | Body `{provider, baseUrl, model, apiKey}` |
| WS | `/api/ws/terminal/{id}` | Raw terminal data both ways |

Chat stream events (`AgentEvent` in `frontend/src/app/core/models.ts`):

```json
{"type":"token","text":"Let me look at "}
{"type":"tool_call","id":"s1","tool":"read_file","summary":"Read src/todo.service.ts"}
{"type":"tool_result","id":"s1","ok":true,"output":"24 lines"}
{"type":"change","change":{"id":"c1","path":"src/todo.service.ts","before":"...","after":"...","status":"pending"}}
{"type":"error","message":"..."}
{"type":"done"}
```
