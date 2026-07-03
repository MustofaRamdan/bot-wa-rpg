// ================== BATTLE & HUNT COMMAND HANDLERS (OVERHAUL - BRUTAL DIFFICULTY) ==================

const db = require('../database/db');
const combat = require('../rpg/combat');
const helpers = require('../utils/helpers');
const { dungeons, worldBossTemplates } = require('../config/monsters');
const items = require('../config/items');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

// Global World Boss State Getter/Setter
function getOrInitWorldBoss() {
  let boss = db.getWorldBoss();
  if (!boss) {
    boss = {
      isActive: false,
      name: "Ancient Dragon Fafnir 🐉",
      level: 10,
      maxHp: 500000,
      hp: 500000,
      attack: 600,
      defense: 250,
      nextSpawnAt: Date.now() + 1000 * 30, // Spawn dalam 30 detik pertama
      lastKilledAt: 0,
      participants: {}, // userId -> damage
      templateIndex: 0
    };
    db.saveWorldBoss(boss);
  }
  return boss;
}

// Spawns a new World Boss
function spawnWorldBoss(boss, avgLevel) {
  const tplIndex = Math.floor(Math.random() * worldBossTemplates.length);
  const tpl = worldBossTemplates[tplIndex];
  
  const level = Math.max(10, avgLevel + 5);
  const maxHp = Math.floor(tpl.baseHp + tpl.hpPerLevel * level);
  const attack = Math.floor(tpl.baseAtk + tpl.atkPerLevel * level);
  const defense = Math.floor(tpl.baseDef + tpl.defPerLevel * level);

  boss.isActive = true;
  boss.name = tpl.name;
  boss.level = level;
  boss.maxHp = maxHp;
  boss.hp = maxHp;
  boss.attack = attack;
  boss.defense = defense;
  boss.participants = {};
  boss.templateIndex = tplIndex;
  
  db.saveWorldBoss(boss);
  console.log(`🐲 World Boss Spawned: ${boss.name} (Lv. ${boss.level}) HP: ${boss.hp}`);
}

