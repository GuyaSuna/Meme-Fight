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
  const [situation, setSituation] = useState("");
  const router = useRouter();

  useEffect(() => {
    socket.emit("join-room", selectedGameId);

    fetchPlayers();
    return () => {
      handleLeaveGame();
    };
  }, [selectedGameId]);

  useEffect(() => {
    socket.on("update-players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
  
    socket.on("game-start", ({ situation }) => {
      console.log("Juego iniciado con situación:", situation); // Depuración
      setSituation(situation);
    });
  
    return () => {
      socket.off("update-players");
      socket.off("game-start");
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

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert("Por favor, ingresa un nombre válido.");
      return;
    }

    socket.emit("join-game", { selectedGameId, playerName }, (response) => {
      if (response.error) {
        alert(response.error);
      } else {
        setPlayerId(response.playerId);
      }
    });
  };

  const handleReady = () => {
    socket.emit("player-ready", { gameId: selectedGameId, playerId });
    setIsReady(true);
  };

  const handleLeaveGame = () => {
    if (playerId) {
      socket.emit("leave-game", { gameId: selectedGameId, playerId });
      setPlayerId("");
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <h1 className="text-2xl font-bold">Juego: {selectedGameId}</h1>
      {situation && <p className="text-lg font-semibold">Situación: {situation}</p>}
      <input
        type="text"
        placeholder="Tu Nombre"
        className="border rounded p-2"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        disabled={!!playerId || isReady}
      />
      <button
        onClick={handleJoinGame}
        className="bg-blue-500 text-white py-2 px-4 rounded"
        disabled={!!playerId || isReady || !playerName.trim()}
      >
        Unirse al juego
      </button>
      <button
        onClick={handleReady}
        className="bg-green-500 text-white py-2 px-4 rounded"
        disabled={!playerId || isReady}
      >
        Estoy listo
      </button>
      <div className="w-full">
        <h2 className="text-xl font-semibold">Jugadores en la sala</h2>
        {players.map((player) => (
          <p key={player.id} className="py-1">
            {player.username} {player.ready ? "✅" : "❌"}
          </p>
        ))}
      </div>
      <button onClick={handleLeaveGame} className="bg-red-500 text-white py-2 px-4 rounded">
        Salir
      </button>
    </div>
  );
};

export default GamePage;
