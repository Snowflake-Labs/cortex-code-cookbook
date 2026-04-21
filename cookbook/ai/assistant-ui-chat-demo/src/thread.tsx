import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessage,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { makePrismLightSyntaxHighlighter } from "@assistant-ui/react-syntax-highlighter";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import { PrismLight } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { FC } from "react";
import type { ToolCallPart } from "./App";

PrismLight.registerLanguage("sql", sql);

const SyntaxHighlighter = makePrismLightSyntaxHighlighter({
  style: oneDark,
  customStyle: {
    margin: 0,
    borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
    fontSize: "0.8125rem",
    lineHeight: 1.6,
  },
});

export const Thread: FC = () => (
  <ThreadPrimitive.Root
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      maxWidth: "44rem",
      margin: "0 auto",
      padding: "1rem 1.25rem",
      boxSizing: "border-box",
    }}
  >
    <ThreadPrimitive.Viewport
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "1rem",
      }}
    >
      <ThreadPrimitive.Empty>
        <div
          style={{
            textAlign: "center",
            color: "var(--fg-muted)",
            marginTop: "4rem",
            fontSize: "0.9375rem",
          }}
        >
          Ask Cortex Code anything.
        </div>
      </ThreadPrimitive.Empty>

      <ThreadPrimitive.Messages
        components={{
          UserMessage,
          AssistantMessage,
        }}
      />
    </ThreadPrimitive.Viewport>

    <Composer />
  </ThreadPrimitive.Root>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    style={{
      alignSelf: "flex-end",
      background: "var(--bg-user)",
      color: "var(--fg-on-brand)",
      padding: "0.625rem 0.875rem",
      borderRadius: "var(--radius-lg)",
      margin: "0.375rem 0",
      maxWidth: "80%",
      whiteSpace: "pre-wrap",
      fontSize: "0.9375rem",
    }}
  >
    <MessagePrimitive.Parts />
  </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => {
  const message = useMessage();
  const parts = message.content as unknown as (ToolCallPart | { type: "text"; text: string })[];

  return (
    <MessagePrimitive.Root
      style={{
        alignSelf: "flex-start",
        background: "var(--bg-assistant)",
        color: "var(--fg-default)",
        borderRadius: "var(--radius-lg)",
        margin: "0.375rem 0",
        maxWidth: "85%",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      {parts.map((part, i) => {
        if (part.type === "tool-call") {
          return <ToolCard key={i} part={part} />;
        }
        if (part.type === "text") {
          return (
            <div key={i} style={{ padding: "0.625rem 0.875rem" }}>
              <MessagePrimitive.Parts
                components={{
                  Text: () => (
                    <MarkdownTextPrimitive
                      components={{ SyntaxHighlighter }}
                      containerProps={{ style: { fontSize: "0.9375rem", lineHeight: 1.65 } }}
                    />
                  ),
                }}
              />
            </div>
          );
        }
        return null;
      })}
    </MessagePrimitive.Root>
  );
};

const TOOL_LABELS: Record<string, string> = {
  sql_execute: "SQL Query",
  bash: "Shell",
  read: "Read file",
  write: "Write file",
  edit: "Edit file",
  grep: "Search",
  glob: "Find files",
  web_fetch: "Web fetch",
  web_search: "Web search",
};

const ToolCard: FC<{ part: ToolCallPart }> = ({ part }) => {
  const label = TOOL_LABELS[part.toolName] ?? part.toolName;
  const isSql = part.toolName === "sql_execute";
  const sqlText = isSql ? ((part.args as { sql?: string })?.sql ?? "") : null;
  const description = isSql ? (part.args as { description?: string })?.description : null;
  const rows = isSql ? parseResult(part.result) : null;

  return (
    <div style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: "0.8125rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.875rem",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-tool-header)",
          color: "var(--fg-muted)",
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <ToolIcon name={part.toolName} />
        {description ?? label}

        {/* Permission badge */}
        {part.permitted !== undefined && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.125rem 0.5rem",
              borderRadius: 99,
              fontSize: "0.6875rem",
              fontWeight: 500,
              textTransform: "none",
              letterSpacing: 0,
              background: "rgba(29, 180, 100, 0.12)",
              color: "var(--fg-success)",
              border: "1px solid rgba(29, 180, 100, 0.25)",
            }}
          >
            <CheckIcon /> allowed
          </span>
        )}

        {/* Row count */}
        {part.result && rows !== null && (
          <span
            style={{
              marginLeft: "auto",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
              color: "var(--fg-success)",
            }}
          >
            {rows} row{rows !== 1 ? "s" : ""}
          </span>
        )}

        {/* Non-SQL done indicator */}
        {part.result && rows === null && (
          <span
            style={{
              marginLeft: "auto",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
              color: "var(--fg-success)",
            }}
          >
            done
          </span>
        )}

        {/* Pending spinner */}
        {!part.result && (
          <span
            style={{
              marginLeft: "auto",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
              color: "var(--fg-muted)",
            }}
          >
            running…
          </span>
        )}
      </div>

      {/* SQL code block */}
      {isSql && sqlText && (
        <SyntaxHighlighter
          language="sql"
          code={sqlText}
          components={{
            Pre: ({ children, ...p }) => <pre {...p} style={{ margin: 0 }}>{children}</pre>,
            Code: ({ children, ...p }) => <code {...p}>{children}</code>,
          }}
        />
      )}

      {/* Non-SQL: show args as JSON */}
      {!isSql && (
        <pre
          style={{
            margin: 0,
            padding: "0.5rem 0.875rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            color: "var(--fg-muted)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {JSON.stringify(part.args, null, 2)}
        </pre>
      )}

      {/* Result table for SQL */}
      {isSql && rows !== null && rows > 0 && part.result && (
        <ResultTable raw={part.result} />
      )}
    </div>
  );
};

