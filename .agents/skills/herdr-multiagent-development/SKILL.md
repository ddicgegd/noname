---
name: herdr-multiagent-development
description: Plan and orchestrate parallel multi-agent development on Herdr using the 1-1 Worker-Censor pairing model through the central Supervisor hub.
---

# Herdr Multi-Agent Development (HMAD) - Parallel Edition

Supreme engineering directive: Transform specifications into real-codebase Parallel Task Waves, and orchestrate asynchronous multi-agent execution on Herdr via 1-1 Worker-Censor Pairing coordinated through the central Supervisor hub.

---

## ARTICLE 1: CORE DIRECTIVES & INVARIANTS

### 1.1. ASYNCHRONOUS COORDINATION & PARALLEL WAVES
- Strictly ban single-threaded sequential execution for independent tasks. Independent codebase tasks MUST be grouped into concurrent Waves and executed in parallel.
- Non-blocking dispatch: Supervisor MUST NOT use `--wait` when dispatching batch work. Supervisor remains unblocked to coordinate concurrent streams simultaneously.
- State monitoring: Bounded monitoring loop via `herdr agent list` to track agent lifecycle states (`idle`, `working`, `blocked`, `done`).

### 1.2. 1-1 WORKER-CENSOR PAIRING MODEL
- Each independent task in an active Wave is assigned a dedicated pair: `worker-N` and `censor-N`.
- Eliminates reviewer bottlenecks: N concurrent workers have N concurrent censors.
- Isolated lifecycle: Each pair operates in isolated layout panes. Upon task approval, Supervisor directly closes both panes (`herdr pane close <PANE_ID>`) to reclaim memory and completely eliminate context leakage.

### 1.3. SUPERVISOR HUB-AND-SPOKE TOPOLOGY
- Central dispatch invariant: ALL messages, task dispatches, diff transfers, and reports MUST route exclusively through the Supervisor.
- Strictly ban Peer-to-Peer communication: `worker-N` NEVER communicates directly with `censor-N`.
- Supervisor packages diffs (`scripts/review-package`), maintains git integrity, and holds exclusive Ruling authority.

### 1.4. THE FOUR STOPPING CONDITIONS
Only stop and prompt the human partner when:
a) An irreversible or destructive operation is required.
b) Security-sensitive credentials or secrets are touched.
c) Side effects occur outside the current worktree (merge to main, push to shared remote, publish).
d) The plan or spec is structurally broken such that all paths forward are pure guesswork.

---

## ARTICLE 2: ROLE & AUTHORITY MATRIX

### 2.1. SUPERVISOR (CENTRAL NON-BLOCKING HUB)
- Agent Model: Gemini 3.8 Flash (Thinking: High).
- Location: Main controlling pane (`HERDR_PANE_ID`).
- Powers:
  + Holds Master Plan, Spec, and progress Ledger (`progress.md`).
  + Manages pane lifecycles on Herdr; dispatches parallel waves asynchronously.
  + Packages diffs via `scripts/review-package` and routes to `censor-N`.
  + Issues binding Rulings to settle technical disputes.
- Strict Prohibitions:
  + NEVER edit business code.
  + NEVER execute test suites or reviews directly to prevent context dilution.

### 2.2. WORKER-N (INDEPENDENT IMPLEMENTER)
- Agent Model: Gemini 3.1 Pro (Deep logic & coding).
- Identity: `worker-1`, `worker-2`,... for Task N in the active Wave.
- Powers:
  + Implements code and tests strictly adhering to TDD within assigned file boundaries.
  + Reports completion (DONE) exclusively to Supervisor.
- Strict Prohibitions:
  + NEVER contact Censors or other panes directly.
  + NEVER touch files outside the task brief to prevent git merge conflicts with sibling workers.
  + NEVER take shortcuts or fake tests to bypass verification.

### 2.3. CENSOR-N (DEDICATED PAIRED REVIEWER)
- Agent Model: Gemini 3.8 Flash (Thinking: Low).
- Identity: `censor-1`, `censor-2`,... paired with `worker-N`.
- Powers:
  + Reads review package diff from Supervisor; executes independent TDD verification.
  + Evaluates on two strict criteria: Spec Compliance and Code Quality.
  + Reports verification verdict exclusively to Supervisor.
  + Relinquishes lifecycle to Supervisor for pane closure upon approval.
- Strict Prohibitions:
  + NEVER edit codebase files.
  + NEVER propose specific code solutions or implementations.

### 2.4. BUILDER (MULTI-SERVICE INTEGRATION SIGN-OFF)
- Agent Model: Gemini 3.8 Flash (Thinking: Low).
- Identity: `builder-<service>` for each service project in the repository.
- Powers: Activated after all Waves complete. Verifies clean compilation, runs database migrations, boots runtime services, and executes health checks.

---

## ARTICLE 3: PARALLEL WAVE PLANNING STANDARD

### 3.1. MANDATORY STORAGE LOCATION
- Completed plans MUST be saved to:
  `docs/plan-herdr/YYYY-MM-DD-<feature-name>.md`
- Supervisor MUST output this path explicitly before launching any Herdr panes.

