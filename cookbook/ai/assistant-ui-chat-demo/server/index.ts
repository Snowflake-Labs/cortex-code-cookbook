import express from "express";
import { query, type PermissionResult } from "cortex-code-agent-sdk";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

// Pending permission requests: id → resolve function
const pendingPermissions = new Map<string, (result: PermissionResult) => void>();

app.post("/api/permission/:id", (req, res) => {
  const { id } = req.params;
  const { allow } = req.body as { allow: boolean };
  const resolve = pendingPermissions.get(id);
  if (!resolve) {
    res.status(404).json({ error: "permission request not found or already resolved" });
    return;
  }
  pendingPermissions.delete(id);
  resolve(allow ? { behavior: "allow" } : { behavior: "deny", message: "User denied" });
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt) {
    res.status(400).json({ error: "prompt required" });
    return;
  }

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");

  const write = (event: unknown) => {
    res.write(JSON.stringify(event) + "\n");
  };

  const abort = new AbortController();
  req.on("close", () => abort.abort());

  const q = query({
    prompt,
    options: {
      cwd: process.cwd(),
      connection: process.env.SNOWFLAKE_CONNECTION,
      model: process.env.CORTEX_MODEL,
      abortController: abort,
      extraArgs: { "no-auto-update": null },
      canUseTool: async (toolName, input, context) => {
        const id = randomUUID();
        write({ type: "permission-request", id, toolName, input });

        const result = await new Promise<PermissionResult>((resolve) => {
          pendingPermissions.set(id, resolve);
          context.signal.addEventListener("abort", () => {
            pendingPermissions.delete(id);
            resolve({ behavior: "deny", message: "aborted" });
          });
        });

        write({ type: "permission-resolved", id, allowed: result.behavior === "allow" });
        return result;
      },
    },
  });

  try {
    for await (const event of q) {
      if (event.type === "assistant") {
        for (const block of event.content) {
          if (block.type === "text" && block.text) {
            write({ type: "text-delta", text: block.text });
          } else if (block.type === "tool_use") {
            write({
              type: "tool-use",
              id: block.id,
              name: block.name,
              input: block.input,
            });
          }
        }
      } else if (event.type === "user") {
        for (const block of event.message.content) {
          if (block.type === "tool_result") {
            write({
              type: "tool-result",
              tool_use_id: block.tool_use_id,
              content: typeof block.content === "string" ? block.content : JSON.stringify(block.content),
            });
          }
        }
      }
    }
  } catch (err) {
    write({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    res.end();
  }
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
