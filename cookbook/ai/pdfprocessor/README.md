# PDF Processor

A Python example that uses the [Cortex Code Agent SDK](https://docs.snowflake.com/en/user-guide/cortex-code-agent-sdk/cortex-code-agent-sdk) with a project-local skill to process PDF documents — extracting text, analyzing content, and producing a structured JSON summary.

This example demonstrates:
- Loading project-local skills via `setting_sources=["user", "project"]`
- Enabling the `Skill` tool with `allowed_tools`
- Running a one-shot agentic workflow from a Python script

## Files

| File | Description |
|---|---|
| `agent.py` | Main script — invokes the SDK with the pdf-processor skill |
| `requirements.txt` | Python dependencies |
| `.cortex/skills/pdf-processor.md` | Project skill that guides the agent through PDF extraction and summarization |

## Prerequisites

- Python 3.10+
- Cortex Code CLI installed and on `PATH`:
  ```bash
  curl -LsS https://ai.snowflake.com/static/cc-scripts/install.sh | sh
  ```
- A Snowflake CLI connection configured in `~/.snowflake/connections.toml`:
  ```toml
  [my-connection]
  account = "myorg-myaccount"
  user = "myuser"
  authenticator = "externalbrowser"
  ```

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python agent.py path/to/document.pdf
```

The agent will:
1. Invoke the `pdf-processor` skill from `.cortex/skills/`
2. Extract text from the PDF (using `pdftotext` or `pypdf`)
3. Analyze the content — document type, entities, sections
4. Write a `<filename>_summary.json` file next to the original PDF
5. Print a plain-language summary of findings

## How skills work

The `setting_sources=["project"]` option tells the SDK to load skill definitions from `.cortex/skills/` in the working directory. Setting `allowed_tools=["Skill", ...]` lets the agent invoke those skills by name during the run.

The `pdf-processor` skill instructs the agent on:
- How to extract text from a PDF
- What entities and structure to look for
- The JSON schema to write as output

You can add or edit skills in `.cortex/skills/` to change the agent's behavior without modifying `agent.py`.

## Example output

```
Processing: invoice_q4.pdf
----------------------------------------
I'll use the pdf-processor skill to process this document.

[Tool: Skill]
[Tool: Bash]
[Tool: Read]
[Tool: Write]

This is a Q4 2024 vendor invoice from Acme Corp for $12,450.00, due January 15, 2025.
Key details: invoice #INV-2024-0891, net-30 payment terms, two line items for
software licenses. Summary written to invoice_q4_summary.json.

Done: success
```
