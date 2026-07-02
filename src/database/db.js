// ================== MONGODB DATABASE CONTROLLER ==================

require('dotenv').config();
const mongoose = require('mongoose');
const { LRUCache } = require('lru-cache');
const { execSync } = require('child_process');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error('❌ MONGODB_URI tidak ditemukan di file .env!');

// ================== MONGOOSE SCHEMAS ==================

const playerSchema = new mongoose.Schema({
  userId:        { type: String, required: true, unique: true, index: true },
  name:          { type: String, default: 'Player' },
  job:           { type: String, default: null },
  level:         { type: Number, default: 1 },
  exp:           { type: Number, default: 0 },
  gold:          { type: Number, default: 500 },
  bank:          { type: Number, default: 0 },
  statPoints:    { type: Number, default: 0 },
  stats:         { type: mongoose.Schema.Types.Mixed, default: { str: 0, int: 0, vit: 0, agi: 0, dex: 0 } },
  hp:            { type: Number, default: 100 },
  mp:            { type: Number, default: 30 },
  inventory:     { type: mongoose.Schema.Types.Mixed, default: { potion: 3, ether: 1 } },
  equipment:     { type: mongoose.Schema.Types.Mixed, default: { weapon: null, armor: null } },
  pets:          { type: Array, default: [] },
  activePetId:   { type: String, default: null },
  guild:         { type: String, default: null },
  lastDaily:     { type: Number, default: 0 },
  cooldown:      { type: Number, default: 0 },
  bossCooldown:  { type: Number, default: 0 },
  dungeonCooldown: { type: Number, default: 0 },
  mancingCooldown: { type: Number, default: 0 },
  tebangCooldown:  { type: Number, default: 0 },
  tambangCooldown: { type: Number, default: 0 },
  zone:          { type: String, default: 'green_forest' },
  dailyQuest:    { type: mongoose.Schema.Types.Mixed, default: { date: "", huntProgress: 0, fishProgress: 0, claimed: false } },
  achievementStats: { type: mongoose.Schema.Types.Mixed, default: { str: 0, int: 0, vit: 0, agi: 0, dex: 0 } },
  achievementsClaimed: { type: Array, default: [] },
  unlockedPassives:    { type: Array, default: [] },
  gatherStats:   { type: mongoose.Schema.Types.Mixed, default: { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 } },
  battleStats:   {
    type: mongoose.Schema.Types.Mixed,
    default: {
      totalHunts: 0, totalWins: 0, totalLosses: 0,
      monstersKilled: 0, itemsBought: 0, itemsSold: 0,
      dungeonsCompleted: 0, worldBossDamage: 0, dailyStreak: 0
    }
  }
}, { timestamps: true });

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  data:    { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const worldBossSchema = new mongoose.Schema({
  _id:  { type: String, default: 'singleton' },
  data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const PlayerModel    = mongoose.model('Player',   playerSchema);
const GuildModel     = mongoose.model('Guild',    guildSchema);
const CommentModel   = mongoose.model('Comment',  commentSchema);
const WorldBossModel = mongoose.model('WorldBoss', worldBossSchema, 'worldboss');

// ================== IN-MEMORY CACHE ==================

// LRU Cache untuk Player — menjaga performa: tidak perlu query DB tiap pesan
const playerCache = new LRUCache({
  max: 500, // Mengurangi RAM: hanya simpan 500 user aktif terbaru
  ttl: 1000 * 60 * 30,  // 30 menit
  updateAgeOnGet: true
});

let guilds       = {};
let comments     = [];
let worldBossState = null;

// ================== INISIALISASI DB ==================

async function initDB() {
  console.log('🔗 Menghubungkan ke MongoDB...');
  
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000
  });

  console.log('✅ MongoDB berhasil terhubung!');

  // Preload semua player ke cache RAM dihapus untuk menghemat RAM (Lazy loading aktif)
  console.log('📦 Lazy loading player cache aktif (hemat RAM).');

  // Preload guilds ke memory
  const guildDocs = await GuildModel.find({}).lean();
  for (const g of guildDocs) {
    guilds[g.guildId] = g.data;
  }
  console.log(`🏛 ${guildDocs.length} guild dimuat.`);

  // Preload comments ke memory
  const commentDocs = await CommentModel.find({}).sort({ createdAt: 1 }).lean();
  comments = commentDocs.map(c => c.data).slice(-50);

  // Preload world boss ke memory
  const wbDoc = await WorldBossModel.findById('singleton').lean();
  worldBossState = wbDoc ? wbDoc.data : null;
  if (worldBossState) console.log(`🐲 World Boss state dimuat: ${worldBossState.name || '-'}`);

  // Reconnect otomatis jika koneksi terputus
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB terputus! Mencoba reconnect...');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB berhasil reconnect!');
  });
}

// ================== PLAYER ==================

