# assistant-ui Chat Demo

A minimal **Vite + React** chat app that renders the [assistant-ui](https://www.assistant-ui.com/) `<Thread />` and drives it with [`cortex-code-agent-sdk`](https://www.npmjs.com/package/cortex-code-agent-sdk) on a small Express backend.

The frontend is pure assistant-ui primitives with syntax-highlighted SQL, result tables, and a user permission prompt (allow/deny) before each tool call. The Express server spawns a Cortex Code session via the SDK, streams events back as NDJSON, and a custom `ChatModelAdapter` on the client yields each turn into the thread.

## Files

| File | Description |
|---|---|
| `src/App.tsx` | Renders `<Thread />` inside `AssistantRuntimeProvider` and wires a custom `ChatModelAdapter` via `useLocalRuntime` |
| `src/thread.tsx` | Thread / Composer UI using `@assistant-ui/react` primitives with tool cards, SQL highlighting, result tables, and permission prompts |
| `src/main.tsx` | React entrypoint |
| `server/index.ts` | Express server. Calls `query()` from `cortex-code-agent-sdk` and streams `assistant` text blocks back as NDJSON |
| `vite.config.ts` | Vite config; proxies `/api` → `http://localhost:8787` |

## Prerequisites

- Node.js >= 20
- The Cortex Code CLI installed and on `PATH` (the SDK spawns it):
  ```
  curl -LsS https://ai.snowflake.com/static/cc-scripts/install.sh | CORTEX_CHANNEL=beta sh
  ```
- A Snowflake CLI connection. Either set `SNOWFLAKE_DEFAULT_CONNECTION_NAME`, or export `SNOWFLAKE_CONNECTION` for this app:
  ```
  export SNOWFLAKE_CONNECTION=my_snow_cli_connection
  ```
  Cortex Code uses the same `~/.snowflake/connections.toml` as `snow` CLI.

## Run

```bash
npm install
npm run dev
```

This starts two processes concurrently:

- `server` on http://localhost:8787 — Express + SDK
- `web` on http://localhost:5173 — Vite dev server

Open http://localhost:5173 and send a message. Each user turn spawns a one-shot Cortex Code `query()`; assistant text blocks are streamed back as the model produces them.

## How the wiring works

1. **Client adapter** (`src/App.tsx`) — implements `ChatModelAdapter.run` as an async generator. It POSTs the latest user message to `/api/chat` and reads the NDJSON body line-by-line, yielding `{ content: [{ type: "text", text }] }` on each `text-delta`.
2. **Express route** (`server/index.ts`) — runs `query({ prompt, options })` from the SDK. For each `assistant` event, it writes any `text` blocks to the response stream as NDJSON. Tool-use blocks, thinking blocks, and result events are filtered out (you can extend this to render them).
3. **Auth** — the SDK reads the Snowflake CLI connection named by `SNOWFLAKE_CONNECTION`. No JWT plumbing needed in the app.

## Extending the demo

- **Thinking**: forward `thinking` blocks when `includePartialMessages: true` is set on `query()` options.
- **Multi-turn memory**: replace `query()` with `createCortexCodeSession()` so the same session persists across HTTP calls (keyed by a session ID in a cookie or header).
