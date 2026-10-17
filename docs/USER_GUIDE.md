# OmniDash — End-to-End User Guide & Architecture Reference 📊

> **The Definitive Manual for Business Analysts, Financial Controllers, Executives, and Data Practitioners**  
> *Version: 2.0.0 · Platform: Zero-Backend In-Browser Business Intelligence*

---

## Table of Contents

1. [Platform Overview & Core Architecture Philosophy](#1-platform-overview--core-architecture-philosophy)
2. [Data Ingestion, Profiling & Auto-Cleaning](#2-data-ingestion-profiling--auto-cleaning)
3. [Data Modeling Studio & Formula Engine](#3-data-modeling-studio--formula-engine)
4. [Executive KPI Management & Metric Math](#4-executive-kpi-management--metric-math)
5. [Visual Analytics & Chart Customization](#5-visual-analytics--chart-customization)
6. [On-Device AI Business Analyst (WASM Engine)](#6-on-device-ai-business-analyst-wasm-engine)
7. [Corporate Brand Master Template Studio](#7-corporate-brand-master-template-studio)
8. [Presentation Studio & Boardroom Export](#8-presentation-studio--boardroom-export)
9. [Workspace Persistence, Privacy & Performance Guidelines](#9-workspace-persistence-privacy--performance-guidelines)
10. [Frequently Asked Questions (FAQ) & Troubleshooting](#10-frequently-asked-questions-faq--troubleshooting)

---

## 1. Platform Overview & Core Architecture Philosophy

### 1.1 What is OmniDash?
OmniDash is an enterprise-grade business intelligence, statistical modeling, and boardroom presentation platform that runs **entirely in the user's web browser**. It merges the analytical depth of Power BI and Tableau with the visual polish of modern slide decks, all without requiring servers, cloud databases, API subscriptions, or software installations.

![Executive Dashboard View](./screenshots/dashboard_executive_view.png)

### 1.2 Core Architectural Principles & Behind-the-Scenes Mechanics

#### **A. Zero-Cloud / 100% Privacy-Preserving Runtime**
Traditional business intelligence platforms (e.g., Salesforce Tableau, Microsoft Power BI Cloud, Google Looker) require uploading confidential spreadsheets and databases to external cloud servers. For financial institutions, healthcare providers, and proprietary enterprises, this introduces data governance hurdles, compliance risks, and privacy review cycles.

* **Behind the Scenes**: OmniDash executes within the **browser JavaScript runtime sandbox**. 
  - Every calculation, aggregations, chart rendering, and formula evaluation happens in client-side memory (`RAM`).
  - Raw records, financial statements, and employee information **never cross the network wire**.
  - All network traffic is strictly zero (except when optionally pulling quantized AI models once for offline local caching).

#### **B. Standalone Single-File Distribution**
OmniDash can be packaged into a single, self-contained HTML file (`OmniDash_Business_Analytics_Standalone.html`, ~3 MB).
* **Behind the Scenes**: Leveraging `vite-plugin-singlefile`, all React code, Lucide icons, Chart.js modules, SheetJS Excel parsers, PDF engine, OpenXML template extractors, and CSS styles are inlined as base64-encoded bundles directly inside one file.
* **Why this matters**: You can save it on a USB stick, air-gap it on an offline laptop, or email it to a CFO or client as a regular file attachment. They simply double-click the file, and the entire BI suite launches instantly in any modern browser (Chrome, Edge, Safari, Firefox).

#### **C. Client-Side Persistence Architecture**
OmniDash implements a two-tier persistent storage layer:
1. **IndexedDB**: High-capacity client-side structured storage for uploaded tabular records, merged datasets, and custom views.
2. **LocalStorage**: Fast key-value store for workspace layout preferences, pinned widgets, filter state, active color themes, and custom brand templates.
* **Behind the Scenes**: Storage persistence is decoupled and debounced (400ms buffer). Keystrokes in search filters or quick card resizing operate in pure memory and write asynchronously to storage without frame drops or UI freezing.

---

## 2. Data Ingestion, Profiling & Auto-Cleaning

### 2.1 Supported File Formats
OmniDash provides a universal file ingestion pipeline that accepts:
* **Excel Workbooks** (`.xlsx`, `.xls`): Automatically extracts the primary worksheet with multi-tab selection support.
* **Delimited Files** (`.csv`, `.tsv`, `.txt`): Powered by PapaParse with automatic delimiter inference (comma, tab, semicolon, pipe).
* **Structured JSON** (`.json`): Flattens array-of-objects schemas automatically into clean tabular formats.
* **PDF Reports** (`.pdf`): Scans structured text tables from PDF documents and transforms them into analytical datasets.

### 2.2 Built-In Sample Datasets
For instant testing and evaluation, OmniDash includes four pre-loaded enterprise datasets:
1. **Enterprise Financials**: Quarterly revenue, cost of goods sold (COGS), operating expenses (OPEX), EBITDA, net margins, regions, and business divisions.
2. **SaaS Product Analytics**: Monthly recurring revenue (MRR), churn rate, customer acquisition cost (CAC), lifetime value (LTV), user seats, and engagement tiers.
3. **Omnichannel Retail Sales**: Store traffic, SKU category volumes, discounts, gross merchandise value (GMV), return rates, and shipping times.
4. **Manufacturing & Supply Chain**: Production yields, defect rates, machine downtime, warehouse utilization, and operational cycle times.

![Data Profiler](./screenshots/data_profiler_dark.png)

### 2.3 Behind the Scenes: Automated Profiling & Data Cleaning Pipeline
When a file is dropped into OmniDash, `cleanAndProfileDataset` executes a multi-pass heuristic pipeline:

```mermaid
graph TD
    A[Raw File / Buffer] --> B[Universal Parser: PapaParse / SheetJS / PDF.js]
    B --> C[Column Normalization & Header Clean]
    C --> D[Type Inference: Numeric vs Date vs Categorical]
    D --> E[Currency & Accounting Sanitizer: Remove $, €, commas, (1200) -> -1200]
    E --> F[Statistical Profiling: Cardinality, Min/Max, Mean, Missing %]
    F --> G[Smart Suggestion Engine: Primary Date Col & Recommended Metrics]
```

1. **Header Sanitization**: Trims whitespace, cleans control characters, and deduplicates identical header names.
2. **Numeric Sanitization**: Automatically strips currency signs (`$`, `€`, `£`, `¥`), percentage symbols (`%`), and thousand separators (`,`). Parses accounting negatives formatted in parentheses (e.g., `(2,450.00)` is correctly parsed into `-2450`).
3. **Date Detection**: Evaluates temporal patterns (ISO 8601, `YYYY-MM-DD`, `MM/DD/YYYY`, `DD-MMM-YYYY`) and assigns the primary chronological axis for time-series charts.
4. **Cardinality & Distribution**: Calculates null counts, unique distinct values, min, max, average, and recommends whether a column should serve as an analytical **Dimension** (categorical bucket) or a **Measure** (aggregatable metric).

---

## 3. Data Modeling Studio & Formula Engine

![Data Modeling Studio](./screenshots/data_modeling_modal.png)

### 3.1 Relational Hash Joins (Multi-Table Merging)
Often business answers require combining two distinct files—such as joining an **Orders** table with a **Customer Demographics** spreadsheet, or merging **Actuals** with **Budget Targets**.

#### How to Join Datasets in OmniDash:
1. Click **Data Modeling** in the top navigation bar.
2. Under **Merge Secondary Dataset**, upload or select your second table.
3. Choose the **Join Type**:
   - **Inner Join**: Keeps only records where the join key matches in both tables.
   - **Left Outer Join** *(Most Common)*: Keeps all primary table records, matching data from the secondary table where available.
   - **Right Outer Join**: Keeps all records from the secondary table.
   - **Full Outer Join**: Retains all rows from both datasets.
4. Select the matching key column in Table A and Table B (e.g., `CustomerID == Customer_ID`).
5. Click **Execute In-Memory Merge**. OmniDash produces a unified consolidated dataset ready for visualization.

* **Behind the Scenes**: Executes an in-memory **Hash Join** ($O(N + M)$ algorithmic complexity). A lookup hash map is constructed from the smaller dataset, allowing large tables (50,000+ rows) to merge in less than 50 milliseconds directly in browser RAM.

---

### 3.2 Advanced Compound Filtering Engine
The **Advanced Filters** dialog allows building multi-layer logic rules across multiple columns simultaneously:
* **Condition Operators**: Equals, Does Not Equal, Greater Than (`>`), Less Than (`<`), Contains, Starts With, Is Blank, Is Not Blank.
* **Boolean Logic**: Toggle between `AND` (all rules must be satisfied) and `OR` (any rule can match).
* **Safe State Reset**: When switching between different datasets, compound rules are automatically cleared to avoid filtering out newly loaded data.

---

### 3.3 Custom Formula & Calculated Fields Engine

![Formula Engine Modal](./screenshots/formula_engine_modal.png)

OmniDash includes an Excel-like formula builder that adds calculated columns to your dataset on the fly.

#### Formula Syntax & Token Substitution:
Columns are referenced in square brackets: `[ColumnName]`.

| Formula Pattern | Example Expression | Real-World Use Case |
|---|---|---|
| **Arithmetic** | `[Revenue] - [COGS]` | Gross Profit calculation |
| **Percentages & Margins** | `(([Revenue] - [COGS]) / [Revenue]) * 100` | Gross Margin % |
| **Conditional Logic** | `IF([Profit] > 0, [Revenue] * 0.05, 0)` | Sales commission calculation |
| **Multi-Argument Limits** | `MIN([Revenue], [Target])` | Capped performance quota |
| **Floor / Benchmark** | `MAX([COGS], 1000)` | Enforcing baseline expense thresholds |
| **Mathematical Functions** | `ROUND(SQRT([Variance]), 2)` | Volatility & variance metrics |

#### Supported Formula Functions:
- `+`, `-`, `*`, `/`, `(` , `)`: Standard arithmetic precedence.
- `IF(condition, true_value, false_value)`: Ternary conditional branching.
- `MIN(a, b)` / `MAX(a, b)`: Multi-argument boundary clipping.
- `ROUND(val, decimals)`: Standard precision rounding.
- `ABS(val)`: Absolute positive value.
- `SQRT(val)`: Square root.
- `LOG(val)` / `LN(val)`: Base-10 and natural logarithms.

* **Behind the Scenes (Security & Execution)**: User formulas are verified against a strict lexical character allowlist to eliminate code injection vectors. The engine compiles the expression into a vectorized row evaluator function, processing thousands of records with zero DOM lag.

---

## 4. Executive KPI Management & Metric Math

At the top of the dashboard sits the **Executive Scorecard**, displaying critical business velocity metrics at a glance.

![Theme Sapphire Ocean](./screenshots/theme_sapphire_ocean.png)

### 4.1 Configuring KPI Cards
Click the **Manage KPIs** button on the scorecard to:
- Add or remove metrics from the scorecard.
- Edit the display label (e.g., change `cogs_total` to `Cost of Goods Sold`).
- Choose aggregation methods: `SUM`, `AVG`, `MAX`, `MIN`, `COUNT`.
- Assign explicit formatting: Currency (`$`), Percentage (`%`), or Integer Number.

### 4.2 Period-Over-Period Delta & Sparklines
Each KPI card displays:
1. **Headline Value**: Formatted total with compact abbreviations (`$14.2M`, `840K`, `68.5%`).
2. **Delta Indicator**: Period-over-period percentage difference with color-coded positive (green) or negative (rose) badges.
3. **Miniature Sparkline**: 12-point trendline showing historical trajectory over time.

* **Behind the Scenes (Data Accuracy Fix)**:
  - Dates are parsed as true timestamps (`Date.parse()`) rather than alphanumeric strings, guaranteeing that dates like `1/15/2024` are placed chronologically before `2/1/2024`.
  - The dataset is divided chronologically into historical baseline vs. recent periods.
  - When a prior period baseline is zero, the delta is safely capped at $\pm 100\%$ rather than triggering an artificial division-by-one inflation (which previously caused inaccurate $+9900\%$ outputs).

### 4.3 Interactive KPI Deep-Dive Visualizer
Clicking any KPI card opens the **KPI Detail Modal**:
* **Distribution Quantiles**: Shows Median, 25th percentile, 75th percentile, Min, and Max.
* **Rolling Velocity**: Moving average trendline smoothing out short-term fluctuations.
* **Top Contributors**: Breakdown of which categorical dimension drove the largest share of this KPI.
* **One-Click Pin to Dashboard**: Transform any deep-dive chart into a permanent widget card with a single click.

---

## 5. Visual Analytics & Chart Customization

### 5.1 Supported Chart Types
OmniDash provides 10 specialized visualization engines powered by Chart.js 4.5:

| Chart Type | Best Suited For | Custom Capabilities |
|---|---|---|
| **Line Chart** | Temporal trends, sales trajectory, forecasting | Smooth cubic splines, chronological axis, rolling averages |
| **Bar Chart** | Categorical comparisons (Region, Product, Rep) | Vertical or horizontal orientation, sorted by value or name |
| **Stacked / Grouped Bar** | Multi-dimensional breakdowns (Region by Quarter) | Secondary dimension grouping with automatic legend toggle |
| **Donut / Ring** | Proportionate share, portfolio allocation | Cutout radius, hover expansion, percentage tooltips |
| **Area Chart** | Cumulative volume, cash flow progression | Translucent gradient fills, boundary clipping |
| **Radar Chart** | Competitor benchmarking, multi-variable scorecards | Web grid with customizable accent polygons |
| **Polar Area** | Cyclical or seasonal magnitude comparisons | Radial angular segments with high-contrast borders |
| **Waterfall Chart** | Net profit walk, budget variance, EBITDA breakdown | Starting pillars, delta steps, automatic `Net Total` pillar |
| **Gauge / Semi-Donut** | Target attainment, SLA tracking, utilization % | Target indicators with color-coded performance bands |
| **Pivot Table Matrix** | Two-dimensional cross-tabulations (Dept x Year) | Heatmap cell shading, true row/col mathematical averages |

---

### 5.2 Behind the Scenes: Statistical Calculation Engine

#### **A. Grouped MEDIAN Aggregation**
When analyzing skewed data (such as compensation, deal sizes, or transaction amounts), `AVG` is often distorted by extreme outliers. OmniDash supports `MEDIAN` as a native aggregation.
* **Behind the Scenes**: For both single series and grouped multi-series charts, values in each dimensional bucket are collected into numerical arrays, sorted ascendingly, and computed via median midpoint selection ($O(N \log N)$), rather than falling back to row counts.

#### **B. Waterfall Step Accumulation Logic**
Waterfall charts illustrate how an initial balance moves up and down across periods to reach a final total.
* **Behind the Scenes**: OmniDash tracks cumulative step deltas sequentially. Every intermediate period’s positive or negative shift is preserved in the running total. If the underlying data lacks a designated closing balance, an accurate **`Net Total`** pillar is automatically calculated and cleanly rendered at the end of the waterfall walk.

#### **C. Pivot Table Averages**
In cross-tabular matrices, a common software bug is taking the "average of averages" across table cells.
* **Behind the Scenes**: When `AVG` mode is selected in the OmniDash Pivot Table, the row totals, column totals, and grand total aggregate across the **raw underlying data points** for that row or column, guaranteeing mathematically rigorous enterprise accounting.

---

## 6. On-Device AI Business Analyst (WASM Engine)

OmniDash includes an on-device Artificial Intelligence assistant capable of answering natural language business questions, discovering anomalies, and summarizing strategic insights.

### 6.1 Private, Zero-Cloud Inference
* **How it works**: Uses `@wllama/wllama` to run lightweight, highly quantized Large Language Models (in `.gguf` format) directly inside browser WebAssembly.
* **Why it matters**: Your company's sensitive financials, customer lists, and strategic records **never leave your personal machine**. There are no OpenAI API keys required, no monthly token bills, and no third-party data tracking.

### 6.2 One-Click "Add Slide with AI Analysis"
When the AI Business Analyst provides an executive synthesis (e.g. highlighting margin leakage in European divisions or accelerating customer acquisition velocity):
1. Click the **Add Slide with AI Analysis** button below the message.
2. OmniDash automatically parses the AI response into structured executive takeaways and bullet points.
3. The **Presentation Studio** opens immediately with a newly generated, boardroom-ready **AI Strategic Intelligence Findings** slide appended to your deck.

---

## 7. Corporate Brand Master Template Studio

Corporate presentations must adhere to strict brand guidelines (company colors, official logos, approved fonts, and slide layouts).

![Brand Master Template Studio](./screenshots/brand_master_template_modal.png)

### 7.1 Importing PowerPoint Brand Templates (`.pptx` / `.potx`)
1. Click **Branding & Templates** in the navigation bar.
2. Drag and drop your company’s official PowerPoint template file (`.pptx` or `.potx`) into the drop zone.
3. OmniDash immediately parses the OpenXML package and extracts:
   - **Corporate Color Palette**: Primary brand color, secondary accent, surface background, and contrast text.
   - **Slide Canvas Background**: Dark mode or crisp white/light canvas theme.
   - **Brand Typography**: Heading font (e.g., Montserrat, Segoe UI, Arial) and Body font.
   - **Company Logo**: High-resolution vector or PNG emblem.
   - **Legal Disclaimer**: Automatic footer confidentiality notice.

### 7.2 Live Theme Reskinning
Once applied, the brand system automatically reskins both the **Live Interactive Dashboard** and the **Presentation Studio**. Charts dynamically adopt the corporate accent palette, and widgets mirror the company's official visual identity.

---

## 8. Presentation Studio & Boardroom Export

![Presentation Studio Deck](./screenshots/presentation_studio_brand_master.png)

The **Presentation Studio** bridges the gap between interactive data exploration and high-stakes executive briefings. Instead of taking manual screenshots and pasting them into PowerPoint, OmniDash auto-generates a synchronized 16:9 widescreen presentation deck.

### 8.1 Executive Slide Layouts
1. **Title Slide**: Clean boardroom cover with company metadata, presenter credentials, report date, and corporate accent stripe.
2. **KPI Spotlight Scorecard**: Four high-level metric cards paired with strategic narrative bullet points.
3. **Split Visual + Insights**: 60% live chart embed on the left; 40% glassmorphic executive takeaway findings on the right.
4. **Full Chart Visualizer**: Edge-to-edge chart display for detailed trajectory and cohort analysis.
5. **Strategic Conclusions**: Numbered action directives, board recommendations, and next-quarter initiatives.

### 8.2 Presenter Mode & Live Synchronization
- **Fullscreen Projection**: Click **Present** to project the deck in distraction-free 16:9 fullscreen.
- **Private Speaker Talking Notes**: Access personal speaker talking points with keyboard shortcuts (Arrow keys, Spacebar, ESC).
- **"Sync Live" Button**: Updated your dashboard filters or loaded new monthly numbers? Click **Sync Live** in the slide list header to instantly refresh the presentation deck with current metrics without rebuilding slides from scratch.

### 8.3 High-Fidelity Boardroom Exports

```
Export Capabilities:
├── PowerPoint (.pptx)        -> Real OpenXML shapes, editable text, brand palettes, embedded charts
├── Multi-Page PDF Deck       -> Complete 16:9 slide presentation compiled across all deck slides
├── Excel Workbook (.xlsx)    -> Raw records formatted as structured Excel table
├── CSV Dataset (.csv)        -> Plain-text delimited data for external ETL
├── High-Res Chart PNG        -> 2x retina snapshot of any individual card
└── All-Charts ZIP Archive    -> Packaged ZIP containing high-resolution PNGs of all active charts
```

* **Behind the Scenes (Isolated Image Capture)**:
  - Previous presentation tools often captured charts with unwanted UI buttons (drag handles, menus) or failed when viewing other tabs.
  - OmniDash features a dedicated **off-screen visual capture container**. Charts rendered for PowerPoint export use the exact corporate brand palette and canvas theme, completely isolated from dashboard controls, guaranteeing flawless slides regardless of the currently active tab.

---

## 9. Workspace Persistence, Privacy & Performance Guidelines

### 9.1 Data Capacity & Performance Guidelines
OmniDash has been optimized for rapid in-memory processing. The following benchmarks are based on standard modern laptops (16 GB RAM, Chrome/Edge):

| Dataset Size | Ingestion Time | Filter Response | Chart Redraw | Storage Mechanism |
|---|---|---|---|---|
| **1,000 – 10,000 rows** | < 0.2 seconds | Instant (< 5ms) | 60 FPS | LocalStorage + IndexedDB |
| **10,000 – 100,000 rows** | < 0.8 seconds | Instant (< 20ms) | Smooth | IndexedDB |
| **100,000 – 300,000 rows** | ~ 2.5 seconds | ~ 50ms | Optimized | IndexedDB (In-Memory Chunked) |

### 9.2 Performance Best Practices:
1. **Memoized Aggregations**: Chart aggregations and profiling passes are wrapped in React `useMemo` hooks to prevent redundant re-calculations during typing.
2. **Debounced Auto-Save**: Storage writes are delayed by 400ms following user input, preventing write bottlenecks on heavy search queries.
3. **Hardware Acceleration**: Ensure hardware acceleration is enabled in your browser settings (`chrome://settings/system`) for smooth 60 FPS animation on complex scatter and area graphs.

---

## 10. Frequently Asked Questions (FAQ) & Troubleshooting

#### Q1: Does my data ever leave my computer?
**No.** OmniDash has no backend servers, tracking telemetry, or remote databases. All data remains inside your browser's private sandbox. If you disconnect your internet cable, OmniDash continues to function with 100% feature parity.

#### Q2: Can I email the dashboard to a colleague who doesn't have OmniDash installed?
**Yes!** Send them `OmniDash_Business_Analytics_Standalone.html` (located in the root folder or in `OmniDash_Email_Package/`). When they double-click it, it opens in their default browser with full interactivity, charts, and presentation capabilities.

#### Q3: Why did my date column sort incorrectly?
Ensure your dates follow common formats such as `YYYY-MM-DD`, `MM/DD/YYYY`, or `DD-MMM-YYYY`. OmniDash's calculation engine automatically parses dates into UNIX timestamps for chronological sorting.

#### Q4: How do I export all dashboard charts at once?
Open the **Export** menu in the top navigation bar and select **All Charts (ZIP)**. OmniDash will automatically capture all active widget cards at 2x resolution and bundle them into a clean `.zip` archive.

#### Q5: Can I customize chart colors to match our brand?
**Yes.** Open **Branding & Templates** in the navbar. You can either upload your official PowerPoint template (`.pptx` / `.potx`) for automatic palette extraction, or manually customize your primary, accent, surface, and background colors.

---

*OmniDash is open-source and released under the MIT License.*  
*Repository: [navzar81-dev/Omni-Dash---Data-Analyser-and-Visualiser](https://github.com/navzar81-dev/Omni-Dash---Data-Analyser-and-Visualiser.git)*