async function handleBattleCommands(sock, msg, cmd, args, userId, client) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  const pStats = combat.getDerivedStats(player);

  switch (cmd) {
    case 'hunt':
    case 'adventure': {
      const now = Date.now();
      const lastHunt = player.cooldown || 0;
      
      // Cooldown berburu JAUH lebih lama (90 detik base, pet hanya mengurangi sedikit)
      let cooldownMs = 90000; // 90 detik base (naik dari 30)
      if (pStats.activePet) {
        if (pStats.activePet.tier === 'S')   cooldownMs = 80000;
        else if (pStats.activePet.tier === 'SS')  cooldownMs = 70000;
        else if (pStats.activePet.tier === 'SSS') cooldownMs = 55000;
      }

      if (now - lastHunt < cooldownMs) {
        const timeLeft = cooldownMs - (now - lastHunt);
        return reply(sock, msg, `⏳ Kamu sedang beristirahat. Tunggu *${helpers.formatCooldown(timeLeft)}* lagi.`);
      }

      // Cek minimum HP untuk berburu — harus punya minimal 25% HP
      if (player.hp < Math.floor(pStats.maxHp * 0.25)) {
        return reply(sock, msg, `❌ HP-mu terlalu rendah untuk berburu! (HP: *${player.hp}/${pStats.maxHp}*).\nGunakan *!use potion* atau tunggu pemulihan!`);
      }

      // Ambil monster acak sesuai level player dan zona eksplorasi
      const baseMonster = helpers.getRandomMonster(player.level, player.zone || 'green_forest');
      
      // Elite / Champion check — JAUH LEBIH KUAT
      let monster = { ...baseMonster };
      let expMultiplier = 1;
      let goldMultiplier = 1;
      let lootChance = 0.25; // Dikurangi dari 0.35
      
      const randType = Math.random();
      if (randType < 0.03) { // 3% Champion (naik dari 2%)
        monster.name = `💀 Champion ${monster.name}`;
        monster.hp = Math.floor(monster.hp * 4.0);    // Naik dari 2.5
        monster.attack = Math.floor(monster.attack * 2.8); // Naik dari 2.0
        monster.defense = Math.floor(monster.defense * 2.2); // Naik dari 1.5
        expMultiplier = 2.5; // Dikurangi dari 3.0
        goldMultiplier = 3.0; // Dikurangi dari 4.0
        lootChance = 0.75;
      } else if (randType < 0.10) { // 7% Elite (naik dari 5%)
        monster.name = `🔴 Elite ${monster.name}`;
        monster.hp = Math.floor(monster.hp * 2.2);    // Naik dari 1.5
        monster.attack = Math.floor(monster.attack * 1.8); // Naik dari 1.3
        monster.defense = Math.floor(monster.defense * 1.6); // Naik dari 1.2
        expMultiplier = 1.5; // Dikurangi dari 1.8
        goldMultiplier = 1.5; // Dikurangi dari 2.0
        lootChance = 0.45;
      }
      
      // Jalankan simulasi tarung
      const result = combat.simulateCombat(player, monster);
      
      // Update data player berdasarkan hasil pertarungan
      player.hp = result.finalPlayerHp;
      player.mp = result.finalPlayerMp;
      player.cooldown = now;
      player.battleStats.totalHunts++;

      let rewardText = "";

      if (result.success) {
        // Menang!
        player.battleStats.totalWins++;
        player.battleStats.monstersKilled++;
        
        // Dapatkan EXP & Gold — DIKURANGI DRASTIS
        let expGain = Math.floor(monster.exp * (1 + (player.level * 0.01)) * expMultiplier);
        
        // Penalti EXP jika level monster terlalu jauh di bawah level player — LEBIH KETAT
        const lvlDiff = player.level - baseMonster.level;
        let penaltyText = "";
        if (lvlDiff > 8) {
          expGain = Math.max(1, Math.floor(expGain * 0.03)); // Nyaris tidak dapat EXP
          penaltyText = " *(Penalti Level: -97% EXP)*";
        } else if (lvlDiff > 5) {
          expGain = Math.max(1, Math.floor(expGain * 0.15));
          penaltyText = " *(Penalti Level: -85% EXP)*";
        } else if (lvlDiff > 3) {
          expGain = Math.max(1, Math.floor(expGain * 0.40));
          penaltyText = " *(Penalti Level: -60% EXP)*";
        } else if (lvlDiff > 1) {
          expGain = Math.max(1, Math.floor(expGain * 0.70));
          penaltyText = " *(Penalti Level: -30% EXP)*";
        }

        // Gold drop SANGAT DIPERKETAT — anti-inflasi brutal
        const rawGold = monster.gold * (1 + (Math.random() * 0.15));
        const goldGain = Math.max(1, Math.floor(((rawGold / 4.0) / (1 + player.level * 0.05)) * goldMultiplier));
        
        player.exp += expGain;
        player.gold += goldGain;
        
        // Daily Quest hunt progress
        const todayStr = new Date().toISOString().slice(0, 10);
        player.dailyQuest = player.dailyQuest || { date: "", huntProgress: 0, fishProgress: 0, claimed: false };
        if (player.dailyQuest.date !== todayStr) {
          player.dailyQuest = { date: todayStr, huntProgress: 0, fishProgress: 0, claimed: false };
        }
        if (!player.dailyQuest.claimed) {
          player.dailyQuest.huntProgress = (player.dailyQuest.huntProgress || 0) + 1;
        }

        rewardText += `🎉 *MENANG!* mendapatkan *+${expGain} EXP*${penaltyText} & *+${goldGain} Gold* 🪙\n`;

        // Gacha Drop Item — peluang dikurangi
        if (monster.drops && monster.drops.length > 0 && Math.random() < lootChance) {
          const dropKey = monster.drops[Math.floor(Math.random() * monster.drops.length)];
          const item = items[dropKey];
          if (item) {
            player.inventory[dropKey] = (player.inventory[dropKey] || 0) + 1;
            rewardText += `🎁 *Loot:* Mendapatkan 1x *${item.name}*!\n`;
          }
        }

        // Cek Level Up
        const isLvlUp = helpers.checkLevelUp(player);
        if (isLvlUp) {
          rewardText += `🌟 *LEVEL UP!* Sekarang kamu mencapai *Level ${player.level}*! Poin stat bertambah +3.\n`;
        }

      } else if (result.draw) {
        // Seri (kehabisan turn) — SEKARANG ADA PENALTI KECIL
        const drawGoldLoss = Math.floor(player.gold * 0.03);
        player.gold = Math.max(0, player.gold - drawGoldLoss);
        rewardText += `🤝 *DRAW!* Kedua petarung kelelahan. Kehilangan *-${drawGoldLoss} Gold* (biaya stamina).\n`;
      } else {
        // Kalah! — PENALTI SANGAT BERAT
        player.battleStats.totalLosses++;
        
        // Pinalti mati BRUTAL:
        // 1. Kehilangan 25% Gold di tas (naik dari 10%)
        const lostGold = Math.floor(player.gold * 0.25);
        player.gold = Math.max(0, player.gold - lostGold);
        
        // 2. Kehilangan Gold BANK jika tas > 15k (threshold diturunkan, persentase naik)
        let bankPenaltyText = "";
        if (player.gold > 15000 && player.bank > 0) {
          const lostBank = Math.floor(player.bank * 0.10); // Naik dari 5%
          player.bank = Math.max(0, player.bank - lostBank);
          bankPenaltyText = ` dan *-${lostBank} Gold* di Bank`;
        }
        
        // 3. HP diset ke 10% Max HP (turun dari 30%)
        player.hp = Math.max(1, Math.floor(pStats.maxHp * 0.10));
        
        // 4. KEHILANGAN EXP (5% dari EXP yang dibutuhkan level berikutnya) — BARU!
        const expNeeded = require('../rpg/classes').getExpNeeded(player.level);
        const expLost = Math.floor(expNeeded * 0.05);
        player.exp = Math.max(0, player.exp - expLost);
        
        // 5. MP dihabiskan 50%
        player.mp = Math.floor(player.mp * 0.5);
        
        rewardText += `💀 *KALAH!* Kamu terluka sangat parah!\n`;
        rewardText += `• Kehilangan *-${lostGold} Gold* di tas${bankPenaltyText}\n`;
        rewardText += `• Kehilangan *-${expLost} EXP* (penalti kematian)\n`;
        rewardText += `• HP dipulihkan ke 10% (*${player.hp} HP*)\n`;
        rewardText += `• MP terkuras 50% (*${player.mp} MP*)\n`;
      }

      db.savePlayer(player);

      // Kirim Log Pertarungan
      const headerLog = `⚔️ *COMBAT REPORT: ${player.name} vs ${monster.name}*\n────────────────────────\n`;
      const footerLog = `\n────────────────────────\n${rewardText}❤️ *Sisa HP:* ${player.hp}/${pStats.maxHp} | 💙 *MP:* ${player.mp}/${pStats.maxMp}`;
      
      // Jika log pertarungan terlalu panjang, batasi agar muat di chat WA
      let fullCombatLog = result.log;
      if (fullCombatLog.length > 3500) {
        fullCombatLog = fullCombatLog.slice(0, 3200) + "\n...[Dipotong karena terlalu panjang]...\n";
      }

      return reply(sock, msg, headerLog + fullCombatLog + footerLog);
    }

    case 'dungeon': {
      const dungeonKey = args[0]?.toLowerCase();
      if (!dungeonKey || !dungeons[dungeonKey]) {
        let listDung = `🕳️ *PILIHAN DUNGEON RPG (Ketik !dungeon [key_dungeon])*:\n────────────────────────\n`;
        for (const [key, d] of Object.entries(dungeons)) {
          listDung += `• *${d.name}* (Key: \`${key}\`)\n  Min. Level: Lv. ${d.minLevel} | Biaya MP: ${d.mpCost} MP | Wave: ${d.waves}\n`;
        }
        return reply(sock, msg, listDung);
      }

      const d = dungeons[dungeonKey];
      if (player.level < d.minLevel) {
        return reply(sock, msg, `❌ Level kamu kurang! Minimal level untuk masuk adalah *Lv. ${d.minLevel}*.`);
      }

      if (player.mp < d.mpCost) {
        return reply(sock, msg, `❌ MP tidak cukup! Butuh *${d.mpCost} MP* (MP saat ini: *${player.mp}*).\nGunakan *!use potion* atau *!use ether*!`);
      }

      // Dungeon cooldown — 15 MENIT (BARU!)
      const now_d = Date.now();
      const dungeonCd = player.dungeonCooldown || 0;
      const dungeonCooldownMs = 900000; // 15 menit
      if (now_d - dungeonCd < dungeonCooldownMs) {
        const timeLeft = dungeonCooldownMs - (now_d - dungeonCd);
        return reply(sock, msg, `⏳ Kamu terlalu lelah untuk masuk dungeon! Tunggu *${helpers.formatCooldown(timeLeft)}* lagi.`);
      }

      // Biaya gold masuk dungeon NAIK
      const dungeonGoldCost = d.minLevel * 50; // Naik dari 25
      if (player.gold < dungeonGoldCost) {
        return reply(sock, msg, `❌ Gold tidak cukup! Butuh *${dungeonGoldCost} Gold* 🪙 untuk masuk ke dungeon ini (Gold kamu: *${player.gold} Gold*).`);
      }

      // Cek minimum HP
      if (player.hp < Math.floor(pStats.maxHp * 0.40)) {
        return reply(sock, msg, `❌ HP-mu terlalu rendah untuk masuk dungeon! Butuh minimal 40% HP.\n(HP: *${player.hp}/${pStats.maxHp}*). Gunakan *!use potion*!`);
      }

      // Potong MP, Gold, dan set cooldown
      player.mp -= d.mpCost;
      player.gold -= dungeonGoldCost;
      player.dungeonCooldown = now_d;
      db.savePlayer(player);

      let dungeonLog = `🕳️ *MENJELAJAHI DUNGEON: ${d.name}* 🕳️\n`;
      dungeonLog += `Player: ${player.name} (HP: ${player.hp}/${pStats.maxHp} | MP: ${player.mp}/${pStats.maxMp})\n`;
      dungeonLog += `────────────────────────\n\n`;

      let survived = true;
      let curHp = player.hp;
      let curMp = player.mp;

      // 1. Lawan Monster Wave
      for (let wave = 1; wave <= d.waves; wave++) {
        // Pilih monster wave acak
        const baseMonster = d.monsters[Math.floor(Math.random() * d.monsters.length)];
        const mob = {
          name: `Wave ${wave}: ${baseMonster.name}`,
          hp: baseMonster.hp,
          attack: baseMonster.attack,
          defense: baseMonster.defense
        };

        // Buat salinan state player untuk pertarungan
        const combatPlayer = { ...player, hp: curHp, mp: curMp };
        const result = combat.simulateCombat(combatPlayer, mob);

        curHp = result.finalPlayerHp;
        curMp = result.finalPlayerMp;

        if (!result.success) {
          dungeonLog += `❌ *Gagal di Wave ${wave}!* Dikalahkan oleh *${mob.name}*.\n`;
          survived = false;
          break;
        } else {
          dungeonLog += `✅ *Wave ${wave} Clear!* Sisa HP: ${curHp}/${pStats.maxHp}\n`;
        }
      }

      // 2. Lawan Boss Dungeon
      if (survived) {
        dungeonLog += `\n🚨 *WARNING: BOSS APPEARED!* 🚨\n`;
        const boss = { ...d.boss };
        
        const combatPlayer = { ...player, hp: curHp, mp: curMp };
        const result = combat.simulateCombat(combatPlayer, boss);
        
        curHp = result.finalPlayerHp;
        curMp = result.finalPlayerMp;

        if (!result.success) {
          dungeonLog += `💀 *DEFEATED!* Kamu dikalahkan oleh Boss *${boss.name}*.\n`;
          survived = false;
        } else {
          dungeonLog += `🎉 *VICTORY!* Boss *${boss.name}* berhasil ditumbangkan!\n`;
        }
      }

      // Simpan HP/MP akhir
      player.hp = curHp;
      player.mp = curMp;

      let rewardText = "";
      if (survived) {
        player.battleStats.dungeonsCompleted++;
        const boss = d.boss;
        const expReward = boss.expReward;
        const goldReward = boss.goldReward;

        player.exp += expReward;
        player.gold += goldReward;

        rewardText += `\n🏆 *DUNGEON CLEAR REWARDS!*\n`;
        rewardText += `• +${expReward} EXP\n• +${goldReward} Gold 🪙\n`;

        // Roll Boss Drops (peluang dikurangi)
        for (const [itemKey, chance] of Object.entries(boss.drops)) {
          if (Math.random() <= chance) {
            player.inventory[itemKey] = (player.inventory[itemKey] || 0) + 1;
            rewardText += `• Drop Item: 1x *${items[itemKey]?.name || itemKey}*\n`;
          }
        }

        const isLvlUp = helpers.checkLevelUp(player);
        if (isLvlUp) {
          rewardText += `🌟 *LEVEL UP!* Sekarang kamu mencapai *Level ${player.level}*! Poin stat bertambah +3.\n`;
        }
      } else {
        // Jika mati di dungeon — PENALTI BERAT
        player.hp = Math.max(1, Math.floor(pStats.maxHp * 0.10)); // 10% HP (turun dari 30%)
        player.mp = Math.floor(player.mp * 0.3); // MP terkuras 70%
        const expNeeded = require('../rpg/classes').getExpNeeded(player.level);
        const expLost = Math.floor(expNeeded * 0.08); // Kehilangan 8% EXP
        player.exp = Math.max(0, player.exp - expLost);
        const goldLost = Math.floor(player.gold * 0.15);
        player.gold = Math.max(0, player.gold - goldLost);
        
        rewardText += `\n💀 *EXPLORATION FAILED!*\n`;
        rewardText += `• Kehilangan *-${expLost} EXP* (penalti dungeon)\n`;
        rewardText += `• Kehilangan *-${goldLost} Gold* 🪙\n`;
        rewardText += `• HP dipulihkan ke 10% (*${player.hp} HP*)\n`;
      }

      db.savePlayer(player);

      return reply(sock, msg, dungeonLog + rewardText + `\n❤️ *Sisa HP:* ${player.hp}/${pStats.maxHp} | 💙 *MP:* ${player.mp}/${pStats.maxMp}`);
    }

    case 'worldboss':
    case 'boss': {
      const wbGoldCost = 200; // Naik dari 100
      if (player.gold < wbGoldCost) {
        return reply(sock, msg, `❌ Gold tidak cukup! Menyerang World Boss membutuhkan *${wbGoldCost} Gold* 🪙 (Gold kamu: *${player.gold} Gold*).`);
      }

      const boss = getOrInitWorldBoss();
      const now = Date.now();

      // Cooldown World Boss per player — JAUH lebih lama
      let bossCooldownMs = 45000; // 45 detik (naik dari 12)
      if (pStats.activePet) {
        if (pStats.activePet.tier === 'S') bossCooldownMs = 38000;
        else if (pStats.activePet.tier === 'SS') bossCooldownMs = 30000;
        else if (pStats.activePet.tier === 'SSS') bossCooldownMs = 22000;
      }

      if (now - (player.bossCooldown || 0) < bossCooldownMs) {
        const left = bossCooldownMs - (now - (player.bossCooldown || 0));
        return reply(sock, msg, `⏳ Kamu terlalu lelah untuk menyerang World Boss! Tunggu *${helpers.formatCooldown(left)}* lagi.`);
      }

      if (!boss.isActive) {
        if (now < boss.nextSpawnAt) {
          const spawnLeft = boss.nextSpawnAt - now;
          return reply(sock, msg, `🐲 World Boss belum muncul.\nSisa waktu spawn: *${helpers.formatCooldown(spawnLeft)}*.`);
        } else {
          // Hitung rata-rata level untuk menskalakan Boss
          const allPlrs = await db.getAllPlayersList();
          const avgLevel = allPlrs.length > 0 
            ? Math.floor(allPlrs.reduce((sum, p) => sum + p.level, 0) / allPlrs.length)
            : 10;
          spawnWorldBoss(boss, avgLevel);
        }
      }

      // Potong cooldown dan gold player
      player.bossCooldown = now;
      player.gold -= wbGoldCost;

      // Hitung damage ke Boss (Turn-based ringkas 1 turn)
      const baseAtk = Math.max(pStats.patk, pStats.matk);
      const randomVariance = Math.floor(Math.random() * (player.level * 2 + 5));
      let rawDamage = Math.max(5, baseAtk + randomVariance - boss.defense);

      // Crit chance player
      const isCrit = Math.random() * 100 <= pStats.critRate;
      if (isCrit) {
        rawDamage = Math.floor(rawDamage * 1.4); // Dikurangi dari 1.5
      }

      // Tambahan pet (dikurangi)
      let petDamage = 0;
      if (pStats.activePet) {
        if (pStats.activePet.tier === 'SS') petDamage = Math.floor(rawDamage * (0.3 + Math.random() * 0.2));
        if (pStats.activePet.tier === 'SSS') petDamage = Math.floor(rawDamage * (0.7 + Math.random() * 0.3));
      }

      const totalDmgDealt = rawDamage + petDamage;

      // Kurangi HP boss
      boss.hp = Math.max(0, boss.hp - totalDmgDealt);

      // Catat kontribusi damage
      if (!boss.participants[userId]) {
        boss.participants[userId] = 0;
      }
      boss.participants[userId] += totalDmgDealt;
      player.battleStats.worldBossDamage += totalDmgDealt;

      let log = `🐲 *SERANGAN WORLD BOSS!* 🐲\n`;
      log += `World Boss: *${boss.name}* (Lv. ${boss.level})\n`;
      log += `HP Boss: ${boss.hp}/${boss.maxHp}\n`;
      log += `────────────────────────\n`;
      log += `🗡️ Kamu menghasilkan *-${rawDamage} damage* ${isCrit ? "💥 *(CRITICAL)*" : ""}\n`;
      if (petDamage > 0) {
        log += `🐾 Pet *${pStats.activePet.name}* ikut menyerang: *-${petDamage} damage*!\n`;
      }
      log += `🔥 Total damage-mu ke boss: *${totalDmgDealt} damage*\n\n`;

      // Boss membalas player — LEBIH KERAS
      let bossAtk = boss.attack + Math.floor(Math.random() * (80 + boss.level * 2));
      let playerDef = pStats.pdef;
      let bossDamage = Math.max(15, bossAtk - playerDef);
      
      // Kehilangan HP player
      player.hp = Math.max(1, player.hp - bossDamage); // Minimal tersisa 1 HP
      log += `👊 *${boss.name}* membalas seranganmu: *-${bossDamage} HP*!\n`;
      log += `❤️ HP-mu sekarang: ${player.hp}/${pStats.maxHp}\n`;

      // Jika Boss Mati
      if (boss.hp <= 0) {
        boss.isActive = false;
        boss.lastKilledAt = now;
        boss.nextSpawnAt = now + 1000 * 60 * 60 * 3; // Spawn 3 jam lagi (naik dari 2)

        log += `\n🏆 *WORLD BOSS TELAH DIKALAHKAN!* 🏆\n`;
        log += `Menghitung hadiah kontributor...\n────────────────────────\n`;

        const totalDmgDone = Object.values(boss.participants).reduce((sum, d) => sum + d, 0) || 1;

        // Cari Top Damager
        const contributors = Object.entries(boss.participants)
          .map(([id, dmg]) => ({ id, dmg }))
          .sort((a, b) => b.dmg - a.dmg);

        const top1 = contributors[0];

        // Bagikan reward ke seluruh kontributor aktif — REWARD DIKURANGI
        for (const contrib of contributors) {
          const share = contrib.dmg / totalDmgDone;
          const goldGain = Math.max(100, Math.floor(6000 * share)); // Dikurangi dari 10000
          const expGain = Math.max(50, Math.floor(3000 * share)); // Dikurangi dari 5000

          const p = db.getPlayer(contrib.id);
          p.gold += goldGain;
          p.exp += expGain;

          // Drop item dengan peluang — PELUANG DIKURANGI
          let droppedItems = [];
          const rand = Math.random() * 100;
          
          if (top1 && contrib.id === top1.id) {
            // MVP Loot Pool — dikurangi
            if (rand < 30) droppedItems.push("egg_mythic"); // 45 → 30
            else if (rand < 70) droppedItems.push("egg_legends");

            if (Math.random() < 0.35) droppedItems.push("magic_shard");
            if (Math.random() < 0.20) droppedItems.push("elixir");
          } else if (share >= 0.20) {
            // High Tier Loot Pool
            if (rand < 20) droppedItems.push("egg_legends"); // 30 → 20
            else if (rand < 55) droppedItems.push("egg_rare");

            if (Math.random() < 0.20) droppedItems.push("magic_shard");
          } else if (share >= 0.05) {
            // Mid Tier Loot Pool
            if (rand < 15) droppedItems.push("egg_rare");
            else if (rand < 45) droppedItems.push("egg_uncommon");
          } else {
            // Low Tier Loot Pool
            if (rand < 5) droppedItems.push("egg_uncommon");
            else if (rand < 25) droppedItems.push("egg_common");
          }

          for (const itemKey of droppedItems) {
            p.inventory[itemKey] = (p.inventory[itemKey] || 0) + 1;
          }

          helpers.checkLevelUp(p);
          db.savePlayer(p);

          if (contrib.id === userId) {
            log += `🎁 Hadiahmu (Share: ${(share * 100).toFixed(1)}%):\n`;
            log += `• +${goldGain} Gold 🪙\n• +${expGain} EXP\n`;
            if (droppedItems.length > 0) {
              const itemsText = droppedItems.map(k => `1x *${items[k]?.name || k}*`).join(', ');
              log += `• Loot: ${itemsText}!\n`;
            } else {
              log += `• Loot: *Tidak mendapatkan item* (Unlucky 💀)\n`;
            }
          }
        }

        if (top1) {
          const topPlayer = db.getPlayer(top1.id);
          log += `\n👑 *MVP Damager:* ${topPlayer.name} dengan *${top1.dmg} damage*! (Hadiah MVP terkirim)`;
        }
      }

      // Simpan perubahan data boss dan player
      db.saveWorldBoss(boss);
      db.savePlayer(player);

      return reply(sock, msg, log);
    }

    case 'boss_top': {
      const boss = getOrInitWorldBoss();
      if (!boss.participants || Object.keys(boss.participants).length === 0) {
        return reply(sock, msg, `🐲 Belum ada damage terdaftar pada World Boss saat ini.`);
      }

      const sorted = Object.entries(boss.participants)
        .map(([id, dmg]) => ({ name: db.getPlayer(id).name, dmg }))
        .sort((a, b) => b.dmg - a.dmg);

      let out = `🏆 *TOP DAMAGE WORLD BOSS: ${boss.name}* 🏆\n────────────────────────\n`;
      sorted.forEach((p, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        out += `${medal} *${p.name}* - ${p.dmg} damage\n`;
      });
      return reply(sock, msg, out);
    }
  }
}

module.exports = {
  handleBattleCommands
};
