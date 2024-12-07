import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Conectado al servidor Socket.IO con ID:", socket.id);
});

export const joinGame = (username) => {
  console.log("Uniéndose con el nombre de usuario:", username);
  socket.emit("join-game", username);
};

export const sendMeme = (memeUrl) => {
    socket.emit("submit-meme", memeUrl);
  };
  
  export const voteMeme = (memeId) => {
    socket.emit("vote-meme", memeId);
  };
export const getSocket = () => socket; 

export default socket;
