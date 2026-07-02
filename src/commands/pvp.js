// ================== PVP SYSTEM COMMAND HANDLERS ==================

const db = require('../database/db');
const combat = require('../rpg/combat');
const helpers = require('../utils/helpers');

// Tantangan disimpan di memory: targetUserId -> { challengerId, amount, expiresAt }
const activeChallenges = new Map();

async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handlePvPCommands(sock, msg, cmd, args, userId) {
  const player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  // Parse subcommand
  const sub = args[0]?.toLowerCase();

  // 1. DUEL ACCEPT
  if (sub === 'accept' || sub === 'terima') {
    const challenge = activeChallenges.get(userId);
    if (!challenge) {
      return reply(sock, msg, `❌ Tidak ada tantangan duel aktif untukmu.`);
    }

    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(userId);
      return reply(sock, msg, `⏰ Tantangan duel telah kedaluwarsa.`);
    }

    const challenger = db.getPlayer(challenge.challengerId);
    const amount = challenge.amount;

    // Bersihkan tantangan
    activeChallenges.delete(userId);

    // Re-verify gold
    if (challenger.gold < amount) {
      return reply(sock, msg, `❌ Duel dibatalkan karena Gold penantang *${challenger.name}* tidak cukup lagi.`);
    }
    if (player.gold < amount) {
      return reply(sock, msg, `❌ Duel dibatalkan karena Gold kamu tidak cukup lagi.`);
    }

    // Jalankan duel
    const result = combat.simulateDuel(challenger, player);

    let logHeader = `⚔️ *COMBAT REPORT: DUEL PVP* ⚔️\n`;
    logHeader += `*${challenger.name}* vs *${player.name}*\n`;
    logHeader += `Taruhan: *${amount.toLocaleString()} Gold* 🪙 (Pot: ${(amount * 2).toLocaleString()} Gold)\n`;
    logHeader += `────────────────────────\n\n`;

    let rewardText = "";

    if (result.winner === 1) { // Challenger menang
      const tax = Math.floor(amount * 2 * 0.20);
      const prize = (amount * 2) - tax;
      
      challenger.gold += (prize - amount); // Untung bersih prize - amount
      player.gold -= amount;

      db.savePlayer(challenger);
      db.savePlayer(player);

      rewardText = `🏆 *${challenger.name}* memenangkan duel!\n💰 Mendapatkan *+${prize.toLocaleString()} Gold* (Pot dipotong pajak 20%: *-${tax.toLocaleString()} Gold* untuk dibakar 🔥).\n💀 *${player.name}* kehilangan *-${amount.toLocaleString()} Gold*.`;
    } else if (result.winner === 2) { // Target menang
      const tax = Math.floor(amount * 2 * 0.20);
      const prize = (amount * 2) - tax;

      player.gold += (prize - amount);
      challenger.gold -= amount;

      db.savePlayer(challenger);
      db.savePlayer(player);

      rewardText = `🏆 *${player.name}* memenangkan duel!\n💰 Mendapatkan *+${prize.toLocaleString()} Gold* (Pot dipotong pajak 20%: *-${tax.toLocaleString()} Gold* untuk dibakar 🔥).\n💀 *${challenger.name}* kehilangan *-${amount.toLocaleString()} Gold*.`;
    } else { // Draw
      rewardText = `🤝 Duel berakhir *SERI*! Taruhan dikembalikan penuh tanpa potongan.`;
    }

    let fullLog = result.log;
    if (fullLog.length > 3500) {
      fullLog = fullLog.slice(0, 3200) + "\n...[Dipotong karena terlalu panjang]...\n";
    }

    return reply(sock, msg, logHeader + fullLog + `────────────────────────\n` + rewardText);
  }

  // 2. DUEL DECLINE / REJECT
  if (sub === 'decline' || sub === 'reject' || sub === 'tolak') {
    const challenge = activeChallenges.get(userId);
    if (!challenge) {
      return reply(sock, msg, `❌ Tidak ada tantangan duel aktif untukmu.`);
    }
    const challenger = db.getPlayer(challenge.challengerId);
    activeChallenges.delete(userId);
    return reply(sock, msg, `⚔️ Kamu menolak tantangan duel dari *${challenger.name}*.`);
  }

  // 3. TANTANG PLAYER LAIN (!duel @player [amount])
  // Cek mention dari msg
  let targetJid = null;
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length > 0) {
    targetJid = mentions[0];
  }

  if (!targetJid) {
    return reply(sock, msg, 
      `⚔️ *PVP DUEL SYSTEM* ⚔️\n` +
      `────────────────────────\n` +
      `Format: *!duel @player [jumlah_taruhan]*\n` +
      `Contoh: *!duel @628123456789 500*\n\n` +
      `Pemenang mengambil pot taruhan dipotong 20% pajak sistem untuk dibakar (anti-inflasi) 🔥.`
    );
  }

  const targetUserId = targetJid.split('@')[0];
  if (targetUserId === userId) {
    return reply(sock, msg, `❌ Kamu tidak bisa berduel dengan dirimu sendiri.`);
  }

  const targetPlayer = db.getPlayer(targetUserId);
  if (!targetPlayer || !targetPlayer.job) {
    return reply(sock, msg, `❌ Player yang ditantang belum terdaftar dalam game RPG ini.`);
  }

  const rawAmount = args[1] || args[0]; // Bisa jadi amount ada di args ke-0 jika tag ada di depan/belakang
  let amount = parseInt(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    amount = 100; // Default taruhan
  }

  if (player.gold < amount) {
    return reply(sock, msg, `❌ Gold kamu tidak cukup! Kamu hanya memiliki *${player.gold.toLocaleString()} Gold*.`);
  }
  if (targetPlayer.gold < amount) {
    return reply(sock, msg, `❌ Gold lawan tidak cukup! *${targetPlayer.name}* hanya memiliki *${targetPlayer.gold.toLocaleString()} Gold*.`);
  }

  // Simpan challenge (berlaku 60 detik)
  activeChallenges.set(targetUserId, {
    challengerId: userId,
    amount,
    expiresAt: Date.now() + 60 * 1000
  });

  return reply(sock, msg, 
    `⚔️ *TANTANGAN DUEL PVP* ⚔️\n` +
    `────────────────────────\n` +
    `*${player.name}* menantang *@${targetUserId}* untuk duel 1v1!\n` +
    `🪙 Taruhan: *${amount.toLocaleString()} Gold*\n\n` +
    `👉 Ketik *!duel accept* untuk menerima pertarungan.\n` +
    `👉 Ketik *!duel decline* untuk menolak.\n` +
    `⏰ Waktu merespon: 60 detik.`
  );
}

module.exports = { handlePvPCommands };
