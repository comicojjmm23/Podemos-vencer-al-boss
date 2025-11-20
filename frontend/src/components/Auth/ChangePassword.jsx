// src/components/Auth/ChangePassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config"; // ✅ 1. Importamos subiendo 2 niveles

import "./ChangePassword.css";

// ✅ 2. Usamos la variable inteligente
const API_BASE = `${API_URL}/api/auth`;

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const { currentPassword, newPassword } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/change-password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.msg);
      setFormData({ currentPassword: "", newPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.msg || "Error al cambiar contraseña";
      toast.error(msg);
    }
  };

  return (
    <div className="change-password-view">
      <h2>Cambiar Contraseña</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Contraseña Actual</label>
          <input
            type="password"
            name="currentPassword"
            value={currentPassword}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>Nueva Contraseña</label>
          <input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit">Actualizar</button>
      </form>
    </div>
  );
};

export default ChangePassword;