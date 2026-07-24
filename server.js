const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const session = require('express-session');
const FormData = require('form-data');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuration (Using your hardcoded Discord keys or environment variables)
const CLIENT_ID = process.env.CLIENT_ID || '1529870269727117403';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '08_dAGu6VMZZA9Gjd9t8DPK9iK1AqTda';

// Automatically adjust redirect URI based on host headers or fallback to Render URL format
app.use((req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    req.activeRedirectUri = `${protocol}://${host}/auth/discord/callback`;
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'ecd_dump_secure_random_key_extended_ultimate_v9',
    resave: false,
    saveUninitialized: false
}));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Comprehensive Global Layout Template with the [ GAMES ] Tab and full styling suite
const renderLayout = (title, content, user) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ECD Dump Platform</title>
    <style>
        :root { 
            background-color: #0f172a; 
            color: #f8fafc; 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
        }
        body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            flex-direction: column; 
            min-height: 100vh; 
        }
        nav { 
            background: #1e293b; 
            padding: 1rem 2rem; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 1px solid #334155; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .logo { 
            font-weight: 700; 
            font-size: 1.25rem; 
            color: #38bdf8; 
            text-decoration: none; 
            letter-spacing: 0.05em;
        }
        .nav-links { 
            display: flex; 
            gap: 1.25rem; 
            align-items: center; 
        }
        .nav-links a { 
            color: #cbd5e1; 
            text-decoration: none; 
            font-weight: 500; 
            padding: 0.5rem 1rem; 
            border-radius: 0.375rem; 
            transition: all 0.2s ease; 
        }
        .nav-links a:hover, .nav-links a.active { 
            background: #334155; 
            color: #ffffff; 
        }
        main { 
            flex: 1; 
            padding: 2.5rem 1.5rem; 
            max-width: 900px; 
            margin: 0 auto; 
            width: 100%; 
            box-sizing: border-box; 
        }
        .card { 
            background: #1e293b; 
            border: 1px solid #334155; 
            border-radius: 0.75rem; 
            padding: 1.75rem; 
            margin-bottom: 1.75rem; 
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2); 
        }
        .card h2, .card h3 { 
            margin-top: 0; 
            color: #f1f5f9; 
        }
        button, .btn { 
            background: #0284c7; 
            color: white; 
            border: none; 
            padding: 0.75rem 1.5rem; 
            border-radius: 0.5rem; 
            font-weight: 600; 
            cursor: pointer; 
            text-decoration: none; 
            display: inline-block; 
            transition: background 0.2s; 
        }
        button:hover, .btn:hover { 
            background: #0ea5e9; 
        }
        .btn-discord { 
            background: #5865F2; 
            display: inline-flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        .btn-discord:hover { 
            background: #4752C4; 
        }
        input[type="file"] { 
            background: #0f172a; 
            border: 1px dashed #475569; 
            color: #cbd5e1; 
            padding: 1.25rem; 
            border-radius: 0.5rem; 
            width: 100%; 
            box-sizing: border-box; 
            margin-bottom: 1rem; 
            cursor: pointer;
        }
        .file-list { 
            list-style: none; 
            padding: 0; 
            margin: 0; 
        }
        .file-list li { 
            background: #0f172a; 
            padding: 0.75rem 1rem; 
            border-radius: 0.375rem; 
            margin-bottom: 0.5rem; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border: 1px solid #334155;
        }
        .file-list a { 
            color: #38bdf8; 
            text-decoration: none; 
            font-weight: 500; 
        }
        .file-list a:hover { 
            text-decoration: underline; 
        }
        .user-badge {
            background: #0f172a;
            border: 1px solid #334155;
            padding: 0.4rem 0.8rem;
            border-radius: 0.375rem;
            color: #38bdf8;
            font-weight: 500;
            font-size: 0.95rem;
        }
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo">⚡ ECD DUMP PLATFORM</a>
        <div class="nav-links">
            <a href="/" class="${title === 'Home' ? 'active' : ''}">Home & Dumps</a>
            <a href="/games" class="${title === 'Games Hub' ? 'active' : ''}">[ GAMES ]</a>
            ${user ? `
                <span class="user-badge">👤 ${user.username}</span> 
                <a href="/logout" style="background: #ef4444; padding: 0.4rem 0.8rem; font-size: 0.9rem;">Logout</a>
            ` : `
                <a href="/auth/discord" class="btn-discord">Login with Discord</a>
            `}
        </div>
    </nav>
    <main>
        ${content}
    </main>
</body>
</html>
`;

// Discord OAuth2 Authentication Initiation Route
app.get('/auth/discord', (req, res) => {
    const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(req.activeRedirectUri)}&response_type=code&scope=identify`;
    res.redirect(discordLoginUrl);
});

