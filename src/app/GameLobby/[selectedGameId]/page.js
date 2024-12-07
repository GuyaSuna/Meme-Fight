'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GamePage = ({ params }) => {
  const { gameId } = params;
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  useEffect(() => {
    console.log("Entraste a la sala con ID:", gameId);
  }, [gameId]);

  const handleJoinGame = async () => {
    try {
      await fetch(`http://localhost:3001/join-game`, {
        method: "POST",
        body: JSON.stringify({ gameId, playerName }),
        headers: { "Content-Type": "application/json" },
      });
      console.log("Te uniste al juego");
    } catch (error) {
      console.error("Error al unirse al juego:", error);
    }
  };

  return (
    <div>
      <h1>Juego: {gameId}</h1>
      <input
        type="text"
        placeholder="Tu Nombre"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button onClick={handleJoinGame}>Unirse al juego</button>
      <div>
        <h2>Jugadores en la sala</h2>
        {players.map((player) => (
          <p key={player.id}>{player.username}</p>
        ))}
      </div>
      <button onClick={() => router.push("/")}>Salir</button>
    </div>
  );
};

export default GamePage;
