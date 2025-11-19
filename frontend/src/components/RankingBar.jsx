import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./RankingBar.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RankingBar = ({ ranking = [], currentUser }) => {
  const chartRef = useRef(null);
  const [gradients, setGradients] = useState([]);

  // Ordenar por nivel y XP descendente
  const sortedRanking = [...ranking].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  const chartHeight = Math.max(sortedRanking.length * 50, 200); // Altura dinámica

  const neonColors = [
    ["#00ffff", "#0066ff"],
    ["#ff00ff", "#ff0066"],
    ["#00ff99", "#00cc66"],
    ["#ffff00", "#ffaa00"],
    ["#ff6600", "#ff0000"],
    ["#9900ff", "#6600ff"],
  ];

  useEffect(() => {
    const canvas = chartRef.current?.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newGradients = sortedRanking.map((_, i) => {
      const gradient = ctx.createLinearGradient(0, 0, 400, 0);
      gradient.addColorStop(0, neonColors[i % neonColors.length][0]);
      gradient.addColorStop(1, neonColors[i % neonColors.length][1]);
      return gradient;
    });

    setGradients(newGradients);
  }, [sortedRanking]);

  const labels = sortedRanking.map((r, i) => {
    const position = i + 1;
    const name = r.username?.trim() ? r.username : `Jugador ${position}`;
    let medal = "";
    if (i === 0) medal = "🥇";
    else if (i === 1) medal = "🥈";
    else if (i === 2) medal = "🥉";
    else if (i < 5) medal = "🔥";
    return `${position}. ${medal} ${name}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "XP",
        data: sortedRanking.map((r) => Number(r.xp) || 0),
        backgroundColor: sortedRanking.map((r, i) =>
          r.username === currentUser
            ? "rgba(0, 255, 255, 0.9)"
            : gradients[i] || neonColors[i % neonColors.length][0]
        ),
        borderColor: sortedRanking.map((r) =>
          r.username === currentUser ? "#00f7ff" : "#fff"
        ),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    animation: {
      duration: 2000,
      easing: "easeOutElastic",
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const index = ctx.dataIndex;
            const r = sortedRanking[index];
            const position = index + 1;
            const name = r.username?.trim() ? r.username : `Jugador ${position}`;
            return `${position}. ${name} — Nivel ${r.level} — ${r.xp} XP`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#fff", font: { size: 12 } },
        grid: { color: "#333" },
      },
      y: {
        ticks: { color: "#fff", font: { size: 14, weight: "bold" } },
        grid: { color: "#222" },
      },
    },
  };

  return (
    <section
      className="ranking-bar"
      role="region"
      aria-label="Ranking global de jugadores por experiencia"
      tabIndex="0"
    >
      <h3 className="ranking-title" role="heading" aria-level="3">
        🏆 Ranking Galáctico
      </h3>

      <Bar
        key={sortedRanking.length}
        ref={chartRef}
        data={data}
        options={options}
        height={chartHeight}
        aria-hidden="true"
      />

      <ul className="sr-only" aria-label="Lista de jugadores y sus puntos de experiencia">
        {sortedRanking.map((r, i) => (
          <li key={i}>
            {i + 1}. {r.username?.trim() ? r.username : `Jugador ${i + 1}`}: Nivel {r.level}, {r.xp} XP
          </li>
        ))}
      </ul>

      <div className="ranking-keyboard-nav" aria-label="Navegación por teclado del ranking">
        {sortedRanking.map((r, i) => (
          <button
            key={i}
            className="ranking-bar-btn"
            tabIndex="0"
            aria-label={`${i + 1}. ${r.username?.trim() ? r.username : `Jugador ${i + 1}`} — Nivel ${r.level} — ${r.xp} XP`}
            onFocus={() => {
              console.log(`Jugador: ${r.username}, Nivel: ${r.level}, XP: ${r.xp}`);
            }}
          >
            {labels[i]}
          </button>
        ))}
      </div>

      {currentUser && (
        <p className="ranking-position" role="status" aria-live="polite">
          Tu posición actual: #
          {sortedRanking.findIndex((r) => r.username === currentUser) + 1}
        </p>
      )}
    </section>
  );
};

export default RankingBar;
