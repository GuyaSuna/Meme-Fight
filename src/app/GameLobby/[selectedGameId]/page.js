'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GamePage = ({ params }) => {
  const { selectedGameId } = params;

  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(''); // ID del jugador
  const [isReady, setIsReady] = useState(false); // Estado de estar listo
  const router = useRouter();

  useEffect(() => {
    console.log("Entraste a la sala con ID:", selectedGameId);
    fetchPlayers();
  }, [selectedGameId]);

  // Obtener jugadores de la sala
  const fetchPlayers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/game-players/${selectedGameId}`);
      if (!response.ok) throw new Error("No se pudieron obtener los jugadores.");
      const data = await response.json();
      setPlayers(data.players);
    } catch (error) {
      console.error("Error al obtener jugadores:", error);
    }
  };

  // Unirse a la sala
  const handleJoinGame = async () => {
    try {
      const response = await fetch(`http://localhost:3001/join-game`, {
        method: "POST",
        body: JSON.stringify({ selectedGameId, playerName }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("No se pudo unir al juego.");
      const data = await response.json();
      setPlayerId(data.playerId); // ID asignado al jugador
      console.log("Te uniste al juego");
      fetchPlayers(); // Actualizar lista de jugadores
    } catch (error) {
      console.error("Error al unirse al juego:", error);
    }
  };

  // Marcar al jugador como listo
  const handleReady = async () => {
    try {
      const response = await fetch(`http://localhost:3001/start-game`, {
        method: "POST",
        body: JSON.stringify({ gameId: selectedGameId, playerId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setIsReady(true); // Cambiar estado a listo
      console.log(data.message);
      if (data.message.includes("¡Comienza el juego!")) {
        router.push(`/Game/${selectedGameId}`); // Redirigir al juego
      }
    } catch (error) {
      console.error("Error al marcar listo:", error);
    }
  };

  return (
    <div>
      <h1>Juego: {selectedGameId}</h1>
      <input
        type="text"
        placeholder="Tu Nombre"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        disabled={isReady} // No permitir cambios si ya está listo
      />
      <button onClick={handleJoinGame} disabled={isReady}>
        Unirse al juego
      </button>
      <button onClick={handleReady} disabled={!playerId || isReady}>
        Estoy listo
      </button>
      <div>
        <h2>Jugadores en la sala</h2>
        {players.map((player) => (
          <p key={player.id}>
            {player.username} {player.ready ? "✅" : "❌"}
          </p>
        ))}
      </div>
      <button onClick={() => router.push("/")}>Salir</button>
    </div>
  );
};

export default GamePage;
