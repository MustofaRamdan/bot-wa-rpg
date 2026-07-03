// ================== ADVANCED GUILD & TRAINING SYSTEM ==================

const db = require('../database/db');
const combat = require('../rpg/combat');
const helpers = require('../utils/helpers');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

// Data Template Boss Guild Raid
const RAID_BOSSES = [
  { name: "Giant Slime King 👑", hp: 12000, attack: 180, defense: 45, tokenReward: 120 },
  { name: "Undead Beholder 👁️", hp: 35000, attack: 380, defense: 95, tokenReward: 350 },
  { name: "Abyss Dragon Hatchling 🐉", hp: 80000, attack: 680, defense: 180, tokenReward: 800 },
  { name: "Raid Overlord Titan 🗿", hp: 180000, attack: 1200, defense: 380, tokenReward: 2000 }
];

async function handleGuildCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  // Inisialisasi properti baru jika belum ada
  player.guildTokens = player.guildTokens || 0;
  player.guildContribution = player.guildContribution || 0;
  player.guildStats = player.guildStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };

  switch (cmd) {
    case 'create_guild':
    case 'createguild': {
      if (player.guild) {
        return reply(sock, msg, `❌ Kamu sudah bergabung di dalam guild! Tinggalkan guild terlebih dahulu dengan *!guild_leave*.`);
      }

      const guildCost = 10000; // Biaya 10k gold
      if (player.gold < guildCost) {
        return reply(sock, msg, `❌ Gold tidak cukup! Membuat guild membutuhkan biaya *${guildCost.toLocaleString()} Gold* 🪙 (Kamu memiliki: *${player.gold.toLocaleString()} Gold*).`);
      }

      const guildName = args.join(' ').trim();
      if (!guildName || guildName.length < 3 || guildName.length > 20) {
        return reply(sock, msg, `❌ Format: *!create_guild [Nama Guild]*\n(Nama guild harus terdiri dari 3-20 karakter).`);
      }

      // Periksa duplikasi nama guild
      const allGuilds = db.getAllGuilds();
      const nameExists = Object.values(allGuilds).some(g => g.name.toLowerCase() === guildName.toLowerCase());
      if (nameExists) {
        return reply(sock, msg, `❌ Nama guild *"${guildName}"* sudah digunakan oleh pemain lain!`);
      }

      const guildId = "g_" + Date.now();
      const newGuild = {
        id: guildId,
        name: guildName,
        leader: userId,
        members: [userId],
        invites: [],
        bank: 0,
        level: 1,
        exp: 0,
        maxMembers: 5,
        notice: "Selamat datang di guild kami!",
        raidBoss: null,
        lastRaidTime: 0,
        createdAt: Date.now()
      };

      player.guild = guildId;
      player.gold -= guildCost;
      
      db.saveGuild(guildId, newGuild);
      db.savePlayer(player);

      return reply(sock, msg, `🏛️ Guild *"${guildName}"* berhasil dibuat! Membayar biaya pendaftaran *-${guildCost.toLocaleString()} Gold* 🪙.\nKamu sekarang adalah Leader guild ini. 😎`);
    }

    case 'guild':
    case 'guild_info': {
      if (!player.guild) {
        return reply(sock, msg, `❌ Kamu belum bergabung dalam guild mana pun.\nBuat guild dengan *!create_guild [nama]* (10k Gold) atau tunggu undangan dari leader guild lain.`);
      }

      const guild = db.getGuild(player.guild);
      if (!guild) {
        player.guild = null;
        db.savePlayer(player);
        return reply(sock, msg, `❌ Data guild-mu tidak ditemukan.`);
      }

      const leaderPlayer = db.getPlayer(guild.leader);
      const memberNames = guild.members.map(id => db.getPlayer(id).name || id).join(', ');
      const inviteNames = guild.invites.map(id => db.getPlayer(id).name || id).join(', ') || "Tidak ada";

      const currentLvl = guild.level || 1;
      const nextLvlExp = currentLvl * 5000;
      const progressPercent = Math.min(100, Math.floor(((guild.exp || 0) / nextLvlExp) * 100));

      let infoMsg = 
`🏛️ *GUILD: ${guild.name}* 🏛️
────────────────────────
• 👑 *Leader:* ${leaderPlayer?.name || 'Unknown'}
• ⭐️ *Level Guild:* Lv. ${currentLvl} (${guild.exp || 0}/${nextLvlExp} EXP [${progressPercent}%])
• 👥 *Anggota:* ${guild.members.length}/${guild.maxMembers || 5}
  └─ _${memberNames}_
• 🏦 *Kas Guild:* ${guild.bank.toLocaleString()} Gold 🪙
• 📜 *Papan Pengumuman:*
  _"${guild.notice}"_
────────────────────────
💡 *TIPS GUILD HARIAN:*
👉 Donasi emas ke kas: *!guild_donate [gold]*
👉 Upgrade level guild: *!guild_upgrade* (Hanya Leader)
👉 Upgrade stats-mu di Training Hall: *!guild_train [stat]*
👉 Raid boss harian: *!guild_raid*`;

      if (guild.invites && guild.invites.length > 0) {
        infoMsg += `\n• 📩 *Undangan Pending:* ${inviteNames}`;
      }

      return reply(sock, msg, infoMsg);
    }

    case 'guild_donate': {
      if (!player.guild) return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild.`);
      
      const input = args[0];
      if (!input) return reply(sock, msg, `❌ Format: *!guild_donate [jumlah/all]*\nContoh: *!guild_donate 500*`);

      const guild = db.getGuild(player.guild);
      if (!guild) return reply(sock, msg, `❌ Guild-mu tidak valid.`);

      let amount = 0;
      if (input.toLowerCase() === 'all') {
        amount = player.gold;
      } else {
        amount = parseInt(input);
      }

      if (isNaN(amount) || amount <= 0) {
        return reply(sock, msg, `❌ Jumlah donasi tidak valid.`);
      }

      if (amount < 100) {
        return reply(sock, msg, `❌ Minimal menyumbang donasi adalah *100 Gold* 🪙.`);
      }

      if (player.gold < amount) {
        return reply(sock, msg, `❌ Gold-mu tidak cukup! Sisa Gold di tas: *${player.gold.toLocaleString()} Gold*.`);
      }

      // Potong Emas Player & Tambah ke Guild Bank
      player.gold -= amount;
      guild.bank += amount;

      // Hitung EXP Guild & Guild Tokens
      // Tiap 100 gold = +10 EXP Guild, +1 Guild Token
      const tokenGained = Math.floor(amount / 100);
      const expGained = tokenGained * 10;

      guild.exp = (guild.exp || 0) + expGained;
      player.guildTokens = (player.guildTokens || 0) + tokenGained;
      player.guildContribution = (player.guildContribution || 0) + amount;

      // Simpan data
      db.saveGuild(guild.id, guild);
      db.savePlayer(player);

      let donateMsg = `✅ Berhasil mendonasikan *+${amount.toLocaleString()} Gold* ke kas Guild!\n`;
      donateMsg += `• EXP Guild: *+${expGained} EXP*\n`;
      donateMsg += `• Koin Guild: *+${tokenGained} Guild Tokens* 🪙\n`;
      donateMsg += `• Total Tabunganmu: *${player.guildTokens} Guild Tokens*\n`;
      donateMsg += `• Kas Guild saat ini: *${guild.bank.toLocaleString()} Gold* 🪙`;

      return reply(sock, msg, donateMsg);
    }

    case 'guild_upgrade': {
      if (!player.guild) return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild.`);
      
      const guild = db.getGuild(player.guild);
      if (!guild) return reply(sock, msg, `❌ Guild-mu tidak valid.`);

      if (guild.leader !== userId) {
        return reply(sock, msg, `❌ Hanya Leader Guild yang dapat mengupgrade level Guild!`);
      }

      const currentLvl = guild.level || 1;
      const upgradeCost = currentLvl * 25000; // 25k, 50k, 75k, dst.

      if (guild.bank < upgradeCost) {
        return reply(sock, msg, `❌ Kas Guild tidak cukup! Naik ke Level ${currentLvl + 1} membutuhkan *${upgradeCost.toLocaleString()} Gold* di kas Guild (Kas saat ini: *${guild.bank.toLocaleString()} Gold*).`);
      }

      // Proses Upgrade
      guild.bank -= upgradeCost;
      guild.level = currentLvl + 1;
      guild.maxMembers = 5 + (guild.level - 1) * 2; // +2 kapasitas anggota per level

      db.saveGuild(guild.id, guild);

      return reply(sock, msg, `🎉 🏛️ *GUILD UPGRADE SUCCESS!* 🏛️ 🎉\nSelamat! Guild *"${guild.name}"* naik ke *Level ${guild.level}*!\n• Maksimal Anggota: *${guild.maxMembers}*\n• Batas Training Hall meningkat!\n• Buff Stats Pasif meningkat!`);
    }

    case 'guild_train':
    case 'guild_upstat': {
      if (!player.guild) return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild.`);
      
      const guild = db.getGuild(player.guild);
      if (!guild) return reply(sock, msg, `❌ Guild-mu tidak valid.`);

      const statType = args[0]?.toLowerCase();
      const amount = parseInt(args[1]) || 1;

      if (!['str', 'int', 'vit', 'agi', 'dex'].includes(statType)) {
        let trainMsg = `🏋️ *GUILD TRAINING HALL (UPGRADE STATS)* 🏋️\n────────────────────────\n`;
        trainMsg += `Kamu bisa memperkuat stats pribadimu menggunakan *Guild Tokens*.\n\n`;
        trainMsg += `📊 *Stats Guild-mu saat ini:*\n`;
        trainMsg += `• 💪 STR: *+${player.guildStats.str || 0}*\n`;
        trainMsg += `• 🔮 INT: *+${player.guildStats.int || 0}*\n`;
        trainMsg += `• 🛡️ VIT: *+${player.guildStats.vit || 0}*\n`;
        trainMsg += `• 💨 AGI: *+${player.guildStats.agi || 0}*\n`;
        trainMsg += `• 🎯 DEX: *+${player.guildStats.dex || 0}*\n\n`;
        trainMsg += `🪙 Saldo: *${player.guildTokens} Guild Tokens*\n`;
        trainMsg += `👑 Batas Maksimal Upgrade: *+${(guild.level || 1) * 6}* (Berdasarkan level Guild-mu)\n\n`;
        trainMsg += `💡 *Cara Training:* Ketik *!guild_train [stat] [jumlah]*\nContoh: *!guild_train str 5*`;
        return reply(sock, msg, trainMsg);
      }

      if (amount <= 0 || isNaN(amount)) return reply(sock, msg, `❌ Jumlah poin upgrade tidak valid.`);
      if (amount > 50) return reply(sock, msg, `❌ Maksimal poin upgrade sekali latihan adalah *50 Poin*.`);

      const currentLvl = guild.level || 1;
      const maxLimit = currentLvl * 6; // Limit stat level
      const currentStatVal = player.guildStats[statType] || 0;

      if (currentStatVal + amount > maxLimit) {
        return reply(sock, msg, `❌ Gagal melatih! Level Guild saat ini (${currentLvl}) hanya membatasi upgrade stat maksimal *+${maxLimit}*.\nSumbang emas di *!guild_donate* agar Guild bisa *!guild_upgrade*!`);
      }

      // Hitung biaya koin guild
      // Rumus biaya progresif: (stat_level * 2) + 5 koin per poin
      let totalTokensCost = 0;
      for (let i = 0; i < amount; i++) {
        totalTokensCost += ((currentStatVal + i) * 2) + 5;
      }

      if (player.guildTokens < totalTokensCost) {
        return reply(sock, msg, `❌ Koin Guild tidak cukup! Meningkatkan *${statType.toUpperCase()} +${amount}* membutuhkan *${totalTokensCost} Guild Tokens* (Koin kamu: *${player.guildTokens} Guild Tokens*).`);
      }

      // Eksekusi upgrade
      player.guildTokens -= totalTokensCost;
      player.guildStats[statType] = currentStatVal + amount;

      // Update max HP/MP jika VIT/INT meningkat
      const pStats = combat.getDerivedStats(player);
      if (statType === 'vit') player.hp = pStats.maxHp;
      if (statType === 'int') player.mp = pStats.maxMp;

      db.savePlayer(player);

      return reply(sock, msg, `🏋️ *LATIHAN BERHASIL!* 🏋️\nKamu melatih batin di kuil guild untuk meningkatkan *${statType.toUpperCase()} +${amount}*!\n• Total ${statType.toUpperCase()} Guild: *+${player.guildStats[statType]}*\n• Membayar: *-${totalTokensCost} Guild Tokens* 🪙`);
    }

    case 'guild_raid': {
      if (!player.guild) return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild.`);
      
      const guild = db.getGuild(player.guild);
      if (!guild) return reply(sock, msg, `❌ Guild-mu tidak valid.`);

      const sub = args[0]?.toLowerCase();

      // Subcommand 1: Summon (Hanya Leader)
      if (sub === 'summon' || sub === 'start' || sub === 'panggil') {
        if (guild.leader !== userId) {
          return reply(sock, msg, `❌ Hanya Leader Guild yang dapat memanggil Raid Boss!`);
        }

        if (guild.raidBoss) {
          return reply(sock, msg, `❌ Raid Boss *${guild.raidBoss.name}* sedang aktif di guild-mu!\nKetik *!guild_raid attack* untuk menyerang.`);
        }

        const now = Date.now();
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 jam sekali
        if (now - (guild.lastRaidTime || 0) < cooldownMs) {
          const timeLeft = cooldownMs - (now - (guild.lastRaidTime || 0));
          return reply(sock, msg, `⏳ Boss Guild lelah dan belum bisa dipanggil kembali. Silakan tunggu *${helpers.formatCooldown(timeLeft)}* lagi.`);
        }

        const summonCost = (guild.level || 1) * 3000; // Biaya panggil dari kas guild
        if (guild.bank < summonCost) {
          return reply(sock, msg, `❌ Kas Guild tidak cukup! Memanggil Raid Boss Level ${guild.level || 1} membutuhkan *${summonCost.toLocaleString()} Gold* di kas (Kas saat ini: *${guild.bank.toLocaleString()} Gold*).`);
        }

        // Pilih Boss acak sesuai level
        const bossIndex = Math.min(RAID_BOSSES.length - 1, Math.floor((guild.level - 1) / 1.5));
        const template = RAID_BOSSES[bossIndex];

        // Skalakan boss
        const scale = 1 + ((guild.level - 1) * 0.15);
        guild.raidBoss = {
          name: template.name,
          hp: Math.floor(template.hp * scale),
          maxHp: Math.floor(template.hp * scale),
          attack: Math.floor(template.attack * scale),
          defense: Math.floor(template.defense * scale),
          tokenReward: Math.floor(template.tokenReward * scale),
          participants: {} // userId -> damage
        };

        guild.bank -= summonCost;
        guild.lastRaidTime = now;

        db.saveGuild(guild.id, guild);

        return reply(sock, msg, `🌋 *GUILD RAID BOSS SUMMONED!* 🌋\n────────────────────────\nLeader guild memanggil monster penjaga:\n• Nama: *${guild.raidBoss.name}*\n• HP: *${guild.raidBoss.hp.toLocaleString()} HP*\n• ATK/DEF: *${guild.raidBoss.attack}/${guild.raidBoss.defense}*\n\n⚔️ Seluruh anggota guild harap bersiap! Ketik *!guild_raid attack* untuk ikut menyerang bos bersama!`);
      }

      // Subcommand 2: Attack (Semua anggota)
      if (sub === 'attack' || sub === 'serang') {
        if (!guild.raidBoss) {
          return reply(sock, msg, `❌ Tidak ada Raid Boss aktif saat ini di guild-mu. Mintalah Leader untuk *!guild_raid summon*!`);
        }

        const now = Date.now();
        // Cooldown serang raid disamakan dengan bossCooldown agar adil
        const lastAttack = player.bossCooldown || 0;
        const cooldownMs = 25000; // 25 detik cooldown

        if (now - lastAttack < cooldownMs) {
          const timeLeft = cooldownMs - (now - lastAttack);
          return reply(sock, msg, `⏳ Kamu sedang memulihkan tenaga! Tunggu *${helpers.formatCooldown(timeLeft)}* lagi.`);
        }

        // Jalankan pertarungan ringkas 1 hit
        const pStats = combat.getDerivedStats(player);
        const baseAtk = Math.max(pStats.patk, pStats.matk);
        const variance = Math.floor(Math.random() * (player.level * 2 + 5));
        let rawDmg = Math.max(5, baseAtk + variance - guild.raidBoss.defense);

        const isCrit = Math.random() * 100 <= pStats.critRate;
        if (isCrit) rawDmg = Math.floor(rawDmg * 1.4);

        // Pet assist
        let petDamage = 0;
        if (pStats.activePet) {
          if (pStats.activePet.tier === 'SS') petDamage = Math.floor(rawDmg * (0.3 + Math.random() * 0.2));
          if (pStats.activePet.tier === 'SSS') petDamage = Math.floor(rawDmg * (0.7 + Math.random() * 0.3));
        }

        const totalDmg = rawDmg + petDamage;

        // Kurangi HP bos
        guild.raidBoss.hp = Math.max(0, guild.raidBoss.hp - totalDmg);
        
        // Catat kontribusi
        guild.raidBoss.participants[userId] = (guild.raidBoss.participants[userId] || 0) + totalDmg;
        player.bossCooldown = now;

        let attackLog = `⚔️ *ATTACK RAID BOSS!* ⚔️\n`;
        attackLog += `• Boss: *${guild.raidBoss.name}*\n`;
        attackLog += `• HP Sisa: *${guild.raidBoss.hp.toLocaleString()}/${guild.raidBoss.maxHp.toLocaleString()}*\n────────────────────────\n`;
        attackLog += `💥 Kamu memberikan *-${rawDmg} damage* ${isCrit ? "*(CRITICAL)*" : ""}\n`;
        if (petDamage > 0) {
          attackLog += `🐾 Pet *${pStats.activePet.name}* mencakar boss: *-${petDamage} damage*!\n`;
        }
        attackLog += `🔥 Total damage kontribusi-mu: *${guild.raidBoss.participants[userId].toLocaleString()} damage*\n\n`;

        // Boss menyerang balik
        const bossDmg = Math.max(10, guild.raidBoss.attack - pStats.pdef);
        player.hp = Math.max(1, player.hp - bossDmg); // Sisakan minimal 1 HP
        attackLog += `👹 *${guild.raidBoss.name}* membalas cakarannya: *-${bossDmg} HP*!\n`;
        attackLog += `❤️ Sisa HP-mu: *${player.hp}/${pStats.maxHp}*`;

        // Jika Boss Mati
        if (guild.raidBoss.hp <= 0) {
          attackLog += `\n\n🎉 🏆 *GUILD RAID BOSS DEFEATED!* 🏆 🎉\n`;
          attackLog += `Monster telah tumbang! Membagikan koin donasi ke seluruh peserta...\n────────────────────────\n`;

          const totalDmgDealt = Object.values(guild.raidBoss.participants).reduce((s, d) => s + d, 0) || 1;
          const rewardPool = guild.raidBoss.tokenReward;

          // Iterasi semua kontributor untuk mendapat hadiah
          for (const [contribId, dmg] of Object.entries(guild.raidBoss.participants)) {
            const share = dmg / totalDmgDealt;
            // Base reward tokens + share dari damage
            const tokenReward = Math.max(2, Math.floor(rewardPool * share));
            const goldReward = Math.floor(1000 * share); // Sedikit bonus emas

            const p = db.getPlayer(contribId);
            if (p) {
              p.guildTokens = (p.guildTokens || 0) + tokenReward;
              p.gold += goldReward;
              db.savePlayer(p);

              if (contribId === userId) {
                attackLog += `🎁 *Hadiahmu* (Damage share: ${(share * 100).toFixed(1)}%):\n`;
                attackLog += `• *+${tokenReward} Guild Tokens* 🪙\n`;
                attackLog += `• *+${goldReward} Gold* 🪙\n`;
              }
            }
          }

          // Bersihkan status boss
          guild.raidBoss = null;
        }

        db.saveGuild(guild.id, guild);
        db.savePlayer(player);

        return reply(sock, msg, attackLog);
      }

      // Default: show menu raid
      let rInfo = `🌋 *SISTEM RAID BOSS GUILD* 🌋\n────────────────────────\n`;
      if (guild.raidBoss) {
        rInfo += `👹 *Boss Aktif:* ${guild.raidBoss.name}\n`;
        rInfo += `❤️ HP Boss: *${guild.raidBoss.hp.toLocaleString()}/${guild.raidBoss.maxHp.toLocaleString()}*\n`;
        rInfo += `⚔️ ATK/DEF: ${guild.raidBoss.attack}/${guild.raidBoss.defense}\n\n`;
        rInfo += `💡 Ketik *!guild_raid attack* untuk menyerang bersama anggota guild lainnya!`;
      } else {
        rInfo += `💤 *Status:* Tidak ada boss yang terpanggil.\n\n`;
        rInfo += `👑 (Hanya Leader) Ketik *!guild_raid summon* untuk memanggil boss raid.\n`;
        rInfo += `🪙 Biaya panggil: *${((guild.level || 1) * 3000).toLocaleString()} Gold* dari kas guild.\n`;
        rInfo += `⏰ Cooldown: 24 jam sekali.`;
      }
      return reply(sock, msg, rInfo);
    }

    case 'guild_notice': {
      if (!player.guild) return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild.`);
      
      const guild = db.getGuild(player.guild);
      if (!guild) return reply(sock, msg, `❌ Guild-mu tidak valid.`);

      if (guild.leader !== userId) {
        return reply(sock, msg, `❌ Hanya Leader Guild yang dapat mengubah papan pengumuman!`);
      }

      const noticeText = args.join(' ').trim();
      if (!noticeText || noticeText.length > 100) {
        return reply(sock, msg, `❌ Format: *!guild_notice [Teks]*\n(Maksimal 100 karakter).`);
      }

      guild.notice = noticeText;
      db.saveGuild(guild.id, guild);

      return reply(sock, msg, `📝 Papan pengumuman guild berhasil diperbarui!`);
    }

    case 'guild_kick': {
      if (!player.guild) return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild.`);
      
      const guild = db.getGuild(player.guild);
      if (!guild) return reply(sock, msg, `❌ Guild-mu tidak valid.`);

      if (guild.leader !== userId) {
        return reply(sock, msg, `❌ Hanya Leader Guild yang dapat mengeluarkan anggota!`);
      }

      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.length === 0) {
        return reply(sock, msg, `❌ Format: *!guild_kick @player*`);
      }

      const targetId = mentions[0].split('@')[0];
      if (targetId === userId) {
        return reply(sock, msg, `❌ Kamu tidak dapat menendang dirimu sendiri.`);
      }

      if (!guild.members.includes(targetId)) {
        return reply(sock, msg, `❌ Player tersebut bukan merupakan anggota guild ini.`);
      }

      // Keluarkan target
      guild.members = guild.members.filter(id => id !== targetId);
      db.saveGuild(guild.id, guild);

      const targetPlayer = db.getPlayer(targetId);
      if (targetPlayer) {
        targetPlayer.guild = null;
        db.savePlayer(targetPlayer);
      }

      return reply(sock, msg, `🥾 Berhasil menendang *${targetPlayer?.name || targetId}* dari guild.`);
    }

    case 'guild_invite': {
      if (!player.guild) {
        return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild manapun.`);
      }

      const guild = db.getGuild(player.guild);
      if (guild.leader !== userId) {
        return reply(sock, msg, `❌ Hanya Leader guild yang dapat mengundang anggota baru!`);
      }

      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.length === 0) {
        return reply(sock, msg, `❌ Format: *!guild_invite @player*`);
      }

      const targetId = mentions[0].split('@')[0];
      const targetPlayer = db.getPlayer(targetId);

      if (!targetPlayer.job) {
        return reply(sock, msg, `❌ Player tersebut belum terdaftar dalam RPG.`);
      }

      if (targetPlayer.guild) {
        return reply(sock, msg, `❌ Player *${targetPlayer.name}* sudah tergabung di guild lain.`);
      }

      if (guild.members.includes(targetId)) {
        return reply(sock, msg, `❌ Player sudah menjadi anggota guild.`);
      }

      if (guild.members.length >= (guild.maxMembers || 5)) {
        return reply(sock, msg, `❌ Anggota guild sudah penuh! Maksimal kapasitas: *${guild.maxMembers || 5} anggota*.\nUpgrade level guild dengan *!guild_upgrade* untuk menambah slot!`);
      }

      if (guild.invites.includes(targetId)) {
        return reply(sock, msg, `❌ Player tersebut sudah diundang sebelumnya.`);
      }

      guild.invites.push(targetId);
      db.saveGuild(guild.id, guild);

      return reply(sock, msg, `✅ Undangan berhasil dikirim ke *${targetPlayer.name}*! Mereka dapat mengetik *!guild_accept* untuk bergabung.`);
    }

    case 'guild_accept': {
      if (player.guild) {
        return reply(sock, msg, `❌ Kamu sudah berada di dalam guild.`);
      }

      // Cari guild yang memiliki undangan untuk user ini
      const allGuilds = db.getAllGuilds();
      const invitingGuild = Object.values(allGuilds).find(g => g.invites.includes(userId));

      if (!invitingGuild) {
        return reply(sock, msg, `❌ Tidak ada undangan guild aktif untukmu.`);
      }

      if (invitingGuild.members.length >= (invitingGuild.maxMembers || 5)) {
        // Hapus undangan jika penuh
        invitingGuild.invites = invitingGuild.invites.filter(id => id !== userId);
        db.saveGuild(invitingGuild.id, invitingGuild);
        return reply(sock, msg, `❌ Guild tersebut sudah penuh! Bergabung gagal.`);
      }

      // Hapus dari list undangan, masukkan ke list anggota
      invitingGuild.invites = invitingGuild.invites.filter(id => id !== userId);
      invitingGuild.members.push(userId);
      db.saveGuild(invitingGuild.id, invitingGuild);

      player.guild = invitingGuild.id;
      db.savePlayer(player);

      return reply(sock, msg, `🎉 Selamat! Kamu berhasil bergabung dengan Guild *"${invitingGuild.name}"*!`);
    }

    case 'guild_leave': {
      if (!player.guild) {
        return reply(sock, msg, `❌ Kamu tidak terdaftar dalam guild manapun.`);
      }

      const guild = db.getGuild(player.guild);
      if (!guild) {
        player.guild = null;
        db.savePlayer(player);
        return reply(sock, msg, `✅ Keluar dari guild.`);
      }

      // Kasus: Leader Keluar
      if (guild.leader === userId) {
        if (guild.members.length > 1) {
          // Cari leader baru (anggota pertama selain leader lama)
          const newLeaderId = guild.members.find(id => id !== userId);
          guild.leader = newLeaderId;
          guild.members = guild.members.filter(id => id !== userId);
          
          db.saveGuild(guild.id, guild);
          player.guild = null;
          db.savePlayer(player);
          
          const newLeaderName = db.getPlayer(newLeaderId).name;
          return reply(sock, msg, `⚠️ Kamu keluar dari guild. Kepemimpinan Guild *"${guild.name}"* dipindahkan ke *${newLeaderName}*.`);
        } else {
          // Bubarkan guild jika tinggal leader sendirian
          db.saveGuild(guild.id, null); // Hapus guild
          player.guild = null;
          db.savePlayer(player);
          
          return reply(sock, msg, `⚠️ Kamu keluar dari guild. Karena tidak ada anggota lain, Guild *"${guild.name}"* resmi dibubarkan.`);
        }
      } else {
        // Anggota biasa keluar
        guild.members = guild.members.filter(id => id !== userId);
        db.saveGuild(guild.id, guild);
        
        player.guild = null;
        db.savePlayer(player);
        
        return reply(sock, msg, `✅ Kamu berhasil keluar dari Guild *"${guild.name}"*.`);
      }
    }
  }
}

module.exports = {
  handleGuildCommands
};
