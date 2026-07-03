// ================== WORLD EXPLORATION & ZONE SYSTEM ==================

const db = require('../database/db');

const ZONES = {
  green_forest: {
    name: "Green Forest 🌲",
    description: "Hutan lebat nan damai. Tempat sempurna untuk pemula.",
    minLevel: 1,
    resources: "🪵 Pinus, Ek, Maple | 🪨 Batu, Tembaga, Besi"
  },
  lost_wasteland: {
    name: "Lost Wasteland 🏜️",
    description: "Gurun pasir tandus yang menyimpan sisa peradaban kuno yang hilang.",
    minLevel: 8,
    resources: "🪵 Pinus, Ek | 🪨 Batu, Tembaga, Besi"
  },
  abandoned_mine: {
    name: "Abandoned Mine 🕳️",
    description: "Tambang tua yang gelap dan dipenuhi bandit serta monster berbatu.",
    minLevel: 12,
    resources: "🪵 Ek, Maple, Ebony | 🟤 Tembaga, Besi, Perak"
  },
  frozen_tundra: {
    name: "Frozen Tundra ❄️",
    description: "Padang salju beku abadi tempat bersemayamnya binatang buas es raksasa.",
    minLevel: 18,
    resources: "🪵 Pinus, Maple | 🪨 Besi, Perak, Mithril"
  },
  underwater_ruins: {
    name: "Underwater Ruins 🏛️🌊",
    description: "Kota Atlantis tenggelam yang dikuasai monster laut purba.",
    minLevel: 22,
    resources: "🪵 Pinus, Ek | 🪨 Besi, Perak, Mithril"
  },
  dragon_valley: {
    name: "Dragon Valley 🐉",
    description: "Lembah vulkanik sarang naga purba. Sangat berbahaya!",
    minLevel: 30,
    resources: "🪵 Maple, Ebony, Dragon | ⚫ Besi, Mithril, Adamantite"
  },
  abyss_depths: {
    name: "Abyss Depths 🕳️",
    description: "Dasar jurang kegelapan mutlak, dipenuhi specter dan aura mistis.",
    minLevel: 40,
    resources: "🪵 Ebony, Dragon | 🪨 Perak, Mithril, Adamantite"
  },
  sky_sanctuary: {
    name: "Sky Sanctuary ☁️",
    description: "Kuil melayang di angkasa tinggi, dijaga oleh makhluk seraphic.",
    minLevel: 48,
    resources: "🪵 Ek, Maple, Ebony | 🪨 Perak, Mithril, Adamantite"
  }
};

async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleZoneCommands(sock, msg, cmd, args, userId) {
  const player = db.getPlayer(userId);
  if (!player.job) return reply(sock, msg, `❌ Kamu belum mendaftar. Ketik *!register* terlebih dahulu!`);

  const currentZone = player.zone || 'green_forest';

  if (cmd === 'map') {
    let mapText = `🗺️ *WORLD EXPLORATION PETA RPG* 🗺️\n────────────────────────\n`;
    mapText += `📍 Posisi Kamu: *${ZONES[currentZone]?.name || currentZone}*\n\n`;
    
    for (const [key, z] of Object.entries(ZONES)) {
      mapText += `*${z.name}* (Key: \`${key}\`)\n`;
      mapText += `• Level Minimum: *Lv. ${z.minLevel}*\n`;
      mapText += `• Deskripsi: _${z.description}_\n`;
      mapText += `• Sumber Daya: _${z.resources}_\n\n`;
    }
    
    mapText += `💡 *Biaya Perjalanan:* 500 Gold 🪙 (Kecuali ke Green Forest)\n`;
    mapText += `💡 *Cara Pindah Zona:* Ketik *!go [key_zona]*\nContoh: *!go abandoned_mine*`;
    return reply(sock, msg, mapText);
  }

  if (cmd === 'go') {
    const targetZone = args[0]?.toLowerCase();
    if (!targetZone || !ZONES[targetZone]) {
      return reply(sock, msg, `❌ Zona tidak ditemukan! Ketik *!map* untuk melihat daftar zona yang valid.`);
    }

    if (targetZone === currentZone) {
      return reply(sock, msg, `📍 Kamu sudah berada di zona *${ZONES[currentZone].name}*!`);
    }

    const z = ZONES[targetZone];
    if (player.level < z.minLevel) {
      return reply(sock, msg, `❌ Level kamu tidak cukup! *${z.name}* membutuhkan minimal *Level ${z.minLevel}* (Level kamu: *Lv. ${player.level}*).`);
    }

    // Biaya Perjalanan 500 Gold (kecuali ke green_forest)
    const travelCost = targetZone === 'green_forest' ? 0 : 500;
    if (player.gold < travelCost) {
      return reply(sock, msg, `❌ Gold tidak cukup! Perjalanan ke *${z.name}* membutuhkan biaya *500 Gold* 🪙.`);
    }

    player.zone = targetZone;
    player.gold -= travelCost;
    db.savePlayer(player);

    let succMsg = `🗺️ *PERJALANAN BERHASIL!*\n────────────────────────\nKamu telah berpindah ke zona *${z.name}*!`;
    if (travelCost > 0) {
      succMsg += ` (Membayar biaya transit *-${travelCost} Gold* 🪙)`;
    }
    succMsg += `\n\n_${z.description}_\n\n💡 Hunt (*!hunt*) & gathering (*!tebang* / *!tambang*) sekarang akan disesuaikan dengan zona ini.`;

    return reply(sock, msg, succMsg);
  }
}

module.exports = { handleZoneCommands, ZONES };
