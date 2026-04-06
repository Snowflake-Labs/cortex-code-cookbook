# Advanced Analytics with Window Functions

Use SQL window functions to compute running totals, moving averages, rankings, and period-over-period comparisons -- all driven by Cortex Code prompts.

## Files

| File | Description |
|---|---|
| `sample_data.sql` | Creates the warehouse, database, schema, table, and inserts 720 rows of demo data (6 months, 4 regions, 3 products) |

## Prerequisites

- A Snowflake account with permissions to create tables in the target schema
- A warehouse (XS is fine)

## Setup

Run `sample_data.sql` in your Snowflake account to create the `CORTEX_COOKBOOK.SQL.DAILY_SALES` table.

## Prompt for Cortex Code

Copy-paste the prompt below into Cortex Code. It walks through several window function patterns on the sample data.

```
I have a table CORTEX_COOKBOOK.SQL.DAILY_SALES with columns:
  SALE_DATE (DATE), REGION (VARCHAR), PRODUCT (VARCHAR),
  UNITS_SOLD (INT), REVENUE (FLOAT)

It contains ~720 rows of daily sales across 4 regions (North, South, East, West)
and 3 products (Widget, Gadget, Gizmo) from 2024-07-01 to 2024-12-27.

Using SQL window functions, do the following step by step:

1. Compute a 7-day moving average of REVENUE per REGION, ordered by SALE_DATE.

2. Rank each REGION by total monthly REVENUE using RANK() and show which
   region is #1 each month.

3. Calculate month-over-month revenue growth (%) per REGION using LAG().

4. Show a cumulative (running) total of UNITS_SOLD per PRODUCT over time.

5. For each row, compute what percentage of that day's total revenue
   across all regions each REGION represents (ratio-to-report).

Use warehouse ANALYTICS_WH. Run each step and show me the results.
```

## What You'll Learn

- How to use `AVG() OVER (ROWS BETWEEN ...)` for moving averages
- How to use `RANK()` and `DENSE_RANK()` for rankings within partitions
- How to use `LAG()` for period-over-period comparisons
- How to compute running totals with `SUM() OVER (ORDER BY ...)`
- How to use `RATIO_TO_REPORT()` for proportional analysis

## Expected Output

After running through the prompt, you should have:

| Object | Type | Description |
|---|---|---|
| `CORTEX_COOKBOOK.SQL.DAILY_SALES` | Table | 720 rows of daily sales data |
| Query results | Result sets | Moving averages, rankings, MoM growth, running totals, and ratio-to-report calculations |
