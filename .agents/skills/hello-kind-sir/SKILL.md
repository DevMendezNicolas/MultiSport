---
name: hello-kind-sir
description: Rapid, zero-fluff estate status catch-up and decision matrix (inspired by Kun Chen's /ahoy). Delivers Landed, Underway, Captain's Call, and live Context Gauge with zero prose bloat.
---

# 🎩 /hello-kind-sir — Rapid Estate Catch-Up & Captain's Call

Inspired by Kun Chen's `/ahoy` workflow and tailored for the razor-sharp, zero-fluff nature of Gemini 3.8 Flash, **`/hello-kind-sir`** provides an instant executive snapshot across the estate without drowning the Master in long paragraphs or terminal diffs.

---

## 🎯 Core Rules
1. **Zero Fluff (No Filler Words):** Maximum 10-15 lines total output.
2. **Deterministic Information Only:**
   - What finished since last check (`Landed`).
   - What is actively running (`Underway`).
   - What needs a decision (`Captain's Call`).
   - Live Token/Context Gauge (`Context Gauge`).

---

## 📋 Response Format Template

```markdown
### ⚓ Landed
- `<task-id>` / `<repo>`: <1-line summary and status>

### 🌊 Underway
- `<agent/task>`: <What is currently being executed?>

### 🎯 Captain's Call
- [ ] **Decision 1:** <Concise question> $\rightarrow$ [Option A] | [Option B]
*(If no open decisions exist: "No pending decisions; sailing is calm.")*

### 🧭 Context Gauge
- **Session:** `<convo-title>`
- **Context Window:** `<current-tokens>` / 250,000 Tokens (%<percentage>)
- **Cache Hit:** %<cache-percentage>
- **Status:** 🟢 Green Zone (<180k) | 🟡 Yellow Zone (180k-250k wrap-only) | 🔴 Red Dump Zone (>250k circuit breaker)
```

---

## 🛠️ Execution Recipe for Steward / Butler
1. Check `tasks-axi done` (last completed tasks) and `.memory/LESSONS.md`.
2. Inspect active background tasks or subagents (`manage_task list`, `manage_subagents list`).
3. Query unresolved decisions and open questions via `frontier-axi list` (or `frontier.md` / `.memory/FRONTIER.md`).
4. Read current conversation tokens from `conversations/<conversation-id>.db` using the token inspector helper.
5. Render the 4-part concise card immediately.
