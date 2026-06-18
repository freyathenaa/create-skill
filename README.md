# Antigravity Create Skill

An autonomous AI agent skill for launching interactive visual creation wizards and synthesizing premium digital products and landing pages.

## Features

- **Interactive Visual Wizard**: Guides users through selecting a digital product category, aesthetic/style, and trend.
- **Visual Companion Server**: Built-in server (`scripts/start-server.js`) that hosts the UI wizard.
- **Screen Capture**: Automates screen capture and rendering validation of generated pages.
- **Template Engine**: Extensible templates for UI synthesis.

## File Structure

- `SKILL.md`: Main instructions and system prompts for the Antigravity AI agent.
- `package.json`: Dependencies (e.g., puppeteer for screenshots).
- `scripts/`:
  - `start-server.js`: Web server hosting the visual companion wizard.
  - `await-event.py`: Python script to handle background event watching and synchronization.
  - `capture-screen.js`: Puppeteer script to capture high-quality screenshots of the generated product.
- `templates/`:
  - `01_start.html`: Initial entry point template for the wizard.
  - `retro-components.css`: Styling assets for the wizard interface.

## Prerequisites

- Node.js (version 18 or above recommended)
- Python 3

## Installation

```bash
npm install
```

## Running the Visual Companion Server

To start the wizard server locally:

```bash
node scripts/start-server.js
```
