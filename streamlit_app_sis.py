"""Monthly Sales Dashboard (SiS version)."""

import altair as alt
import pandas as pd
import streamlit as st
from snowflake.snowpark.context import get_active_session

st.set_page_config(page_title="Monthly Sales Dashboard", layout="wide")

session = get_active_session()
session.sql("USE WAREHOUSE TSHO_WH_XL").collect()


# ---------------------------------------------------------------------------
# Data Loading
# ---------------------------------------------------------------------------
@st.cache_data(ttl=600)
def load_data() -> pd.DataFrame:
    """Load data from the MONTHLY_SALES table."""
    df = session.sql(
        """
        SELECT
            SALE_DATE,
            PRODUCT_CATEGORY,
            REGION,
            SALES_AMOUNT,
            UNITS_SOLD,
            CUSTOMER_COUNT
        FROM TSHO_DB.TFT_DEMO_2026.MONTHLY_SALES
        ORDER BY SALE_DATE
        """
    ).to_pandas()
    df["SALE_DATE"] = pd.to_datetime(df["SALE_DATE"])
    df["YEAR"] = df["SALE_DATE"].dt.year
    df["YEAR_MONTH"] = df["SALE_DATE"].dt.to_period("M").astype(str)
    return df


df_raw = load_data()

# ---------------------------------------------------------------------------
# 1. Sidebar Filters
# ---------------------------------------------------------------------------
st.sidebar.header(":mag: Filters")

all_regions = sorted(df_raw["REGION"].unique().tolist())
selected_regions = st.sidebar.multiselect("Region", all_regions, default=all_regions)

all_categories = sorted(df_raw["PRODUCT_CATEGORY"].unique().tolist())
selected_categories = st.sidebar.multiselect(
    "Category", all_categories, default=all_categories
)

year_min = int(df_raw["YEAR"].min())
year_max = int(df_raw["YEAR"].max())
if year_min == year_max:
    selected_years = (year_min, year_max)
    st.sidebar.info(f"Year: {year_min}")
else:
    selected_years = st.sidebar.slider("Year", year_min, year_max, (year_min, year_max))

# Apply filters
df = df_raw[
    (df_raw["REGION"].isin(selected_regions))
    & (df_raw["PRODUCT_CATEGORY"].isin(selected_categories))
    & (df_raw["YEAR"] >= selected_years[0])
    & (df_raw["YEAR"] <= selected_years[1])
].copy()

st.title(":bar_chart: Monthly Sales Dashboard")

if df.empty:
    st.warning("No data found. Please adjust your filters.")
    st.stop()

# ---------------------------------------------------------------------------
# 2. KPI Row
# ---------------------------------------------------------------------------
total_sales = df["SALES_AMOUNT"].sum()
total_units = df["UNITS_SOLD"].sum()
total_customers = df["CUSTOMER_COUNT"].sum()
data_months = df["YEAR_MONTH"].nunique()

kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric(
    ":chart_with_upwards_trend: Total Sales",
    f"${total_sales:,.0f}",
)
kpi2.metric(":package: Total Units Sold", f"{total_units:,.0f}")
kpi3.metric(
    ":busts_in_silhouette: Total Customers",
    f"{total_customers:,.0f}",
)
kpi4.metric(":calendar: Data Months", f"{data_months} months")

st.divider()

# ---------------------------------------------------------------------------
# 3. Monthly Sales Trend by Category (Line Chart)
# ---------------------------------------------------------------------------
st.subheader(":chart_with_upwards_trend: Monthly Sales Trend by Category")

df_trend = df.groupby(["YEAR_MONTH", "PRODUCT_CATEGORY"], as_index=False)[
    "SALES_AMOUNT"
].sum()

sales_axis = alt.Axis(format=",.0f")

line_chart = (
    alt.Chart(df_trend)
    .mark_line(point=True)
    .encode(
        x=alt.X("YEAR_MONTH:O", title="Month", sort=None),
        y=alt.Y(
            "SALES_AMOUNT:Q",
            title="Sales Amount ($)",
            axis=sales_axis,
        ),
        color=alt.Color("PRODUCT_CATEGORY:N", title="Category"),
        tooltip=[
            alt.Tooltip("YEAR_MONTH:O", title="Month"),
            alt.Tooltip("PRODUCT_CATEGORY:N", title="Category"),
            alt.Tooltip(
                "SALES_AMOUNT:Q",
                title="Sales Amount",
                format=",.0f",
            ),
        ],
    )
    .properties(height=400)
    .interactive()
)
st.altair_chart(line_chart, use_container_width=True)

st.divider()

# ---------------------------------------------------------------------------
# 4. Top N Sales Ranking
# ---------------------------------------------------------------------------
st.subheader(":trophy: Sales Ranking")

top_n = st.slider("Number of entries", min_value=5, max_value=30, value=10)

df_ranking = (
    df.groupby(
        ["YEAR_MONTH", "PRODUCT_CATEGORY", "REGION"],
        as_index=False,
    )["SALES_AMOUNT"]
    .sum()
    .nlargest(top_n, "SALES_AMOUNT")
    .reset_index(drop=True)
)
df_ranking["LABEL"] = (
    df_ranking["YEAR_MONTH"]
    + " / "
    + df_ranking["PRODUCT_CATEGORY"]
    + " / "
    + df_ranking["REGION"]
)

col_chart, col_table = st.columns([3, 2])