// Discord OAuth2 Callback Handler Route
app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Error: No authorization code was provided by Discord.');
    }

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: req.activeRedirectUri,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            return res.status(400).send('Error: Failed to obtain access token from Discord OAuth API.');
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();

        req.session.user = { 
            id: userData.id, 
            username: userData.username 
        };
        
        res.redirect('/');
    } catch (err) {
        console.error('Discord Auth Exception:', err);
        res.status(500).send('Internal Server Error occurred during Discord authentication processing.');
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Home Route: File management, upload system & access control
app.get('/', (req, res) => {
    let files = [];
    try {
        files = fs.readdirSync('uploads');
    } catch (e) {
        files = [];
    }

    const fileListHtml = files.length > 0 
        ? files.map(file => `
            <li>
                <span>📄 ${file}</span>
                <a href="/download/${file}">Download Payload</a>
            </li>`).join('')
        : '<p style="color: #94a3b8; text-align: center; margin: 1rem 0;">No active payloads or dumps uploaded yet.</p>';

    const content = `
        <div class="card">
            <h2>🚀 Upload Payload Dump</h2>
            <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.25rem;">Select any file or script payload to host it securely on your server instance.</p>
            ${req.session.user ? `
                <form action="/upload" method="POST" enctype="multipart/form-data">
                    <input type="file" name="payload" required />
                    <button type="submit">Upload Payload Instantly</button>
                </form>
            ` : `
                <div style="background: #0f172a; padding: 1.25rem; border-radius: 0.5rem; border: 1px solid #334155; text-align: center;">
                    <p style="color: #94a3b8; margin-top: 0; margin-bottom: 1rem;">Authentication required to upload or modify file payloads.</p>
                    <a href="/auth/discord" class="btn btn-discord">Login with Discord to Upload</a>
                </div>
            `}
        </div>
        
        <div class="card">
            <h2>📂 Available Dumps (${files.length})</h2>
            <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.25rem;">Browse and download active public or private payload archives hosted on this node.</p>
            <ul class="file-list">
                ${fileListHtml}
            </ul>
        </div>
    `;
    res.send(renderLayout('Home', content, req.session.user));
});

// Handle Upload POST with Authentication Guard
app.post('/upload', upload.single('payload'), (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized: You must be logged in via Discord to execute uploads.');
    }
    res.redirect('/');
});

// Secure Download Route
app.get('/download/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'uploads', safeName);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('Error: Requested dump file could not be located on the server storage.');
    }
});

