// ================== RPG JOBS & SKILLS CONFIGURATION ==================

const jobs = {
  warrior: {
    name: "Warrior",
    description: "Fighter seimbang dengan HP tinggi dan serangan fisik solid.",
    baseStats: { str: 15, int: 5, vit: 12, agi: 8, dex: 10 },
    growth: { str: 2.2, int: 0.6, vit: 1.8, agi: 1.0, dex: 1.4 },
    skills: [
      {
        key: "double_slash",
        name: "Double Slash ⚔",
        mpCost: 15,
        type: "damage",
        damageType: "physical",
        multiplier: 1.8,
        description: "Menyerang musuh dua kali dengan tebasan cepat. (1.8x ATK)"
      },
      {
        key: "iron_will",
        name: "Iron Will 🛡",
        mpCost: 10,
        type: "buff",
        description: "Meningkatkan DEF dan memulihkan HP sebesar (1.5x VIT + 10)."
      }
    ]
  },
  paladin: {
    name: "Paladin",
    description: "Ksatria suci dengan pertahanan (Defense & VIT) tertinggi.",
    baseStats: { str: 10, int: 8, vit: 18, agi: 6, dex: 8 },
    growth: { str: 1.4, int: 1.0, vit: 2.8, agi: 0.8, dex: 1.0 },
    skills: [
      {
        key: "smite",
        name: "Smite ⚡",
        mpCost: 15,
        type: "damage",
        damageType: "physical",
        description: "Serangan suci yang menghasilkan damage berdasarkan kekuatan dan pertahanan. (1.2x STR + 1.5x VIT)"
      },
      {
        key: "holy_barrier",
        name: "Holy Barrier 🛡",
        mpCost: 20,
        type: "buff",
        description: "Menyelimuti diri dengan pelindung suci. Menyerap damage sebesar (3x VIT)."
      }
    ]
  },
  mage: {
    name: "Mage",
    description: "Penyihir elemen dengan Magic Damage luar biasa, tetapi HP tipis.",
    baseStats: { str: 5, int: 20, vit: 6, agi: 8, dex: 11 },
    growth: { str: 0.5, int: 3.0, vit: 0.8, agi: 1.2, dex: 1.5 },
    skills: [
      {
        key: "fireball",
        name: "Fireball 🔥",
        mpCost: 20,
        type: "damage",
        damageType: "magic",
        description: "Meluncurkan bola api raksasa ke musuh. (2.5x INT)"
      },
      {
        key: "mana_surge",
        name: "Mana Surge ✨",
        mpCost: 0,
        type: "heal_mp",
        description: "Memfokuskan pikiran untuk memulihkan MP sebesar (1x INT + 15)."
      }
    ]
  },
  cleric: {
    name: "Cleric",
    description: "Penyembuh suci yang penting untuk bertahan hidup di pertempuran panjang.",
    baseStats: { str: 8, int: 14, vit: 10, agi: 7, dex: 11 },
    growth: { str: 1.0, int: 2.2, vit: 1.6, agi: 0.9, dex: 1.3 },
    skills: [
      {
        key: "cure",
        name: "Cure 💚",
        mpCost: 15,
        type: "heal",
        description: "Sihir pemulihan untuk menyembuhkan HP sebesar (2.0x INT + 1.0x VIT)."
      },
      {
        key: "holy_light",
        name: "Holy Light 🌟",
        mpCost: 12,
        type: "damage",
        damageType: "magic",
        description: "Menembakkan cahaya suci ke musuh. (1.5x INT + 0.8x STR)"
      }
    ]
  },
  rogue: {
    name: "Rogue",
    description: "Pembunuh bayangan lincah yang mengandalkan Evasion dan Critical.",
    baseStats: { str: 11, int: 5, vit: 8, agi: 16, dex: 10 },
    growth: { str: 1.5, int: 0.6, vit: 1.0, agi: 2.8, dex: 1.1 },
    skills: [
      {
        key: "sneak_attack",
        name: "Sneak Attack 🗡",
        mpCost: 18,
        type: "damage",
        damageType: "physical",
        description: "Serangan tak terduga dari bayangan. (1.6x DEX + 1.2x AGI) & jaminan Critical."
      },
      {
        key: "shadow_step",
        name: "Shadow Step 💨",
        mpCost: 12,
        type: "buff",
        description: "Bergerak sangat cepat untuk meningkatkan Evasion sebesar 25% dalam pertarungan ini."
      }
    ]
  },
  archer: {
    name: "Archer",
    description: "Pemanah jitu dengan serangan DEX yang sangat akurat dan mematikan.",
    baseStats: { str: 9, int: 6, vit: 8, agi: 11, dex: 16 },
    growth: { str: 1.2, int: 0.8, vit: 1.0, agi: 1.8, dex: 2.2 },
    skills: [
      {
        key: "arrow_shower",
        name: "Arrow Shower 🏹",
        mpCost: 20,
        type: "damage",
        damageType: "physical",
        description: "Menembakkan hujan anak panah dari kejauhan. (2.2x DEX)"
      },
      {
        key: "focus_aim",
        name: "Focus Aim 🎯",
        mpCost: 10,
        type: "buff",
        description: "Meningkatkan Akurasi dan Critical Rate sebesar 20% dalam pertarungan ini."
      }
    ]
  },
  berserker: {
    name: "Berserker",
    description: "Fighter haus darah dengan serangan fisik (STR) paling destruktif.",
    baseStats: { str: 18, int: 4, vit: 10, agi: 9, dex: 9 },
    growth: { str: 3.0, int: 0.4, vit: 1.2, agi: 1.2, dex: 1.2 },
    skills: [
      {
        key: "rage",
        name: "Rage 😡",
        mpCost: 15,
        type: "buff",
        description: "Memasuki mode mengamuk. Meningkatkan STR sebesar 40% namun mengurangi DEF sebesar 20%."
      },
      {
        key: "heavy_strike",
        name: "Heavy Strike 🔨",
        mpCost: 25,
        type: "damage",
        damageType: "physical",
        description: "Hantaman berkekuatan penuh yang menghancurkan musuh. (2.5x STR)"
      }
    ]
  },
  monk: {
    name: "Monk",
    description: "Ahli bela diri yang memadukan serangan fisik cepat dan pemulihan energi batin.",
    baseStats: { str: 12, int: 7, vit: 11, agi: 11, dex: 9 },
    growth: { str: 1.8, int: 0.9, vit: 1.5, agi: 1.5, dex: 1.3 },
    skills: [
      {
        key: "dragon_fist",
        name: "Dragon Fist 👊",
        mpCost: 12,
        type: "damage",
        damageType: "physical",
        description: "Serangan tinju naga bertubi-tubi. (1.2x STR + 1.2x AGI + 0.8x DEX)"
      },
      {
        key: "chakra",
        name: "Chakra 🧘",
        mpCost: 10,
        type: "heal",
        description: "Memulihkan energi kehidupan. Menyembuhkan HP sebesar (1x STR + 10) & memulihkan MP sebesar (1x INT + 5)."
      }
    ]
  },

  // ==========================================
  // === TIER 2: ADVANCED CLASSES (Level 30+) ===
  // ==========================================
  lord_knight: {
    name: "Lord Knight",
    description: "Ksatria tertinggi dengan daya tahan superior dan tebasan menembus pertahanan.",
    baseStats: { str: 25, int: 8, vit: 20, agi: 12, dex: 15 },
    growth: { str: 3.5, int: 0.8, vit: 2.5, agi: 1.5, dex: 2.0 },
    skills: [
      {
        key: "double_slash",
        name: "Double Slash ⚔",
        mpCost: 15,
        type: "damage",
        damageType: "physical",
        description: "Menyerang musuh dua kali dengan tebasan cepat. (1.8x ATK)"
      },
      {
        key: "iron_will",
        name: "Iron Will 🛡",
        mpCost: 10,
        type: "buff",
        description: "Meningkatkan DEF dan memulihkan HP sebesar (1.5x VIT + 10)."
      },
      {
        key: "spiral_pierce",
        name: "Spiral Pierce 🌀",
        mpCost: 30,
        type: "damage",
        damageType: "physical",
        description: "Tusukan memutar mematikan yang mengabaikan Defense target. (3.0x STR)"
      }
    ]
  },
  templar: {
    name: "Templar",
    description: "Pelindung suci abadi dengan pertahanan mutlak dan penyembuhan magis.",
    baseStats: { str: 18, int: 15, vit: 30, agi: 10, dex: 12 },
    growth: { str: 2.0, int: 1.6, vit: 4.0, agi: 1.2, dex: 1.5 },
    skills: [
      {
        key: "smite",
        name: "Smite ⚡",
        mpCost: 15,
        type: "damage",
        damageType: "physical",
        description: "Serangan suci yang menghasilkan damage berdasarkan kekuatan dan pertahanan. (1.2x STR + 1.5x VIT)"
      },
      {
        key: "holy_barrier",
        name: "Holy Barrier 🛡",
        mpCost: 20,
        type: "buff",
        description: "Menyelimuti diri dengan pelindung suci. Menyerap damage sebesar (3x VIT)."
      },
      {
        key: "grand_cross",
        name: "Grand Cross ✝",
        mpCost: 35,
        type: "damage",
        damageType: "magic",
        description: "Memanggil salib suci raksasa. Menghasilkan damage (2.0x VIT + 2.0x INT) dan memulihkan HP sebesar 15% Max HP."
      }
    ]
  },
  archmage: {
    name: "Archmage",
    description: "Penyihir legendaris pengendali elemen meteor pemusnah massal.",
    baseStats: { str: 8, int: 35, vit: 10, agi: 14, dex: 18 },
    growth: { str: 0.8, int: 4.5, vit: 1.2, agi: 1.8, dex: 2.2 },
    skills: [
      {
        key: "fireball",
        name: "Fireball 🔥",
        mpCost: 20,
        type: "damage",
        damageType: "magic",
        description: "Meluncurkan bola api raksasa ke musuh. (2.5x INT)"
      },
      {
        key: "mana_surge",
        name: "Mana Surge ✨",
        mpCost: 0,
        type: "heal_mp",
        description: "Memfokuskan pikiran untuk memulihkan MP sebesar (1x INT + 15)."
      },
      {
        key: "meteor_storm",
        name: "Meteor Storm ☄",
        mpCost: 40,
        type: "damage",
        damageType: "magic",
        description: "Memanggil badai meteor berapi-api. (3.8x INT) & memberikan status Burn."
      }
    ]
  },
  high_priest: {
    name: "High Priest",
    description: "Utusan dewa dengan kekuatan pemulihan absolut dan berkat perlindungan suci.",
    baseStats: { str: 12, int: 25, vit: 16, agi: 12, dex: 16 },
    growth: { str: 1.4, int: 3.5, vit: 2.4, agi: 1.4, dex: 1.8 },
    skills: [
      {
        key: "cure",
        name: "Cure 💚",
        mpCost: 15,
        type: "heal",
        description: "Sihir pemulihan untuk menyembuhkan HP sebesar (2.0x INT + 1.0x VIT)."
      },
      {
        key: "holy_light",
        name: "Holy Light 🌟",
        mpCost: 12,
        type: "damage",
        damageType: "magic",
        description: "Menembakkan cahaya suci ke musuh. (1.5x INT + 0.8x STR)"
      },
      {
        key: "sanctuary",
        name: "Sanctuary ⛪",
        mpCost: 35,
        type: "heal",
        description: "Mendirikan area suci. Menyembuhkan HP penuh dan meningkatkan DEF sebesar 30% dalam pertarungan ini."
      }
    ]
  },
  assassin: {
    name: "Assassin",
    description: "Eksekutor bayangan mematikan dengan tebasan beruntun tak terlihat.",
    baseStats: { str: 18, int: 8, vit: 12, agi: 28, dex: 18 },
    growth: { str: 2.2, int: 0.8, vit: 1.5, agi: 4.0, dex: 1.8 },
    skills: [
      {
        key: "sneak_attack",
        name: "Sneak Attack 🗡",
        mpCost: 18,
        type: "damage",
        damageType: "physical",
        description: "Serangan tak terduga dari bayangan. (1.6x DEX + 1.2x AGI) & jaminan Critical."
      },
      {
        key: "shadow_step",
        name: "Shadow Step 💨",
        mpCost: 12,
        type: "buff",
        description: "Bergerak sangat cepat untuk meningkatkan Evasion sebesar 25% dalam pertarungan ini."
      },
      {
        key: "sonic_blow",
        name: "Sonic Blow ⚡",
        mpCost: 32,
        type: "damage",
        damageType: "physical",
        description: "Tebasan 8 hit sangat cepat. (2.5x DEX + 2.0x AGI) & peluang Critical 50% lebih tinggi."
      }
    ]
  },
  sniper: {
    name: "Sniper",
    description: "Penembak jitu dengan akurasi mutlak yang mampu menembus jantung pertahanan lawan.",
    baseStats: { str: 14, int: 10, vit: 12, agi: 18, dex: 32 },
    growth: { str: 1.8, int: 1.2, vit: 1.5, agi: 2.5, dex: 4.2 },
    skills: [
      {
        key: "arrow_shower",
        name: "Arrow Shower 🏹",
        mpCost: 20,
        type: "damage",
        damageType: "physical",
        description: "Menembakkan hujan anak panah dari kejauhan. (2.2x DEX)"
      },
      {
        key: "focus_aim",
        name: "Focus Aim 🎯",
        mpCost: 10,
        type: "buff",
        description: "Meningkatkan Akurasi dan Critical Rate sebesar 20% dalam pertarungan ini."
      },
      {
        key: "sharp_shooting",
        name: "Sharp Shooting 🎯",
        mpCost: 30,
        type: "damage",
        damageType: "physical",
        description: "Tembakan jitu berkecepatan tinggi. Akurasi 100% dan bonus +50% Crit Rate. (3.2x DEX)"
      }
    ]
  },
  warlord: {
    name: "Warlord",
    description: "Dewa perang kejam yang semakin terluka semakin haus darah dan mematikan.",
    baseStats: { str: 32, int: 6, vit: 16, agi: 14, dex: 14 },
    growth: { str: 4.5, int: 0.6, vit: 2.0, agi: 1.8, dex: 1.8 },
    skills: [
      {
        key: "rage",
        name: "Rage 😡",
        mpCost: 15,
        type: "buff",
        description: "Memasuki mode mengamuk. Meningkatkan STR sebesar 40% namun mengurangi DEF sebesar 20%."
      },
      {
        key: "heavy_strike",
        name: "Heavy Strike 🔨",
        mpCost: 25,
        type: "damage",
        damageType: "physical",
        description: "Hantaman berkekuatan penuh yang menghancurkan musuh. (2.5x STR)"
      },
      {
        key: "guillotine_slash",
        name: "Guillotine Slash 🩸",
        mpCost: 35,
        type: "damage",
        damageType: "physical",
        description: "Tebasan algojo pemutus kepala. (3.0x STR) & otomatis instan kill jika HP musuh di bawah 25%."
      }
    ]
  },
  grandmaster: {
    name: "Grandmaster",
    description: "Master bela diri legendaris pengendali energi batin yang mampu melancarkan pukulan mutlak.",
    baseStats: { str: 20, int: 12, vit: 18, agi: 18, dex: 15 },
    growth: { str: 2.8, int: 1.5, vit: 2.2, agi: 2.2, dex: 2.0 },
    skills: [
      {
        key: "dragon_fist",
        name: "Dragon Fist 👊",
        mpCost: 12,
        type: "damage",
        damageType: "physical",
        description: "Serangan tinju naga bertubi-tubi. (1.2x STR + 1.2x AGI + 0.8x DEX)"
      },
      {
        key: "chakra",
        name: "Chakra 🧘",
        mpCost: 10,
        type: "heal",
        description: "Memulihkan energi kehidupan. Menyembuhkan HP sebesar (1x STR + 10) & memulihkan MP sebesar (1x INT + 5)."
      },
      {
        key: "asura_strike",
        name: "Asura Strike 👊🔥",
        mpCost: 50,
        type: "damage",
        damageType: "physical",
        description: "Pukulan Asura mutlak yang mengonsumsi seluruh MP. Menghasilkan damage fisik masif (4.0x STR + 2.0x INT)."
      }
    ]
  }
};

