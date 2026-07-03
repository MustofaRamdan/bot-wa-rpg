// ================== RPG MONSTERS & DUNGEONS CONFIGURATION ==================
// BALANCED VERSION: Smooth early-game progression, scaling stats appropriately for all tiers.

const monsters = [
  // === Tier 1: Level 1 - 5 (EARLY GAME: Fair and progressive) ===
  { name: "Green Slime", level: 1, hp: 50, attack: 10, defense: 2, exp: 12, gold: 5, drops: ["potion", "leather_scrap"] },
  { name: "Cave Bat", level: 2, hp: 80, attack: 15, defense: 3, exp: 16, gold: 7, drops: ["potion"] },
  { name: "Goblin Scout", level: 3, hp: 120, attack: 22, defense: 5, exp: 22, gold: 10, drops: ["iron_ore", "potion"] },
  { name: "Forest Wolf", level: 4, hp: 180, attack: 30, defense: 7, exp: 28, gold: 14, drops: ["leather_scrap"] },
  { name: "Zombie", level: 5, hp: 250, attack: 40, defense: 10, exp: 38, gold: 18, drops: ["potion", "iron_ore"] },

  // === Tier 2: Level 6 - 10 ===
  { name: "Goblin Warrior", level: 6, hp: 320, attack: 55, defense: 14, exp: 50, gold: 25, drops: ["iron_ore", "super_potion"] },
  { name: "Giant Spider", level: 7, hp: 400, attack: 72, defense: 18, exp: 65, gold: 32, drops: ["leather_scrap", "super_potion"] },
  { name: "Skeleton Archer", level: 8, hp: 500, attack: 92, defense: 22, exp: 80, gold: 40, drops: ["iron_ore"] },
  { name: "Stone Golem", level: 9, hp: 650, attack: 85, defense: 35, exp: 100, gold: 50, drops: ["iron_ore", "magic_shard"] },
  { name: "Orc Scout", level: 10, hp: 800, attack: 120, defense: 28, exp: 130, gold: 60, drops: ["leather_scrap", "super_potion"] },

  // === Tier 3: Level 11 - 20 ===
  { name: "Orc Warrior", level: 12, hp: 1100, attack: 170, defense: 42, exp: 180, gold: 80, drops: ["iron_ore", "leather_scrap"] },
  { name: "Bandit Thief", level: 14, hp: 1500, attack: 220, defense: 55, exp: 240, gold: 100, drops: ["leather_scrap", "super_potion"] },
  { name: "Lizardman Raider", level: 16, hp: 2000, attack: 280, defense: 70, exp: 320, gold: 130, drops: ["iron_ore", "magic_shard"] },
  { name: "Minotaur", level: 18, hp: 2600, attack: 360, defense: 90, exp: 420, gold: 170, drops: ["leather_scrap", "dragon_scale"] },
  { name: "Wyvern", level: 20, hp: 3300, attack: 460, defense: 115, exp: 540, gold: 220, drops: ["dragon_scale", "magic_shard"] },

  // === Tier 4: Level 21 - 30 ===
  { name: "Dark Knight", level: 22, hp: 4200, attack: 580, defense: 145, exp: 700, gold: 280, drops: ["iron_ore", "magic_shard"] },
  { name: "Ice Golem", level: 25, hp: 5600, attack: 700, defense: 190, exp: 950, gold: 360, drops: ["magic_shard"] },
  { name: "Succubus", level: 28, hp: 7500, attack: 920, defense: 220, exp: 1250, gold: 450, drops: ["magic_shard", "hyper_potion"] },
  { name: "Fire Drake", level: 30, hp: 10000, attack: 1200, defense: 280, exp: 1700, gold: 600, drops: ["dragon_scale", "hyper_potion"] },

  // === Tier 5: Level 31 - 50 (ENDGAME) ===
  { name: "Behemoth", level: 35, hp: 16000, attack: 1800, defense: 380, exp: 2800, gold: 900, drops: ["dragon_scale", "magic_shard"] },
  { name: "Chimera", level: 40, hp: 24000, attack: 2500, defense: 500, exp: 4000, gold: 1200, drops: ["dragon_scale", "magic_shard"] },
  { name: "Lich Lord", level: 45, hp: 35000, attack: 3400, defense: 650, exp: 5500, gold: 1800, drops: ["magic_shard", "elixir"] },
  { name: "Shadow Dragon", level: 50, hp: 50000, attack: 4500, defense: 800, exp: 8000, gold: 2500, drops: ["dragon_scale", "elixir"] },

  // === Expansion & Variation Monsters ===
  { name: "Sand Scorpion 🦂", level: 9, hp: 620, attack: 95, defense: 24, exp: 90, gold: 45, drops: ["potion", "stone_basic"] },
  { name: "Desert Raider 🌵", level: 11, hp: 950, attack: 145, defense: 34, exp: 150, gold: 70, drops: ["potion", "leather_scrap"] },
  { name: "Deepsea Siren 🧜‍♀️", level: 20, hp: 3200, attack: 450, defense: 110, exp: 560, gold: 240, drops: ["magic_shard"] },
  { name: "Sunken Guardian 🔱", level: 24, hp: 5000, attack: 680, defense: 170, exp: 860, gold: 320, drops: ["iron_ore", "magic_shard"] },
  { name: "Frost Wolf 🐺❄️", level: 16, hp: 1900, attack: 270, defense: 65, exp: 300, gold: 120, drops: ["leather_scrap"] },
  { name: "Snow Yeti 👹❄️", level: 22, hp: 4100, attack: 560, defense: 135, exp: 740, gold: 290, drops: ["magic_shard", "super_potion"] },
  { name: "Abyss Lurker 👁️", level: 36, hp: 18000, attack: 1900, defense: 400, exp: 3000, gold: 1000, drops: ["magic_shard", "hyper_potion"] },
  { name: "Void Specter 👻", level: 42, hp: 28000, attack: 2800, defense: 550, exp: 4500, gold: 1400, drops: ["dragon_scale", "elixir"] },
  { name: "Seraphic Archon 👼", level: 46, hp: 38000, attack: 3600, defense: 700, exp: 6000, gold: 1900, drops: ["dragon_scale", "elixir"] },
  { name: "Sky Valkyrie 🛡️✈️", level: 48, hp: 46000, attack: 4200, defense: 780, exp: 7200, gold: 2300, drops: ["dragon_scale", "elixir"] }
];

