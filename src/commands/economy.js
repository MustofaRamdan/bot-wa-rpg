// ================== ECONOMY & GAMBLING COMMAND HANDLERS ==================

const db = require('../database/db');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleEconomyCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  switch (cmd) {
    case 'saldo':
    case 'balance': {
      const saldomsg = 
`💰 *SALDO KEUANGAN: ${player.name}*
────────────────────────
• 🪙 *Gold di Tas:* ${player.gold} Gold
• 🏦 *Gold di Bank:* ${player.bank} Gold
• 📊 *Total Saldo:* ${player.gold + player.bank} Gold`;
      
      return reply(sock, msg, saldomsg);
    }

    case 'deposit':
    case 'depo': {
      const input = args[0];
      if (!input) return reply(sock, msg, `❌ Format: *!deposit [jumlah/all]*\nContoh: *!deposit 500*`);

      let amount = 0;
      if (input.toLowerCase() === 'all') {
        amount = player.gold;
      } else {
        amount = parseInt(input);
      }

      if (isNaN(amount) || amount <= 0) {
        return reply(sock, msg, `❌ Jumlah deposit tidak valid.`);
      }

      if (player.gold < amount) {
        return reply(sock, msg, `❌ Gold tidak mencukupi! Kamu hanya memiliki *${player.gold} Gold* di tas.`);
      }

      player.gold -= amount;
      player.bank += amount;
      db.savePlayer(player);

      return reply(sock, msg, `✅ Berhasil menyimpan *${amount} Gold* ke dalam Bank!\nTas: *${player.gold} Gold* | Bank: *${player.bank} Gold*`);
    }

    case 'withdraw':
    case 'wd': {
      const input = args[0];
      if (!input) return reply(sock, msg, `❌ Format: *!withdraw [jumlah/all]*\nContoh: *!withdraw 500*`);

      let amount = 0;
      if (input.toLowerCase() === 'all') {
        amount = player.bank;
      } else {
        amount = parseInt(input);
      }

      if (isNaN(amount) || amount <= 0) {
        return reply(sock, msg, `❌ Jumlah penarikan tidak valid.`);
      }

      if (player.bank < amount) {
        return reply(sock, msg, `❌ Saldo Bank tidak mencukupi! Kamu hanya memiliki *${player.bank} Gold* di Bank.`);
      }

      player.bank -= amount;
      player.gold += amount;
      db.savePlayer(player);

      return reply(sock, msg, `✅ Berhasil menarik *${amount} Gold* dari Bank!\nTas: *${player.gold} Gold* | Bank: *${player.bank} Gold*`);
    }

    case 'give':
    case 'pay': {
      // Ambil Target player dari mention
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.length === 0) {
        return reply(sock, msg, `❌ Format: *!give @player [jumlah]*\nContoh: *!give @628123456789 200*`);
      }

      const targetId = mentions[0].split('@')[0];
      if (targetId === userId) {
        return reply(sock, msg, `❌ Kamu tidak bisa mentransfer uang ke diri sendiri.`);
      }

      // Ambil jumlah transfer (argumen ke-2 setelah mention)
      // Catatan: Karena @player diparse sebagai mention JID, args[0] biasanya bertuliskan @nomor
      const amount = parseInt(args[1]) || parseInt(args[0]); 
      
      if (isNaN(amount) || amount <= 0) {
        return reply(sock, msg, `❌ Jumlah transfer tidak valid.`);
      }

      if (player.gold < amount) {
        return reply(sock, msg, `❌ Gold tidak cukup! Kamu hanya memiliki *${player.gold} Gold* di tas.`);
      }

      const targetPlayer = db.getPlayer(targetId);
      if (!targetPlayer.job) {
        return reply(sock, msg, `❌ Penerima belum terdaftar dalam game RPG ini.`);
      }

      player.gold -= amount;
      targetPlayer.gold += amount;

      db.savePlayer(player);
      db.savePlayer(targetPlayer);

      return reply(sock, msg, `✅ Berhasil mentransfer *${amount} Gold* 🪙 ke *${targetPlayer.name}*!`);
    }

    case 'judi':
    case 'gamble': {
      const input = args[0];
      if (!input) return reply(sock, msg, `🎰 *JUDI COINFLIP (Peluang 45% & Pajak Admin 20%)* 🎰\nFormat: *!judi [jumlah/all]*\nContoh: *!judi 100*`);

      let amount = 0;
      if (input.toLowerCase() === 'all') {
        amount = player.gold;
      } else {
        amount = parseInt(input);
      }

      if (isNaN(amount) || amount <= 0) {
        return reply(sock, msg, `❌ Jumlah taruhan judi tidak valid.`);
      }

      if (amount < 10) {
        return reply(sock, msg, `❌ Minimal taruhan judi adalah *10 Gold*.`);
      }

      if (player.gold < amount) {
        return reply(sock, msg, `❌ Gold-mu tidak cukup! Sisa Gold di tas: *${player.gold} Gold*.`);
      }

      // Inisialisasi stat judi
      player.battleStats = player.battleStats || {};
      player.battleStats.judiCount = player.battleStats.judiCount || 0;
      player.battleStats.lastJudiTime = player.battleStats.lastJudiTime || 0;

      const now = Date.now();
      // Reset judiCount jika taruhan terakhir lebih dari 5 menit lalu
      if (now - player.battleStats.lastJudiTime > 5 * 60 * 1000) {
        player.battleStats.judiCount = 0;
      }

      player.battleStats.judiCount += 1;
      player.battleStats.lastJudiTime = now;

      // Peluang ketangkap polisi (semakin sering judi berturut-turut, semakin besar peluangnya)
      let policeChance = 0;
      if (player.battleStats.judiCount === 2) policeChance = 0.08;
      else if (player.battleStats.judiCount === 3) policeChance = 0.20;
      else if (player.battleStats.judiCount >= 4) policeChance = 0.45;

      if (Math.random() < policeChance) {
        const lostGold = Math.floor(player.gold * 0.5);
        player.gold -= lostGold;
        player.battleStats.judiCount = 0; // Reset counter
        db.savePlayer(player);
        return reply(sock, msg, `🚨 *POLISI DATANG! OOPS!* 🚨\n────────────────────────\nKamu keseringan judi berturut-turut (*${player.battleStats.judiCount}x*) dan terendus aparat keamanan!\n💸 Seluruh kekayaanmu disita polisi sebesar *50% dari Gold di tas* (-${lostGold.toLocaleString()} Gold).\n🪙 Sisa Gold di tas: *${player.gold.toLocaleString()} Gold*\n\n💡 _Tips: Kurangi frekuensi judi beruntun agar tidak dicurigai polisi!_`);
      }

      const win = Math.random() < 0.45; // Peluang menang diturunkan menjadi 45%
      let log = `🎰 *JUDI COINFLIP: ${player.name}* 🎰\n────────────────────────\n`;
      log += `Mempertaruhkan: *${amount.toLocaleString()} Gold* 🪙\n`;
      
      if (win) {
        const adminTax = Math.floor(amount * 0.20);
        const netProfit = amount - adminTax;
        player.gold += netProfit;
        log += `🥳 *MENANG!* Koin mendarat di sisi pilihanmu!\n💰 Mendapatkan *+${netProfit.toLocaleString()} Gold* (setelah dipotong Pajak Admin 20%: -${adminTax.toLocaleString()} Gold)!\n`;
      } else {
        player.gold -= amount;
        log += `😢 *KALAH!* Bandot memenangkan koin tersebut.\n📉 Kehilangan *-${amount.toLocaleString()} Gold*!\n`;
      }

      log += `────────────────────────\n🪙 Sisa Gold di tas: *${player.gold.toLocaleString()} Gold*`;
      db.savePlayer(player);

      return reply(sock, msg, log);
    }
  }
}

module.exports = {
  handleEconomyCommands
};
