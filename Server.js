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

// Crear una nueva sala de juego
app.post("/create-game", (req, res) => {
  const gameId = uuidv4();
  games[gameId] = { players: [], memes: [], currentSituation: "", timer: null };
  console.log(`[Game ${gameId}] Sala creada.`);
  res.status(200).json({ gameId });
});

// Listar todas las salas disponibles
app.get("/games", (req, res) => {
  const gameList = Object.entries(games).map(([gameId, game]) => ({
    gameId,
    players: game.players,
  }));
  res.status(200).json(gameList);
});

// Obtener los jugadores de una sala específica
app.get("/game-players/:gameId", (req, res) => {
  const { gameId } = req.params;
  if (!games[gameId]) {
    return res.status(404).json({ message: `Sala no encontrada: ${gameId}` });
  }

  const game = games[gameId];
  return res.status(200).json({ players: game.players });
});

// Manejo de eventos de WebSocket
io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  socket.on("join-room", (gameId) => {
    if (!games[gameId]) {
      console.error(`[Game ${gameId}] Sala no encontrada para unirse.`);
      return;
    }
    socket.join(gameId);
    console.log(`[Game ${gameId}] Usuario ${socket.id} unido.`);
  });

  socket.on("join-game", ({ selectedGameId, playerName }, callback) => {
    const game = games[selectedGameId];
    if (!game) {
      callback({ error: "La sala no existe." });
      return;
    }

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
    console.log(`[Game ${selectedGameId}] Jugador agregado: ${playerName}`);
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
        io.to(gameId).emit("game-start", { 
          situation: randomSituation, 
          timeRemaining: 60 
        });

        startRound(gameId);
      }
    }
  });

  socket.on("send-meme", ({ gameId, memeUrl }) => {
    const game = games[gameId];
    if (!game) return;

    game.memes.push({ memeUrl, playerId: socket.id });
    io.to(gameId).emit("update-memes", game.memes);
  });

  socket.on("leave-game", ({ gameId, playerId }) => {
    const game = games[gameId];
    if (!game) return;

    game.players = game.players.filter((p) => p.id !== playerId);
    io.to(gameId).emit("update-players", game.players);
    socket.leave(gameId);
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

const generateRandomSituation = () => {
  const situations = [
    "Estás en una fiesta muy rara.",
    "Estás perdido en el bosque.",
    "Te han contratado como espía.",
    "Estás en una prueba de supervivencia.",
  ];
  return situations[Math.floor(Math.random() * situations.length)];
};

const calculateWinner = (gameId) => {
  const game = games[gameId];
  if (!game) return null;

  return game.players[Math.floor(Math.random() * game.players.length)];
};

const startRound = (gameId) => {
  const game = games[gameId];
  if (!game) {
    console.error(`[Game ${gameId}] No se encontró el juego.`);
    return;
  }

  let timeRemaining = 60;
  console.log(`[Game ${gameId}] Iniciando ronda con ${timeRemaining} segundos.`);

  game.timer = setInterval(() => {
    if (timeRemaining >= 0) {
      const serverTimestamp = Date.now();
      io.to(gameId).emit("update-time", { 
        timeRemaining, 
        serverTimestamp 
      });
      timeRemaining--;
    } else {
      clearInterval(game.timer);
      io.to(gameId).emit("round-end", { winner: calculateWinner(gameId) });
      console.log(`[Game ${gameId}] Fin de la ronda.`);
    }
  }, 1000);
};

server.listen(3001, () => {
  console.log("Servidor iniciado en http://localhost:3001");
});
