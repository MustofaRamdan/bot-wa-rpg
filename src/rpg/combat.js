// ================== TURN-BASED COMBAT ENGINE (OVERHAUL - HARD MODE) ==================

const classes = require('./classes');
const items = require('../config/items');

// Helper untuk menghitung total stats player lengkap (Base + Growth + Alokasi + Equip + Pet)
function getDerivedStats(player) {
  const jobKey = player.job || 'warrior';
  const job = classes.jobs[jobKey];
  
  // 1. Hitung Base Stats dari Level & Growth
  const lvlMultiplier = player.level - 1;
  const baseStr = job.baseStats.str + (lvlMultiplier * job.growth.str);
  const baseInt = job.baseStats.int + (lvlMultiplier * job.growth.int);
  const baseVit = job.baseStats.vit + (lvlMultiplier * job.growth.vit);
  const baseAgi = job.baseStats.agi + (lvlMultiplier * job.growth.agi);
  const baseDex = job.baseStats.dex + (lvlMultiplier * job.growth.dex);

  // 2. Tambahkan Poin Alokasi Player, Bonus Achievement, & Stats Guild Training Hall
  const ach = player.achievementStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
  const gStats = player.guildStats || { str: 0, int: 0, vit: 0, agi: 0, dex: 0 };
  let totalStr = baseStr + (player.stats.str || 0) + (ach.str || 0) + (gStats.str || 0);
  let totalInt = baseInt + (player.stats.int || 0) + (ach.int || 0) + (gStats.int || 0);
  let totalVit = baseVit + (player.stats.vit || 0) + (ach.vit || 0) + (gStats.vit || 0);
  let totalAgi = baseAgi + (player.stats.agi || 0) + (ach.agi || 0) + (gStats.agi || 0);
  let totalDex = baseDex + (player.stats.dex || 0) + (ach.dex || 0) + (gStats.dex || 0);

  // 3. Tambahkan Efek Equipment
  let weaponFlatAtk = 0;
  let armorFlatDef = 0;

  if (player.equipment.weapon) {
    const weaponObj = player.equipment.weapon;
    const weaponKey = typeof weaponObj === 'string' ? weaponObj : weaponObj.key;
    const weaponLvl = typeof weaponObj === 'string' ? 0 : (weaponObj.level || 0);
    const weapon = items[weaponKey];
    
    if (weapon && weapon.stats) {
      const scale = 1 + (weaponLvl * 0.15);
      if (weapon.stats.str) totalStr += weapon.stats.str * scale;
      if (weapon.stats.int) totalInt += weapon.stats.int * scale;
      if (weapon.stats.dex) totalDex += weapon.stats.dex * scale;
      if (weapon.stats.agi) totalAgi += weapon.stats.agi * scale;
    }
  }

  if (player.equipment.armor) {
    const armorObj = player.equipment.armor;
    const armorKey = typeof armorObj === 'string' ? armorObj : armorObj.key;
    const armorLvl = typeof armorObj === 'string' ? 0 : (armorObj.level || 0);
    const armor = items[armorKey];
    
    if (armor) {
      const scale = 1 + (armorLvl * 0.15);
      if (armor.stats) {
        if (armor.stats.vit) totalVit += armor.stats.vit * scale;
        if (armor.stats.def) armorFlatDef += armor.stats.def * scale;
        if (armor.stats.int) totalInt += armor.stats.int * scale;
        if (armor.stats.agi) totalAgi += armor.stats.agi * scale;
      }
    }
  }

  // 4. Tambahkan Efek Pet Aktif
  let petBonusAtk = 0;
  let petBonusDef = 0;
  let activePet = null;

  if (player.pets && player.activePetId) {
    activePet = player.pets.find(p => p.id === player.activePetId);
    if (activePet) {
      petBonusAtk = activePet.bonusAttack || 0;
      petBonusDef = activePet.bonusDefense || 0;
    }
  }

  // Bulatkan stats ke bawah
  const str = Math.floor(totalStr);
  const int = Math.floor(totalInt);
  const vit = Math.floor(totalVit);
  const agi = Math.floor(totalAgi);
  const dex = Math.floor(totalDex);

  // Tambahan efek Level Guild (Passive Stats Buff)
  let guildHpBonus = 1.0;
  let guildMpBonus = 1.0;
  let guildAtkBonus = 1.0;
  let guildDefBonus = 1.0;

  if (player.guild) {
    const db = require('../database/db'); // lazy load
    const guild = db.getGuild(player.guild);
    if (guild) {
      const gLvl = guild.level || 1;
      if (gLvl >= 5) {
        guildHpBonus = 1.05;
        guildMpBonus = 1.05;
        guildAtkBonus = 1.05;
        guildDefBonus = 1.04;
      } else if (gLvl === 4) {
        guildHpBonus = 1.04;
        guildMpBonus = 1.04;
        guildAtkBonus = 1.03;
        guildDefBonus = 1.02;
      } else if (gLvl === 3) {
        guildHpBonus = 1.03;
        guildMpBonus = 1.03;
        guildAtkBonus = 1.02;
        guildDefBonus = 1.01;
      } else if (gLvl === 2) {
        guildHpBonus = 1.02;
        guildMpBonus = 1.02;
        guildAtkBonus = 1.01;
      } else if (gLvl === 1) {
        guildHpBonus = 1.01;
        guildMpBonus = 1.01;
      }
    }
  }

  // 5. Hitung Derived Stats menggunakan formula RPG baru (SANGAT stats-dependent)
  const maxHp = Math.floor(classes.getMaxHp(player.level, vit) * guildHpBonus);
  const maxMp = Math.floor(classes.getMaxMp(player.level, int) * guildMpBonus);
  const patk = Math.floor((classes.getPhysicalAttack(str, weaponFlatAtk) + petBonusAtk) * guildAtkBonus);
  const matk = Math.floor((classes.getMagicAttack(int) + petBonusAtk) * guildAtkBonus);
  const pdef = Math.floor((classes.getPhysicalDefense(vit, armorFlatDef) + petBonusDef) * guildDefBonus);
  const critRate = classes.getCriticalRate(agi);
  const evasionRate = classes.getEvasionRate(agi);
  const accuracy = classes.getAccuracyRate(dex);

  return {
    str, int, vit, agi, dex,
    maxHp, maxMp,
    patk, matk, pdef,
    critRate, evasionRate, accuracy,
    activePet
  };
}

