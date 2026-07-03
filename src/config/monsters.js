// ================== RPG MONSTERS & DUNGEONS CONFIGURATION ==================
// OVERHAUL: Monster jauh lebih kuat, EXP/Gold lebih sedikit

const monsters = [
  // === Tier 1: Level 1 - 5 (EARLY GAME SUDAH MENANTANG) ===
  { name: "Green Slime", level: 1, hp: 220, attack: 42, defense: 10, exp: 12, gold: 5, drops: ["potion", "leather_scrap"] },
  { name: "Cave Bat", level: 2, hp: 320, attack: 58, defense: 14, exp: 16, gold: 7, drops: ["potion"] },
  { name: "Goblin Scout", level: 3, hp: 450, attack: 82, defense: 18, exp: 22, gold: 10, drops: ["iron_ore", "potion"] },
  { name: "Forest Wolf", level: 4, hp: 620, attack: 110, defense: 24, exp: 28, gold: 14, drops: ["leather_scrap"] },
  { name: "Zombie", level: 5, hp: 800, attack: 135, defense: 30, exp: 38, gold: 18, drops: ["potion", "iron_ore"] },

  // === Tier 2: Level 6 - 10 ===
  { name: "Goblin Warrior", level: 6, hp: 1000, attack: 165, defense: 38, exp: 50, gold: 25, drops: ["iron_ore", "super_potion"] },
  { name: "Giant Spider", level: 7, hp: 1250, attack: 200, defense: 45, exp: 65, gold: 32, drops: ["leather_scrap", "super_potion"] },
  { name: "Skeleton Archer", level: 8, hp: 1500, attack: 240, defense: 52, exp: 80, gold: 40, drops: ["iron_ore"] },
  { name: "Stone Golem", level: 9, hp: 1900, attack: 220, defense: 75, exp: 100, gold: 50, drops: ["iron_ore", "magic_shard"] },
  { name: "Orc Scout", level: 10, hp: 2200, attack: 280, defense: 60, exp: 130, gold: 60, drops: ["leather_scrap", "super_potion"] },

  // === Tier 3: Level 11 - 20 ===
  { name: "Orc Warrior", level: 12, hp: 2800, attack: 380, defense: 80, exp: 180, gold: 80, drops: ["iron_ore", "leather_scrap"] },
  { name: "Bandit Thief", level: 14, hp: 3500, attack: 470, defense: 90, exp: 240, gold: 100, drops: ["leather_scrap", "super_potion"] },
  { name: "Lizardman Raider", level: 16, hp: 4200, attack: 560, defense: 110, exp: 320, gold: 130, drops: ["iron_ore", "magic_shard"] },
  { name: "Minotaur", level: 18, hp: 5200, attack: 700, defense: 135, exp: 420, gold: 170, drops: ["leather_scrap", "dragon_scale"] },
  { name: "Wyvern", level: 20, hp: 6500, attack: 880, defense: 160, exp: 540, gold: 220, drops: ["dragon_scale", "magic_shard"] },

  // === Tier 4: Level 21 - 30 ===
  { name: "Dark Knight", level: 22, hp: 8200, attack: 1050, defense: 200, exp: 700, gold: 280, drops: ["iron_ore", "magic_shard"] },
  { name: "Ice Golem", level: 25, hp: 10500, attack: 1200, defense: 260, exp: 950, gold: 360, drops: ["magic_shard"] },
  { name: "Succubus", level: 28, hp: 13000, attack: 1450, defense: 240, exp: 1250, gold: 450, drops: ["magic_shard", "hyper_potion"] },
  { name: "Fire Drake", level: 30, hp: 16500, attack: 1800, defense: 320, exp: 1700, gold: 600, drops: ["dragon_scale", "hyper_potion"] },

  // === Tier 5: Level 31 - 50 (ENDGAME - SANGAT SULIT) ===
  { name: "Behemoth", level: 35, hp: 24000, attack: 2400, defense: 420, exp: 2800, gold: 900, drops: ["dragon_scale", "magic_shard"] },
  { name: "Chimera", level: 40, hp: 35000, attack: 3200, defense: 550, exp: 4000, gold: 1200, drops: ["dragon_scale", "magic_shard"] },
  { name: "Lich Lord", level: 45, hp: 48000, attack: 4200, defense: 680, exp: 5500, gold: 1800, drops: ["magic_shard", "elixir"] },
  { name: "Shadow Dragon", level: 50, hp: 70000, attack: 5500, defense: 850, exp: 8000, gold: 2500, drops: ["dragon_scale", "elixir"] },

  // === New Expansion Monsters ===
  { name: "Sand Scorpion 🦂", level: 9, hp: 1800, attack: 230, defense: 50, exp: 90, gold: 45, drops: ["potion", "stone_basic"] },
  { name: "Desert Raider 🌵", level: 11, hp: 2600, attack: 340, defense: 55, exp: 150, gold: 70, drops: ["potion", "leather_scrap"] },
  { name: "Deepsea Siren 🧜‍♀️", level: 20, hp: 7000, attack: 860, defense: 130, exp: 560, gold: 240, drops: ["magic_shard"] },
  { name: "Sunken Guardian 🔱", level: 24, hp: 10000, attack: 1100, defense: 220, exp: 860, gold: 320, drops: ["iron_ore", "magic_shard"] },
  { name: "Frost Wolf 🐺❄️", level: 16, hp: 4000, attack: 530, defense: 80, exp: 300, gold: 120, drops: ["leather_scrap"] },
  { name: "Snow Yeti 👹❄️", level: 22, hp: 9000, attack: 1120, defense: 200, exp: 740, gold: 290, drops: ["magic_shard", "super_potion"] },
  { name: "Abyss Lurker 👁️", level: 36, hp: 27000, attack: 2600, defense: 400, exp: 3000, gold: 1000, drops: ["magic_shard", "hyper_potion"] },
  { name: "Void Specter 👻", level: 42, hp: 40000, attack: 3600, defense: 520, exp: 4500, gold: 1400, drops: ["dragon_scale", "elixir"] },
  { name: "Seraphic Archon 👼", level: 46, hp: 55000, attack: 4600, defense: 700, exp: 6000, gold: 1900, drops: ["dragon_scale", "elixir"] },
  { name: "Sky Valkyrie 🛡️✈️", level: 48, hp: 65000, attack: 5200, defense: 780, exp: 7200, gold: 2300, drops: ["dragon_scale", "elixir"] }
];

