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

// Main HTML User Interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECD Upload</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); width: 380px; text-align: center; }
            h2 { margin-bottom: 20px; color: #38bdf8; }
            input, button { width: 100%; padding: 10px; margin: 10px 0; border-radius: 6px; border: none; box-sizing: border-box; }
            input[type="file"] { background: #334155; color: white; }
            button { background: #0284c7; color: white; font-weight: bold; cursor: pointer; }
            button:hover { background: #0369a1; }
            .section { margin-bottom: 25px; border-bottom: 1px solid #334155; padding-bottom: 15px; }
            .code-box { background: #0f172a; padding: 12px; border-radius: 6px; font-size: 20px; letter-spacing: 2px; color: #38bdf8; margin: 15px 0; font-weight: bold; user-select: all; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>ECD Upload</h2>
            
            <div class="section">
                <h3>Dump ECD</h3>
                <form action="/upload-discord" method="POST" enctype="multipart/form-data">
                    <input type="file" name="file" required>
                    <button type="submit">Upload & Get Code</button>
                </form>
            </div>

            <div>
                <h3>Retrieve File</h3>
                <form action="/retrieve" method="POST">
                    <input type="text" name="code" placeholder="Enter 6-Character Code" maxlength="6" style="text-transform:uppercase;" required>
                    <button type="submit">Download File</button>
                </form>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Handle Upload, Discord Forwarding, and Code Generation
app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('<h3>No file uploaded. <a href="/">Go Back</a></h3>');
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

    // Forward file to Discord webhook
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('payload_json', JSON.stringify({ 
      content: `📦 **New File Uploaded**\nFilename: \`${file.originalname}\`\nRetrieval Code: \`${code}\`` 
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
                body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); width: 380px; text-align: center; }
                h2 { color: #22c55e; }
                .code-box { background: #0f172a; padding: 12px; border-radius: 6px; font-size: 24px; letter-spacing: 3px; color: #38bdf8; margin: 15px 0; font-weight: bold; }
                a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px; }
                a:hover { text-decoration: underline; }
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
