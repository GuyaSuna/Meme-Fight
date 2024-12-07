'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
  const [gameId, setGameId] = useState(""); 
  const [playerName, setPlayerName] = useState("");
  const [games, setGames] = useState([]);
  const router = useRouter();

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
    router.push(`/game/${selectedGameId}`); 
  };

  return (
    <div>
      <button onClick={handleCreateGame}>Crear Sala</button>
      <button onClick={handleGetGames}>Mostrar Salas</button>

      <div>
        <input
          type="text"
          placeholder="Tu Nombre"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>

      <div>
        <h2>Salas Disponibles</h2>
        {games.map((game) => (
          <div key={game.gameId}>
            <p>ID de la sala: {game.gameId}</p>
            <p>Jugadores: {game.players.length}</p>
            <button onClick={() => handleJoinGame(game.gameId)}>Unirse</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
