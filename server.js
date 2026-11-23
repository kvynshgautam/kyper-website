/**
 * KYPER Official Website & Self-Hosted Autonomous Backend Server
 * Engineered with Precision by Kavyansh Gautam (KG)
 *
 * Full Feature Suite:
 *  - Official Website & Binary Distribution (APK & Extension)
 *  - Zero-Cloudflare-Limit AI Suggestions (/api/suggest)
 *  - Direct UPI Payment Proof Processing (/api/submit-payment)
 *  - Automated 1-Click Pro Device Unlocking (/api/status & /api/verify)
 *  - Executive Cyber Admin Dashboard (/admin & /admin/*)
 *  - Permanent File-Backed Persistent Storage (data/db.json)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Lightweight zero-dependency .env loader
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (e) {
    console.error('Error loading .env file:', e);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "Kavyansh@2026#Pro";
const FREE_DAILY_LIMIT = 15;

const GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

const PLAN_CATALOG = {
  monthly:  { id: "monthly",  label: "Monthly Pro (30 Days)", amount: 99,  days: 30 },
  lifetime: { id: "lifetime", label: "Lifetime Pro",          amount: 499, days: 0  },
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Persistent JSON Storage
const DB_FILE = path.join(__dirname, 'data', 'db.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading db.json:', e);
  }
  return { payments: {}, keys: {}, deviceLicenses: {}, usage: {} };
}

function writeDb(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

// Helpers
const todayKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
};

function genCode(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${part()}-${part()}`;
}
const genKey = () => genCode("KYPER");
const genPayId = () => genCode("PAY");

function checkLicense(db, rawKey) {
  const key = String(rawKey || "").trim().toUpperCase();
  if (!key) return { valid: false, reason: "Invalid license key." };
  const rec = db.keys[key];
  if (!rec) return { valid: false, reason: "License key not found." };
  if (rec.revoked) return { valid: false, reason: "This license key has been revoked." };
  if (rec.expiresAt && Date.now() > rec.expiresAt) {
    return { valid: false, reason: "License expired. Please renew your Pro plan." };
  }
  return { valid: true, key, expiresAt: rec.expiresAt || 0, label: rec.label || "Pro", note: rec.note || "" };
}

function getDeviceLicense(db, deviceId) {
  if (!deviceId) return { valid: false };
  const devKey = db.deviceLicenses[String(deviceId).slice(0, 64)];
  if (!devKey) return { valid: false };
  return checkLicense(db, devKey);
}

function getDevicePayment(db, deviceId) {
  if (!deviceId) return null;
  const payId = Object.keys(db.payments).reverse().find(id => db.payments[id].deviceId === deviceId);
  if (!payId) return null;
  const p = db.payments[payId];
  return {
    id: p.id,
    status: p.status,
    planLabel: p.planLabel,
    amount: p.amount,
    rejectReason: p.rejectReason || "",
    licenseKey: p.status === "approved" ? (p.licenseKey || "") : "",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function getUsage(db, deviceId) {
  if (!deviceId) return 0;
  const k = `${todayKey()}:${String(deviceId).slice(0, 64)}`;
  return Number(db.usage[k]) || 0;
}

function bumpUsage(db, deviceId) {
  if (!deviceId) return 1;
  const k = `${todayKey()}:${String(deviceId).slice(0, 64)}`;
  const next = (Number(db.usage[k]) || 0) + 1;
  db.usage[k] = next;
  writeDb(db);
  return next;
}

// AI Engine Callers
async function callGroq(apiKey, system, prompt, maxTok) {
  let lastErr;
  for (const model of GROQ_MODELS) {
    try {
      const body = {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: Math.max(400, maxTok || 600),
        temperature: 0.45,
      };
      if (/gpt-oss/.test(model)) body.reasoning_effort = "medium";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastErr = new Error(`Groq ${res.status}: ${data?.error?.message || "failed"}`);
        if ([400, 404, 429, 500, 502, 503, 504].includes(res.status)) continue;
        throw lastErr;
      }
      const text = data?.choices?.[0]?.message?.content || "";
      if (text) return { text, model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Groq API unavailable");
}

async function callGemini(apiKey, system, prompt, pdf) {
  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const parts = pdf
        ? [{ inline_data: { mime_type: "application/pdf", data: pdf.data } }, { text: prompt }]
        : [{ text: prompt }];
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.45 },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastErr = new Error(`Gemini ${res.status}: ${data?.error?.message || "failed"}`);
        if ([400, 404, 429, 500, 502, 503, 504].includes(res.status)) continue;
        throw lastErr;
      }
      const out = (data?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
      if (out) return { text: out, model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Gemini API unavailable");
}

// Admin Auth Middleware
const checkAdmin = (req, res, next) => {
  const sec = req.headers['x-admin-secret'] || req.query.sec || '';
  if (!ADMIN_SECRET || sec !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Invalid ADMIN_SECRET" });
  }
  next();
};

// -------------------------------------------------------------
// 1. Binary Distribution Endpoints
// -------------------------------------------------------------
const GITHUB_APK_URL = "https://github.com/kvynshgautam/kyper-website/releases/latest/download/Kyper-latest.apk";
const GITHUB_EXT_URL = "https://github.com/kvynshgautam/kyper-website/releases/latest/download/Kyper-extension.zip";

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

app.get('/api/updates', (req, res) => {
  const jsonPath = path.join(__dirname, 'public', 'data', 'updates.json');
  if (fs.existsSync(jsonPath)) {
    return res.sendFile(jsonPath);
  }
  return res.status(404).json({ error: 'Updates metadata not found' });
});

// -------------------------------------------------------------
// 2. Admin Console & Admin APIs
// -------------------------------------------------------------
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/dashboard', checkAdmin, (req, res) => {
  const db = readDb();
  const payments = Object.values(db.payments).map(p => {
    const hasScreenshot = !!p.screenshot;
    const copy = { ...p, hasScreenshot };
    if (p.status !== "pending") delete copy.screenshot;
    return copy;
  }).sort((a, b) => {
    const pa = a.status === "pending" ? 0 : 1;
    const pb = b.status === "pending" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const keys = Object.values(db.keys).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ ok: true, payments, keys });
});

app.get('/admin/payment-image', checkAdmin, (req, res) => {
  const id = String(req.query.id || "").trim().toUpperCase();
  if (!id) return res.status(400).json({ error: "Missing payment id" });
  const db = readDb();
  const pay = db.payments[id];
  if (!pay) return res.status(404).json({ error: "Payment record not found" });
  res.json({ ok: true, id, screenshot: pay.screenshot || "" });
});

app.get('/admin/list-payments', checkAdmin, (req, res) => {
  const db = readDb();
  const payments = Object.values(db.payments).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ ok: true, payments });
});

app.post('/admin/approve-payment', checkAdmin, (req, res) => {
  const body = req.body || {};
  const id = String(body.id || "").trim().toUpperCase();
  const db = readDb();
  const pay = db.payments[id];
  if (!pay) return res.status(404).json({ error: "Payment record not found." });

  if (pay.status === "approved" && pay.licenseKey) {
    return res.json({ ok: true, id, licenseKey: pay.licenseKey, label: pay.planLabel });
  }

  const days = body.days !== undefined ? Math.max(0, Number(body.days) || 0) : (pay.days || 30);
  const key = genKey();
  const label = days === 0 ? "Lifetime Pro" : days === 30 ? "Monthly Pro" : `${days}-Day Pro`;

  const licRec = {
    key,
    label,
    note: `${pay.name} · UPI ₹${pay.amount}${pay.utr ? " · UTR " + pay.utr : ""}`,
    deviceId: pay.deviceId,
    createdAt: Date.now(),
    expiresAt: days > 0 ? Date.now() + days * 86400 * 1000 : 0,
    revoked: false,
  };

  pay.status = "approved";
  pay.licenseKey = key;
  pay.rejectReason = "";
  pay.updatedAt = Date.now();

  db.keys[key] = licRec;
  db.payments[id] = pay;
  if (pay.deviceId) {
    db.deviceLicenses[String(pay.deviceId).slice(0, 64)] = key;
  }
  writeDb(db);

  res.json({ ok: true, id, licenseKey: key, label });
});

app.post('/admin/reject-payment', checkAdmin, (req, res) => {
  const body = req.body || {};
  const id = String(body.id || "").trim().toUpperCase();
  const db = readDb();
  const pay = db.payments[id];
  if (!pay) return res.status(404).json({ error: "Payment record not found." });

  pay.status = "rejected";
  pay.rejectReason = String(body.reason || "Payment not received / invalid screenshot.").slice(0, 200);
  pay.updatedAt = Date.now();

  db.payments[id] = pay;
  writeDb(db);

  res.json({ ok: true, id });
});

app.post('/admin/create-key', checkAdmin, (req, res) => {
  const body = req.body || {};
  const days = Math.max(0, Number(body.days) || 0);
  const key = genKey();
  const label = days === 0 ? "Lifetime Pro" : days === 30 ? "Monthly Pro" : `${days}-Day Pro`;

  const rec = {
    key,
    label,
    note: String(body.note || "").slice(0, 100),
    createdAt: Date.now(),
    expiresAt: days > 0 ? Date.now() + days * 86400 * 1000 : 0,
    revoked: false,
  };

  const db = readDb();
  db.keys[key] = rec;
  writeDb(db);

  res.json({ ok: true, ...rec });
});

app.post('/admin/revoke-key', checkAdmin, (req, res) => {
  const body = req.body || {};
  const key = String(body.key || "").trim().toUpperCase();
  const db = readDb();
  const rec = db.keys[key];
  if (!rec) return res.status(404).json({ error: "Key not found" });

  rec.revoked = true;
  db.keys[key] = rec;
  writeDb(db);

  res.json({ ok: true, key });
});

app.get('/admin/list-keys', checkAdmin, (req, res) => {
  const db = readDb();
  const keys = Object.values(db.keys).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ ok: true, keys });
});

// -------------------------------------------------------------
// 3. Public APIs (Payments, Verification, AI Suggestion)
// -------------------------------------------------------------

// Submit UPI Payment Proof
app.post('/api/submit-payment', (req, res) => {
  const body = req.body || {};
  const deviceId = String(body.deviceId || "").trim().slice(0, 64);
  const name = String(body.name || "").trim().slice(0, 80);
  const utr = String(body.utr || "").trim().slice(0, 40);
  const screenshot = String(body.screenshot || "").trim();
  const plan = PLAN_CATALOG[body.planId] || PLAN_CATALOG.monthly;

  if (!deviceId) return res.status(400).json({ error: "Missing deviceId." });
  if (!name) return res.status(400).json({ error: "Please enter your name." });
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(screenshot)) {
    return res.status(400).json({ error: "Please attach a valid payment screenshot image." });
  }

  const db = readDb();
  const id = genPayId();
  const rec = {
    id,
    deviceId,
    name,
    utr,
    planId: plan.id,
    planLabel: plan.label,
    amount: plan.amount,
    days: plan.days,
    screenshot,
    status: "pending",
    rejectReason: "",
    licenseKey: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.payments[id] = rec;
  writeDb(db);

  res.json({ ok: true, id, status: "pending", planLabel: plan.label, amount: plan.amount });
});

// Verify License Key
app.post('/api/verify', (req, res) => {
  const body = req.body || {};
  const db = readDb();
  const lic = checkLicense(db, body.licenseKey);
  if (!lic.valid) return res.status(403).json({ ok: false, error: lic.reason });
  res.json({ ok: true, plan: "pro", label: lic.label, expiresAt: lic.expiresAt });
});

// Device Plan & Quota Status Check
app.post('/api/status', (req, res) => {
  const body = req.body || {};
  const deviceId = String(body.deviceId || "").trim().slice(0, 64);
  const db = readDb();

  const lic = body.licenseKey ? checkLicense(db, body.licenseKey) : { valid: false };
  if (lic.valid) {
    return res.json({ ok: true, plan: "pro", label: lic.label, expiresAt: lic.expiresAt, remaining: 9999, limit: 9999 });
  }

  const devLic = getDeviceLicense(db, deviceId);
  if (devLic.valid) {
    return res.json({
      ok: true,
      plan: "pro",
      autoUnlocked: true,
      licenseKey: devLic.key,
      label: devLic.label,
      expiresAt: devLic.expiresAt,
      remaining: 9999,
      limit: 9999,
    });
  }

  const used = getUsage(db, deviceId);
  const payment = getDevicePayment(db, deviceId);
  res.json({
    ok: true,
    plan: "free",
    used,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    limit: FREE_DAILY_LIMIT,
    payment,
  });
});

// AI Suggestion Handler (Groq / Gemini)
app.post('/api/suggest', async (req, res) => {
  try {
    const body = req.body || {};
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

    const db = readDb();
    let lic = body.licenseKey ? checkLicense(db, body.licenseKey) : { valid: false };
    if (!lic.valid) lic = getDeviceLicense(db, deviceId);
    const isPro = lic.valid;

    if (!isPro) {
      if (body.auto) return res.status(403).json({ error: "👑 Auto-Pilot is a PRO feature. Upgrade in KYPER app/extension." });
      if (body.pdf) return res.status(403).json({ error: "👑 PDF Reader is a PRO feature. Upgrade in KYPER app/extension." });
      if (body.isProMood) return res.status(403).json({ error: "👑 Flirty, Spicy & Rude moods are PRO features." });
      const used = getUsage(db, deviceId);
      if (used >= FREE_DAILY_LIMIT) {
        return res.status(429).json({ error: `Daily free limit reached (${FREE_DAILY_LIMIT}/${FREE_DAILY_LIMIT}). Upgrade to KYPER Pro for unlimited replies!` });
      }
    }

    const system = String(body.system || "").slice(0, 12000);
    const prompt = String(body.prompt || "").slice(0, 18000);
    const maxTok = Number(body.maxTok) || 300;
    const pdf = isPro && body.pdf ? body.pdf : null;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let out;
    if (pdf && geminiKey) {
      out = await callGemini(geminiKey, system, prompt, pdf);
    } else if (groqKey) {
      try {
        out = await callGroq(groqKey, system, prompt, maxTok);
      } catch (e) {
        if (geminiKey) out = await callGemini(geminiKey, system, prompt, pdf);
        else throw e;
      }
    } else if (geminiKey) {
      out = await callGemini(geminiKey, system, prompt, pdf);
    } else {
      // Intelligent Hinglish conversational fallback if no key is supplied yet
      out = {
        text: "Haan bilkul, samajh gaya! Batao aage kya karna hai?",
        model: "kyper-offline-fallback"
      };
    }

    let remaining = 9999;
    if (!isPro) {
      const newUsed = bumpUsage(db, deviceId);
      remaining = Math.max(0, FREE_DAILY_LIMIT - newUsed);
    }

    res.json({
      ok: true,
      reply: out.text,
      model: out.model,
      plan: isPro ? "pro" : "free",
      remaining,
      limit: FREE_DAILY_LIMIT,
    });
  } catch (e) {
    console.error('Suggest error:', e);
    res.status(500).json({ error: e.message || "AI server error" });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'KYPER Self-Hosted Autonomous Backend',
    version: 'v6.3.12',
    admin: '/admin',
    timestamp: new Date().toISOString()
  });
});

// Catch-all: Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local dev listener
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`⚡ KYPER Self-Hosted Server Live at: http://localhost:${PORT}`);
    console.log(`🛡️ KYPER Executive Admin Console: http://localhost:${PORT}/admin`);
    console.log(`📱 APK Download: http://localhost:${PORT}/download/apk`);
    console.log(`💻 Ext Download: http://localhost:${PORT}/download/extension`);
    console.log(`📡 Updates API: http://localhost:${PORT}/api/updates`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
