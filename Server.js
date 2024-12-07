const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Asegúrate de que esta URL coincida con la de tu cliente
    methods: ["GET", "POST"]
  }
});

let players = [];
let memes = [];
let currentSituation = "";

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Añadir jugador
  socket.on("join-game", (username) => {
    players.push({ id: socket.id, username, score: 0 });
    io.emit("update-players", players);
  });

  // Iniciar juego
  socket.on("start-game", () => {
    console.log("Evento start-game recibido del cliente.");
    currentSituation = "You are stuck on a desert island. How do you survive?";
    io.emit("game-started", currentSituation);
  });

  // Enviar meme
  socket.on("submit-meme", (meme) => {
    memes.push({ id: socket.id, meme });
    io.emit("new-meme", memes);
  });

  // Desconectar
  socket.on("disconnect", () => {
    players = players.filter((player) => player.id !== socket.id);
    io.emit("update-players", players);
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
