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

## Prompt for Creating SiS Dashboard

```
 Create a Streamlit-in-Snowflake (SiS) Python app for a Monthly Sales Dashboard that reads
    from a table called SIS_DASHBOARD_DEMO with these columns:

      SALE_DATE (DATE), PRODUCT_CATEGORY (VARCHAR), REGION (VARCHAR),
      SALES_AMOUNT (NUMBER), UNITS_SOLD (NUMBER), CUSTOMER_COUNT (NUMBER)

    The table contains monthly sales data across 3 product categories (Electronics, Clothing, Food)
    and 3 regions (North America, Europe, Asia Pacific).

    Requirements:

    1. Use get_active_session() from snowflake.snowpark.context for the Snowflake connection.
       Cache data with @st.cache_data(ttl=600). Derive YEAR and YEAR_MONTH columns from SALE_DATE.

    2. Sidebar filters: multi-select for Region and Category (default: all selected),
       year range slider. Apply all filters before rendering any charts.

    3. KPI row: 4 metrics in columns -- Total Sales (formatted as $X,XXX), Total Units Sold,
       Total Customers, and Data Months (count of distinct months).

    4. Monthly Sales Trend by Category: Altair line chart with points, YEAR_MONTH on x-axis,
       SALES_AMOUNT on y-axis, colored by PRODUCT_CATEGORY. Interactive with tooltips.

    5. Sales Ranking: a slider for top N (5-30, default 10). Show a horizontal bar chart
       (sorted descending) alongside a ranked data table. Group by month/category/region,
       take the top N by SALES_AMOUNT. Format sales as currency in the table.

    6. Stacked Area Chart: sales composition over time by category using mark_area with
       stack="zero".

    7. Region x Category Comparison: two-column layout.
       Left: line chart of sales trend by region.
       Right: grouped bar chart of total sales by category, faceted by region using alt.Column.

    8. Detail Data Table: inside an st.expander, show all filtered rows sorted by date
       descending with a 1-based index.

    Use wide layout, st.divider() between sections, and format all sales axes with comma
    separators. Use Altair for all charts. Add descriptive emoji headers for each section.

    Also create:
    - A sample_data.sql file that creates the role, warehouse, database, schema, table,
      and inserts 54 rows of demo data (6 months x 3 categories x 3 regions).
    - A snowflake.yml Snowflake CLI project definition (v2) for deploying the app.
```

## Dashboard Features

- **KPI row** -- total sales, units sold, customers, and data months
- **Monthly sales trend** -- line chart by product category
- **Sales ranking** -- top N bar chart and table
- **Stacked area chart** -- sales composition over time by category
- **Region x Category comparison** -- regional trend lines and category breakdown
- **Detail data table** -- expandable raw data view
- **Sidebar filters** -- region, category, and year range

## Manual Deploy

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