// === STAT FORMULAS (OVERHAUL - Setiap stat SANGAT berpengaruh) ===

// Menghitung Max HP berdasarkan VIT dan Level
// VIT sangat krusial: tanpa VIT tinggi, HP sangat rendah
function getMaxHp(level, vit) {
  const base = 60;
  const levelScale = level * 6;
  const vitScale = vit * 18;
  const vitExponential = Math.floor(Math.pow(vit, 1.35) * 0.6);
  return Math.floor(base + levelScale + vitScale + vitExponential);
}

// Menghitung Max MP berdasarkan INT dan Level
// INT sangat krusial: tanpa INT, hampir tidak bisa pakai skill
function getMaxMp(level, int) {
  const base = 15;
  const levelScale = level * 2;
  const intScale = int * 12;
  const intExponential = Math.floor(Math.pow(int, 1.25) * 0.4);
  return Math.floor(base + levelScale + intScale + intExponential);
}

// Menghitung Physical Attack
// STR sangat menentukan: tanpa STR, damage fisik sangat kecil
function getPhysicalAttack(str, weaponBonus = 0) {
  const base = 3;
  const strScale = str * 3.0;
  const strExponential = Math.floor(Math.pow(str, 1.2) * 0.4);
  return Math.floor(base + strScale + strExponential + weaponBonus);
}

