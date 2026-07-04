// ================== SESSION CLEANER UTILITY ==================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initDB } = require('./src/database/db');
const { SessionModel } = require('./src/database/session');

const AUTH_DIR = path.resolve(__dirname, 'data/auth_session');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

async function cleanSession() {
  console.log("🧹 Memulai pembersihan sesi lama...");

  // 1. Pembersihan folder lokal (Legacy / jika masih ada sisa file)
  try {
    if (fs.existsSync(AUTH_DIR)) {
      deleteFolderRecursive(AUTH_DIR);
      console.log("✅ Berhasil menghapus folder data/auth_session lokal!");
    } else {
      console.log("ℹ️ Folder data/auth_session lokal memang tidak ada.");
    }
  } catch (err) {
    console.error("❌ Gagal membersihkan folder sesi lokal:", err.message);
  }

  // 2. Pembersihan sesi di MongoDB
  try {
    // Hubungkan ke MongoDB menggunakan konfigurasi bawaan proyek
    await initDB();
    
    const sessionId = process.env.SESSION_ID || 'rpg-bot-session';
    console.log(`🧹 Menghapus data sesi '${sessionId}' di MongoDB...`);
    
    const result = await SessionModel.deleteMany({ sessionId });
    console.log(`✅ Berhasil menghapus ${result.deletedCount} dokumen sesi dari MongoDB!`);
  } catch (err) {
    console.error("❌ Gagal membersihkan sesi di MongoDB:", err.message);
  } finally {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("🔌 Koneksi database ditutup.");
    }
    console.log("\n💡 Pembersihan selesai! Sekarang Anda bisa menjalankan bot kembali dengan: node index.js");
    process.exit(0);
  }
}

cleanSession();
