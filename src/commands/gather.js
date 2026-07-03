// ================== GATHER & CRAFT COMMAND HANDLERS ==================

const db = require('../database/db');
const helpers = require('../utils/helpers');
const items = require('../config/items');
const { trackQuestProgress } = require('./quest');

const GATHER_CD = 2 * 60 * 1000; // 2 menit

async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

// ================== DROP TABLES ==================

const FISH_TABLE = {
  basic: [
    { key: 'fish_common',    w: 50 },
    { key: 'fish_uncommon',  w: 30 },
    { key: 'fish_rare',      w: 15 },
    { key: 'fish_epic',      w: 4  },
    { key: 'fish_legendary', w: 1  },
  ],
  good: [
    { key: 'fish_common',    w: 35 },
    { key: 'fish_uncommon',  w: 35 },
    { key: 'fish_rare',      w: 20 },
    { key: 'fish_epic',      w: 8  },
    { key: 'fish_legendary', w: 2  },
  ],
  pro: [
    { key: 'fish_common',    w: 20 },
    { key: 'fish_uncommon',  w: 30 },
    { key: 'fish_rare',      w: 28 },
    { key: 'fish_epic',      w: 16 },
    { key: 'fish_legendary', w: 5  },
    { key: 'fish_mythic',    w: 1  },
  ]
};

const ZONE_WOOD_TABLE = {
  green_forest: {
    basic: [{ key: 'wood_pine', w: 60 }, { key: 'wood_oak', w: 30 }, { key: 'wood_maple', w: 10 }],
    good:  [{ key: 'wood_pine', w: 40 }, { key: 'wood_oak', w: 40 }, { key: 'wood_maple', w: 20 }],
    pro:   [{ key: 'wood_pine', w: 20 }, { key: 'wood_oak', w: 40 }, { key: 'wood_maple', w: 40 }]
  },
  abandoned_mine: {
    basic: [{ key: 'wood_oak', w: 60 }, { key: 'wood_maple', w: 30 }, { key: 'wood_ebony', w: 10 }],
    good:  [{ key: 'wood_oak', w: 40 }, { key: 'wood_maple', w: 40 }, { key: 'wood_ebony', w: 20 }],
    pro:   [{ key: 'wood_oak', w: 20 }, { key: 'wood_maple', w: 40 }, { key: 'wood_ebony', w: 40 }]
  },
  dragon_valley: {
    basic: [{ key: 'wood_maple', w: 60 }, { key: 'wood_ebony', w: 30 }, { key: 'wood_dragon', w: 10 }],
    good:  [{ key: 'wood_maple', w: 40 }, { key: 'wood_ebony', w: 40 }, { key: 'wood_dragon', w: 20 }],
    pro:   [{ key: 'wood_maple', w: 20 }, { key: 'wood_ebony', w: 40 }, { key: 'wood_dragon', w: 40 }]
  },
  lost_wasteland: {
    basic: [{ key: 'wood_pine', w: 70 }, { key: 'wood_oak', w: 30 }],
    good:  [{ key: 'wood_pine', w: 50 }, { key: 'wood_oak', w: 50 }],
    pro:   [{ key: 'wood_pine', w: 30 }, { key: 'wood_oak', w: 70 }]
  },
  frozen_tundra: {
    basic: [{ key: 'wood_pine', w: 60 }, { key: 'wood_maple', w: 40 }],
    good:  [{ key: 'wood_pine', w: 40 }, { key: 'wood_maple', w: 60 }],
    pro:   [{ key: 'wood_pine', w: 20 }, { key: 'wood_maple', w: 80 }]
  },
  underwater_ruins: {
    basic: [{ key: 'wood_pine', w: 60 }, { key: 'wood_oak', w: 40 }],
    good:  [{ key: 'wood_pine', w: 40 }, { key: 'wood_oak', w: 60 }],
    pro:   [{ key: 'wood_pine', w: 20 }, { key: 'wood_oak', w: 80 }]
  },
  abyss_depths: {
    basic: [{ key: 'wood_ebony', w: 80 }, { key: 'wood_dragon', w: 20 }],
    good:  [{ key: 'wood_ebony', w: 60 }, { key: 'wood_dragon', w: 40 }],
    pro:   [{ key: 'wood_ebony', w: 40 }, { key: 'wood_dragon', w: 60 }]
  },
  sky_sanctuary: {
    basic: [{ key: 'wood_oak', w: 40 }, { key: 'wood_maple', w: 40 }, { key: 'wood_ebony', w: 20 }],
    good:  [{ key: 'wood_oak', w: 30 }, { key: 'wood_maple', w: 40 }, { key: 'wood_ebony', w: 30 }],
    pro:   [{ key: 'wood_oak', w: 20 }, { key: 'wood_maple', w: 40 }, { key: 'wood_ebony', w: 40 }]
  }
};