function parseResult(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/^(\d+) row/);
  return m ? parseInt(m[1], 10) : null;
}

const ResultTable: FC<{ raw: string }> = ({ raw }) => {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const afterRows = lines.slice(1);
  if (afterRows.length === 0) return null;

  const headers = afterRows[0].split(/\s{2,}/);
  const dataLines = afterRows.slice(1);

  return (
    <div style={{ overflowX: "auto", borderTop: "1px solid var(--border-subtle)" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8125rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "0.375rem 0.875rem",
                  textAlign: "left",
                  color: "var(--fg-muted)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-tool-header)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, ri) => {
            const cells = line.split(/\s{2,}/);
            return (
              <tr key={ri}>
                {cells.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "0.375rem 0.875rem",
                      color: "var(--fg-default)",
                      borderBottom:
                        ri < dataLines.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ToolIcon: FC<{ name: string }> = ({ name }) => {
  if (name === "sql_execute") return <DbIcon />;
  if (name === "bash") return <TerminalIcon />;
  if (name === "read" || name === "write" || name === "edit") return <FileIcon />;
  return <CodeIcon />;
};

const DbIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M8 1C4.13 1 1 2.57 1 4.5v7C1 13.43 4.13 15 8 15s7-1.57 7-3.5v-7C15 2.57 11.87 1 8 1zm5.5 10.5c0 .83-2.24 2-5.5 2s-5.5-1.17-5.5-2V9.77C3.68 10.53 5.73 11 8 11s4.32-.47 5.5-1.23v1.73zm0-4c0 .83-2.24 2-5.5 2s-5.5-1.17-5.5-2V5.77C3.68 6.53 5.73 7 8 7s4.32-.47 5.5-1.23v1.73zM8 5.5C4.74 5.5 2.5 4.33 2.5 3.5S4.74 1.5 8 1.5s5.5 1.17 5.5 2-2.24 2-5.5 2z" />
  </svg>
);

const TerminalIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M2 2.5A.5.5 0 0 1 2.5 2h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11zm1 1v10h10v-10H3zm2.354 2.146a.5.5 0 1 0-.708.708L6.293 8 4.646 9.646a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2zM8 9.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z" />
  </svg>
);

const FileIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M9.5 1.5a.5.5 0 0 0-.5-.5H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a.5.5 0 0 0-.146-.354L9.5 1.5zm0 1.207L12.293 6H10a.5.5 0 0 1-.5-.5V2.707zM4 2h4.5v3.5A1.5 1.5 0 0 0 10 7h3v7H4V2z" />
  </svg>
);

const CodeIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z" />
  </svg>
);

const CheckIcon: FC = () => (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
    <path d="M10.28 2.28L4.75 7.81 1.72 4.78a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l6-6a.75.75 0 0 0-1.06-1.06z" />
  </svg>
);

const composerButton: React.CSSProperties = {
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "0 0.875rem",
  height: "2rem",
  alignSelf: "flex-end",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.875rem",
  transition: "background 120ms ease",
};

const Composer: FC = () => (
  <ComposerPrimitive.Root
    style={{
      display: "flex",
      gap: "0.5rem",
      alignItems: "flex-end",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: "0.5rem",
      background: "var(--bg-surface)",
      boxShadow: "var(--shadow-sm)",
    }}
  >
    <ComposerPrimitive.Input
      placeholder="Send a message to Cortex Code..."
      rows={1}
      autoFocus
      style={{
        flex: 1,
        border: "none",
        outline: "none",
        resize: "none",
        fontSize: "0.9375rem",
        background: "transparent",
        color: "var(--fg-default)",
        padding: "0.25rem 0.375rem",
      }}
    />
    <ThreadPrimitive.If running={false}>
      <ComposerPrimitive.Send
        style={{
          ...composerButton,
          background: "var(--bg-user)",
          color: "var(--fg-on-brand)",
        }}
      >
        Send
      </ComposerPrimitive.Send>
    </ThreadPrimitive.If>
    <ThreadPrimitive.If running>
      <ComposerPrimitive.Cancel
        style={{
          ...composerButton,
          background: "var(--sf-red-50)",
          color: "var(--fg-on-brand)",
        }}
      >
        Stop
      </ComposerPrimitive.Cancel>
    </ThreadPrimitive.If>
  </ComposerPrimitive.Root>
);
