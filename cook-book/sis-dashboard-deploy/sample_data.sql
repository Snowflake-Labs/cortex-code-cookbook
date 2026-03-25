-- Sample data and role setup for the Monthly Sales Dashboard.
-- Run this as ACCOUNTADMIN (or a role with sufficient privileges).

-- ---------------------------------------------------------------------------
-- 1. Role and warehouse for deploying the Streamlit app
-- ---------------------------------------------------------------------------
CREATE ROLE IF NOT EXISTS SIS_DEPLOY_ROLE;
GRANT ROLE SIS_DEPLOY_ROLE TO ROLE SYSADMIN;

CREATE WAREHOUSE IF NOT EXISTS TSHO_WH_XL
    WAREHOUSE_SIZE = 'XLARGE'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE;

GRANT USAGE ON WAREHOUSE TSHO_WH_XL TO ROLE SIS_DEPLOY_ROLE;

-- ---------------------------------------------------------------------------
-- 2. Database, schema, and table
-- ---------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS TSHO_DB;
CREATE SCHEMA IF NOT EXISTS TSHO_DB.TSHO_SCHEMA;

GRANT USAGE ON DATABASE TSHO_DB TO ROLE SIS_DEPLOY_ROLE;
GRANT USAGE ON SCHEMA TSHO_DB.TSHO_SCHEMA TO ROLE SIS_DEPLOY_ROLE;
GRANT CREATE STREAMLIT ON SCHEMA TSHO_DB.TSHO_SCHEMA TO ROLE SIS_DEPLOY_ROLE;
GRANT CREATE STAGE ON SCHEMA TSHO_DB.TSHO_SCHEMA TO ROLE SIS_DEPLOY_ROLE;
GRANT SELECT ON ALL TABLES IN SCHEMA TSHO_DB.TSHO_SCHEMA TO ROLE SIS_DEPLOY_ROLE;

CREATE OR REPLACE TABLE TSHO_DB.TSHO_SCHEMA.SIS_DASHBOARD_DEMO (
    SALE_DATE       DATE,
    PRODUCT_CATEGORY VARCHAR,
    REGION          VARCHAR,
    SALES_AMOUNT    NUMBER(18, 2),
    UNITS_SOLD      NUMBER,
    CUSTOMER_COUNT  NUMBER
);

INSERT INTO TSHO_DB.TSHO_SCHEMA.SIS_DASHBOARD_DEMO VALUES
    ('2025-01-15', 'Electronics', 'North America', 125000.00, 320, 180),
    ('2025-01-15', 'Electronics', 'Europe',         98000.00, 250, 140),
    ('2025-01-15', 'Electronics', 'Asia Pacific',  110000.00, 290, 160),
    ('2025-01-15', 'Clothing',    'North America',  85000.00, 1200, 420),
    ('2025-01-15', 'Clothing',    'Europe',          72000.00, 980, 350),
    ('2025-01-15', 'Clothing',    'Asia Pacific',    68000.00, 920, 310),
    ('2025-01-15', 'Food',        'North America',  95000.00, 4500, 890),
    ('2025-01-15', 'Food',        'Europe',          78000.00, 3800, 720),
    ('2025-01-15', 'Food',        'Asia Pacific',    82000.00, 4100, 780),
    ('2025-02-15', 'Electronics', 'North America', 132000.00, 340, 190),
    ('2025-02-15', 'Electronics', 'Europe',        102000.00, 260, 148),
    ('2025-02-15', 'Electronics', 'Asia Pacific',  115000.00, 300, 170),
    ('2025-02-15', 'Clothing',    'North America',  78000.00, 1100, 390),
    ('2025-02-15', 'Clothing',    'Europe',          69000.00, 940, 330),
    ('2025-02-15', 'Clothing',    'Asia Pacific',    65000.00, 880, 295),
    ('2025-02-15', 'Food',        'North America', 101000.00, 4800, 920),
    ('2025-02-15', 'Food',        'Europe',          82000.00, 3950, 740),
    ('2025-02-15', 'Food',        'Asia Pacific',    87000.00, 4300, 810),
    ('2025-03-15', 'Electronics', 'North America', 140000.00, 360, 200),
    ('2025-03-15', 'Electronics', 'Europe',        108000.00, 275, 155),
    ('2025-03-15', 'Electronics', 'Asia Pacific',  122000.00, 315, 178),
    ('2025-03-15', 'Clothing',    'North America',  92000.00, 1350, 460),
    ('2025-03-15', 'Clothing',    'Europe',          80000.00, 1080, 380),
    ('2025-03-15', 'Clothing',    'Asia Pacific',    74000.00, 1000, 340),
    ('2025-03-15', 'Food',        'North America', 105000.00, 5000, 960),
    ('2025-03-15', 'Food',        'Europe',          85000.00, 4100, 770),
    ('2025-03-15', 'Food',        'Asia Pacific',    90000.00, 4400, 840),
    ('2025-04-15', 'Electronics', 'North America', 128000.00, 330, 185),
    ('2025-04-15', 'Electronics', 'Europe',         95000.00, 245, 135),
    ('2025-04-15', 'Electronics', 'Asia Pacific',  118000.00, 305, 172),
    ('2025-04-15', 'Clothing',    'North America',  98000.00, 1400, 480),
    ('2025-04-15', 'Clothing',    'Europe',          84000.00, 1140, 400),
    ('2025-04-15', 'Clothing',    'Asia Pacific',    79000.00, 1060, 360),
    ('2025-04-15', 'Food',        'North America',  99000.00, 4700, 900),
    ('2025-04-15', 'Food',        'Europe',          80000.00, 3900, 730),
    ('2025-04-15', 'Food',        'Asia Pacific',    85000.00, 4200, 800),
    ('2025-05-15', 'Electronics', 'North America', 145000.00, 375, 210),
    ('2025-05-15', 'Electronics', 'Europe',        112000.00, 285, 162),
    ('2025-05-15', 'Electronics', 'Asia Pacific',  130000.00, 335, 188),
    ('2025-05-15', 'Clothing',    'North America',  88000.00, 1250, 430),
    ('2025-05-15', 'Clothing',    'Europe',          75000.00, 1020, 360),
    ('2025-05-15', 'Clothing',    'Asia Pacific',    70000.00, 950, 320),
    ('2025-05-15', 'Food',        'North America', 108000.00, 5100, 980),
    ('2025-05-15', 'Food',        'Europe',          88000.00, 4250, 800),
    ('2025-05-15', 'Food',        'Asia Pacific',    93000.00, 4550, 860),
    ('2025-06-15', 'Electronics', 'North America', 138000.00, 355, 198),
    ('2025-06-15', 'Electronics', 'Europe',        105000.00, 268, 152),
    ('2025-06-15', 'Electronics', 'Asia Pacific',  125000.00, 322, 182),
    ('2025-06-15', 'Clothing',    'North America', 102000.00, 1450, 500),
    ('2025-06-15', 'Clothing',    'Europe',          87000.00, 1180, 415),
    ('2025-06-15', 'Clothing',    'Asia Pacific',    82000.00, 1100, 375),
    ('2025-06-15', 'Food',        'North America', 103000.00, 4900, 940),
    ('2025-06-15', 'Food',        'Europe',          84000.00, 4050, 760),
    ('2025-06-15', 'Food',        'Asia Pacific',    89000.00, 4350, 830);
