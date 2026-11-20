# ai-todo-trial-1

The repository of Agent Factory's M4 trial (plan 0004): a todo app in Vite, React 19, TypeScript and Astryx, built by the factory's agents.

- **Work arrives as issues.** A person marks one ready; agents plan it, build it and review it; a person approves the plan and merges the pull request.
- **Checks:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and every push to `main`: `npm ci`, then the scripts `typecheck`, `lint`, `test` (Vitest), `build` and `test:e2e` (Playwright). Agents cannot change it. Until the scaffold is merged there is no `package.json`, so it fails.
- **During the trial,** people act only at the plan gate and the merge gate, and write nothing else on a trial issue or its pull request.
- **The task contract:** [`docs/contracts/tasks.md`](docs/contracts/tasks.md) says which files each task feature owns, what they export and how they are tested. The task screen is behind `VITE_FF_TASKS` (off unless `true`).
