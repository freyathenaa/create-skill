#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

// Parse CLI Arguments
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const nextArg = process.argv[i + 1];
    if (nextArg && !nextArg.startsWith('--')) {
      args[arg.slice(2)] = nextArg;
      i++;
    } else {
      args[arg.slice(2)] = true;
    }
  }
}

const projectDir = args['project-dir'] || '/Users/heavn/.gemini/antigravity/scratch';
const startPort = parseInt(args['port'] || '8888', 10);
const openBrowser = args['open'] || false;

// Generate Session info
const sessionId = `session_${Date.now()}`;
const sessionKey = crypto.randomBytes(16).toString('hex');
const baseDir = path.join(projectDir, '.superpowers', 'brainstorm', sessionId);
const screenDir = path.join(baseDir, 'content');
const stateDir = path.join(baseDir, 'state');

// Ensure directories exist
fs.mkdirSync(screenDir, { recursive: true });
fs.mkdirSync(stateDir, { recursive: true });

// Copy retro-components.css template to session screenDir
const cssSrcPath = path.join(__dirname, '..', 'templates', 'retro-components.css');
try {
  if (fs.existsSync(cssSrcPath)) {
    fs.copyFileSync(cssSrcPath, path.join(screenDir, 'retro-components.css'));
  }
} catch (e) {
  console.error('Failed to copy retro-components.css to session:', e);
}

// We keep track of active SSE response objects to broadcast changes
const clients = [];

// Helper to watch directory
let lastSentFile = null;
function scanAndNotify() {
  try {
    const files = fs.readdirSync(screenDir)
      .filter(f => f.endsWith('.html'))
      .map(f => ({ name: f, stat: fs.statSync(path.join(screenDir, f)) }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

    if (files.length > 0) {
      const newest = files[0].name;
      if (newest !== lastSentFile) {
        lastSentFile = newest;
        broadcast({ type: 'new-screen', file: newest });
      }
    }
  } catch (err) {
    console.error('Error scanning screen directory:', err);
  }
}

// Watch directory for updates
fs.watch(screenDir, (eventType, filename) => {
  if (filename && filename.endsWith('.html')) {
    // Debounce/throttle scan slightly to ensure file write finishes
    setTimeout(scanAndNotify, 100);
  }
});

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

// Find free port and start server
function startListening(port) {
  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${port}`);
    const keyQuery = reqUrl.searchParams.get('key');
    
    // Cookie check or search query check
    let authorized = false;
    if (keyQuery === sessionKey) {
      authorized = true;
      res.setHeader('Set-Cookie', `sessionKey=${sessionKey}; Path=/; HttpOnly; SameSite=Lax`);
    } else {
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
        if (cookies['sessionKey'] === sessionKey) {
          authorized = true;
        }
      }
    }

    // Serve favicon
    if (req.url === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Authentication check
    if (!authorized) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Invalid or missing session key');
      return;
    }

    // Endpoint: SSE Stream
    if (reqUrl.pathname === '/api/updates') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('\n');
      clients.push(res);
      
      // Send initial check
      try {
        const files = fs.readdirSync(screenDir)
          .filter(f => f.endsWith('.html'))
          .map(f => ({ name: f, stat: fs.statSync(path.join(screenDir, f)) }))
          .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
        if (files.length > 0) {
          res.write(`data: ${JSON.stringify({ type: 'new-screen', file: files[0].name })}\n\n`);
        }
      } catch (e) {}

      req.on('close', () => {
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      });
      return;
    }

    // Endpoint: Submit user choices/events
    if (reqUrl.pathname === '/api/event' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const eventData = JSON.parse(body);
          eventData.timestamp = new Date().toISOString();
          fs.appendFileSync(path.join(stateDir, 'events'), JSON.stringify(eventData) + '\n');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid JSON event body');
        }
      });
      return;
    }

    // Endpoint: Customize asset file content and re-zip
    if (reqUrl.pathname === '/api/customize' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (Array.isArray(data.files)) {
            data.files.forEach(f => {
              const filePath = path.join(screenDir, f.name);
              if (filePath.startsWith(screenDir)) {
                fs.writeFileSync(filePath, f.content);
              }
            });
            // Re-run zip compression cross-platform
            const zipCmd = `python3 -c "import zipfile, os; zf = zipfile.ZipFile('${path.join(screenDir, 'project_assets.zip')}', 'w'); [zf.write(os.path.join('${screenDir}', f), f) for f in os.listdir('${screenDir}') if f not in ('01_start.html', '06_showcase.html', 'project_assets.zip')]; zf.close()"`;
            const { exec } = require('child_process');
            exec(zipCmd, (err) => {
              if (err) console.error('Failed to re-zip assets:', err);
            });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Endpoint: Download file assets
    if (reqUrl.pathname === '/api/download') {
      const fileName = reqUrl.searchParams.get('file');
      if (!fileName) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing file parameter');
        return;
      }
      const filePath = path.join(screenDir, fileName);
      if (!filePath.startsWith(screenDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File Not Found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
        });
        res.end(data);
      });
      return;
    }

    // Endpoint: Serve HTML screens from screenDir
    if (reqUrl.pathname.startsWith('/screens/')) {
      const fileName = reqUrl.pathname.slice('/screens/'.length);
      const filePath = path.join(screenDir, fileName);

      // Secure path traversal check
      if (!filePath.startsWith(screenDir)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
      }

      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('File Not Found');
          return;
        }

        // Determine if it is a full page or a fragment
        const isFullPage = content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html');
        
        if (isFullPage) {
          // Inject the SSE reloading script
          const sseInjector = `
            <script>
              const evtSource = new EventSource("/api/updates");
              evtSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.type === "new-screen") {
                  const currentFile = window.location.pathname.split('/').pop();
                  if (currentFile !== data.file) {
                    window.location.href = "/screens/" + data.file;
                  }
                }
              };
            </script>
          `;
          const bodyIndex = content.toLowerCase().indexOf('</body>');
          let outputContent;
          if (bodyIndex !== -1) {
            outputContent = content.slice(0, bodyIndex) + sseInjector + content.slice(bodyIndex);
          } else {
            outputContent = content + sseInjector;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(outputContent);
        } else {
          // Serve wrapped in the visual frame template
          const framed = getFramedPage(content);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(framed);
        }
      });
      return;
    }

    // Default: Root Endpoint "/" serves the current/latest screen
    if (reqUrl.pathname === '/') {
      try {
        const files = fs.readdirSync(screenDir)
          .filter(f => f.endsWith('.html'))
          .map(f => ({ name: f, stat: fs.statSync(path.join(screenDir, f)) }))
          .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

        if (files.length > 0) {
          res.writeHead(302, { 'Location': `/screens/${files[0].name}` });
          res.end();
        } else {
          // No screens yet, serve a premium loading/welcome template
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(getFramedPage(`
            <div class="welcome-container">
              <div class="loader"></div>
              <h1>Awaiting Visual Content...</h1>
              <p>The creator is preparing the initial wizard screen. Please hold tight.</p>
            </div>
            <style>
              .welcome-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 60vh;
                text-align: center;
              }
              .loader {
                width: 48px;
                height: 48px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                border-top-color: #00e5ff;
                animation: spin 1s ease-in-out infinite;
                margin-bottom: 24px;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          `));
        }
      } catch (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    // Default 404
    res.writeHead(404);
    res.end('Not Found');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startListening(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}/?key=${sessionKey}`;
    const startupInfo = {
      type: 'server-started',
      port: port,
      url: url,
      screen_dir: screenDir,
      state_dir: stateDir
    };

    // Save startup info
    fs.writeFileSync(path.join(stateDir, 'server-info'), JSON.stringify(startupInfo, null, 2));

    // Print to stdout
    console.log(JSON.stringify(startupInfo));

    // Automatically open browser
    if (openBrowser) {
      console.log('Opening browser to:', url);
      let cmd;
      if (process.platform === 'darwin') cmd = `open "${url}"`;
      else if (process.platform === 'win32') cmd = `start "${url}"`;
      else cmd = `xdg-open "${url}"`;
      
      exec(cmd, (err) => {
        if (err) console.error('Failed to open browser automatically:', err.message);
      });
    }
  });
}

