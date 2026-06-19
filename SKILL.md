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

## Dependencies

- **digital-product-creator**: Used to position, price, and architect the digital product contents (Phase 2 & 4).
- **taste-this**: Used to define colors, typography, UI components, grids, and premium aesthetics matching the chosen style.

## Quick Start

Trigger this skill when the user runs `/create` or requests to "generate a random digital product/landing page".

```bash
# Launch the Visual Companion Server
node /Users/heavn/.gemini/config/skills/create/scripts/start-server.js --project-dir /Users/heavn/.gemini/antigravity/scratch --open
```

Capture the `screen_dir` and `state_dir` paths from the returned JSON.

---

## Inline Brief Mode (Skips Wizard)

If the user invokes `/create` with **accompanying text** (i.e., a description or request follows the command), do **not** launch the wizard. Instead:

1. Treat the full inline text as a **direct creator brief**.
   *Note: If the inline text contains a URL (e.g., a GitHub repo, Notion doc, or reference site) or a local file path, you MUST use your `read_url_content` or `read_file`/`view_file` tools to ingest the content BEFORE parsing the brief.*
2. Parse the description to extract implied context:
   - **Creator/Brand Name** — infer from any named product, brand, or project.
   - **Journey & Goals** — what the creator is trying to build and why.
   - **Creation** — the specific product, tool, or offering being described.
   - **Problem** — the audience pain point the product solves.
   - **Scope** — core features, integrations, and requirements mentioned.
3. Use this parsed brief exactly as if the user had submitted `choices.mode = "brief"` via the wizard. Proceed directly to **Step 1b** below (Start Server, Write Showcase, Skip Wizard Interaction).
4. Auto-select the best matching **Category**, **Stack** (e.g., vanilla, react, nextjs), **Style**, and **Trend** from the brief's context.

### Step 1b: Inline Brief — Server & Showcase Only

1. Run the server startup command:
   `node /Users/heavn/.gemini/config/skills/create/scripts/start-server.js --project-dir /Users/heavn/.gemini/antigravity/scratch --open`
2. Parse `screen_dir` and `state_dir` from the returned JSON.
3. Inform the user: *"Your brief has been received. Generating your product now — no wizard needed."*
4. Skip copying `01_start.html` and waiting for wizard events. Jump directly to **Step 3: Generate and Render Product** using the inline-parsed brief as `choices.brief`.

---

## Workflow & Event Loop

When this skill is triggered **without inline text**, execute the following state machine step-by-step:

### Step 1: Start the Visual Companion Server & Wait for Wizard
1. Run the server startup command using `node`:
   `node /Users/heavn/.gemini/config/skills/create/scripts/start-server.js --project-dir /Users/heavn/.gemini/antigravity/scratch --open`
2. Parse the returned JSON to extract:
   - `screen_dir` (e.g. `/Users/heavn/.gemini/antigravity/scratch/.superpowers/brainstorm/session_1234/content`)
   - `state_dir` (e.g. `/Users/heavn/.gemini/antigravity/scratch/.superpowers/brainstorm/session_1234/state`)
3. Copy `/Users/heavn/.gemini/config/skills/create/templates/01_start.html` to `<screen_dir>/01_start.html`.
4. Inform the user that the server has started and the visual wizard is opening in their browser.
5. **Start the background event watcher**:
   Run the following command as a background task (e.g., using `run_command` with a low `WaitMsBeforeAsync` of 500ms so it continues running in the background):
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
       - **Category**: one of `blog`, `saas`, `course`, `ebook`, `plugin`, `game`, `dashboard`, `planner`, `wellness`, `jarvis`
       - **Style**: one of `y2k`, `retro-console`, `claymorphic`, `crt-radio`, `frutiger-aero`, `vaporwave`, `cyber-goth`, `gothic-grunge`
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
4. **Bespoke AI Asset Generation**: Do not rely purely on CSS-only art or placeholders. If the product would benefit from a custom logo, hero illustration, or background texture, explicitly use your `generate_image` tool to create these bespoke assets. Save them directly into `<screen_dir>` and link them in your generated code.
5. **Align with Creator Brief**: If the user selected the `brief` mode, the generated copywriting (headlines, value propositions, features), layout elements, and deliverables MUST directly speak to and solve the user's specific audience problem and goals defined in `choices.brief`.

