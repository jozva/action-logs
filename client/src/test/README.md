# Client Test Architecture

Frontend code is organized for isolated testing:

- `api/` and pure utils → unit tests
- `hooks/` → React Testing Library + TanStack Query wrapper
- `features/` and `components/` → component tests with mocked API modules
- `pages/` → route-level tests with MemoryRouter

Suggested stack: Vitest + Testing Library + MSW.
