'use client';

import React, { useState, useEffect } from "react";
import { joinGame, getSocket } from "@/Services/SocketService";

const GameLobby = () => {
  const [username, setUsername] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [situation, setSituation] = useState("");
  const [playerMeme, setPlayerMeme] = useState("");
  const [memes, setMemes] = useState([]); 
  
  console.log("GameStarted (estado):", gameStarted);
  useEffect(() => {
    const socket = getSocket();
  
    socket.on("connect", () => {
      console.log("Conectado al servidor con ID:", socket.id);
    });
  
    socket.on("update-players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
  
    socket.on("game-started", (newSituation) => {
      console.log("Juego iniciado con la situación:", newSituation);
      setGameStarted(true);
      setSituation(newSituation);
    });
  
    socket.on("new-meme", (updatedMemes) => {
      setMemes(updatedMemes);
    });
  
    return () => {
      socket.off("connect");
      socket.off("update-players");
      socket.off("game-started");
      socket.off("new-meme");
    };
  }, []);
  

  const handleJoin = () => {
    if (!username.trim()) {
      console.error("El nombre de usuario está vacío");
      return;
    }
    console.log(`Uniéndose con el nombre de usuario: ${username}`);
    joinGame(username);
  };

  const handleStartGame = () => {
    const socket = getSocket();
    console.log("Iniciando juego...");
    socket.emit("start-game");
  };

  const handleMemeSubmit = () => {
    const socket = getSocket();
    socket.emit("submit-meme", playerMeme);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleJoin}>Join Game</button>

      {username === "nahuelAdmin" && !gameStarted && (
        <button onClick={handleStartGame}>Start Game</button>
      )}

      {gameStarted && (
        <div>
          <h2>Situation: {situation}</h2>
          <input
            type="text"
            placeholder="Submit your meme"
            value={playerMeme}
            onChange={(e) => setPlayerMeme(e.target.value)}
          />
          <button onClick={handleMemeSubmit}>Submit Meme</button>
        </div>
      )}

      <h2>Memes:</h2>
      <ul>
        {memes.map((meme, index) => (
          <li key={index}>{meme.meme}</li>
        ))}
      </ul>
    </div>
  );
};

export default GameLobby;