// [ GAMES ] Hub Route (Pack Opening + Connect Boxes Mechanics)
app.get('/games', (req, res) => {
    const content = `
        <div style="margin-bottom: 2rem;">
            <h1>🎮 Arcade & Interactive Mini-Games</h1>
            <p style="color: #94a3b8;">Take a break from handling dumps. Open randomized reward packages or jump into custom layout sequence linking challenges!</p>
        </div>
        
        <!-- Pack Opening Section -->
        <div class="card">
            <h3>🎁 Mystery Pack Opening System</h3>
            <p style="color: #94a3b8; font-size: 0.95rem;">Test your drop rates and pull rare modular components.</p>
            <button onclick="openPack()" style="margin-top: 0.5rem; margin-bottom: 1rem;">Open Mystery Pack</button>
            <div id="packResult" style="padding: 1rem; background: #0f172a; border-radius: 0.5rem; border: 1px solid #334155; font-size: 1.1rem; font-weight: bold; color: #38bdf8; min-height: 24px; text-align: center;">
                Ready to open your first pack...
            </div>
        </div>

        <!-- Connect Boxes Mechanics Game -->
        <div class="card">
            <h3>📦 Connect Boxes Sequence Game</h3>
            <p style="color: #94a3b8; font-size: 0.95rem;">Follow the highlighted terminal nodes in order and keep your connection active!</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; background: #0f172a; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #334155;">
                <span id="gameScore" style="font-weight: bold; font-size: 1.05rem;">Score: 0</span>
                <span id="gameStatus" style="color: #38bdf8; font-size: 0.9rem;">Status: Idle</span>
            </div>

            <div id="boxContainer" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 320px; margin: 0 auto 1.5rem auto;">
                <div class="play-box" onclick="hitBox(1)" style="background:#0f172a; height:90px; display:flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; font-size: 1.5rem; font-weight: bold; border: 2px solid #334155; transition: all 0.2s;">1</div>
                <div class="play-box" onclick="hitBox(2)" style="background:#0f172a; height:90px; display:flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; font-size: 1.5rem; font-weight: bold; border: 2px solid #334155; transition: all 0.2s;">2</div>
                <div class="play-box" onclick="hitBox(3)" style="background:#0f172a; height:90px; display:flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; font-size: 1.5rem; font-weight: bold; border: 2px solid #334155; transition: all 0.2s;">3</div>
            </div>
            
            <div style="text-align: center;">
                <button onclick="startGame()">Start Sequence Game</button>
            </div>
        </div>

        <script>
            // Pack Opening Logic
            function openPack() {
                const rewards = [
                    { name: 'Common Shard 📦', color: '#cbd5e1' },
                    { name: 'Uncommon Component ⚙️', color: '#38bdf8' },
                    { name: 'Rare Circuit ⚡', color: '#818cf8' },
                    { name: 'EPIC CORE 🔥', color: '#c084fc' },
                    { name: 'LEGENDARY SYNAPSE 🌟', color: '#f43f5e' }
                ];
                const rand = Math.random();
                let selected;
                if (rand > 0.95) selected = rewards[4];
                else if (rand > 0.80) selected = rewards[3];
                else if (rand > 0.55) selected = rewards[2];
                else if (rand > 0.30) selected = rewards[1];
                else selected = rewards[0];

                const resultEl = document.getElementById('packResult');
                resultEl.style.color = selected.color;
                resultEl.innerText = '🎁 Pulled Reward: ' + selected.name;
            }

            // Connect Boxes Mechanics Logic
            let score = 0;
            let activeTarget = 1;
            let gameActive = false;

            function startGame() {
                score = 0;
                gameActive = true;
                activeTarget = Math.floor(Math.random() * 3) + 1;
                document.getElementById('gameStatus').innerText = 'Status: Active Connection';
                updateUI();
            }

            function hitBox(boxNum) {
                if (!gameActive) return;
                
                if (boxNum === activeTarget) {
                    score += 15;
                    activeTarget = Math.floor(Math.random() * 3) + 1;
                    updateUI();
                } else {
                    gameActive = false;
                    document.getElementById('gameStatus').innerText = 'Status: Sequence Broken (Game Over)';
                    document.querySelectorAll('.play-box').forEach(el => {
                        el.style.borderColor = '#ef4444';
                        el.style.background = '#7f1d1d';
                    });
                    setTimeout(() => resetBoxesVisual(), 1500);
                }
            }

            function updateUI() {
                document.getElementById('gameScore').innerText = 'Score: ' + score;
                document.querySelectorAll('.play-box').forEach((el, idx) => {
                    if ((idx + 1) === activeTarget) {
                        el.style.borderColor = '#38bdf8';
                        el.style.background = '#0284c7';
                        el.style.color = '#ffffff';
                    } else {
                        el.style.borderColor = '#334155';
                        el.style.background = '#0f172a';
                        el.style.color = '#94a3b8';
                    }
                });
            }

            function resetBoxesVisual() {
                document.querySelectorAll('.play-box').forEach(el => {
                    el.style.borderColor = '#334155';
                    el.style.background = '#0f172a';
                    el.style.color = '#f8fafc';
                });
                document.getElementById('gameStatus').innerText = 'Status: Idle';
            }
        </script>
    `;
    res.send(renderLayout('Games Hub', content, req.session.user));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('ECD Dump Server initialized successfully with full configuration layout on port ' + PORT);
});
