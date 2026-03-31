# Cortex Code Cookbook

A collection of cookbook-style recipes for [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code), Snowflake's AI coding assistant CLI.

## Directory Structure

```
cortex-code-cookbook/
├── cookbook/
│   └── sis/
│       └── sis-dashboard-deploy/    # Recipe: Streamlit-in-Snowflake sales dashboard
├── AGENTS.md                        # Agent notes and lessons learned
├── LICENSE                          # Apache License 2.0
├── pyproject.toml                   # Project config, ruff lint rules
└── README.md
```

## Recipes

| Recipe | Description |
|---|---|
| [sis-dashboard-deploy](cookbook/sis/sis-dashboard-deploy/) | Deploy a monthly sales dashboard to Snowflake as a Streamlit-in-Snowflake (SiS) app |

## Prerequisites

- Python >= 3.11
- [uv](https://docs.astral.sh/uv/) for dependency management
- [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/index) installed and configured

## Development

```bash
# Install dev dependencies
uv sync

# Lint
uv run ruff check .

# Format
uv run ruff format .
```

## License

Apache License 2.0 -- see [LICENSE](LICENSE) for details.