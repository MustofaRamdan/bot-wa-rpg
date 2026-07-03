// ================== QUEST & ACHIEVEMENT SYSTEM ==================

const db = require('../database/db');
const classes = require('../rpg/classes');

const DAILY_QUEST = {
  huntsNeeded: 8,
  fishNeeded: 5,
  rewards: {
    exp: 350,
    gold: 180,
    items: {
      iron_ore: 2,
      magic_shard: 1
    }
  }
};

const QUEST_TEMPLATES = [
  {
    type: "hunter",
    name: "Monster Slayer ⚔️",
    desc: "Buru monster liar untuk mengamankan wilayah sekitar.",
    targetKey: "huntProgress",
    targetQty: 10,
    rewards: { exp: 400, gold: 200, items: { leather_scrap: 2 } }
  },
  {
    type: "angler",
    name: "Master Angler 🎣",
    desc: "Mancing ikan di danau terdekat untuk persediaan ransum.",
    targetKey: "fishProgress",
    targetQty: 6,
    rewards: { exp: 200, gold: 450, items: { potion: 2 } }
  },
  {
    type: "gatherer",
    name: "Resource Gatherer ⛏️🪵",
    desc: "Kumpulkan kayu & bijih besi untuk keperluan Blacksmith.",
    targetKeys: { chopProgress: 4, mineProgress: 4 },
    rewards: { exp: 300, gold: 300, items: { iron_ore: 2, magic_shard: 1 } }
  }
];

const ACHIEVEMENTS = [
  {
    id: "hunter_1",
    name: "Monster Hunter I ⚔️",
    desc: "Kalahkan 25 monster.",
    check: (p) => (p.battleStats?.monstersKilled || 0) >= 25,
    rewardDesc: "+2 STR, +2 VIT",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.str += 2;
      p.achievementStats.vit += 2;
    }
  },
  {
    id: "hunter_2",
    name: "Monster Hunter II ☠️",
    desc: "Kalahkan 150 monster.",
    check: (p) => (p.battleStats?.monstersKilled || 0) >= 150,
    rewardDesc: "+5 STR, +5 VIT",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.str += 5;
      p.achievementStats.vit += 5;
    }
  },
  {
    id: "hunter_3",
    name: "Monster Hunter III 🐉",
    desc: "Kalahkan 500 monster.",
    check: (p) => (p.battleStats?.monstersKilled || 0) >= 500,
    rewardDesc: "+15 STR, +15 VIT",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.str += 15;
      p.achievementStats.vit += 15;
    }
  },
  {
    id: "angler_1",
    name: "Angler Beginner 🎣",
    desc: "Mancing 25 kali.",
    check: (p) => (p.gatherStats?.totalMancing || 0) >= 25,
    rewardDesc: "+2 AGI, +2 DEX",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.agi += 2;
      p.achievementStats.dex += 2;
    }
  },
  {
    id: "angler_2",
    name: "Angler Expert 🐠",
    desc: "Mancing 150 kali.",
    check: (p) => (p.gatherStats?.totalMancing || 0) >= 150,
    rewardDesc: "+5 AGI, +5 DEX",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.agi += 5;
      p.achievementStats.dex += 5;
    }
  },
  {
    id: "smith_1",
    name: "Novice Blacksmith 🔨",
    desc: "Craft 15 equipment.",
    check: (p) => (p.gatherStats?.totalCraft || 0) >= 15,
    rewardDesc: "+2 INT, +2 VIT",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.int += 2;
      p.achievementStats.vit += 2;
    }
  },
  {
    id: "smith_2",
    name: "Grand Artisan 🌋",
    desc: "Craft 50 equipment.",
    check: (p) => (p.gatherStats?.totalCraft || 0) >= 50,
    rewardDesc: "+6 INT, +6 VIT",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.int += 6;
      p.achievementStats.vit += 6;
    }
  }
];

