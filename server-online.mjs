import { createServer } from "node:http";
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const rootDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(rootDir, "data");
const dbFile = join(dataDir, "ecorp-operacional.json");
const maxBodySize = 30 * 1024 * 1024;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

async function isPortAvailable(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}

async function findPort(preferredPort) {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`Nenhuma porta disponivel a partir de ${preferredPort}`);
}

async function readJsonDb() {
  try {
    const content = await readFile(dbFile, "utf8");
    return JSON.parse(content || "{}");
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeJsonDb(data) {
  const tmpFile = `${dbFile}.tmp`;
  await writeFile(tmpFile, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpFile, dbFile);
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxBodySize) {
        rejectBody(new Error("Arquivo/dados maiores que o limite permitido."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", rejectBody);
  });
}

async function serveFile(req, res) {
  const parsedUrl = new URL(req.url || "/", "http://localhost");
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === "/") pathname = "/integracao-preview.html";

  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const fullPath = resolve(rootDir, `.${safePath}`);
  if (!fullPath.startsWith(rootDir)) {
    sendJson(res, 403, { error: "Acesso negado." });
    return;
  }

  try {
    const fileStat = await stat(fullPath);
    if (!fileStat.isFile()) {
      sendJson(res, 404, { error: "Arquivo nao encontrado." });
      return;
    }

    const ext = extname(fullPath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Content-Length": fileStat.size,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300",
    });
    createReadStream(fullPath).pipe(res);
  } catch (error) {
    sendJson(res, 404, { error: "Arquivo nao encontrado." });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    if (req.url === "/api/health" && req.method === "GET") {
      sendJson(res, 200, { ok: true, name: "Sistema ECORP Online" });
      return;
    }

    if (req.url === "/api/operacional" && req.method === "GET") {
      sendJson(res, 200, await readJsonDb());
      return;
    }

    if (req.url === "/api/operacional" && req.method === "PUT") {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      await writeJsonDb(payload);
      sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Metodo nao permitido." });
      return;
    }

    await serveFile(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro interno." });
  }
});

const preferredPort = Number(process.env.PORT || 8765);
const port = await findPort(preferredPort);

server.listen(port, () => {
  console.log(`Sistema ECORP online em http://127.0.0.1:${port}/`);
  console.log(`Banco de dados: ${dbFile}`);
});
