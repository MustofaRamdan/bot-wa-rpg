// ================== SESSION CLEANER UTILITY ==================
const fs = require('fs');
const path = require('path');

const AUTH_DIR = path.resolve(__dirname, 'data/auth_session');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Rekursif
        deleteFolderRecursive(curPath);
      } else {
        // Hapus file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

console.log("🧹 Memulai pembersihan sesi lama...");
try {
  if (fs.existsSync(AUTH_DIR)) {
    deleteFolderRecursive(AUTH_DIR);
    console.log("✅ Berhasil menghapus folder data/auth_session secara bersih!");
  } else {
    console.log("ℹ️ Folder data/auth_session memang tidak ada.");
  }
  console.log("\n💡 Sekarang silakan jalankan bot kembali dengan: node index.js");
} catch (err) {
  console.error("❌ Gagal membersihkan sesi:", err.message);
}
