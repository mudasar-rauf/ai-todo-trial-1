# Spec: #17 Pin local Node to the version CI uses

**Issue:** #17   **Plan:** [docs/plans/17-pin-local-node-version.md](../plans/17-pin-local-node-version.md)

## User story

As someone setting up the app locally with nvm or a compatible version manager, I want the repository to name the Node version CI runs, so that I get Node 24 without reading the workflow.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | `.nvmrc` at the repository's root holds `24`. | issue |
| AC2 | The README's setup mentions `.nvmrc`. | issue |
| AC3 | `package.json`'s `engines` is unchanged, and CI passes. | issue |
| AC4 | `.github/workflows/` is unchanged. | derived (issue's "Not in this issue": changing CI or `.github/workflows/`) |

## Out of scope

Changing CI, `.github/workflows/`, or the `engines` range (issue). Other version-manager files (`.node-version`, `.tool-versions`, Volta's `package.json` field).
