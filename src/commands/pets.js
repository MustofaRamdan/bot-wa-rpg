// ================== PETS COMMAND HANDLERS ==================

const db = require('../database/db');

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handlePetCommands(sock, msg, cmd, args, userId) {
  let player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  const pets = player.pets || [];

  switch (cmd) {
    case 'pets':
    case 'pet': {
      if (pets.length === 0) {
        return reply(sock, msg, `🐾 Kamu belum memiliki pet!\nDapatkan telur pet gacha di toko (*!shop*) dan tetaskan dengan mengetik *!use [egg_key]*.`);
      }

      // Urutan tier
      const tierOrder = { SSS: 0, SS: 1, S: 2, A: 3, B: 4, C: 5, D: 6 };
      
      const sortedPets = [...pets].sort((a, b) => {
        const ta = tierOrder[a.tier] ?? 99;
        const tb = tierOrder[b.tier] ?? 99;
        if (ta !== tb) return ta - tb;
        return (b.bonusAttack + b.bonusDefense) - (a.bonusAttack + a.bonusDefense);
      });

      let out = `🐾 *DAFTAR PET: ${player.name}* (SSS ➜ D)\n────────────────────────\n`;
      
      sortedPets.forEach((p, idx) => {
        const isActive = player.activePetId === p.id ? " 🟢 *(AKTIF)*" : "";
        let petEffect = `+${p.bonusAttack} ATK, +${p.bonusDefense} DEF`;
        if (p.tier === 'SS') petEffect += ` (Bonus DMG: 50%-100%)`;
        if (p.tier === 'SSS') petEffect += ` (Bonus DMG: 150%-200%)`;

        out += `${idx + 1}. *${p.name}* [Tier ${p.tier}] (${petEffect})${isActive}\n`;
      });

      out += `\n💡 *Cara mengaktifkan pet:* Ketik *!pet_set [nomor_pet]*\nContoh: *!pet_set 1*`;
      return reply(sock, msg, out);
    }

    case 'pet_set':
    case 'petset': {
      if (pets.length === 0) {
        return reply(sock, msg, `❌ Kamu belum memiliki pet.`);
      }

      const idx = parseInt(args[0]) - 1;
      
      // Urutan yang sama dengan !pets agar nomor index sinkron
      const tierOrder = { SSS: 0, SS: 1, S: 2, A: 3, B: 4, C: 5, D: 6 };
      const sortedPets = [...pets].sort((a, b) => {
        const ta = tierOrder[a.tier] ?? 99;
        const tb = tierOrder[b.tier] ?? 99;
        if (ta !== tb) return ta - tb;
        return (b.bonusAttack + b.bonusDefense) - (a.bonusAttack + a.bonusDefense);
      });

      if (isNaN(idx) || idx < 0 || idx >= sortedPets.length) {
        return reply(sock, msg, `❌ Nomor pet tidak valid! Cek nomor pet dengan mengetik *!pets*.`);
      }

      const chosenPet = sortedPets[idx];
      player.activePetId = chosenPet.id;
      db.savePlayer(player);

      return reply(sock, msg, `✅ Berhasil memasang *${chosenPet.name}* [Tier ${chosenPet.tier}] sebagai pet aktif!`);
    }
  }
}

module.exports = {
  handlePetCommands
};
