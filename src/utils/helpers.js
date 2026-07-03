// ================== GENERAL HELPERS & RPG UTILITIES ==================

const classes = require('../rpg/classes');
const { monsters } = require('../config/monsters');

// 1. Cek & Jalankan Level Up
function checkLevelUp(player) {
  if (!player.job) return false; // Jangan level up sebelum daftar job
  
  let leveledUp = false;
  const jobConfig = classes.jobs[player.job];

  // Rumus EXP Naik Level baru berbasis kurva non-linear
  let needed = classes.getExpNeeded(player.level);
  while (player.exp >= needed) {
    player.exp -= needed;
    player.level++;
    
    // Berikan 3 Stat Points untuk didistribusikan secara manual (dikurangi dari 5)
    player.statPoints += 3;
    
    leveledUp = true;
    needed = classes.getExpNeeded(player.level);
  }

  if (leveledUp) {
    // Hitung ulang Max HP & MP setelah level naik
    // Muat stats terbaru
    const currentVit = jobConfig.baseStats.vit + (player.level - 1) * jobConfig.growth.vit + (player.stats.vit || 0);
    const currentInt = jobConfig.baseStats.int + (player.level - 1) * jobConfig.growth.int + (player.stats.int || 0);
    
    player.hp = classes.getMaxHp(player.level, currentVit);
    player.mp = classes.getMaxMp(player.level, currentInt);
  }

  return leveledUp;
}

// 2. Validasi Nama Player (3-20 karakter, huruf, angka, underscore)
function isValidName(name) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(name);
}

