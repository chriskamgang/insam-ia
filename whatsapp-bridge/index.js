const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, downloadMediaMessage } = require("@whiskeysockets/baileys");
const express = require("express");
const cors = require("cors");
const { Boom } = require("@hapi/boom");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.BAILEYS_PORT || 3001;
const AUTH_DIR = path.join(__dirname, "auth_info");
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8002";

let sock = null;
let currentQR = null;
let connectionStatus = "disconnected";
let connectedPhone = null;

// ===================== WHATSAPP CONNECTION =====================

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, undefined),
    },
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      connectionStatus = "qr";
      qrcode.generate(qr, { small: true });
      console.log("QR code generated - scan with WhatsApp");
    }

    if (connection === "close") {
      currentQR = null;
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        connectionStatus = "disconnected";
        connectedPhone = null;
        console.log("Logged out. Cleaning auth and reconnecting...");
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, { recursive: true });
        }
        setTimeout(connectWhatsApp, 3000);
      } else {
        connectionStatus = "reconnecting";
        console.log("Connection lost, reconnecting...");
        setTimeout(connectWhatsApp, 3000);
      }
    }

    if (connection === "open") {
      currentQR = null;
      connectionStatus = "authenticated";
      connectedPhone = sock.user?.id?.split(":")[0] || null;
      console.log(`Connected as ${connectedPhone}`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Incoming messages -> forward to Laravel backend
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const from = msg.key.remoteJid;
      if (!from) continue;
      if (from.endsWith("@g.us")) continue; // Skip groups

      let phone = from.replace("@s.whatsapp.net", "").replace(/@lid$/, "");

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        "";

      const isImage = !!(msg.message.imageMessage);
      const isAudio = !!(msg.message.audioMessage || msg.message.pttMessage);

      let imageBase64 = null;
      let audioBase64 = null;

      const silentLogger = { level: "silent", child: () => silentLogger, info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, trace: () => {}, fatal: () => {} };

      if (isImage) {
        try {
          const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: silentLogger });
          imageBase64 = buffer.toString("base64");
          console.log(`Image from ${phone} (${Math.round(buffer.length / 1024)}KB)`);
        } catch (err) {
          console.error("Error downloading image:", err.message);
        }
      }

      if (isAudio) {
        try {
          const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: silentLogger });
          audioBase64 = buffer.toString("base64");
          console.log(`Audio from ${phone} (${Math.round(buffer.length / 1024)}KB)`);
        } catch (err) {
          console.error("Error downloading audio:", err.message);
        }
      }

      if (!text && !imageBase64 && !audioBase64) continue;

      console.log(`Message from ${phone}: ${text || (isImage ? "[image]" : "[audio]")}`);

      // Forward to Laravel webhook
      try {
        const resp = await fetch(`${BACKEND_URL}/api/webhook/baileys`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: phone,
            message: text || "",
            image_base64: imageBase64,
            audio_base64: audioBase64,
          }),
        });
        const data = await resp.json();

        if (data.reply) {
          await sock.sendMessage(from, { text: data.reply });
          console.log(`Reply sent to ${phone}: ${data.reply.substring(0, 80)}...`);
        }
      } catch (err) {
        console.error("Error forwarding to backend:", err.message);
      }
    }
  });
}

// ===================== API ENDPOINTS =====================

app.get("/status", (req, res) => {
  res.json({ status: connectionStatus, phone: connectedPhone });
});

app.get("/qr", async (req, res) => {
  if (currentQR) {
    try {
      const qrDataUrl = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
      res.json({ qr: currentQR, qr_image: qrDataUrl, status: "qr" });
    } catch {
      res.json({ qr: currentQR, qr_image: null, status: "qr" });
    }
  } else if (connectionStatus === "authenticated") {
    res.json({ qr: null, qr_image: null, status: "authenticated" });
  } else {
    res.json({ qr: null, qr_image: null, status: connectionStatus });
  }
});

app.post("/send/text", async (req, res) => {
  const { phone, message } = req.body;
  if (!sock || connectionStatus !== "authenticated") {
    return res.status(503).json({ status: "failed", error: "WhatsApp not connected" });
  }
  try {
    const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: message });
    res.json({ status: "queued", sid: result.key.id });
  } catch (err) {
    res.json({ status: "failed", error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  if (sock) {
    try { await sock.logout(); } catch {}
    connectionStatus = "disconnected";
    connectedPhone = null;
    currentQR = null;
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true });
    }
  }
  res.json({ status: "ok" });
});

app.post("/restart", async (req, res) => {
  connectionStatus = "reconnecting";
  if (sock) {
    try { sock.end(); } catch {}
  }
  setTimeout(connectWhatsApp, 1000);
  res.json({ status: "restarting" });
});

// ===================== START =====================

app.listen(PORT, () => {
  console.log(`INSAM-IA WhatsApp Bridge on http://localhost:${PORT}`);
  connectWhatsApp();
});
