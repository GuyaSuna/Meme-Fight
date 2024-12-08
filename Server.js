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

let games = new Map();

app.post("/create-game", (req, res) => {
  const gameId = uuidv4();
  games.set(gameId, { players: [], memes: [], currentSituation: "" });
  res.status(200).json({ gameId });
});

app.get("/games", (req, res) => {
  const gameList = Array.from(games.entries()).map(([gameId, game]) => ({
    gameId,
    players: game.players,
  }));
  res.status(200).json(gameList);
});

app.post("/join-game", (req, res) => {
  const { selectedGameId, playerName } = req.body;

  if (!games.has(selectedGameId)) {
    return res.status(404).json({ error: "La sala no existe." });
  }

  if (!playerName) {
    return res.status(400).json({ error: "El nombre del jugador no puede estar vacío." });
  }

  const game = games.get(selectedGameId);
  const newPlayer = { id: uuidv4(), username: playerName, score: 0, ready: false };
  game.players.push(newPlayer);

  io.to(selectedGameId).emit("update-players", game.players);
  res.status(200).json({ message: "Unido correctamente al juego.", players: game.players });
});

app.post("/start-game", (req, res) => {
  const { gameId, playerId } = req.body;

  if (!games.has(gameId)) {
    return res.status(404).json({ error: "La sala no existe." });
  }

  const game = games.get(gameId);
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "El jugador no existe en la sala." });
  }

  player.ready = true;

  const allReady = game.players.every((p) => p.ready);
  if (allReady) {
    io.to(gameId).emit("game-started", { message: "Todos los jugadores están listos. ¡Comienza el juego!" });
    return res.status(200).json({ message: "Todos los jugadores están listos. ¡Comienza el juego!" });
  }

  res.status(200).json({ message: "Esperando a que todos los jugadores estén listos." });
});

app.get("/game-players/:gameId", (req, res) => {
  const { gameId } = req.params;

  if (!games.has(gameId)) {
    return res.status(404).json({ message: `Sala no encontrada: ${gameId}` });
  }

  const game = games.get(gameId);
  return res.status(200).json({ players: game.players });
});

io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on("join-room", (gameId) => {
    socket.join(gameId);
  });

  socket.on("join-game", ({ selectedGameId, playerName }, callback) => {
    if (!games.has(selectedGameId)) {
      callback({ error: "La sala no existe." });
      return;
    }

    const game = games.get(selectedGameId);

    if (game.players.some((p) => p.username === playerName)) {
      callback({ error: "El jugador ya está en la sala." });
      return;
    }

    const newPlayer = { id: socket.id, username: playerName, score: 0, ready: false };
    game.players.push(newPlayer);

    io.to(selectedGameId).emit("update-players", game.players);
    callback({ playerId: newPlayer.id });
  });

  socket.on("player-ready", ({ gameId, playerId }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      player.ready = true;
      io.to(gameId).emit("update-players", game.players);

      const allReady = game.players.every((p) => p.ready);
      if (allReady) {
        io.to(gameId).emit("game-started", { message: "¡Todos los jugadores están listos! ¡Comienza el juego!" });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    for (const [gameId, game] of games.entries()) {
      game.players = game.players.filter((player) => player.id !== socket.id);
      io.to(gameId).emit("update-players", game.players);
    }
  });
});


server.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});
