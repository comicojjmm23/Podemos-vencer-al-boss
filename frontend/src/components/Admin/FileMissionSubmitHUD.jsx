import React, { useState } from "react";
import axios from "axios";
import MissionToast from "./MissionToast";
import "./FileMissionSubmitHUD.css";

const MAX_SIZE_MB = 10;
const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
];

const FileMissionSubmitHUD = ({ missionId, token }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const validateFile = (file) => {
    if (!file) return "⚠️ Debes seleccionar un archivo.";
    if (!allowedTypes.includes(file.type)) return "❌ Tipo de archivo no permitido.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `❌ El archivo supera los ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const error = validateFile(file);
    if (error) {
      showToast(error, "error");
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      showToast("⚠️ Debes seleccionar un archivo válido", "error");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("submissionFile", selectedFile);
      formData.append("message", message);

      await axios.post(`/api/missions/submit/${missionId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showToast("✅ Tarea entregada con éxito", "success");
      setSelectedFile(null);
      setMessage("");
    } catch (err) {
      console.error("Error al entregar:", err);
      const msg = err.response?.data?.msg || "❌ Error al entregar la tarea";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-submit-card">
      <h2>📄 Entregar Misión</h2>

      <input
        type="file"
        name="submissionFile"
        accept=".pdf,.doc,.docx,.jpg,.png,.gif"
        onChange={handleFileChange}
      />

      {selectedFile && (
        <p className="file-name">📎 Archivo seleccionado: {selectedFile.name}</p>
      )}

      <textarea
        placeholder="💬 Mensaje opcional para el profesor..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "⏳ Enviando..." : "✅ Entregar Tarea"}
      </button>

      {toast && (
        <MissionToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default FileMissionSubmitHUD;
