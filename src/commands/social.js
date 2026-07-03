// ================== SOCIAL & COMMENTS COMMAND HANDLERS ==================

const db = require('../database/db');
const classes = require('../rpg/classes');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleSocialCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  switch (cmd) {
    case 'comment': {
      const commentText = args.join(' ').trim();
      if (!commentText) {
        return reply(sock, msg, `❌ Format: *!comment [pesan]*\nContoh: *!comment Keren botnya!*`);
      }

      if (commentText.length > 100) {
        return reply(sock, msg, `❌ Komentar terlalu panjang! Maksimal 100 karakter.`);
      }

      const comment = {
        id: Date.now(),
        userId,
        playerName: player.name,
        playerJob: player.job ? (classes.jobs[player.job]?.name || player.job) : 'Recruit',
        playerLevel: player.level,
        text: commentText,
        timestamp: Date.now()
      };

      // Berikan reward harian sekali saja per hari
      const todayStr = new Date().toISOString().slice(0, 10);
      player.lastCommentDate = player.lastCommentDate || "";
      
      let rewardText = "";
      if (player.lastCommentDate !== todayStr) {
        player.lastCommentDate = todayStr;
        player.gold += 50;
        player.exp += 100;
        rewardText = `\n\n🎁 *Daily Comment Reward:* +50 Gold 🪙 & +100 EXP!`;

        // Check level up
        const helpers = require('../utils/helpers');
        const isLvlUp = helpers.checkLevelUp(player);
        if (isLvlUp) {
          rewardText += `\n🌟 *LEVEL UP!* Sekarang kamu mencapai *Level ${player.level}*! Poin stat bertambah +3.`;
        }
      }

      db.saveComment(comment);
      db.savePlayer(player);

      return reply(sock, msg, `✅ Komentar berhasil ditambahkan ke papan tulis global!${rewardText}`);
    }

    case 'comments':
    case 'guestbook': {
      const comments = db.getComments();
      if (comments.length === 0) {
        return reply(sock, msg, `📝 Papan tulis komentar kosong. Ketik *!comment [pesan]* untuk menjadi yang pertama!`);
      }

      // Tampilkan 10 komentar terbaru
      const recent = [...comments].reverse().slice(0, 10);
      let out = `📝 *PAPAN GUESTBOOK RPG BOT (10 Terbaru)* 📝\n────────────────────────\n\n`;

      recent.forEach((c) => {
        const date = new Date(c.timestamp).toLocaleString('id-ID', { hour12: false });
        const jobInfo = c.playerJob ? ` (${c.playerJob} Lv. ${c.playerLevel || 1})` : "";
        out += `👤 *${c.playerName}*${jobInfo}:\n"${c.text}"\n_(${date})_\n\n`;
      });

      return reply(sock, msg, out);
    }
  }
}

module.exports = {
  handleSocialCommands
};
