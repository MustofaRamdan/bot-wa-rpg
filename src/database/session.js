const mongoose = require('mongoose');
const { BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys');

// ================== MONGOOSE SCHEMA & MODEL ==================
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  key:       { type: String, required: true, index: true },
  value:     { type: String } // Menyimpan value ter-serialize sebagai JSON string untuk keandalan maksimum
}, { timestamps: true });

// Compound index unik agar data tidak duplikat untuk session & key yang sama
sessionSchema.index({ sessionId: 1, key: 1 }, { unique: true });

const SessionModel = mongoose.model('Session', sessionSchema);

// ================== CUSTOM AUTH STATE PROVIDER ==================
async function useMongoDBAuthState(sessionId) {
  // Fungsi internal untuk menyimpan data ke database
  const writeData = async (data, key) => {
    try {
      const valueStr = JSON.stringify(data, BufferJSON.replacer);
      await SessionModel.findOneAndUpdate(
        { sessionId, key },
        { value: valueStr },
        { upsert: true }
      );
    } catch (err) {
      console.error(`❌ Gagal menyimpan session key '${key}':`, err.message);
    }
  };

  // Fungsi internal untuk membaca data dari database
  const readData = async (key) => {
    try {
      const doc = await SessionModel.findOne({ sessionId, key }).lean();
      if (!doc || !doc.value) return null;
      return JSON.parse(doc.value, BufferJSON.reviver);
    } catch (err) {
      console.error(`❌ Gagal membaca session key '${key}':`, err.message);
      return null;
    }
  };

  // Fungsi internal untuk menghapus data dari database
  const removeData = async (key) => {
    try {
      await SessionModel.deleteOne({ sessionId, key });
    } catch (err) {
      console.error(`❌ Gagal menghapus session key '${key}':`, err.message);
    }
  };

  // Muat credentials yang tersimpan atau inisialisasi baru
  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                // Konversi objek kembali ke format protobuf kelas jika diperlukan
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    // Handler pembaruan kredensial yang dipanggil Baileys
    saveCreds: async () => {
      await writeData(creds, 'creds');
    }
  };
}

module.exports = {
  useMongoDBAuthState,
  SessionModel
};