// === Dungeons Config (HARDER - lebih banyak wave, boss lebih kuat) ===
const dungeons = {
  "goblin_cave": {
    name: "Goblin Cave 🕳",
    minLevel: 1,
    waves: 3,
    mpCost: 12,
    monsters: [
      { name: "Goblin Scout", hp: 150, attack: 30, defense: 10 },
      { name: "Goblin Warrior", hp: 280, attack: 55, defense: 22 }
    ],
    boss: {
      name: "Goblin King 👑",
      level: 5,
      hp: 800,
      attack: 75,
      defense: 28,
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
      { name: "Orc Scout", hp: 700, attack: 110, defense: 42 },
      { name: "Orc Warrior", hp: 900, attack: 145, defense: 55 }
    ],
    boss: {
      name: "Orc Warlord ⚔",
      level: 15,
      hp: 3500,
      attack: 250,
      defense: 95,
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
      { name: "Lizardman Raider", hp: 1400, attack: 240, defense: 85 },
      { name: "Wyvern", hp: 2200, attack: 380, defense: 130 }
    ],
    boss: {
      name: "Ancient Red Dragon 🐲",
      level: 25,
      hp: 12000,
      attack: 620,
      defense: 260,
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
      { name: "Dark Knight", hp: 3000, attack: 450, defense: 180 },
      { name: "Behemoth", hp: 8000, attack: 950, defense: 380 }
    ],
    boss: {
      name: "Chaos Emperor Bahamut 🌌",
      level: 45,
      hp: 45000,
      attack: 1800,
      defense: 600,
      expReward: 8000,
      goldReward: 8000,
      drops: { "egg_legends": 0.15, "egg_mythic": 0.03, "dragon_scale": 4, "magic_shard": 4, "elixir": 2 }
    }
  }
};

// === World Boss Config (MUCH HARDER) ===
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
