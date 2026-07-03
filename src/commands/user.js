// ================== USER COMMAND HANDLERS ==================

const db = require('../database/db');
const classes = require('../rpg/classes');
const combat = require('../rpg/combat');
const helpers = require('../utils/helpers');
const items = require('../config/items');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

// Handler Utama untuk User Commands
async function handleUserCommands(sock, msg, cmd, args, userId, pushName) {
  let player = db.getPlayer(userId);

  switch (cmd) {
    case 'register':
    case 'daftar': {
      if (player.job) {
        return reply(sock, msg, `❌ Kamu sudah terdaftar sebagai *${classes.jobs[player.job].name}*!`);
      }

      const basicJobs = ['warrior', 'paladin', 'mage', 'cleric', 'rogue', 'archer', 'berserker', 'monk'];
      const jobKey = args[0]?.toLowerCase();
      if (!jobKey || !basicJobs.includes(jobKey)) {
        let listJobs = "📝 *PILIHAN JOB RPG (Ketik !register [nama_job])*:\n\n";
        for (const key of basicJobs) {
          const job = classes.jobs[key];
          if (job) {
            listJobs += `• *${job.name}* (Key: \`${key}\`)\n  _${job.description}_\n`;
          }
        }
        return reply(sock, msg, listJobs);
      }

      const jobConfig = classes.jobs[jobKey];
      player.job = jobKey;
      player.name = pushName || player.name;
      
      // Hitung stats awal berdasarkan baseStats job
      player.hp = classes.getMaxHp(1, jobConfig.baseStats.vit);
      player.mp = classes.getMaxMp(1, jobConfig.baseStats.int);
      
      db.savePlayer(player);
      
      return reply(sock, msg, `🎉 Selamat *${player.name}*, kamu berhasil mendaftar sebagai *${jobConfig.name}*!\nKetik *!profile* untuk melihat stat-mu, atau *!hunt* untuk mulai berburu!`);
    }

    case 'profile':
    case 'me': {
      let targetId = userId;
      let targetPlayer = player;
      
      // Ambil mention jika ada
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.length > 0) {
        targetId = mentions[0].split('@')[0];
        targetPlayer = db.getPlayer(targetId);
      }

      if (!targetPlayer.job) {
        return reply(sock, msg, `❌ Player tersebut belum terdaftar. Ketik *!register* untuk memulai.`);
      }

      const pStats = combat.getDerivedStats(targetPlayer);
      const jobName = classes.jobs[targetPlayer.job]?.name || targetPlayer.job;
      
      // Normalisasi equipment: bisa berupa string (key lama) atau objek {key, level}
      const wObj = targetPlayer.equipment.weapon;
      const aObj = targetPlayer.equipment.armor;
      const wKey = wObj ? (typeof wObj === 'string' ? wObj : wObj.key) : null;
      const aKey = aObj ? (typeof aObj === 'string' ? aObj : aObj.key) : null;
      const wLvl = wObj && typeof wObj === 'object' ? (wObj.level || 0) : 0;
      const aLvl = aObj && typeof aObj === 'object' ? (aObj.level || 0) : 0;
      const weaponName = wKey ? `${items[wKey]?.name || wKey}${wLvl > 0 ? ` +${wLvl}` : ''}` : "None";
      const armorName  = aKey ? `${items[aKey]?.name  || aKey }${aLvl > 0 ? ` +${aLvl}` : ''}` : "None";
      const petName = pStats.activePet ? `${pStats.activePet.name} [Tier ${pStats.activePet.tier}]` : "None";
      const expNeeded = classes.getExpNeeded(targetPlayer.level);
      
      const guildInfo = targetPlayer.guild ? (db.getGuild(targetPlayer.guild)?.name || "None") : "None";

      const passiveNames = {
        shield_block: "Shield Block 🛡️",
        divine_absorb: "Divine Absorb ✨",
        mana_shield: "Mana Shield 🔮",
        divine_favor: "Divine Favor 💚",
        shadow_assault: "Shadow Assault 💨",
        armor_piercing: "Eagle Eye 🎯",
        low_hp_frenzy: "Frenzy 🩸",
        chakra_meditation: "Chakra Meditation 🧘"
      };

      const unlockedPassives = targetPlayer.unlockedPassives || [];
      const passivesList = unlockedPassives.length > 0
        ? unlockedPassives.map(k => passiveNames[k] || k).join(', ')
        : "Belum mempelajari kitab pasif 📖";

      const profileMsg = 
`👤 *PROFIL RPG: ${targetPlayer.name}*
────────────────────────
*Job:* ${jobName} (Lv. ${targetPlayer.level})
🏛 *Guild:* ${guildInfo}
❤️ *HP:* ${targetPlayer.hp}/${pStats.maxHp}
💙 *MP:* ${targetPlayer.mp}/${pStats.maxMp}
✨ *EXP:* ${targetPlayer.exp.toLocaleString()} / ${expNeeded.toLocaleString()} (${Math.round((targetPlayer.exp / expNeeded) * 100)}%)
💰 *Gold:* ${targetPlayer.gold} 🪙 | *Bank:* ${targetPlayer.bank} 🪙
🎒 *Equip:* 🗡️ ${weaponName} | 🛡️ ${armorName}
🐾 *Pet Aktif:* ${petName}
📖 *Pasif Terbuka:* ${passivesList}

📊 *STATUS RPG:*
• 💪 STR: ${pStats.str} (Fisik ATK +${pStats.patk})
• 🧠 INT: ${pStats.int} (Magis ATK +${pStats.matk})
• 🛡️ VIT: ${pStats.vit} (Defense +${pStats.pdef})
• ⚡ AGI: ${pStats.agi} (Crit ${pStats.critRate}% | Eva ${pStats.evasionRate}%)
• 🎯 DEX: ${pStats.dex} (Akurasi ${pStats.accuracy}%)

✨ *Stat Points Tersisa:* ${targetPlayer.statPoints} Poin
_${targetPlayer.statPoints > 0 ? "Ketik *!stat_add [str/int/vit/agi/dex] [jumlah]* untuk menaikkan status!" : ""}_`;

      return reply(sock, msg, profileMsg);
    }

    case 'stats': {
      if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register*!`);
      const s = player.battleStats;
      const totalHunts = s.totalHunts || 0;
      const totalWins = s.totalWins || 0;
      const winRate = totalHunts > 0 ? Math.round((totalWins / totalHunts) * 100) : 0;

      const statsMsg = 
`📊 *STATISTIK PETUALANGAN: ${player.name}*
────────────────────────
⚔️ *Total Berburu:* ${totalHunts}x
🏆 *Kemenangan:* ${totalWins}x
💀 *Kekalahan:* ${s.totalLosses || 0}x
📈 *Win Rate:* ${winRate}%
👹 *Monster Dikalahkan:* ${s.monstersKilled || 0} ekor
🕳️ *Dungeon Selesai:* ${s.dungeonsCompleted || 0}x
🐲 *Total Damage World Boss:* ${s.worldBossDamage || 0} damage`;

      return reply(sock, msg, statsMsg);
    }

    case 'stat_add':
    case 'upstat': {
      if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register*!`);
      if (player.statPoints <= 0) return reply(sock, msg, `❌ Kamu tidak memiliki Stat Points tersisa!`);

      const statType = args[0]?.toLowerCase();
      const amount = parseInt(args[1]) || 1;

      if (!['str', 'int', 'vit', 'agi', 'dex'].includes(statType)) {
        return reply(sock, msg, `❌ Format: *!stat_add [str/int/vit/agi/dex] [jumlah]*\nContoh: *!stat_add str 5*`);
      }

      if (amount <= 0 || isNaN(amount)) {
        return reply(sock, msg, `❌ Jumlah penambahan stat tidak valid.`);
      }

      if (amount > player.statPoints) {
        return reply(sock, msg, `❌ Poin kamu tidak cukup! Kamu hanya memiliki *${player.statPoints}* Stat Points.`);
      }

      // Biaya alokasi stat setelah level 10, 20, dan 35
      let goldCost = 0;
      if (player.level >= 35) {
        goldCost = amount * 150;
      } else if (player.level >= 20) {
        goldCost = amount * 80;
      } else if (player.level >= 10) {
        goldCost = amount * 30;
      }

      if (goldCost > 0 && player.gold < goldCost) {
        return reply(sock, msg, `❌ Gold tidak cukup! Mengalokasikan stat di level ${player.level} membutuhkan *${goldCost} Gold* (Gold kamu: *${player.gold} Gold*).`);
      }

      player.stats[statType] = (player.stats[statType] || 0) + amount;
      player.statPoints -= amount;
      
      if (goldCost > 0) {
        player.gold -= goldCost;
      }
      
      // Update HP/MP penuh jika VIT atau INT dinaikkan
      const pStats = combat.getDerivedStats(player);
      if (statType === 'vit') player.hp = pStats.maxHp;
      if (statType === 'int') player.mp = pStats.maxMp;

      db.savePlayer(player);
      
      let successMsg = `✅ Berhasil meningkatkan *${statType.toUpperCase()} +${amount}*!`;
      if (goldCost > 0) {
        successMsg += ` (Membayar *-${goldCost} Gold* 🪙)`;
      }
      successMsg += `\nSisa Stat Points: *${player.statPoints}*`;
      
      return reply(sock, msg, successMsg);
    }

    case 'daily': {
      if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register*!`);
      const now = Date.now();
      const lastDaily = player.lastDaily || 0;
      const cooldownMs = 24 * 60 * 60 * 1000; // 24 jam

      if (now - lastDaily < cooldownMs) {
        const timeLeft = cooldownMs - (now - lastDaily);
        return reply(sock, msg, `⏳ Hadiah harian belum siap! Silakan ambil dalam *${helpers.formatCooldown(timeLeft)}* lagi.`);
      }

      // Bonus Beruntun (Streak)
      const isConsecutive = (now - lastDaily) < (cooldownMs * 2);
      if (!player.battleStats.dailyStreak) player.battleStats.dailyStreak = 0;
      
      if (isConsecutive) {
        player.battleStats.dailyStreak++;
      } else {
        player.battleStats.dailyStreak = 1;
      }

      const streak = player.battleStats.dailyStreak;
      const baseGold = 80; // Dikurangi dari 150
      const bonusGold = Math.min(streak * 10, 200); // Dikurangi dari 20 Gold per streak dan max 400 → 10 Gold per streak dan max 200

      player.gold += totalGold = baseGold + bonusGold;
      player.lastDaily = now;

      // Drop item acak
      const dailyItems = ["potion", "super_potion", "ether", "iron_ore", "leather_scrap"];
      const randomItemKey = dailyItems[Math.floor(Math.random() * dailyItems.length)];
      player.inventory[randomItemKey] = (player.inventory[randomItemKey] || 0) + 1;

      db.savePlayer(player);

      const dailyMsg = 
`🎁 *DAILY REWARDS CLAIMED!*
────────────────────────
💰 *Gold Didapatkan:* +${totalGold} Gold 🪙
📦 *Bonus Item:* 1x ${items[randomItemKey].name}
🔥 *Streak Harian:* ${streak} hari
✨ *Bonus Streak:* +${bonusGold} Gold`;

      return reply(sock, msg, dailyMsg);
    }

    case 'promote':
    case 'promosi': {
      if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register*!`);
      
      const mKilled = player.battleStats?.monstersKilled || 0;
      const dCompleted = player.battleStats?.dungeonsCompleted || 0;

      if (player.level < 30) {
        return reply(sock, msg, `❌ Kamu butuh *Level 30* untuk promosi job! (Level-mu saat ini: *Level ${player.level}*).`);
      }
      
      if (mKilled < 100 || dCompleted < 3) {
        return reply(sock, msg, `❌ Persyaratan promosi belum lengkap!\n• Level 30 (Selesai: Lv. ${player.level})\n• Kalahkan 100 monster (Progres: ${mKilled}/100)\n• Selesaikan 3 dungeon (Progres: ${dCompleted}/3)`);
      }

      const promotionMap = {
        warrior: 'lord_knight',
        paladin: 'templar',
        mage: 'archmage',
        cleric: 'high_priest',
        rogue: 'assassin',
        archer: 'sniper',
        berserker: 'warlord',
        monk: 'grandmaster'
      };

      const nextJob = promotionMap[player.job];
      if (!nextJob) {
        return reply(sock, msg, `❌ Job *${classes.jobs[player.job]?.name || player.job}* tidak memiliki promosi lanjutan atau sudah dipromosikan.`);
      }

      player.job = nextJob;
      const newDerived = combat.getDerivedStats(player);
      player.hp = newDerived.maxHp;
      player.mp = newDerived.maxMp;

      db.savePlayer(player);

      return reply(sock, msg, `🎉 🌟 *PROMOSI KELAS BERHASIL!* 🌟 🎉\nSelamat! Kamu telah naik tingkat menjadi *${classes.jobs[nextJob].name}*!\nStat growth kamu meningkat masif dan skill ultimate baru telah terbuka!`);
    }

    case 'changejob':
    case 'reclass':
    case 'gantijob': {
      if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register*!`);
      
      const newJobKey = args[0]?.toLowerCase();
      // Hanya izinkan berpindah ke job dasar T1
      const allowedJobs = ['warrior', 'paladin', 'mage', 'cleric', 'rogue', 'archer', 'berserker', 'monk'];
      
      if (!newJobKey || !allowedJobs.includes(newJobKey)) {
        let listJobs = `📝 *DAFTAR JOB DASAR YANG DAPAT DIPILIH (Biaya: Level * 1000 Gold)*:\n\n`;
        allowedJobs.forEach(k => {
          listJobs += `• *${classes.jobs[k].name}* (Key: \`${k}\`)\n  _${classes.jobs[k].description}_\n`;
        });
        listJobs += `\nFormat: *!changejob [key_job]*`;
        return reply(sock, msg, listJobs);
      }

      if (player.job === newJobKey) {
        return reply(sock, msg, `❌ Kamu sudah menjadi job *${classes.jobs[newJobKey].name}*!`);
      }

      const cost = Math.max(4000, player.level * 1000); // Naik dari 2000 / 500 per level
      if (player.gold < cost) {
        return reply(sock, msg, `❌ Gold tidak cukup! Ganti job membutuhkan *${cost.toLocaleString()} Gold* 🪙 (Gold kamu: *${player.gold.toLocaleString()} Gold*).`);
      }

      // 1. Potong Gold
      player.gold -= cost;

      // 2. Lepas semua equipment secara otomatis dan kembalikan ke inventory
      let unequippedText = "";
      if (player.equipment.weapon) {
        const wKey = typeof player.equipment.weapon === 'string' ? player.equipment.weapon : player.equipment.weapon.key;
        player.inventory[wKey] = (player.inventory[wKey] || 0) + 1;
        player.equipment.weapon = null;
        unequippedText += `• Senjata dilepas\n`;
      }
      if (player.equipment.armor) {
        const aKey = typeof player.equipment.armor === 'string' ? player.equipment.armor : player.equipment.armor.key;
        player.inventory[aKey] = (player.inventory[aKey] || 0) + 1;
        player.equipment.armor = null;
        unequippedText += `• Zirah dilepas\n`;
      }

      // 3. Refund semua alokasi stat point manual
      const totalRefundPoints = (player.stats.str || 0) + (player.stats.int || 0) + (player.stats.vit || 0) + (player.stats.agi || 0) + (player.stats.dex || 0);
      player.statPoints += totalRefundPoints;
      player.stats = { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };

      // 4. Set job baru
      player.job = newJobKey;

      // 5. HP & MP dipulihkan penuh sesuai growth baru
      const newDerived = combat.getDerivedStats(player);
      player.hp = newDerived.maxHp;
      player.mp = newDerived.maxMp;

      db.savePlayer(player);

      return reply(sock, msg, 
        `🔄 *GANTI JOB BERHASIL!* 🔄\n` +
        `Kamu telah berganti job menjadi *${classes.jobs[newJobKey].name}*!\n\n` +
        `💰 Biaya: *-${cost.toLocaleString()} Gold*\n` +
        `💫 Pengembalian Stat Points: *+${totalRefundPoints} Poin*\n` +
        `${unequippedText}` +
        `\nKetik *!profile* dan distribusikan kembali stat points-mu menggunakan *!stat_add*!`
      );
    }

    case 'leaderboard':
    case 'top': {
      const allPlayers = await db.getAllPlayersList();
      if (allPlayers.length === 0) {
        return reply(sock, msg, `📭 Belum ada pemain terdaftar.`);
      }

      // Urutkan berdasarkan Level desc, lalu EXP desc
      const sorted = allPlayers.sort((a, b) => b.level - a.level || b.exp - a.exp);
      const top10 = sorted.slice(0, 10);

      let out = `🏆 *LEADERBOARD LEVEL RPG BOT* 🏆\n────────────────────────\n`;
      top10.forEach((p, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        const jName = classes.jobs[p.job]?.name || p.job;
        out += `${medal} *${p.name}* (Lv. ${p.level} ${jName}) - ${p.gold + p.bank} Gold\n`;
      });

      return reply(sock, msg, out);
    }
  }
}

module.exports = {
  handleUserCommands
};
