# Forecast Sales

Use `SNOWFLAKE.ML.FORECAST` to predict future monthly sales from historical data -- all in SQL, driven by Cortex Code prompts.

## Files

| File | Description |
|---|---|
| `sample_data.sql` | Creates the warehouse, database, schema, table, and inserts 54 rows of demo data (18 months x 3 categories) |

## Prerequisites

- A Snowflake account with `CREATE SNOWFLAKE.ML.FORECAST` privilege on the target schema
- A warehouse (XS is fine)

## Setup

Run `sample_data.sql` in your Snowflake account to create the `CORTEX_COOKBOOK.ML.MONTHLY_SALES` table.

## Prompt for Cortex Code

Copy-paste the prompt below into Cortex Code. It walks through the full workflow: train a multi-series forecast model, generate predictions, and visualize results.

```
I have a table CORTEX_COOKBOOK.ML.MONTHLY_SALES with columns:
  SALE_DATE (TIMESTAMP_NTZ), PRODUCT_CATEGORY (VARCHAR), SALES_AMOUNT (FLOAT)

It contains 18 months of monthly sales (2024-01 to 2025-06) for 3 categories:
Electronics, Clothing, and Food.

Using SNOWFLAKE.ML.FORECAST, do the following step by step:

1. Create a view that combines PRODUCT_CATEGORY into a series column
   and selects SALE_DATE and SALES_AMOUNT.

2. Train a multi-series forecast model named SALES_FORECAST in
   CORTEX_COOKBOOK.ML, using the view from step 1.

3. Generate forecasts for the next 3 months for all categories.
   Save the results to a table called CORTEX_COOKBOOK.ML.SALES_FORECAST_RESULTS.

4. Show the evaluation metrics for the trained model.

5. Query the forecast results and the historical data together so I can
   compare actuals vs. predictions by category.

Use warehouse FORECAST_WH. Run each step and show me the results.
```

## What You'll Learn

- How to train a `SNOWFLAKE.ML.FORECAST` model on multiple time series
- How to generate forecasts with prediction intervals (lower/upper bounds)
- How to inspect model evaluation metrics
- How to combine actuals and forecasts for comparison

## Expected Output

After running through the prompt, you should have:

| Object | Type | Description |
|---|---|---|
| `CORTEX_COOKBOOK.ML.MONTHLY_SALES` | Table | Historical sales data |
| `CORTEX_COOKBOOK.ML.SALES_FORECAST` | Forecast model | Trained multi-series model |
| `CORTEX_COOKBOOK.ML.SALES_FORECAST_RESULTS` | Table | 3-month forecasts per category with prediction intervals |
