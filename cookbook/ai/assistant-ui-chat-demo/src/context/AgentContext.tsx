import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { createContext, useContext, useEffect, useRef, useState, type FC, type ReactNode } from "react";
import type { AgentEvent, PermissionMode } from "../server/cortexAgent";
import type { ThreadHistoryAdapter } from "@assistant-ui/react";

export type PermissionState =
  | { status: "pending"; id: string; toolName: string }
  | { status: "allowed" }
  | { status: "denied" };

type PermissionMap = Record<string, PermissionState | undefined>;

type AgentContextValue = {
  permissions: PermissionMap;
  progress: string;
  planMode: boolean;
  setPlanMode: (v: boolean) => void;
};

const AgentContext = createContext<AgentContextValue>({
  permissions: {}, progress: "", planMode: false, setPlanMode: () => {},
});

export const usePermission = (id: string) => useContext(AgentContext).permissions[id];
export const useProgress = () => useContext(AgentContext).progress;
export function usePlanMode(): [boolean, (v: boolean) => void] {
  const { planMode, setPlanMode } = useContext(AgentContext);
  return [planMode, setPlanMode];
}

export async function respondPermission(id: string, allow: boolean) {
  await fetch(`/api/permission/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allow }),
  });
}

// --- SSE parser ---
async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<AgentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const dataLine = chunk.split("\n").find(l => l.startsWith("data: "));
      if (!dataLine) continue;
      const json = dataLine.slice(6).trim();
      if (json === "[DONE]") return;
      try { yield JSON.parse(json) as AgentEvent; } catch { /* skip */ }
    }
  }
}

// --- Adapter ---

function lastUserText(messages: readonly ThreadMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    return m.content.map((p) => (p.type === "text" ? p.text : "")).join("");
  }
  return "";
}

type ToolPart = {
  type: "tool-call"; toolCallId: string; toolName: string;
  argsText: string; args: Record<string, unknown>; result?: string;
};

// Permission-request can arrive before or after tool-start.
// We match by toolName, handling both orderings.
type BufferedPerm = { permId: string; toolName: string };

function createAdapter(
  setPermissions: React.Dispatch<React.SetStateAction<PermissionMap>>,
  setProgress: React.Dispatch<React.SetStateAction<string>>,
  getPlanMode: () => boolean,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const prompt = lastUserText(messages);
      const permissionMode: PermissionMode = getPlanMode() ? "plan" : "default";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, permissionMode }),
        signal: abortSignal,
      });

      if (!response.ok || !response.body) throw new Error(`chat request failed: ${response.status}`);

      let text = "";
      const toolCalls = new Map<string, ToolPart>();
      const toolOrder: string[] = [];
      // permByToolName: buffered when permission-request arrives before tool-start
      const permByToolName = new Map<string, BufferedPerm>();
      // permByToolCallId: toolCallId → permId (for resolving permission-resolved)
      const permToCallId = new Map<string, string>(); // permId → toolCallId

      const buildContent = () => {
        const parts: (ToolPart | { type: "text"; text: string })[] = [];
        for (const id of toolOrder) parts.push(toolCalls.get(id)!);
        if (text) parts.push({ type: "text", text });
        return parts;
      };

      for await (const event of parseSSE(response.body)) {
        if (event.type === "text-delta") {
          text += (text ? "\n\n" : "") + event.text;
          yield { content: buildContent() as never };

        } else if (event.type === "tool-start") {
            console.log("[agent] tool-start id=", event.id, "name=", event.name);
          toolCalls.set(event.id, {
            type: "tool-call", toolCallId: event.id, toolName: event.name,
            argsText: "", args: {},
          });
          toolOrder.push(event.id);
          // Apply buffered permission if one arrived before this tool-start
          // Match buffered permission by name OR take the first buffered (tools are sequential)
          const buffered = permByToolName.get(event.name) ?? permByToolName.values().next().value;
          if (buffered) {
            // Delete by whichever key was matched
            const bufferedKey = permByToolName.has(event.name) ? event.name : [...permByToolName.keys()][0];
            if (bufferedKey) permByToolName.delete(bufferedKey);
            permToCallId.set(buffered.permId, event.id);
            setPermissions(prev => ({
              ...prev,
              [event.id]: { status: "pending", id: buffered.permId, toolName: buffered.toolName },
            }));
          }
          yield { content: buildContent() as never };

        } else if (event.type === "tool-args-text") {
          const call = toolCalls.get(event.id);
          if (call) { call.argsText = event.argsText; yield { content: buildContent() as never }; }

        } else if (event.type === "tool-use") {
          const existing = toolCalls.get(event.id);
          if (existing) {
            existing.args = event.input;
            existing.argsText = JSON.stringify(event.input);
          } else {
            toolCalls.set(event.id, {
              type: "tool-call", toolCallId: event.id, toolName: event.name,
              argsText: JSON.stringify(event.input), args: event.input,
            });
            toolOrder.push(event.id);
          }
          // Apply buffered permission (handles case when no tool-start fires, e.g. without includePartialMessages)
          if (!permToCallId.has(event.id)) {
            const bufferedKey = permByToolName.has(event.name)
              ? event.name
              : [...permByToolName.keys()][0];
            const buffered = bufferedKey ? permByToolName.get(bufferedKey) : undefined;
            if (buffered) {
              permByToolName.delete(bufferedKey!);
              permToCallId.set(buffered.permId, event.id);
              setPermissions(prev => ({
                ...prev,
                [event.id]: { status: "pending", id: buffered.permId, toolName: buffered.toolName },
              }));
            }
          }
          yield { content: buildContent() as never };

        } else if (event.type === "tool-result") {
          const call = toolCalls.get(event.tool_use_id);
          if (call) call.result = event.content;
          yield { content: buildContent() as never };

        } else if (event.type === "permission-request") {
            console.log("[agent] permission-request id=", event.id, "tool=", event.toolName, "toolOrder=", [...toolOrder]);
          // Try to match to an existing tool card by toolName
          const matchedId = [...toolOrder].reverse()
            .find(id =>
              (id === event.id || toolCalls.get(id)?.toolName === event.toolName) &&
              !permToCallId.has(event.id)
            );

          if (matchedId) {
            permToCallId.set(event.id, matchedId);
            setPermissions(prev => ({
              ...prev,
              [matchedId]: { status: "pending", id: event.id, toolName: event.toolName },
            }));
          } else {
            // Buffer for when tool-start arrives
            permByToolName.set(event.toolName, { permId: event.id, toolName: event.toolName });
          }
          yield { content: buildContent() as never };

        } else if (event.type === "permission-resolved") {
            console.log("[agent] permission-resolved id=", event.id, "allowed=", event.allowed, "toolCallId=", permToCallId.get(event.id));
          const toolCallId = permToCallId.get(event.id);
          if (toolCallId) {
            setPermissions(prev => ({
              ...prev,
              [toolCallId]: { status: event.allowed ? "allowed" : "denied" },
            }));
          }
          yield { content: buildContent() as never };

        } else if (event.type === "progress") {
          setProgress(event.text);

        } else if (event.type === "error") {
          text = (text ? text + "\n\n" : "") + `⚠ ${event.message}`;
          yield { content: buildContent() as never };
          throw new Error(event.message);
        }
      }
    },
  };
}

// --- Session-scoped history adapter ---
function makeHistoryAdapter(sessionId: string): ThreadHistoryAdapter {
  return {
    async load() {
      try {
        const res = await fetch(`/api/conversation/${sessionId}`);
        if (!res.ok) return { messages: [] };
        const data = await res.json();
        // Normalize for assistant-ui: ensure required fields and complete statuses
        const messages = (data.messages ?? []).map((item: any) => {
          const msg = item.message ?? {};
          return {
            parentId: item.parentId ?? null,
            message: {
              createdAt: new Date().toISOString(),
              ...msg,
              // Only keep status if complete — prevents runtime from trying to re-run
              status: msg.status?.type === "complete"
                ? msg.status
                : { type: "complete", reason: "unknown" } as const,
              content: (msg.content ?? []).map((part: any) =>
                part.type === "tool-call"
                  ? { ...part, result: part.result ?? "" }
                  : part
              ),
            },
          };
        });
        return { headId: data.headId ?? null, messages };
      } catch (e) {
        console.warn("[history] load failed:", e);
        return { messages: [] };
      }
    },
    async append(item) {
      try {
        await fetch(`/api/conversation/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      } catch { /* non-fatal */ }
    },
  };
}

export const AgentProvider: FC<{ sessionId: string; children: ReactNode }> = ({ sessionId, children }) => {
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [progress, setProgress] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const planModeRef = useRef(planMode);
  planModeRef.current = planMode;

  const adapterRef = useRef<ChatModelAdapter | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = createAdapter(setPermissions, setProgress, () => planModeRef.current);
  }

  // Memoize history adapter by sessionId — stable reference per session
  const historyAdapter = useRef(makeHistoryAdapter(sessionId));

  const runtime = useLocalRuntime(adapterRef.current, {
    adapters: { history: historyAdapter.current },
  });

  useEffect(() => {
    (window as any).__sendMessage = (text: string) => {
      runtime.thread.append({ role: "user", content: [{ type: "text", text }] });
    };
    return () => { delete (window as any).__sendMessage; };
  }, [runtime]);

  return (
    <AgentContext.Provider value={{ permissions, progress, planMode, setPlanMode }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </AgentContext.Provider>
  );
};
