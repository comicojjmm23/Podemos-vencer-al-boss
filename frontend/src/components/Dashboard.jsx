// =======================================================
// Dashboard.jsx — Estilo Gamer HUD (Refactorizado con A11y)
// =======================================================
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { API_URL } from "../config"; // ✅ 1. Importamos la variable inteligente

// Componentes secundarios
import Store from "./Store";
import Inventory from "./Inventory";
import Achievements from "./Achievements";
import MissionHistory from "./MissionHistory";
import AvatarUploader from "./AvatarUploader";
import AdminPanel from "./Admin/AdminPanel";
import ChatRoom from "./ChatRoom";
import MissionCard from "./MissionCard";
import MissionSubmission from "./MissionSubmission";
import ChangePassword from "./Auth/ChangePassword";
import Profile2FA from "./Auth/Profile2FA";
import RankingBar from "./RankingBar";
import MissionForm from "./Admin/MissionForm";
import MissionList from "./Admin/MissionList";
import SurveyMission from "./SurveyMission";
import SecurityQuestionForm from "./Auth/SecurityQuestionForm";
import AchievementPopup from "./AchievementPopup";

// Estilos
import "./Dashboard.css"; 
import "./AvatarUpload.css";
import "./MissionCard.css";

// ✅ 2. Actualizamos la base de la API usando la variable importada
// Antes era: "http://localhost:5000/api"
const API_BASE = `${API_URL}/api`;