const ZONE_ORE_TABLE = {
  green_forest: {
    basic: [{ key: 'stone_basic', w: 60 }, { key: 'ore_copper', w: 30 }, { key: 'iron_ore', w: 10 }],
    good:  [{ key: 'stone_basic', w: 40 }, { key: 'ore_copper', w: 40 }, { key: 'iron_ore', w: 20 }],
    pro:   [{ key: 'stone_basic', w: 20 }, { key: 'ore_copper', w: 40 }, { key: 'iron_ore', w: 40 }]
  },
  abandoned_mine: {
    basic: [{ key: 'ore_copper', w: 60 }, { key: 'iron_ore', w: 30 }, { key: 'ore_silver', w: 10 }],
    good:  [{ key: 'ore_copper', w: 40 }, { key: 'iron_ore', w: 40 }, { key: 'ore_silver', w: 20 }],
    pro:   [{ key: 'ore_copper', w: 20 }, { key: 'iron_ore', w: 40 }, { key: 'ore_silver', w: 40 }]
  },
  dragon_valley: {
    basic: [{ key: 'iron_ore', w: 60 }, { key: 'ore_mythril', w: 35 }, { key: 'ore_adamantite', w: 5 }],
    good:  [{ key: 'iron_ore', w: 40 }, { key: 'ore_mythril', w: 45 }, { key: 'ore_adamantite', w: 15 }],
    pro:   [{ key: 'iron_ore', w: 20 }, { key: 'ore_mythril', w: 50 }, { key: 'ore_adamantite', w: 30 }]
  },
  lost_wasteland: {
    basic: [{ key: 'stone_basic', w: 70 }, { key: 'ore_copper', w: 30 }],
    good:  [{ key: 'stone_basic', w: 50 }, { key: 'ore_copper', w: 50 }],
    pro:   [{ key: 'stone_basic', w: 30 }, { key: 'ore_copper', w: 70 }]
  },
  frozen_tundra: {
    basic: [{ key: 'iron_ore', w: 70 }, { key: 'ore_silver', w: 25 }, { key: 'ore_mythril', w: 5 }],
    good:  [{ key: 'iron_ore', w: 50 }, { key: 'ore_silver', w: 40 }, { key: 'ore_mythril', w: 10 }],
    pro:   [{ key: 'iron_ore', w: 30 }, { key: 'ore_silver', w: 50 }, { key: 'ore_mythril', w: 20 }]
  },
  underwater_ruins: {
    basic: [{ key: 'iron_ore', w: 70 }, { key: 'ore_silver', w: 25 }, { key: 'ore_mythril', w: 5 }],
    good:  [{ key: 'iron_ore', w: 50 }, { key: 'ore_silver', w: 40 }, { key: 'ore_mythril', w: 10 }],
    pro:   [{ key: 'iron_ore', w: 30 }, { key: 'ore_silver', w: 50 }, { key: 'ore_mythril', w: 20 }]
  },
  abyss_depths: {
    basic: [{ key: 'ore_silver', w: 50 }, { key: 'ore_mythril', w: 40 }, { key: 'ore_adamantite', w: 10 }],
    good:  [{ key: 'ore_silver', w: 30 }, { key: 'ore_mythril', w: 50 }, { key: 'ore_adamantite', w: 20 }],
    pro:   [{ key: 'ore_silver', w: 10 }, { key: 'ore_mythril', w: 60 }, { key: 'ore_adamantite', w: 30 }]
  },
  sky_sanctuary: {
    basic: [{ key: 'ore_silver', w: 40 }, { key: 'ore_mythril', w: 50 }, { key: 'ore_adamantite', w: 10 }],
    good:  [{ key: 'ore_silver', w: 30 }, { key: 'ore_mythril', w: 50 }, { key: 'ore_adamantite', w: 20 }],
    pro:   [{ key: 'ore_silver', w: 10 }, { key: 'ore_mythril', w: 60 }, { key: 'ore_adamantite', w: 30 }]
  }
};

