import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import express from "express";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { runAgent, type PermissionResult } from "./src/server/cortexAgent";

const pendingPermissions = new Map<string, (result: PermissionResult) => void>();
const activeAborts = new Set<AbortController>();

// --- Session store ---
const SESSIONS_FILE = path.resolve(__dirname, ".sessions.json");

type HistoryItem = { message: unknown; parentId: string | null; runConfig?: unknown };
type SessionMeta = { id: string; createdAt: string; title?: string };
type SessionStore = { sessions: SessionMeta[]; history: Record<string, HistoryItem[]> };

function loadStore(): SessionStore {
  try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8")); }
  catch { return { sessions: [], history: {} }; }
}

function saveStore(store: SessionStore) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2));
}

let store = loadStore();

function ensureSession(id: string): void {
  if (!store.sessions.find(s => s.id === id)) {
    store.sessions.unshift({ id, createdAt: new Date().toISOString() });
  }
  if (!store.history[id]) store.history[id] = [];
}

function apiMiddleware() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // List sessions
  app.get("/api/sessions", (_req, res) => {
    res.json(store.sessions);
  });

  // Create new session
  app.post("/api/sessions", (_req, res) => {
    const id = randomUUID().slice(0, 8);
    store.sessions.unshift({ id, createdAt: new Date().toISOString() });
    store.history[id] = [];
    saveStore(store);
    res.json({ id });
  });

  // Delete session
  app.delete("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    store.sessions = store.sessions.filter(s => s.id !== id);
    delete store.history[id];
    saveStore(store);
    res.json({ ok: true });
  });

  // Update session title
  app.patch("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const s = store.sessions.find(s => s.id === id);
    if (s) { s.title = req.body.title; saveStore(store); }
    res.json({ ok: true });
  });

  // Get conversation for session
  app.get("/api/conversation/:sessionId", (req, res) => {
    const items = store.history[req.params.sessionId] ?? [];
    const parentIds = new Set(items.map((i: any) => i.parentId).filter(Boolean));
    const headItem = [...items].reverse().find((i: any) => !parentIds.has((i.message as any)?.id));
    const headId = (headItem?.message as any)?.id ?? null;
    res.json({ headId, messages: items });
  });

  // Append message to session
  app.post("/api/conversation/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    ensureSession(sessionId);
    const item = req.body as HistoryItem;
    const msgId = (item.message as any)?.id;
    if (msgId) store.history[sessionId] = store.history[sessionId].filter(i => (i.message as any)?.id !== msgId);
    store.history[sessionId].push(item);

    // Update title from first user message
    const session = store.sessions.find(s => s.id === sessionId);
    if (session && !session.title) {
      const msg = item.message as any;
      if (msg?.role === "user") {
        const text = msg.content?.find((p: any) => p.type === "text")?.text ?? "";
        if (text) session.title = text.slice(0, 60);
      }
    }

    saveStore(store);
    res.json({ ok: true });
  });

  // Clear session history (keep session)
  app.delete("/api/conversation/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    store.history[sessionId] = [];
    saveStore(store);
    res.json({ ok: true });
  });

  // Permission resolution
  app.post("/api/permission/:id", (req, res) => {
    const { id } = req.params;
    const { allow } = req.body as { allow: boolean };
    const resolve = pendingPermissions.get(id);
    if (!resolve) { res.json({ ok: true }); return; }
    pendingPermissions.delete(id);
    resolve(allow ? { behavior: "allow" } : { behavior: "deny", message: "User denied" });
    res.json({ ok: true });
  });

  // Chat SSE stream
  app.post("/api/chat", async (req, res) => {
    const { prompt, permissionMode } = req.body as { prompt?: string; permissionMode?: string };
    if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.socket?.setNoDelay(true);

    const write = (event: unknown) => res.write(`data: ${JSON.stringify(event)}\n\n`);
    const abort = new AbortController();
    activeAborts.add(abort);
    res.on("close", () => { activeAborts.delete(abort); abort.abort(); });

    try {
      await runAgent(prompt, pendingPermissions, write, abort.signal, (permissionMode as any) ?? "default");
    } catch (err) {
      write({ type: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      activeAborts.delete(abort);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });

  return app;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "cortex-api",
      configureServer(server) {
        server.middlewares.use(apiMiddleware());
      },
    },
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5173 },
});