#### Synthesis Workflow
1. **Use the Project Name** (`choices.projectName`) as the product brand throughout all generated content — landing page headings, ZIP folder naming, showcase title, and any copy.

2. **Handle Framework Initializations & PWA (`choices.stack`)**:
   - If `choices.stack` is `react` or `nextjs`, run the appropriate scaffolding command (e.g., `npx -y create-vite@latest ./ --template react` or `npx -y create-next-app@latest ./`) inside `<screen_dir>`. Use non-interactive flags to avoid blocking prompts. Ensure your subsequent file writes (`index.jsx`, `App.jsx`, `page.tsx`) align with the framework structure.
   - For `vanilla`, write `index.html` and assets directly to `<screen_dir>`. Always auto-generate a `manifest.json` (defining `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color` based on `accentColor`) and a basic `service-worker.js` that caches the main assets, and link them in the `<head>` of `index.html` to make the product instantly installable as a Progressive Web App (PWA).

3. **Write Files Atomically**: To prevent the browser from reloading on an incomplete file (which displays an ugly white page), always write new HTML, CSS, or JS files to a temporary path first (e.g., `index.html.tmp`), populate the content completely, and then rename the file to its final name (e.g., `index.html`). The companion server watcher will ignore `.tmp` files and only trigger a clean refresh once the rename operation completes.

4. **Synthesize Content** using the `digital-product-creator` rules and appropriate template structures:
   - **blog**: A two-column Neocities-style personal webspace. Main section has 3-4 retro blog posts with text-based separators, a status updates/shoutbox widget, an "About the Creator" widget, custom guestbook entries, and site-rings links.
   - **saas**: A landing page blueprint, API schema, database schema, payment flow framework.
   - **course**: 5-8 modules outlining a learning experience, worksheets, slide content.
   - **ebook**: Chapter guides, conversion funnel, introductory hook.
   - **plugin**: Chrome extension Manifest V3, VS Code settings configuration, or Figma plugin setup.
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

4. **Apply Design Aesthetic** matching the selected theme (`taste-this` instruction set):
   - **y2k** (Frutiger Metro / Web 2.0 Gloss):
     - Background: Vibrant gradients (Sky blue to aqua teal `#00BFFF` to `#00c3ff`).
     - Layout: Glassmorphic containers (`backdrop-filter: blur(10px)`), pill-shaped navigation, bubbly circular elements, vector star decorations, and circular vectors.
     - Borders: Clean translucent borders (`border: 1px solid rgba(255,255,255,0.4)`).
   - **retro-console** (Japanese 3D / burgeritchi):
     - Background: Dark slate/navy console background (`#080c14`).
     - Layout: Isometric layout borders, retro 90s console gaming HUD, thick gaming frames, styled text headers, retro status bars.
     - Fonts: Monospace (`Fira Code`, `Courier New`) or pixelated look.
     - Filters: Grid overlays and CRT scanline styling (`background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`).
   - **claymorphic** (Tactile Clay / infini):
     - Background: Soft pastel background (`#edf2f4` or soft clay peach `#ffe5d9`).
     - Shape: Extra rounded shapes (`border-radius: 30px` to `40px`).
     - CSS Box Shadows (Inflated look):
       `box-shadow: 12px 12px 24px rgba(0,0,0,0.08), inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.8);`
     - Buttons: Tactile soft play-doh appearance.
   - **crt-radio** (Old VFD Screen / xylox & megaknecht):
     - Background: Brushed dark metal (`#121212`) or grunge post-apocalyptic fallout frames.
     - Display: Bright glowing red or amber LCD panels (`background: #2a0000; border: 3px dashed #000; color: #ff3333; text-shadow: 0 0 10px #ff3333; font-family: Courier, monospace`).
     - Widgets: Radio tuner indicators, analog status buttons, segmented display panels.
   - **frutiger-aero** (Glossy Aqua Skeuomorphism):
     - Background: Bright sky-blue to fresh lime gradients (`linear-gradient(135deg, #00bfff, #00ff88)`).
     - Style: Ultra-glossy glass containers, water droplet overlays, aurora-like background glows, and floating bubbles.
     - Borders: Semi-transparent white borders with bright inner drop shadows.
   - **vaporwave** (90s Glitch Lounge):
     - Background: Pastel pink to twilight purple gradients (`linear-gradient(to bottom, #ff007f, #7f00ff)`).
     - Style: Retro wireframe grids (`background-image: linear-gradient(rgba(255, 0, 127, 0.1) 1px, transparent 1px)`), simulated VHS overlay filters, and 3D geometric busts or palm tree vectors.
     - Fonts: Playful italicized sans-serif paired with Japanese text accents.
   - **cyber-goth** (Neon Obsidian):
     - Background: Absolute dark carbon/obsidian backgrounds (`#0a0a0c`).
     - Style: Dark tech borders with high-contrast glowing neon magenta or cyan drops (`box-shadow: 0 0 15px rgba(255, 0, 85, 0.5)`).
     - Accent: Bright wireframe outlines, circuit grid patterns, and technical details.
   - **gothic-grunge** (Medieval Parchment):
     - Background: High-contrast parchment paper or textured grunge gray background.
     - Style: Thick, jagged hand-drawn borders, heavy ink splatters, medieval banners, and distressed metallic frames.
     - Fonts: Blackletter, gothic-serif, or retro typewriters.

