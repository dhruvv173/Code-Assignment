Steps for tail -f command

1) Initialize a node project npm init -y
2) Install dependencies (express, socketio, nodemon)
3) code index.js basic setup ie import express, setup app, setup port and run server
4) code watcher.js, researching on EventEmitter, BufferSize, FS(FileSystem module), Promises Object Oriented appproach 
5) complete index.js with socketio 
6) complete index.html with logic in <script> tag
7) write log-writer.js for automatically adding logs to .log file
8) node log-writer.js in one terminal
9) npm run dev in another terminal
10) go to localhost:3000/log


Steps for Browser Controller APIs

1) Initialize a node project npm init -y
2) Install dependencies (express, nodemon)
3) research about how to run commands from CLI
4) complete browserControllerApi.js & test using below commands
http://localhost:3000/start?browser=brave&url=https://www.youtube.com
http://localhost:3000/start?browser=chrome&url=https://github.com
http://localhost:3000/start?browser=edge&url=https://google.com
