const fs=require('fs');
const path=require('path');
const LOG_FILE = path.join(process.cwd(), "sample.log");

let counter = 1;

setInterval(() => {
  const logLine = `INFO ${counter}: Some event happened`;
  fs.appendFileSync(LOG_FILE, logLine + "\n");
  console.log("Appended:", logLine);
  counter++;
}, 3000);