5. **Zip Generated Deliverables**:
   Once all files (such as HTML pages, copy files, layouts, schemas, configs) are generated in `<screen_dir>`, compress them into a single ZIP archive named `project_assets.zip` inside `<screen_dir>`. 
   Exclude configuration/meta files like `01_start.html`, `06_showcase.html` and `project_assets.zip` itself.
   
   Execute this Python one-liner to perform the compression cross-platform:
   ```bash
   python3 -c "import zipfile, os; zf = zipfile.ZipFile('<screen_dir>/project_assets.zip', 'w'); [zf.write(os.path.join('<screen_dir>', f), f) for f in os.listdir('<screen_dir>') if f not in ('01_start.html', '06_showcase.html', 'project_assets.zip')]; zf.close()"
   ```

6. **Visual QA Verification (Anti-Unstyled Prevention)**:
   To prevent unstyled pages (e.g., raw text on white background due to missing styles or incorrect CSS linking):
   - Check `<state_dir>/server-info` to find the current companion server port.
   - Run the headless browser capture script to screenshot the main generated file (e.g., `index.html`):
     `node /Users/heavn/.gemini/config/skills/create/scripts/capture-screen.js http://localhost:<port>/screens/index.html <screen_dir>/visual_qa.png 1500`
   - Use the `view_file` tool to examine `visual_qa.png` and confirm that all styling tokens, colors, layouts, and background rules render properly.
   - If the page looks unstyled, raw, or broken, self-repair the generated CSS and HTML immediately and re-verify until it is premium.

7. **Generate Showcase HTML (`06_showcase.html`)**:
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
     - **A "Build with Claude Code" Button**:
       - A JS click handler that calls:
         `window.submitEvent({ action: "deploy" })`
         and displays a loader saying: *"Generating Claude Code Prompts..."*
   - Write this HTML file to `<screen_dir>/06_showcase.html` (and delete `01_start.html`).
   - The user's browser will automatically refresh to show the final product layout with the ZIP download button.

8. **Continuous Refinement Loop**:
   - Immediately after writing the showcase, start the background event watcher again:
     `python3 /Users/heavn/.gemini/config/skills/create/scripts/await-event.py <state_dir>/events 300`
   - Stop calling tools and go idle.
   - When woken up by the watcher completion message, read `<state_dir>/events`:
     - If the last event logged is `{"action":"deploy"}`:
       1. Reply to the user with a tailored markdown prompt that they can copy and paste into Claude Code. This prompt should instruct Claude to initialize the project, read the generated UI layouts, design tokens, and components from `<screen_dir>`, and scaffold out the full interactive application using the selected `choices.stack`.
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
- **Skipping Visual QA Verification**: Delivering unstyled, raw Times New Roman HTML files (e.g. because CSS assets weren't written or paths were misaligned). You MUST run `capture-screen.js` to render the pages and visually verify styling via `view_file` before completing the creation.
