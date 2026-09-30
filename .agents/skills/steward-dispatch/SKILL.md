---
name: steward-dispatch
description: Dispatches a settled frontier milestone to the project Butler with zero human errand-boy overhead. Compacts HITL decisions into handoff.md and locks execution scope.
---

# 🎩 /steward-dispatch — Estate Milestone Dispatcher

**Steward-Dispatch** automates the handoff between the high-level human/Steward frontier consensus and the project-level Butler execution. It eliminates the need for the human to act as an "errand boy" copying conversation IDs or reminding Butler not to write code.

---

## 🎯 Dispatch Procedure

When a Frontier audit, Grilling session, or HITL architecture decision is settled (`frontier-axi done <id>` or `frontier-axi list` shows ready tickets):

### Step 1: Identify Milestone Boundary
1. Query the project's ready execution tickets:
   ```bash
   tasks-axi ready
   ```
2. Identify the active Frontier ID (e.g. `FNT-001`) and the corresponding spec (e.g. `specs/<seam>.md`).
3. Record the current conversation ID:
   ```markdown
   conversation://<current-conversation-id>
   ```

### Step 2: Generate Canonical `handoff.md`
Steward writes or overwrites `handoff.md` in the target project root (e.g. `<project-root>/handoff.md`):

```markdown
# 🏰 Code-Manor Milestone Handoff: Steward ➔ Butler

- **Source Session:** conversation://<current-conversation-id>
- **Frontier ID:** <FNT-ID>
- **Target Spec:** <path-to-spec.md>
- **Ready Tickets:**
  - #<ticket-id>: <title>
  - #<ticket-id>: <title>

## 📋 Architectural Decisions (Compacted from HITL Grilling)
- <Key decision 1 settled with Master>
- <Key decision 2 settled with Master>

## 🔒 Execution Contract for Butler
1. **Zero Self-Code:** Butler is strictly forbidden from writing or modifying code in `src/` or `tests/`.
2. **Single-Worker Pool:** Butler MUST invoke or message a single dedicated `maid` subagent (`Model: "pro"` or `"flash"` with Low Thinking).
3. **Sequential Execution:** Feed tickets sequentially to the worker via `send_message`.
4. **Milestone Review:** Once all tickets in this frontier pass local verification (`make check`), Butler executes the Two-Axis Code Review against `$BASE_SHA` and creates the PR (`gh pr create`).
```

### Step 3: Trigger Butler Takeover
Steward notifies the Master with a concise summary and instructs Butler:
- If running in the project context: Immediately invokes `/butler-takeover`.
- If communicating cross-project: Dispatches the project's Butler subagent pointing to `handoff.md`.

No manual copying of prompts, IDs, or ticket details is required from the human.
