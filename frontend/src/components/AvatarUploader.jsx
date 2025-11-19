import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./AvatarUpload.css";

const AvatarUploader = ({ profile, setProfile }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith("image/")) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    } else {
      toast.error("⚠️ Solo se permiten archivos de imagen");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("⚠️ Selecciona una imagen primero");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/users/avatar/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("✅ Foto de perfil actualizada");
      setProfile((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      setPreview(null);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al subir avatar");
    }
  };

  return (
    <div
      className="avatar-panel"
      role="region"
      aria-label={`Panel de perfil de ${profile?.username || "jugador"}`}
      tabIndex="0"
    >
      <h3 className="avatar-title">🎮 Foto de Perfil</h3>

      {/* Info del jugador */}
      <div className="profile-info" aria-label="Información del jugador">
        <p className="profile-name">👤 {profile?.username || "Jugador"}</p>
        <p className="profile-role">🛡️ Rol: {profile?.role || "Sin rol"}</p>
        <p className="profile-level">⚡ Nivel: {profile?.level || 1}</p>
      </div>

      {/* Avatar */}
      <div className="avatar-wrapper" aria-live="polite">
        <img
          src={
            preview ||
            (profile?.avatarUrl && `http://localhost:5000${profile.avatarUrl}`)
          }
          alt="Avatar del jugador"
        />
      </div>

      {/* Barra de XP */}
      <div
        className="xp-bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="1000"
        aria-valuenow={profile?.xp || 0}
      >
        <div
          className="xp-fill"
          style={{ width: `${(profile?.xp || 0) / 10}%` }}
        ></div>
        <span className="xp-label">XP: {profile?.xp || 0}</span>
      </div>

      {/* Input oculto */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="avatar-input"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Botón seleccionar imagen */}
      <button
        type="button"
        className="avatar-select-btn"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Seleccionar imagen de perfil"
      >
        📁 Seleccionar imagen
      </button>

      {/* Botón confirmar subida */}
      {preview && (
        <button
          onClick={handleUpload}
          className="avatar-upload-btn"
          aria-label="Confirmar subida de avatar"
        >
          🚀 Confirmar subida
        </button>
      )}

      {/* Logros */}
      <div className="achievements" aria-label="Logros desbloqueados">
        <h4 className="achievements-title">🏅 Logros</h4>
        <ul className="achievements-list">
          {profile?.achievements?.length > 0 ? (
            profile.achievements.map((ach, index) => (
              <li key={index} className="achievement-item">
                ✅ {ach.title}
              </li>
            ))
          ) : (
            <li>No hay logros aún</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AvatarUploader;