function initDailyQuest(player, todayStr) {
  const template = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
  player.dailyQuest = {
    date: todayStr,
    type: template.type,
    name: template.name,
    desc: template.desc,
    claimed: false,
    huntProgress: 0,
    fishProgress: 0,
    chopProgress: 0,
    mineProgress: 0,
    targetKey: template.targetKey || null,
    targetQty: template.targetQty || null,
    targetKeys: template.targetKeys || null,
    rewards: template.rewards
  };
}

function trackQuestProgress(player, progressKey, amount = 1) {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  if (!player.dailyQuest || player.dailyQuest.date !== todayStr) {
    initDailyQuest(player, todayStr);
  }
  
  const q = player.dailyQuest;
  if (!q.claimed) {
    q[progressKey] = (q[progressKey] || 0) + amount;
  }
}

async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleQuestCommands(sock, msg, cmd, args, userId) {
  const player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  const todayStr = new Date().toISOString().slice(0, 10);
  player.dailyQuest = player.dailyQuest || { date: "", claimed: false };
  
  if (player.dailyQuest.date !== todayStr || !player.dailyQuest.type) {
    initDailyQuest(player, todayStr);
    db.savePlayer(player);
  }

  const items = require('../config/items');

  if (cmd === 'quest') {
    const sub = args[0]?.toLowerCase();
    const q = player.dailyQuest;

    let isCompleted = false;
    if (q.type === 'hunter' || q.type === 'angler') {
      const prog = q[q.targetKey] || 0;
      isCompleted = prog >= q.targetQty;
    } else if (q.type === 'gatherer') {
      const chopProg = q.chopProgress || 0;
      const mineProg = q.mineProgress || 0;
      const chopTarget = q.targetKeys.chopProgress;
      const mineTarget = q.targetKeys.mineProgress;
      isCompleted = chopProg >= chopTarget && mineProg >= mineTarget;
    }

    if (sub === 'claim') {
      if (q.claimed) {
        return reply(sock, msg, `❌ Kamu sudah mengklaim hadiah misi harian hari ini! Silakan tunggu besok.`);
      }

      if (!isCompleted) {
        return reply(sock, msg, `❌ Misi harianmu belum selesai! Selesaikan target sebelum mengklaim.`);
      }

      // Berikan rewards
      q.claimed = true;
      player.exp += q.rewards.exp;
      player.gold += q.rewards.gold;
      
      let rewardText = `🎁 *HADIAH DAILY QUEST DIKLAIM!* 🎉\n────────────────────────\n`;
      rewardText += `• EXP: *+${q.rewards.exp} EXP*\n`;
      rewardText += `• Gold: *+${q.rewards.gold} Gold*\n`;
      
      for (const [itemKey, qty] of Object.entries(q.rewards.items)) {
        player.inventory[itemKey] = (player.inventory[itemKey] || 0) + qty;
        rewardText += `• Item: *+${qty}x ${items[itemKey]?.name || itemKey}*\n`;
      }

      // Check level up
      const helpers = require('../utils/helpers');
      const isLvlUp = helpers.checkLevelUp(player);
      if (isLvlUp) {
        rewardText += `\n🌟 *LEVEL UP!* Sekarang kamu mencapai *Level ${player.level}*! Poin stat bertambah +3.`;
      }

      db.savePlayer(player);
      return reply(sock, msg, rewardText);
    }

    // Tampilkan detail Misi Harian
    let text = `🎯 *DAILY QUEST: ${q.name}* 🎯\nTanggal: *${q.date}*\n`;
    text += `Deskripsi: _${q.desc}_\n`;
    text += `────────────────────────\n`;

    if (q.type === 'hunter' || q.type === 'angler') {
      const prog = q[q.targetKey] || 0;
      const target = q.targetQty;
      const status = prog >= target ? "✅" : "⏳";
      text += `${status} Progres: *(${Math.min(prog, target)}/${target})*\n\n`;
    } else if (q.type === 'gatherer') {
      const chopProg = q.chopProgress || 0;
      const mineProg = q.mineProgress || 0;
      const chopTarget = q.targetKeys.chopProgress;
      const mineTarget = q.targetKeys.mineProgress;
      const chopStatus = chopProg >= chopTarget ? "✅" : "⏳";
      const mineStatus = mineProg >= mineTarget ? "✅" : "⏳";
      
      text += `${chopStatus} Chop Wood: *(${Math.min(chopProg, chopTarget)}/${chopTarget})*\n`;
      text += `${mineStatus} Mine Ore: *(${Math.min(mineProg, mineTarget)}/${mineTarget})*\n\n`;
    }
    
    text += `🎁 *Hadiah:* \n`;
    text += `• *${q.rewards.exp} EXP*\n`;
    text += `• *${q.rewards.gold} Gold*\n`;
    for (const [itemKey, qty] of Object.entries(q.rewards.items)) {
      text += `• *${qty}x ${items[itemKey]?.name || itemKey}*\n`;
    }
    text += `\n`;

    if (isCompleted) {
      if (q.claimed) {
        text += `🎉 Misi hari ini selesai dan hadiah sudah diambil!`;
      } else {
        text += `✨ *Misi selesai!* Ketik *!quest claim* untuk mengambil hadiah.`;
      }
    } else {
      if (q.type === 'hunter') {
        text += `💡 Lakukan *!hunt* untuk menyelesaikan target misi harian!`;
      } else if (q.type === 'angler') {
        text += `💡 Lakukan *!fish* untuk menyelesaikan target misi harian!`;
      } else {
        text += `💡 Lakukan *!chop* dan *!mine* untuk menyelesaikan target misi harian!`;
      }
    }
    
    return reply(sock, msg, text);
  }

  if (cmd === 'achievement') {
    player.achievementsClaimed = player.achievementsClaimed || [];
    player.achievementStats = player.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
    player.gatherStats = player.gatherStats || { totalMancing: 0, totalTebang: 0, totalTambang: 0, totalCraft: 0 };

    let text = `🏆 *PENCAPAIAN (ACHIEVEMENT) RPG* 🏆\n────────────────────────\n`;
    text += `ℹ️ _Achievement memberikan bonus stat permanen jika berhasil dicapai (auto-claim saat kamu membuka menu ini)._\n\n`;

    let claimedNew = false;
    let newlyClaimedNames = [];

    for (const ach of ACHIEVEMENTS) {
      const isClaimed = player.achievementsClaimed.includes(ach.id);
      const canClaim = ach.check(player);

      let status = "❌ Belum";
      if (isClaimed) {
        status = "✅ Selesai";
      } else if (canClaim) {
        // Auto claim
        player.achievementsClaimed.push(ach.id);
        ach.grant(player);
        claimedNew = true;
        newlyClaimedNames.push(ach.name);
        status = "✨ Baru Diselesaikan!";
      }

      text += `*${ach.name}*\n`;
      text += `• Target: _${ach.desc}_\n`;
      text += `• Reward: *${ach.rewardDesc}*\n`;
      text += `• Status: ${status}\n\n`;
    }

    if (claimedNew) {
      db.savePlayer(player);
      text += `🎉 *SELAMAT!* Kamu membuka pencapaian baru:\n`;
      text += `• ${newlyClaimedNames.join('\n• ')}\n\n`;
      text += `💪 Bonus stat permanen telah ditambahkan ke profilmu!`;
    } else {
      text += `📊 *Stat Bonus Permanen Aktif saat ini:*\n`;
      text += `• STR: +${player.achievementStats.str || 0} | INT: +${player.achievementStats.int || 0} | VIT: +${player.achievementStats.vit || 0}\n`;
      text += `• AGI: +${player.achievementStats.agi || 0} | DEX: +${player.achievementStats.dex || 0}\n\n`;
      text += `💡 Terus hunt, mancing, dan craft untuk membuka pencapaian lainnya!`;
    }

    return reply(sock, msg, text);
  }
}

module.exports = { handleQuestCommands, DAILY_QUEST, ACHIEVEMENTS, trackQuestProgress };
