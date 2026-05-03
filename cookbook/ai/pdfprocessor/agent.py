"""
PDF Processor — Cortex Code Agent SDK example

Demonstrates how to use the Cortex Code Agent SDK with project-local skills
to process a PDF document: extract text, analyze content, and produce a
structured JSON summary.

Usage:
    python agent.py <path/to/document.pdf>

The agent loads the `pdf-processor` skill from .cortex/skills/ and uses it
to guide the extraction and summarization workflow.
"""

import asyncio
import json
import sys
from pathlib import Path

from cortex_code_agent_sdk import (
    AssistantMessage,
    CortexCodeAgentOptions,
    ResultMessage,
    TextBlock,
    ThinkingBlock,
    ToolResultBlock,
    ToolUseBlock,
    query,
)


async def process_pdf(pdf_path: str) -> None:
    pdf = Path(pdf_path).resolve()
    if not pdf.exists():
        print(f"Error: file not found — {pdf}", file=sys.stderr)
        sys.exit(1)

    print(f"Processing: {pdf.name}")
    print("-" * 40)

    options = CortexCodeAgentOptions(
        cwd=str(Path(__file__).parent),  # Project root with .cortex/skills/
        setting_sources=["user", "project"],  # Load skills from filesystem
        allowed_tools=["Skill", "Read", "Write", "Bash", "Glob", "SQL"],
    )

    prompt = (
        f"Use the pdf-processor skill to process this PDF document: {pdf}\n\n"
        "Follow all steps in the skill exactly: extract the data with AI_EXTRACT, "
        "write a JSON summary file, write a plain-text .txt summary file, "
        "clean up the stage, and report back what you found."
    )

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, ThinkingBlock):
                    print(f"[THINKING] {block.thinking}", flush=True)

                elif isinstance(block, TextBlock):
                    print(block.text, end="", flush=True)

                elif isinstance(block, ToolUseBlock):
                    input_preview = json.dumps(block.input, ensure_ascii=False)
                    if len(input_preview) > 120:
                        input_preview = input_preview[:120] + "..."
                    print(f"\n[TOOL CALL] {block.name}: {input_preview}")

                elif isinstance(block, ToolResultBlock):
                    print(f"[TOOL RESULT] id={block.tool_use_id}")

        elif isinstance(message, ResultMessage):
            print(f"\n[DONE] subtype={message.subtype}")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python agent.py <path/to/document.pdf>", file=sys.stderr)
        sys.exit(1)

    asyncio.run(process_pdf(sys.argv[1]))


if __name__ == "__main__":
    main()
