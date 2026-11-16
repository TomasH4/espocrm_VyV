/**
 * cur_playwright_mcp.mjs
 *
 * Pruebas del módulo Moneda y tasas (CUR) con Microsoft Playwright MCP (@playwright/mcp).
 * Autor: Alejandro Bustamante (VyV 2026-2)
 *
 * Playwright MCP expone el navegador como herramientas para agentes de IA (Model Context Protocol). En lugar de
 * selectores CSS, el agente trabaja sobre el árbol de accesibilidad (browser_snapshot) y referencias [ref=eN].
 * Este cliente actúa como ese agente por JSON-RPC sobre stdio y verifica con la API de EspoCRM.
 *
 * Credenciales: ESPOCRM_URL, ESPOCRM_USER y ESPOCRM_PASS desde el entorno o desde tests_stagehand/.env (ignorado
 * por git). Sin credenciales termina con error; no se simulan resultados.
 * Ejecutar desde la raíz:  node tests_playwright_mcp_alejandro/cur_playwright_mcp.mjs
 * Guarda el resultado y las instantáneas en docs/CUR/ia/.
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const MCP_VERSION = "0.0.84";
const OUT = path.resolve("docs/CUR/ia");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.resolve("tests_stagehand/.env"));

const BASE = process.env.ESPOCRM_URL || "http://localhost:8080";
const USER = process.env.ESPOCRM_USER;
const PASS = process.env.ESPOCRM_PASS;

if (!USER || !PASS) {
  console.error("Faltan ESPOCRM_USER y ESPOCRM_PASS (entorno o tests_stagehand/.env). No se ejecuta nada.");
  process.exit(2);
}

const authHeader = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");
const api = async (method, p, body) => {
  const r = await fetch(`${BASE}/api/v1/${p}`, { method, headers: { "Content-Type": "application/json", Authorization: authHeader }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text();
  try { return { status: r.status, body: t ? JSON.parse(t) : null }; } catch { return { status: r.status, body: t }; }
};

// ─────────────────────────────────────────────────────────────── Cliente MCP (JSON-RPC sobre stdio)

class McpClient {
  constructor() {
    this.id = 1;
    this.pending = new Map();
    this.buffer = "";
  }

  async start() {
    const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
    this.proc = spawn(cmd, ["-y", `@playwright/mcp@${MCP_VERSION}`, "--headless", "--isolated"], { stdio: ["pipe", "pipe", "pipe"], shell: true });
    this.proc.stdout.on("data", (c) => {
      this.buffer += c.toString("utf8");
      let i;
      while ((i = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, i).trim();
        this.buffer = this.buffer.slice(i + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.method && msg.id) {
          this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: msg.method === "roots/list" ? { roots: [] } : {} }) + "\n");
        } else if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        }
      }
    });
    const init = await this.request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "cur-vyv-mcp", version: "1.0.0" } }, 120000);
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n");
    return init;
  }

  request(method, params = {}, timeout = 30000) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`MCP timeout en ${method}`));
      }, timeout);
    });
  }

  async tool(name, args = {}) {
    const r = await this.request("tools/call", { name, arguments: args });
    const text = (r.content || []).map((c) => c.text || "").join("\n");
    if (r.isError) throw new Error(`${name}: ${text.slice(0, 300)}`);
    return text;
  }

  close() {
    try { this.proc.kill(); } catch { /* nada */ }
  }
}

/** Busca en la instantánea de accesibilidad la referencia del primer nodo que cumpla el patrón. */
function ref(snapshot, pattern, { last = false } = {}) {
  const lines = snapshot.split("\n").filter((l) => pattern.test(l) && /\[ref=e\d+\]/.test(l));
  const line = last ? lines[lines.length - 1] : lines[0];
  if (!line) throw new Error(`No se encontró en el árbol de accesibilidad: ${pattern}`);
  // @playwright/mcp 0.0.84 identifica el elemento con «target» (la referencia [ref=eN] del árbol).
  return { target: line.match(/\[ref=(e\d+)\]/)[1], element: line.trim().slice(0, 80) };
}

