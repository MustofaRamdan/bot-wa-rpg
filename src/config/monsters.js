// ================== RPG MONSTERS & DUNGEONS CONFIGURATION ==================

const monsters = [
  // === Tier 1: Level 1 - 5 ===
  { name: "Green Slime", level: 1, hp: 100, attack: 24, defense: 4, exp: 12, gold: 8, drops: ["potion", "leather_scrap"] },
  { name: "Cave Bat", level: 2, hp: 140, attack: 32, defense: 5, exp: 18, gold: 12, drops: ["potion"] },
  { name: "Goblin Scout", level: 3, hp: 190, attack: 45, defense: 6, exp: 25, gold: 18, drops: ["iron_ore", "potion"] },
  { name: "Forest Wolf", level: 4, hp: 250, attack: 58, defense: 8, exp: 35, gold: 25, drops: ["leather_scrap"] },
  { name: "Zombie", level: 5, hp: 320, attack: 70, defense: 10, exp: 50, gold: 35, drops: ["potion", "iron_ore"] },

  // === Tier 2: Level 6 - 10 ===
  { name: "Goblin Warrior", level: 6, hp: 400, attack: 85, defense: 15, exp: 70, gold: 50, drops: ["iron_ore", "super_potion"] },
  { name: "Giant Spider", level: 7, hp: 480, attack: 105, defense: 18, exp: 90, gold: 65, drops: ["leather_scrap", "super_potion"] },
  { name: "Skeleton Archer", level: 8, hp: 560, attack: 125, defense: 22, exp: 110, gold: 80, drops: ["iron_ore"] },
  { name: "Stone Golem", level: 9, hp: 720, attack: 115, defense: 35, exp: 140, gold: 100, drops: ["iron_ore", "magic_shard"] },
  { name: "Orc Scout", level: 10, hp: 800, attack: 145, defense: 26, exp: 180, gold: 120, drops: ["leather_scrap", "super_potion"] },

  // === Tier 3: Level 11 - 20 ===
  { name: "Orc Warrior", level: 12, hp: 980, attack: 195, defense: 32, exp: 240, gold: 160, drops: ["iron_ore", "leather_scrap"] },
  { name: "Bandit Thief", level: 14, hp: 1200, attack: 240, defense: 36, exp: 320, gold: 220, drops: ["leather_scrap", "super_potion"] },
  { name: "Lizardman Raider", level: 16, hp: 1450, attack: 290, defense: 45, exp: 420, gold: 280, drops: ["iron_ore", "magic_shard"] },
  { name: "Minotaur", level: 18, hp: 1800, attack: 360, defense: 55, exp: 550, gold: 350, drops: ["leather_scrap", "dragon_scale"] },
  { name: "Wyvern", level: 20, hp: 2200, attack: 450, defense: 65, exp: 700, gold: 450, drops: ["dragon_scale", "magic_shard"] },

  // === Tier 4: Level 21 - 30 ===
  { name: "Dark Knight", level: 22, hp: 2800, attack: 540, defense: 85, exp: 900, gold: 550, drops: ["iron_ore", "magic_shard"] },
  { name: "Ice Golem", level: 25, hp: 3500, attack: 610, defense: 110, exp: 1200, gold: 700, drops: ["magic_shard"] },
  { name: "Succubus", level: 28, hp: 4200, attack: 740, defense: 100, exp: 1600, gold: 900, drops: ["magic_shard", "hyper_potion"] },
  { name: "Fire Drake", level: 30, hp: 5500, attack: 920, defense: 130, exp: 2200, gold: 1200, drops: ["dragon_scale", "hyper_potion"] },

  // === Tier 5: Level 31 - 50 ===
  { name: "Behemoth", level: 35, hp: 8000, attack: 1200, defense: 180, exp: 3500, gold: 1800, drops: ["dragon_scale", "magic_shard"] },
  { name: "Chimera", level: 40, hp: 11000, attack: 1500, defense: 220, exp: 5000, gold: 2500, drops: ["dragon_scale", "magic_shard"] },
  { name: "Lich Lord", level: 45, hp: 14500, attack: 1850, defense: 250, exp: 7000, gold: 3500, drops: ["magic_shard", "elixir"] },
  { name: "Shadow Dragon", level: 50, hp: 21000, attack: 2300, defense: 320, exp: 10000, gold: 5000, drops: ["dragon_scale", "elixir"] },

  // === New Expansion Monsters ===
  { name: "Sand Scorpion 🦂", level: 9, hp: 680, attack: 118, defense: 20, exp: 120, gold: 90, drops: ["potion", "stone_basic"] },
  { name: "Desert Raider 🌵", level: 11, hp: 920, attack: 168, defense: 22, exp: 200, gold: 140, drops: ["potion", "leather_scrap"] },
  { name: "Deepsea Siren 🧜‍♀️", level: 20, hp: 2400, attack: 440, defense: 50, exp: 720, gold: 480, drops: ["magic_shard"] },
  { name: "Sunken Guardian 🔱", level: 24, hp: 3400, attack: 560, defense: 90, exp: 1100, gold: 650, drops: ["iron_ore", "magic_shard"] },
  { name: "Frost Wolf 🐺❄️", level: 16, hp: 1400, attack: 270, defense: 32, exp: 400, gold: 260, drops: ["leather_scrap"] },
  { name: "Snow Yeti 👹❄️", level: 22, hp: 3100, attack: 580, defense: 80, exp: 950, gold: 580, drops: ["magic_shard", "super_potion"] },
  { name: "Abyss Lurker 👁️", level: 36, hp: 9000, attack: 1300, defense: 170, exp: 3800, gold: 2000, drops: ["magic_shard", "hyper_potion"] },
  { name: "Void Specter 👻", level: 42, hp: 13000, attack: 1700, defense: 210, exp: 5600, gold: 2800, drops: ["dragon_scale", "elixir"] },
  { name: "Seraphic Archon 👼", level: 46, hp: 17000, attack: 2000, defense: 260, exp: 7600, gold: 3800, drops: ["dragon_scale", "elixir"] },
  { name: "Sky Valkyrie 🛡️✈️", level: 48, hp: 20000, attack: 2200, defense: 280, exp: 9200, gold: 4600, drops: ["dragon_scale", "elixir"] }
];

