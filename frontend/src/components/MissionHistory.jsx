// frontend/src/components/MissionHistory.jsx
import React, { useState, useEffect } from 'react';
import './MissionHistory.css'; // Estilos para el historial

const API_URL = 'http://localhost:5000/api/missions/history';

const MissionHistory = ({ token }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || 'Error al cargar el historial de misiones.');
        }

        setHistory(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Ícono según tipo de misión
  const getMissionIcon = (type) => {
    switch (type) {
      case 'file':
        return '📄';
      case 'survey':
        return '📊';
      default:
        return '🎯';
    }
  };

  if (loading) return <div className="history-loading">Cargando Historial...</div>;

  return (
    <div className="history-container">
      <h2>📜 Historial de Misiones Completadas</h2>

      {error && <p className="history-message error">{error}</p>}

      {history.length > 0 ? (
        <table className="history-table">
          <thead>
            <tr>
              <th>Misión</th>
              <th>XP Obtenida</th>
              <th>Monedas Ganadas</th>
              <th>Fecha de Finalización</th>
              <th>Estado</th> {/* Nueva columna */}
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index} className={`difficulty-${item.difficulty}`}>
                <td>
                  {getMissionIcon(item.missionType)} {item.missionName}
                </td>
                <td className="xp-col">+ {item.xpEarned} XP</td>
                <td className="coins-col">{item.coinsEarned} 🪙</td>
                <td>{formatDate(item.completedAt)}</td>
                <td>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-history">Aún no has completado ninguna misión. ¡Es hora de empezar!</p>
      )}
    </div>
  );
};

export default MissionHistory;
