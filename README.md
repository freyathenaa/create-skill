<div align="center">
  <img src="https://img.shields.io/badge/Antigravity-Create%20Skill-blueviolet?style=for-the-badge&logo=google-cloud" alt="Antigravity Create Skill Banner" />

  # ✨ Antigravity: Create Skill
  **Autonomous Visual Wizard & Digital Product Synthesizer**

  [![GitHub license](https://img.shields.io/github/license/freyathenaa/create-skill?style=flat-square&color=8A2BE2)](https://github.com/freyathenaa/create-skill/blob/main/LICENSE)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
  [![Python Version](https://img.shields.io/badge/python-3.x-blue?style=flat-square)](https://python.org)
  [![Puppeteer](https://img.shields.io/badge/puppeteer-latest-orange?style=flat-square)](https://pptr.dev)

  ---
</div>

An advanced autonomous AI agent skill for launching interactive visual creation wizards, guiding design selections, and dynamically synthesizing premium digital products and landing pages using trend-informed design systems.

---

## 🎨 Visual Workflow

```mermaid
graph TD
    A[User triggers /create] --> B[Visual Companion Server starts]
    B --> C[Interactive Wizard web UI opens]
    C --> D{Select Creation Mode}
    D -->|Interactive Visual Wizard| E1[Select Category / Style / Trend]
    D -->|Custom Creator Brief| E2[Fill out Journey, Goals, & Scope Brief]
    D -->|Fully Random| E3[AI picks random trending configuration]
    E1 --> F[Antigravity Agent synthesizes files]
    E2 --> F
    E3 --> F
    F --> G[Puppeteer captures preview]
    G --> H[Assets packaged and delivered]
    
    style A fill:#4F46E5,stroke:#312E81,stroke-width:2px,color:#fff
    style D fill:#10B981,stroke:#065F46,stroke-width:2px,color:#fff
    style H fill:#8B5CF6,stroke:#4C1D95,stroke-width:2px,color:#fff
```

## 🚀 Key Features

*   **✍️ Custom Creator Brief**: A dedicated form mode that collects deep contextual information about the user's background, goals, the exact problems they want to solve, and the project's overall scope to synthesize a tailored solution.
*   **🎭 Curated Visual Wizard**: An interactive visual pathway to guide users through selecting premium product vectors, design aesthetics (such as Frutiger Aero, Vaporwave, and Retro JP Console), and market trends.
*   **📡 Visual Companion Server**: A localized server (`scripts/start-server.js`) that coordinates wizard steps and streams interaction events directly to the agent.
*   **📸 Automatic Preview Capture**: Headless Puppeteer browser captures preview screenshots to ensure zero-latency visual validation.
*   **🧬 Modular Design DNA**: Integrates with premium style frameworks to support easy customization and modular layout activation.

---

## 📂 Project Architecture

```
create-skill/
├── 📁 scripts/
│   ├── 📄 start-server.js     # Express-based visual companion web server
│   ├── 📄 await-event.py      # Background event watcher and sync script
│   └── 📄 capture-screen.js   # Puppeteer screenshot automated capturing
├── 📁 templates/
│   ├── 📄 01_start.html       # Visual Wizard initial launch UI template
│   └── 📄 retro-components.css# Styled visual tokens for the wizard
├── 📄 SKILL.md                # System prompts & Agent behavior instructions
├── 📄 package.json            # Node project configuration
└── 📄 README.md               # Visual branding and usage documentation
```

### Technical Stack Details

| Component | Technology | Role / Purpose |
| :--- | :--- | :--- |
| **Server** | Node.js + Express | Host the interaction pages and receive event payloads |
| **Automation** | Puppeteer | Launch headless Chromium to capture high-fidelity screenshot assets |
| **Sync Engine** | Python 3 | Background listener to block/unblock the agent based on user inputs |
| **Styling** | Vanilla CSS | Premium visual layout using custom design tokens |

---

## 🛠 Setup & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.x or higher)

### 2. Install Dependencies
Clone the repository and install the required Node packages:
```bash
git clone git@github.com:freyathenaa/create-skill.git
cd create-skill
npm install
```

---

## 💻 Running the Wizard

To spin up the visual companion server:

```bash
node scripts/start-server.js
```

The server will initialize on port `3000` (or the configured environment port) and wait for the agent-assisted configuration events.

---

## ⚡ Integration with Antigravity

This skill is designed to run seamlessly with the **Antigravity AI Agent SDK**. When a user issues the `/create` slash command:
1. The agent starts the server.
2. The agent opens the browser/companion UI.
3. The user picks their custom styling configuration.
4. The agent reads the choices, builds the landing page using premium styling rules, and generates screenshots.
