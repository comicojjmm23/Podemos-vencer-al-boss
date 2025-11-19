const Achievement = require("../models/Achievement");
const User = require("../models/User");

/**
 * Verifica y desbloquea logros para un usuario según el evento y valor actual.
 * @param {String} userId - ID del usuario
 * @param {String} key - Tipo de logro (ej: "missionsCompleted", "accountCreated")
 * @param {Number|Boolean} value - Valor actual del evento
 * @returns {Array} - Lista de logros desbloqueados en esta ejecución
 */
async function checkAchievements(userId, key, value = 0) {
  const user = await User.findById(userId);
  if (!user) return [];

  if (!Array.isArray(user.achievements)) {
    user.achievements = [];
  }

  const achievements = await Achievement.find({ key });
  const unlocked = [];

  for (const ach of achievements) {
    const alreadyUnlocked = user.achievements.some(a => a.code === ach.code);

    if (!alreadyUnlocked && value >= ach.threshold) {
      const newAchievement = {
        code: ach.code,
        title: ach.title,
        description: ach.description,
        iconUrl: ach.iconUrl,
        unlockedAt: new Date()
      };

      user.achievements.push(newAchievement);
      unlocked.push(newAchievement);
    }
  }

  await user.save();
  return unlocked;
}

module.exports = { checkAchievements };
