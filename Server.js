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
let players = [];

app.post("/create-game", (req, res) => {
  const gameId = uuidv4(); 
  games.set(gameId, { players: [], memes: [], currentSituation: "" });
  console.log("Sala creada con ID:", gameId);
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

  const game = games.get(selectedGameId);

  if (!playerName) {
    return res.status(400).json({ error: "El nombre del jugador no puede estar vacío." });
  }

  game.players.push({ id: uuidv4(), username: playerName, score: 0 });

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
  console.log("Solicitud para jugadores de la sala con ID:", gameId);
  
  if (!games.has(gameId)) {
    console.error("Sala no encontrada:", gameId);
    return res.status(404).json({ message: `Sala no encontrada: ${gameId}` });
  }
  
  const game = games.get(gameId);
  console.log("Jugadores encontrados:", game.players);
  return res.status(200).json({ players: game.players });
});




io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on("join-game", (username) => {
    if (!username) {
      socket.emit("error", "El nombre de usuario no puede estar vacío");
      return;
    }
    players.push({ id: socket.id, username, score: 0 });
    io.emit("update-players", players);
  });

  socket.on("start-game", () => {
    console.log("El juego ha comenzado.");
    const situation = "Estás atrapado en una isla desierta. ¿Cómo sobrevives?";
    io.emit("game-started", situation);
  });

  socket.on("join-game", (gameId) => {
    if (!games.has(gameId)) {
      games.set(gameId, { players: [], memes: [], currentSituation: "" });
    }
    const game = games.get(gameId);
    game.players.push({ id: socket.id, username: socket.username || "Anónimo", score: 0 });
    socket.join(gameId);
    io.to(gameId).emit("update-players", game.players);
  });

  socket.on("submit-meme", ({ gameId, meme }) => {
    if (games.has(gameId)) {
      const game = games.get(gameId);
      game.memes.push({ id: socket.id, meme });
      io.to(gameId).emit("new-meme", game.memes);
    }
  });

  socket.on("vote-meme", ({ gameId, memeId }) => {
    const game = games.get(gameId);
    if (!game) return;
    const meme = game.memes.find((m) => m.id === memeId);
    if (meme) {
      meme.votes = (meme.votes || 0) + 1;
      io.to(gameId).emit("new-meme", game.memes);
    }
  });

  socket.on("disconnect", () => {
    players = players.filter((player) => player.id !== socket.id);
    io.emit("update-players", players);
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});
