-- Sample data for the Forecast Quickstart recipe.
-- Run this as ACCOUNTADMIN (or a role with sufficient privileges).

-- ---------------------------------------------------------------------------
-- 1. Warehouse, database, and schema
-- ---------------------------------------------------------------------------
CREATE WAREHOUSE IF NOT EXISTS FORECAST_WH
    WAREHOUSE_SIZE = 'XSMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE;

CREATE DATABASE IF NOT EXISTS CORTEX_COOKBOOK;
CREATE SCHEMA IF NOT EXISTS CORTEX_COOKBOOK.ML;

USE WAREHOUSE FORECAST_WH;
USE SCHEMA CORTEX_COOKBOOK.ML;

-- ---------------------------------------------------------------------------
-- 2. Monthly sales table (18 months x 3 categories = 54 rows)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE MONTHLY_SALES (
    SALE_DATE        TIMESTAMP_NTZ,
    PRODUCT_CATEGORY VARCHAR,
    SALES_AMOUNT     FLOAT
);

INSERT INTO MONTHLY_SALES VALUES
    ('2024-01-01', 'Electronics', 125000),
    ('2024-02-01', 'Electronics', 118000),
    ('2024-03-01', 'Electronics', 132000),
    ('2024-04-01', 'Electronics', 128000),
    ('2024-05-01', 'Electronics', 140000),
    ('2024-06-01', 'Electronics', 155000),
    ('2024-07-01', 'Electronics', 148000),
    ('2024-08-01', 'Electronics', 142000),
    ('2024-09-01', 'Electronics', 158000),
    ('2024-10-01', 'Electronics', 165000),
    ('2024-11-01', 'Electronics', 180000),
    ('2024-12-01', 'Electronics', 195000),
    ('2025-01-01', 'Electronics', 138000),
    ('2025-02-01', 'Electronics', 130000),
    ('2025-03-01', 'Electronics', 145000),
    ('2025-04-01', 'Electronics', 142000),
    ('2025-05-01', 'Electronics', 156000),
    ('2025-06-01', 'Electronics', 170000),

    ('2024-01-01', 'Clothing', 85000),
    ('2024-02-01', 'Clothing', 78000),
    ('2024-03-01', 'Clothing', 92000),
    ('2024-04-01', 'Clothing', 98000),
    ('2024-05-01', 'Clothing', 88000),
    ('2024-06-01', 'Clothing', 95000),
    ('2024-07-01', 'Clothing', 82000),
    ('2024-08-01', 'Clothing', 79000),
    ('2024-09-01', 'Clothing', 105000),
    ('2024-10-01', 'Clothing', 110000),
    ('2024-11-01', 'Clothing', 120000),
    ('2024-12-01', 'Clothing', 115000),
    ('2025-01-01', 'Clothing', 90000),
    ('2025-02-01', 'Clothing', 83000),
    ('2025-03-01', 'Clothing', 97000),
    ('2025-04-01', 'Clothing', 103000),
    ('2025-05-01', 'Clothing', 93000),
    ('2025-06-01', 'Clothing', 100000),

    ('2024-01-01', 'Food', 95000),
    ('2024-02-01', 'Food', 92000),
    ('2024-03-01', 'Food', 98000),
    ('2024-04-01', 'Food', 96000),
    ('2024-05-01', 'Food', 101000),
    ('2024-06-01', 'Food', 105000),
    ('2024-07-01', 'Food', 108000),
    ('2024-08-01', 'Food', 103000),
    ('2024-09-01', 'Food', 110000),
    ('2024-10-01', 'Food', 112000),
    ('2024-11-01', 'Food', 118000),
    ('2024-12-01', 'Food', 122000),
    ('2025-01-01', 'Food', 100000),
    ('2025-02-01', 'Food', 97000),
    ('2025-03-01', 'Food', 104000),
    ('2025-04-01', 'Food', 102000),
    ('2025-05-01', 'Food', 108000),
    ('2025-06-01', 'Food', 113000);

-- ---------------------------------------------------------------------------
-- 3. Grant FORECAST privilege (adjust role name as needed)
-- ---------------------------------------------------------------------------
GRANT USAGE ON DATABASE CORTEX_COOKBOOK TO ROLE SYSADMIN;
GRANT USAGE ON SCHEMA CORTEX_COOKBOOK.ML TO ROLE SYSADMIN;
GRANT CREATE SNOWFLAKE.ML.FORECAST ON SCHEMA CORTEX_COOKBOOK.ML TO ROLE SYSADMIN;
GRANT SELECT ON TABLE CORTEX_COOKBOOK.ML.MONTHLY_SALES TO ROLE SYSADMIN;