// === Dungeons Config ===
const dungeons = {
  "goblin_cave": {
    name: "Goblin Cave 🕳",
    minLevel: 1,
    waves: 3,
    mpCost: 10,
    monsters: [
      { name: "Goblin Scout", hp: 60, attack: 13, defense: 4 },
      { name: "Goblin Warrior", hp: 130, attack: 28, defense: 10 }
    ],
    boss: {
      name: "Goblin King 👑",
      level: 5,
      hp: 350,
      attack: 35,
      defense: 12,
      expReward: 150,
      goldReward: 300,
      drops: { "egg_common": 0.5, "iron_ore": 1.0, "potion": 1.0 }
    }
  },
  "orc_fortress": {
    name: "Orc Fortress 🏰",
    minLevel: 8,
    waves: 4,
    mpCost: 20,
    monsters: [
      { name: "Orc Scout", hp: 280, attack: 52, defense: 18 },
      { name: "Orc Warrior", hp: 350, attack: 68, defense: 22 }
    ],
    boss: {
      name: "Orc Warlord ⚔",
      level: 15,
      hp: 1200,
      attack: 110,
      defense: 40,
      expReward: 600,
      goldReward: 800,
      drops: { "egg_uncommon": 0.4, "iron_ore": 2, "leather_scrap": 2 }
    }
  },
  "dragon_nest": {
    name: "Dragon Nest 🌋",
    minLevel: 18,
    waves: 4,
    mpCost: 35,
    monsters: [
      { name: "Lizardman Raider", hp: 500, attack: 105, defense: 35 },
      { name: "Wyvern", hp: 800, attack: 160, defense: 55 }
    ],
    boss: {
      name: "Ancient Red Dragon 🐲",
      level: 25,
      hp: 4000,
      attack: 290,
      defense: 110,
      expReward: 2500,
      goldReward: 3000,
      drops: { "egg_rare": 0.3, "dragon_scale": 2, "magic_shard": 2, "elixir": 0.5 }
    }
  },
  "void_rift": {
    name: "Void Rift 🌌",
    minLevel: 30,
    waves: 5,
    mpCost: 50,
    monsters: [
      { name: "Dark Knight", hp: 1000, attack: 195, defense: 75 },
      { name: "Behemoth", hp: 3000, attack: 450, defense: 160 }
    ],
    boss: {
      name: "Chaos Emperor Bahamut 🌌",
      level: 45,
      hp: 15000,
      attack: 750,
      defense: 250,
      expReward: 10000,
      goldReward: 15000,
      drops: { "egg_legends": 0.2, "egg_mythic": 0.05, "dragon_scale": 4, "magic_shard": 4, "elixir": 2 }
    }
  }
};

// === World Boss Config ===
const worldBossTemplates = [
  {
    name: "Ancient Dragon Fafnir 🐉",
    baseHp: 300000,
    hpPerLevel: 3000,
    baseAtk: 400,
    atkPerLevel: 10,
    baseDef: 150,
    defPerLevel: 5
  },
  {
    name: "Abyss Kraken 🦑",
    baseHp: 600000,
    hpPerLevel: 5000,
    baseAtk: 600,
    atkPerLevel: 15,
    baseDef: 200,
    defPerLevel: 6
  },
  {
    name: "Celestial Titan Chronos 🗿",
    baseHp: 1200000,
    hpPerLevel: 8000,
    baseAtk: 900,
    atkPerLevel: 25,
    baseDef: 350,
    defPerLevel: 8
  },
  {
    name: "Bahamut Prime 🔥",
    baseHp: 2500000,
    hpPerLevel: 15000,
    baseAtk: 1500,
    atkPerLevel: 45,
    baseDef: 500,
    defPerLevel: 12
  }
];

module.exports = {
  monsters,
  dungeons,
  worldBossTemplates
};