with col_chart:
    bar_chart = (
        alt.Chart(df_ranking)
        .mark_bar()
        .encode(
            x=alt.X(
                "SALES_AMOUNT:Q",
                title="Sales Amount ($)",
                axis=sales_axis,
            ),
            y=alt.Y("LABEL:N", title="", sort="-x"),
            color=alt.Color("PRODUCT_CATEGORY:N", title="Category"),
            tooltip=[
                alt.Tooltip("YEAR_MONTH:O", title="Month"),
                alt.Tooltip("PRODUCT_CATEGORY:N", title="Category"),
                alt.Tooltip("REGION:N", title="Region"),
                alt.Tooltip(
                    "SALES_AMOUNT:Q",
                    title="Sales Amount",
                    format=",.0f",
                ),
            ],
        )
        .properties(height=max(top_n * 25, 250))
    )
    st.altair_chart(bar_chart, use_container_width=True)

with col_table:
    ranking_cols = [
        "YEAR_MONTH",
        "PRODUCT_CATEGORY",
        "REGION",
        "SALES_AMOUNT",
    ]
    df_ranking_display = df_ranking[ranking_cols].copy()
    df_ranking_display.columns = [
        "Month",
        "Category",
        "Region",
        "Sales Amount",
    ]
    df_ranking_display["Sales Amount"] = df_ranking_display["Sales Amount"].apply(
        lambda x: f"${x:,.0f}"
    )
    df_ranking_display.index = range(1, len(df_ranking_display) + 1)
    df_ranking_display.index.name = "Rank"
    st.dataframe(df_ranking_display)

st.divider()

# ---------------------------------------------------------------------------
# 5. Stacked Area Chart by Category
# ---------------------------------------------------------------------------
st.subheader(":world_map: Sales Composition Trend by Category")

df_area = df.groupby(["YEAR_MONTH", "PRODUCT_CATEGORY"], as_index=False)[
    "SALES_AMOUNT"
].sum()

area_chart = (
    alt.Chart(df_area)
    .mark_area()
    .encode(
        x=alt.X("YEAR_MONTH:O", title="Month", sort=None),
        y=alt.Y(
            "SALES_AMOUNT:Q",
            title="Sales Amount ($)",
            stack="zero",
            axis=sales_axis,
        ),
        color=alt.Color("PRODUCT_CATEGORY:N", title="Category"),
        tooltip=[
            alt.Tooltip("YEAR_MONTH:O", title="Month"),
            alt.Tooltip("PRODUCT_CATEGORY:N", title="Category"),
            alt.Tooltip(
                "SALES_AMOUNT:Q",
                title="Sales Amount",
                format=",.0f",
            ),
        ],
    )
    .properties(height=400)
    .interactive()
)
st.altair_chart(area_chart, use_container_width=True)

st.divider()

# ---------------------------------------------------------------------------
# 6. Region x Category Comparison
# ---------------------------------------------------------------------------
st.subheader(":earth_asia: Region x Category Comparison")

col_left, col_right = st.columns(2)

# Left: Sales trend by region (line chart)
with col_left:
    st.markdown("**Sales Trend by Region**")
    df_region_trend = df.groupby(["YEAR_MONTH", "REGION"], as_index=False)[
        "SALES_AMOUNT"
    ].sum()

    region_line = (
        alt.Chart(df_region_trend)
        .mark_line(point=True)
        .encode(
            x=alt.X("YEAR_MONTH:O", title="Month", sort=None),
            y=alt.Y(
                "SALES_AMOUNT:Q",
                title="Sales Amount ($)",
                axis=sales_axis,
            ),
            color=alt.Color("REGION:N", title="Region"),
            tooltip=[
                alt.Tooltip("YEAR_MONTH:O", title="Month"),
                alt.Tooltip("REGION:N", title="Region"),
                alt.Tooltip(
                    "SALES_AMOUNT:Q",
                    title="Sales Amount",
                    format=",.0f",
                ),
            ],
        )
        .properties(height=350)
        .interactive()
    )
    st.altair_chart(region_line, use_container_width=True)

# Right: Category breakdown per region (bar chart with facet)
with col_right:
    st.markdown("**Category Breakdown by Region**")
    df_region_cat = df.groupby(["REGION", "PRODUCT_CATEGORY"], as_index=False)[
        "SALES_AMOUNT"
    ].sum()

    region_bar = (
        alt.Chart(df_region_cat)
        .mark_bar()
        .encode(
            x=alt.X("PRODUCT_CATEGORY:N", title="Category"),
            y=alt.Y(
                "SALES_AMOUNT:Q",
                title="Sales Amount ($)",
                axis=sales_axis,
            ),
            color=alt.Color("PRODUCT_CATEGORY:N", title="Category"),
            column=alt.Column("REGION:N", title="Region"),
            tooltip=[
                alt.Tooltip("REGION:N", title="Region"),
                alt.Tooltip("PRODUCT_CATEGORY:N", title="Category"),
                alt.Tooltip(
                    "SALES_AMOUNT:Q",
                    title="Sales Amount",
                    format=",.0f",
                ),
            ],
        )
        .properties(width=120, height=300)
    )
    st.altair_chart(region_bar)

st.divider()

# ---------------------------------------------------------------------------
# 7. Detail Data Table
# ---------------------------------------------------------------------------
detail_cols = [
    "SALE_DATE",
    "PRODUCT_CATEGORY",
    "REGION",
    "SALES_AMOUNT",
    "UNITS_SOLD",
    "CUSTOMER_COUNT",
]
with st.expander(":clipboard: Detail Data Table"):
    df_detail = df[detail_cols].copy()
    df_detail.columns = [
        "Date",
        "Category",
        "Region",
        "Sales Amount",
        "Units Sold",
        "Customer Count",
    ]
    df_detail = df_detail.sort_values("Date", ascending=False).reset_index(drop=True)
    df_detail.index = df_detail.index + 1
    df_detail.index.name = "No."
    st.dataframe(df_detail)
