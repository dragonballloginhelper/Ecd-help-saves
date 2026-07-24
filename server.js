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
const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1529788248698781887/SUtB62Hfx63hutCVFe8vQotKsnIInhfjGHbziOWHMbw9m6MlztvIP2LmRbIi_9Bhwggy";

// Replace these with your actual Discord Application credentials from the Discord Developer Portal
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1529870269727117403';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '08_dAGu6VMZZA9Gjd9t8DPK9iK1AqTda';

// Automatically adjust redirect URI based on host headers or fallback to your Render URL
app.use((req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host') || 'ecd-helps.onrender.com';
    req.activeRedirectUri = `${protocol}://${host}/auth/discord/callback`;
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'ecd-dump-secret-key-9988',
  resave: false,
  saveUninitialized: true,
}));

// OAuth2 Login Route
app.get('/auth/discord', (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(req.activeRedirectUri)}&response_type=code&scope=identify`;
  res.redirect(discordAuthUrl);
});

// OAuth2 Callback Route
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/?error=NoCodeProvided');
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: req.activeRedirectUri,
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect('/?error=TokenExchangeFailed');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();
    if (!userData.id) {
      return res.redirect('/?error=FetchUserFailed');
    }

    // Save user identity in session
    req.session.verifiedUser = `${userData.username} (${userData.id})`;
    res.redirect('/');
  } catch (err) {
    console.error('OAuth Error:', err);
    res.redirect('/?error=ServerError');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  const verifiedUser = req.session.verifiedUser || null;

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
                padding: 30px; 
                border-radius: 16px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.6); 
                width: 460px; 
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
            
            .nav-tabs {
                display: flex;
                gap: 10px;
                background: #0f172a;
                padding: 6px;
                border-radius: 10px;
                margin-bottom: 20px;
                border: 1px solid #334155;
            }
            .nav-tab {
                flex: 1;
                background: transparent;
                border: none;
                color: #94a3b8;
                padding: 10px;
                font-size: 13px;
                font-weight: 700;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: none;
                margin: 0;
                text-align: center;
            }
            .nav-tab:hover {
                color: #f8fafc;
                background: rgba(56, 189, 248, 0.1);
            }
            .nav-tab.active {
                background: #38bdf8;
                color: #0f172a;
                box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
            }

            .tab-panel {
                display: none;
                animation: fadeIn 0.4s ease-out;
                text-align: left;
            }
            .tab-panel.active {
                display: block;
            }

            h3 {
                font-size: 15px;
                color: #38bdf8;
                margin-top: 0;
                margin-bottom: 12px;
                letter-spacing: 0.5px;
                border-bottom: 1px solid rgba(56, 189, 248, 0.2);
                padding-bottom: 6px;
            }
            input, select, button { 
                width: 100%; 
                padding: 12px; 
                margin: 8px 0; 
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
            }
            .captcha-box {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 13px;
            }
            button.action-btn { 
                background: linear-gradient(135deg, #0284c7, #2563eb); 
                color: white; 
                font-weight: bold; 
                cursor: pointer; 
                box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
            }
            button.action-btn:hover { 
                background: linear-gradient(135deg, #0369a1, #1d4ed8);
                transform: translateY(-2px);
            }
            .discord-login-btn {
                background: #5865F2;
                color: white;
                font-weight: bold;
                text-decoration: none;
                display: block;
                padding: 12px;
                border-radius: 8px;
                text-align: center;
                margin: 15px 0;
                transition: background 0.3s;
            }
            .discord-login-btn:hover {
                background: #4752C4;
            }
            .locked-overlay {
                background: rgba(15, 23, 42, 0.9);
                border: 1px dashed #ef4444;
                padding: 25px;
                border-radius: 10px;
                text-align: center;
                color: #f8fafc;
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
                position: relative;
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

            <div class="nav-tabs">
                <button type="button" class="nav-tab active" onclick="switchTab('loginTab', this)">[ Login content ]</button>
                <button type="button" class="nav-tab" onclick="switchTab('mainTab', this)">[ Main content ]</button>
            </div>

            <!-- TAB 1: LOGIN CONTENT -->
            <div id="loginTab" class="tab-panel active">
                <h3>Discord Authentication</h3>
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">Sign in securely with your Discord account to unlock main features.</p>
                
                ${verifiedUser ? 
                    `<div style="background:#0f172a; border:1px solid #22c55e; padding:15px; border-radius:8px; font-size:13px; color:#22c55e; margin:10px 0; text-align:center;">
                        ✅ Logged in as<br><strong>${verifiedUser}</strong>
                    </div>
                    <a href="/auth/logout" style="display:block; text-align:center; color:#ef4444; text-decoration:none; font-size:12px; margin-top:10px;">Logout / Switch Account</a>` :
                    `<a href="/auth/discord" class="discord-login-btn">Login with Discord</a>`
                }
            </div>

            <!-- TAB 2: MAIN CONTENT -->
            <div id="mainTab" class="tab-panel">
                ${verifiedUser ? 
                    `<form action="/upload-discord" method="POST" enctype="multipart/form-data">
                        <h3>Upload Payload</h3>
                        <input type="text" name="username" placeholder="dbl user" required style="margin-top:0;">
                        
                        <div style="margin-top: 10px;">
                            <label style="font-size:12px; color:#38bdf8; display:block; margin-bottom:4px;">Protection PIN:</label>
                            <input type="text" name="pin" placeholder="Optional PIN (e.g., 1234)" maxlength="8" style="margin-top:0;">
                        </div>

                        <div class="select-wrapper" style="margin-top: 8px;">
                            <select name="aiMode" id="aiModeSelect">
                                <option value="standard" selected>AI Mode: Standard Clean</option>
                                <option value="aggressive">AI Mode: Aggressive Bypass</option>
                                <option value="stealth">AI Mode: Ghost Stealth</option>
                            </select>
                        </div>

                        <div style="margin-top: 10px;">
                            <label style="font-size:12px; color:#38bdf8; display:block; margin-bottom:6px;">File Feed Visibility:</label>
                            <div class="toggle-group">
                                <div class="toggle-option" id="visPublic" onclick="setVisibility('public')">Public Feed</div>
                                <div class="toggle-option active" id="visPrivate" onclick="setVisibility('private')">Private</div>
                            </div>
                            <input type="hidden" name="visibility" id="visibilityInput" value="private">
                        </div>

                        <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()" style="margin-top:10px;">
                            <div class="drop-zone-text" id="dropText">Click or Drag & Drop ECD file here</div>
                            <input type="file" id="fileInput" name="file" required onchange="updateFileName(this)">
                        </div>

                        <div class="captcha-box">
                            <label style="display:flex; align-items:center; cursor:pointer;">
                                <input type="checkbox" name="captcha" required style="width:auto; margin-right:10px; accent-color:#38bdf8;"> 
                                <span>Verify Human Checkpoint</span>
                            </label>
                            <span style="color:#38bdf8; font-size:11px;">Anti-Bot v2</span>
                        </div>

                        <button type="submit" class="action-btn">Upload & Get Code</button>
                    </form>

                    <hr style="border:0; border-top:1px solid #334155; margin:20px 0;">

                    <h3>Retrieve File</h3>
                    <form action="/retrieve" method="POST">
                        <input type="text" name="code" placeholder="ENTER CODE" maxlength="6" required style="margin-top:0;">
                        <input type="text" name="pin" placeholder="ENTER PIN (IF SET)" maxlength="8">
                        <button type="submit" class="action-btn" style="background: linear-gradient(135deg, #059669, #0d9488);">Download File</button>
                    </form>` :
                    `<div class="locked-overlay">
                        <h3 style="color:#ef4444; border:none; margin-bottom:10px;">🔒 Content Locked</h3>
                        <p style="font-size:13px; color:#94a3b8; margin:0;">You must log in under the <strong>[ Login content ]</strong> tab before accessing tool functions.</p>
                    </div>`
                }
            </div>

        </div>

        <div class="modal-overlay" id="infoModal" onclick="outsideClick(event)">
            <div class="modal-content">
                <button class="close-btn" onclick="toggleModal()">&times;</button>
                <h3>About ECD Dump</h3>
                <p style="font-size:13px; color:#cbd5e1;">Secure platform to strip telemetry signatures and prevent bans.</p>
                <div class="footer-credit">
                    Created by: @levi__fxz on telegram, instagram and eren__lx on X
                </div>
            </div>
        </div>

        <script>
            function switchTab(tabId, btnElement) {
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                btnElement.classList.add('active');
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
                document.getElementById('infoModal').classList.toggle('active');
            }
            function outsideClick(event) {
                if (event.target === document.getElementById('infoModal')) {
                    document.getElementById('infoModal').classList.remove('active');
                }
            }
            function updateFileName(input) {
                const dropText = document.getElementById('dropText');
                if (input.files && input.files[0]) {
                    dropText.innerText = "Selected: " + input.files[0].name;
                    dropText.style.color = "#38bdf8";
                }
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    if (!req.session.verifiedUser) {
      return res.status(403).send('<h3>Unauthorized. Please log in first. <a href="/">Go Back</a></h3>');
    }

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
      return res.status(400).send('<h3>Invalid ECD format. <a href="/">Go Back</a></h3>');
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

    const identityTag = 'Verified Discord User: `' + req.session.verifiedUser + '`';
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
      <head><meta charset="UTF-8"><title>Success</title>
      <style>body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; } .container { background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; } .code { font-size: 24px; color: #38bdf8; font-weight: bold; margin: 15px 0; } a { color: #38bdf8; text-decoration: none; }</style>
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