// Simulasi Pertarungan Turn-Based (Player vs Monster) — HARD MODE
function simulateCombat(player, monster) {
  const pStats = getDerivedStats(player);
  
  // Monster stats scaling based on player level difference (anti-easy-farming)
  // Scaling lebih agresif: monster jadi JAUH lebih kuat jika player over-level
  const lvlDiff = Math.max(0, player.level - monster.level);
  const mMaxHp = Math.floor(monster.hp * (1 + lvlDiff * 0.08));
  const mAttack = Math.floor(monster.attack * (1 + lvlDiff * 0.05));
  const mDefense = Math.floor(monster.defense * (1 + lvlDiff * 0.04));

  let pHP = player.hp;
  let pMP = player.mp;
  let mHP = mMaxHp;
  const maxTurns = 20;
  let log = "";
  
  // Variabel efek pertarungan
  const hasPassive = (key) => player.unlockedPassives && player.unlockedPassives.includes(key);

  let pShield = 0;           // Buff Paladin
  let pCritBonus = 0;        // Buff Archer
  let pEvaBonus = hasPassive('shadow_assault') ? 12 : 0; // Buff Rogue + Pasif Shadow Assault (dikurangi)
  let pStrBuff = 1.0;        // Buff Berserker
  let pDefDebuff = 1.0;      // Debuff Berserker

  let burnTurns = 0;
  let poisonTurns = 0;
  let bossStunned = false;
  let pDefBonus = 0;

  log += `⚔ *${player.name}* (${pStats.maxHp} HP, Job: ${player.job ? classes.jobs[player.job].name : 'None'}) vs *${monster.name}* (${mMaxHp} HP)\n`;
  log += `--------------------------------------\n`;

  let turn = 1;
  while (pHP > 0 && mHP > 0 && turn <= maxTurns) {
    log += `*Turn ${turn}*\n`;

    // Pasif Monk Chakra Meditation (dikurangi: 3% → 1.5%)
    if (hasPassive('chakra_meditation')) {
      const regenHp = Math.max(1, Math.floor(pStats.maxHp * 0.015));
      const regenMp = Math.max(1, Math.floor(pStats.maxMp * 0.02));
      pHP = Math.min(pStats.maxHp, pHP + regenHp);
      pMP = Math.min(pStats.maxMp, pMP + regenMp);
      log += `🧘 *Chakra Meditation:* Memulihkan *+${regenHp} HP* & *+${regenMp} MP*.\n`;
    }

    // ==========================================
    // 1. GILIRAN PLAYER
    // ==========================================
    let actionText = "";
    let pDamage = 0;
    
    // Logika AI Menggunakan Skill (dinaikkan ke 75% chance)
    let usedSkill = null;
    const jobKey = player.job || 'warrior';
    const jobConfig = classes.jobs[jobKey];
    
    if (jobConfig && jobConfig.skills && jobConfig.skills.length > 0) {
      const skills = jobConfig.skills;
      const canCast = skills.filter(s => pMP >= s.mpCost);
      
      if (canCast.length > 0 && Math.random() < 0.75) { // 75% chance pakai skill (naik dari 60%)
        if (jobKey === 'cleric' && pHP < pStats.maxHp * 0.5) {
          usedSkill = skills.find(s => s.key === 'cure') || canCast[0];
        } else if (jobKey === 'high_priest' && pHP < pStats.maxHp * 0.5) {
          usedSkill = skills.find(s => s.key === 'sanctuary') || skills.find(s => s.key === 'cure') || canCast[0];
        } else if (jobKey === 'paladin' && pHP < pStats.maxHp * 0.6 && pShield <= 0) {
          usedSkill = skills.find(s => s.key === 'holy_barrier') || canCast[0];
        } else if (jobKey === 'templar' && pHP < pStats.maxHp * 0.6 && pShield <= 0) {
          usedSkill = skills.find(s => s.key === 'holy_barrier') || skills.find(s => s.key === 'grand_cross') || canCast[0];
        } else if (jobKey === 'warrior' && pHP < pStats.maxHp * 0.4) {
          usedSkill = skills.find(s => s.key === 'iron_will') || canCast[0];
        } else if (jobKey === 'lord_knight' && pHP < pStats.maxHp * 0.4) {
          usedSkill = skills.find(s => s.key === 'iron_will') || canCast[0];
        } else if (jobKey === 'mage' && pMP < 20) {
          usedSkill = skills.find(s => s.key === 'mana_surge') || canCast[0];
        } else if (jobKey === 'archmage' && pMP < 20) {
          usedSkill = skills.find(s => s.key === 'mana_surge') || canCast[0];
        } else if (jobKey === 'monk' && pHP < pStats.maxHp * 0.4) {
          usedSkill = skills.find(s => s.key === 'chakra') || canCast[0];
        } else if (jobKey === 'grandmaster' && pHP < pStats.maxHp * 0.4) {
          usedSkill = skills.find(s => s.key === 'chakra') || canCast[0];
        } else {
          usedSkill = canCast.find(s => s.type === 'damage') || canCast[Math.floor(Math.random() * canCast.length)];
        }
      }
    }

    if (usedSkill) {
      pMP -= usedSkill.mpCost;
      actionText += `🔮 Menggunakan *${usedSkill.name}* (MP -${usedSkill.mpCost})\n`;

      if (usedSkill.type === 'damage') {
        let baseDmg = 0;
        
        // Formula damage berbasis skill
        if (usedSkill.key === 'double_slash') {
          baseDmg = pStats.patk * pStrBuff * 1.8;
        } else if (usedSkill.key === 'smite') {
          baseDmg = (pStats.str * pStrBuff * 1.2) + (pStats.vit * 1.5);
        } else if (usedSkill.key === 'fireball') {
          baseDmg = pStats.matk * 2.5;
        } else if (usedSkill.key === 'holy_light') {
          baseDmg = (pStats.int * 1.5) + (pStats.str * pStrBuff * 0.8);
        } else if (usedSkill.key === 'sneak_attack') {
          baseDmg = (pStats.dex * 1.6) + (pStats.agi * 1.2);
        } else if (usedSkill.key === 'arrow_shower') {
          baseDmg = pStats.dex * 2.2;
        } else if (usedSkill.key === 'heavy_strike') {
          baseDmg = pStats.str * pStrBuff * 2.5;
        } else if (usedSkill.key === 'dragon_fist') {
          baseDmg = (pStats.str * pStrBuff * 1.2) + (pStats.agi * 1.2) + (pStats.dex * 0.8);
        } else if (usedSkill.key === 'spiral_pierce') {
          baseDmg = pStats.str * pStrBuff * 3.0;
        } else if (usedSkill.key === 'grand_cross') {
          baseDmg = (pStats.vit * 2.0) + (pStats.int * 2.0);
          const healAmount = Math.floor(pStats.maxHp * 0.12); // Dikurangi dari 15% → 12%
          pHP = Math.min(pStats.maxHp, pHP + healAmount);
          actionText += `💚 Grand Cross memulihkan *+${healAmount} HP*.\n`;
        } else if (usedSkill.key === 'meteor_storm') {
          baseDmg = pStats.matk * 3.8;
        } else if (usedSkill.key === 'sonic_blow') {
          baseDmg = (pStats.dex * 2.5) + (pStats.agi * 2.0);
        } else if (usedSkill.key === 'sharp_shooting') {
          baseDmg = pStats.dex * 3.2;
        } else if (usedSkill.key === 'guillotine_slash') {
          if (mHP <= mMaxHp * 0.20) { // Threshold dikurangi dari 25% → 20%
            baseDmg = mHP + 9999;
            actionText += `🩸 *GUILLOTINE EXECUTION!* Musuh langsung dipancung!\n`;
          } else {
            baseDmg = pStats.str * pStrBuff * 3.0;
          }
        } else if (usedSkill.key === 'asura_strike') {
          baseDmg = (pStats.str * pStrBuff * 4.0) + (pStats.int * 2.0);
          pMP = 0;
          actionText += `👊🔥 Mengonsumsi seluruh MP untuk Asura Strike!\n`;
        }

        // Cek Akurasi Player — DEX SANGAT PENTING, tanpa DEX sering miss!
        const isMagic = usedSkill.damageType === 'magic';
        // Monster evasion lebih tinggi: base 8 + level * 1.0 (naik dari 2 + level * 0.5)
        const mEvasion = 8 + (monster.level * 1.0);
        const finalAcc = pStats.accuracy + (pCritBonus > 0 ? 15 : 0);
        // Hit chance dihitung dari accuracy - monster evasion, floor lebih rendah
        const playerHitChance = Math.max(35, Math.min(96, finalAcc - mEvasion));
        const isHit = isMagic || (Math.random() * 100 <= playerHitChance);
        
        if (!isHit) {
          actionText += `💨 Serangan meleset! (Monster menghindar) [Akurasi: ${playerHitChance}%]\n`;
        } else {
          // Cek Critical
          const isCrit = usedSkill.key === 'sneak_attack' ||
                         (usedSkill.key === 'sharp_shooting' && Math.random() * 100 <= pStats.critRate + 45) ||
                         (usedSkill.key === 'sonic_blow' && Math.random() * 100 <= pStats.critRate + 25) ||
                         (Math.random() * 100 <= pStats.critRate + (pCritBonus > 0 ? 15 : 0));
                         
          // Minimum damage lebih rendah — defense lebih terasa (8% baseDmg, turun dari 20%)
          const minDmg = Math.max(3, Math.ceil(baseDmg * 0.08));
          const actualMDefense = hasPassive('armor_piercing') ? Math.floor(mDefense * 0.70) : mDefense;
          const targetDef = (usedSkill.key === 'spiral_pierce') ? 0 : actualMDefense;
          
          let damage = Math.max(minDmg, baseDmg - targetDef);
          
          if (isCrit) {
            const critMult = hasPassive('shadow_assault') ? 1.8 : 1.4; // Dikurangi dari 2.0/1.5
            damage = Math.floor(damage * critMult);
            actionText += `💥 *CRITICAL HIT!* `;
          }

          if (hasPassive('low_hp_frenzy')) {
            const hpLossPercent = (pStats.maxHp - pHP) / pStats.maxHp;
            const frenzyMult = 1.0 + (hpLossPercent * 0.4); // Dikurangi dari 0.5
            damage = Math.floor(damage * frenzyMult);
          }
          
          pDamage = Math.floor(damage);
          mHP -= pDamage;
          actionText += `🗡 Menghasilkan *-${pDamage} HP* ke monster.\n`;

          // Trigger Status Effects
          if (usedSkill.key === 'fireball') {
            burnTurns = 3;
            actionText += `🔥 Fireball memicu efek Burn selama 3 turn!\n`;
          } else if (usedSkill.key === 'meteor_storm') {
            burnTurns = 3;
            actionText += `🔥 Meteor Storm memicu efek Burn selama 3 turn!\n`;
          } else if (usedSkill.key === 'sneak_attack') {
            poisonTurns = 3;
            actionText += `🤢 Sneak Attack meracuni musuh selama 3 turn!\n`;
          } else if (usedSkill.key === 'dragon_fist' && Math.random() < 0.20) { // Dikurangi dari 25%
            bossStunned = true;
            actionText += `💫 Dragon Fist membuat musuh Stun!\n`;
          }
        }

      } else if (usedSkill.type === 'heal') {
        let healAmount = 0;
        if (usedSkill.key === 'cure') {
          healAmount = (pStats.int * 1.8) + (pStats.vit * 0.8); // Dikurangi dari 2.0/1.0
        } else if (usedSkill.key === 'chakra') {
          healAmount = (pStats.str * pStrBuff * 0.4) + 15; // Dikurangi
          pMP = Math.min(pStats.maxMp, pMP + (pStats.int * 0.8) + 3); // Dikurangi
          actionText += `🧘 Memulihkan MP.\n`;
        } else if (usedSkill.key === 'sanctuary') {
          healAmount = Math.floor(pStats.maxHp * 0.75); // Dikurangi dari HP penuh → 75% Max HP
          pDefBonus = 25; // Dikurangi dari 30
          actionText += `⛪ Sanctuary meningkatkan DEF +25%!\n`;
        }

        if (hasPassive('divine_favor')) {
          healAmount = Math.floor(healAmount * 1.20); // Dikurangi dari 1.25
        }
        healAmount = Math.floor(healAmount);
        pHP = Math.min(pStats.maxHp, pHP + healAmount);
        actionText += `💚 Memulihkan *+${healAmount} HP* (${pHP}/${pStats.maxHp}).\n`;

      } else if (usedSkill.type === 'heal_mp') {
        if (usedSkill.key === 'mana_surge') {
          const mpAmount = Math.floor((pStats.int * 0.8) + 10); // Dikurangi
          pMP = Math.min(pStats.maxMp, pMP + mpAmount);
          actionText += `✨ Memulihkan *+${mpAmount} MP* (${pMP}/${pStats.maxMp}).\n`;
        }

      } else if (usedSkill.type === 'buff') {
        if (usedSkill.key === 'iron_will') {
          const healAmount = Math.floor(pStats.vit * 1.2 + 5); // Dikurangi
          pHP = Math.min(pStats.maxHp, pHP + healAmount);
          actionText += `🛡 Defense meningkat, memulihkan *+${healAmount} HP*.\n`;
        } else if (usedSkill.key === 'holy_barrier') {
          pShield = Math.floor(pStats.vit * 2.5); // Dikurangi dari 3.0
          actionText += `🛡 Shield menyerap *${pShield} damage* diaktifkan.\n`;
        } else if (usedSkill.key === 'shadow_step') {
          pEvaBonus = 20; // Dikurangi dari 25
          actionText += `💨 Evasion meningkat +20%.\n`;
        } else if (usedSkill.key === 'focus_aim') {
          pCritBonus = 15; // Dikurangi dari 20
          actionText += `🎯 Akurasi & Crit Rate meningkat +15%.\n`;
        } else if (usedSkill.key === 'rage') {
          pStrBuff = 1.35; // Dikurangi dari 1.4
          pDefDebuff = 0.7; // Lebih besar penalty, dari 0.8
          actionText += `😡 Memasuki mode RAGE! ATK +35%, DEF -30%.\n`;
        }
      }

    } else {
      // Basic Physical Attack
      actionText += `🗡 Menyerang biasa.\n`;
      // Monster evasion lebih tinggi
      const mEvasion = 8 + (monster.level * 1.0);
      const finalAcc = pStats.accuracy + (pCritBonus > 0 ? 15 : 0);
      const playerHitChance = Math.max(35, Math.min(96, finalAcc - mEvasion));
      const isHit = Math.random() * 100 <= playerHitChance;
      
      if (!isHit) {
        actionText += `💨 Serangan meleset! (Monster menghindar) [Akurasi: ${playerHitChance}%]\n`;
      } else {
        const isCrit = Math.random() * 100 <= pStats.critRate + (pCritBonus > 0 ? 15 : 0);
        let dmg = pStats.patk * pStrBuff + Math.floor(Math.random() * 3);
        const actualMDefense = hasPassive('armor_piercing') ? Math.floor(mDefense * 0.70) : mDefense;
        const minDmg = Math.max(1, Math.ceil(dmg * 0.08)); // Dikurangi dari 0.20
        let damage = Math.max(minDmg, dmg - actualMDefense);
        
        if (isCrit) {
          const critMult = hasPassive('shadow_assault') ? 1.8 : 1.4;
          damage = Math.floor(damage * critMult);
          actionText += `💥 *CRITICAL HIT!* `;
        }

        if (hasPassive('low_hp_frenzy')) {
          const hpLossPercent = (pStats.maxHp - pHP) / pStats.maxHp;
          const frenzyMult = 1.0 + (hpLossPercent * 0.4);
          damage = Math.floor(damage * frenzyMult);
        }
        
        pDamage = Math.floor(damage);
        mHP -= pDamage;
        actionText += `🗡 Menghasilkan *-${pDamage} HP* ke monster.\n`;
      }
    }

    // Serangan Asisten Pet (dikurangi damage)
    if (pDamage > 0 && pStats.activePet) {
      const pet = pStats.activePet;
      let petDamage = 0;
      
      if (pet.tier === 'SS') {
        const mul = 0.3 + Math.random() * 0.3; // Dikurangi dari 0.5-1.0
        petDamage = Math.floor(pDamage * mul);
      } else if (pet.tier === 'SSS') {
        const mul = 0.8 + Math.random() * 0.4; // Dikurangi dari 1.5-2.0
        petDamage = Math.floor(pDamage * mul);
      }
      
      if (petDamage > 0) {
        mHP -= petDamage;
        actionText += `🐾 *Pet ${pet.name}* ikut mencabik musuh: *-${petDamage} HP*!\n`;
      }
    }

    log += actionText;

    if (mHP <= 0) {
      log += `💀 *${monster.name}* telah dikalahkan!\n\n`;
      break;
    }

    // ==========================================
    // 2. GILIRAN MONSTER (LEBIH KERAS)
    // ==========================================
    let monsterText = "";
    
    if (bossStunned) {
      monsterText += `💫 Musuh pusing (Stun) dan melewatkan giliran turn ini!\n`;
      bossStunned = false;
    } else {
      // Monster accuracy lebih tinggi: 85 + level * 0.8 (naik dari 90 + level * 0.2)
      const mAccuracy = 85 + monster.level * 0.8;
      const monsterHitChance = Math.max(45, Math.min(92, mAccuracy - (pStats.evasionRate + pEvaBonus)));
      const isHitByMonster = Math.random() * 100 <= monsterHitChance;

      if (!isHitByMonster) {
        monsterText += `💨 Evasion! Kamu menghindari serangan *${monster.name}*.\n`;
      } else {
        let mDmg = mAttack + Math.floor(Math.random() * (4 + monster.level * 0.3));
        let pDef = (pStats.pdef + (pStats.pdef * pDefBonus / 100)) * pDefDebuff;
        // Minimum monster damage lebih tinggi (15% base, naik dari 20% tapi base ATK jauh lebih tinggi)
        const minMonsterDmg = Math.max(3, Math.ceil(mAttack * 0.15));
        let damage = Math.max(minMonsterDmg, mDmg - pDef);
        
        // 14% chance monster critical hit (naik dari 8%)
        const mCrit = Math.random() < 0.14;
        if (mCrit) {
          damage = Math.floor(damage * 1.6); // Crit damage naik dari 1.5
          monsterText += `🔥 *Monster Critical!* `;
        }
        
        let finalDamage = Math.floor(damage);
        
        // Pasif Warrior: Shield Block (dikurangi dari 12% → 8%)
        if (hasPassive('shield_block') && Math.random() < 0.08 && finalDamage > 0) {
          monsterText += `🛡️ *Shield Block!* Kamu memblokir seluruh damage dari *${monster.name}*!\n`;
          finalDamage = 0;
        }

        // Pasif Mage: Mana Shield (dikurangi absorb dari 20% → 15%)
        if (hasPassive('mana_shield') && finalDamage > 0 && pMP > 0) {
          const dmgToAbsorb = Math.floor(finalDamage * 0.15);
          const mpNeeded = Math.ceil(dmgToAbsorb / 2);
          const actualMpCost = Math.min(pMP, mpNeeded);
          const actualDmgAbsorbed = actualMpCost * 2;
          pMP -= actualMpCost;
          finalDamage -= actualDmgAbsorbed;
          monsterText += `🔮 *Mana Shield!* Menyerap *${actualDmgAbsorbed} damage* menggunakan *${actualMpCost} MP*.\n`;
        }

        // Pasif Paladin: Divine Absorb (dikurangi dari 8% → 5%)
        if (hasPassive('divine_absorb') && finalDamage > 0) {
          const mpGained = Math.max(1, Math.floor(finalDamage * 0.05));
          pMP = Math.min(pStats.maxMp, pMP + mpGained);
          monsterText += `✨ *Divine Absorb!* Mengubah damage menjadi *+${mpGained} MP*.\n`;
        }

        // Jika memiliki shield (Paladin)
        if (pShield > 0 && finalDamage > 0) {
          if (pShield >= finalDamage) {
            pShield -= finalDamage;
            monsterText += `🛡 Shield menyerap seluruh damage! (Sisa Shield: ${pShield})\n`;
            finalDamage = 0;
          } else {
            finalDamage -= pShield;
            monsterText += `🛡 Shield hancur! Menyerap ${pShield} damage.\n`;
            pShield = 0;
          }
        }
        
        if (finalDamage > 0) {
          pHP -= finalDamage;
          monsterText += `👹 *${monster.name}* mencakar kamu: *-${finalDamage} HP*.\n`;
        }
      }
    }

    log += monsterText;

    // Ticking Burn/Poison status effects at end of turn (dikurangi sedikit)
    if (mHP > 0) {
      let tickText = "";
      if (burnTurns > 0) {
        const burnDmg = Math.floor(pStats.int * 0.8); // Dikurangi dari 1.0
        mHP -= burnDmg;
        burnTurns--;
        tickText += `🔥 Monster terbakar: *-${burnDmg} HP* (Sisa ${burnTurns} turn)\n`;
      }
      if (poisonTurns > 0) {
        const poisonDmg = Math.floor(pStats.dex * 0.6); // Dikurangi dari 0.8
        mHP -= poisonDmg;
        poisonTurns--;
        tickText += `🤢 Monster terkena racun: *-${poisonDmg} HP* (Sisa ${poisonTurns} turn)\n`;
      }
      if (tickText) {
        log += tickText;
        if (mHP <= 0) {
          log += `💀 *${monster.name}* telah dikalahkan oleh status effect!\n\n`;
          break;
        }
      }
    }

    log += `📊 Sisa HP-mu: ${Math.max(0, Math.floor(pHP))}/${pStats.maxHp} | HP Monster: ${Math.max(0, Math.floor(mHP))}\n\n`;

    if (pHP <= 0) {
      log += `💀 Kamu pingsan dikalahkan oleh *${monster.name}*!\n\n`;
      break;
    }

    turn++;
  }

  if (turn > maxTurns && pHP > 0 && mHP > 0) {
    log += `🤝 Pertarungan berakhir seri karena kelelahan (Maksimal 20 Turn)!\n\n`;
  }

  return {
    success: mHP <= 0,
    draw: pHP > 0 && mHP > 0,
    log,
    finalPlayerHp: Math.max(0, Math.floor(pHP)),
    finalPlayerMp: Math.max(0, Math.floor(pMP)),
    maxHp: pStats.maxHp,
    maxMp: pStats.maxMp
  };
}

