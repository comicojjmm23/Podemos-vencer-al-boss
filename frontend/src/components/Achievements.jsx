import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Achievements.css"; // 🎮 Estilos gamer/neón

const Achievements = ({ userId, achievements: initialAchievements }) => {
  const [achievements, setAchievements] = useState(initialAchievements || []);
  const [loading, setLoading] = useState(!initialAchievements);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`/api/users/${userId}/achievements`);
        const data = res.data;

        const loaded = Array.isArray(data.achievements)
          ? data.achievements
          : Array.isArray(data)
          ? data
          : [];

        setAchievements(loaded);
      } catch (err) {
        console.error("Error al obtener logros:", err);
        setError("No se pudieron cargar los logros.");
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };

    if (!initialAchievements && userId) {
      fetchAchievements();
    }
  }, [userId, initialAchievements]);

  if (loading) {
    return (
      <div className="achievements-card">
        <h2>🏆 Logros</h2>
        <p className="loading-text">Cargando logros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-card">
        <h2>🏆 Logros</h2>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="achievements-card">
      <h2>🏆 Logros</h2>
      {achievements.length === 0 ? (
        <p className="no-achievements">Aún no has desbloqueado ningún logro.</p>
      ) : (
        <div className="achievements-grid">
          {achievements.map((ach) => (
            <div
              key={ach.code || ach._id}
              className={`achievement-card ${ach.unlockedAt ? "unlocked" : "locked"}`}
            >
              {ach.iconUrl && (
                <img
                  src={ach.iconUrl}
                  alt={ach.title}
                  className="achievement-icon"
                />
              )}
              <h3 className="achievement-title">{ach.title}</h3>
              <p className="achievement-description">{ach.description}</p>
              {ach.unlockedAt && (
                <span className="achievement-date">
                  {new Date(ach.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;
