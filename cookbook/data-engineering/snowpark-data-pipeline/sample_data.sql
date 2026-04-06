-- Sample data for the Snowpark Data Pipeline recipe.
-- Run this as ACCOUNTADMIN (or a role with sufficient privileges).

-- ---------------------------------------------------------------------------
-- 1. Warehouse, database, and schema
-- ---------------------------------------------------------------------------
CREATE WAREHOUSE IF NOT EXISTS PIPELINE_WH
    WAREHOUSE_SIZE = 'XSMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE;

CREATE DATABASE IF NOT EXISTS CORTEX_COOKBOOK;
CREATE SCHEMA IF NOT EXISTS CORTEX_COOKBOOK.DATA_ENGINEERING;

USE WAREHOUSE PIPELINE_WH;
USE SCHEMA CORTEX_COOKBOOK.DATA_ENGINEERING;

-- ---------------------------------------------------------------------------
-- 2. Raw orders table (200 rows of e-commerce orders)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE RAW_ORDERS (
    ORDER_ID     INT,
    CUSTOMER_ID  INT,
    PRODUCT      VARCHAR,
    QUANTITY     INT,
    UNIT_PRICE   FLOAT,
    ORDER_DATE   DATE,
    STATUS       VARCHAR,
    REGION       VARCHAR
);

INSERT INTO RAW_ORDERS
SELECT
    ROW_NUMBER() OVER (ORDER BY SEQ4())                      AS ORDER_ID,
    UNIFORM(1000, 1200, RANDOM())                            AS CUSTOMER_ID,
    CASE UNIFORM(1, 5, RANDOM())
        WHEN 1 THEN 'Laptop'
        WHEN 2 THEN 'Monitor'
        WHEN 3 THEN 'Keyboard'
        WHEN 4 THEN 'Mouse'
        WHEN 5 THEN 'Headset'
    END                                                       AS PRODUCT,
    UNIFORM(1, 10, RANDOM())                                 AS QUANTITY,
    CASE UNIFORM(1, 5, RANDOM())
        WHEN 1 THEN 999.99
        WHEN 2 THEN 349.99
        WHEN 3 THEN 79.99
        WHEN 4 THEN 49.99
        WHEN 5 THEN 129.99
    END                                                       AS UNIT_PRICE,
    DATEADD('day', UNIFORM(0, 364, RANDOM()), '2024-01-01')  AS ORDER_DATE,
    CASE UNIFORM(1, 4, RANDOM())
        WHEN 1 THEN 'completed'
        WHEN 2 THEN 'shipped'
        WHEN 3 THEN 'pending'
        WHEN 4 THEN 'cancelled'
    END                                                       AS STATUS,
    CASE UNIFORM(1, 4, RANDOM())
        WHEN 1 THEN 'North'
        WHEN 2 THEN 'South'
        WHEN 3 THEN 'East'
        WHEN 4 THEN 'West'
    END                                                       AS REGION
FROM TABLE(GENERATOR(ROWCOUNT => 200));

-- ---------------------------------------------------------------------------
-- 3. Grants (adjust role name as needed)
-- ---------------------------------------------------------------------------
GRANT USAGE ON DATABASE CORTEX_COOKBOOK TO ROLE SYSADMIN;
GRANT USAGE ON SCHEMA CORTEX_COOKBOOK.DATA_ENGINEERING TO ROLE SYSADMIN;
GRANT SELECT ON TABLE CORTEX_COOKBOOK.DATA_ENGINEERING.RAW_ORDERS TO ROLE SYSADMIN;
GRANT CREATE TABLE ON SCHEMA CORTEX_COOKBOOK.DATA_ENGINEERING TO ROLE SYSADMIN;
