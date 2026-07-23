const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1529772290022047744/FxpfSNSzRE9bLyW0vZU_rpQvv7yHM4wCmCLmjwyM9Wa8lu5cnxyqo5udlw_GIE0UUw6a';

// In-memory code store for file lookups
const fileStore = new Map();

// Serve the embedded frontend (ECD Upload & Download)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECD Upload</title>
    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --accent: #38bdf8;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: #334155;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }
        .container {
            width: 100%;
            max-width: 400px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        h1 { font-size: 1.5rem; text-align: center; margin-bottom: 0.5rem; color: var(--accent); }
        p.subtitle { text-align: center; color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .section { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        h2 { font-size: 1rem; margin-bottom: 0.75rem; color: var(--text-main); }
        .upload-box {
            border: 2px dashed var(--border);
            border-radius: 12px;
            padding: 1.5rem 1rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 0.75rem;
            display: block;
        }
        .upload-box:hover { border-color: var(--accent); background: rgba(56, 189, 248, 0.05); }
        input[type="file"] { display: none; }
        input[type="text"] {
            width: 100%;
            padding: 0.75rem;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-main);
            font-size: 1rem;
            margin-bottom: 0.75rem;
            text-align: center;
            text-transform: uppercase;
        }
        input[type="text"]:focus { outline: none; border-color: var(--accent); }
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: var(--accent);
            color: #0f172a;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.9; }
        .status { margin-top: 0.75rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); }
        .code-display {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border);
            border-radius: 6px;
            text-align: center;
            word-break: break-all;
            font-family: monospace;
            color: var(--accent);
            font-size: 1.1rem;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ECD Upload</h1>
        <p class="subtitle">Anonymous Mobile File Vault</p>
        
        <!-- Upload Section -->
        <div class="section">
            <h2>Upload File</h2>
            <label class="upload-box" id="dropZone">
                <span id="fileName" style="font-size: 0.9rem; color: var(--text-muted);">Tap to select a file</span>
                <input type="file" id="fileInput">
            </label>
            <button class="btn" id="uploadBtn">Dump Save</button>
            <div id="uploadStatus" class="status"></div>
        </div>

        <!-- Download Section -->
        <div class="section">
            <h2>Retrieve File</h2>
            <input type="text" id="codeInput" placeholder="Enter Code (e.g. A3F9B2)" maxlength="6">
            <button class="btn" id="downloadBtn" style="background: #10b981; color: #fff;">Download File</button>
            <div id="downloadStatus" class="status"></div>
        </div>
    </div>

    <script>
        const fileInput = document.getElementById('fileInput');
        const fileNameSpan = document.getElementById('fileName');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadStatus = document.getElementById('uploadStatus');

        const codeInput = document.getElementById('codeInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadStatus = document.getElementById('downloadStatus');

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileNameSpan.textContent = fileInput.files[0].name;
            }
        });

        uploadBtn.addEventListener('click', async () => {
            if (fileInput.files.length === 0) {
                uploadStatus.textContent = 'Please select a file first.';
                return;
            }

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            uploadStatus.textContent = 'Uploading & Dumping...';
            uploadBtn.disabled = true;

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (response.ok) {
                    uploadStatus.innerHTML = \`Success! Retrieval Code:<div class="code-display">\${data.code}</div>\`;
                } else {
                    uploadStatus.textContent = data.error || 'Upload failed.';
                }
            } catch (err) {
                uploadStatus.textContent = 'Network error occurred.';
            } finally {
                uploadBtn.disabled = false;
            }
        });

        downloadBtn.addEventListener('click', () => {
            const code = codeInput.value.trim().toUpperCase();
            if (!code) {
                downloadStatus.textContent = 'Please enter a retrieval code.';
                return;
            }
            // Trigger direct file download route
            window.location.href = '/download/' + code;
        });
    </script>
</body>
</html>
    `);
});

// Handle file upload, push to Discord, and generate code
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Prepare multipart form data for Discord webhook
        const discordForm = new FormData();
        discordForm.append('payload_json', JSON.stringify({
            content: \`📦 **New File Dumped** (Code: \` + code + \`)\\nFilename: \` + req.file.originalname
        }));
        discordForm.append('file', req.file.buffer, { filename: req.file.originalname });

        await axios.post(DISCORD_WEBHOOK_URL, discordForm, {
            headers: discordForm.getHeaders()
        });

        fileStore.set(code, {
            filename: req.file.originalname,
            buffer: req.file.buffer,
            mimetype: req.file.mimetype
        });

        res.json({ success: true, code: code });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process dump save.' });
    }
});

// Handle file retrieval and download by code
app.get('/download/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const fileData = fileStore.get(code);

    if (!fileData) {
        return res.status(404).send('Invalid or expired retrieval code.');
    }

    res.setHeader('Content-Disposition', 'attachment; filename="' + fileData.filename + '"');
    res.setHeader('Content-Type', fileData.mimetype);
    res.send(fileData.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('ECD Upload server running on port ' + PORT);
});
        
