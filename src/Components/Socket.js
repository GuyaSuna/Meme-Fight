// socket.js
import { io } from "socket.io-client";

// Crear una instancia global de socket.io
const socket = io("http://localhost:3001");

export default socket;
