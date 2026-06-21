---
name: create
description: >-
  Triggered when the user invokes /create or asks to generate/create a digital
  product, landing page, or interactive space (blog, SaaS page, course, ebook,
  dashboard, plugin, game, planner, wellness tracker, Jarvis HUD, or agent IDE).
  If /create is followed by a description (e.g. "/create an IDE that manages token
  usage"), treat the text as a creator brief and build directly. For a plain
  /create, gather the brief through AskUserQuestion, then synthesize a premium,
  ready-to-sell product and deliver it as a Cowork artifact plus downloadable files.
---

# Visual Creator Skill ("Create") — Claude Desktop / Cowork edition

This skill lets the user invoke `/create` to generate premium digital products and personal spaces, then delivers them natively inside Claude Desktop. It gathers the brief with **AskUserQuestion**, plans the build with the **task list**, synthesizes content using the `digital-product-creator` and `taste-this` design systems, and presents the result as a **Cowork artifact** plus **downloadable source files** — no local web server and no browser wizard required.

> **Why this differs from the original.** Earlier versions ran a Node "Visual Companion Server" on `localhost` and drove the user's browser through an event-watcher loop. In Claude Desktop the shell is a sandboxed Linux workspace, so a localhost server there is unreachable from the user's browser and there is no display to open. This edition replaces that whole mechanism with Cowork-native primitives: `AskUserQuestion`, the task list, `create_artifact`, and `present_files`.

## Dependencies & native equivalents

- **digital-product-creator** *(if installed)*: positioning, pricing, and product architecture. If absent, apply the "Product Philosophy" rules in this file directly.
- **taste-this** / **theme-factory** / **canvas-design** *(if installed)*: colors, typography, components, and premium aesthetics. If absent, use the "Design Aesthetic" specs below.
- **Planning & orchestration → native tools.** Do not depend on the Superpowers skills (brainstorming, writing-plans, executing-plans, dispatching-parallel-agents, etc.); they are usually not present in Claude Desktop. Use the built-in equivalents:
  - Planning / progress → the **task list** (`TaskCreate` / `TaskUpdate`).
  - Parallel or specialized work → the **Agent/Task tool** (spawn a UI agent and a backend agent for complex stacks).
  - Verification → a final QA task (screenshot + read, build/lint where applicable).
  Treat any reference to a Superpowers skill as "do this with the native equivalent."

## Working locations (never hardcode a username)

- `<skill_dir>` — the folder containing this `SKILL.md`. Reference bundled assets relative to it: `<skill_dir>/scripts/...` and `<skill_dir>/templates/...`.
- `<work_dir>` — where generated product files go. Use the **connected folder** if one is mounted; otherwise use your **outputs** folder. If the user wants the result saved to their computer and no folder is connected, request one with `request_cowork_directory` first.
- `<memory_file>` — `<work_dir>/create_memory.json`, a small JSON of the user's recurring preferences (stack, colors, brand voice). Optional; load it at the start if present, save/update it at the end.

Always write generated files under `<work_dir>`. Never write to a hardcoded path like `/Users/<name>/...`.

---

## Entry modes

**A. Inline brief** — `/create <description>` (text follows the command). Treat the full text as a creator brief. If it contains a URL or local path, ingest it first with `WebFetch` / `Read`; use `WebSearch` + `WebFetch` to pull live market/competitor positioning. Then ask **1–3** clarifying questions via `AskUserQuestion` only where the brief is genuinely ambiguous (e.g. target LLM provider, dark vs. light, free vs. paid).

**B. Guided wizard** — a plain `/create` (or "make me something"). Collect the brief with `AskUserQuestion` (see Step 1).

**C. Surprise me** — offered as an option inside the wizard. Randomize all choices and skip remaining questions.

---

## Step 1 — Gather the brief with AskUserQuestion

First, **load `<memory_file>`** if it exists (`Read`) to pre-fill sensible defaults.

Then ask with `AskUserQuestion`. Batch related questions into as few calls as possible (the tool allows up to 4 questions per call, 2–4 options each). Recommended questions — include a **"Surprise me"** option on the first:

1. **Category** — `blog`, `saas`, `course`, `ebook`, `chrome-extension`, `data-app`, `game`, `dashboard`, `planner`, `wellness`, `jarvis`, `ide`. (Add a "Surprise me — randomize everything" option here.)
2. **Design style** — `apple-hig`, `vercel-geist`, `linear-dark`, `stripe-saas`.
3. **Positioning / trend** — `ai-agents`, `solopreneur`, `local-first`, `zero-bloat`, `privacy-first`, `micro-community`.
4. **Stack** — `vanilla` (HTML+PWA), `react` (Vite), `nextjs`, `data-app`.

Follow up in a second call for **project name** and **accent color** (offer a few on-palette swatches plus "Other" for a custom hex). For `jarvis`/`ide`, also ask which **modules** to include (e.g. gestures, voice, terminal, diagnostics for Jarvis; researcher, architect, coder, tester, planner for IDE).

If the user picked **Surprise me**, randomly select one value per dimension, invent a project name + accent color, enable all default modules, and proceed without further questions.

Record the resulting config: `projectName`, `category`, `style`, `trend`, `stack`, `accentColor`, `modules[]`, and (inline mode) the parsed `brief`.

---

## Step 2 — Plan the build with the task list

Create a task list (`TaskCreate`) capturing the phases you'll run: synthesize content, scaffold stack, write files, package, visual QA, build showcase, deliver. Mark each `in_progress` / `completed` as you go so the user sees live progress.

For complex stacks (`react`, `nextjs`, `data-app`), consider spawning **parallel subagents** with the Agent/Task tool — e.g. a "UI agent" and a "backend/schema agent" — and wait for both to report completion before integrating. Skip subagents for simple `vanilla`/`blog` builds.

---

## Step 3 — Synthesize the product

### Product philosophy & commercial positioning
When generating any product (especially one meant to be sold):
1. **Solve a real problem** — anchor copy, features, and audience around one specific, high-pain problem.
2. **Give a clear plan** — frame deliverables/roadmap as a complete, step-by-step solution.
3. **Present as a premium brand** — cohesive palette (apply `accentColor`), converting headlines, high-fidelity landing page, clear pricing, polished assets.
4. **Generate bespoke assets** — don't rely only on CSS art or placeholders. If a logo, hero illustration, or texture would help, use your **image generation tool/skill** (if available), save it into `<work_dir>`, and link it in the code. If no image tool is available, use refined CSS/SVG art instead.
5. **Honor an inline brief** — when in inline mode, every headline, value prop, feature, and deliverable must speak directly to the user's stated audience and goals.

### Build
1. **Write files atomically** to avoid half-rendered previews: write to `index.html.tmp`, populate fully, then rename to `index.html`.
2. **Use the project name** as the brand throughout — headings, zip name, showcase title, copy.
3. **Scaffold the stack** in `<work_dir>`:
   - `react` / `nextjs`: run non-interactive scaffolds (e.g. `npx -y create-vite@latest . --template react` or `npx -y create-next-app@latest .`) in the sandbox; align subsequent writes to the framework.
   - `vanilla`: write `index.html` + assets directly, and auto-generate `manifest.json` (name, short_name, start_url, `display: standalone`, `theme_color` from `accentColor`) and a basic `service-worker.js`, linked in `<head>`, so it installs as a PWA.
4. **Content by category** (synthesize using `digital-product-creator` rules or the philosophy above):
   - **blog** — two-column personal webspace: 3–4 posts, status/shoutbox widget, "About the Creator", guestbook, site-rings.
   - **saas** — landing page blueprint, API schema, DB schema, payment-flow framework.
   - **course** — 5–8 modules, worksheets, slide content.
   - **ebook** — chapter guides, conversion funnel, hook.
   - **chrome-extension** — Manifest V3 extension ready for the Web Store.
   - **data-app** — interactive data viz / dashboard.
   - **game** — HTML Canvas arcade skeleton, WebGL shader, or text adventure.
   - **dashboard** — responsive telemetry grids, graphs.
   - **planner** — marketing workflows, content calendars, ops pipelines.
   - **wellness** — nutrition schedulers, workout splits, habit loops.
   - **jarvis** — copy `<skill_dir>/templates/jarvis-template.html` + `jarvis-template.css` to `index.html` + `styles.css` in `<work_dir>`, then replace `{{PROJECT_NAME}}`, `{{ASSISTANT_NAME}}` (`modules` brandName or "JARVIS"), `{{ACCENT_COLOR}}`, `{{ACCENT_GLOW}}` (translucent accent), `{{TREND_NAME}}`. Strip the HTML/JS for any module not in `modules[]`. Output must run fully client-side (Web Speech, WebRTC, AudioContext).
   - **ide** — copy `<skill_dir>/templates/ide-template.html` + `ide-template.css`, replace `{{PROJECT_NAME}}`, `{{ACCENT_COLOR}}`, `{{ACCENT_GLOW}}`, and build `{{AGENT_ROSTER_HTML}}` from `modules[]` (researcher 🔍, architect 📐, coder 💻, tester 🔬, planner 📅). Output must run client-side with a working Kanban board and simulated agent typing.

### Design aesthetic (premium only — no retro/unstyled defaults)
- **apple-hig** — pristine white `#FFFFFF` or OLED black `#000000`; minimalism; large SF Pro Display headings; glassmorphism (`backdrop-filter: blur(20px) saturate(180%)`); 16–24px radii; accent Apple blue `#007AFF` or brand color.
- **vercel-geist** — pure monochrome with subtle grays (`#111`, `#FAFAFA`); hyper-minimal grid; thin borders (`1px solid #EAEAEA`/`#333`); 6–8px radii; Inter/Geist.
- **linear-dark** — deep `#0E0F11` with radial gradient lighting; data-dense but clean; translucent cards (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)`); muted violet/indigo accents.
- **stripe-saas** — ivory / white / deep navy; high negative space; soft diffused shadows (`box-shadow: 0 20px 40px rgba(0,0,0,0.04)`); editorial serif headings + commercial sans body.

Always apply the user's `accentColor` to the theme's accent variables.

---

## Step 4 — Package deliverables

Zip the product files in `<work_dir>` into `project_assets.zip`, excluding meta files (`visual_qa.png`, `project_assets.zip` itself, and any showcase scratch):

```bash
python3 -c "import zipfile, os, sys; d=sys.argv[1]; zf=zipfile.ZipFile(os.path.join(d,'project_assets.zip'),'w'); [zf.write(os.path.join(d,f), f) for f in os.listdir(d) if f not in ('project_assets.zip','visual_qa.png')]; zf.close()" "<work_dir>"
```

---

## Step 5 — Visual QA (sandbox, no server)

Render the page from a `file://` URL — Puppeteer loads static files directly, so no localhost is needed:

```bash
node <skill_dir>/scripts/capture-screen.js "file://<work_dir>/index.html" "<work_dir>/visual_qa.png" 1500
```

If Puppeteer/Chromium isn't installed in the sandbox, run `npm install` in `<skill_dir>` (it fetches Chromium) or fall back to a careful code/style review. Then **`Read` `visual_qa.png`** and confirm styling, colors, layout, and backgrounds render correctly. If it looks unstyled or broken, diagnose the CSS/path issue, fix, and re-capture until premium. For `react`/`nextjs`, also attempt `npm run build` / `npx eslint .` and fix errors before continuing.

---

## Step 6 — Deliver: artifact + files

1. **Showcase as a Cowork artifact** — build the showcase with `create_artifact` (persisted and reopenable in Claude Desktop). It should render: product name, outcome, tagline, and pricing stack; a modular view of the architecture (cards/list); the full landing-page copy (copyable); the design system (color chips, type pairing, CSS variables); and a live preview of the layout. For a quick inline look you may also use `show_widget`. (Do **not** start a localhost server or write a `06_showcase.html` to be served — the artifact replaces it.)
2. **Deliver the files** — make sure the source files and `project_assets.zip` are in `<work_dir>`, then call `present_files` on them so the user gets clickable download cards. This replaces the old `/api/download` button.
3. **"Build with Claude Code" handoff** — offer a copy-pasteable prompt that tells Claude Code to read the generated layouts/tokens/components in `<work_dir>` and scaffold the full interactive app in the chosen `stack`. Do not run deploy CLIs yourself.
4. **Save memory** — write/update `<memory_file>` with the chosen stack, colors, and brand voice for next time.

---

## Step 7 — Iterate (chat-native, no event loop)

There is no background watcher. The user simply asks for changes in chat. When they do:
1. Read the current files in `<work_dir>`.
2. Apply the requested edits (fix bugs, adjust design/branding/copy).
3. Re-zip (Step 4) and re-run visual QA (Step 5).
4. Update the artifact (`update_artifact`) and re-present changed files.

Offer, where useful, to schedule a recurring variant (e.g. "a fresh landing-page concept every Monday") via a scheduled task.

---

## Common mistakes

- **Trying to serve a browser wizard / localhost UI.** The sandbox shell is not the user's machine; the user can't reach it. Use `AskUserQuestion` for input and a Cowork artifact for the showcase.
- **Hardcoding a user path** (`/Users/<name>/...`). Always use `<work_dir>` and skill-relative paths.
- **Depending on uninstalled Superpowers skills.** Use the native task list and Agent tool instead; degrade gracefully.
- **Skipping visual QA.** Don't ship unstyled HTML — capture `visual_qa.png` from the `file://` URL and `Read` it before delivering.
- **Forgetting to `present_files`.** The user can't see `<work_dir>`'s contents otherwise; always present the source files and the zip.
- **Putting the zip or QA screenshot inside the zip.** Exclude `project_assets.zip` and `visual_qa.png` from the archive.