// Menghitung Magic Attack
// INT sangat menentukan: tanpa INT, magic damage minimal
function getMagicAttack(int, weaponBonus = 0) {
  const base = 2;
  const intScale = int * 3.2;
  const intExponential = Math.floor(Math.pow(int, 1.2) * 0.4);
  return Math.floor(base + intScale + intExponential + weaponBonus);
}

// Menghitung Physical Defense
// VIT sangat penting: tanpa VIT, player menerima damage penuh
function getPhysicalDefense(vit, armorBonus = 0) {
  const base = 1;
  const vitScale = vit * 2.2;
  const vitExponential = Math.floor(Math.pow(vit, 1.15) * 0.25);
  return Math.floor(base + vitScale + vitExponential + armorBonus);
}

// Menghitung Critical Rate (Maksimal 55%)
// AGI sangat menentukan: setiap poin AGI = +0.6% crit
function getCriticalRate(agi) {
  return Math.min(55, Math.floor(1 + (agi * 0.6)));
}

// Menghitung Evasion Rate (Maksimal 60%)
// AGI sangat menentukan: setiap poin AGI = +0.7% evasion
function getEvasionRate(agi) {
  return Math.min(60, Math.floor(1 + (agi * 0.7)));
}

// Menghitung Akurasi (Maksimal 98%)
// DEX SANGAT KRUSIAL: base accuracy rendah (55%), tanpa DEX pasti sering miss!
function getAccuracyRate(dex) {
  return Math.min(98, Math.floor(55 + (dex * 0.65)));
}

// EXP Curve yang sangat curam — endgame butuh SANGAT lama
function getExpNeeded(level) {
  if (level >= 40) {
    // Tier 4: Endgame (Level 40-50) — butuh berbulan-bulan
    return Math.floor(400 * Math.pow(level, 3.0));
  }
  if (level >= 25) {
    // Tier 3: Late game (Level 25-39) — sangat lambat
    return Math.floor(250 * Math.pow(level, 2.7));
  }
  if (level >= 10) {
    // Tier 2: Mid game (Level 10-24) — mulai terasa berat
    return Math.floor(180 * Math.pow(level, 2.5));
  }
  // Tier 1: Early game (Level 1-9) — sudah cukup berat
  return Math.floor(150 * Math.pow(level, 1.9));
}

module.exports = {
  jobs,
  getMaxHp,
  getMaxMp,
  getPhysicalAttack,
  getMagicAttack,
  getPhysicalDefense,
  getCriticalRate,
  getEvasionRate,
  getAccuracyRate,
  getExpNeeded
};
