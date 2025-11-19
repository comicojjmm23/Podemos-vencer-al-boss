import React, { useEffect } from "react";
import "./AchievementPopup.css";

const AchievementPopup = ({ achievement, onClose }) => {
  useEffect(() => {
    if (!achievement) return;

    // Mapeo de sonidos por código de logro
    const soundMap = {
      welcome_warrior: "/sounds/fanfare.mp3",
      missionsCompleted_5: "/sounds/powerup.mp3",
      missionsCompleted_10: "/sounds/powerup.mp3",
      level_up_1: "/sounds/fanfare.mp3",
      level_up_2: "/sounds/fanfare.mp3",
      itemPurchased_1: "/sounds/coin.mp3",
      itemPurchased_5: "/sounds/coin.mp3",
    };

    const sound = soundMap[achievement.code] || "/sounds/fanfare.mp3";

    // Reproducir sonido
    const audio = new Audio(sound);
    audio.volume = 0.6;
    audio.play().catch(() => {
      console.warn("El navegador bloqueó la reproducción automática de audio.");
    });

    // Cerrar popup automáticamente
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div className="popup-overlay" role="alert" aria-live="assertive">
      <div className="popup-card">
        <img
          src={achievement.iconUrl}
          alt={achievement.title}
          className="popup-icon"
        />
        <h3 className="popup-title">🏆 ¡Logro desbloqueado!</h3>
        <p className="popup-text">{achievement.title}</p>
      </div>
    </div>
  );
};

export default AchievementPopup;
