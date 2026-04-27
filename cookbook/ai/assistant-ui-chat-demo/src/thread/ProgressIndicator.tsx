import type { FC } from "react";
import { useProgress } from "../context/AgentContext";

export const ProgressIndicator: FC = () => {
  const progress = useProgress();
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "0.625rem",
      padding: "0.625rem 0.25rem",
      color: "var(--fg-muted)",
      fontSize: "0.75rem",
      fontFamily: "var(--font-mono)",
    }}>
      <span style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--sf-sky)",
            animation: `agent-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </span>
      <span style={{
        color: progress ? "var(--fg-secondary)" : "var(--fg-muted)",
        transition: "color 200ms ease",
        lineHeight: 1.5,
        wordBreak: "break-word",
      }}>
        {progress || "thinking…"}
      </span>
      <style>{`
        @keyframes agent-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