### 3.2. WAVE PLAN STRUCTURE
Organized strictly into concurrent Task Waves:

```markdown
# [Feature Name] Multi-Agent Implementation Plan

## Wave 1: [Parallel Wave Name - Independent Tasks]
(Tasks in this wave do not share modified files; dispatched 100% concurrently)

### Task 1: [Component Name A]
- Pair: worker-1 <-> censor-1
- Scope: [Small | Standard]
- Target Service: [Service A]
- Files: Create: `path/A.ext`, Modify: `path/A_old.ext:10-30`, Test: `path/A_test.ext`
- Interfaces: Consumes: [...], Produces: [...]
- Acceptance Criteria (TDD): Failing test -> Verify fail -> Minimal code -> Verify pass -> Commit.

### Task 2: [Component Name B]
- Pair: worker-2 <-> censor-2
- Scope: [Small | Standard]
- Target Service: [Service B]
- Files: Create: `path/B.ext`, Modify: `path/B_old.ext:50-80`, Test: `path/B_test.ext`
- Interfaces: Consumes: [...], Produces: [...]
- Acceptance Criteria (TDD): Failing test -> Verify fail -> Minimal code -> Verify pass -> Commit.

---

## Wave 2: [Next Wave Name - Integration Tasks]
(Dispatched only after Wave 1 has been fully verified and signed off)
```

---

## ARTICLE 4: HERDR CLI & OPERATIONAL PRIMITIVES

### 4.1. ENVIRONMENT VERIFICATION
```bash
test "${HERDR_ENV:-}" = 1
```

### 4.2. AGENT PROVISIONING SYNTAX
Use exact Herdr CLI syntax with `--kind omp`:
```bash
# 1. Create Pane for Worker-N
PANE_W=$(herdr pane split --current --direction down --cwd "$PWD" --no-focus | jq -r '.result.pane.pane_id')
herdr agent start worker-N --kind omp --pane "$PANE_W"

# 2. Create Pane for paired Censor-N
PANE_C=$(herdr pane split --pane "$PANE_W" --direction right --cwd "$PWD" --no-focus | jq -r '.result.pane.pane_id')
herdr agent start censor-N --kind omp --pane "$PANE_C"
```

### 4.3. NON-BLOCKING DISPATCH
NEVER pass `--wait` when dispatching batch workers in a Wave:
```bash
# Supervisor dispatches all workers in the wave concurrently:
herdr agent prompt worker-1 "Implement Task 1. Brief: <path_1>, Report: <report_1>"
herdr agent prompt worker-2 "Implement Task 2. Brief: <path_2>, Report: <report_2>"
```

### 4.4. BOUNDED MONITOR LOOP
Supervisor polls agent status:
```bash
herdr agent list
```
When `worker-N` transitions to `idle` or `done`:
- Supervisor immediately processes Task N report.
- Packages git diff and dispatches `censor-N`:
  ```bash
  herdr agent prompt censor-N "Verify Task N: Brief=<path>, Report=<path>, Diff=<path>"
  ```
- Sibling workers in the Wave continue uninterrupted.

---

## ARTICLE 5: TRIANGULAR WAVE LOOP & FIX PROTOCOL

```
[ WAVE EXECUTION ]
Supervisor ──┬──(Non-blocking prompt)──► worker-1 (Coding/TDD) ──► Done ──► Supervisor ──► censor-1 (Review)
             │
             └──(Non-blocking prompt)──► worker-2 (Coding/TDD) ──► Done ──► Supervisor ──► censor-2 (Review)
```

### 5.1. PAIR LIFECYCLE & VERIFICATION
- When `censor-N` reports PASSED:
  + Supervisor records progress in ledger: `Task N: complete`.
  + Supervisor closes both panes to reclaim resources: `herdr pane close <PANE_W>` and `herdr pane close <PANE_C>`.
- When `censor-N` reports FAILED:
  + Triggers Fix Loop (maximum 5 rounds) within `worker-N` <-> `censor-N`.
  + Supervisor forwards failure details to `worker-N`.
  + Circuit Breaker at Round 5: Supervisor issues binding `Ruling` to unblock.

### 5.2. WAVE BARRIER
- ALL tasks in Wave N must reach `complete` before Supervisor provisions Wave N+1.
- All panes from the prior Wave are closed before opening new panes.

---

## ARTICLE 6: MULTI-SERVICE BUILDER SIGN-OFF & TEARDOWN

### 6.1. BUILDER PHASE ACTIVATION
After all Waves reach completion:
1. Supervisor opens dedicated Builder panes per service project:
   ```bash
   herdr agent start builder-backend --kind omp --pane "$PANE_B1"
   herdr agent start builder-frontend --kind omp --pane "$PANE_B2"
   ```
2. Dispatches builders concurrently to verify: compilation/package, DB migrations, runtime boot, and health endpoints.
3. Once verified, closes builder panes: `herdr pane close <PANE_B>`.

### 6.2. FINAL SIGN-OFF & CLEANUP
- Summarize all `Ruling:` lines from the ledger into the final report.
- Remove scratch directories (`.superpowers/sdd/<slug>`).
- Supervisor issues completion notice to the human partner.
