'use client'
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/Components/Socket"

const Home = () => {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [games, setGames] = useState([]);
  const router = useRouter();

  useEffect(() => {
    socket.emit("leave-all-games", { playerId: socket.id });

    return () => {
      // Asegurarse de limpiar la conexión cuando el componente se desmonte
      socket.off("update-players");
    };
  }, []);

  const handleCreateGame = async () => {
    try {
      const response = await fetch("http://localhost:3001/create-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Error al crear el juego");
      }

      const data = await response.json();
      setGameId(data.gameId);
      console.log("Sala creada con ID:", data.gameId);
    } catch (error) {
      console.error("Error al crear la sala:", error);
    }
  };

  const handleGetGames = async () => {
    try {
      const response = await fetch("http://localhost:3001/games");
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error("Error al obtener las salas:", error);
    }
  };

  const handleJoinGame = (selectedGameId) => {
    setGameId(selectedGameId);
    router.push(`/GameLobby/${selectedGameId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold mb-6">Inicio</h1>
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleCreateGame}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Crear Sala
        </button>
        <button
          onClick={handleGetGames}
          className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Mostrar Salas
        </button>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Salas Disponibles</h2>
        {games.length === 0 ? (
          <p className="text-gray-400">No hay salas disponibles.</p>
        ) : (
          games.map((game) => (
            <div
              key={game.gameId}
              className="mb-4 p-4 bg-gray-700 rounded-lg flex justify-between items-center"
            >
              <div>
                <p>ID de la sala: {game.gameId}</p>
                <p>Jugadores: {game.players.length}</p>
              </div>
              <button
                onClick={() => handleJoinGame(game.gameId)}
                className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Unirse
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
