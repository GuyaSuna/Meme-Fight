const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

let games = {};

app.post("/create-game", (req, res) => {
  const gameId = uuidv4();
  games[gameId] = { players: [], memes: [], currentSituation: "" };
  res.status(200).json({ gameId });
});

app.get("/games", (req, res) => {
  const gameList = Object.entries(games).map(([gameId, game]) => ({
    gameId,
    players: game.players,
  }));
  res.status(200).json(gameList);
});

app.get("/game-players/:gameId", (req, res) => {
  const { gameId } = req.params;

  if (!games[gameId]) {
    return res.status(404).json({ message: `Sala no encontrada: ${gameId}` });
  }

  const game = games[gameId];
  return res.status(200).json({ players: game.players });
});

io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on("join-room", (gameId) => {
    socket.join(gameId);
  });

  socket.on("join-game", ({ selectedGameId, playerName }, callback) => {
    if (!games[selectedGameId]) {
      callback({ error: "La sala no existe." });
      return;
    }

    const game = games[selectedGameId];

    const existingPlayer = game.players.find(
      (p) => p.id === socket.id || p.username === playerName
    );
    if (existingPlayer) {
      callback({ error: "El jugador ya está en la sala." });
      return;
    }

    const newPlayer = { id: socket.id, username: playerName, score: 0, ready: false };
    game.players.push(newPlayer);

    io.to(selectedGameId).emit("update-players", game.players);
    callback({ playerId: newPlayer.id });
  });

  socket.on("player-ready", ({ gameId, playerId }) => {
    const game = games[gameId];
    if (!game) return;
  
    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      player.ready = true;
      io.to(gameId).emit("update-players", game.players);
  
      const allReady = game.players.every((p) => p.ready); 
      if (allReady && game.players.length > 0) {
        const randomSituation = generateRandomSituation();
        game.currentSituation = randomSituation;
        io.to(gameId).emit("game-start", { situation: randomSituation });
        console.log(`Juego ${gameId} iniciado: ${randomSituation}`);
      }
    }
  });

  socket.on("leave-game", ({ gameId, playerId }) => {
    if (!games[gameId]) return;

    const game = games[gameId];
    game.players = game.players.filter((player) => player.id !== playerId);

    io.to(gameId).emit("update-players", game.players);
    console.log(`Jugador ${playerId} salió del juego ${gameId}`);

    if (game.players.length === 0) {
      delete games[gameId]; // Limpiar la sala si no quedan jugadores
    }
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    for (const [gameId, game] of Object.entries(games)) {
      game.players = game.players.filter((player) => player.id !== socket.id);
      io.to(gameId).emit("update-players", game.players);

      if (game.players.length === 0) {
        delete games[gameId];
      }
    }
  });
});

const generateRandomSituation = () => {
  const situations = [
    "Estás perdido en un bosque encantado.",
    "Una tormenta repentina te obliga a refugiarte en una cueva.",
    "Encuentras un cofre con un tesoro misterioso.",
    "Una criatura mágica necesita tu ayuda.",
    "Tienes que resolver un enigma para cruzar un puente.",
  ];

  return situations[Math.floor(Math.random() * situations.length)];
};

server.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});
