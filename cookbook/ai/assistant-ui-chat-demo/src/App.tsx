import { useEffect, useState, type FC } from "react";
import { AgentProvider, usePlanMode } from "./context/AgentContext";
import { Thread } from "./thread/Thread";
import snowflakeMark from "./assets/snowflake.svg";

type SessionMeta = { id: string; createdAt: string; title?: string };

// --- Session sidebar ---

const SessionSidebar: FC<{
  sessions: SessionMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}> = ({ sessions, activeId, onSelect, onNew, onDelete }) => (
  <aside style={{
    width: "13rem",
    flexShrink: 0,
    borderRight: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }}>
    <div style={{
      padding: "0.625rem 0.75rem",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
        Sessions
      </span>
      <button onClick={onNew} title="New session" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-xs)", background: "transparent",
        color: "var(--fg-muted)", cursor: "pointer", fontSize: "1rem", lineHeight: 1,
      }}>+</button>
    </div>
    <div style={{ flex: 1, overflowY: "auto" }}>
      {sessions.length === 0 && (
        <div style={{ padding: "0.75rem", fontSize: "0.75rem", color: "var(--fg-muted)", textAlign: "center" }}>
          No sessions yet
        </div>
      )}
      {sessions.map(s => (
        <div key={s.id} className="session-row" onClick={() => onSelect(s.id)} style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.5rem 0.75rem",
          cursor: "pointer",
          background: s.id === activeId ? "var(--bg-tool-header)" : "transparent",
          borderLeft: s.id === activeId ? "2px solid var(--sf-blue-50)" : "2px solid transparent",
          transition: "background 100ms ease",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: s.id === activeId ? 500 : 400,
              color: s.id === activeId ? "var(--fg-default)" : "var(--fg-secondary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {s.title || "New conversation"}
            </div>
            <div style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono)", color: "var(--fg-muted)", marginTop: "0.125rem" }}>
              {s.id}
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(s.id); }} title="Delete" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 18, height: 18, border: "none", background: "transparent",
            color: "var(--fg-muted)", cursor: "pointer", borderRadius: "var(--radius-xs)",
            fontSize: "0.75rem", transition: "opacity 100ms",
          }} className="session-delete">✕</button>
        </div>
      ))}
    </div>
    <style>{`
      .session-delete { opacity: 0; pointer-events: none; }
      .session-row:hover .session-delete { opacity: 1; pointer-events: auto; }
    `}</style>
  </aside>
);

// --- Header ---

const Header: FC<{ sessionId: string; onClear: () => void }> = ({ sessionId, onClear }) => {
  const [planMode, setPlanMode] = usePlanMode();
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: "0.625rem",
      padding: "0 1.25rem", height: "52px", flexShrink: 0,
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--bg-surface)", boxShadow: "var(--shadow-xs)",
    }}>
      <img src={snowflakeMark} alt="" width={20} height={20} style={{ flexShrink: 0 }} />
      <span style={{ fontWeight: 600, fontSize: "0.9375rem", letterSpacing: "-0.01em" }}>Cortex Agent</span>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Plan mode */}
        <button onClick={() => setPlanMode(!planMode)} style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.1875rem 0.625rem", borderRadius: "var(--radius-xs)",
          border: planMode ? "1px solid rgba(41,181,232,0.4)" : "1px solid var(--border-subtle)",
          background: planMode ? "var(--sf-sky-dim)" : "var(--bg-tool-header)",
          color: planMode ? "var(--sf-sky)" : "var(--fg-muted)",
          cursor: "pointer", fontSize: "0.6875rem", fontFamily: "var(--font-mono)",
          fontWeight: 500, letterSpacing: "0.02em",
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524z"/>
          </svg>
          {planMode ? "plan on" : "plan"}
        </button>

        {/* Clear */}
        <button onClick={onClear} title="Clear conversation" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: "var(--radius-xs)",
          border: "1px solid var(--border-subtle)", background: "transparent",
          color: "var(--fg-muted)", cursor: "pointer",
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        </button>

        {/* Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.1875rem 0.625rem", borderRadius: "var(--radius-xs)",
          background: "var(--bg-tool-header)", border: "1px solid var(--border-subtle)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg-success)", boxShadow: "0 0 0 2px rgba(52,198,119,0.2)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--fg-muted)", letterSpacing: "0.02em" }}>
            assistant-ui
          </span>
        </div>
      </div>
    </header>
  );
};

// --- App ---

export const App: FC = () => {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  async function fetchSessions() {
    const res = await fetch("/api/sessions");
    const data: SessionMeta[] = await res.json();
    setSessions(data);
    return data;
  }

  async function createSession(): Promise<string> {
    const res = await fetch("/api/sessions", { method: "POST" });
    const { id } = await res.json();
    await fetchSessions();
    return id;
  }

  useEffect(() => {
    fetchSessions().then(data => {
      if (data.length > 0) setActiveId(data[0].id);
      else createSession().then(id => setActiveId(id));
    });
  }, []);

  async function handleNew() {
    const id = await createSession();
    setActiveId(id);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    const data = await fetchSessions();
    if (id === activeId) {
      if (data.length > 0) setActiveId(data[0].id);
      else createSession().then(newId => setActiveId(newId));
    }
  }

  async function handleClear() {
    if (!activeId) return;
    await fetch(`/api/conversation/${activeId}`, { method: "DELETE" });
    // Force remount by cycling the key
    const id = activeId;
    setActiveId(null);
    setTimeout(() => setActiveId(id), 0);
  }

  if (!activeId) return null;

  return (
    <AgentProvider key={activeId} sessionId={activeId}>
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg-page)" }}>
        <Header sessionId={activeId} onClear={handleClear} />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <SessionSidebar
            sessions={sessions}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={handleNew}
            onDelete={handleDelete}
          />
          <main style={{ flex: 1, minWidth: 0 }}>
            <Thread />
          </main>
        </div>
      </div>
    </AgentProvider>
  );
};
