import React, { useEffect, useState } from "react";
import "./Store.css";

const Store = ({ token, userRole, onCoinsUpdate, onInventoryUpdate }) => {
  const [rewards, setRewards] = useState([]);
  const [message, setMessage] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    cost: 0,
    currency: "coins",
    type: "cosmetic"
  });

  // URL base desde .env (Vite usa import.meta.env)
  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar ítems al montar
  useEffect(() => {
    const loadRewards = async () => {
      try {
        const res = await fetch(`${API_URL}/api/store/rewards`);
        const data = await res.json();
        if (res.ok) {
          console.log("📦 Recompensas recibidas desde backend:", data);
          setRewards(data);
        } else {
          setMessage(data.msg || "Error al cargar la tienda");
        }
      } catch {
        setMessage("Error al cargar la tienda");
      }
    };
    loadRewards();
  }, [API_URL]);

  // Comprar ítem
  const buyReward = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/store/buy/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.msg);
        // Actualizar monedas/gemas en el HUD
        if (typeof onCoinsUpdate === "function") {
          onCoinsUpdate(data.coins, data.gems);
        }
        // Notificar inventario actualizado si el backend lo devuelve populado
        if (data.purchasedItems && typeof onInventoryUpdate === "function") {
          onInventoryUpdate(data.purchasedItems);
        }
      } else {
        setMessage(data.msg || "Error en la compra");
      }
    } catch {
      setMessage("Error de conexión");
    }
  };

  // Crear ítem (solo admin)
  const createReward = async () => {
    try {
      const res = await fetch(`${API_URL}/api/store/rewards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();

      if (res.ok) {
        setRewards([...rewards, data.item]);
        setMessage("Ítem creado con éxito");
        setNewItem({
          name: "",
          description: "",
          cost: 0,
          currency: "coins",
          type: "cosmetic"
        });
      } else {
        setMessage(data.msg || "Error al crear ítem");
      }
    } catch {
      setMessage("Error de conexión");
    }
  };

  return (
    <div className="store-container">
      <h2>🛒 Tienda de Recompensas</h2>
      {message && <p className="store-message">{message}</p>}

      {/* Vista Admin */}
      {userRole === "admin" && (
        <div className="admin-panel">
          <h3>Crear nueva recompensa</h3>
          <input
            type="text"
            placeholder="Nombre"
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Descripción"
            value={newItem.description}
            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Costo"
            value={newItem.cost}
            onChange={e => setNewItem({ ...newItem, cost: Number(e.target.value) })}
          />
          <select
            value={newItem.currency}
            onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
          >
            <option value="coins">Monedas</option>
            <option value="gems">Gemas</option>
          </select>
          <select
            value={newItem.type}
            onChange={e => setNewItem({ ...newItem, type: e.target.value })}
          >
            <option value="cosmetic">Cosmético</option>
            <option value="boost">Potenciador</option>
            <option value="inventory">Inventario</option>
            <option value="achievement">Logro</option>
          </select>
          <button onClick={createReward}>Crear Ítem</button>
        </div>
      )}

      {/* Vista Estudiante */}
      <div className="store-grid">
        {rewards.length === 0 ? (
          <p>No hay recompensas disponibles</p>
        ) : (
          rewards.map(r => (
            <div key={r._id} className="reward-card neon-card">
              <h3>{r.name}</h3>
              <p>{r.description}</p>
              <span className="reward-cost">
                {r.cost} {r.currency === "coins" ? "🪙" : "💎"}
              </span>
              {userRole !== "admin" && (
                <button onClick={() => buyReward(r._id)} className="btn-buy">
                  Comprar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Store;
