import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { FC } from "react";
import { ToolCard } from "./ToolCard";
import { ProgressIndicator } from "./ProgressIndicator";
import { SyntaxHighlighter } from "./highlighter";

export const Thread: FC = () => (
  <ThreadPrimitive.Root
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      maxWidth: "52rem",
      margin: "0 auto",
      padding: "0 1.5rem 1.5rem",
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
        paddingTop: "1.5rem",
        paddingBottom: "0.5rem",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--border-default) transparent",
      }}
    >
      <ThreadPrimitive.Empty>
        <EmptyState />
      </ThreadPrimitive.Empty>

      {/* Spacer pushes short conversations toward center */}
      <div style={{ flex: 1, minHeight: "1rem" }} />

      <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />

      <ThreadPrimitive.If running>
        <ProgressIndicator />
      </ThreadPrimitive.If>
    </ThreadPrimitive.Viewport>

    <Composer />
  </ThreadPrimitive.Root>
);

const EmptyState: FC = () => (
  <div style={{
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "1rem",
    textAlign: "center",
    pointerEvents: "none",
  }}>
    <div style={{
      width: 44, height: 44,
      borderRadius: "50%",
      background: "var(--sf-sky-dim)",
      border: "1px solid rgba(41, 181, 232, 0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "0.25rem",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sf-sky)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L12 22M2 12L22 12M5.5 5.5L18.5 18.5M18.5 5.5L5.5 18.5"/>
      </svg>
    </div>
    <p style={{ margin: 0, fontSize: "1rem", fontWeight: 500, color: "var(--fg-default)" }}>
      Ask Cortex Code anything
    </p>
    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--fg-muted)", maxWidth: "22rem", lineHeight: 1.65 }}>
      Query your Snowflake data, explore schemas, and run SQL — with permission controls at every step.
    </p>
  </div>
);

// --- Messages ---

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    style={{
      alignSelf: "flex-end",
      background: "var(--sf-blue-50)",
      color: "#fff",
      padding: "0.6875rem 1rem",
      borderRadius: "var(--radius-lg)",
      borderBottomRightRadius: "var(--radius-xs)",
      marginTop: "1.5rem",
      marginBottom: "0.375rem",
      maxWidth: "72%",
      whiteSpace: "pre-wrap",
      fontSize: "0.9375rem",
      lineHeight: 1.55,
      letterSpacing: "-0.005em",
      boxShadow: "0 2px 8px rgba(26, 108, 231, 0.25)",
    }}
  >
    <MessagePrimitive.Parts />
  </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    style={{
      alignSelf: "flex-start",
      background: "var(--bg-elevated)",
      color: "var(--fg-default)",
      borderRadius: "var(--radius-lg)",
      borderTopLeftRadius: "var(--radius-xs)",
      marginTop: "0.25rem",
      marginBottom: "0.5rem",
      maxWidth: "min(88%, 46rem)",
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}
  >
    <MessagePrimitive.Parts
      components={{
        Text: () => (
          <div style={{ padding: "0.875rem 1.125rem" }}>
            <MarkdownTextPrimitive
              components={{ SyntaxHighlighter }}
              containerProps={{ className: "prose", style: { fontSize: "0.9375rem" } }}
            />
          </div>
        ),
        tools: { Fallback: ToolCard },
      }}
    />
  </MessagePrimitive.Root>
);

// --- Composer ---

const SendIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11z"/>
  </svg>
);

const StopIcon: FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
    <rect width="10" height="10" rx="2"/>
  </svg>
);

const Composer: FC = () => (
  <ComposerPrimitive.Root
    style={{
      display: "flex",
      gap: "0.625rem",
      alignItems: "flex-end",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      padding: "0.75rem",
      background: "var(--bg-elevated)",
      boxShadow: "var(--shadow-composer)",
    }}
  >
    <ComposerPrimitive.Input
      placeholder="Message Cortex Agent…"
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
        padding: "0.1875rem 0.25rem",
        lineHeight: 1.6,
        letterSpacing: "-0.005em",
      }}
    />
    <ThreadPrimitive.If running={false}>
      <ComposerPrimitive.Send style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "2rem", height: "2rem", flexShrink: 0,
        border: "none", borderRadius: "var(--radius-sm)",
        background: "var(--sf-blue-50)", color: "#fff",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(26, 108, 231, 0.3)",
      }}>
        <SendIcon />
      </ComposerPrimitive.Send>
    </ThreadPrimitive.If>
    <ThreadPrimitive.If running>
      <ComposerPrimitive.Cancel style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "2rem", height: "2rem", flexShrink: 0,
        border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)",
        background: "var(--bg-tool-header)", color: "var(--fg-muted)",
        cursor: "pointer",
      }}>
        <StopIcon />
      </ComposerPrimitive.Cancel>
    </ThreadPrimitive.If>
  </ComposerPrimitive.Root>
);
