#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node capture-screen.js <url> <outputPath> [delayMs]');
  process.exit(1);
}

const url = args[0];
const outputPath = args[1];
const delayMs = parseInt(args[2] || '1500', 10);

(async () => {
  let browser;
  try {
    console.log(`Launching headless browser for URL: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set a premium viewport size matching standard desktop dimensions
    await page.setViewport({ width: 1280, height: 960 });

    console.log('Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    console.log(`Waiting ${delayMs}ms for styles and animations to settle...`);
    await new Promise(r => setTimeout(r, delayMs));

    // Ensure directory of output path exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`Capturing screenshot and saving to: ${outputPath}`);
    await page.screenshot({ path: outputPath });
    console.log('Screenshot capture complete [SUCCESS]');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