// ================== CRAFTING RECIPES ==================

const RECIPES = {
  // --- Weapons ---
  iron_sword:    { name: 'Iron Sword 🗡️',      type: 'weapon', mats: { iron_ore: 5, wood_pine: 3 },         gold: 300   },
  steel_sword:   { name: 'Steel Sword ⚔️',      type: 'weapon', mats: { ore_silver: 5, wood_oak: 3 },        gold: 1000  },
  dragon_sword:  { name: 'Dragon Sword 🐉',      type: 'weapon', mats: { ore_adamantite: 4, wood_dragon: 2 }, gold: 10000 },
  wooden_staff:  { name: 'Wooden Staff 🪄',      type: 'weapon', mats: { wood_pine: 8 },                      gold: 200   },
  wizard_wand:   { name: 'Wizard Wand ✨',        type: 'weapon', mats: { wood_ebony: 3, ore_silver: 3 },      gold: 2000  },
  mythril_dagger:{ name: 'Mythril Dagger 🔪',    type: 'weapon', mats: { ore_mythril: 4, wood_maple: 2 },     gold: 3000  },
  composite_bow: { name: 'Composite Bow 🏹',     type: 'weapon', mats: { wood_maple: 5, ore_copper: 3 },      gold: 1200  },
  holy_mace:     { name: 'Holy Mace ⚡',          type: 'weapon', mats: { ore_silver: 6, stone_basic: 5 },     gold: 1800  },
  wooden_bow:    { name: 'Wooden Bow 🏹',        type: 'weapon', mats: { wood_pine: 10, stone_basic: 5 },     gold: 300   },
  apprentice_staff:{ name: 'Apprentice Staff 🪄',type: 'weapon', mats: { wood_pine: 8, ore_copper: 4 },       gold: 400   },
  mythril_shield:{ name: 'Mythril Shield 🛡️⚡',  type: 'weapon', mats: { ore_mythril: 6, wood_oak: 4 },        gold: 3500  },

  // --- Armors ---
  leather_armor: { name: 'Leather Armor 🛡️',    type: 'armor',  mats: { wood_pine: 5, stone_basic: 3 },      gold: 200   },
  chain_mail:    { name: 'Chain Mail ⛓️',        type: 'armor',  mats: { iron_ore: 8, ore_copper: 3 },         gold: 800   },
  wizard_robe:   { name: 'Wizard Robe 🧙',       type: 'armor',  mats: { wood_oak: 5, ore_copper: 3 },         gold: 600   },
  ranger_vest:   { name: 'Ranger Vest 🦌',       type: 'armor',  mats: { wood_maple: 4, ore_copper: 3 },       gold: 700   },
  dragon_armor:  { name: 'Dragon Armor 🐲',      type: 'armor',  mats: { ore_adamantite: 4, wood_dragon: 3 },  gold: 12000 },
  paladin_mail:  { name: 'Paladin Mail 🛡️⚡',   type: 'armor',  mats: { ore_mythril: 6, ore_silver: 4, iron_ore: 5 }, gold: 5000 },
  assassin_hood: { name: 'Assassin Hood 🥷',     type: 'armor',  mats: { wood_ebony: 4, ore_silver: 5 },       gold: 2500  },
  high_priest_mitre:{ name: 'Arch Priest Mitre 👑',type: 'armor', mats: { wood_maple: 6, ore_silver: 6 },      gold: 3000  },
  
  // --- Kitab Pasif (Skill Tomes) ---
  tome_block:      { name: 'Kitab Shield Block 📖',     type: 'tome', mats: { iron_ore: 10, wood_oak: 5, magic_shard: 1 }, gold: 2000 },
  tome_absorb:     { name: 'Kitab Divine Absorb 📖',    type: 'tome', mats: { ore_silver: 6, iron_ore: 6, magic_shard: 1 }, gold: 2000 },
  tome_mana_shield:{ name: 'Buku Mana Shield 📖',       type: 'tome', mats: { wood_ebony: 6, ore_silver: 4, magic_shard: 1 }, gold: 2000 },
  tome_favor:      { name: 'Kitab Divine Favor 📖',     type: 'tome', mats: { wood_oak: 8, stone_basic: 10, magic_shard: 1 }, gold: 2000 },
  tome_shadow:     { name: 'Kitab Shadow Assault 📖',   type: 'tome', mats: { wood_ebony: 4, ore_silver: 5, magic_shard: 1 }, gold: 2000 },
  tome_piercing:   { name: 'Panduan Eagle Eye 📖',       type: 'tome', mats: { wood_maple: 10, ore_copper: 5, magic_shard: 1 }, gold: 2000 },
  tome_frenzy:     { name: 'Kitab Frenzy 📖',           type: 'tome', mats: { wood_ebony: 5, iron_ore: 8, magic_shard: 1 }, gold: 2000 },
  tome_meditation: { name: 'Panduan Meditasi Chakra 📖', type: 'tome', mats: { wood_maple: 6, stone_basic: 12, magic_shard: 1 }, gold: 2000 }
};

