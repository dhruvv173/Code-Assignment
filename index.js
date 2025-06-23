const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const Watcher = require("./watcher");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const watcher = new Watcher("sample.log");

let isLoggingEnabled = true;

watcher.start();

app.use(express.static(path.join(__dirname)));

app.get("/log", (req, res) => {
  console.log("Request received to server index.html");
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("New connection established: " + socket.id);

  const initialData = watcher.getLogs();
  socket.emit("init", initialData);

  watcher.on("process", (logUpdates) => {
    if (isLoggingEnabled) {
      socket.emit("update-log", logUpdates);
    }
  });

  socket.on("stop-logging", () => {
    console.log("Logging stopped");
    isLoggingEnabled = false;
  });

  socket.on("start-logging", () => {
    console.log("Logging resumed");
    isLoggingEnabled = true;
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
