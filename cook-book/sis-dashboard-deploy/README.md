# SiS Dashboard Deploy

Deploy a monthly sales dashboard to Snowflake as a Streamlit in Snowflake (SiS) app using the Snowflake CLI.

## Files

| File | Description |
|---|---|
| `streamlit_app_sis.py` | Streamlit dashboard app |
| `snowflake.yml` | Snowflake CLI project definition |

## Prerequisites

- [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/index) installed and configured
- A Snowflake account with a `SIS_DASHBOARD_DEMO` table in `TSHO_DB.TSHO_SCHEMA`
- The `PYPI_ACCESS_INTEGRATION` external access integration created in your account

## Dashboard Features

- **KPI row** -- total sales, units sold, customers, and data months
- **Monthly sales trend** -- line chart by product category
- **Sales ranking** -- top N bar chart and table
- **Stacked area chart** -- sales composition over time by category
- **Region x Category comparison** -- regional trend lines and category breakdown
- **Detail data table** -- expandable raw data view
- **Sidebar filters** -- region, category, and year range

## Deploy

```bash
snow streamlit deploy monthly_sales_dashboard
```

## Source Table Schema

The app expects a `SIS_DASHBOARD_DEMO` table with the following columns:

| Column | Type |
|---|---|
| `SALE_DATE` | DATE |
| `PRODUCT_CATEGORY` | VARCHAR |
| `REGION` | VARCHAR |
| `SALES_AMOUNT` | NUMBER |
| `UNITS_SOLD` | NUMBER |
| `CUSTOMER_COUNT` | NUMBER |
