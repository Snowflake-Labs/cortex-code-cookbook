# Cortex Code Cookbook

A collection of cookbook-style recipes for [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code), Snowflake's AI coding assistant CLI.

## Directory Structure

```
cortex-code-cookbook/
├── cookbook/
│   ├── ai/
│   │   └── cortex-analyst-101/       # Recipe: Natural-language queries with Cortex Analyst
│   ├── data-engineering/
│   │   └── snowpark-data-pipeline/   # Recipe: Snowpark Python transformation pipeline
│   ├── ml/
│   │   └── forecast-sales/          # Recipe: Sales forecasting with SNOWFLAKE.ML.FORECAST
│   ├── sis/
│   │   └── sis-dashboard-deploy/    # Recipe: Streamlit-in-Snowflake sales dashboard
│   └── analytics/
│       └── advanced-analytics-window-functions/  # Recipe: Window functions for analytics
├── AGENTS.md                        # Agent notes and lessons learned
├── LICENSE                          # Apache License 2.0
├── pyproject.toml                   # Project config, ruff lint rules
└── README.md
```

## Recipes

| Category | Recipe | Description |
|---|---|---|
| ai | [cortex-analyst-101](cookbook/ai/cortex-analyst-101/) | Natural-language queries against a semantic model with Cortex Analyst |
| data-engineering | [snowpark-data-pipeline](cookbook/data-engineering/snowpark-data-pipeline/) | Snowpark Python pipeline: ingest, transform, and write curated output tables |
| ml | [forecast-sales](cookbook/ml/forecast-sales/) | Forecast monthly sales with `SNOWFLAKE.ML.FORECAST` using Cortex Code prompts |
| sis | [sis-dashboard-deploy](cookbook/sis/sis-dashboard-deploy/) | Deploy a monthly sales dashboard to Snowflake as a Streamlit-in-Snowflake (SiS) app |
| analytics | [advanced-analytics-window-functions](cookbook/analytics/advanced-analytics-window-functions/) | Window functions for moving averages, rankings, and period-over-period analysis |

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