const assert = (c, m) => { if (!c) throw new Error(`Aserción fallida: ${m}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────── Escenarios

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const results = [];
  const client = new McpClient();

  const run = async (name, fn) => {
    const t0 = Date.now();
    try {
      const detalle = await fn();
      results.push({ name, passed: true, durationMs: Date.now() - t0, detalle });
      console.log(`  ✔ ${name}`);
    } catch (e) {
      results.push({ name, passed: false, durationMs: Date.now() - t0, error: e.message });
      console.log(`  ✖ ${name}: ${e.message}`);
    }
  };

  assert((await api("PUT", "CurrencyRate", { COP: 0.00025 })).status === 200, "fijar la tasa de COP");
  const init = await client.start();
  console.log(`Playwright MCP ${init.serverInfo?.name} ${init.serverInfo?.version}`);

  try {
    await run("MCP-CUR-01 El servidor expone las herramientas de navegador para agentes", async () => {
      const { tools } = await client.request("tools/list");
      const names = tools.map((t) => t.name);
      for (const t of ["browser_navigate", "browser_snapshot", "browser_click", "browser_type", "browser_evaluate"]) assert(names.includes(t), `falta ${t}`);
      return { herramientas: names.length };
    });

    await run("MCP-CUR-02 Iniciar sesión usando solo el árbol de accesibilidad", async () => {
      await client.tool("browser_navigate", { url: BASE });
      await client.tool("browser_wait_for", { time: 3 });
      const snap = await client.tool("browser_snapshot");
      fs.writeFileSync(path.join(OUT, "mcp-snapshot-login.txt"), snap);
      const u = ref(snap, /textbox.*(Username|User)/i);
      const p = ref(snap, /textbox.*Password/i);
      await client.tool("browser_type", { ...u, text: USER });
      await client.tool("browser_type", { ...p, text: PASS, submit: true });
      await client.tool("browser_wait_for", { time: 4 });
      const after = await client.tool("browser_snapshot");
      assert(!/textbox.*Password/i.test(after), "sigue en la pantalla de inicio de sesión");
      return { usuario: "(desde .env)" };
    });

    await run("MCP-CUR-03 CUR-F1: convertir 100 USD a COP en el Formula Sandbox y leer el Output", async () => {
      await client.tool("browser_navigate", { url: `${BASE}/#Admin/formulaSandbox` });
      await client.tool("browser_wait_for", { time: 4 });
      await client.tool("browser_evaluate", {
        function: "() => { const el = document.querySelector('.field[data-name=\"script\"] .ace_editor'); el.env.editor.setValue(\"output\\\\print(ext\\\\currency\\\\convert(100, 'USD', 'COP'));\", 1); return true; }",
      });
      const snap = await client.tool("browser_snapshot");
      const run = ref(snap, /button "Run"/);
      await client.tool("browser_click", run);
      await client.tool("browser_wait_for", { text: "400000" });
      const after = await client.tool("browser_snapshot");
      fs.writeFileSync(path.join(OUT, "mcp-snapshot-sandbox.txt"), after);
      assert(after.includes("400000.00000000000000"), "el árbol debería contener 400000.00000000000000");
      return { output: "400000.00000000000000" };
    });

    await run("MCP-CUR-04 CUR-F3: el árbol de accesibilidad del formulario Campaign expone los campos sin nombre (A11Y-CUR-01)", async () => {
      await client.tool("browser_navigate", { url: `${BASE}/#Campaign/create` });
      await client.tool("browser_wait_for", { time: 4 });
      const snap = await client.tool("browser_snapshot");
      fs.writeFileSync(path.join(OUT, "mcp-snapshot-campaign.txt"), snap);
      const textboxes = snap.split("\n").filter((l) => /^\s*- textbox/.test(l));
      const sinNombre = textboxes.filter((l) => /^\s*- textbox \[ref=/.test(l) || /^\s*- textbox ""/.test(l));
      assert(textboxes.length > 0, "debería haber cuadros de texto");
      // Confirma con una herramienta distinta lo que axe encontró: un agente no puede saber cuál es «Budget».
      assert(sinNombre.length > 0, "se esperaban cuadros de texto sin nombre accesible");
      return { cuadrosDeTexto: textboxes.length, sinNombreAccesible: sinNombre.length };
    });

    await run("MCP-CUR-05 CUR-F5: una tasa negativa no se guarda (acción por referencia y oráculo de la API)", async () => {
      const list = await api("GET", "CurrencyRecord?maxSize=50");
      const cop = list.body.list.find((x) => x.code === "COP");
      const q = `CurrencyRecordRate?maxSize=200&where[0][type]=equals&where[0][attribute]=recordId&where[0][value]=${cop.id}`;
      const antes = (await api("GET", q)).body.total;
      await client.tool("browser_navigate", { url: `${BASE}/#CurrencyRecord/view/${cop.id}` });
      await client.tool("browser_wait_for", { time: 4 });
      await client.tool("browser_evaluate", { function: "() => { document.querySelector('.panel[data-name=\"rates\"] [data-action=\"createRelated\"]').click(); return true; }" });
      await client.tool("browser_wait_for", { time: 2 });
      const snap = await client.tool("browser_snapshot");
      // Dentro del diálogo, el campo Rate es el último cuadro de texto (antes está la fecha). Se teclea de verdad
      // (slowly) porque la máscara AutoNumeric ignora un valor asignado por script.
      const dialogo = snap.slice(snap.indexOf("- dialog"));
      const rate = ref(dialogo, /textbox/, { last: true });
      await client.tool("browser_type", { ...rate, text: "-1", slowly: true });
      // Con el modal abierto hay dos «Save» (página y diálogo); el del diálogo aparece último en el árbol.
      await client.tool("browser_click", ref(snap, /button "Save"/, { last: true }));
      await client.tool("browser_wait_for", { text: "0.0001", time: 5 });
      const after = await client.tool("browser_snapshot");
      fs.writeFileSync(path.join(OUT, "mcp-snapshot-rate-error.txt"), after);
      const despues = (await api("GET", q)).body.total;
      const aviso = (after.match(/- tooltip[\s\S]*?paragraph[^:]*: ([^\n]+)/) || [])[1] || null;
      assert(aviso && /0\.0001/.test(aviso), `el aviso del árbol debería citar 0.0001 y dice «${aviso}»`);
      assert(despues === antes, `se creó una tasa (${antes} → ${despues})`);
      return { avisoEnArbol: aviso, tasasAntes: antes, tasasDespues: despues };
    });
  } finally {
    client.close();
    await sleep(500);
  }

  const ok = results.every((r) => r.passed);
  fs.writeFileSync(path.join(OUT, "playwright-mcp-resultados.json"), JSON.stringify({ fecha: new Date().toISOString(), mcp: `@playwright/mcp@${MCP_VERSION}`, resultados: results }, null, 2));
  console.log(`\nTotal ${results.length} | Pasan ${results.filter((r) => r.passed).length}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
