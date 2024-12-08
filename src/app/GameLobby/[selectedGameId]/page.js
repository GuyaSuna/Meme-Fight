"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const GamePage = ({ params }) => {
  const { selectedGameId } = React.use(params);

  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Unirse a la sala
    socket.emit("join-room", selectedGameId);

    // Obtener jugadores iniciales
    fetchPlayers();
  }, [selectedGameId]);

  useEffect(() => {
    // Escuchar actualizaciones de jugadores
    socket.on("update-players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off("update-players");
    };
  }, []);

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

  const handleJoinGame = async () => {
    try {
      socket.emit("join-game", { selectedGameId, playerName }, (response) => {
        if (response.error) {
          console.error("Error al unirse al juego:", response.error);
        } else {
          setPlayerId(response.playerId);
        }
      });
    } catch (error) {
      console.error("Error al unirse al juego:", error);
    }
  };

  const handleReady = async () => {
    try {
      socket.emit("player-ready", { gameId: selectedGameId, playerId });
      setIsReady(true);
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
        disabled={isReady}
      />
      <button onClick={handleJoinGame} disabled={isReady || !playerName.trim()}>
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
