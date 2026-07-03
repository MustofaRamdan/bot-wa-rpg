// ================== MAIN ENTRY POINT (BAILEYS CONNECTOR) ==================
require('dotenv').config();

const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const db = require('./src/database/db');
const { routeCommand } = require('./src/commands/index');
const { worldBossTemplates } = require('./src/config/monsters');
const { spawnWorldBoss } = require('./src/commands/battle');

// Setup directory penyimpanan session
const AUTH_DIR = path.resolve(__dirname, 'data/auth_session');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// Set penyimpanan chats yang dikenal untuk broadcast bos
const CHATS_PATH = path.resolve(__dirname, 'data/known_chats.json');
let knownChats = new Set();
if (fs.existsSync(CHATS_PATH)) {
  try {
    knownChats = new Set(JSON.parse(fs.readFileSync(CHATS_PATH, 'utf8')));
  } catch (e) {
    console.error("Gagal memuat known_chats.json:", e);
  }
}

function saveKnownChats() {
  try {
    fs.writeFileSync(CHATS_PATH, JSON.stringify([...knownChats], null, 2), 'utf8');
  } catch (e) {
    console.error("Gagal menyimpan known_chats.json:", e);
  }
}

async function startBot() {
  console.log("🚀 Menghubungkan ke WhatsApp Server via Baileys...");

  // Mengambil state otentikasi multi-file
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  
  // Mengambil versi Baileys terbaru
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📱 Menggunakan Baileys v${version.join('.')}, Terbaru: ${isLatest}`);

  // Inisialisasi WASocket
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }), // Log sunyi agar tidak spam terminal
    printQRInTerminal: true,            // Print QR otomatis di terminal
    browser: ["Antigravity RPG Bot", "Chrome", "1.0.0"]
  });

  // Listener event perubahan kredensial
  sock.ev.on('creds.update', saveCreds);

  // Listener event perubahan status koneksi
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.clear();
      console.log("📱 SCAN QR CODE DENGAN WHATSAPP HP ANDA:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
      const reason = lastDisconnect?.error?.message || "Unknown";
      
      console.log(`❌ Koneksi Terputus. Kode Status: ${statusCode} | Alasan: ${reason}`);

      // Reconnect jika bukan karena sengaja keluar / logout
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("🔄 Mencoba menghubungkan kembali...");
        startBot();
      } else {
        console.log("🛑 Sesi Anda telah berakhir (Logged Out). Harap hapus folder data/auth_session dan jalankan ulang untuk scan QR baru.");
      }
    } else if (connection === 'open') {
      console.clear();
      console.log("✅ KONEKSI WHATSAPP BERHASIL TERBUKA!");
      console.log("🎮 RPG Bot siap digunakan! Ketik !help untuk menu utama.");
    }
  });

  // Listener untuk pesan masuk
  sock.ev.on('messages.upsert', async (m) => {
    // Hanya proses pesan baru
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      try {
        if (!msg.message) continue;

        const remoteJid = msg.key.remoteJid;
        
        // Simpan JID chat agar bisa menerima notifikasi World Boss
        if (!knownChats.has(remoteJid)) {
          knownChats.add(remoteJid);
          saveKnownChats();
        }

        // Cek jika pesan dari diri sendiri (fromMe)
        if (msg.key.fromMe) {
          // Bolehkan jika itu chat pribadi ke nomor sendiri (self-chat)
          const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          if (remoteJid !== botJid) {
            continue; // Abaikan jika dari diri sendiri di grup atau chat orang lain
          }
        }

        // Ekstrak teks isi pesan
        // Filter key metadata Baileys yang sering muncul pertama di pesan grup
        const META_KEYS = new Set(['messageContextInfo', 'senderKeyDistributionMessage', 'messageSecret']);
        let msgContent = msg.message;

        // Unwrap ephemeral / viewOnce wrapper jika ada
        if (msgContent.ephemeralMessage) msgContent = msgContent.ephemeralMessage.message;
        if (msgContent.viewOnceMessage) msgContent = msgContent.viewOnceMessage.message;

        const mType = Object.keys(msgContent).find(k => !META_KEYS.has(k)) || Object.keys(msgContent)[0];
        
        let body = "";
        if (mType === 'conversation') {
          body = msgContent.conversation;
        } else if (mType === 'extendedTextMessage') {
          body = msgContent.extendedTextMessage?.text;
        } else if (mType === 'imageMessage') {
          body = msgContent.imageMessage?.caption;
        } else if (mType === 'videoMessage') {
          body = msgContent.videoMessage?.caption;
        } else if (mType === 'buttonsResponseMessage') {
          body = msgContent.buttonsResponseMessage?.selectedButtonId;
        } else if (mType === 'listResponseMessage') {
          body = msgContent.listResponseMessage?.singleSelectReply?.selectedRowId;
        }

        body = (body || "").trim();
        if (!body.startsWith('!')) continue; // Abaikan jika bukan command

        // Dapatkan userId (nomor pengirim)
        // Normalisasi JID: support format @s.whatsapp.net DAN @lid (format baru WA)
        const senderJid = msg.key.participant || remoteJid;
        const senderSuffix = senderJid.split('@')[1] || '';
        let userId = senderJid.split('@')[0];
        
        // Jika JID pakai format @lid, coba cari nomor asli dari contact store
        // Jika tidak ditemukan, tetap pakai LID sebagai userId agar data konsisten
        if (senderSuffix === 'lid') {
          try {
            const contact = sock.contacts?.[senderJid];
            if (contact?.id && contact.id.includes('@s.whatsapp.net')) {
              userId = contact.id.split('@')[0];
            }
          } catch (_) { /* tetap pakai LID jika gagal */ }
        }
        
        const pushName = msg.pushName || `Player_${userId.slice(-4)}`;

        // Load player dan data terkait (mentions, guild members) ke cache secara async sebelum command diproses (Lazy Loading)
        const idsToLoad = [userId];
        const mentions = msgContent?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (const mJid of mentions) {
          if (mJid) idsToLoad.push(mJid.split('@')[0]);
        }

        const cachedPlayer = db.getPlayerFromCacheOnly(userId);
        if (cachedPlayer && cachedPlayer.guild) {
          const guild = db.getGuild(cachedPlayer.guild);
          if (guild) {
            if (guild.members) idsToLoad.push(...guild.members);
            if (guild.invites) idsToLoad.push(...guild.invites);
            if (guild.leader) idsToLoad.push(guild.leader);
          }
        }

        await db.loadPlayersToCache(idsToLoad);

        // Jalankan lock keamanan untuk menghindari spam race condition
        const lock = require('./src/utils/lock');
        if (!lock.acquireLock(userId)) {
          continue;
        }

        try {
          // Jalankan router command
          await routeCommand(sock, msg, body, userId, pushName, sock);
        } finally {
          lock.releaseLock(userId);
        }

      } catch (err) {
        console.error("❌ Error memproses pesan masuk:", err);
      }
    }
  });

  // ================== WORLD BOSS INTERVAL TICKER ==================
  // Menjalankan pengecekan status World Boss secara berkala (tiap 60 detik)
  setInterval(async () => {
    const boss = db.getWorldBoss();
    if (!boss) return;

    const now = Date.now();

    // Spawn World Boss jika tidak aktif dan waktunya sudah tiba
    if (!boss.isActive && boss.nextSpawnAt && now >= boss.nextSpawnAt) {
      // Dapatkan rata-rata level seluruh player
      const allPlayers = await db.getAllPlayersList();
      const avgLevel = allPlayers.length > 0
        ? Math.floor(allPlayers.reduce((s, p) => s + p.level, 0) / allPlayers.length)
        : 10;

      // Spawn World Boss menggunakan fungsi terpusat
      spawnWorldBoss(boss, avgLevel);

      // Kirim Notifikasi ke semua chat yang dikenal
      const text = 
`🐲 *WORLD BOSS TELAH MUNCUL!* 🐲
────────────────────────
Nama: *${boss.name}* (Lv. ${boss.level})
❤️ HP: *${boss.hp}/${boss.maxHp}*

⚔️ Ketik *!worldboss* atau *!boss* untuk menyerang bersama pemain lain!`;

      for (const jid of knownChats) {
        try {
          await sock.sendMessage(jid, { text });
        } catch (e) {
          // Hapus JID jika tidak lagi valid (misal user memblokir/grup mati)
          // console.error(`Gagal kirim notifikasi ke ${jid}:`, e.message);
        }
      }
    }
  }, 60 * 1000);
}

// Menangani shutdown bersih agar data tersimpan aman
process.on('SIGINT', async () => {
  console.log("\n🛑 Melakukan shutdown bersih. Menyimpan status...");
  saveKnownChats();
  process.exit(0);
});

// Jalankan DB lalu Bot
const { initDB } = require('./src/database/db');
initDB()
  .then(() => startBot())
  .catch(err => {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  });
