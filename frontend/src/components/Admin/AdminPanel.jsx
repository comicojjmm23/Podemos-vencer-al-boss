import React, { useState } from "react";
import SubmissionReview from "./SubmissionReview";
import AdminCreateItems from "./AdminCreateItems";

const AdminPanel = ({ token, setView }) => {
  const [activeTab, setActiveTab] = useState("review");

  if (!token) {
    return (
      <div role="alert" className="text-red-400 p-4 bg-black border border-red-600 rounded">
        ⚠️ Error: Token de autenticación no proporcionado al Panel de Administración.
      </div>
    );
  }

  const tabs = [
    {
      id: "review",
      label: "👀 Revisión de Entregas",
      component: <SubmissionReview token={token} />,
    },
    {
      id: "store",
      label: "🛒 Crear Recompensa",
      component: <AdminCreateItems token={token} />,
    },
  ];

  return (
    <section
      className="bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-xl shadow-neon border border-pink-700/50 text-white"
      aria-label="Panel de Administración"
    >
      <h2 className="text-3xl font-light text-pink-400 mb-6 border-b border-gray-700 pb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
        🎮 Panel de Control de Misiones
      </h2>

      {/* Pestañas internas */}
      <nav role="tablist" aria-label="Opciones del panel" className="flex border-b border-gray-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              activeTab === tab.id
                ? "text-pink-400 border-b-2 border-pink-600 bg-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Contenido activo */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="tab-content mb-6"
      >
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>

      {/* Accesos externos a vistas dedicadas */}
      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={() => setView?.({ name: "manageMissions" })}
          className="px-4 py-2 text-lg font-medium text-pink-300 border border-pink-600 rounded-lg bg-black hover:bg-pink-600 hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          aria-label="Ir a gestión de misiones"
        >
          📋 Gestionar Misiones
        </button>

        <button
          onClick={() => setView?.({ name: "createMission" })}
          className="px-4 py-2 text-lg font-medium text-indigo-300 border border-indigo-600 rounded-lg bg-black hover:bg-indigo-600 hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Ir a creación de misión"
        >
          ➕ Crear Misión
        </button>
      </div>
    </section>
  );
};

export default AdminPanel;
