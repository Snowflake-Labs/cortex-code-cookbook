-- Sample data for the Advanced Analytics with Window Functions recipe.
-- Run this as ACCOUNTADMIN (or a role with sufficient privileges).

-- ---------------------------------------------------------------------------
-- 1. Warehouse, database, and schema
-- ---------------------------------------------------------------------------
CREATE WAREHOUSE IF NOT EXISTS ANALYTICS_WH
    WAREHOUSE_SIZE = 'XSMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE;

CREATE DATABASE IF NOT EXISTS CORTEX_COOKBOOK;
CREATE SCHEMA IF NOT EXISTS CORTEX_COOKBOOK.SQL;

USE WAREHOUSE ANALYTICS_WH;
USE SCHEMA CORTEX_COOKBOOK.SQL;

-- ---------------------------------------------------------------------------
-- 2. Daily sales table (6 months x 4 regions x ~180 days = 720 rows)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE DAILY_SALES (
    SALE_DATE   DATE,
    REGION      VARCHAR,
    PRODUCT     VARCHAR,
    UNITS_SOLD  INT,
    REVENUE     FLOAT
);

INSERT INTO DAILY_SALES
SELECT
    DATEADD('day', SEQ4() % 180, '2024-07-01'::DATE)       AS SALE_DATE,
    CASE SEQ4() % 4
        WHEN 0 THEN 'North'
        WHEN 1 THEN 'South'
        WHEN 2 THEN 'East'
        WHEN 3 THEN 'West'
    END                                                      AS REGION,
    CASE SEQ4() % 3
        WHEN 0 THEN 'Widget'
        WHEN 1 THEN 'Gadget'
        WHEN 2 THEN 'Gizmo'
    END                                                      AS PRODUCT,
    UNIFORM(10, 500, RANDOM())                               AS UNITS_SOLD,
    ROUND(UNIFORM(10, 500, RANDOM()) * UNIFORM(5, 50, RANDOM()), 2) AS REVENUE
FROM TABLE(GENERATOR(ROWCOUNT => 720));

-- ---------------------------------------------------------------------------
-- 3. Grants (adjust role name as needed)
-- ---------------------------------------------------------------------------
GRANT USAGE ON DATABASE CORTEX_COOKBOOK TO ROLE SYSADMIN;
GRANT USAGE ON SCHEMA CORTEX_COOKBOOK.SQL TO ROLE SYSADMIN;
GRANT SELECT ON TABLE CORTEX_COOKBOOK.SQL.DAILY_SALES TO ROLE SYSADMIN;
