import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config"; // ✅ 1. Importamos subiendo 2 niveles
import "./AdminPanel.css";
import EditMissionModal from "./EditMissionModal";

// ✅ 2. Usamos la variable inteligente
const API_BASE = `${API_URL}/api`;

const MissionList = ({ token }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);

  // 🔹 Cargar misiones
  const fetchMissions = async () => {
    setLoading(true);
    setError("");
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Axios usará la URL correcta automáticamente
      const res = await axios.get(`${API_BASE}/missions/admin`, config);
      setMissions(res.data);
    } catch (err) {
      console.error("Error fetching missions:", err);
      setError("Error al cargar la lista de misiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMissions();
    else setError("No token found. Please log in.");
  }, [token]);

  // 🔹 Eliminar misión
  const handleDelete = async (missionId) => {
    const confirm = window.confirm("¿Estás seguro de que quieres eliminar esta misión?");
    if (!confirm) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/missions/${missionId}`, config);
      setMissions((prev) => prev.filter((m) => m._id !== missionId));
      alert("Misión eliminada con éxito.");
    } catch (err) {
      console.error("Error deleting mission:", err);
      setError("Error al eliminar la misión.");
    }
  };

  // 🔹 Editar misión
  const handleEdit = (mission) => {
    setCurrentMission(mission);
    setIsModalOpen(true);
  };

  // 🔹 Renderizado condicional
  if (loading) return <div className="loading-screen p-4">Cargando misiones...</div>;
  if (error) return <div className="error-message p-4 text-red-400">{error}</div>;
  if (missions.length === 0) return <div className="p-4 text-gray-400">No hay misiones disponibles.</div>;

  return (
    <section className="mission-list-container" role="region" aria-labelledby="mission-list-title">
      <h3 id="mission-list-title" className="list-title">Lista de Misiones ({missions.length})</h3>

      <div className="table-responsive">
        <table className="mission-table">
          <thead>
            <tr>
              <th scope="col">Título</th>
              <th scope="col">XP</th>
              <th scope="col">Monedas</th>
              <th scope="col">Dificultad</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m._id} className={!m.isActive ? "inactive-row" : ""}>
                <td className="font-semibold">{m.title}</td>
                <td>{m.xpReward}</td>
                <td>{m.coinsReward} 🪙</td>
                <td>
                  <span className={`difficulty-tag ${m.difficulty}`}>
                    {m.difficulty.toUpperCase()}
                  </span>
                </td>
                <td>{m.isActive ? "✅ Activa" : "❌ Inactiva"}</td>
                <td className="action-buttons">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(m)}
                    aria-label={`Editar misión ${m.title}`}
                  >
                    Editor
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(m._id)}
                    aria-label={`Eliminar misión ${m.title}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edición (sin portal, pero con overlay fijo) */}
      {isModalOpen && currentMission && (
        <EditMissionModal
          mission={currentMission}
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchMissions}
        />
      )}
    </section>
  );
};

export default MissionList;