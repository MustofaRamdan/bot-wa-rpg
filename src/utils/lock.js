// ================== USER COMMAND LOCK / QUEUE SYSTEM ==================
// Mencegah Race Condition (eksploitasi spam ganda) per User ID

const activeLocks = new Set();

/**
 * Memperoleh lock untuk user ID tertentu.
 * @param {string} userId
 * @returns {boolean} true jika berhasil mengunci, false jika user sedang terkunci (sedang memproses command lain)
 */
function acquireLock(userId) {
  if (activeLocks.has(userId)) {
    return false; // Sedang ada command berjalan untuk user ini
  }
  activeLocks.add(userId);
  return true;
}

/**
 * Melepas lock untuk user ID tertentu.
 * @param {string} userId
 */
function releaseLock(userId) {
  activeLocks.delete(userId);
}

module.exports = {
  acquireLock,
  releaseLock
};
