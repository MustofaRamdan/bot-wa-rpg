// ================== RPG ITEMS CONFIGURATION ==================

const items = {

  // ============================================================
  // === CONSUMABLES ===
  // ============================================================
  "potion": {
    name: "Health Potion 🧪", type: "consumable", price: 50,
    healHp: 50, description: "Memulihkan 50 HP."
  },
  "super_potion": {
    name: "Super Potion 💊", type: "consumable", price: 150,
    healHp: 150, description: "Memulihkan 150 HP."
  },
  "hyper_potion": {
    name: "Hyper Potion ✨", type: "consumable", price: 400,
    healHp: 500, description: "Memulihkan 500 HP."
  },
  "ether": {
    name: "Ether 💙", type: "consumable", price: 100,
    healMp: 50, description: "Memulihkan 50 MP."
  },
  "elixir": {
    name: "Elixir 🌟", type: "consumable", price: 1000,
    healHp: 9999, healMp: 9999, description: "Memulihkan seluruh HP & MP."
  },
  "exp_boost": {
    name: "EXP Boost 📈", type: "consumable", price: 1000,
    expGain: 200, description: "Memberikan 200 EXP instan."
  },
  "potion_giant": {
    name: "Giant Potion 🧪✨", type: "consumable", price: 800,
    healHp: 1000, description: "Memulihkan 1000 HP secara instan."
  },
  "ether_great": {
    name: "Great Ether 🧪💙", type: "consumable", price: 500,
    healMp: 150, description: "Memulihkan 150 MP secara instan."
  },
  "adrenaline_shot": {
    name: "Adrenaline Shot 💉", type: "consumable", price: 1500,
    description: "Suntikan adrenalin peningkat fokus tempur (Item variasi)."
  },
  "scroll_town": {
    name: "Town Portal Scroll 📜", type: "consumable", price: 100,
    description: "Gulungan sihir untuk kembali instan ke Green Forest (Zona 1)."
  },
  "box_lucky": {
    name: "Lucky Chest 🎁", type: "consumable", price: 5000,
    description: "Peti keberuntungan! Buka untuk mendapatkan material ore/wood/potion acak."
  },

  // ============================================================
  // === GATHERING TOOLS (dijual di toko) ===
  // ============================================================

  // --- Pancingan (Fishing Rods) ---
  "rod_basic": {
    name: "Pancingan Bambu 🎣", type: "tool", toolType: "rod", tier: "basic",
    price: 500, description: "Pancingan sederhana. Peluang ikan biasa lebih banyak."
  },
  "rod_good": {
    name: "Pancingan Baja 🎣", type: "tool", toolType: "rod", tier: "good",
    price: 2000, description: "Pancingan kuat. Peluang ikan langka meningkat."
  },
  "rod_pro": {
    name: "Pancingan Mithril 🎣", type: "tool", toolType: "rod", tier: "pro",
    price: 8000, description: "Pancingan terbaik. Bisa mendapat ikan Mythic!"
  },

  // --- Kapak (Axes for Logging) ---
  "axe_basic": {
    name: "Kapak Kayu 🪓", type: "tool", toolType: "axe", tier: "basic",
    price: 500, description: "Kapak sederhana. Menghasilkan kayu biasa."
  },
  "axe_good": {
    name: "Kapak Besi 🪓", type: "tool", toolType: "axe", tier: "good",
    price: 2000, description: "Kapak tajam. Peluang kayu langka meningkat."
  },
  "axe_pro": {
    name: "Kapak Mithril 🪓", type: "tool", toolType: "axe", tier: "pro",
    price: 8000, description: "Kapak terbaik. Bisa menebang Kayu Naga!"
  },

  // --- Cangkul/Pickaxe (Mining) ---
  "pickaxe_basic": {
    name: "Cangkul Kayu ⛏️", type: "tool", toolType: "pickaxe", tier: "basic",
    price: 500, description: "Cangkul sederhana. Menambang batu biasa."
  },
  "pickaxe_good": {
    name: "Cangkul Besi ⛏️", type: "tool", toolType: "pickaxe", tier: "good",
    price: 2000, description: "Cangkul kokoh. Peluang ore langka meningkat."
  },
  "pickaxe_pro": {
    name: "Cangkul Mithril ⛏️", type: "tool", toolType: "pickaxe", tier: "pro",
    price: 8000, description: "Cangkul terbaik. Bisa menambang Adamantite!"
  },

  // ============================================================
  // === FISH (hasil mancing, bisa dijual) ===
  // ============================================================
  "fish_common": {
    name: "Ikan Sarden ⚪", type: "fish", sellPrice: 30,
    description: "Ikan biasa. Bisa dijual ke pasar."
  },
  "fish_uncommon": {
    name: "Ikan Mas 🟢", type: "fish", sellPrice: 120,
    description: "Ikan tidak biasa. Harga lumayan."
  },
  "fish_rare": {
    name: "Ikan Kakap Merah 🔵", type: "fish", sellPrice: 500,
    description: "Ikan langka dengan harga tinggi."
  },
  "fish_epic": {
    name: "Ikan Naga Laut 🟣", type: "fish", sellPrice: 2000,
    description: "Ikan epik yang sangat berharga."
  },
  "fish_legendary": {
    name: "Ikan Dewa Samudra 🟡", type: "fish", sellPrice: 8000,
    description: "Ikan legendaris! Harga luar biasa mahal."
  },
  "fish_mythic": {
    name: "Leviathan Fish 🔴✨", type: "fish", sellPrice: 30000,
    description: "Ikan mitos. Sangat jarang. Harga selangit!"
  },

  // ============================================================
  // === WOOD (hasil tebang pohon, untuk crafting) ===
  // ============================================================
  "wood_pine": {
    name: "Kayu Pinus 🪵", type: "wood",
    description: "Kayu pinus biasa. Material dasar crafting."
  },
  "wood_oak": {
    name: "Kayu Ek 🌿", type: "wood",
    description: "Kayu ek kokoh. Material crafting menengah."
  },
  "wood_maple": {
    name: "Kayu Maple 🍁", type: "wood",
    description: "Kayu maple langka. Digunakan untuk senjata dan zirah."
  },
  "wood_ebony": {
    name: "Kayu Hitam 🖤", type: "wood",
    description: "Kayu hitam epik. Hanya dari Kapak Mithril."
  },
  "wood_dragon": {
    name: "Kayu Naga 🔥", type: "wood",
    description: "Kayu legendarsi dari pohon naga purba. Sangat langka!"
  },

  // ============================================================
  // === ORE / STONE (hasil tambang, untuk crafting) ===
  // ============================================================
  "stone_basic": {
    name: "Batu Biasa 🪨", type: "ore",
    description: "Batu biasa. Material crafting paling dasar."
  },
  "ore_copper": {
    name: "Bijih Tembaga 🟤", type: "ore",
    description: "Bijih tembaga. Digunakan untuk crafting menengah."
  },
  "iron_ore": {
    name: "Bijih Besi ⚫", type: "ore", price: 50,
    description: "Bijih besi. Bisa dibeli atau ditambang. Untuk crafting & upgrade (+1 s/d +5)."
  },
  "ore_silver": {
    name: "Bijih Perak 🔵", type: "ore",
    description: "Bijih perak langka. Untuk senjata kelas menengah."
  },
  "ore_mythril": {
    name: "Bijih Mithril 💜", type: "ore",
    description: "Bijih mithril epik. Untuk equipment kelas tinggi."
  },
  "ore_adamantite": {
    name: "Bijih Adamantite 🌟", type: "ore",
    description: "Bijih paling langka. Hanya dari Cangkul Mithril. Untuk dragon gear!"
  },

  // ============================================================
  // === UPGRADE MATERIALS (untuk !forge) ===
  // ============================================================
  "leather_scrap": {
    name: "Leather Scrap 🧵", type: "material", price: 40,
    description: "Potongan kulit untuk upgrade Zirah (+1 s/d +5)."
  },
  "magic_shard": {
    name: "Magic Shard 💎", type: "material", price: 150,
    description: "Kristal sihir untuk upgrade equipment tingkat tinggi (+6 s/d +9)."
  },
  "dragon_scale": {
    name: "Dragon Scale 🐉", type: "material", price: 600,
    description: "Sisik naga untuk upgrade equipment legendaris (+10)."
  },

  // ============================================================
  // === WEAPONS (craftable only, shopable: false) ===
  // ============================================================
  // ============================================================
  // === WEAPONS (craftable only, shopable: false) ===
  // ============================================================
  "wooden_staff": {
    name: "Wooden Staff 🪄", type: "weapon", shopable: false, price: 0,
    stats: { int: 5 }, allowedJobs: ["mage", "cleric", "archmage", "high_priest"],
    description: "Staf kayu sederhana. Cocok untuk Mage/Cleric."
  },
  "iron_sword": {
    name: "Iron Sword 🗡️", type: "weapon", shopable: false, price: 0,
    stats: { str: 8 }, allowedJobs: ["warrior", "paladin", "berserker", "lord_knight", "templar", "warlord"],
    description: "Pedang besi standar."
  },
  "steel_sword": {
    name: "Steel Sword ⚔️", type: "weapon", shopable: false, price: 0,
    stats: { str: 18 }, allowedJobs: ["warrior", "paladin", "berserker", "lord_knight", "templar", "warlord"],
    description: "Pedang baja kokoh."
  },
  "mythril_dagger": {
    name: "Mythril Dagger 🔪", type: "weapon", shopable: false, price: 0,
    stats: { dex: 15, agi: 8 }, allowedJobs: ["rogue", "monk", "assassin", "grandmaster"],
    description: "Belati mithril ringan. Cocok untuk Rogue/Monk."
  },
  "composite_bow": {
    name: "Composite Bow 🏹", type: "weapon", shopable: false, price: 0,
    stats: { dex: 16, agi: 4 }, allowedJobs: ["archer", "sniper"],
    description: "Busur panah modern. Cocok untuk Archer."
  },
  "wizard_wand": {
    name: "Wizard Wand ✨", type: "weapon", shopable: false, price: 0,
    stats: { int: 22 }, allowedJobs: ["mage", "archmage"],
    description: "Tongkat sihir berkekuatan tinggi."
  },
  "dragon_sword": {
    name: "Dragon Sword 🐉", type: "weapon", shopable: false, price: 0,
    stats: { str: 30, vit: 10 }, allowedJobs: ["warrior", "paladin", "berserker", "lord_knight", "templar", "warlord"],
    description: "Pedang legendaris dari sisik naga."
  },
  "holy_mace": {
    name: "Holy Mace ⚡", type: "weapon", shopable: false, price: 0,
    stats: { str: 15, int: 15 }, allowedJobs: ["cleric", "paladin", "high_priest", "templar"],
    description: "Gada suci. Bagus untuk Cleric/Paladin."
  },
  "wooden_bow": {
    name: "Wooden Bow 🏹", type: "weapon", shopable: false, price: 0,
    stats: { dex: 6, agi: 2 }, allowedJobs: ["archer", "sniper"],
    description: "Busur kayu sederhana untuk pemula."
  },
  "apprentice_staff": {
    name: "Apprentice Staff 🪄", type: "weapon", shopable: false, price: 0,
    stats: { int: 7 }, allowedJobs: ["mage", "cleric", "archmage", "high_priest"],
    description: "Tongkat kayu magis untuk pemula."
  },
  "mythril_shield": {
    name: "Mythril Shield 🛡️⚡", type: "weapon", shopable: false, price: 0,
    stats: { vit: 20, def: 10 }, allowedJobs: ["paladin", "templar"],
    description: "Perisai mithril suci. Pelindung para Ksatria."
  },

  // ============================================================
  // === ARMORS (craftable only, shopable: false) ===
  // ============================================================
  "leather_armor": {
    name: "Leather Armor 🛡️", type: "armor", shopable: false, price: 0,
    stats: { vit: 6, def: 3 }, allowedJobs: ["warrior", "paladin", "mage", "cleric", "rogue", "archer", "monk", "lord_knight", "templar", "archmage", "high_priest", "assassin", "sniper", "grandmaster", "berserker", "warlord"],
    description: "Zirah kulit tipis."
  },
  "chain_mail": {
    name: "Chain Mail ⛓️", type: "armor", shopable: false, price: 0,
    stats: { vit: 14, def: 8 }, allowedJobs: ["warrior", "paladin", "berserker", "lord_knight", "templar", "warlord"],
    description: "Zirah rantai besi."
  },
  "wizard_robe": {
    name: "Wizard Robe 🧙", type: "armor", shopable: false, price: 0,
    stats: { int: 8, def: 4, vit: 4 }, allowedJobs: ["mage", "cleric", "archmage", "high_priest"],
    description: "Jubah kain magis."
  },
  "ranger_vest": {
    name: "Ranger Vest 🦌", type: "armor", shopable: false, price: 0,
    stats: { agi: 10, def: 5, dex: 4 }, allowedJobs: ["rogue", "archer", "monk", "assassin", "sniper", "grandmaster"],
    description: "Rompi tipis berkecepatan tinggi."
  },
  "dragon_armor": {
    name: "Dragon Armor 🐲", type: "armor", shopable: false, price: 0,
    stats: { vit: 25, def: 18 }, allowedJobs: ["warrior", "paladin", "berserker", "lord_knight", "templar", "warlord"],
    description: "Zirah bersisik naga merah."
  },
  "paladin_mail": {
    name: "Paladin Mail 🛡️⚡", type: "armor", shopable: false, price: 0,
    stats: { vit: 35, def: 25 }, allowedJobs: ["paladin", "templar"],
    description: "Zirah Ksatria Suci. Pertahanan tertinggi."
  },
  "assassin_hood": {
    name: "Assassin Hood 🥷", type: "armor", shopable: false, price: 0,
    stats: { agi: 12, def: 6 }, allowedJobs: ["rogue", "assassin"],
    description: "Tudung penyamar bayangan untuk Assassin."
  },
  "high_priest_mitre": {
    name: "Arch Priest Mitre 👑", type: "armor", shopable: false, price: 0,
    stats: { int: 15, def: 5 }, allowedJobs: ["cleric", "high_priest"],
    description: "Mahkota kebesaran para pendeta suci."
  },

  // ============================================================
  // === SKILL TOMES (kitab pasif, craftable / loot) ===
  // ============================================================
  "tome_block": {
    name: "Kitab Rahasia Shield Block 📖", type: "tome", shopable: false, price: 0,
    job: "warrior", passive: "shield_block", description: "Membuka pasif Shield Block secara permanen untuk Warrior/Lord Knight."
  },
  "tome_absorb": {
    name: "Kitab Suci Divine Absorb 📖", type: "tome", shopable: false, price: 0,
    job: "paladin", passive: "divine_absorb", description: "Membuka pasif Divine Absorb secara permanen untuk Paladin/Templar."
  },
  "tome_mana_shield": {
    name: "Buku Sihir Mana Shield 📖", type: "tome", shopable: false, price: 0,
    job: "mage", passive: "mana_shield", description: "Membuka pasif Mana Shield secara permanen untuk Mage/Archmage."
  },
  "tome_favor": {
    name: "Kitab Suci Divine Favor 📖", type: "tome", shopable: false, price: 0,
    job: "cleric", passive: "divine_favor", description: "Membuka pasif Divine Favor secara permanen untuk Cleric/High Priest."
  },
  "tome_shadow": {
    name: "Kitab Rahasia Shadow Assault 📖", type: "tome", shopable: false, price: 0,
    job: "rogue", passive: "shadow_assault", description: "Membuka pasif Shadow Assault secara permanen untuk Rogue/Assassin."
  },
  "tome_piercing": {
    name: "Panduan Eagle Eye 📖", type: "tome", shopable: false, price: 0,
    job: "archer", passive: "armor_piercing", description: "Membuka pasif Armor Piercing secara permanen untuk Archer/Sniper."
  },
  "tome_frenzy": {
    name: "Kitab Darah Frenzy 📖", type: "tome", shopable: false, price: 0,
    job: "berserker", passive: "low_hp_frenzy", description: "Membuka pasif Low HP Frenzy secara permanen untuk Berserker/Warlord."
  },
  "tome_meditation": {
    name: "Panduan Meditasi Chakra 📖", type: "tome", shopable: false, price: 0,
    job: "monk", passive: "chakra_meditation", description: "Membuka pasif Chakra Meditation secara permanen untuk Monk/Grandmaster."
  },

  // ============================================================
  // === PET EGGS ===
  // ============================================================
  "egg_common": {
    name: "Common Pet Egg 🥚", type: "pet_egg", price: 3000,
    rarity: "common", description: "Telur pet biasa. Tier D-B."
  },
  "egg_uncommon": {
    name: "Uncommon Pet Egg 🥚", type: "pet_egg", price: 6000,
    rarity: "uncommon", description: "Telur pet tidak biasa. Tier C-A."
  },
  "egg_rare": {
    name: "Rare Pet Egg 🥚", type: "pet_egg", price: 25000,
    rarity: "rare", description: "Telur pet langka. Tier B-S."
  },
  "egg_legends": {
    name: "Legend Pet Egg 🥚", type: "pet_egg", price: 100000,
    rarity: "legends", description: "Telur pet legendaris. Tier A-SS."
  },
  "egg_mythic": {
    name: "Mythic Pet Egg 🥚", type: "pet_egg", price: 500000,
    rarity: "mythic", description: "Telur pet mitos. Tier S-SSS."
  }
};

module.exports = items;
