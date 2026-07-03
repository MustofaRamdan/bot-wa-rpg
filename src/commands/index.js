const { handleHelpCommand } = require('./help');
const { handleUserCommands } = require('./user');
const { handleBattleCommands } = require('./battle');
const { handleInventoryCommands } = require('./inventory');
const { handlePetCommands } = require('./pets');
const { handleEconomyCommands } = require('./economy');
const { handleGuildCommands } = require('./guild');
const { handleSocialCommands } = require('./social');
const { handleGatherCommands } = require('./gather');
const { handlePvPCommands } = require('./pvp');
const { handleZoneCommands } = require('./zone');
const { handleQuestCommands } = require('./quest');


async function replyError(sock, msg, errorText) {
  const remoteJid = msg.key.remoteJid;
  try {
    await sock.sendMessage(remoteJid, { text: `❌ Terjadi error: ${errorText}` }, { quoted: msg });
  } catch (e) {
    console.error("Gagal mengirim error reply:", e);
  }
}

async function routeCommand(sock, msg, body, userId, pushName, client) {
  if (!body.startsWith('!')) return;

  const parts = body.slice(1).trim().split(/ +/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  try {
    if (command === 'sicantik') {
      const remoteJid = msg.key.remoteJid;
      return await sock.sendMessage(remoteJid, { text: 'Mega Rizkiya' }, { quoted: msg });
    }

    if (command === 'help' || command === 'menu') {
      return await handleHelpCommand(sock, msg, args);
    }

    if (['register', 'profile', 'me', 'stats', 'stat_add', 'upstat', 'daily', 'leaderboard', 'top', 'promote', 'changejob', 'reclass'].includes(command)) {
      return await handleUserCommands(sock, msg, command, args, userId, pushName);
    }


    if (['hunt', 'adventure', 'dungeon', 'worldboss', 'boss', 'boss_top'].includes(command)) {
      return await handleBattleCommands(sock, msg, command, args, userId, client);
    }

    // 4. Inventory, Shop & Forge Commands
    if (['inventory', 'inv', 'shop', 'buy', 'equip', 'unequip', 'use', 'forge', 'upgrade', 'giveitem', 'give_item', 'transferitem'].includes(command)) {
      return await handleInventoryCommands(sock, msg, command, args, userId);
    }

    // 5. Pet Commands
    if (['pets', 'pet', 'pet_set', 'petset'].includes(command)) {
      return await handlePetCommands(sock, msg, command, args, userId);
    }

    // 6. Economy Commands
    if (['balance', 'deposit', 'withdraw', 'give', 'pay', 'gamble'].includes(command)) {
      return await handleEconomyCommands(sock, msg, command, args, userId);
    }

    // 7. Guild Commands
    if (['create_guild', 'createguild', 'guild', 'guild_info', 'guild_invite', 'guild_accept', 'guild_leave', 'guild_donate', 'guild_upgrade', 'guild_train', 'guild_upstat', 'guild_raid', 'guild_notice', 'guild_kick'].includes(command)) {
      return await handleGuildCommands(sock, msg, command, args, userId);
    }

    // 8. Social/Guestbook Commands
    if (['comment', 'comments', 'guestbook'].includes(command)) {
      return await handleSocialCommands(sock, msg, command, args, userId);
    }

    // 9. Gathering, Crafting & Brewing Commands
    if (['fish', 'fishing', 'chop', 'woodcut', 'mine', 'mining', 'sell', 'craft', 'brew'].includes(command)) {
      return await handleGatherCommands(sock, msg, command, args, userId);
    }

    // 10. PvP Duel Commands
    if (['duel'].includes(command)) {
      return await handlePvPCommands(sock, msg, command, args, userId);
    }

    // 11. Zone & Exploration Commands
    if (['map', 'go'].includes(command)) {
      return await handleZoneCommands(sock, msg, command, args, userId);
    }

    // 12. Quests & Achievements Commands
    if (['quest', 'achievement'].includes(command)) {
      return await handleQuestCommands(sock, msg, command, args, userId);
    }

    // Default: Command tidak dikenal
    const remoteJid = msg.key.remoteJid;
    await sock.sendMessage(remoteJid, { text: `❌ Perintah *!${command}* tidak dikenal. Ketik *!help* untuk melihat daftar menu.` }, { quoted: msg });

  } catch (err) {
    console.error(`❌ Error executing command !${command}:`, err);
    await replyError(sock, msg, err.message || "Internal Server Error");
  }
}

module.exports = {
  routeCommand
};
