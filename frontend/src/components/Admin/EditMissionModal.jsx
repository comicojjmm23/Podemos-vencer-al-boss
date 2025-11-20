import React, { useState } from "react";
import axios from "axios";
import "./EditMissionModal.css";
import { toast } from "react-toastify";
import { API_URL } from "../../config"; // ✅ 1. Importamos subiendo 2 niveles

// ✅ 2. Usamos la variable inteligente
const API_BASE = `${API_URL}/api`;

const EditMissionModal = ({ mission, token, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: mission.title,
    description: mission.description,
    difficulty: mission.difficulty,
    xpReward: mission.xpReward,
    coinsReward: mission.coinsReward,
    isActive: mission.isActive,
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio.";
    if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria.";
    if (!formData.xpReward || formData.xpReward < 0) newErrors.xpReward = "XP inválido.";
    if (!formData.coinsReward || formData.coinsReward < 0) newErrors.coinsReward = "Monedas inválidas.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/missions/${mission._id}`, formData, config);
      toast.success("✅ Misión actualizada");
      onSave();
      onClose();
    } catch (err) {
      console.error("Error al actualizar misión:", err);
      toast.error("❌ Error al actualizar misión");
    }
  };

  return (
    <div className="edit-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="editMissionTitle">
      <div className="edit-modal-container animate-fade-in">
        <h2 id="editMissionTitle" className="edit-modal-title">✏️ Editar Misión</h2>
        <form onSubmit={handleSubmit} className="edit-form">
          
          {/* Título */}
          <div className="form-group">
            <label htmlFor="title">Título de la misión</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`edit-input ${errors.title ? "input-error" : ""}`}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "error-title" : undefined}
            />
            {errors.title && (
              <p id="error-title" className="error-text" role="alert">{errors.title}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`edit-textarea ${errors.description ? "input-error" : ""}`}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "error-description" : undefined}
            />
            {errors.description && (
              <p id="error-description" className="error-text" role="alert">{errors.description}</p>
            )}
          </div>

          {/* Dificultad */}
          <div className="form-group">
            <label htmlFor="difficulty">Dificultad</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="edit-select"
            >
              <option value="fácil">Fácil</option>
              <option value="medio">Medio</option>
              <option value="duro">Duro</option>
            </select>
          </div>

          {/* XP */}
          <div className="form-group">
            <label htmlFor="xpReward">Recompensa XP</label>
            <input
              id="xpReward"
              type="number"
              name="xpReward"
              value={formData.xpReward}
              onChange={handleChange}
              className={`edit-input ${errors.xpReward ? "input-error" : ""}`}
              aria-invalid={!!errors.xpReward}
              aria-describedby={errors.xpReward ? "error-xp" : undefined}
            />
            {errors.xpReward && (
              <p id="error-xp" className="error-text" role="alert">{errors.xpReward}</p>
            )}
          </div>

          {/* Monedas */}
          <div className="form-group">
            <label htmlFor="coinsReward">Recompensa en monedas</label>
            <input
              id="coinsReward"
              type="number"
              name="coinsReward"
              value={formData.coinsReward}
              onChange={handleChange}
              className={`edit-input ${errors.coinsReward ? "input-error" : ""}`}
              aria-invalid={!!errors.coinsReward}
              aria-describedby={errors.coinsReward ? "error-coins" : undefined}
            />
            {errors.coinsReward && (
              <p id="error-coins" className="error-text" role="alert">{errors.coinsReward}</p>
            )}
          </div>

          {/* Activa */}
          <div className="form-group edit-checkbox-wrapper">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <label htmlFor="isActive">¿Activa?</label>
          </div>

          {/* Botones */}
          <div className="edit-button-group">
            <button
              type="button"
              onClick={onClose}
              className="edit-btn cancel"
              aria-label="Cancelar edición de misión"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="edit-btn save"
              aria-label="Guardar cambios de misión"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMissionModal;