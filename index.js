const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

server.listen(5000, () => {
  console.log(`Server is running on port 5000`);
});
require('./src/game/game.socket')(io);
