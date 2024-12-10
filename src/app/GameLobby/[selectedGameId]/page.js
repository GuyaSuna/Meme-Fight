'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/Components/Socket";

const GamePage = ({ params }) => {
  const { selectedGameId } = React.use(params); 
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [situation, setSituation] = useState("");
  const [memeUrl, setMemeUrl] = useState("");
  const [memes, setMemes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [roundMemes, setRoundMemes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    socket.emit("join-room", selectedGameId);

    socket.on("update-players", (updatedPlayers) => setPlayers(updatedPlayers));

    socket.on("update-time", ({ timeRemaining, serverTimestamp }) => {
      if (typeof timeRemaining !== "number") {
        console.error("Se esperaba un número en timeRemaining, pero se recibió:", timeRemaining);
        return;
      }
      const delay = (Date.now() - serverTimestamp) / 1000; // Ajusta por el retraso
      setTimeLeft(Math.max(0, timeRemaining - Math.floor(delay))); // Evita valores negativos
    });

    socket.on("game-start", ({ situation, timeRemaining }) => {
      if (timeRemaining === undefined) {
        console.error("timeRemaining no definido en game-start:", { situation, timeRemaining });
        return;
      }
      console.log("Situación inicial:", situation, "Tiempo inicial:", timeRemaining);
      setSituation(situation);
      setTimeLeft(timeRemaining);
    });

    return () => {
      handleLeaveGame();
      socket.off("update-players");
      socket.off("game-start");
      socket.off("update-time");
    };
  }, [selectedGameId]);

  useEffect(() => {
    socket.on("round-end", ({ memes }) => {
      console.log("Memes recibidos al finalizar la ronda:", memes); // Depuración
      setRoundMemes(memes);
    });

    socket.on("update-memes", (updatedMemes) => {
      setRoundMemes(updatedMemes);
    });

    return () => {
      socket.off("round-end");
      socket.off("update-memes");
    };
  }, []);

  const handleVoteMeme = (memeUrl) => {
    socket.emit("vote-meme", { gameId: selectedGameId, memeUrl });
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
      setPlayerName("");
      setIsReady(false);
      setPlayers([]);
      router.push("/");
    }
  };

  const handleSubmitMeme = () => {
    setMemes([...memes, memeUrl]);
    setMemeUrl("");
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-gray-100 rounded shadow-lg w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-blue-600">Juego: {selectedGameId}</h1>

      {situation && (
        <div className="p-4 bg-yellow-100 rounded shadow-md w-full">
          <h2 className="text-lg font-semibold">Situación:</h2>
          <p className="text-gray-800">{situation}</p>
        </div>
      )}

      {timeLeft !== null && (
        <div className="p-4 bg-blue-100 rounded shadow-md w-full mt-4">
          <h2 className="text-lg font-semibold">Tiempo restante para la ronda:</h2>
          <p className="text-gray-800 text-2xl">{formatTime(timeLeft)}</p>
        </div>
      )}

      {!playerId && (
        <>
          <input
            type="text"
            placeholder="Tu Nombre"
            className="w-full border border-gray-300 rounded p-3 text-gray-700"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={isReady}
          />
          <button
            onClick={handleJoinGame}
            className="w-full bg-blue-500 text-white py-3 rounded font-medium hover:bg-blue-600 transition disabled:bg-gray-300"
            disabled={isReady || !playerName.trim()}
          >
            Unirse al juego
          </button>
        </>
      )}

      {playerId && !isReady && (
        <button
          onClick={handleReady}
          className="w-full bg-green-500 text-white py-3 rounded font-medium hover:bg-green-600 transition"
        >
          Estoy listo
        </button>
      )}

      {playerId && (
        <>
          <h3 className="font-semibold">Jugadores:</h3>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.username} - {player.ready ? "Listo" : "Esperando"}</li>
            ))}
          </ul>

          <div className="mt-4">
            <h3 className="font-semibold">Enviar Meme:</h3>
            <input
              type="url"
              placeholder="URL del meme"
              className="w-full border border-gray-300 rounded p-3 text-gray-700"
              value={memeUrl}
              onChange={(e) => setMemeUrl(e.target.value)}
            />
            <button
              onClick={handleSubmitMeme}
              className="w-full bg-blue-500 text-white py-3 rounded font-medium hover:bg-blue-600 mt-2"
            >
              Enviar Meme
            </button>
            <div className="mt-4">
              <h4 className="font-semibold">Memes enviados:</h4>
              {memes.map((meme, index) => (
                <img key={index} src={meme} alt={`Meme ${index}`} className="w-24 h-24" />
              ))}
            </div>
          </div>
        </>
      )}
      
      {Array.isArray(roundMemes) && roundMemes.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">Memes de la ronda:</h3>
          <div className="grid grid-cols-2 gap-4">
            {roundMemes.map((meme, index) => (
              <div key={index} className="p-2 border rounded shadow-sm">
                <img
                  src={meme.memeUrl}
                  alt={`Meme ${index}`}
                  className="w-full h-auto rounded"
                />
                <button
                  onClick={() => handleVoteMeme(meme.memeUrl)}
                  className="mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                  Votar
                </button>
                <p className="mt-2 text-sm text-gray-600">
                  Votos: {meme.votes || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
