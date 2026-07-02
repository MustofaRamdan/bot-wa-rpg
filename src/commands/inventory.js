// ================== INVENTORY & SHOP COMMAND HANDLERS ==================

const db = require('../database/db');
const items = require('../config/items');
const helpers = require('../utils/helpers');
const combat = require('../rpg/combat');
const classes = require('../rpg/classes');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleInventoryCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  switch (cmd) {
    case 'inventory':
    case 'inv': {
      let out = `🎒 *INVENTORY: ${player.name}*\n────────────────────────\n`;
      
      const invEntries = Object.entries(player.inventory).filter(([_, qty]) => qty > 0);
      
      if (invEntries.length === 0) {
        out += `_Inventory kamu kosong._\n`;
      } else {
        invEntries.forEach(([key, qty]) => {
          const item = items[key];
          const name = item ? item.name : key;
          out += `• [ \`${key}\` ] *${name}* x${qty}\n`;
        });
      }

      out += `\n⚙️ *EQUIPMENT AKTIF*:\n`;
      
      // Weapon slot
      const wObj = player.equipment.weapon;
      if (wObj) {
        const wKey = typeof wObj === 'string' ? wObj : wObj.key;
        const wLvl = typeof wObj === 'string' ? 0 : wObj.level;
        out += `• 🗡️ *Weapon:* ${items[wKey]?.name || wKey} ${wLvl > 0 ? `+${wLvl}` : ""}\n`;
      } else {
        out += `• 🗡️ *Weapon:* Kosong\n`;
      }

      // Armor slot
      const aObj = player.equipment.armor;
      if (aObj) {
        const aKey = typeof aObj === 'string' ? aObj : aObj.key;
        const aLvl = typeof aObj === 'string' ? 0 : aObj.level;
        out += `• 🛡️ *Armor:* ${items[aKey]?.name || aKey} ${aLvl > 0 ? `+${aLvl}` : ""}\n`;
      } else {
        out += `• 🛡️ *Armor:* Kosong\n`;
      }

      out += `\n💡 *Bantuan:* \n`;
      out += `- Gunakan key dalam \`[key]\` untuk berinteraksi.\n`;
      out += `- Ketik *!equip [key]* untuk memasang gear.\n`;
      out += `- Ketik *!use [key] [jumlah]* untuk memakai item/buka telur.`;

      return reply(sock, msg, out);
    }

    case 'shop':
    case 'toko': {
      let out = `🏪 *RPG ITEM SHOP* 🏪\n────────────────────────\n`;
      out += `_Senjata & Zirah tidak dijual di sini. Buat sendiri dengan *!craft*!_\n\n`;

      // Kategori yang tampil di toko (hanya item dengan shopable !== false dan price > 0)
      const shopCategories = [
        { types: ['consumable'],       label: '🧪 *Consumables & Potions:*' },
        { types: ['tool'],             label: '⛏️ *Gathering Tools (Alat Kerja):*' },
        { types: ['material'],         label: '💎 *Upgrade Materials (Bahan Forge):*' },
        { types: ['pet_egg'],          label: '🐣 *Pet Eggs (Gacha Pet):*' },
      ];

      for (const cat of shopCategories) {
        out += `${cat.label}\n`;
        const catItems = Object.entries(items).filter(([, item]) =>
          cat.types.includes(item.type) && item.shopable !== false && item.price > 0
        );

        if (catItems.length === 0) { out += `  _Kosong._\n\n`; continue; }

        catItems.forEach(([key, item]) => {
          let extra = '';
          if (item.healHp) extra = ` (+${item.healHp} HP)`;
          if (item.healMp) extra = ` (+${item.healMp} MP)`;
          if (item.expGain) extra = ` (+${item.expGain} EXP)`;
          out += `• [\`${key}\`] *${item.name}* — ${item.price.toLocaleString()}💰\n`;
          out += `  _${item.description || ''}${extra}_\n`;
        });
        out += `\n`;
      }

      out += `💡 *Cara Beli:* *!buy [key] [jumlah]*\n`;
      out += `🔨 *Lihat resep craft:* *!craft*`;
      return reply(sock, msg, out);
    }


    case 'buy':
    case 'beli': {
      const itemKey = args[0]?.toLowerCase();
      const qty = parseInt(args[1]) || 1;

      if (!itemKey || !items[itemKey]) {
        return reply(sock, msg, `❌ Item tidak ditemukan! Ketik *!shop* untuk melihat daftar item.`);
      }

      if (qty <= 0 || isNaN(qty)) {
        return reply(sock, msg, `❌ Jumlah pembelian harus berupa angka positif.`);
      }

      const item = items[itemKey];

      if (item.shopable === false) {
        return reply(sock, msg,
          `❌ *${item.name}* tidak dijual di toko!\n` +
          `🔨 Buat sendiri dengan: *!craft ${itemKey}*\n` +
          `📋 Lihat semua resep: *!craft*`
        );
      }

      if (!item.price || item.price <= 0) {
        return reply(sock, msg, `❌ Item *${item.name}* tidak bisa dibeli.`);
      }

      const totalCost = item.price * qty;

      if (player.gold < totalCost) {
        return reply(sock, msg, `❌ Gold tidak cukup! Butuh *${totalCost.toLocaleString()} Gold*, kamu hanya punya *${player.gold.toLocaleString()} Gold*.`);
      }

      player.gold -= totalCost;
      player.inventory[itemKey] = (player.inventory[itemKey] || 0) + qty;
      player.battleStats.itemsBought = (player.battleStats.itemsBought || 0) + qty;

      db.savePlayer(player);
      return reply(sock, msg, `✅ Berhasil membeli *${qty}x ${item.name}* seharga *${totalCost.toLocaleString()} Gold*!`);
    }

    case 'equip':
    case 'pakai': {
      const itemKey = args[0]?.toLowerCase();
      if (!itemKey) {
        return reply(sock, msg, `❌ Format: *!equip [item_key]*\nContoh: *!equip iron_sword*`);
      }

      const item = items[itemKey];
      if (!item) return reply(sock, msg, `❌ Item "${itemKey}" tidak dikenal.`);
      
      if (!player.inventory[itemKey] || player.inventory[itemKey] <= 0) {
        return reply(sock, msg, `❌ Kamu tidak memiliki *${item.name}* di dalam inventory!`);
      }

      if (item.type !== 'weapon' && item.type !== 'armor') {
        return reply(sock, msg, `❌ Item *${item.name}* bukan tipe equipment (Weapon/Armor).`);
      }

      // Validasi Job Lock (Apakah job player diperbolehkan memakai equipment ini)
      if (item.allowedJobs && !item.allowedJobs.includes(player.job)) {
        const allowedJobNames = item.allowedJobs.map(k => classes.jobs[k]?.name || k).join(', ');
        return reply(sock, msg, `❌ *${item.name}* tidak dapat digunakan oleh job *${classes.jobs[player.job]?.name || player.job}*!\nJob yang diperbolehkan: _${allowedJobNames}_.`);
      }

      const slot = item.type; // 'weapon' atau 'armor'
      const currentlyEquipped = player.equipment[slot];

      // Lepas gear lama jika ada dan kembalikan ke inventory
      if (currentlyEquipped) {
        const oldKey = typeof currentlyEquipped === 'string' ? currentlyEquipped : currentlyEquipped.key;
        player.inventory[oldKey] = (player.inventory[oldKey] || 0) + 1;
      }

      // Pasang gear baru dengan Level 0
      player.equipment[slot] = { key: itemKey, level: 0 };
      player.inventory[itemKey]--;
      if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];

      db.savePlayer(player);
      return reply(sock, msg, `✅ Berhasil menggunakan *${item.name}* pada slot ${slot.toUpperCase()}!`);
    }

    case 'unequip':
    case 'lepas': {
      const slot = args[0]?.toLowerCase();
      if (!['weapon', 'armor'].includes(slot)) {
        return reply(sock, msg, `❌ Pilih slot yang ingin dilepas: *!unequip weapon* atau *!unequip armor*`);
      }

      const currentGear = player.equipment[slot];
      if (!currentGear) {
        return reply(sock, msg, `❌ Slot ${slot.toUpperCase()} saat ini memang kosong.`);
      }

      const gearKey = typeof currentGear === 'string' ? currentGear : currentGear.key;
      const gearName = items[gearKey]?.name || gearKey;

      player.inventory[gearKey] = (player.inventory[gearKey] || 0) + 1;
      player.equipment[slot] = null;

      db.savePlayer(player);
      return reply(sock, msg, `✅ Berhasil melepas *${gearName}* dan dikembalikan ke inventory.`);
    }

    case 'use':
    case 'gunakan': {
      const itemKey = args[0]?.toLowerCase();
      const amountInput = args[1] || "1";
      
      if (!itemKey) {
        return reply(sock, msg, `❌ Format: *!use [item_key] [jumlah/all]*\nContoh: *!use potion 2*`);
      }

      if (!player.inventory[itemKey] || player.inventory[itemKey] <= 0) {
        return reply(sock, msg, `❌ Kamu tidak memiliki item tersebut di inventory.`);
      }

      const item = items[itemKey];
      if (!item) return reply(sock, msg, `❌ Item tidak terdaftar.`);

      const qtyInInv = player.inventory[itemKey];
      const qty = amountInput === "all" ? qtyInInv : Math.min(qtyInInv, parseInt(amountInput) || 1);

      if (qty <= 0) return reply(sock, msg, `❌ Jumlah tidak valid.`);

      // 1. TIPE: Consumable
      if (item.type === 'consumable') {
        const pStats = combat.getDerivedStats(player);

        if (itemKey === 'potion' || itemKey === 'super_potion' || itemKey === 'hyper_potion') {
          if (player.hp >= pStats.maxHp) return reply(sock, msg, `❌ HP kamu sudah penuh!`);
          
          let totalHeal = 0;
          let actualUsed = 0;
          for (let i = 0; i < qty; i++) {
            if (player.hp >= pStats.maxHp) break;
            const heal = Math.min(item.healHp, pStats.maxHp - player.hp);
            player.hp += heal;
            totalHeal += heal;
            actualUsed++;
          }

          player.inventory[itemKey] -= actualUsed;
          if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
          db.savePlayer(player);

          return reply(sock, msg, `✅ Menggunakan ${actualUsed}x *${item.name}*. HP +${totalHeal} (${player.hp}/${pStats.maxHp} HP).`);
        }

        if (itemKey === 'ether') {
          if (player.mp >= pStats.maxMp) return reply(sock, msg, `❌ MP kamu sudah penuh!`);

          let totalHeal = 0;
          let actualUsed = 0;
          for (let i = 0; i < qty; i++) {
            if (player.mp >= pStats.maxMp) break;
            const heal = Math.min(item.healMp, pStats.maxMp - player.mp);
            player.mp += heal;
            totalHeal += heal;
            actualUsed++;
          }

          player.inventory[itemKey] -= actualUsed;
          if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
          db.savePlayer(player);

          return reply(sock, msg, `✅ Menggunakan ${actualUsed}x *${item.name}*. MP +${totalHeal} (${player.mp}/${pStats.maxMp} MP).`);
        }

        if (itemKey === 'elixir') {
          player.hp = pStats.maxHp;
          player.mp = pStats.maxMp;
          player.inventory[itemKey] -= 1; // Hanya gunakan 1
          if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
          db.savePlayer(player);

          return reply(sock, msg, `✅ Menggunakan 1x *Elixir*. HP & MP terisi penuh!`);
        }

        if (itemKey === 'exp_boost') {
          const totalExp = (item.expGain || 200) * qty;
          player.exp += totalExp;
          player.inventory[itemKey] -= qty;
          if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
          
          let lvlUpMsg = "";
          const isLvlUp = helpers.checkLevelUp(player);
          if (isLvlUp) lvlUpMsg = `\n🌟 *LEVEL UP!* Sekarang kamu mencapai *Level ${player.level}*!`;

          db.savePlayer(player);
          return reply(sock, msg, `✅ Menggunakan ${qty}x *${item.name}*.\nMendapatkan *+${totalExp} EXP*!${lvlUpMsg}`);
        }

        return reply(sock, msg, `❌ Item consumable ini belum bisa digunakan.`);
      }

      // 2. TIPE: Pet Egg (Gacha Pet)
      if (item.type === 'pet_egg') {
        let opened = 0;
        let petsText = "";
        let soldText = "";
        let totalSellGold = 0;
        const rarity = item.rarity || 'common';

        for (let i = 0; i < qty; i++) {
          const tier = helpers.rollTierFromPool(rarity);
          const pet = helpers.createPetFromTier(tier);

          // Cek apakah player sudah memiliki pet spesies yang sama dengan tier yang sama
          const duplicate = player.pets.find(p => p.species === pet.species && p.tier === pet.tier);

          player.inventory[itemKey]--;
          opened++;

          if (duplicate) {
            // Jual Otomatis jika duplikat
            const sellGold = helpers.getPetAutoSellValue(pet);
            totalSellGold += sellGold;
            soldText += `• Duplikat: *${pet.name}* [Tier ${pet.tier}] ➜ Auto-sell +${sellGold} Gold 🪙\n`;
          } else {
            // Dapatkan Pet Baru
            player.pets.push(pet);
            if (!player.activePetId) player.activePetId = pet.id; // Set aktif jika belum ada pet aktif
            petsText += `• Baru: *${pet.name}* [Tier ${pet.tier}] (Bonus: +${pet.bonusAttack} ATK / +${pet.bonusDefense} DEF)\n`;
          }
        }

        if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
        if (totalSellGold > 0) player.gold += totalSellGold;

        db.savePlayer(player);

        let gachaResult = `🐣 *GACHA PET RESULTS (${opened} Eggs)* 🐣\n────────────────────────\n`;
        if (petsText) gachaResult += `⭐ *PET BARU:*\n${petsText}\n`;
        if (soldText) gachaResult += `♻️ *PET DUPLIKAT:*\n${soldText}\n💰 *Total Gold dari Auto-sell:* +${totalSellGold} Gold 🪙\n`;
        gachaResult += `\n💡 Ketik *!pets* untuk melihat list pet-mu!`;

        return reply(sock, msg, gachaResult);
      }

      // 3. TIPE: Tome (Kitab Pasif)
      if (item.type === 'tome') {
        // Cek kecocokan job
        const allowedBaseJobs = [item.job];
        // Tambahkan T2 jika job tersebut adalah promosi
        if (item.job === 'warrior') allowedBaseJobs.push('lord_knight');
        else if (item.job === 'paladin') allowedBaseJobs.push('templar');
        else if (item.job === 'mage') allowedBaseJobs.push('archmage');
        else if (item.job === 'cleric') allowedBaseJobs.push('high_priest');
        else if (item.job === 'rogue') allowedBaseJobs.push('assassin');
        else if (item.job === 'archer') allowedBaseJobs.push('sniper');
        else if (item.job === 'berserker') allowedBaseJobs.push('warlord');
        else if (item.job === 'monk') allowedBaseJobs.push('grandmaster');

        if (!allowedBaseJobs.includes(player.job)) {
          const expectedJobName = classes.jobs[item.job]?.name || item.job.toUpperCase();
          return reply(sock, msg, `❌ Kitab ini hanya bisa dipelajari oleh job *${expectedJobName}* atau promosinya!`);
        }

        player.unlockedPassives = player.unlockedPassives || [];
        if (player.unlockedPassives.includes(item.passive)) {
          return reply(sock, msg, `❌ Kamu sudah mempelajari pasif *${item.name}* secara permanen!`);
        }

        player.unlockedPassives.push(item.passive);
        player.inventory[itemKey] -= 1;
        if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];

        db.savePlayer(player);
        return reply(sock, msg, `📖 ✨ *BELAJAR PASIF BERHASIL!* Kamu telah mempelajari pasif *${item.name}* secara permanen!`);
      }

      if (itemKey === 'scroll_town') {
        player.zone = 'green_forest';
        player.inventory[itemKey]--;
        if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
        db.savePlayer(player);
        return reply(sock, msg, `📜 *Town Portal Scroll digunakan!* Kamu dipindahkan kembali ke *Green Forest 🌲* secara instan.`);
      }

      if (itemKey === 'box_lucky') {
        player.inventory[itemKey]--;
        if (player.inventory[itemKey] <= 0) delete player.inventory[itemKey];
        
        const possibleRewards = [
          { key: 'iron_ore', qty: 3 },
          { key: 'ore_silver', qty: 2 },
          { key: 'ore_mythril', qty: 1 },
          { key: 'wood_oak', qty: 3 },
          { key: 'wood_maple', qty: 2 },
          { key: 'wood_ebony', qty: 1 },
          { key: 'potion', qty: 5 },
          { key: 'super_potion', qty: 2 }
        ];
        
        const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        player.inventory[reward.key] = (player.inventory[reward.key] || 0) + reward.qty;
        
        db.savePlayer(player);
        
        const rewardItem = items[reward.key];
        return reply(sock, msg, `🎁 *LUCKY CHEST DIBUKA!* 🎁\n────────────────────────\nKamu mendapatkan:\n📦 *${reward.qty}x ${rewardItem.name}*!\n\n💡 Cek tasmu menggunakan *!inventory*.`);
      }

      return reply(sock, msg, `❌ Item tersebut tidak bisa digunakan secara langsung.`);
    }

    case 'forge':
    case 'upgrade': {
      const slot = args[0]?.toLowerCase(); // 'weapon' atau 'armor'
      if (!['weapon', 'armor'].includes(slot)) {
        return reply(sock, msg, `❌ Format: *!forge [weapon/armor]*\nContoh: *!forge weapon*`);
      }

      const gear = player.equipment[slot];
      if (!gear) return reply(sock, msg, `❌ Kamu tidak memakai equipment apapun di slot ${slot.toUpperCase()}!`);

      // Normalisasi gear (agar selalu berbentuk objek)
      const gearKey = typeof gear === 'string' ? gear : gear.key;
      const curLevel = typeof gear === 'string' ? 0 : (gear.level || 0);

      if (curLevel >= 10) return reply(sock, msg, `❌ Equipment sudah mencapai batas upgrade maksimal (+10)!`);

      const nextLevel = curLevel + 1;
      const baseItem = items[gearKey];

      // Tentukan bahan & biaya berdasarkan level upgrade
      let materialKey = "";
      let materialQty = 0;
      let goldCost = 0;
      let successRate = 100;

      if (nextLevel <= 5) {
        materialKey = slot === 'weapon' ? 'iron_ore' : 'leather_scrap';
        materialQty = nextLevel;
        goldCost = nextLevel * 100;
        successRate = nextLevel === 1 ? 100 : nextLevel === 2 ? 100 : nextLevel === 3 ? 100 : nextLevel === 4 ? 85 : 70;
      } else if (nextLevel <= 9) {
        materialKey = 'magic_shard';
        materialQty = nextLevel - 4;
        goldCost = nextLevel * 300;
        successRate = nextLevel === 6 ? 55 : nextLevel === 7 ? 40 : nextLevel === 8 ? 30 : 20;
      } else {
        materialKey = 'dragon_scale';
        materialQty = 2;
        goldCost = 5000;
        successRate = 10;
      }

      const mat = items[materialKey];

      // Verifikasi ketersediaan material
      if (!player.inventory[materialKey] || player.inventory[materialKey] < materialQty) {
        return reply(sock, msg, `❌ Bahan kurang! Butuh *${materialQty}x ${mat.name}* (Punya: *${player.inventory[materialKey] || 0}*).`);
      }

      // Verifikasi gold
      if (player.gold < goldCost) {
        return reply(sock, msg, `❌ Gold kurang! Butuh *${goldCost} Gold* (Punya: *${player.gold} Gold*).`);
      }

      // Konsumsi bahan & gold
      player.gold -= goldCost;
      player.inventory[materialKey] -= materialQty;
      if (player.inventory[materialKey] <= 0) delete player.inventory[materialKey];

      // Roll Sukses / Gagal
      const roll = Math.random() * 100;
      let success = roll <= successRate;
      let finalLevel = curLevel;
      let statusText = "";

      if (success) {
        finalLevel = nextLevel;
        player.equipment[slot] = { key: gearKey, level: finalLevel };
        statusText = `🎉 *FORGE BERHASIL!* *${baseItem.name}* berhasil diupgrade menjadi *+${finalLevel}*! 📈`;
      } else {
        // Fails
        if (nextLevel >= 8) {
          // Level turun 1
          finalLevel = Math.max(0, curLevel - 1);
          statusText = `😭 *FORGE GAGAL!* Tingkat upgrade *${baseItem.name}* turun menjadi *+${finalLevel}*! 📉`;
        } else if (nextLevel === 10) {
          // Reset ke 0
          finalLevel = 0;
          statusText = `😱 *FORGE GAGAL TOTAL!* Tingkat upgrade *${baseItem.name}* hancur dan kembali ke *+0*! 💀`;
        } else {
          statusText = `❌ *FORGE GAGAL!* Tidak ada perubahan tingkat upgrade.`;
        }
        player.equipment[slot] = { key: gearKey, level: finalLevel };
      }

      db.savePlayer(player);

      let forgeReport = `🛠️ *BLACKSMITH REPORT: ${player.name}* 🛠️\n────────────────────────\n`;
      forgeReport += `Equipment: *${baseItem.name} +${curLevel}* ➜ *+${nextLevel}*\n`;
      forgeReport += `Biaya: -${goldCost} Gold & -${materialQty}x ${mat.name}\n`;
      forgeReport += `Peluang Sukses: ${successRate}%\n`;
      forgeReport += `────────────────────────\n`;
      forgeReport += `${statusText}\n\n`;
      forgeReport += `💰 Sisa Gold-mu: *${player.gold} Gold*`;

      return reply(sock, msg, forgeReport);
    }
  }
}

module.exports = {
  handleInventoryCommands
};
