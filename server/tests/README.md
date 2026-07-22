# Server Test Architecture

This project is structured for unit and integration testing without requiring a full rewrite.

## Recommended layout

```
server/tests
  unit/
    services/
    validators/
    repositories/
  integration/
    logs.list.test.ts
    logs.upload.test.ts
  helpers/
    mongo.ts
    app.ts
```

## Guidance

- **Validators / pure helpers** → unit tests (no DB)
- **Services** → unit tests with repository mocks
- **Repositories + HTTP routes** → integration tests against MongoDB Memory Server or a disposable Atlas database
- Keep controllers thin so route tests mostly assert transport concerns
- Prefer testing through `createApp()` for HTTP contract verification

Suggested stack: Vitest + Supertest + mongodb-memory-server.