// Default Framed Page template with high aesthetics
function getFramedPage(innerContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0b0c10;
      --panel-dark: rgba(26, 26, 36, 0.45);
      --border-color: rgba(255, 255, 255, 0.08);
      --accent-color: #00e5ff;
      --accent-glow: rgba(0, 229, 255, 0.25);
      --text-main: #f5f6f7;
      --text-muted: #8a8f98;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(0, 229, 255, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(255, 0, 128, 0.03) 0px, transparent 50%),
        linear-gradient(rgba(255, 255, 255, 0.007) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    header {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      background: rgba(11, 12, 16, 0.6);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #00e5ff, #ff007f);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .logo-icon::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      background: var(--bg-dark);
      border-radius: 6px;
    }

    .logo-icon::before {
      content: '⚡';
      position: absolute;
      z-index: 2;
      font-size: 14px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 20px;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #ffffff, #8a8f98);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.03);
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #4caf50;
      box-shadow: 0 0 8px #4caf50;
    }

    main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .framed-content {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Shared style utilities for inner screens */
    .option-card {
      background: var(--panel-dark);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    
    .option-card:hover {
      border-color: var(--accent-color);
      box-shadow: 0 0 20px var(--accent-glow);
      transform: translateY(-2px);
    }

    .option-card.selected {
      border-color: var(--accent-color);
      background: rgba(0, 229, 255, 0.05);
      box-shadow: 0 0 24px var(--accent-glow);
    }

    .btn-primary {
      background: linear-gradient(135deg, #00e5ff, #00b0ff);
      color: #0b0c10;
      border: none;
      padding: 14px 28px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 14px 28px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header>
    <div class="logo-container">
      <div class="logo-icon"></div>
      <div class="logo-text">Create</div>
    </div>
    <div class="connection-status">
      <span class="status-indicator"></span>
      Visual Companion Connected
    </div>
  </header>
  
  <main>
    <div class="framed-content">
      ${innerContent}
    </div>
  </main>

  <script>
    // SSE Live Reload / Sync System
    const evtSource = new EventSource("/api/updates");
    evtSource.onmessage = function(event) {
      const data = JSON.parse(event.data);
      if (data.type === "new-screen") {
        const currentFile = window.location.pathname.split('/').pop();
        if (currentFile !== data.file) {
          window.location.href = "/screens/" + data.file;
        }
      }
    };

    // Global helper to send actions back to the CLI agent
    window.submitEvent = async function(eventData) {
      try {
        const response = await fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        const result = await response.json();
        console.log('Event submitted:', result);
      } catch (err) {
        console.error('Failed to submit event:', err);
      }
    };
  </script>
</body>
</html>
  `;
}

// Start discovery and listen
startListening(startPort);
