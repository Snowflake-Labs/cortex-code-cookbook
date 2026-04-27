import { query, type PermissionResult, type PermissionMode } from "cortex-code-agent-sdk";

export type AgentEvent =
  | { type: "text-delta"; text: string }
  | { type: "tool-start"; id: string; name: string }
  | { type: "tool-args-text"; id: string; argsText: string }   // batched replacement, not append
  | { type: "tool-use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool-result"; tool_use_id: string; content: string }
  | { type: "permission-request"; id: string; toolName: string; input: Record<string, unknown> }
  | { type: "permission-resolved"; id: string; allowed: boolean }
  | { type: "progress"; text: string }
  | { type: "error"; message: string };

export type { PermissionResult, PermissionMode };

const stripAnsi = (s: string) => s.replace(/\x1b\[[^m]*m/g, "");
const MAX_ARGS_DISPLAY = 400; // truncate argsText shown while streaming

export async function runAgent(
  prompt: string,
  pendingPermissions: Map<string, (result: PermissionResult) => void>,
  write: (event: AgentEvent) => void,
  signal: AbortSignal,
  permissionMode: PermissionMode = "default",
): Promise<void> {
  const abort = new AbortController();
  signal.addEventListener("abort", () => abort.abort(), { once: true });

  const pendingToolIds: string[] = [];

  // Delta streaming state
  const indexToId = new Map<number, string>();       // stream index → tool id
  const argAccum = new Map<string, string>();         // tool id → accumulated partial json
  const argTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function scheduleArgFlush(id: string) {
    if (argTimers.has(id)) return;
    argTimers.set(id, setTimeout(() => {
      argTimers.delete(id);
      const raw = argAccum.get(id) ?? "";
      const argsText = raw.length > MAX_ARGS_DISPLAY
        ? raw.slice(0, MAX_ARGS_DISPLAY) + "…"
        : raw;
      write({ type: "tool-args-text", id, argsText });
    }, 60)); // ~60ms debounce — reduces writes ~10x
  }

  const q = query({
    prompt,
    options: {
      cwd: process.cwd(),
      connection: process.env.SNOWFLAKE_CONNECTION,
      model: process.env.CORTEX_MODEL,
      abortController: abort,
      // includePartialMessages: true,
      permissionMode,
      extraArgs: { "no-auto-update": null },
      canUseTool: async (toolName, input, context) => {
        // Flush any pending delta before asking permission
        for (const [id, timer] of argTimers) {
          clearTimeout(timer);
          argTimers.delete(id);
          const raw = argAccum.get(id) ?? "";
          const argsText = raw.length > MAX_ARGS_DISPLAY ? raw.slice(0, MAX_ARGS_DISPLAY) + "…" : raw;
          write({ type: "tool-args-text", id, argsText });
        }

        const blockId = pendingToolIds.shift() ?? context.toolUseID;
        write({ type: "permission-request", id: blockId, toolName, input });

        const result = await new Promise<PermissionResult>((resolve) => {
          pendingPermissions.set(blockId, resolve);
          context.signal.addEventListener("abort", () => {
            if (pendingPermissions.has(blockId)) {
              pendingPermissions.delete(blockId);
              resolve({ behavior: "deny", message: "aborted" });
            }
          });
        });

        write({ type: "permission-resolved", id: blockId, allowed: result.behavior === "allow" });
        return result;
      },
    },
  });

  for await (const event of q) {
    if (event.type === "stream_event") {
      const e = event.event as Record<string, unknown>;
      const idx = e.index as number | undefined;

      if (e.type === "content_block_start") {
        const block = e.content_block as Record<string, unknown> | undefined;
        if (block?.type === "tool_use") {
          const id = block.id as string;
          pendingToolIds.push(id);
          if (idx !== undefined) indexToId.set(idx, id);
          argAccum.set(id, "");
          write({ type: "tool-start", id, name: block.name as string });
        }
      }

      if (e.type === "content_block_delta" && idx !== undefined) {
        const delta = e.delta as Record<string, unknown> | undefined;
        if (delta?.type === "input_json_delta") {
          const id = indexToId.get(idx);
          if (id) {
            argAccum.set(id, (argAccum.get(id) ?? "") + (delta.partial_json as string));
            scheduleArgFlush(id);
          }
        }
      }

    } else if (event.type === "assistant") {
      for (const block of event.content) {
        if (block.type === "text" && block.text) {
          write({ type: "text-delta", text: block.text });
        } else if (block.type === "thinking" && block.thinking) {
          const firstLine = block.thinking.split("\n")[0].trim();
          if (firstLine) write({ type: "progress", text: firstLine });
        } else if (block.type === "tool_use") {
          pendingToolIds.push(block.id); // queue for canUseTool which fires after this event
          write({ type: "tool-use", id: block.id, name: block.name, input: block.input });
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
    } else if (event.type === "stderr") {
      const text = stripAnsi(event.data.trim());
      if (text) write({ type: "progress", text });
    }
  }
}