// Simulasi Duel PVP Turn-Based (Player 1 vs Player 2)
function simulateDuel(p1, p2) {
  const p1Stats = getDerivedStats(p1);
  const p2Stats = getDerivedStats(p2);

  let p1HP = p1Stats.maxHp;
  let p1MP = p1Stats.maxMp;
  let p2HP = p2Stats.maxHp;
  let p2MP = p2Stats.maxMp;

  const maxTurns = 20;
  let log = `⚔️ *DUEL MEMATIKAN* ⚔️\n*${p1.name}* (${p1Stats.maxHp} HP) vs *${p2.name}* (${p2Stats.maxHp} HP)\n`;
  log += `────────────────────────\n\n`;

  // Status efek
  let p1Shield = 0, p2Shield = 0;
  let p1CritBonus = 0, p2CritBonus = 0;
  let p1EvaBonus = 0, p2EvaBonus = 0;
  let p1StrBuff = 1.0, p2StrBuff = 1.0;
  let p1DefDebuff = 1.0, p2DefDebuff = 1.0;

  let turn = 1;
  while (p1HP > 0 && p2HP > 0 && turn <= maxTurns) {
    log += `*Turn ${turn}*\n`;

    // Helper execute turn
    const executeTurn = (attacker, attackerStats, defender, defenderStats, atkHP, atkMP, defHP, defMP, shieldAtk, shieldDef, critBonusAtk, evaBonusDef, strBuffAtk, defDebuffAtk) => {
      let turnLog = "";
      let pDamage = 0;
      let usedSkill = null;

      const jobKey = attacker.job || 'warrior';
      const jobConfig = classes.jobs[jobKey];

      // Skill selection (75% chance)
      if (jobConfig && jobConfig.skills && jobConfig.skills.length > 0) {
        const canCast = jobConfig.skills.filter(s => atkMP >= s.mpCost);
        if (canCast.length > 0 && Math.random() < 0.75) {
          if (jobKey === 'cleric' && atkHP < attackerStats.maxHp * 0.5) {
            usedSkill = canCast.find(s => s.key === 'cure') || canCast[0];
          } else if (jobKey === 'paladin' && atkHP < attackerStats.maxHp * 0.6 && shieldAtk <= 0) {
            usedSkill = canCast.find(s => s.key === 'holy_barrier') || canCast[0];
          } else if (jobKey === 'warrior' && atkHP < attackerStats.maxHp * 0.4) {
            usedSkill = canCast.find(s => s.key === 'iron_will') || canCast[0];
          } else if (jobKey === 'mage' && atkMP < 20) {
            usedSkill = canCast.find(s => s.key === 'mana_surge') || canCast[0];
          } else if (jobKey === 'monk' && atkHP < attackerStats.maxHp * 0.4) {
            usedSkill = canCast.find(s => s.key === 'chakra') || canCast[0];
          } else {
            usedSkill = canCast.find(s => s.type === 'damage') || canCast[Math.floor(Math.random() * canCast.length)];
          }
        }
      }

      let newAtkHP = atkHP;
      let newAtkMP = atkMP;
      let newDefHP = defHP;
      let newShieldAtk = shieldAtk;
      let newShieldDef = shieldDef;
      let newCritBonusAtk = critBonusAtk;
      let newEvaBonusDef = evaBonusDef;
      let newStrBuffAtk = strBuffAtk;
      let newDefDebuffAtk = defDebuffAtk;

      if (usedSkill) {
        newAtkMP -= usedSkill.mpCost;
        turnLog += `👉 *${attacker.name}* menggunakan *${usedSkill.name}* (MP -${usedSkill.mpCost})\n`;

        if (usedSkill.type === 'damage') {
          let baseDmg = 0;
          if (usedSkill.key === 'double_slash') {
            baseDmg = attackerStats.patk * strBuffAtk * 1.8;
          } else if (usedSkill.key === 'smite') {
            baseDmg = (attackerStats.str * strBuffAtk * 1.2) + (attackerStats.vit * 1.5);
          } else if (usedSkill.key === 'fireball') {
            baseDmg = attackerStats.matk * 2.5;
          } else if (usedSkill.key === 'holy_light') {
            baseDmg = (attackerStats.int * 1.5) + (attackerStats.str * strBuffAtk * 0.8);
          } else if (usedSkill.key === 'sneak_attack') {
            baseDmg = (attackerStats.dex * 1.6) + (attackerStats.agi * 1.2);
          } else if (usedSkill.key === 'arrow_shower') {
            baseDmg = attackerStats.dex * 2.2;
          } else if (usedSkill.key === 'heavy_strike') {
            baseDmg = attackerStats.str * strBuffAtk * 2.5;
          } else if (usedSkill.key === 'dragon_fist') {
            baseDmg = (attackerStats.str * strBuffAtk * 1.2) + (attackerStats.agi * 1.2) + (attackerStats.dex * 0.8);
          }

          const isMagic = usedSkill.damageType === 'magic';
          const finalAcc = attackerStats.accuracy + (critBonusAtk > 0 ? 15 : 0);
          const finalEva = defenderStats.evasionRate + newEvaBonusDef;
          const hitChance = Math.max(35, Math.min(96, finalAcc - finalEva));
          const isHit = isMagic || (Math.random() * 100 <= hitChance);

          if (!isHit) {
            turnLog += `💨 Serangan meleset! (*${defender.name}* menghindar)\n`;
          } else {
            const isCrit = usedSkill.key === 'sneak_attack' || (Math.random() * 100 <= attackerStats.critRate + (critBonusAtk > 0 ? 15 : 0));
            const minDmg = Math.max(3, Math.floor(baseDmg * 0.08));
            let damage = Math.max(minDmg, baseDmg - defenderStats.pdef);
            if (isCrit) {
              damage = Math.floor(damage * 1.4);
              turnLog += `💥 *CRITICAL HIT!* `;
            }
            pDamage = Math.floor(damage);

              // Apply shield
              if (newShieldDef > 0) {
                if (newShieldDef >= pDamage) {
                  newShieldDef -= pDamage;
                  turnLog += `🛡 Shield *${defender.name}* menyerap seluruh damage! (Sisa Shield: ${newShieldDef})\n`;
                  pDamage = 0;
                } else {
                  pDamage -= newShieldDef;
                  turnLog += `🛡 Shield *${defender.name}* hancur menyerap ${newShieldDef} damage!\n`;
                  newShieldDef = 0;
                }
              }

              if (pDamage > 0) {
                newDefHP -= pDamage;
                turnLog += `🗡 Menghasilkan *-${pDamage} HP* ke *${defender.name}*.\n`;
              }
            }
          } else if (usedSkill.type === 'heal') {
          let healAmount = 0;
          if (usedSkill.key === 'cure') {
            healAmount = (attackerStats.int * 1.8) + (attackerStats.vit * 0.8);
          } else if (usedSkill.key === 'chakra') {
            healAmount = (attackerStats.str * strBuffAtk * 0.4) + 15;
            newAtkMP = Math.min(attackerStats.maxMp, newAtkMP + (attackerStats.int * 0.8) + 3);
            turnLog += `🧘 Memulihkan MP.\n`;
          }
          healAmount = Math.floor(healAmount);
          newAtkHP = Math.min(attackerStats.maxHp, newAtkHP + healAmount);
          turnLog += `💚 Memulihkan *+${healAmount} HP* (${newAtkHP}/${attackerStats.maxHp}).\n`;
        } else if (usedSkill.type === 'heal_mp') {
          if (usedSkill.key === 'mana_surge') {
            const mpAmount = Math.floor((attackerStats.int * 0.8) + 10);
            newAtkMP = Math.min(attackerStats.maxMp, newAtkMP + mpAmount);
            turnLog += `✨ Memulihkan *+${mpAmount} MP* (${newAtkMP}/${attackerStats.maxMp}).\n`;
          }
        } else if (usedSkill.type === 'buff') {
          if (usedSkill.key === 'iron_will') {
            const healAmount = Math.floor(attackerStats.vit * 1.2 + 5);
            newAtkHP = Math.min(attackerStats.maxHp, newAtkHP + healAmount);
            turnLog += `🛡 Defense meningkat, memulihkan *+${healAmount} HP*.\n`;
          } else if (usedSkill.key === 'holy_barrier') {
            newShieldAtk = Math.floor(attackerStats.vit * 2.5);
            turnLog += `🛡 Shield menyerap *${newShieldAtk} damage* diaktifkan.\n`;
          } else if (usedSkill.key === 'shadow_step') {
            newEvaBonusDef = 20;
            turnLog += `💨 Evasion meningkat +20%.\n`;
          } else if (usedSkill.key === 'focus_aim') {
            newCritBonusAtk = 15;
            turnLog += `🎯 Akurasi & Crit Rate meningkat +15%.\n`;
          } else if (usedSkill.key === 'rage') {
            newStrBuffAtk = 1.35;
            newDefDebuffAtk = 0.7;
            turnLog += `😡 Mode RAGE! ATK +35%, DEF -30%.\n`;
          }
        }
      } else {
        // Basic Attack
        turnLog += `👉 *${attacker.name}* menyerang biasa.\n`;
        const finalAcc = attackerStats.accuracy + (critBonusAtk > 0 ? 15 : 0);
        const finalEva = defenderStats.evasionRate + newEvaBonusDef;
        const hitChance = Math.max(35, Math.min(96, finalAcc - finalEva));
        const isHit = Math.random() * 100 <= hitChance;

        if (!isHit) {
          turnLog += `💨 Serangan meleset! (*${defender.name}* menghindar)\n`;
        } else {
          const isCrit = Math.random() * 100 <= attackerStats.critRate + (critBonusAtk > 0 ? 15 : 0);
          let dmg = attackerStats.patk * strBuffAtk + Math.floor(Math.random() * 3);
          const minDmg = Math.max(1, Math.floor(dmg * 0.08));
          let damage = Math.max(minDmg, dmg - defenderStats.pdef);
          if (isCrit) {
            damage = Math.floor(damage * 1.4);
            turnLog += `💥 *CRITICAL HIT!* `;
          }
          pDamage = Math.floor(damage);

          if (newShieldDef > 0) {
            if (newShieldDef >= pDamage) {
              newShieldDef -= pDamage;
              turnLog += `🛡 Shield *${defender.name}* menyerap seluruh damage! (Sisa: ${newShieldDef})\n`;
              pDamage = 0;
            } else {
              pDamage -= newShieldDef;
              turnLog += `🛡 Shield *${defender.name}* hancur menyerap ${newShieldDef} damage!\n`;
              newShieldDef = 0;
            }
          }

          if (pDamage > 0) {
            newDefHP -= pDamage;
            turnLog += `🗡 Menghasilkan *-${pDamage} HP* ke *${defender.name}*.\n`;
          }
        }
      }

      // Pet attack bonus (dikurangi)
      if (pDamage > 0 && attackerStats.activePet) {
        const pet = attackerStats.activePet;
        let petDamage = 0;
        if (pet.tier === 'SS') petDamage = Math.floor(pDamage * (0.3 + Math.random() * 0.3));
        else if (pet.tier === 'SSS') petDamage = Math.floor(pDamage * (0.8 + Math.random() * 0.4));

        if (petDamage > 0) {
          newDefHP -= petDamage;
          turnLog += `🐾 *Pet ${pet.name}* ikut mencabik musuh: *-${petDamage} HP*!\n`;
        }
      }

      return {
        log: turnLog,
        atkHP: Math.max(0, newAtkHP),
        atkMP: Math.max(0, newAtkMP),
        defHP: Math.max(0, newDefHP),
        shieldAtk: newShieldAtk,
        shieldDef: newShieldDef,
        critBonusAtk: newCritBonusAtk,
        evaBonusDef: newEvaBonusDef,
        strBuffAtk: newStrBuffAtk,
        defDebuffAtk: newDefDebuffAtk
      };
    };

    // Giliran P1
    const p1Turn = executeTurn(p1, p1Stats, p2, p2Stats, p1HP, p1MP, p2HP, p2MP, p1Shield, p2Shield, p1CritBonus, p2EvaBonus, p1StrBuff, p1DefDebuff);
    log += p1Turn.log;
    p1HP = p1Turn.atkHP;
    p1MP = p1Turn.atkMP;
    p2HP = p1Turn.defHP;
    p1Shield = p1Turn.shieldAtk;
    p2Shield = p1Turn.shieldDef;
    p1CritBonus = p1Turn.critBonusAtk;
    p1StrBuff = p1Turn.strBuffAtk;
    p1DefDebuff = p1Turn.defDebuffAtk;

    log += `📊 HP *${p1.name}*: ${p1HP}/${p1Stats.maxHp} | HP *${p2.name}*: ${p2HP}/${p2Stats.maxHp}\n\n`;

    if (p2HP <= 0) {
      log += `💀 *${p2.name}* telah tumbang!\n🏆 *${p1.name}* memenangkan duel!\n\n`;
      break;
    }

    // Giliran P2
    const p2Turn = executeTurn(p2, p2Stats, p1, p1Stats, p2HP, p2MP, p1HP, p1MP, p2Shield, p1Shield, p2CritBonus, p1EvaBonus, p2StrBuff, p2DefDebuff);
    log += p2Turn.log;
    p2HP = p2Turn.atkHP;
    p2MP = p2Turn.atkMP;
    p1HP = p2Turn.defHP;
    p2Shield = p2Turn.shieldAtk;
    p1Shield = p2Turn.shieldDef;
    p2CritBonus = p2Turn.critBonusAtk;
    p2StrBuff = p2Turn.strBuffAtk;
    p2DefDebuff = p2Turn.defDebuffAtk;

    log += `📊 HP *${p1.name}*: ${p1HP}/${p1Stats.maxHp} | HP *${p2.name}*: ${p2HP}/${p2Stats.maxHp}\n\n`;

    if (p1HP <= 0) {
      log += `💀 *${p1.name}* telah tumbang!\n🏆 *${p2.name}* memenangkan duel!\n\n`;
      break;
    }

    turn++;
  }

  if (turn > maxTurns && p1HP > 0 && p2HP > 0) {
    log += `🤝 Duel berakhir seri karena kedua petarung sama-sama kelelahan!\n\n`;
  }

  return {
    winner: p1HP <= 0 ? 2 : (p2HP <= 0 ? 1 : 0), // 1 = P1, 2 = P2, 0 = Draw
    log
  };
}

module.exports = {
  getDerivedStats,
  simulateCombat,
  simulateDuel
};
