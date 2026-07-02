// ================== SYNCHRONOUS PLAYER FETCH SUBPROCESS ==================
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rpg-bot";
const userId = process.argv[2];

if (!userId) {
  console.log(JSON.stringify(null));
  process.exit(0);
}

// Skema Player minimal untuk pencarian
const PlayerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  gold: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  job: String,
  zone: { type: String, default: 'green_forest' },
  hp: { type: Number, default: 100 },
  mp: { type: Number, default: 30 },
  stats: {
    str: { type: Number, default: 0 },
    int: { type: Number, default: 0 },
    vit: { type: Number, default: 0 },
    agi: { type: Number, default: 0 },
    dex: { type: Number, default: 0 }
  },
  statPoints: { type: Number, default: 0 },
  equipment: {
    weapon: { type: mongoose.Schema.Types.Mixed, default: null },
    armor: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  inventory: { type: Map, of: Number, default: {} },
  pets: { type: Array, default: [] },
  activePetId: { type: String, default: null },
  unlockedPassives: { type: Array, default: [] },
  battleStats: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  achievementStats: {
    str: { type: Number, default: 0 },
    int: { type: Number, default: 0 },
    vit: { type: Number, default: 0 },
    agi: { type: Number, default: 0 },
    dex: { type: Number, default: 0 }
  },
  claimedAchievements: { type: Array, default: [] }
});

const PlayerModel = mongoose.models.Player || mongoose.model('Player', PlayerSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    const player = await PlayerModel.findOne({ userId }).lean();
    if (player) {
      delete player.__v;
      delete player._id;
      // Konversi Map ke Objek biasa agar JSON.stringify tidak menghasilkan objek kosong
      if (player.inventory instanceof Map) {
        player.inventory = Object.fromEntries(player.inventory);
      }
      if (player.battleStats instanceof Map) {
        player.battleStats = Object.fromEntries(player.battleStats);
      }
      console.log(JSON.stringify(player));
    } else {
      console.log(JSON.stringify(null));
    }
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(null));
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
run();
