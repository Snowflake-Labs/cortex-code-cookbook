# Snowpark Data Pipeline

Build a scalable data transformation pipeline using Snowpark Python -- ingest raw data, transform it, and write curated output tables, all driven by Cortex Code prompts.

## Files

| File | Description |
|---|---|
| `sample_data.sql` | Creates the warehouse, database, schema, table, and inserts 200 rows of e-commerce order data |

## Prerequisites

- A Snowflake account with permissions to create tables in the target schema
- A warehouse (XS is fine)
- Snowpark Python available (included with Snowflake)

## Setup

Run `sample_data.sql` in your Snowflake account to create the `CORTEX_COOKBOOK.DATA_ENGINEERING.RAW_ORDERS` table.

## Prompt for Cortex Code

Copy-paste the prompt below into Cortex Code. It walks through building an end-to-end Snowpark pipeline: read raw data, apply transformations, and write results.

```
I have a table CORTEX_COOKBOOK.DATA_ENGINEERING.RAW_ORDERS with columns:
  ORDER_ID (INT), CUSTOMER_ID (INT), PRODUCT (VARCHAR),
  QUANTITY (INT), UNIT_PRICE (FLOAT), ORDER_DATE (DATE),
  STATUS (VARCHAR), REGION (VARCHAR)

It contains 200 rows of e-commerce orders for 2024 across 4 regions
(North, South, East, West), 5 products (Laptop, Monitor, Keyboard,
Mouse, Headset), and 4 statuses (completed, shipped, pending, cancelled).

Using Snowpark Python, do the following step by step:

1. Create a Snowpark session and read the RAW_ORDERS table into a
   DataFrame.

2. Filter out cancelled orders and add a TOTAL_PRICE column
   (QUANTITY * UNIT_PRICE).

3. Create an enriched orders table: write the cleaned DataFrame to
   CORTEX_COOKBOOK.DATA_ENGINEERING.CLEANED_ORDERS.

4. Aggregate revenue by REGION and month (from ORDER_DATE). Write the
   result to CORTEX_COOKBOOK.DATA_ENGINEERING.MONTHLY_REVENUE_BY_REGION.

5. Compute the top 3 products by total revenue. Write the result to
   CORTEX_COOKBOOK.DATA_ENGINEERING.TOP_PRODUCTS.

6. Query each output table to verify the results.

Use warehouse PIPELINE_WH. Run each step and show me the results.
```

## What You'll Learn

- How to create a Snowpark session and read tables as DataFrames
- How to filter, add columns, and transform data with the Snowpark DataFrame API
- How to aggregate data using `group_by` and window functions in Snowpark
- How to write transformed DataFrames back to Snowflake tables

## Expected Output

After running through the prompt, you should have:

| Object | Type | Description |
|---|---|---|
| `CORTEX_COOKBOOK.DATA_ENGINEERING.RAW_ORDERS` | Table | 200 rows of raw e-commerce orders |
| `CORTEX_COOKBOOK.DATA_ENGINEERING.CLEANED_ORDERS` | Table | Orders with cancelled rows removed and TOTAL_PRICE added |
| `CORTEX_COOKBOOK.DATA_ENGINEERING.MONTHLY_REVENUE_BY_REGION` | Table | Monthly revenue aggregated by region |
| `CORTEX_COOKBOOK.DATA_ENGINEERING.TOP_PRODUCTS` | Table | Top 3 products ranked by total revenue |
