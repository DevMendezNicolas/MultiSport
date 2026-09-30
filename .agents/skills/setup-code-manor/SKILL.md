---
name: setup-code-manor
description: Setup and health-check wizard for Code-Manor. Auto-discovers workspaces from Antigravity 2.0, populates projects.json, and verifies environment toolchains across macOS, Linux, and Windows (WSL).
---

# 🛠️ Setup Code-Manor — Wizard & Environment Health Check

Run this skill to configure and verify the **Code-Manor** orchestration environment on your machine. It ensures all dependencies, toolchains, and `projects.json` registries are properly wired.

---

## 📋 What This Skill Performs

1. **Workspace Auto-Discovery (`projects.json` Sync):**
   - Automatically detects the host platform (Windows, macOS, or Linux).
   - On Windows: Inspects Antigravity desktop records (`$env:APPDATA\Antigravity\User\workspaceStorage`).
   - On macOS/Linux: Inspects `~/.config/Antigravity/User/workspaceStorage` or `~/Library/Application Support/Antigravity/User/workspaceStorage`.
   - Normalizes paths and indexes them into `~/.gemini/antigravity/projects.json` so **`/steward`** can locate any project instantly with zero token search overhead.

2. **Toolchain Verification:**
   - Checks `frontier-axi` executable availability (`which frontier-axi` or `wsl frontier-axi`).
   - Checks `tasks-axi` executable availability (`which tasks-axi`).
   - Checks `no-mistakes` gate availability (`which no-mistakes` or default install path).
   - Checks `git` and `gh` authentication status.
   - For Windows users: Checks WSL2 status if Linux-native tools are bridged via WSL.
   - **Automated Fix Recipe:** If `frontier-axi` or `tasks-axi` is missing, auto-installs via:
     ```bash
     npm install -g tasks-axi frontier-axi || npm install -g https://github.com/oguzalp7/frontier-axi.git
     ```

3. **Memory & SSOT Baseline:**
   - Checks whether target projects have `.memory/` directories, `.frontier.toml`, and `.tasks.toml` configs.
   - Offers to initialize `.memory/` (`ARCHITECTURE.md`, `PATTERNS.md`, `LESSONS.md`) if missing.

4. **Stack Detection & Canonical Makefile Provisioning:**
   - Detects the project's primary stack (e.g. TypeScript/Next.js, Python, Embedded/ESP32, Go).
   - Records `"stack"` attribute in `projects.json`.
   - If the repository lacks a `Makefile`, provisions the canonical `Makefile` template from `templates/makefiles/` to ensure the `make check` local gate is immediately active.

---

## ⚡ Quick CLI: `code-manor init .`

In addition to running `/setup-code-manor` in chat, developers can initialize any project directly from the terminal via the bundled CLI:

```bash
# Initialize current directory into projects.json, provision .memory/, .frontier.toml, and Makefile:
code-manor init .

# Or with custom policy:
code-manor init . --policy strict

# List all registered projects:
code-manor list
```

---

## 🚀 Execution Steps

When invoked, the agent should run the diagnostic check:

```bash
# Verify CLI toolchains
which frontier-axi || echo "frontier-axi not found in PATH"
which tasks-axi || echo "tasks-axi not found in PATH"
which no-mistakes || echo "no-mistakes not found in PATH"
which agy || echo "Notice: agy (antigravity-cli) not found. Fallback mode (invoke_subagent) will be active. Run: curl -fsSL https://antigravity.google/cli/install.sh | bash"
gh auth status || echo "gh CLI not authenticated"

# Auto-install AXI toolchains if missing
if ! command -v frontier-axi &> /dev/null; then
    echo "Installing frontier-axi..."
    npm install -g frontier-axi || npm install -g https://github.com/oguzalp7/frontier-axi.git
fi

if ! command -v tasks-axi &> /dev/null; then
    echo "Installing tasks-axi..."
    npm install -g tasks-axi
fi

# Verify projects.json existence
if [ -f "$HOME/.gemini/antigravity/projects.json" ]; then
    echo "projects.json found. Registered projects:"
    cat "$HOME/.gemini/antigravity/projects.json" | grep '"name"' || true
else
    echo "projects.json not initialized yet. Auto-scanning workspace storage..."
fi
```

Finally, present a clean summary table to the user with the discovered projects and verification status.
