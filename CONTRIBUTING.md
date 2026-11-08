# Contributing

Thanks for helping improve E-Shop. This guide keeps contributions easy to review.

## Getting set up

1. Follow **Installation** in the [README](README.md). The quickest route is the `h2` profile, which needs no database:
   ```bash
   npm run install:all
   npm run dev:backend:h2    # terminal 1 (needs JWT_SECRET, see README)
   npm run dev:frontend      # terminal 2
   ```
2. Create a branch from `main`: `feature/<short-name>`, `fix/<short-name>` or `docs/<short-name>`.

## Before you open a pull request

Run everything from the repository root; all of it must pass:

```bash
npm run lint
npm test
npm run build
```

- Add or update tests for the behaviour you change. Backend tests are MockMvc tests on in-memory H2 (`backend/src/test`); frontend tests use Vitest and Testing Library (`*.test.js(x)` next to the code).
- Do not commit secrets, `.env` files, `node_modules`, `target/`, `dist/` or uploaded images.
- Keep changes focused. Unrelated refactors belong in their own pull request.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): imperative subject` under 72 characters, with a body that explains *why* when it is not obvious.

| Type | Use for |
| --- | --- |
| `feat` | a new user-visible capability |
| `fix` | a bug fix (say what was wrong in the body) |
| `refactor` | code change that does not alter behaviour |
| `test` | adding or fixing tests |
| `docs` | documentation only |
| `chore` | tooling, config, dependencies |

Example: `feat(cart): add quantity update and persistent cart state`

Every commit should leave the app building and the tests passing.

## Code style

- **Backend:** controller → service → repository. Controllers stay thin, validate input with `@Valid` DTOs, and return DTOs (never entities). Throw `APIException` / `ResourceNotFoundException`; `MyGlobalExceptionHandler` turns them into the standard error body.
- **Frontend:** function components and hooks, Redux Toolkit slices for shared state, the `api` client (never raw `fetch`) for requests. Run `npm run lint` and fix warnings.
- Check ownership and roles on the **server**; hiding a button in the UI is not security.

## Reporting bugs and security issues

Open an issue with steps to reproduce, what you expected and what happened. For a security problem, please do not open a public issue; contact the maintainer directly (see the README).