// 3. Format Cooldown Time ke Text
function formatCooldown(ms) {
  if (ms <= 0) return "0s";
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} detik`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return `${minutes} menit ${remSec} detik`;
}

const ZONE_MONSTERS = {
  green_forest: ["Green Slime", "Cave Bat", "Goblin Scout", "Forest Wolf", "Zombie", "Goblin Warrior", "Giant Spider", "Skeleton Archer", "Stone Golem", "Orc Scout"],
  abandoned_mine: ["Orc Scout", "Orc Warrior", "Bandit Thief", "Lizardman Raider", "Minotaur", "Wyvern", "Dark Knight"],
  dragon_valley: ["Ice Golem", "Succubus", "Fire Drake", "Behemoth", "Chimera", "Lich Lord", "Shadow Dragon"],
  lost_wasteland: ["Goblin Scout", "Forest Wolf", "Sand Scorpion 🦂", "Desert Raider 🌵", "Orc Scout"],
  underwater_ruins: ["Lizardman Raider", "Deepsea Siren 🧜‍♀️", "Sunken Guardian 🔱", "Wyvern"],
  frozen_tundra: ["Lizardman Raider", "Frost Wolf 🐺❄️", "Snow Yeti 👹❄️", "Ice Golem"],
  abyss_depths: ["Behemoth", "Abyss Lurker 👁️", "Void Specter 👻", "Lich Lord"],
  sky_sanctuary: ["Shadow Dragon", "Seraphic Archon 👼", "Sky Valkyrie 🛡️✈️"]
};

// 4. Pilih Monster Secara Acak Berdasarkan Level Player dan Zona Map
function getRandomMonster(playerLevel, zone = 'green_forest') {
  if (!monsters || monsters.length === 0) {
    return { name: "Tutorial Slime", level: 1, hp: 30, attack: 5, defense: 1, exp: 5, gold: 5, drops: [] };
  }

  const allowedNames = ZONE_MONSTERS[zone] || ZONE_MONSTERS.green_forest;
  let zoneMonsters = monsters.filter(m => allowedNames.includes(m.name));
  
  if (zoneMonsters.length === 0) {
    zoneMonsters = monsters;
  }

  // Pilih monster dengan range level di dalam zona tersebut
  const filtered = zoneMonsters.filter(m => m.level <= playerLevel + 3 && m.level >= Math.max(1, playerLevel - 3));
  
  let chosen;
  if (filtered.length > 0) {
    chosen = filtered[Math.floor(Math.random() * filtered.length)];
  } else {
    const sorted = [...zoneMonsters].sort((a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel));
    chosen = sorted[0];
  }

  return { ...chosen };
}

// ================== PET HELPERS ==================

const petTierConfig = {
  D:   { bonusAttack: 2,  bonusDefense: 1 },
  C:   { bonusAttack: 5,  bonusDefense: 3 },
  B:   { bonusAttack: 12, bonusDefense: 6 },
  A:   { bonusAttack: 25, bonusDefense: 12 },
  S:   { bonusAttack: 50, bonusDefense: 25 },
  SS:  { bonusAttack: 80, bonusDefense: 40 },
  SSS: { bonusAttack: 120, bonusDefense: 60 }
};

const petSpeciesByTier = {
  D:   ["Slime", "Chocobo Chick", "Cactuar Bud", "Baby Piggy 🐷"],
  C:   ["Wild Wolf", "Moogle Scout", "Baby Behemoth", "Fox Spirit 🦊"],
  B:   ["Stone Golem", "Fire Lizard", "Black Widow"],
  A:   ["Thunder Griffin", "Phoenix Hatchling", "Shadow Tiger"],
  S:   ["Ancient Dragonling", "Kirin", "Elder Coeurl", "Ninetails Fox 🦊🔥"],
  SS:  ["Abyss Wyrm", "Bahamut Hatchling", "Omega Weapon Prototype", "Frost Fenrir 🐺❄️"],
  SSS: ["Void Archdemon", "Shinryu Dragon", "Origin Seraph Angel", "Celestial Pegasus 🦄✨"]
};

const petEggPools = {
  common: [
    { tier: "D", weight: 65 },
    { tier: "C", weight: 30 },
    { tier: "B", weight: 5 }
  ],
  uncommon: [
    { tier: "C", weight: 60 },
    { tier: "B", weight: 35 },
    { tier: "A", weight: 5 }
  ],
  rare: [
    { tier: "B", weight: 60 },
    { tier: "A", weight: 30 },
    { tier: "S", weight: 10 }
  ],
  legends: [
    { tier: "A", weight: 60 },
    { tier: "S", weight: 30 },
    { tier: "SS", weight: 10 }
  ],
  mythic: [
    { tier: "S", weight: 50 },
    { tier: "SS", weight: 35 },
    { tier: "SSS", weight: 15 }
  ]
};

function rollTierFromPool(rarity) {
  const pool = petEggPools[rarity] || petEggPools.common;
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const entry of pool) {
    if (r < entry.weight) return entry.tier;
    r -= entry.weight;
  }
  return pool[0].tier;
}

function createPetFromTier(tier) {
  const cfg = petTierConfig[tier] || petTierConfig.D;
  const speciesList = petSpeciesByTier[tier] || petSpeciesByTier.D;
  const baseName = speciesList[Math.floor(Math.random() * speciesList.length)];

  const prefixes = ["", "Shadow", "Holy", "Flame", "Crystal", "Void", "Ancient", "Abyssal"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const fullName = prefix ? `${prefix} ${baseName}` : baseName;

  return {
    id: "pet_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    name: fullName,
    species: baseName,
    tier,
    bonusAttack: cfg.bonusAttack,
    bonusDefense: cfg.bonusDefense,
    createdAt: Date.now()
  };
}

function getPetAutoSellValue(pet) {
  if (!pet || !pet.tier) return 0;
  switch (pet.tier) {
    case "SSS": return 100000;
    case "SS":  return 50000;
    case "S":   return 20000;
    case "A":   return 8000;
    case "B":   return 3000;
    case "C":   return 1000;
    case "D":   return 400;
    default:    return 200;
  }
}

module.exports = {
  checkLevelUp,
  isValidName,
  formatCooldown,
  getRandomMonster,
  rollTierFromPool,
  createPetFromTier,
  getPetAutoSellValue
};
