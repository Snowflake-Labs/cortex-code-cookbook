import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { FC } from "react";
import { usePermission, respondPermission } from "../context/AgentContext";
import { SyntaxHighlighter } from "./highlighter";

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

export const ToolCard: FC<ToolCallMessagePartProps> = ({ toolCallId, toolName, args, result, status }) => {
  const perm = usePermission(toolCallId);
  const label = TOOL_LABELS[toolName] ?? toolName;
  const isSql = toolName === "sql_execute";
  const sqlText = isSql ? (args as { sql?: string })?.sql ?? "" : null;
  const description = isSql ? (args as { description?: string })?.description : null;
  const rows = isSql && result ? parseRowCount(result as string) : null;
  const isPending = perm?.status === "pending";
  const isDone = status.type === "complete";

  const accentColor = isDone
    ? "var(--border-subtle)"
    : isPending
      ? "var(--sf-amber)"
      : "var(--sf-sky)";

  return (
    <div style={{
      borderTop: "1px solid var(--border-subtle)",
      borderLeft: `3px solid ${accentColor}`,
      transition: "border-left-color 350ms ease",
      background: "var(--bg-tool-body)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.875rem 0.5rem 0.75rem",
        background: "var(--bg-tool-header)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <ToolIcon name={toolName} />
        <span style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--fg-muted)",
          fontFamily: "var(--font-mono)",
        }}>
          {description ?? label}
        </span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {perm?.status === "allowed" && (
            <StatusBadge color="green"><CheckIcon /> allowed</StatusBadge>
          )}
          {perm?.status === "denied" && (
            <StatusBadge color="red"><DenyIcon /> denied</StatusBadge>
          )}
          {!isPending && isDone && rows !== null && (
            <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--fg-success)", fontWeight: 600 }}>
              {rows} row{rows !== 1 ? "s" : ""}
            </span>
          )}
          {!isPending && isDone && rows === null && (
            <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--fg-success)", fontWeight: 600 }}>
              done
            </span>
          )}
          {!perm && !isDone && (
            <span style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              color: "var(--sf-sky)",
              fontWeight: 500,
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}>
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: "var(--sf-sky)",
                animation: "tool-pulse 1.5s ease-in-out infinite",
              }} />
              executing
              <style>{`@keyframes tool-pulse { 0%,100%{opacity:.3}50%{opacity:1} }`}</style>
            </span>
          )}
          {isPending && (
            <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--sf-amber)", fontWeight: 600 }}>
              awaiting approval
            </span>
          )}
        </span>
      </div>

      {/* Permission prompt */}
      {isPending && perm && (
        <PermissionPrompt
          toolName={perm.toolName}
          onAllow={() => respondPermission(perm.id, true)}
          onDeny={() => respondPermission(perm.id, false)}
        />
      )}

      {/* Content */}
      {!isPending && (
        <>
          {isSql && sqlText && (
            <div style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: rows !== null && rows > 0 ? "1px solid var(--border-subtle)" : "none" }}>
              <SyntaxHighlighter
                language="sql"
                code={sqlText}
                components={{
                  Pre: ({ children, style, ...p }) => <pre {...p} style={{ ...style, margin: 0, borderRadius: 0 }}>{children}</pre>,
                  Code: ({ children, ...p }) => <code {...p}>{children}</code>,
                }}
              />
            </div>
          )}
          {!isSql && (
            <pre style={{
              margin: 0,
              padding: "0.75rem 0.875rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              color: "var(--fg-muted)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              background: "var(--bg-tool-body)",
              lineHeight: 1.7,
            }}>
              {JSON.stringify(args, null, 2)}
            </pre>
          )}
          {isSql && rows !== null && rows > 0 && result && (
            <ResultTable raw={result as string} />
          )}
        </>
      )}
    </div>
  );
};

// --- Result table ---

function parseRowCount(raw: string): number | null {
  const m = raw.match(/^(\d+) row/);
  return m ? parseInt(m[1], 10) : null;
}

function looksNumeric(s: string): boolean {
  return s.length > 0 && !isNaN(Number(s));
}

