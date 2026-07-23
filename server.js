const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory storage for 6-character code retrieval
const fileStore = new Map();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
            .container { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); width: 350px; text-align: center; }
            h2 { margin-bottom: 20px; color: #38bdf8; }
            input, button { width: 100%; padding: 10px; margin: 10px 0; border-radius: 6px; border: none; box-sizing: border-box; }
            input { background: #334155; color: white; }
            button { background: #0284c7; color: white; font-weight: bold; cursor: pointer; }
            button:hover { background: #0369a1; }
            .section { margin-bottom: 25px; border-bottom: 1px solid #334155; padding-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>ECD Upload</h2>
            
            <div class="section">
                <h3>Dump Save (Discord)</h3>
                <form action="/upload-discord" method="POST" enctype="multipart/form-data">
                    <input type="text" name="webhook" placeholder="Discord Webhook URL" required>
                    <input type="file" name="file" required>
                    <button type="submit">Send to Discord</button>
                </form>
            </div>

            <div>
                <h3>Retrieve File</h3>
                <form action="/retrieve" method="POST">
                    <input type="text" name="code" placeholder="6-Character Code" maxlength="6" required>
                    <button type="submit">Get File</button>
                </form>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Handle Discord Webhook Dump
app.post('/upload-discord', upload.single('file'), async (req, res) => {
  try {
    const webhookUrl = req.body.webhook;
    const file = req.file;

    if (!file || !webhookUrl) {
      return res.status(400).send('Missing file or webhook URL.');
    }

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('payload_json', JSON.stringify({ content: `Uploaded file: **${file.originalname}**` }));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (response.ok) {
      res.send('<h3>File successfully dumped to Discord! <a href="/">Go Back</a></h3>');
    } else {
      res.status(500).send('<h3>Failed to send to Discord webhook. Check your URL. <a href="/">Go Back</a></h3>');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during upload.');
  }
});

// Code Generation & Retrieval endpoint placeholder logic can be expanded here as needed
app.post('/retrieve', (req, res) => {
  const code = req.body.code;
  const fileData = fileStore.get(code);
  if (!fileData) {
    return res.status(404).send('<h3>File not found or expired. <a href="/">Go Back</a></h3>');
  }
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  res.send(fileData.buffer);
});

// Crucial: Bind dynamically to Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is live and running on port ${PORT}`);
});
