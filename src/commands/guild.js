// ================== GUILD COMMAND HANDLERS ==================

const db = require('../database/db');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleGuildCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  switch (cmd) {
    case 'create_guild':
    case 'createguild': {
      if (player.guild) {
        return reply(sock, msg, `❌ Kamu sudah bergabung di dalam guild! Tinggalkan guild terlebih dahulu dengan *!guild_leave*.`);
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
        notice: "Selamat datang di guild kami!",
        createdAt: Date.now()
      };

      db.saveGuild(guildId, newGuild);
      player.guild = guildId;
      db.savePlayer(player);

      return reply(sock, msg, `🏛️ Guild *"${guildName}"* berhasil dibuat! Kamu sekarang adalah Leader guild ini. 😎`);
    }

    case 'guild':
    case 'guild_info': {
      if (!player.guild) {
        return reply(sock, msg, `❌ Kamu belum bergabung dalam guild mana pun. Buat guild dengan *!create_guild [nama]* atau tunggu undangan.`);
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

      const infoMsg = 
`🏛️ *GUILD: ${guild.name}* 🏛️
────────────────────────
• 👑 *Leader:* ${leaderPlayer.name}
• 👥 *Anggota (${guild.members.length}):* ${memberNames}
• 🏦 *Kas Guild:* ${guild.bank} Gold 🪙
• 📜 *Misi/Papan Pengumuman:*
  _"${guild.notice}"_
• 📩 *Undangan Pending:* ${inviteNames}`;

      return reply(sock, msg, infoMsg);
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
