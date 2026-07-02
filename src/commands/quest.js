// ================== QUEST & ACHIEVEMENT SYSTEM ==================

const db = require('../database/db');
const classes = require('../rpg/classes');

const DAILY_QUEST = {
  huntsNeeded: 5,
  fishNeeded: 3,
  rewards: {
    exp: 500,
    gold: 300,
    items: {
      iron_ore: 3,
      magic_shard: 1
    }
  }
};

const ACHIEVEMENTS = [
  {
    id: "hunter_1",
    name: "Monster Hunter I ⚔️",
    desc: "Kalahkan 10 monster.",
    check: (p) => (p.battleStats?.monstersKilled || 0) >= 10,
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
    desc: "Kalahkan 50 monster.",
    check: (p) => (p.battleStats?.monstersKilled || 0) >= 50,
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
    desc: "Kalahkan 200 monster.",
    check: (p) => (p.battleStats?.monstersKilled || 0) >= 200,
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
    desc: "Mancing 10 kali.",
    check: (p) => (p.gatherStats?.totalMancing || 0) >= 10,
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
    desc: "Mancing 50 kali.",
    check: (p) => (p.gatherStats?.totalMancing || 0) >= 50,
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
    desc: "Craft 5 equipment.",
    check: (p) => (p.gatherStats?.totalCraft || 0) >= 5,
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
    desc: "Craft 20 equipment.",
    check: (p) => (p.gatherStats?.totalCraft || 0) >= 20,
    rewardDesc: "+6 INT, +6 VIT",
    grant: (p) => {
      p.achievementStats = p.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
      p.achievementStats.int += 6;
      p.achievementStats.vit += 6;
    }
  }
];

async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleQuestCommands(sock, msg, cmd, args, userId) {
  const player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  const todayStr = new Date().toISOString().slice(0, 10);
  player.dailyQuest = player.dailyQuest || { date: "", huntProgress: 0, fishProgress: 0, claimed: false };
  
  if (player.dailyQuest.date !== todayStr) {
    player.dailyQuest = { date: todayStr, huntProgress: 0, fishProgress: 0, claimed: false };
    db.savePlayer(player);
  }

  if (cmd === 'quest' || cmd === 'misi') {
    const sub = args[0]?.toLowerCase();

    if (sub === 'claim' || sub === 'ambil') {
      if (player.dailyQuest.claimed) {
        return reply(sock, msg, `❌ Kamu sudah mengklaim hadiah misi harian hari ini! Silakan tunggu besok.`);
      }

      const isCompleted = 
        player.dailyQuest.huntProgress >= DAILY_QUEST.huntsNeeded &&
        player.dailyQuest.fishProgress >= DAILY_QUEST.fishNeeded;

      if (!isCompleted) {
        return reply(sock, msg, `❌ Misi harianmu belum selesai! Selesaikan target sebelum mengklaim.`);
      }

      // Berikan rewards
      player.dailyQuest.claimed = true;
      player.exp += DAILY_QUEST.rewards.exp;
      player.gold += DAILY_QUEST.rewards.gold;
      
      let rewardText = `🎁 *HADIAH MISI HARIAN KLAIMED!* 🎉\n────────────────────────\n`;
      rewardText += `• EXP: *+${DAILY_QUEST.rewards.exp} EXP*\n`;
      rewardText += `• Gold: *+${DAILY_QUEST.rewards.gold} Gold*\n`;
      
      for (const [itemKey, qty] of Object.entries(DAILY_QUEST.rewards.items)) {
        player.inventory[itemKey] = (player.inventory[itemKey] || 0) + qty;
        rewardText += `• Item: *+${qty}x ${itemKey.replace('_', ' ')}*\n`;
      }

      // Check level up
      const helpers = require('../utils/helpers');
      const isLvlUp = helpers.checkLevelUp(player);
      if (isLvlUp) {
        rewardText += `\n🌟 *LEVEL UP!* Sekarang kamu mencapai *Level ${player.level}*! Poin stat bertambah +5.`;
      }

      db.savePlayer(player);
      return reply(sock, msg, rewardText);
    }

    // Tampilkan detail Misi Harian
    const hProg = Math.min(DAILY_QUEST.huntsNeeded, player.dailyQuest.huntProgress || 0);
    const fProg = Math.min(DAILY_QUEST.fishNeeded, player.dailyQuest.fishProgress || 0);
    
    const hStatus = hProg >= DAILY_QUEST.huntsNeeded ? "✅" : "⏳";
    const fStatus = fProg >= DAILY_QUEST.fishNeeded ? "✅" : "⏳";

    let text = `🎯 *MISI HARIAN RPG* 🎯\nTanggal: *${todayStr}*\n────────────────────────\n`;
    text += `${hStatus} Hunt Monster: *(${hProg}/${DAILY_QUEST.huntsNeeded})*\n`;
    text += `${fStatus} Memancing Ikan: *(${fProg}/${DAILY_QUEST.fishNeeded})*\n\n`;
    
    text += `🎁 *Hadiah:* \n`;
    text += `• *${DAILY_QUEST.rewards.exp} EXP*\n`;
    text += `• *${DAILY_QUEST.rewards.gold} Gold*\n`;
    text += `• *3x Bijih Besi (Iron Ore)*\n`;
    text += `• *1x Kristal Sihir (Magic Shard)*\n\n`;

    if (hProg >= DAILY_QUEST.huntsNeeded && fProg >= DAILY_QUEST.fishNeeded) {
      if (player.dailyQuest.claimed) {
        text += `🎉 Misi hari ini selesai dan hadiah sudah diambil!`;
      } else {
        text += `✨ *Misi selesai!* Ketik *!quest claim* untuk mengambil hadiah.`;
      }
    } else {
      text += `💡 Lakukan *!hunt* dan *!mancing* untuk menyelesaikan target misi harian!`;
    }
    
    return reply(sock, msg, text);
  }

  if (cmd === 'achievement' || cmd === 'pencapaian') {
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

module.exports = { handleQuestCommands, DAILY_QUEST, ACHIEVEMENTS };