// ================== EMOJI MAPS ==================

const FISH_EMOJI = {
  fish_common: '⚪', fish_uncommon: '🟢', fish_rare: '🔵',
  fish_epic: '🟣', fish_legendary: '🟡', fish_mythic: '🔴'
};
const WOOD_EMOJI = {
  wood_pine: '🪵', wood_oak: '🌿', wood_maple: '🍁',
  wood_ebony: '🖤', wood_dragon: '🔥'
};
const ORE_EMOJI = {
  stone_basic: '🪨', ore_copper: '🟤', iron_ore: '⚫',
  ore_silver: '🔵', ore_mythril: '💜', ore_adamantite: '🌟'
};

// ================== HELPERS ==================

function rollDrop(table) {
  const total = table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of table) {
    if (r < e.w) return e.key;
    r -= e.w;
  }
  return table[0].key;
}

function getToolTier(player, prefix) {
  if ((player.inventory[`${prefix}_pro`]  || 0) > 0) return 'pro';
  if ((player.inventory[`${prefix}_good`] || 0) > 0) return 'good';
  if ((player.inventory[`${prefix}_basic`]|| 0) > 0) return 'basic';
  return null;
}

// ================== MAIN HANDLER ==================

async function handleGatherCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  switch (cmd) {

    // ─────────────────────── FISHING ───────────────────────
    case 'fish':
    case 'fishing': {
      const now = Date.now();
      const last = player.mancingCooldown || 0;
      if (now - last < GATHER_CD) {
        return reply(sock, msg, `⏳ Kamu masih lelah memancing! Tunggu *${helpers.formatCooldown(GATHER_CD - (now - last))}* lagi.`);
      }

      const tier = getToolTier(player, 'rod');
      if (!tier) {
        return reply(sock, msg,
          `❌ Kamu tidak punya *pancingan*!\n\n` +
          `Beli di toko: *!buy rod_basic* (500💰)\n` +
          `Atau yang lebih bagus:\n` +
          `• *!buy rod_good* — Pancingan Baja (2.000💰)\n` +
          `• *!buy rod_pro* — Pancingan Mithril (8.000💰)`
        );
      }

      const drop = rollDrop(FISH_TABLE[tier]);
      const item = items[drop];
      const tierName = { basic: 'Bambu 🎣', good: 'Baja 🎣', pro: 'Mithril 🎣' }[tier];

      player.inventory[drop] = (player.inventory[drop] || 0) + 1;
      player.mancingCooldown = now;

      // Update stats
      player.gatherStats = player.gatherStats || { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 };
      player.gatherStats.totalMancing = (player.gatherStats.totalMancing || 0) + 1;

      // Daily Quest fish progress
      trackQuestProgress(player, 'fishProgress', 1);

      db.savePlayer(player);

      return reply(sock, msg,
        `🎣 *HASIL MANCING*\n` +
        `🔧 Alat: Pancingan ${tierName}\n` +
        `🗺️ Zona: ${player.zone === 'abandoned_mine' ? 'Abandoned Mine 🕳️' : (player.zone === 'dragon_valley' ? 'Dragon Valley 🐉' : 'Green Forest 🌲')}\n` +
        `────────────────────────\n` +
        `${FISH_EMOJI[drop] || '🐟'} Kamu mendapatkan:\n` +
        `   *1x ${item.name}*\n` +
        `   Harga jual: *${item.sellPrice.toLocaleString()} Gold*\n\n` +
        `💡 Jual dengan: *!sell ${drop} [jumlah/all]*\n` +
        `⏳ Cooldown: 2 menit`
      );
    }

    // ─────────────────────── CHOPPING ───────────────────────
    case 'chop':
    case 'woodcut': {
      const now = Date.now();
      const last = player.tebangCooldown || 0;
      if (now - last < GATHER_CD) {
        return reply(sock, msg, `⏳ Kapakmu masih tumpul! Tunggu *${helpers.formatCooldown(GATHER_CD - (now - last))}* lagi.`);
      }

      const tier = getToolTier(player, 'axe');
      if (!tier) {
        return reply(sock, msg,
          `❌ Kamu tidak punya *kapak*!\n\n` +
          `Beli di toko: *!buy axe_basic* (500💰)\n` +
          `Atau yang lebih bagus:\n` +
          `• *!buy axe_good* — Kapak Besi (2.000💰)\n` +
          `• *!buy axe_pro* — Kapak Mithril (8.000💰)`
        );
      }

      const zone = player.zone || 'green_forest';
      const woodPool = ZONE_WOOD_TABLE[zone] || ZONE_WOOD_TABLE.green_forest;
      const drop = rollDrop(woodPool[tier]);
      const item = items[drop];
      const tierName = { basic: 'Kayu 🪓', good: 'Besi 🪓', pro: 'Mithril 🪓' }[tier];

      player.inventory[drop] = (player.inventory[drop] || 0) + 1;
      player.tebangCooldown = now;

      // Update stats
      player.gatherStats = player.gatherStats || { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 };
      player.gatherStats.totalTebang = (player.gatherStats.totalTebang || 0) + 1;
      trackQuestProgress(player, 'chopProgress', 1);
      db.savePlayer(player);

      return reply(sock, msg,
        `🪓 *HASIL TEBANG POHON*\n` +
        `🔧 Alat: Kapak ${tierName}\n` +
        `🗺️ Zona: ${zone === 'abandoned_mine' ? 'Abandoned Mine 🕳️' : (zone === 'dragon_valley' ? 'Dragon Valley 🐉' : 'Green Forest 🌲')}\n` +
        `────────────────────────\n` +
        `${WOOD_EMOJI[drop] || '🪵'} Kamu mendapatkan:\n` +
        `   *1x ${item.name}*\n\n` +
        `💡 Gunakan kayu untuk craft: *!craft*\n` +
        `⏳ Cooldown: 2 menit`
      );
    }

    // ─────────────────────── MINING ───────────────────────
    case 'mine':
    case 'mining': {
      const now = Date.now();
      const last = player.tambangCooldown || 0;
      if (now - last < GATHER_CD) {
        return reply(sock, msg, `⏳ Cangkulmu perlu diasah! Tunggu *${helpers.formatCooldown(GATHER_CD - (now - last))}* lagi.`);
      }

      const tier = getToolTier(player, 'pickaxe');
      if (!tier) {
        return reply(sock, msg,
          `❌ Kamu tidak punya *cangkul/pickaxe*!\n\n` +
          `Beli di toko: *!buy pickaxe_basic* (500💰)\n` +
          `Atau yang lebih bagus:\n` +
          `• *!buy pickaxe_good* — Cangkul Besi (2.000💰)\n` +
          `• *!buy pickaxe_pro* — Cangkul Mithril (8.000💰)`
        );
      }

      const zone = player.zone || 'green_forest';
      const orePool = ZONE_ORE_TABLE[zone] || ZONE_ORE_TABLE.green_forest;
      const drop = rollDrop(orePool[tier]);
      const item = items[drop];
      const tierName = { basic: 'Kayu ⛏️', good: 'Besi ⛏️', pro: 'Mithril ⛏️' }[tier];

      player.inventory[drop] = (player.inventory[drop] || 0) + 1;
      player.tambangCooldown = now;

      // Update stats
      player.gatherStats = player.gatherStats || { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 };
      player.gatherStats.totalTambang = (player.gatherStats.totalTambang || 0) + 1;
      trackQuestProgress(player, 'mineProgress', 1);
      db.savePlayer(player);

      return reply(sock, msg,
        `⛏️ *HASIL TAMBANG*\n` +
        `🔧 Alat: Cangkul ${tierName}\n` +
        `🗺️ Zona: ${zone === 'abandoned_mine' ? 'Abandoned Mine 🕳️' : (zone === 'dragon_valley' ? 'Dragon Valley 🐉' : 'Green Forest 🌲')}\n` +
        `────────────────────────\n` +
        `${ORE_EMOJI[drop] || '🪨'} Kamu mendapatkan:\n` +
        `   *1x ${item.name}*\n\n` +
        `💡 Gunakan ore untuk craft: *!craft*\n` +
        `⏳ Cooldown: 2 menit`
      );
    }

    // ─────────────────────── SELL ───────────────────────
    case 'sell': {
      const itemKey = args[0]?.toLowerCase();
      const amountInput = args[1] || '1';

      if (!itemKey) {
        return reply(sock, msg,
          `🐟 *PASAR IKAN* 🐟\n` +
          `────────────────────────\n` +
          `Format: *!sell [key_ikan] [jumlah/all]*\n\n` +
          `📋 Daftar harga ikan:\n` +
          `• \`fish_common\` ⚪ → *30 Gold*\n` +
          `• \`fish_uncommon\` 🟢 → *120 Gold*\n` +
          `• \`fish_rare\` 🔵 → *500 Gold*\n` +
          `• \`fish_epic\` 🟣 → *2.000 Gold*\n` +
          `• \`fish_legendary\` 🟡 → *8.000 Gold*\n` +
          `• \`fish_mythic\` 🔴 → *30.000 Gold*`
        );
      }

      const item = items[itemKey];
      if (!item || item.type !== 'fish') {
        return reply(sock, msg, `❌ *${itemKey}* bukan ikan! Hanya ikan yang bisa dijual di pasar.\nKetik *!sell* untuk melihat daftar ikan.`);
      }

      const qty = player.inventory[itemKey] || 0;
      if (qty <= 0) {
        return reply(sock, msg, `❌ Kamu tidak punya *${item.name}* di inventory!`);
      }

      const sellQty = amountInput === 'all' ? qty : Math.min(qty, parseInt(amountInput) || 1);
      if (sellQty <= 0) return reply(sock, msg, `❌ Jumlah tidak valid.`);
      
      const totalGold = item.sellPrice * sellQty;

      player.inventory[itemKey] -= sellQty;
      if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
      player.gold += totalGold;
      db.savePlayer(player);

      return reply(sock, msg,
        `💰 *IKAN TERJUAL!*\n` +
        `────────────────────────\n` +
        `${FISH_EMOJI[itemKey] || '🐟'} *${item.name}* x${sellQty}\n` +
        `💵 Harga: *${item.sellPrice.toLocaleString()} Gold / ekor*\n` +
        `💰 *Total: +${totalGold.toLocaleString()} Gold*\n\n` +
        `👛 Saldo sekarang: *${player.gold.toLocaleString()} Gold*`
      );
    }

    // ─────────────────────── CRAFT ───────────────────────
    case 'craft': {
      const recipeKey = args[0]?.toLowerCase();

      if (!recipeKey) {
        // Tampilkan semua resep
        let out = `🔨 *CRAFTING WORKSHOP* 🔨\n────────────────────────\n`;
        out += `Format: *!craft [nama_item]*\n\n`;

        out += `🗡️ *SENJATA (Weapons):*\n`;
        for (const [key, r] of Object.entries(RECIPES).filter(([,r]) => r.type === 'weapon')) {
          const mats = Object.entries(r.mats).map(([k, v]) => `${v}x ${items[k]?.name || k}`).join(', ');
          out += `• *!craft ${key}*\n  📦 ${mats} + ${r.gold.toLocaleString()}💰\n`;
        }

        out += `\n🛡️ *ZIRAH (Armor):*\n`;
        for (const [key, r] of Object.entries(RECIPES).filter(([,r]) => r.type === 'armor')) {
          const mats = Object.entries(r.mats).map(([k, v]) => `${v}x ${items[k]?.name || k}`).join(', ');
          out += `• *!craft ${key}*\n  📦 ${mats} + ${r.gold.toLocaleString()}💰\n`;
        }

        out += `\n💡 Dapatkan material dari *!fish*, *!chop*, *!mine*`;
        return reply(sock, msg, out);
      }

      const recipe = RECIPES[recipeKey];
      if (!recipe) {
        return reply(sock, msg, `❌ Resep *${recipeKey}* tidak ditemukan!\nKetik *!craft* untuk melihat semua resep.`);
      }

      // Cek gold
      if (player.gold < recipe.gold) {
        return reply(sock, msg,
          `❌ Gold tidak cukup!\n` +
          `💰 Butuh: *${recipe.gold.toLocaleString()} Gold*\n` +
          `👛 Punya: *${player.gold.toLocaleString()} Gold*`
        );
      }

      // Cek material
      const missing = [];
      for (const [k, qty] of Object.entries(recipe.mats)) {
        const have = player.inventory[k] || 0;
        if (have < qty) missing.push(`${qty}x ${items[k]?.name || k} *(punya: ${have})*`);
      }

      if (missing.length > 0) {
        return reply(sock, msg,
          `❌ *Bahan kurang untuk craft ${recipe.name}!*\n\n` +
          `📦 Kekurangan:\n• ${missing.join('\n• ')}\n\n` +
          `💡 Kumpulkan bahan dari *!fish*, *!chop*, *!mine*`
        );
      }

      // Konsumsi semua material & gold
      for (const [k, qty] of Object.entries(recipe.mats)) {
        player.inventory[k] -= qty;
        if (player.inventory[k] <= 0) delete player.inventory[k];
      }
      player.gold -= recipe.gold;
      player.inventory[recipeKey] = (player.inventory[recipeKey] || 0) + 1;
      
      // Update stats
      player.gatherStats = player.gatherStats || { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 };
      player.gatherStats.totalCraft = (player.gatherStats.totalCraft || 0) + 1;
      
      db.savePlayer(player);

      const matList = Object.entries(recipe.mats)
        .map(([k, v]) => `${v}x ${items[k]?.name || k}`)
        .join(', ');

      return reply(sock, msg,
        `🔨 *CRAFT BERHASIL!* 🎉\n` +
        `────────────────────────\n` +
        `✅ *${recipe.name}* berhasil dibuat!\n\n` +
        `📦 Material: ${matList}\n` +
        `💰 Biaya: -${recipe.gold.toLocaleString()} Gold\n` +
        `👛 Sisa Gold: *${player.gold.toLocaleString()} Gold*\n\n` +
        `💡 Pakai dengan: *!equip ${recipeKey}*`
      );
    }
    // ─────────────────────── BREW (RAMU POTION) ───────────────────────
    case 'brew': {
      const BREW_RECIPES = {
        potion: { name: "Health Potion 🧪", mats: { wood_pine: 3, stone_basic: 1 }, gold: 20 },
        super_potion: { name: "Super Potion 💊", mats: { wood_oak: 3, ore_copper: 1, potion: 1 }, gold: 60 },
        ether: { name: "Ether 💙", mats: { wood_pine: 3, ore_copper: 1 }, gold: 40 },
        elixir: { name: "Elixir 🌟", mats: { wood_dragon: 2, ore_adamantite: 2, magic_shard: 1 }, gold: 800 }
      };

      const recipeKey = args[0]?.toLowerCase();

      if (!recipeKey) {
        let out = `🧪 *ALALCHEMY BREWING WORKSHOP* 🧪\n────────────────────────\n`;
        out += `Format: *!brew [key_ramuan]*\n\n`;
        out += `📋 *Daftar Resep Ramuan:*\n`;
        for (const [key, r] of Object.entries(BREW_RECIPES)) {
          const mats = Object.entries(r.mats).map(([k, v]) => `${v}x ${items[k]?.name || k}`).join(', ');
          out += `• *!brew ${key}*\n  📦 ${mats} + ${r.gold.toLocaleString()}💰\n`;
        }
        out += `\n💡 Ramuan berguna untuk memulihkan HP & MP saat pertarungan dungeon/boss!`;
        return reply(sock, msg, out);
      }

      const recipe = BREW_RECIPES[recipeKey];
      if (!recipe) {
        return reply(sock, msg, `❌ Resep ramuan *${recipeKey}* tidak ditemukan!\nKetik *!brew* untuk melihat semua daftar resep.`);
      }

      // Cek gold
      if (player.gold < recipe.gold) {
        return reply(sock, msg, `❌ Gold tidak cukup! Butuh *${recipe.gold} Gold*, kamu hanya punya *${player.gold} Gold*.`);
      }

      // Cek material
      const missing = [];
      for (const [k, qty] of Object.entries(recipe.mats)) {
        const have = player.inventory[k] || 0;
        if (have < qty) missing.push(`${qty}x ${items[k]?.name || k} *(punya: ${have})*`);
      }

      if (missing.length > 0) {
        return reply(sock, msg,
          `❌ *Bahan kurang untuk meramu ${recipe.name}!*\n\n` +
          `📦 Kekurangan:\n• ${missing.join('\n• ')}`
        );
      }

      // Konsumsi material & gold
      for (const [k, qty] of Object.entries(recipe.mats)) {
        player.inventory[k] -= qty;
        if (player.inventory[k] <= 0) delete player.inventory[k];
      }
      player.gold -= recipe.gold;
      player.inventory[recipeKey] = (player.inventory[recipeKey] || 0) + 1;
      db.savePlayer(player);

      const matList = Object.entries(recipe.mats)
        .map(([k, v]) => `${v}x ${items[k]?.name || k}`)
        .join(', ');

      return reply(sock, msg,
        `🧪 *RAMUAN BERHASIL DIRAMU!* 🎉\n` +
        `────────────────────────\n` +
        `✅ *${recipe.name}* berhasil dibuat!\n\n` +
        `📦 Material: ${matList}\n` +
        `💰 Biaya: -${recipe.gold.toLocaleString()} Gold\n` +
        `👛 Sisa Gold: *${player.gold.toLocaleString()} Gold*\n\n` +
        `💡 Gunakan ramuan dengan: *!use ${recipeKey}*`
      );
    }
  }
}

module.exports = { handleGatherCommands };
