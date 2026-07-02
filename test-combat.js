// ================== OFFLINE COMBAT & RPG SIMULATOR ==================

const combat = require('./src/rpg/combat');
const classes = require('./src/rpg/classes');
const helpers = require('./src/utils/helpers');
const items = require('./src/config/items');

console.log("🎮 RPG SIMULATION TEST RUN 🎮");
console.log("======================================\n");

// 1. Inisialisasi Player Palsu (Warrior Level 1)
let player = {
  userId: "6289999999999",
  name: "Cloud Strife",
  job: "warrior",
  level: 1,
  exp: 0,
  gold: 1000,
  bank: 0,
  statPoints: 0,
  stats: { str: 0, int: 0, vit: 0, agi: 0, dex: 0 },
  hp: 100,
  mp: 30,
  inventory: { potion: 5 },
  equipment: { weapon: null, armor: null },
  pets: [],
  activePetId: null,
  battleStats: { totalHunts: 0, totalWins: 0, totalLosses: 0, monstersKilled: 0 }
};

// Hitung stats awal
let stats = combat.getDerivedStats(player);
// Set HP & MP ke maksimal
player.hp = stats.maxHp;
player.mp = stats.maxMp;

console.log("👤 DATA PLAYER AWAL (Warrior Lv.1):");
console.log(`- Nama: ${player.name}`);
console.log(`- HP: ${player.hp}/${stats.maxHp} | MP: ${player.mp}/${stats.maxMp}`);
console.log(`- STR: ${stats.str} | INT: ${stats.int} | VIT: ${stats.vit} | AGI: ${stats.agi} | DEX: ${stats.dex}`);
console.log(`- ATK Fisik: ${stats.patk} | DEF Fisik: ${stats.pdef}`);
console.log(`- Crit Rate: ${stats.critRate}% | Evasion: ${stats.evasionRate}% | Accuracy: ${stats.accuracy}%\n`);

// 2. Simulasi Pertarungan 1: Melawan Green Slime (Lv.1)
console.log("⚔️ COMBAT SIMULATION 1: Lawan Green Slime (Lv.1)");
let slime = { name: "Green Slime", level: 1, hp: 35, attack: 6, defense: 2 };
let result1 = combat.simulateCombat(player, slime);
console.log(result1.log);
console.log(`Hasil: ${result1.success ? "MENANG! 🎉" : "KALAH! 💀"}`);
console.log(`Sisa HP Player: ${result1.finalPlayerHp}/${result1.maxHp} | Sisa MP: ${result1.finalPlayerMp}/${result1.maxMp}\n`);

// Update HP/MP player
player.hp = result1.finalPlayerHp;
player.mp = result1.finalPlayerMp;

// 3. Simulasi Equip & Upgrade Stats
console.log("🛡️ MENGGUNAKAN EQUIPMENT & ALOKASI STATUS:");
player.stats.str += 10; // Tambah 10 STR manual
console.log(`- Menambahkan +10 STR secara manual`);

// Equip Steel Sword (+18 STR)
player.equipment.weapon = { key: 'steel_sword', level: 0 };
console.log(`- Menggunakan Steel Sword +0 (+18 STR)`);

stats = combat.getDerivedStats(player);
player.hp = stats.maxHp;
player.mp = stats.maxMp;
console.log(`- Stats Baru (STR total: ${stats.str} | ATK total: ${stats.patk})\n`);

// Upgrade Steel Sword menjadi +5 di Blacksmith
player.equipment.weapon.level = 5;
console.log(`🛠️ Upgrade Steel Sword menjadi Steel Sword +5 (+75% bonus stat!)`);
stats = combat.getDerivedStats(player);
console.log(`- Stats Setelah Upgrade (STR total: ${stats.str} | ATK total: ${stats.patk})\n`);

// 4. Simulasi Pertarungan 2: Melawan Orc Warrior (Lv.12)
console.log("⚔️ COMBAT SIMULATION 2: Lawan Orc Warrior (Lv.12)");
let orc = { name: "Orc Warrior", level: 12, hp: 350, attack: 68, defense: 22 };
let result2 = combat.simulateCombat(player, orc);
console.log(result2.log);
console.log(`Hasil: ${result2.success ? "MENANG! 🎉" : "KALAH! 💀"}`);
console.log(`Sisa HP Player: ${result2.finalPlayerHp}/${result2.maxHp} | Sisa MP: ${result2.finalPlayerMp}/${result2.maxMp}\n`);

player.hp = result2.finalPlayerHp;
player.mp = result2.finalPlayerMp;

// 5. Uji Coba EXP Boost & Level Up
console.log("📈 MENGGUNAKAN EXP BOOST & LEVEL UP:");
console.log(`- Level Sekarang: ${player.level} (EXP: ${player.exp}/${player.level * 150})`);
console.log(`- Menggunakan EXP Boost (+500 EXP)...`);
player.exp += 500;
let leveledUp = helpers.checkLevelUp(player);
stats = combat.getDerivedStats(player);
console.log(`- Level Baru: ${player.level} (EXP: ${player.exp}/${player.level * 150})`);
console.log(`- Stat Points Baru: ${player.statPoints}`);
console.log(`- HP Maksimal Baru: ${stats.maxHp} | MP Maksimal Baru: ${stats.maxMp}\n`);

console.log("✅ SELURUH SIMULASI BERHASIL DISAJIKAN DENGAN SEMPURNA!");