const Dashboard = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [lastPopup, setLastPopup] = useState(null);
  const [shownCodes, setShownCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ name: "dashboard", missionId: null });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const isAdmin = profile && ["admin", "teacher"].includes(profile.role);

  const fetchJSON = async (url, setter) => {
    try {
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
        return null;
      }
      const data = await res.json();
      if (setter) setter(data);
      return data;
    } catch (err) {
      console.error(`Error al obtener ${url}:`, err);
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const loadDashboard = async () => {
    setLoading(true);
    const userData = await fetchJSON(`${API_BASE}/users/me`, setProfile);
    await Promise.all([
      fetchJSON(`${API_BASE}/ranking`, setRanking),
      fetchJSON(`${API_BASE}/missions`, setMissions),
    ]);
    if (userData?._id) {
      await fetchJSON(`${API_BASE}/users/${userData._id}/achievements`, setAchievements);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadDashboard();
  }, [token]);

  useEffect(() => {
    const storedCodes = localStorage.getItem("shownAchievementCodes");
    if (storedCodes) {
      setShownCodes(JSON.parse(storedCodes));
    }
  }, []);

  useEffect(() => {
    if (achievements?.length && shownCodes.length > 0) {
      const latest = achievements.at(-1);
      if (latest && !shownCodes.includes(latest.code)) {
        setLastPopup(latest);
        const updatedCodes = [...shownCodes, latest.code];
        setShownCodes(updatedCodes);
        localStorage.setItem("shownAchievementCodes", JSON.stringify(updatedCodes));

        const timer = setTimeout(() => setLastPopup(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [achievements, shownCodes]);

  // =======================================================
  // RENDER
  // =======================================================

  if (loading) return <div className="loading-screen">Inicializando Sistema...</div>;
  if (!profile) return <div className="loading-screen">Cargando Perfil...</div>;

  const selectedMission = ["submission", "survey"].includes(view.name)
    ? missions.find((m) => m._id === view.missionId)
    : null;

  const handleBack = () => setView({ name: "dashboard", missionId: null });

  const renderView = () => {
    switch (view.name) {
      case "dashboard":
        return (
          <main className="dashboard-grid gap-6 p-6">
            
            {/* A11Y: ENCABEZADO PRINCIPAL DE LA VISTA (H1) */}
            <h1 className="sr-only">Panel de Comando Principal</h1>

            {/* --- PERFIL --- */}
            {/* A11Y: Sección principal de la columna: H2 */}
            <div className="card profile-card p-6 flex items-center gap-4" role="region" aria-labelledby="profile-title">
              <h2 id="profile-title" className="sr-only">Foto de Perfil y Nivel</h2>
              
              <AvatarUploader profile={profile} setProfile={setProfile} />
              <div>
                {/* A11Y: Nombre de usuario con nivel de título */}
                <h3 className="text-xl font-bold text-white">{profile?.username}</h3>
                <span className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-300 bg-indigo-900 bg-opacity-30">
                  {profile?.role?.toUpperCase()}
                </span>
                <p className="text-sm mt-2 text-gray-300">
                  2FA: <span style={{color: profile?.isTwoFAEnabled ? '#00ff9d' : '#ff0055'}}>{profile?.isTwoFAEnabled ? "ACTIVADO" : "DESACTIVADO"}</span>
                </p>
              </div>
            </div>

            {/* --- RANKING --- */}
            {/* A11Y: Sección principal de la columna: H2 */}
            <div className="card ranking-card p-6" role="region" aria-labelledby="ranking-title">
              <h2 id="ranking-title" className="mb-4">🏆 Ranking Galáctico</h2>
              <RankingBar ranking={ranking} />
            </div>

            {/* --- MISIONES --- */}
            {/* A11Y: Sección principal de la columna: H2 */}
            <div className="card missions-card p-6 md:col-span-2" role="region" aria-labelledby="missions-title">
              <h2 id="missions-title" className="text-lg font-bold mb-6 flex justify-between items-center">
                Misiones Activas 
                <span className="text-sm font-normal bg-blue-900 px-2 py-1 rounded border border-blue-500">{missions.length} Disponibles</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {missions.map((mission) => (
                  <MissionCard
                    key={mission._id}
                    mission={mission}
                    // Verifica si la misión tiene el flag 'completed' 
                    completed={mission.completed || Boolean(mission.submittedFile)}
                    
                    onSubmitFile={(id) => setView({ name: "submission", missionId: id })}
                    onOpenSurvey={(id) => setView({ name: "survey", missionId: id })}
                    onOpenChat={(id) => setView({ name: "chat", missionId: id })}
                  />
                ))}
              </div>
            </div>

            {/* --- LOGROS --- */}
            {/* A11Y: Sección principal de la columna: H2 */}
            <div className="card achievements-card p-6 md:col-span-2" role="region" aria-labelledby="achievements-title">
              <h2 id="achievements-title" className="mb-4">🏅 Medallas y Logros</h2>
              <Achievements userId={profile._id} achievements={achievements} />
            </div>

            {/* --- PANEL ADMIN --- */}
            {isAdmin && (
              <div className="card p-6 md:col-span-2 border-red-500 border-opacity-50" role="region" aria-labelledby="admin-title">
                {/* A11Y: Título Admin como H2 */}
                <h2 id="admin-title" className="text-red-400 border-red-500">🔧 Panel de Control</h2>
                <AdminPanel token={token} setView={setView} />
              </div>
            )}

            {/* --- MENÚ DE ACCESOS RÁPIDOS --- */}
            <div className="card access-card p-6 flex flex-wrap gap-4 md:col-span-2" role="navigation" aria-label="Menú de accesos rápidos">
              {[
                "store", "inventory", "history", "changePassword", 
                "security", "securityQuestion", "chat"
              ].map((name) => {
                const labelMap = {
                  store: "🏪 Tienda",
                  inventory: "🎒 Inventario",
                  history: "📜 Historial",
                  changePassword: "🔑 Contraseña",
                  security: "🛡️ Seguridad (2FA)",
                  securityQuestion: "❓ Pregunta Seg.",
                  chat: "💬 Chat General"
                };
                return (
                  <button
                    key={name}
                    className="flex-1 p-4 rounded-lg shadow hover:brightness-110 min-w-[140px]"
                    onClick={() => setView({ name })}
                    // A11Y: Oculta los emojis decorativos para evitar repetición
                    aria-label={`Abrir ${labelMap[name].split(' ').slice(1).join(' ')}`}
                  >
                    <span aria-hidden="true">{labelMap[name].split(' ')[0]}</span> {labelMap[name].split(' ').slice(1).join(' ')}
                  </button>
                );
              })}
            </div>
          </main>
        );

      // --- OTRAS VISTAS ---
      case "submission":
        return selectedMission ? (
          <div className="p-6 max-w-4xl mx-auto">
            <button className="btn-back mb-6" onClick={handleBack}>← Regresar a la Base</button>
            <div className="card p-8">
                <MissionSubmission
                  token={token}
                  mission={selectedMission}
                  onSubmissionSuccess={async () => {
                    await loadDashboard();
                    setView({ name: "dashboard", missionId: null });
                    toast.success("¡Misión Cumplida!");
                  }}
                  onBack={handleBack}
                />
            </div>
          </div>
        ) : <div className="p-6"><p>Misión no encontrada.</p><button className="btn-back" onClick={handleBack}>Volver</button></div>;

      case "chat":
        return (
          <div className="p-6 max-w-6xl mx-auto h-[85vh]">
            <button className="btn-back mb-4" onClick={handleBack}>← Salir del Canal</button>
            <div className="card h-full p-1 overflow-hidden">
                <ChatRoom roomId={view.missionId || "general"} user={profile} />
            </div>
          </div>
        );
        
      case "survey":
        return selectedMission ? (
            <div className="p-6 max-w-4xl mx-auto">
            <button className="btn-back mb-6" onClick={handleBack}>← Cancelar</button>
            <div className="card p-8">
                <SurveyMission
                mission={selectedMission}
                token={token}
                onBack={handleBack}
                onSuccess={async () => {
                    await loadDashboard();
                    setView({ name: "dashboard", missionId: null });
                    toast.success("Datos Enviados");
                }}
                />
            </div>
            </div>
        ) : null;

      case "createMission":
        return (
            <div className="p-6 max-w-4xl mx-auto">
            <button className="btn-back mb-6" onClick={handleBack}>← Volver</button>
            <div className="card p-8">
                    <MissionForm token={token} onCreated={() => { toast.success("Nueva misión desplegada"); setView({ name: "dashboard" }); }} />
            </div>
            </div>
        );

      case "store":
      case "inventory":
      case "manageMissions":
      case "history":
      case "changePassword":
      case "security":
      case "securityQuestion":
      case "achievements":
          const ComponentMap = {
               store: Store, inventory: Inventory, manageMissions: MissionList, 
               history: MissionHistory, changePassword: ChangePassword, 
               security: Profile2FA, securityQuestion: SecurityQuestionForm, achievements: Achievements
          };
          const ActiveComponent = ComponentMap[view.name];
          
          return (
             <div className="p-6 max-w-5xl mx-auto">
                 <button className="btn-back mb-6" onClick={handleBack}>← Volver al Panel</button>
                 <div className="card p-8">
                     {view.name === "store" ? (
                          <Store token={token} userCoins={profile.coins} onPurchaseSuccess={(coins) => setProfile((prev) => ({ ...prev, coins }))} />
                     ) : view.name === "achievements" ? (
                          <Achievements userId={profile._id} achievements={achievements} />
                     ) : view.name === "security" ? (
                          <Profile2FA token={token} isTwoFAEnabledInitial={profile.isTwoFAEnabled} />
                     ) : (
                          <ActiveComponent token={token} onBack={handleBack} />
                     )}
                 </div>
             </div>
          );

      default:
        return <div className="p-6"><p>Error de sistema: Vista desconocida.</p></div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header flex items-center justify-between p-6">
        {/* A11Y: Título principal de la aplicación. Es un título secundario, el H1 está en la vista principal. */}
        <h2 className="text-2xl font-bold">Panel de Comando</h2> 
        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
      </header>

      {/* Estadísticas */}
      {/* A11Y: Usamos aria-label en lugar de un H2 saltado */}
      <section className="stats-bar grid grid-cols-3 gap-4 p-6 max-w-7xl mx-auto" aria-label="Estadísticas de Jugador: Nivel, Experiencia y Créditos">
        <div className="stat-card level p-4 rounded-lg">
          {/* A11Y: Uso de <h3> para títulos dentro de la sección */}
          <h3 className="sr-only">Nivel</h3>
          Nivel <span>{profile.level}</span>
        </div>
        <div className="stat-card xp p-4 rounded-lg">
          <h3 className="sr-only">Experiencia (XP)</h3>
          XP <span>{profile.xp}</span>
        </div>
        <div className="stat-card coins p-4 rounded-lg">
          <h3 className="sr-only">Créditos</h3>
          Créditos <span>{profile.coins} 🪙</span>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="max-w-7xl mx-auto pb-10" role="main">
        {renderView()}
      </section>

      {/* Popup */}
      {lastPopup && (
        <div role="alert" aria-live="polite">
          <AchievementPopup achievement={lastPopup} onClose={() => setLastPopup(null)} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;