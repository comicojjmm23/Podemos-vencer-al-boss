import React, { useEffect } from "react";
import { API_URL } from "../config"; // ✅ 1. Importamos la variable
import "./AchievementPopup.css";

const AchievementPopup = ({ achievement, onClose }) => {
  useEffect(() => {
    if (!achievement) return;

    // Mapeo de sonidos por código de logro
    // (Asegúrate de que estos archivos existan en tu carpeta public/sounds)
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

  // ✅ 2. Lógica inteligente para la imagen
  // Si la URL empieza con "http", es externa (ej: imgur). Si no, es del backend y le ponemos API_URL.
  const imageSrc = achievement.iconUrl && achievement.iconUrl.startsWith("http")
    ? achievement.iconUrl
    : `${API_URL}${achievement.iconUrl}`;

  return (
    <div className="popup-overlay" role="alert" aria-live="assertive">
      <div className="popup-card animate-pop-in">
        <img
          src={imageSrc}
          alt={achievement.title}
          className="popup-icon"
          // Fallback por si la imagen falla
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/100x100/ffaa00/000?text=🏆"; 
          }}
        />
        <h3 className="popup-title">🏆 ¡Logro desbloqueado!</h3>
        <p className="popup-text">{achievement.title}</p>
      </div>
    </div>
  );
};

export default AchievementPopup;