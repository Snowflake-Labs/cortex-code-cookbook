# Cortex Analyst 101

Use Cortex Analyst to ask natural-language questions against a semantic model and get SQL answers -- all driven by Cortex Code prompts.

## Files

| File | Description |
|---|---|
| `sample_data.sql` | Creates the warehouse, database, schema, table, and inserts 144 rows of demo data (12 months x 4 regions x 3 products) |

## Prerequisites

- A Snowflake account with Cortex Analyst enabled
- A warehouse (XS is fine)

## Setup

Run `sample_data.sql` in your Snowflake account to create the `CORTEX_COOKBOOK.AI.REVENUE` table.

## Prompt for Cortex Code

Copy-paste the prompt below into Cortex Code. It walks through building a semantic model and querying it with Cortex Analyst.

```
I have a table CORTEX_COOKBOOK.AI.REVENUE with columns:
  MONTH (DATE), REGION (VARCHAR), PRODUCT (VARCHAR),
  UNITS_SOLD (INT), REVENUE (FLOAT), COST (FLOAT)

It contains 144 rows of monthly revenue data for 2024 across 4 regions
(North, South, East, West) and 3 product tiers (Standard, Premium, Enterprise).

Using Cortex Analyst, do the following step by step:

1. Create a semantic model YAML file for this table. Define dimensions
   for REGION and PRODUCT, time dimension for MONTH, and measures for
   UNITS_SOLD, REVENUE, COST, and a calculated measure for PROFIT
   (REVENUE - COST).

2. Upload the semantic model to a Snowflake stage.

3. Ask Cortex Analyst: "What was total revenue by region in 2024?"

4. Ask Cortex Analyst: "Which product tier is the most profitable?"

5. Ask Cortex Analyst: "Show me month-over-month revenue growth
   for the North region."

Use warehouse ANALYST_WH. Run each step and show me the results.
```

## What You'll Learn

- How to define a semantic model YAML with dimensions, time dimensions, and measures
- How to upload a semantic model to a Snowflake stage
- How to query data using natural language via Cortex Analyst
- How to use calculated measures (e.g., profit = revenue - cost)

## Expected Output

After running through the prompt, you should have:

| Object | Type | Description |
|---|---|---|
| `CORTEX_COOKBOOK.AI.REVENUE` | Table | 144 rows of monthly revenue data |
| Semantic model YAML | Stage file | Semantic model definition with dimensions and measures |
| Query results | Result sets | Natural-language answers with generated SQL for revenue, profitability, and growth questions |