// === Dungeons Config (Balanced to match new levels) ===
const dungeons = {
  "goblin_cave": {
    name: "Goblin Cave 🕳",
    minLevel: 1,
    waves: 3,
    mpCost: 12,
    monsters: [
      { name: "Goblin Scout", hp: 120, attack: 22, defense: 5 },
      { name: "Goblin Warrior", hp: 260, attack: 40, defense: 12 }
    ],
    boss: {
      name: "Goblin King 👑",
      level: 5,
      hp: 450,
      attack: 55,
      defense: 18,
      expReward: 120,
      goldReward: 150,
      drops: { "egg_common": 0.35, "iron_ore": 1.0, "potion": 1.0 }
    }
  },
  "orc_fortress": {
    name: "Orc Fortress 🏰",
    minLevel: 8,
    waves: 4,
    mpCost: 25,
    monsters: [
      { name: "Orc Scout", hp: 550, attack: 90, defense: 26 },
      { name: "Orc Warrior", hp: 800, attack: 130, defense: 38 }
    ],
    boss: {
      name: "Orc Warlord ⚔",
      level: 15,
      hp: 2200,
      attack: 280,
      defense: 75,
      expReward: 450,
      goldReward: 400,
      drops: { "egg_uncommon": 0.25, "iron_ore": 2, "leather_scrap": 2 }
    }
  },
  "dragon_nest": {
    name: "Dragon Nest 🌋",
    minLevel: 18,
    waves: 5,
    mpCost: 40,
    monsters: [
      { name: "Lizardman Raider", hp: 1600, attack: 240, defense: 75 },
      { name: "Wyvern", hp: 2500, attack: 380, defense: 110 }
    ],
    boss: {
      name: "Ancient Red Dragon 🐲",
      level: 25,
      hp: 8000,
      attack: 720,
      defense: 220,
      expReward: 2000,
      goldReward: 1500,
      drops: { "egg_rare": 0.2, "dragon_scale": 2, "magic_shard": 2, "elixir": 0.3 }
    }
  },
  "void_rift": {
    name: "Void Rift 🌌",
    minLevel: 30,
    waves: 6,
    mpCost: 60,
    monsters: [
      { name: "Dark Knight", hp: 3800, attack: 520, defense: 160 },
      { name: "Behemoth", hp: 7000, attack: 950, defense: 320 }
    ],
    boss: {
      name: "Chaos Emperor Bahamut 🌌",
      level: 45,
      hp: 28000,
      attack: 1900,
      defense: 550,
      expReward: 8000,
      goldReward: 8000,
      drops: { "egg_legends": 0.15, "egg_mythic": 0.03, "dragon_scale": 4, "magic_shard": 4, "elixir": 2 }
    }
  }
};

// === World Boss Config ===
const worldBossTemplates = [
  {
    name: "Ancient Dragon Fafnir 🐉",
    baseHp: 500000,
    hpPerLevel: 5000,
    baseAtk: 600,
    atkPerLevel: 18,
    baseDef: 250,
    defPerLevel: 8
  },
  {
    name: "Abyss Kraken 🦑",
    baseHp: 1000000,
    hpPerLevel: 8000,
    baseAtk: 900,
    atkPerLevel: 25,
    baseDef: 350,
    defPerLevel: 10
  },
  {
    name: "Celestial Titan Chronos 🗿",
    baseHp: 2000000,
    hpPerLevel: 12000,
    baseAtk: 1400,
    atkPerLevel: 40,
    baseDef: 550,
    defPerLevel: 14
  },
  {
    name: "Bahamut Prime 🔥",
    baseHp: 4000000,
    hpPerLevel: 25000,
    baseAtk: 2200,
    atkPerLevel: 65,
    baseDef: 800,
    defPerLevel: 20
  }
];

module.exports = {
  monsters,
  dungeons,
  worldBossTemplates
};
