// ================== HELP COMMAND HANDLER ==================

// Helper untuk kirim pesan
async function reply(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function handleHelpCommand(sock, msg, args) {
  const subCommand = args?.[0]?.toLowerCase();

  // 1. SUB-MENU: STATS GUIDE
  if (subCommand === 'stats' || subCommand === 'status') {
    const statsHelp = 
`📊 **PANDUAN STATUS RPG (STATS GUIDE)** 📊
────────────────────────
Setiap status poin yang kamu naikkan memiliki pengaruh besar dalam pertarungan:

• 💪 **STR (Strength)**
  - Meningkatkan **Physical Attack** (+1.5 per poin).
  - Skala utama damage skill fisik *Warrior*, *Paladin*, *Berserker*, dan *Monk*.

• 🧠 **INT (Intelligence)**
  - Meningkatkan **Magic Attack** (+1.8 per poin).
  - Meningkatkan **Max MP** (+4 per poin).
  - Skala utama damage skill magis *Mage* dan *Cleric*.

• 🛡️ **VIT (Vitality)**
  - Meningkatkan **Max HP** (+8 per poin).
  - Meningkatkan **Physical Defense** (+0.8 per poin).
  - Menentukan kekuatan penyerapan perisai *Paladin*.

• ⚡ **AGI (Agility)**
  - Meningkatkan **Critical Rate** (+0.25% per poin, max 40%).
  - Meningkatkan **Evasion Rate** (+0.3% per poin, max 50%).
  - Skala tambahan skill *Rogue* dan *Monk*.

• 🎯 **DEX (Dexterity)**
  - Meningkatkan **Akurasi Serangan** (+0.2% per poin, base 80%, max 98%).
  - Mengurangi kemungkinan seranganmu dihindari oleh monster lincah.
  - Skala utama skill *Rogue*, *Archer*, dan *Monk*.

────────────────────────
💡 *Tips:* Dapatkan +5 Poin Stat gratis setiap naik level. Alokasikan dengan perintah:
*!stat_add [str/int/vit/agi/dex] [jumlah]*
_Contoh: !stat_add str 5_`;

    return reply(sock, msg, statsHelp);
  }

  // 2. SUB-MENU: JOB & CLASSES GUIDE
  if (subCommand === 'job' || subCommand === 'class' || subCommand === 'jobs') {
    const jobHelp = 
`🧙 **PANDUAN KELAS, SKILL & PASIF** 🧙
────────────────────────
Dunia RPG ini memiliki 8 Job dasar (Tier 1) dan versi promosinya (Tier 2 pada Level 30+):

1. ⚔️ **Warrior ➜ Lord Knight**
   - *Gaya:* Physical Melee Tank.
   - *Pasif:* **Shield Block 🛡️** (Peluang 12% memblokir seluruh damage fisik musuh).
   - *T2 Ultimate:* **Spiral Pierce 🌀** (Mengabaikan Defense target).
   - *Kitab:* \`tome_block\`

2. 🛡️ **Paladin ➜ Templar**
   - *Gaya:* Pure Defensive Tank & Shielding.
   - *Pasif:* **Divine Absorb ✨** (Mengubah 8% damage diterima menjadi MP).
   - *T2 Ultimate:* **Grand Cross ✝** (Damage VIT/INT & heal HP diri).
   - *Kitab:* \`tome_absorb\`

3. 🧙 **Mage ➜ Archmage**
   - *Gaya:* Elemental Magic Burst.
   - *Pasif:* **Mana Shield 🔮** (Menyerap 20% damage menggunakan MP).
   - *T2 Ultimate:* **Meteor Storm ☄** (Magic damage masif + status Burn).
   - *Kitab:* \`tome_mana_shield\`

4. ⛪ **Cleric ➜ High Priest**
   - *Gaya:* Healer & Support.
   - *Pasif:* **Divine Favor 💚** (Meningkatkan pemulihan heal sebesar +25%).
   - *T2 Ultimate:* **Sanctuary ⛪** (Heal HP penuh + buff DEF +30%).
   - *Kitab:* \`tome_favor\`

5. 👥 **Rogue ➜ Assassin**
   - *Gaya:* Critical & Evasion Shadow DPS.
   - *Pasif:* **Shadow Assault 💨** (2.0x Critical damage & +15% Evasion).
   - *T2 Ultimate:* **Sonic Blow ⚡** (Damage DEX/AGI tinggi + 30% Crit).
   - *Kitab:* \`tome_shadow\`

6. 🎯 **Archer ➜ Sniper**
   - *Gaya:* Ranged Armor Piercing DPS.
   - *Pasif:* **Eagle Eye 🎯** (Serangan mengabaikan 30% Defense musuh).
   - *T2 Ultimate:* **Sharp Shooting 🎯** (Akurasi 100%, +50% Crit Rate).
   - *Kitab:* \`tome_piercing\`

7. 🩸 **Berserker ➜ Warlord**
   - *Gaya:* High Risk High Reward Melee.
   - *Pasif:* **Low HP Frenzy 🩸** (Damage bertambah s/d +50% saat HP sekarat).
   - *T2 Ultimate:* **Guillotine Slash 🩸** (Instan kill jika HP musuh < 25%).
   - *Kitab:* \`tome_frenzy\`

8. 🥋 **Monk ➜ Grandmaster**
   - *Gaya:* Hybrid Melee & Self Sustain.
   - *Pasif:* **Chakra Meditation 🧘** (Memulihkan 3% HP & MP gratis tiap turn).
   - *T2 Ultimate:* **Asura Strike 👊🔥** (Mengonsumsi semua MP untuk damage mutlak).
   - *Kitab:* \`tome_meditation\`

────────────────────────
💡 *Promosi Kelas:* Ketik *!promote* jika level-mu mencapai 30+!
🔄 *Ubah Job:* Ketik *!changejob [job]* untuk ganti job dasar (Biaya: Level * 500 Gold).`;

    return reply(sock, msg, jobHelp);
  }

  // 3. SUB-MENU: ITEMS GUIDE
  if (subCommand === 'item' || subCommand === 'items') {
    const itemHelp = 
`📦 **PANDUAN FUNGSI & JENIS ITEM** 📦
────────────────────────
Daftar barang penting yang bisa kamu temukan atau craft:

• 🧪 **Consumables (Bahan Konsumsi):**
  - \`potion\`: Memulihkan +50 HP.
  - \`super_potion\`: Memulihkan +150 HP.
  - \`hyper_potion\`: Memulihkan +500 HP.
  - \`ether\`: Memulihkan +50 MP.
  - \`elixir\`: Memulihkan 100% HP & MP ke kondisi penuh.
  - \`exp_boost\`: Memberikan +200 EXP instan.

• ⛏️ **Gathering Tools (Alat Kerja):**
  - Pancingan (\`rod_*\`), Kapak (\`axe_*\`), Cangkul (\`pickaxe_*\`).
  - Tier Alat: *Basic* (Biasa), *Good* (Baja), dan *Pro* (Mithril).
  - Alat yang lebih bagus memberikan drop material langka lebih besar.

• 💎 **Bahan Crafting & Forge:**
  - \`stone_basic\`, \`iron_ore\`, \`ore_silver\`, \`ore_mythril\`, \`ore_adamantite\`.
  - \`wood_pine\`, \`wood_oak\`, \`wood_maple\`, \`wood_ebony\`, \`wood_dragon\`.
  - Gunakan di Blacksmith (\`!forge weapon\` / \`!forge armor\`) menggunakan *Leather Scrap*, *Magic Shard*, dan *Dragon Scale*.

• 📖 **Kitab Pasif (Skill Tomes):**
  - Kitab khusus untuk membuka skill pasif permanen job-mu.
  - Contoh: \`tome_block\` untuk Warrior. Dibuat lewat *!craft*.

• 🐣 **Pet Eggs (Telur Pet):**
  - Beli di toko dan gunakan lewat \`!use\` untuk mendapatkan pet (Tier D s/d SSS) guna membantu berburu dan memangkas cooldown hunt.`;

    return reply(sock, msg, itemHelp);
  }

  // 4. MAIN HELP MENU
  const mainHelp = 
`🎮 *MAIN MENU: WA RPG BOT* 🎮
────────────────────────
Ketik perintah di bawah untuk memulai petualanganmu!

👤 *PROFIL & SETUP*
• \`!register [job]\` - Daftar & pilih Job RPG.
• \`!profile [@player]\` - Lihat profil & status.
• \`!stats\` - Statistik kemenangan & buruan.
• \`!stat_add [stat] [poin]\` - Alokasi Stat Points.
• \`!leaderboard\` - Papan peringkat level.

⚔️ *PERTARUNGAN & DUNGEON*
• \`!hunt\` - Berburu monster (CD: 30 detik).
• \`!dungeon\` - Masuk dungeon (CD: Level * 25 Gold).
• \`!worldboss\` - Serang World Boss (Biaya: 100 Gold).
• \`!boss_top\` - Top damage World Boss saat ini.

🎣 *GATHERING, CRAFT & BREW*
• \`!mancing\` / \`!tebang\` / \`!tambang\` - Cari material (CD: 10 menit).
• \`!jual [key] [qty/all]\` - Jual ikan ke pasar.
• \`!craft\` / \`!craft [key]\` - Craft senjata, zirah, & kitab pasif.
• \`!brew\` / \`!brew [key]\` - Meramu potion penyembuh.

🗺️ *WORLD MAP EXPLORATION*
• \`!map\` - Lihat peta dunia & info drop zona.
• \`!go [key_zona]\` - Pindah wilayah (*green_forest*, *abandoned_mine*, *dragon_valley*).

🎯 *QUEST & ACHIEVEMENTS*
• \`!quest\` - Misi harian (reset tiap hari).
• \`!quest claim\` - Klaim hadiah misi harian.
• \`!achievement\` - Klaim bonus status permanen.

🎒 *INVENTORY & FORGE*
• \`!inventory\` / \`!inv\` - Cek tas barang & equipment.
• \`!shop\` / \`!toko\` - Beli potion, alat kerja, & pet egg.
• \`!buy [key] [qty]\` - Beli barang di toko.
• \`!equip [key]\` - Gunakan senjata/zirah hasil craft.
• \`!unequip [slot]\` - Lepas equipment (weapon/armor).
• \`!use [key] [qty]\` - Gunakan potion / tetaskan telur pet.
• \`!forge [slot]\` - Upgrade gear (+1 s/d +10).

🐾 *PETS (PELIHARAAN)*
• \`!pets\` - Koleksi pet & bonus stat-nya.
• \`!pet_set [nomor]\` - Pasang pet aktif.

🪙 *EKONOMI & TRANSFER*
• \`!saldo\` / \`!deposit\` / \`!withdraw\` - Keuangan bank.
• \`!give @player [jumlah]\` - Kirim gold ke teman.
• \`!judi [jumlah/all]\` - Coinflip (ganda/zonk).

⚔️ *PVP DUEL SYSTEM*
• \`!duel @player [taruhan]\` - Duel taruhan (20% pajak pembakaran gold).

🏛️ *GUILD SYSTEM*
• \`!create_guild [nama]\` / \`!guild_info\` / \`!guild_leave\`.

────────────────────────
❓ **PANDUAN SUB-MENU DETAILED (Ketik perintah di bawah):**
📖 *!help stats* - Panduan fungsi status (STR, INT, VIT, AGI, DEX).
📖 *!help job* - Info seluruh kelas, skill, & pasif.
📖 *!help items* - Penjelasan seluruh jenis barang.

💡 *Tips:* Senjata & Zirah tidak dijual di toko! Kamu harus mengumpulkan kayu & bijih besi untuk membuatnya sendiri di perintah *!craft*!`;

  return reply(sock, msg, mainHelp);
}

module.exports = {
  handleHelpCommand
};
