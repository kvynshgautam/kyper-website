/**
 * KYPER Official Website & Binary Distribution Server
 * Engineered by Kavyansh Gautam (KG)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

const GITHUB_APK_URL = "https://github.com/kvynshgautam/kyper-website/releases/latest/download/Kyper-latest.apk";
const GITHUB_EXT_URL = "https://github.com/kvynshgautam/kyper-website/releases/latest/download/Kyper-extension.zip";

// Explicit Direct Download Endpoint for Android APK
app.get('/download/apk', (req, res) => {
  let apkPath = path.join(__dirname, 'public', 'downloads', 'Kyper-latest.apk');
  if (!fs.existsSync(apkPath)) {
    apkPath = path.join(__dirname, 'public', 'downloads', 'GhostTyper-latest.apk');
  }
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="Kyper-latest.apk"');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.sendFile(apkPath);
  }
  return res.redirect(GITHUB_APK_URL);
});

// Explicit Direct Download Endpoint for Chrome Extension
app.get('/download/extension', (req, res) => {
  let extPath = path.join(__dirname, 'public', 'downloads', 'Kyper-extension.zip');
  if (!fs.existsSync(extPath)) {
    extPath = path.join(__dirname, 'public', 'downloads', 'GhostTyper-extension.zip');
  }
  if (fs.existsSync(extPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="Kyper-extension.zip"');
    res.setHeader('Content-Type', 'application/zip');
    return res.sendFile(extPath);
  }
  return res.redirect(GITHUB_EXT_URL);
});

// JSON API endpoint for in-app update checks
app.get('/api/updates', (req, res) => {
  const jsonPath = path.join(__dirname, 'public', 'data', 'updates.json');
  if (fs.existsSync(jsonPath)) {
    return res.sendFile(jsonPath);
  }
  return res.status(404).json({ error: 'Updates metadata not found' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    name: 'KYPER',
    version: 'v6.1',
    architect: 'Kavyansh Gautam (KG)',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local development listener
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`⚡ KYPER Official Portal Live at: http://localhost:${PORT}`);
    console.log(`📱 APK Download: http://localhost:${PORT}/download/apk`);
    console.log(`💻 Ext Download: http://localhost:${PORT}/download/extension`);
    console.log(`📡 Updates API: http://localhost:${PORT}/api/updates`);
    console.log(`=======================================================`);
  });
}

// Export for Vercel Serverless Function
module.exports = app;
