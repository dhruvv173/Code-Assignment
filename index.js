const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const Watcher = require("./watcher");

const app = express();
const server = http.createServer(app);     // HTTP server to be used with WebSocket
const io = socketIo(server);               // WebSocket server using socket.io
const watcher = new Watcher("sample.log"); // Log file watcher instance

let isLoggingEnabled = true; // Controls whether log updates are sent to client

/**
 * Starts watching the target log file.
 * Emits events when new lines are appended.
 */
watcher.start();

/**
 * Serves static files (like index.html) from the current directory.
 */
app.use(express.static(path.join(__dirname)));

/**
 * Route to serve the log viewer page.
 * Responds with index.html when `/log` is accessed.
 */
app.get("/log", (req, res) => {
  console.log("Request received to server index.html");
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * WebSocket connection handler.
 * - Sends initial logs to new clients.
 * - Streams live updates from the file.
 * - Handles client commands to start/stop log streaming.
 */
io.on("connection", (socket) => {
  console.log("New connection established: " + socket.id);

  // Send last N lines of logs to client on initial connection
  const initialData = watcher.getLogs();
  socket.emit("init", initialData);

  /**
   * Listens for new log lines from the watcher.
   * Emits updates to the connected socket if logging is enabled.
   */
  watcher.on("process", (logUpdates) => {
    if (isLoggingEnabled) {
      socket.emit("update-log", logUpdates);
    }
  });

  /**
   * Stops sending log updates to the client.
   */
  socket.on("stop-logging", () => {
    console.log("Logging stopped");
    isLoggingEnabled = false;
  });

  /**
   * Resumes sending log updates to the client.
   */
  socket.on("start-logging", () => {
    console.log("Logging resumed");
    isLoggingEnabled = true;
  });
});

/**
 * Starts the HTTP and WebSocket server on the defined port.
 */
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
