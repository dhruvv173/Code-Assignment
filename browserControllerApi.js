import express from "express";
import { exec } from "child_process";
import { promisify } from "util";

const app = express();
const PORT = 3000;
const execAsync = promisify(exec);

const BROWSERS = {
  chrome: "chrome",
  edge: "msedge",
  brave: "brave",
};

app.get("/start", (req, res) => {
  const { browser, url } = req.query;
  if (!browser || !url) return res.status(400).send("Missing browser or url");

  const exe = BROWSERS[browser.toLocaleLowerCase()];
  if (!exe) return res.status(400).send("Browser not supported");

  const command = `start ${exe} "${url}"`;

  exec(command, (err) => {
    if (err) {
      console.error("Error starting browser:", err);
      return res.status(500).send("Failed to start browser");
    }
    res.send(`Started ${browser} with URL ${url}`);
  });
});

app.get("/stop", (req, res) => {
  const { browser } = req.query;
  if (!browser) return res.status(400).send("Missing browser");

  const exe = BROWSERS[browser.toLowerCase()];
  if (!exe) return res.status(400).send("Unsupported browser");

  const command = `taskkill /IM ${exe}.exe /F`;

  exec(command, (err, stdout) => {
    if (err) {
      console.error("Error stopping browser:", err);
      return res.status(500).send("Failed to stop browser");
    }
    res.send(`Stopped ${browser}`);
  });
});

app.get("/focus", async (req, res) => {
  const { browser } = req.query;
  const supported = ["brave", "chrome", "firefox"];
  if (!supported.includes(browser?.toLowerCase())) {
    return res.status(400).send("Unsupported browser");
  }

  try {
    const psScriptPath = `"${process.cwd()}\\focus.ps1"`;
    const command = `powershell.exe -ExecutionPolicy Bypass -File ${psScriptPath} ${browser.toLowerCase()}`;
    await execAsync(command);
    res.send(`Focused ${browser} window`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to focus window");
  }
});

app.listen(PORT, () => {
  console.log(`Browser Controller running at http://localhost:${PORT}`);
});
