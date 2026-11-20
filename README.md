# ai-todo-trial-1

The repository of Agent Factory's M4 trial (plan 0004): a todo app in Vite, React 19, TypeScript and Astryx, built by the factory's agents.

- **Work arrives as issues.** A person marks one ready; agents plan it, build it and review it; a person approves the plan and merges the pull request.
- **Checks:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and every push to `main`: `npm ci`, then the scripts `typecheck`, `lint`, `test` (Vitest), `build` and `test:e2e` (Playwright). Agents cannot change it.
- **During the trial,** people act only at the plan gate and the merge gate, and write nothing else on a trial issue or its pull request.
- **The task contract:** [`docs/contracts/tasks.md`](docs/contracts/tasks.md) says which files each task feature owns, what they export and how they are tested. The task screen is behind `VITE_FF_TASKS` (off unless `true`).

## Run it

### Prerequisites

Use **Node 24**, the version CI runs. `package.json` requires at least Node 22.12. npm comes with Node.

### Install

```sh
npm ci
```

This installs exactly the versions `package-lock.json` pins, as CI does.

### Start the app

```sh
npm run dev
```

The dev server opens at <http://localhost:5173/> (if that port is taken, Vite picks another and prints the URL it uses). Without the flag the app shows only its empty frame. To see the task screen, turn on `VITE_FF_TASKS`:

```sh
VITE_FF_TASKS=true npm run dev
```

### The checks CI runs

In CI's order:

| Command | What it does |
|---|---|
| `npm run typecheck` | Type-checks the app and its config with TypeScript (`tsc -b --noEmit`), writing no output files. |
| `npm run lint` | Runs ESLint over the repository. |
| `npm test` | Runs the Vitest unit and component tests once (not in watch mode). |
| `npm run build` | Builds the app for production into `dist/`. |
| `npm run test:e2e` | Runs the Playwright end-to-end tests in Chromium, starting the dev server on port 5173 itself with `VITE_FF_TASKS=true`. |

Before the first `npm run test:e2e`, install Playwright's Chromium once:

```sh
npx playwright install --with-deps chromium
```

Locally, `npm run test:e2e` reuses a dev server already running on port 5173, so if you have one running, start it with `VITE_FF_TASKS=true` too.
