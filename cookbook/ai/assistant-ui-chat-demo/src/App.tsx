import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { createContext, useContext, useRef, useState, type FC, type ReactNode } from "react";
import { Thread } from "./thread";
import snowflakeMark from "./assets/snowflake.svg";

function lastUserText(messages: readonly ThreadMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    return m.content
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("");
  }
  return "";
}

type ServerEvent =
  | { type: "text-delta"; text: string }
  | { type: "tool-use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool-result"; tool_use_id: string; content: string }
  | { type: "permission-request"; id: string; toolName: string; input: Record<string, unknown> }
  | { type: "permission-resolved"; id: string; allowed: boolean }
  | { type: "error"; message: string };

// --- Permission context ---

export type PermissionState =
  | { status: "pending"; id: string; toolName: string }
  | { status: "allowed" }
  | { status: "denied" };

type PermissionMap = Record<string, PermissionState | undefined>;

type PermissionContextValue = {
  permissions: PermissionMap;
};

const PermissionContext = createContext<PermissionContextValue>({ permissions: {} });

export function usePermission(toolCallId: string): PermissionState | undefined {
  return useContext(PermissionContext).permissions[toolCallId];
}

export async function respondPermission(id: string, allow: boolean) {
  await fetch(`/api/permission/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allow }),
  });
}

// --- Adapter ---

function createAdapter(
  setPermissions: React.Dispatch<React.SetStateAction<PermissionMap>>,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const prompt = lastUserText(messages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: abortSignal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`chat request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      type ToolPart = { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, unknown>; result?: string };
      const toolCalls = new Map<string, ToolPart>();
      const toolOrder: string[] = [];
      const permToTool = new Map<string, string>();

      const buildContent = () => {
        const parts: (ToolPart | { type: "text"; text: string })[] = [];
        for (const id of toolOrder) parts.push(toolCalls.get(id)!);
        if (text) parts.push({ type: "text", text });
        return parts;
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as ServerEvent;

          if (event.type === "text-delta") {
            text += (text ? "\n\n" : "") + event.text;
            yield { content: buildContent() as never };

          } else if (event.type === "tool-use") {
            toolCalls.set(event.id, {
              type: "tool-call",
              toolCallId: event.id,
              toolName: event.name,
              args: event.input,
            });
            toolOrder.push(event.id);
            yield { content: buildContent() as never };

          } else if (event.type === "tool-result") {
            const call = toolCalls.get(event.tool_use_id);
            if (call) call.result = event.content;
            yield { content: buildContent() as never };

          } else if (event.type === "permission-request") {
            let targetId = toolOrder[toolOrder.length - 1];
            for (let i = toolOrder.length - 1; i >= 0; i--) {
              const id = toolOrder[i];
              setPermissions(prev => {
                if (!prev[id]) targetId = id;
                return prev;
              });
            }
            permToTool.set(event.id, targetId);
            setPermissions(prev => ({
              ...prev,
              [targetId]: { status: "pending", id: event.id, toolName: event.toolName },
            }));
            yield { content: buildContent() as never };

          } else if (event.type === "permission-resolved") {
            const toolId = permToTool.get(event.id);
            if (toolId) {
              setPermissions(prev => ({
                ...prev,
                [toolId]: { status: event.allowed ? "allowed" : "denied" },
              }));
            }
            yield { content: buildContent() as never };

          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    },
  };
}

// --- App ---

const PermissionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const adapterRef = useRef<ChatModelAdapter | null>(null);
  if (!adapterRef.current) adapterRef.current = createAdapter(setPermissions);

  const runtime = useLocalRuntime(adapterRef.current);

  return (
    <PermissionContext.Provider value={{ permissions }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </PermissionContext.Provider>
  );
};

export function App() {
  return (
    <PermissionProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
          }}
        >
          <img src={snowflakeMark} alt="" width={22} height={22} />
          <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Cortex Agent</span>
          <span style={{ color: "var(--fg-muted)", fontSize: "0.8125rem", marginLeft: "auto" }}>
            powered by assistant-ui
          </span>
        </header>
        <main style={{ flex: 1, minHeight: 0 }}>
          <Thread />
        </main>
      </div>
    </PermissionProvider>
  );
}
