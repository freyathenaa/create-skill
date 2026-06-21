# create — variants

This repository houses two editions of the `create` skill. They share the same product
catalog, design aesthetics, and templates, but target different runtimes.

| | **Antigravity edition** | **Claude Desktop edition** |
| :--- | :--- | :--- |
| **Location** | repository root (`./SKILL.md`, `./README.md`, `./scripts`, `./templates`) | [`./claude/`](./claude/) |
| **Runtime** | Google Antigravity (agent shell is the user's machine) | Claude Desktop / Cowork (agent shell is a sandboxed Linux workspace) |
| **Input** | Browser wizard served by a local Node "Visual Companion Server" + Python event-watcher loop | `AskUserQuestion` (native multiple-choice) |
| **Showcase** | `06_showcase.html` served on `localhost` | `create_artifact` (persisted, reopenable) |
| **Downloads** | `/api/download` endpoint | `present_files` cards |
| **Planning / parallelism** | Superpowers skills | Native task list + Agent/Task tool |
| **Visual QA** | Puppeteer against `localhost` | Puppeteer against a `file://` URL |
| **Paths** | `~/.gemini/...` | `<work_dir>` (connected/outputs folder) + skill-relative |
| **Skill path** | `~/.gemini/config/skills/create/` | `~/.claude/skills/create/` |

## Why two editions

The Antigravity edition assumes the agent's shell *is* the user's computer, so it can run a
web server on `localhost` and drive the user's browser. In Claude Desktop the shell is an
isolated sandbox — a server it starts there is unreachable from the user's browser and there
is no display to open. The Claude edition replaces that whole mechanism with Cowork-native
primitives (`AskUserQuestion`, the task list, `create_artifact`, `present_files`).

## Installing

- **Antigravity:** copy the repo root into `~/.gemini/config/skills/create/`.
- **Claude Desktop:** copy [`./claude/`](./claude/) into `~/.claude/skills/create/`.

## Splitting the Claude edition into its own repo (later)

The `claude/` folder is self-contained. To give it an independent repo, either copy the
folder out and `git init`, or preserve history with:

```bash
git subtree split --prefix=claude -b create-claude
# then push the create-claude branch to a new remote as its main branch
```
