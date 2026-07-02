// ================== MIGRATION SCRIPT: File JSON → MongoDB ==================
// Jalankan SEKALI saja: node migrate.js
// Script ini memindahkan data dari folder data/ ke MongoDB

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;
const DATA_DIR = path.resolve(__dirname, 'data');
const PLAYERS_DIR = path.join(DATA_DIR, 'players');

// Schema sama persis dengan db.js
const playerSchema = new mongoose.Schema({ userId: { type: String, unique: true } }, { strict: false, timestamps: true });
const guildSchema  = new mongoose.Schema({ guildId: { type: String, unique: true }, data: mongoose.Schema.Types.Mixed }, { timestamps: true });
const commentSchema = new mongoose.Schema({ data: mongoose.Schema.Types.Mixed }, { timestamps: true });
const worldBossSchema = new mongoose.Schema({ _id: { type: String, default: 'singleton' }, data: mongoose.Schema.Types.Mixed }, { timestamps: true });

const PlayerModel    = mongoose.model('Player',   playerSchema);
const GuildModel     = mongoose.model('Guild',    guildSchema);
const CommentModel   = mongoose.model('Comment',  commentSchema);
const WorldBossModel = mongoose.model('WorldBoss', worldBossSchema, 'worldboss');

async function migrate() {
  console.log('🔗 Menghubungkan ke MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Terhubung!\n');

  let ok = 0, skip = 0, fail = 0;

  // ===== 1. Migrasi Players =====
  if (fs.existsSync(PLAYERS_DIR)) {
    const files = fs.readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json'));
    console.log(`👤 Memigrasikan ${files.length} player...`);
    
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(PLAYERS_DIR, file), 'utf8'));
        if (!data.userId) { skip++; continue; }
        
        await PlayerModel.findOneAndUpdate(
          { userId: data.userId },
          { $set: data },
          { upsert: true, new: true }
        );
        ok++;
        process.stdout.write(`  ✅ ${data.name || data.userId}\n`);
      } catch (e) {
        fail++;
        console.error(`  ❌ Gagal: ${file} — ${e.message}`);
      }
    }
    console.log(`   → Berhasil: ${ok} | Skip: ${skip} | Gagal: ${fail}\n`);
  } else {
    console.log('📂 Folder players/ tidak ditemukan, skip.\n');
  }

  // ===== 2. Migrasi Guilds =====
  const guildsPath = path.join(DATA_DIR, 'guilds.json');
  if (fs.existsSync(guildsPath)) {
    const guilds = JSON.parse(fs.readFileSync(guildsPath, 'utf8'));
    const entries = Object.entries(guilds);
    console.log(`🏛 Memigrasikan ${entries.length} guild...`);
    for (const [guildId, data] of entries) {
      try {
        await GuildModel.findOneAndUpdate({ guildId }, { $set: { data } }, { upsert: true, new: true });
        console.log(`  ✅ Guild: ${data.name || guildId}`);
      } catch (e) {
        console.error(`  ❌ Guild ${guildId}: ${e.message}`);
      }
    }
    console.log();
  }

  // ===== 3. Migrasi Comments =====
  const commentsPath = path.join(DATA_DIR, 'comments.json');
  if (fs.existsSync(commentsPath)) {
    const comments = JSON.parse(fs.readFileSync(commentsPath, 'utf8'));
    console.log(`💬 Memigrasikan ${comments.length} komentar...`);
    for (const comment of comments) {
      try {
        await CommentModel.create({ data: comment });
      } catch (_) {}
    }
    console.log(`  ✅ ${comments.length} komentar dimigrasi.\n`);
  }

  // ===== 4. Migrasi World Boss =====
  const wbPath = path.join(DATA_DIR, 'worldboss.json');
  if (fs.existsSync(wbPath)) {
    const wbData = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
    console.log(`🐲 Memigrasikan World Boss state...`);
    try {
      await WorldBossModel.findByIdAndUpdate('singleton', { $set: { data: wbData } }, { upsert: true, new: true });
      console.log(`  ✅ World Boss: ${wbData.name || '-'} (isActive: ${wbData.isActive})\n`);
    } catch (e) {
      console.error(`  ❌ ${e.message}\n`);
    }
  }

  console.log('🎉 Migrasi selesai! Sekarang jalankan bot dengan: node index.js');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Fatal Error:', err.message);
  process.exit(1);
});
