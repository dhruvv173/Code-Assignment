const events = require('events');
const fs = require('fs');

// Number of trailing lines to keep in memory
const TRAILING_LINES = 10;
// Buffer size for reading the file
const BUFFER_SIZE = 8192;
const buffer = Buffer.alloc(BUFFER_SIZE);

class Watcher extends events.EventEmitter {
    constructor(watchFile) {
        super();
        this.watchFile = watchFile;  // File to be watched
        this.store = [];             // Holds the last N lines
        this.fileDescriptor = null;  // File descriptor for reading
    }

    // Initializes the watcher by reading the last TRAILING_LINES from file
    async init() {
        this.store = [];
        return new Promise((resolve, reject) => {
            fs.stat(this.watchFile, (err, stats) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        console.error("File not found. Please check the file path.");
                        return resolve([]); // File does not exist yet
                    }
                    return reject(err); // Other file error
                }

                const fileSize = stats.size;

                fs.open(this.watchFile, 'r', (err, fd) => {
                    if (err) return reject(err);
                    this.fileDescriptor = fd;

                    if (fileSize === 0) return resolve([]); // Empty file

                    const startPos = Math.max(0, fileSize - BUFFER_SIZE);
                    fs.read(fd, buffer, 0, BUFFER_SIZE, startPos, (err, bytesRead) => {
                        if (err) {
                            console.error("Error in reading file", err);
                            return reject(err);
                        }

                        const data = buffer.slice(0, bytesRead).toString();
                        const logs = data.split('\n').filter(Boolean); // Filter out empty lines
                        this.store = logs.slice(-TRAILING_LINES);     // Keep last N lines
                        resolve(this.store);
                    });
                });
            });
        });
    }

    // Returns the last N lines stored in memory
    getLogs() {
        return this.store;
    }

    // Called whenever the file changes
    watch(curr, prev) {
        // Skip if file is truncated or unchanged
        if (curr.size <= prev.size) return;

        const offset = prev.size;
        const newSize = curr.size - prev.size;
        const watcher = this;

        fs.read(this.fileDescriptor, buffer, 0, Math.min(BUFFER_SIZE, newSize), offset, (err, bytesRead) => {
            if (err) throw err;

            const data = buffer.slice(0, bytesRead).toString();
            const logs = data.split('\n').filter(Boolean);

            // Update store with new logs, keeping only the last TRAILING_LINES
            logs.forEach(log => {
                if (watcher.store.length >= TRAILING_LINES) {
                    watcher.store.shift();
                }
                watcher.store.push(log);
            });

            // Emit an event with the new logs
            watcher.emit('process', logs);
        });
    }

    // Starts watching the file for changes
    start() {
        const watcher = this;
        this.init()
            .then(() => {
                fs.watchFile(this.watchFile, { interval: 1000 }, (curr, prev) => {
                    watcher.watch(curr, prev); // Trigger on file change
                });
            })
            .catch(err => {
                console.error("Error initializing watcher: ", err);
            });
    }
}

module.exports = Watcher;
