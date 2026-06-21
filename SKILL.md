---
name: create
description: >-
  Triggered when the user invokes /create or asks to randomly create something.
  If the user writes /create followed by a description or request (e.g. "/create an IDE
  that manages token usage"), treat the text as an inline brief and generate the product
  directly without launching the wizard. For a plain /create invocation, launches the
  Visual Companion Server to guide the user through a trend-informed visual curation
  wizard, or goes fully random, synthesizing digital products and landing pages using
  your digital-product-creator and taste-this styles.
---

# Visual Creator Skill ("Create")

This skill allows the user to invoke `/create` to generate digital products or personal spaces (landing pages, Neocities blogs, courses, ebooks, dashboards, template packs, plugins, games, planners, wellness trackers) using a visual wizard or fully random generation. It coordinates the **Visual Companion Server** to handle user interaction and renders premium layouts using your curated design systems.

As an overarching directive, adhere to the `using-superpowers` skill philosophy. If you repeatedly encounter roadblocks or inefficiencies during product creation, proactively utilize the `writing-skills` skill to author new specialized workflows.

## Dependencies

- **digital-product-creator**: Used to position, price, and architect the digital product contents (Phase 2 & 4).
- **taste-this**: Used to define colors, typography, UI components, grids, and premium aesthetics matching the chosen style.
- **Superpowers Suite**: This skill acts as a master orchestrator over the Superpowers toolkit. You MUST heavily utilize: `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`, `using-git-worktrees`, `using-superpowers`, and `writing-skills`.

## Quick Start

Trigger this skill when the user runs `/create` or requests to "generate a random digital product/landing page".

```bash
# Launch the Visual Companion Server
node /Users/heavn/.gemini/config/skills/create/scripts/start-server.js --project-dir /Users/heavn/.gemini/antigravity/scratch --open
```

Capture the `screen_dir` and `state_dir` paths from the returned JSON.

---

## Inline Brief Mode (Dynamic Wizard)

If the user invokes `/create` with **accompanying text** (i.e., a description or request follows the command), you must present a dynamic conversational wizard.

1. Treat the full inline text as a **direct creator brief**.
   *Note: If the inline text contains a URL or a local file path, you MUST use your `WebFetch` or `Read` tools to ingest the content BEFORE parsing the brief. Additionally, use `WebSearch` and `WebFetch` tools to actively scrape live market positioning data for mentioned competitors.*
2. **Context Awareness via Graphify**: If you are inside an existing codebase or the user wants to add to an existing project, run `graphify` (if the skill is available and the project is large enough) to map the existing codebase structure and schemas to ensure the generated code integrates seamlessly.
3. **Superpowers Planning**: Use the `brainstorming` skill to explore potential product architectures and feature sets. Following that, use the `writing-plans` skill to formalize an implementation plan.
4. Parse the description and plan to extract implied context and **generate 3-4 highly specific clarifying questions** to resolve any ambiguity (e.g., "Which LLM provider APIs are you targeting?", "Do you prefer a dark technical theme or a light minimalist theme?").
5. Proceed to **Step 1b** below.

### Step 1b: Inline Brief — Serve Dynamic Wizard

1. Run the server startup command:
   `node /Users/heavn/.gemini/config/skills/create/scripts/start-server.js --project-dir /Users/heavn/.gemini/antigravity/scratch --open`
2. Parse `screen_dir` and `state_dir` from the returned JSON.
3. Copy `/Users/heavn/.gemini/config/skills/create/templates/02_inline_wizard.html` to `<screen_dir>/02_inline_wizard.html`. Open it and inject your 3-4 generated clarifying questions into the `#questions-container` div as HTML inputs, ensuring the submit button captures them and calls `window.submitEvent({ action: "inline_answers", answers: [...] })`.
4. Inform the user that the dynamic wizard is ready in their browser.
5. **Start the background event watcher**:
   Run the following command as a background task (using the `Bash` tool with `run_in_background: true`):
   `python3 /Users/heavn/.gemini/config/skills/create/scripts/await-event.py <state_dir>/events 300`
6. Stop calling tools. The system will automatically wake you up when the background watcher completes (once the user submits their answers in the dynamic wizard).

---

## Workflow & Event Loop

When this skill is triggered **without inline text**, execute the following state machine step-by-step:

### Step 1: Start the Visual Companion Server & Wait for Wizard
1. **Persistent Memory Load**: Check for `/Users/heavn/.gemini/antigravity/create_memory.json`. If it exists, read it using `Read` to load the user's historical preferences (e.g., preferred stack, colors, tone).
2. Run the server startup command using `node`:
   `node /Users/heavn/.gemini/config/skills/create/scripts/start-server.js --project-dir /Users/heavn/.gemini/antigravity/scratch --open`
2. Parse the returned JSON to extract:
   - `screen_dir` (e.g. `/Users/heavn/.gemini/antigravity/scratch/.superpowers/brainstorm/session_1234/content`)
   - `state_dir` (e.g. `/Users/heavn/.gemini/antigravity/scratch/.superpowers/brainstorm/session_1234/state`)
3. Copy `/Users/heavn/.gemini/config/skills/create/templates/01_start.html` to `<screen_dir>/01_start.html`.
4. Inform the user that the server has started and the visual wizard is opening in their browser.
5. **Start the background event watcher**:
   Run the following command as a background task (using the `Bash` tool with `run_in_background: true` so it continues running in the background):
   `python3 /Users/heavn/.gemini/config/skills/create/scripts/await-event.py <state_dir>/events 300`
6. Stop calling tools. The system will automatically wake you up when the background watcher completes (once the user submits the wizard).

### Step 2: Read Choices & Synthesize Product
Once you are woken up by the background task completion message:
1. Read the stdout of the completed task or view `<state_dir>/events`. You will find the JSON event bundle on the last line.
2. Extract the choices:
   - `choices.projectName` — the user's chosen project name (always present, set via input or random generator).
   - `choices.stack` — the requested architecture (e.g., `vanilla`, `react`, `nextjs`).
   - `choices.customizerState` — the user's branding and module configurations:
     - `brandName` — assistant name (for Jarvis), space title (for blog), or app headline (for saas).
     - `accentColor` — Hex code for custom styling overrides (e.g. `#00E5FF`). Override the accent styling variables with this.
     - `modules` — Array of active feature/module IDs toggled on (e.g. `["gestures", "voice", "terminal"]`). Only include these modules in the final output.
   - If `choices.mode` is `random`:
     - Randomly select values:
       - **Category**: one of `blog`, `saas`, `course`, `ebook`, `chrome-extension`, `data-app`, `game`, `dashboard`, `planner`, `wellness`, `jarvis`
       - **Style**: one of `apple-hig`, `vercel-geist`, `linear-dark`, `stripe-saas`
       - **Trend**: one of `ai-agents`, `solopreneur`, `neo-brutalist`, `local-first`, `zero-bloat`, `privacy-first`, `micro-community`
       - **CustomizerState**: select random options:
         - `brandName`: a creative tagline or voice name
         - `accentColor`: a matching hexadecimal color
         - `modules`: all default modules enabled
   - If `choices.mode` is `wizard`:
     - Use the selections recorded:
       - `choices.category`
       - `choices.style`
       - `choices.trend`
   - If `choices.mode` is `brief`:
     - Use the Custom Creator Brief parameters:
       - `choices.brief.creatorName` — Creator/Brand Name
       - `choices.brief.journeyGoals` — Background and motivation
       - `choices.brief.creation` — Offering detail
       - `choices.brief.problem` — Audience pain point
       - `choices.brief.scope` — Core features and scope
     - Analyze the brief context to automatically select the most appropriate Category, Style, and Trend matching the brief, and dynamically generate cohesive `brandName`, `accentColor`, and active `modules` tailored to solve their specific customer problems.

---

### Step 3: Generate and Render Product

Once you have the configuration variables (Project Name, Category, Stack, Style, Trend):

#### Product Philosophy & Commercial Positioning
When generating any digital product (especially if the user aims to sell it):
1. **Solve a Real Problem**: Anchor the product copywriting, feature list, and target audience around solving a specific, high-pain customer problem (e.g. automating a slow task, providing rare educational structures, saving cost).
2. **Create a Clear Plan**: Frame the product deliverables, roadmap, and files as a complete, step-by-step solution to that problem.
3. **Present it as a Premium Brand**: Design beautiful typography, use cohesive color palettes (applying the `customizerState.accentColor`), write converting headlines/taglines, and present the final output with a high-fidelity landing page, pricing structures, and assets package that feels premium and ready-to-sell without compromising quality.
4. **Bespoke AI Asset Generation**: Do not rely purely on CSS-only art or placeholders. If the product would benefit from a custom logo, hero illustration, or background texture, explicitly use your image generation tool to create these bespoke assets. Save them directly into `<screen_dir>` and link them in your generated code.
5. **Align with Creator Brief**: If the user selected the `brief` mode, the generated copywriting (headlines, value propositions, features), layout elements, and deliverables MUST directly speak to and solve the user's specific audience problem and goals defined in `choices.brief`.

#### Synthesis Workflow
1. **Workspace Setup**: If creating the project inside an existing repository, invoke the `using-git-worktrees` skill to safely isolate this new product generation from the main branch. Use the `executing-plans` skill to methodically execute your written plan.
2. **Use the Project Name** (`choices.projectName`) as the product brand throughout all generated content — landing page headings, ZIP folder naming, showcase title, and any copy.

3. **Handle Framework Initializations & PWA (`choices.stack`)**:
   - If `choices.stack` is `react` or `nextjs`, run the appropriate scaffolding command (e.g., `npx -y create-vite@latest ./ --template react` or `npx -y create-next-app@latest ./`) inside `<screen_dir>`. Use non-interactive flags to avoid blocking prompts. Ensure your subsequent file writes (`index.jsx`, `App.jsx`, `page.tsx`) align with the framework structure.
   - **Multi-Agent Orchestration**: For complex frameworks (`react`, `nextjs`, `data-app`), utilize the `dispatching-parallel-agents` and `subagent-driven-development` skills. Spawn specialized subagents (e.g., a Backend Agent and a UI Agent) to execute the implementation plan in parallel. **CRITICAL**: Wait for all parallel subagents to report completion via the `verification-before-completion` skill before proceeding. (Skip parallel agents for simple `vanilla` or `blog` stacks to save quota).
   - For `vanilla`, write `index.html` and assets directly to `<screen_dir>`. Always auto-generate a `manifest.json` (defining `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color` based on `accentColor`) and a basic `service-worker.js` that caches the main assets, and link them in the `<head>` of `index.html` to make the product instantly installable as a Progressive Web App (PWA).

4. **Backend & Cloud Integration (`choices.backend`)**:
   - If `choices.backend` is `firebase`, leverage the `firebase-firestore` and `firebase-auth-basics` skills to immediately provision the schema, rules, and configuration inside `<screen_dir>`.

5. **Write Files Atomically**: To prevent the browser from reloading on an incomplete file (which displays an ugly white page), always write new HTML, CSS, or JS files to a temporary path first (e.g., `index.html.tmp`), populate the content completely, and then rename the file to its final name (e.g., `index.html`). The companion server watcher will ignore `.tmp` files and only trigger a clean refresh once the rename operation completes.

6. **Synthesize Content** using the `digital-product-creator` rules and appropriate template structures:
   - **blog**: A two-column Neocities-style personal webspace. Main section has 3-4 retro blog posts with text/ASCII dividers, a status updates/shoutbox widget, an "About the Creator" widget, custom guestbook entries, and site-rings links.
   - **saas**: A landing page blueprint, API schema, database schema, payment flow framework.
   - **course**: 5-8 modules outlining a learning experience, worksheets, slide content.
   - **ebook**: Chapter guides, conversion funnel, introductory hook.
   - **chrome-extension**: Manifest V3 Chrome extensions ready for the Web Store. Use the `chrome-extensions` skill.
   - **data-app**: Interactive data visualizations or dashboards. Use the `building-data-apps` skill.
   - **game**: An HTML Canvas arcade skeleton, WebGL shader snippet, or interactive text adventure.
   - **dashboard**: Responsive telemetry grids, data graphs, prompt engineering workshop design.
   - **planner**: Launch marketing workflows, content scheduling calendars, product ops pipelines.
   - **wellness**: Nutritional schedulers, fitness workout splits, mindfulness habit loops.
   - **jarvis**: An interactive browser-based holographic dashboard.
     - Copy the Jarvis templates from `/Users/heavn/.gemini/config/skills/create/templates/jarvis-template.html` and `/Users/heavn/.gemini/config/skills/create/templates/jarvis-template.css` to `index.html` and `styles.css` inside `<screen_dir>`.
     - **Replace parameters** inside `index.html` and `styles.css`:
       - `{{PROJECT_NAME}}` -> `choices.projectName`
       - `{{ASSISTANT_NAME}}` -> `choices.customizerState.brandName || "JARVIS"`
       - `{{ACCENT_COLOR}}` -> `choices.customizerState.accentColor`
       - `{{ACCENT_GLOW}}` -> A translucent version of accentColor (e.g. `rgba(0, 229, 255, 0.35)`)
       - `{{TREND_NAME}}` -> `choices.trend`
     - **Modular Module Filters**: Inspect `choices.customizerState.modules` (e.g., `["gestures", "voice", "audio-synth", "terminal", "diagnostics", "space-map"]`):
       - If a module is NOT present, strip out its corresponding HTML viewport node and supporting JS logic block from `index.html` (e.g. if `gestures` is disabled, omit the MediaPipe script tags and webcam feed widgets).
     - Ensure the final output page runs completely offline/client-side and uses browser APIs (Web Speech, WebRTC, AudioContext) to handle all core features.
   - **ide**: An interactive browser-based developer workspace (Agent IDE).
     - Copy the templates from `/Users/heavn/.gemini/config/skills/create/templates/ide-template.html` and `/Users/heavn/.gemini/config/skills/create/templates/ide-template.css` to `index.html` and `ide-template.css` inside `<screen_dir>`.
     - **Replace parameters** inside `index.html` and `ide-template.css`:
       - `{{PROJECT_NAME}}` -> `choices.projectName`
       - `{{ACCENT_COLOR}}` -> `choices.customizerState.accentColor`
       - `{{ACCENT_GLOW}}` -> A translucent version of accentColor (e.g., `rgba(57, 255, 20, 0.25)`)
     - **Dynamic Agent Roster Generation**: Compile the `{{AGENT_ROSTER_HTML}}` placeholder by mapping each ID in `choices.customizerState.modules` to its avatar card:
       - `researcher` -> avatar `🔍`, name `AI Researcher`
       - `architect` -> avatar `📐`, name `AI Architect`
       - `coder` -> avatar `💻`, name `AI Lead Coder`
       - `tester` -> avatar `🔬`, name `AI QA Tester`
       - `planner` -> avatar `📅`, name `AI Marketing Planner`
     - Ensure the output IDE runs completely client-side, allows adding tasks to a Kanban board, and simulates active agent typing/editing sequences in the editor window.

7. **Apply Design Aesthetic** matching the selected theme (No retro themes allowed. Only use premium, modern aesthetics inspired by `taste-this`):
   - **apple-hig** (Apple iOS/macOS Style):
     - Background: Pristine white (`#FFFFFF`) or deep OLED black (`#000000`) with very subtle light gray/dark gray sectioning.
     - Layout: Absolute minimalism. Large, bold, tracking-adjusted typography for headings (SF Pro Display). Generous whitespace.
     - Elements: Glassmorphism (`backdrop-filter: blur(20px) saturate(180%)`), soft translucent overlays, large border radii for cards (`border-radius: 16px` to `24px`).
     - Accents: Signature Apple blue (`#007AFF`) or a vibrant brand color. High contrast, perfect visual hierarchy.
   - **vercel-geist** (Vercel/Next.js Style):
     - Background: Pure monochrome (`#000000` or `#FFFFFF`) relying on subtle grays (e.g., `#111111`, `#FAFAFA`) for depth.
     - Layout: Developer-focused, hyper-minimalist. Extreme precision, strict structural grid.
     - Elements: Very thin borders (`1px solid #EAEAEA` or `#333`), small border radii (`border-radius: 6px` or `8px`), no heavy shadows.
     - Typography: Inter or Geist. High contrast text, restrained font weights.
   - **linear-dark** (Linear App Style):
     - Background: Deep technical dark mode (`#0E0F11`) with subtle radial gradients for illumination.
     - Layout: Highly structural, data-dense but clean. Beautiful custom iconography.
     - Elements: Dark translucent cards, subtle inner borders (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)`), refined focus states.
     - Accents: Muted primary accents (e.g., soft violet or indigo) with high contrast white text.
   - **stripe-saas** (Premium SaaS / Stripe-esque):
     - Background: Sophisticated ivory, stark white, or deep navy.
     - Layout: High negative space, quiet typography, clean cards with soft, large diffused shadows (`box-shadow: 0 20px 40px rgba(0,0,0,0.04)`).
     - Accents: Refined serif accents for headings, with highly accessible and commercial sans-serif body text.

8. **Zip Generated Deliverables**:
   Once all files (such as HTML pages, copy files, layouts, schemas, configs) are generated in `<screen_dir>`, compress them into a single ZIP archive named `project_assets.zip` inside `<screen_dir>`. 
   Exclude configuration/meta files like `01_start.html`, `06_showcase.html` and `project_assets.zip` itself.
   
   Execute this Python one-liner to perform the compression cross-platform:
   ```bash
   python3 -c "import zipfile, os; zf = zipfile.ZipFile('<screen_dir>/project_assets.zip', 'w'); [zf.write(os.path.join('<screen_dir>', f), f) for f in os.listdir('<screen_dir>') if f not in ('01_start.html', '06_showcase.html', 'project_assets.zip')]; zf.close()"
   ```

9. **Logical QA & Verification**:
   - Leverage the `test-driven-development` skill to write and run unit tests for complex business logic.
   - For JS/React/NextJS apps, attempt to build the code (`npm run build`) or lint it (`npx eslint .`). If errors are caught, utilize the `systematic-debugging` skill to deeply analyze, diagnose, and fix the codebase before re-running.

10. **Visual QA Verification (Anti-Unstyled Prevention)**:
    - Check `<state_dir>/server-info` to find the current companion server port.
    - Run the headless browser capture script to screenshot the main generated file (e.g., `index.html`):
      `node /Users/heavn/.gemini/config/skills/create/scripts/capture-screen.js http://localhost:<port>/screens/index.html <screen_dir>/visual_qa.png 1500`
    - Use the `Read` tool to examine `visual_qa.png` and confirm that all styling tokens, colors, layouts, and background rules render properly.
    - If the page looks unstyled or broken, instantly deploy the `systematic-debugging` skill to diagnose the root CSS/pathing issue and re-verify until it is premium.

11. **Final Delivery & Verification**:
    - Invoke the `verification-before-completion` skill to ensure every single requirement from the inline brief and generated plan has been met flawlessly.
    - If working within a Git repository, use `requesting-code-review` to prepare a PR-ready diff, and `receiving-code-review` to handle user feedback. Finally, use `finishing-a-development-branch` to cleanly wrap up the Git worktree.

12. **Generate Showcase HTML (`06_showcase.html`)**:
   - Write a beautifully styled showcase page. It must render:
     - The product name, outcome, tagline, and pricing stack.
     - A modular representation of the product architecture (clickable cards, list items).
     - The complete landing page copy template, ready to copy.
     - The design system details (color chips, typography pairing, CSS variable overrides).
     - An interactive preview of the layout.
     - **A prominent "Download Assets Bundle (.zip)" link/button** pointing to the generated ZIP archive served via `/api/download?file=project_assets.zip` to let the user save the source files directly from the browser!
     - **A "Request Edits & Fix Bugs" Panel**:
       - Inject a lightweight `visual-inspector.js` script into the preview window or showcase. This script should listen for `mouseover` to outline elements, and `click` to select them. When a user clicks an element, auto-fill the edit request input with the specific component's context (e.g., *"Refine the `<div class='hero-card'>`..."*).
       - An input text area for the user to type custom instructions.
       - A "Submit Request" button.
       - A JS click handler that calls:
         `window.submitEvent({ action: "refine", instruction: document.getElementById("edit-request-input").value })`
         and displays a premium overlay or loader saying: *"AI Agent is processing your edits... please wait, page will refresh automatically."*
     - **A "Build with Antigravity" Button**:
       - A JS click handler that calls:
         `window.submitEvent({ action: "deploy" })`
         and displays a loader saying: *"Generating Antigravity Prompts..."*
   - Write this HTML file to `<screen_dir>/06_showcase.html` (and delete `01_start.html` or `02_inline_wizard.html` if they exist to keep the directory clean).
   - The user's browser will automatically refresh to show the final product layout with the ZIP download button.
   - **Persistent Memory Save**: Write or update `/Users/heavn/.gemini/antigravity/create_memory.json` with the newly generated or selected preferences (stack, colors, brand voice) so you can learn for next time.

13. **Continuous Refinement Loop**:
   - Immediately after writing the showcase, start the background event watcher again:
     `python3 /Users/heavn/.gemini/config/skills/create/scripts/await-event.py <state_dir>/events 300`
   - Stop calling tools and go idle.
   - When woken up by the watcher completion message, read `<state_dir>/events`:
     - If the last event logged is `{"action":"deploy"}`:
       1. Reply to the user with a tailored markdown prompt that they can copy and paste into Antigravity. This prompt should instruct Antigravity to initialize the project, read the generated UI layouts, design tokens, and components from `<screen_dir>`, and scaffold out the full interactive application using the selected `choices.stack`.
       2. Do NOT run any deployment CLI commands yourself.
     - If the last event logged is `{"action":"refine","instruction":"..."}`:
       1. Read the `instruction` string.
       2. Read the current code files in `<screen_dir>`.
       3. Modify the files (HTML, CSS, JS etc.) based on the user's refinement instructions to fix any bugs or adjust design/branding features.
       4. Re-zip the deliverables by running the Python one-liner (step 4).
       5. Re-run `capture-screen.js` (step 5) to inspect the updated visuals.
       6. Overwrite the main page and the showcase page `06_showcase.html` (making sure to preserve the feedback panel).
       7. Loop back to step 7 (start the watcher again to await further adjustments).

---

## Common Mistakes

- **Not starting the await-event.py script**: If you don't start the background event watcher, you will go idle and the wizard in the browser won't progress when the user submits their choices.
- **Forgetting to delete prior step file**: Keep `<screen_dir>` clean by deleting the previous step's HTML file so the server immediately serves the newest file and avoids confusion.
- **Including showcase in the ZIP**: Ensure `06_showcase.html` is omitted from the ZIP file so that the client only gets their clean raw assets/deliverables to sell.
- **Skipping Visual QA Verification**: Delivering unstyled, raw Times New Roman HTML files (e.g. because CSS assets weren't written or paths were misaligned). You MUST run `capture-screen.js` to render the pages and visually verify styling via `Read` before completing the creation.