const ResultTable: FC<{ raw: string }> = ({ raw }) => {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const afterRows = lines.slice(1);
  if (afterRows.length === 0) return null;

  const headers = afterRows[0].split(/\s{2,}/);
  const dataLines = afterRows.slice(1);

  return (
    <div style={{ overflowX: "auto", borderTop: "1px solid var(--border-subtle)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr style={{ background: "var(--bg-tool-header)" }}>
            <th style={{
              width: 36, padding: "0.4375rem 0.625rem", textAlign: "right",
              color: "var(--border-default)", borderBottom: "1px solid var(--border-subtle)",
              borderRight: "1px solid var(--border-subtle)", userSelect: "none", fontSize: "0.6875rem",
            }}>#</th>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "0.4375rem 1rem 0.4375rem 0.75rem",
                textAlign: "left", color: "var(--fg-muted)", fontWeight: 600,
                fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.08em",
                borderBottom: "1px solid var(--border-subtle)",
                borderRight: i < headers.length - 1 ? "1px solid var(--border-subtle)" : "none",
                whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, ri) => {
            const cells = line.split(/\s{2,}/);
            return (
              <tr key={ri} style={{ background: ri % 2 !== 0 ? "rgba(41,181,232,0.03)" : "transparent" }}>
                <td style={{
                  padding: "0.375rem 0.625rem", textAlign: "right",
                  color: "var(--fg-muted)", fontSize: "0.625rem", opacity: 0.4,
                  borderRight: "1px solid var(--border-subtle)", userSelect: "none",
                  borderBottom: ri < dataLines.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}>{ri + 1}</td>
                {cells.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: "0.375rem 1rem 0.375rem 0.75rem",
                    color: "var(--fg-default)",
                    borderBottom: ri < dataLines.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    borderRight: ci < cells.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    whiteSpace: "nowrap",
                    lineHeight: 1.5,
                  }}>
                    {looksNumeric(cell) ? (
                      <span style={{ color: "var(--sf-sky)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{cell}</span>
                    ) : cell === "null" || cell === "NULL" ? (
                      <span style={{ color: "var(--fg-muted)", fontStyle: "italic", opacity: 0.5 }}>null</span>
                    ) : cell}
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

// --- Permission prompt ---

const PermissionPrompt: FC<{ toolName: string; onAllow: () => void; onDeny: () => void }> = ({ toolName, onAllow, onDeny }) => (
  <div style={{
    padding: "0.875rem 0.875rem 0.875rem 0.75rem",
    background: "var(--sf-amber-dim)",
    borderBottom: "1px solid rgba(245, 158, 11, 0.15)",
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
  }}>
    <span style={{
      width: 7, height: 7, borderRadius: "50%",
      background: "var(--sf-amber)",
      boxShadow: "0 0 0 3px rgba(245,158,11,0.2)",
      flexShrink: 0,
    }} />
    <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--fg-default)", lineHeight: 1.5 }}>
      Allow agent to use{" "}
      <code style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        background: "rgba(245,158,11,0.1)",
        border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: "var(--radius-xs)",
        padding: "0.05em 0.4em",
        color: "var(--sf-amber)",
        fontWeight: 600,
      }}>{toolName}</code>?
    </span>
    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
      <button
        onClick={onDeny}
        style={{
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xs)",
          padding: "0.3125rem 0.75rem",
          fontSize: "0.75rem",
          fontWeight: 500,
          cursor: "pointer",
          background: "var(--bg-elevated)",
          color: "var(--fg-secondary)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
          transition: "background 120ms ease",
        }}
      >
        deny
      </button>
      <button
        onClick={onAllow}
        style={{
          border: "none",
          borderRadius: "var(--radius-xs)",
          padding: "0.3125rem 0.875rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          background: "var(--sf-blue-50)",
          color: "#fff",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
          boxShadow: "0 1px 4px rgba(26,108,231,0.3)",
          transition: "background 120ms ease",
        }}
      >
        allow
      </button>
    </div>
  </div>
);

// --- Status badge & icons ---

const StatusBadge: FC<{ color: "green" | "red"; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "0.25rem",
    padding: "0.125rem 0.5rem", borderRadius: "var(--radius-xs)",
    fontSize: "0.625rem", fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
    background: color === "green" ? "rgba(24, 160, 88, 0.1)" : "rgba(211, 19, 47, 0.08)",
    color: color === "green" ? "var(--fg-success)" : "var(--sf-red-50)",
    border: color === "green" ? "1px solid rgba(24, 160, 88, 0.2)" : "1px solid rgba(211, 19, 47, 0.15)",
  }}>{children}</span>
);

const ToolIcon: FC<{ name: string }> = ({ name }) => {
  if (name === "sql_execute") return <DbIcon />;
  if (name === "bash") return <TerminalIcon />;
  if (name === "read" || name === "write" || name === "edit") return <FileIcon />;
  return <CodeIcon />;
};

const DbIcon: FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--sf-sky)", opacity: 0.8 }}>
    <path d="M8 1C4.13 1 1 2.57 1 4.5v7C1 13.43 4.13 15 8 15s7-1.57 7-3.5v-7C15 2.57 11.87 1 8 1zm5.5 10.5c0 .83-2.24 2-5.5 2s-5.5-1.17-5.5-2V9.77C3.68 10.53 5.73 11 8 11s4.32-.47 5.5-1.23v1.73zm0-4c0 .83-2.24 2-5.5 2s-5.5-1.17-5.5-2V5.77C3.68 6.53 5.73 7 8 7s4.32-.47 5.5-1.23v1.73zM8 5.5C4.74 5.5 2.5 4.33 2.5 3.5S4.74 1.5 8 1.5s5.5 1.17 5.5 2-2.24 2-5.5 2z" />
  </svg>
);
const TerminalIcon: FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--fg-muted)" }}>
    <path d="M2 2.5A.5.5 0 0 1 2.5 2h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11zm1 1v10h10v-10H3zm2.354 2.146a.5.5 0 1 0-.708.708L6.293 8 4.646 9.646a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2zM8 9.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z" />
  </svg>
);
const FileIcon: FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--fg-muted)" }}>
    <path d="M9.5 1.5a.5.5 0 0 0-.5-.5H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a.5.5 0 0 0-.146-.354L9.5 1.5zm0 1.207L12.293 6H10a.5.5 0 0 1-.5-.5V2.707zM4 2h4.5v3.5A1.5 1.5 0 0 0 10 7h3v7H4V2z" />
  </svg>
);
const CodeIcon: FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--fg-muted)" }}>
    <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z" />
  </svg>
);
const CheckIcon: FC = () => (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
    <path d="M10.28 2.28L4.75 7.81 1.72 4.78a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l6-6a.75.75 0 0 0-1.06-1.06z" />
  </svg>
);
const DenyIcon: FC = () => (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
    <path d="M1.47 1.47a.75.75 0 0 1 1.06 0L6 4.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L7.06 6l3.47 3.47a.75.75 0 1 1-1.06 1.06L6 7.06 2.53 10.53a.75.75 0 0 1-1.06-1.06L4.94 6 1.47 2.53a.75.75 0 0 1 0-1.06z" />
  </svg>
);
