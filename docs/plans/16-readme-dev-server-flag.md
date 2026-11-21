# Technical Plan: #16 The README says the dev server opens a browser, and its flag example fails on Windows

**Ticket:** #16   **Spec:** [docs/specs/16-readme-dev-server-flag.md](../specs/16-readme-dev-server-flag.md)   **Status:** Draft

## 1. Summary

Two wording fixes in the "Start the app" part of `README.md`'s "Run it" section. The dev-server sentence says the app is *served* at `http://localhost:5173/` for the reader to open (no browser opens), and keeps the note about Vite picking another port. The single POSIX flag example becomes three: POSIX shells, PowerShell and cmd, each written so the variable is exactly `true`. Nothing else changes.

## 2. Requirements

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Served at `http://localhost:5173/` for the reader to open; still says what happens when the port is taken | ticket |
| AC2 | `VITE_FF_TASKS` shown for POSIX shell, PowerShell and cmd | ticket |
| AC3 | Only `README.md` changes | ticket |
| AC4 | Each flag command sets the variable to exactly `true` | derived |

### Out of scope
The dev server, its port, the flag mechanism (`src/flags.ts`), and every other file.

### Assumptions
- As for #6, "only `README.md` changes" means the repository's content; this spec and plan ride on the same pull request.
- PowerShell means both Windows PowerShell 5.1 and PowerShell 7+; the command chosen works in both (no `&&`, which 5.1 lacks).

## 3. Current state

Verified by reading the files:
- `README.md` → "Run it" → "Start the app": "The dev server opens at <http://localhost:5173/> (if that port is taken, Vite picks another and prints the URL it uses)." Then the flag example `VITE_FF_TASKS=true npm run dev` in one `sh` block.
- `vite.config.ts` has no `server` block: no `open`, no `port`. So Vite serves on its default 5173 and opens no browser; if 5173 is taken (no `strictPort`) it tries the next port and prints the URL.
- `package.json`: `"dev": "vite"`.
- `src/flags.ts`: `import.meta.env.VITE_FF_TASKS === 'true'`, an exact match.
- `playwright.config.ts` starts its own server with `env: { VITE_FF_TASKS: 'true' }`; the README's e2e note about a reused server is unaffected.

## 4. Proposed design

### Changes by component
| File | Change | New / modified |
|---|---|---|
| `README.md` | Rewrite the dev-server sentence and replace the one flag example with three, under "Start the app" | modified |

### Content (contract; wording may differ, the facts may not)
1. After `npm run dev`: "The dev server serves the app at <http://localhost:5173/>; open that URL in your browser. If the port is taken, Vite picks another and prints the URL it uses." Keep "Without the flag the app shows only its empty frame."
2. "To see the task screen, turn on `VITE_FF_TASKS` when you start it:"
   - **macOS, Linux and other POSIX shells** (`sh` block): `VITE_FF_TASKS=true npm run dev`
   - **PowerShell** (`powershell` block):
     ```powershell
     $env:VITE_FF_TASKS = 'true'
     npm run dev
     ```
     with one sentence: the variable stays set for the rest of that PowerShell session; `Remove-Item Env:VITE_FF_TASKS` turns it off.
   - **cmd** (`bat` block): `set "VITE_FF_TASKS=true" && npm run dev`, with one sentence: the quotes keep the trailing space out of the value; the variable stays set for that window; `set VITE_FF_TASKS=` turns it off.

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| cmd syntax | `set "VITE_FF_TASKS=true" && npm run dev` | Without quotes the value is `true ` (trailing space) and `=== 'true'` fails: AC4 | `set VITE_FF_TASKS=true&& npm run dev`: works but easy to "fix" by adding a space |
| PowerShell syntax | Two lines, `$env:…` then `npm run dev` | Works in 5.1 and 7+; 5.1 has no `&&` | One line with `;`: fine, but two lines read more clearly |
| Cross-platform alternative | Not added | `cross-env` or a new script changes `package.json`, against AC3 and "not in this issue" | `.env.local` with `VITE_FF_TASKS=true`: works everywhere but is a file the reader must remember to delete; listed as a follow-up option |
| Mention how to unset | Yes, one clause each for PowerShell and cmd | Unlike the POSIX form, they persist for the session, so the flag would stay on unexpectedly | Omit |

## 6. Implementation tasks

### T1. Fix "Start the app" in `README.md` (S)
- Goal: AC1, AC2, AC4.
- Changes: `README.md`, the "Start the app" subsection only.
- Details: content as in section 4. Leave the rest of the README as it is.
- Done when: the sentence no longer says the server "opens"; it gives `http://localhost:5173/` and the taken-port behaviour; three labelled flag commands are present.
- Tests: manual (section 7). No automated README test: a new test file would break AC3.
- Depends on: none.

### T2. Check the commands and the diff (S)
- Goal: AC3, AC4.
- Details: run `VITE_FF_TASKS=true npm run dev` in a POSIX shell and confirm the task screen shows at the printed URL and no browser opens. Where a Windows shell is available, run the PowerShell and cmd forms the same way; where not, check with `pwsh` (available on Linux) for the PowerShell form, and record that the cmd form was checked by review against cmd's `set "name=value"` rules. Record the results as evidence. `git diff --name-only main` lists only `README.md` plus this spec and plan. CI green.
- Depends on: T1.

### Sequence
T1 then T2. Total: S + S.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1, T2 | manual / review | Wording matches `vite.config.ts` (no `open`, default port, no `strictPort`); no browser opens on `npm run dev` |
| AC2 | T1 | review | POSIX, PowerShell and cmd commands are all present and labelled |
| AC3 | T2 | CI / git | Only `README.md` (plus spec and plan) in the diff; CI green |
| AC4 | T2 | manual | Each command, as written, shows the task screen (Windows forms where a shell is available) |

Regression risk: none to the app; no test reads `README.md`.

## 8. Rollout and rollback

**Feature flag: none, deliberately.** Documentation-only change: there is no code path to gate, and a flag cannot hide Markdown. The existing `VITE_FF_TASKS` flag is documented, not changed. Rollback is reverting the pull request.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| cmd form untested on real Windows | medium | low | Quoted `set` form chosen for exact value; reviewer checks it against AC4 |
| Reader leaves the flag on in a PowerShell/cmd session | low | low | README says how to turn it off |

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | Is "no flag for a README-only change" acceptable? | plan gate | nothing | yes, as for #6 |

## 12. Follow-ups
- A cross-platform `dev:tasks` script (e.g. via `cross-env`) so one command works in every shell.