function getPlayer(userId) {
  if (!userId) return null;

  if (playerCache.has(userId)) return playerCache.get(userId);

  // Fallback: Cache miss! Coba ambil dari DB secara sinkron menggunakan subprocess
  console.log(`⚠️ Cache miss untuk user ${userId}. Menjemput data dari DB secara sinkron...`);
  try {
    const scriptPath = path.resolve(__dirname, 'fetch_player_sync.js');
    const stdout = execSync(`node "${scriptPath}" "${userId}"`, {
      env: { ...process.env },
      timeout: 5000
    });
    const output = stdout.toString().trim();
    const jsonLine = output.split('\n').find(line => line.trim().startsWith('{') && line.trim().endsWith('}'));
    if (jsonLine) {
      const result = JSON.parse(jsonLine.trim());
      if (result && result.userId) {
        playerCache.set(userId, result);
        return result;
      }
    }
  } catch (err) {
    console.error(`❌ Gagal mengambil data user ${userId} secara sinkron:`, err.message);
  }

  // Player baru jika tidak ada di DB maupun cache
  const newPlayer = {
    userId,
    name: `Player_${userId.slice(-4)}`,
    job: null,
    level: 1, exp: 0, gold: 500, bank: 0, statPoints: 0,
    stats: { str: 0, int: 0, vit: 0, agi: 0, dex: 0 },
    hp: 100, mp: 30,
    inventory: { potion: 3, ether: 1 },
    equipment: { weapon: null, armor: null },
    pets: [], activePetId: null, guild: null,
    lastDaily: 0, cooldown: 0, bossCooldown: 0, dungeonCooldown: 0,
    mancingCooldown: 0, tebangCooldown: 0, tambangCooldown: 0,
    zone: 'green_forest',
    dailyQuest: { date: "", huntProgress: 0, fishProgress: 0, claimed: false },
    achievementStats: { str: 0, int: 0, vit: 0, agi: 0, dex: 0 },
    achievementsClaimed: [],
    unlockedPassives: [],
    gatherStats: { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 },
    battleStats: {
      totalHunts: 0, totalWins: 0, totalLosses: 0,
      monstersKilled: 0, itemsBought: 0, itemsSold: 0,
      dungeonsCompleted: 0, worldBossDamage: 0, dailyStreak: 0
    }
  };

  playerCache.set(userId, newPlayer);
  return newPlayer;
}

function savePlayer(player) {
  if (!player || !player.userId) return false;

  // Update cache langsung (sinkron)
  playerCache.set(player.userId, player);

  // Async write ke MongoDB (fire-and-forget)
  const { _id, __v, createdAt, updatedAt, ...playerData } = player;
  PlayerModel.findOneAndUpdate(
    { userId: player.userId },
    { $set: playerData },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => console.error('❌ MongoDB savePlayer error:', err.message));

  return true;
}

async function getAllPlayersList() {
  try {
    const players = await PlayerModel.find({ job: { $ne: null } })
      .select('userId name level exp job gold bank battleStats')
      .lean();
    return players;
  } catch (err) {
    console.error('❌ MongoDB getAllPlayersList error:', err.message);
    // Fallback ke cache
    const list = [];
    for (const [, p] of playerCache.entries()) {
      if (p && p.job) list.push(p);
    }
    return list;
  }
}

// ================== GUILD ==================

function getGuild(guildId) {
  return guilds[guildId] || null;
}

function saveGuild(guildId, guildData) {
  if (guildData === null) {
    delete guilds[guildId];
    GuildModel.deleteOne({ guildId })
      .catch(err => console.error('❌ MongoDB deleteGuild error:', err.message));
  } else {
    guilds[guildId] = guildData;
    GuildModel.findOneAndUpdate(
      { guildId },
      { $set: { data: guildData } },
      { upsert: true, returnDocument: 'after' }
    ).catch(err => console.error('❌ MongoDB saveGuild error:', err.message));
  }
  return true;
}

function getAllGuilds() {
  return guilds;
}

// ================== COMMENTS ==================

function getComments() {
  return comments;
}

function saveComment(comment) {
  comments.push(comment);
  if (comments.length > 50) comments.shift();

  CommentModel.create({ data: comment })
    .then(async () => {
      const count = await CommentModel.countDocuments();
      if (count > 50) {
        const oldest = await CommentModel.find()
          .sort({ createdAt: 1 }).limit(count - 50).select('_id');
        if (oldest.length > 0) {
          await CommentModel.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
        }
      }
    })
    .catch(err => console.error('❌ MongoDB saveComment error:', err.message));

  return true;
}

// ================== WORLD BOSS ==================

function getWorldBoss() {
  return worldBossState;
}

function saveWorldBoss(state) {
  worldBossState = state;

  WorldBossModel.findByIdAndUpdate(
    'singleton',
    { $set: { data: state } },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => console.error('❌ MongoDB saveWorldBoss error:', err.message));

  return true;
}

function getPlayerFromCacheOnly(userId) {
  return playerCache.get(userId) || null;
}

async function loadPlayersToCache(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  const missingIds = [...new Set(userIds)].filter(id => id && !playerCache.has(id));
  if (missingIds.length === 0) return;
  
  try {
    const docs = await PlayerModel.find({ userId: { $in: missingIds } }).lean();
    for (const doc of docs) {
      delete doc.__v;
      playerCache.set(doc.userId, doc);
    }
  } catch (err) {
    console.error('❌ Error loading players to cache:', err.message);
  }
}

module.exports = {
  initDB,
  getPlayer,
  getPlayerFromCacheOnly,
  loadPlayersToCache,
  playerCache,
  savePlayer,
  getAllPlayersList,
  getGuild,
  saveGuild,
  getAllGuilds,
  getComments,
  saveComment,
  getWorldBoss,
  saveWorldBoss
};
