---
name: create
description: >-
  Triggered when the user invokes /create or asks to randomly create something.
  Launches a Visual Companion Server to guide the user through a trend-informed
  visual curation wizard, or goes fully random, synthesizing digital products and
  landing pages using your digital-product-creator and taste-this styles.
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

## Workflow & Event Loop

When this skill is triggered, execute the following state machine step-by-step:

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

---

### Step 3: Generate and Render Product

Once you have the configuration variables (Project Name, Category, Style, Trend):

1. **Use the Project Name** (`choices.projectName`) as the product brand throughout all generated content — landing page headings, ZIP folder naming, showcase title, and any copy.

2. **Synthesize Content** using the `digital-product-creator` rules and appropriate template structures:
   - **blog**: A two-column Neocities-style personal webspace. Main section has 3-4 retro blog posts with text/ASCII dividers, a status updates/shoutbox widget, an "About the Creator" widget, custom guestbook entries, and site-rings links.
   - **saas**: A landing page blueprint, API schema, database schema, payment flow framework.
   - **course**: 5-8 modules outlining a learning experience, worksheets, slide content.
   - **ebook**: Chapter guides, conversion funnel, introductory hook.
   - **plugin**: Chrome extension Manifest V3, VS Code settings configuration, or Figma plugin setup.
   - **game**: An HTML Canvas arcade skeleton, WebGL shader snippet, or interactive text adventure.
   - **dashboard**: Responsive telemetry grids, data graphs, prompt engineering workshop design.
   - **planner**: Launch marketing workflows, content scheduling calendars, product ops pipelines.
   - **wellness**: Nutritional schedulers, fitness workout splits, mindfulness habit loops.
   - **jarvis**: An interactive browser-based holographic dashboard containing a pulsing arc reactor visualization, voice-activated Web Speech controls, WebRTC camera viewport using MediaPipe hands for gesture recognition (fist click, palm move, pinch-zoom, swipe tabs), dynamic synthesized Web Audio sound FX, customizable external app links, and terminal-style sub-windows.

3. **Apply Design Aesthetic** matching the selected theme (`taste-this` instruction set):
   - **y2k** (Frutiger Metro / Web 2.0 Gloss):
     - Background: Vibrant gradients (Sky blue to aqua teal `#00BFFF` to `#00c3ff`).
     - Layout: Glassmorphic containers (`backdrop-filter: blur(10px)`), pill-shaped navigation, bubbly circular elements, vector star decorations, and circular vectors.
     - Borders: Clean translucent borders (`border: 1px solid rgba(255,255,255,0.4)`).
   - **retro-console** (Japanese 3D / burgeritchi):
     - Background: Dark slate/navy console background (`#080c14`).
     - Layout: Isometric layout borders, retro 90s console gaming HUD, thick gaming frames, ASCII art headers, retro status bars.
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

4. **Zip Generated Deliverables**:
   Once all files (such as HTML pages, copy files, layouts, schemas, configs) are generated in `<screen_dir>`, compress them into a single ZIP archive named `project_assets.zip` inside `<screen_dir>`. 
   Exclude configuration/meta files like `01_start.html`, `06_showcase.html` and `project_assets.zip` itself.
   
   Execute this Python one-liner to perform the compression cross-platform:
   ```bash
   python3 -c "import zipfile, os; zf = zipfile.ZipFile('<screen_dir>/project_assets.zip', 'w'); [zf.write(os.path.join('<screen_dir>', f), f) for f in os.listdir('<screen_dir>') if f not in ('01_start.html', '06_showcase.html', 'project_assets.zip')]; zf.close()"
   ```

5. **Visual QA Verification (Anti-Unstyled Prevention)**:
   To prevent unstyled pages (e.g., raw text on white background due to missing styles or incorrect CSS linking):
   - Check `<state_dir>/server-info` to find the current companion server port.
   - Run the headless browser capture script to screenshot the main generated file (e.g., `index.html`):
     `node /Users/heavn/.gemini/config/skills/create/scripts/capture-screen.js http://localhost:<port>/screens/index.html <screen_dir>/visual_qa.png 1500`
   - Use the `view_file` tool to examine `visual_qa.png` and confirm that all styling tokens, colors, layouts, and background rules render properly.
   - If the page looks unstyled, raw, or broken, self-repair the generated CSS and HTML immediately and re-verify until it is premium.

6. **Generate Showcase HTML (`06_showcase.html`)**:
   - Write a beautifully styled showcase page. It must render:
     - The product name, outcome, tagline, and pricing stack.
     - A modular representation of the product architecture (clickable cards, list items).
     - The complete landing page copy template, ready to copy.
     - The design system details (color chips, typography pairing, CSS variable overrides).
     - An interactive preview of the layout.
     - **A prominent "Download Assets Bundle (.zip)" link/button** pointing to the generated ZIP archive served via `/api/download?file=project_assets.zip` to let the user save the source files directly from the browser!
     - **A "Request Edits & Fix Bugs" Panel**:
       - An input text area for the user to type custom instructions (e.g., "Change the secondary color to cyan", "Fix the alignment of the camera frame").
       - A "Submit Request" button.
       - A JS click handler that calls:
         `window.submitEvent({ action: "refine", instruction: document.getElementById("edit-request-input").value })`
         and displays a premium overlay or loader saying: *"AI Agent is processing your edits... please wait, page will refresh automatically."*
   - Write this HTML file to `<screen_dir>/06_showcase.html` (and delete `01_start.html`).
   - The user's browser will automatically refresh to show the final product layout with the ZIP download button.

7. **Continuous Refinement Loop**:
   - Immediately after writing the showcase, start the background event watcher again:
     `python3 /Users/heavn/.gemini/config/skills/create/scripts/await-event.py <state_dir>/events 300`
   - Stop calling tools and go idle.
   - When woken up by the watcher completion message, read `<state_dir>/events`:
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
