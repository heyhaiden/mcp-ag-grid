# AG Grid MCP Server - Usage Examples

This guide provides comprehensive examples of how to use the AG Grid MCP Server with Claude Desktop. These examples demonstrate real-world scenarios and show you exactly what to type to Claude to get powerful data visualization and analysis.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Grid Creation](#basic-grid-creation)
3. [Data Analysis Workflows](#data-analysis-workflows)
4. [Advanced Filtering and Sorting](#advanced-filtering-and-sorting)
5. [Export and Reporting](#export-and-reporting)
6. [Dashboard Creation](#dashboard-creation)
7. [Demo Scenarios](#demo-scenarios)
8. [Example Prompts for Testing](#example-prompts-for-testing)

## Quick Start

### 1. First Steps - Testing the Connection

**You:** Test if the AG Grid server is working

**Claude:** I'll test the AG Grid MCP server by checking what tools and resources are available.

*[Claude will list available tools and confirm the server is running]*

### 2. Load a Demo Scenario

**You:** Load the sales dashboard demo scenario

**Claude:** I'll load a pre-built sales dashboard scenario for you.

*[Claude will create a grid with sample sales data]*

## Basic Grid Creation

### Example 1: Creating a Simple Product Inventory Grid

**You:** Create a grid for product inventory with the following data:
- iPhone 15: 50 units, $999 each
- MacBook Pro: 25 units, $1999 each  
- iPad Air: 75 units, $599 each
- Apple Watch: 100 units, $399 each

Include columns for product name, units in stock, unit price, and total value.

**Expected Result:** Claude will create an AG Grid with:
- Sortable and filterable columns
- Calculated total value column
- Professional formatting
- Grid ID for further operations

**Sample Conversation:**

```
Claude: I'll create a product inventory grid for you with the data provided.

[Uses create_grid tool with:]
- columnDefs: product, unitsInStock, unitPrice, totalValue
- rowData: Your inventory items with calculated totals
- Grid features: sorting, filtering, number formatting

Your inventory grid has been created successfully! Grid ID: grid_123456

The grid shows:
- 4 products total
- 250 total units in stock  
- $162,475 total inventory value
- Sortable by any column
- Filterable for quick searches

Would you like me to apply any filters or sort the data in a specific way?
```

### Example 2: Employee Directory

**You:** Create an employee directory grid with departments, salaries, and contact information. Use the built-in sample employee data.

**Expected Flow:**
1. Claude loads sample employee data
2. Creates grid with appropriate columns
3. Offers analysis options

## Data Analysis Workflows

### Example 3: Sales Performance Analysis

**You:** Create a sales analysis dashboard. I want to see:
1. Total sales by region
2. Top performing products
3. Sales trends over time
4. Rep performance comparison

Load sample sales data and create multiple views.

**Detailed Workflow:**

```
User: Create a comprehensive sales analysis dashboard

Claude: I'll create a sales analysis dashboard using our sample sales data. Let me start by loading the sales scenario and then create several views for your analysis.

[Step 1: Load sales data]
Creating sales grid with sample data...
✓ Grid created with 100 sales records

[Step 2: Regional Analysis]
Let me filter the data to show regional performance...
- North America: $245,000 (35%)
- Europe: $180,000 (26%)  
- Asia Pacific: $165,000 (24%)
- Latin America: $75,000 (11%)
- Middle East & Africa: $35,000 (4%)

[Step 3: Product Performance]
Top 5 products by revenue:
1. MacBook Pro: $89,500
2. iPhone 15: $67,200
3. Surface Laptop: $45,800
4. iPad Air: $32,100
5. Dell XPS 13: $28,400

[Step 4: Export Options]
I can export this analysis as:
- CSV for spreadsheet analysis
- Formatted report
- Filtered datasets

Would you like me to apply specific filters or create additional views?
```

### Example 4: Data Quality Assessment

**You:** Analyze the data quality of the employee dataset. Show me:
- Missing values
- Data completeness
- Salary distribution
- Department breakdown

**Expected Analysis:**
```
Claude: I'll analyze the data quality of our employee dataset.

[Uses get_grid_stats tool]

Data Quality Report:
📊 Dataset Overview:
- Total employees: 50
- Columns: 14
- Data completeness: 98.5%

🔍 Missing Values:
- Manager field: 2 missing (4%)
- Bonus field: 1 missing (2%)
- All other fields: Complete

💰 Salary Analysis:
- Range: $45,000 - $280,000
- Average: $95,750
- Median: $87,500
- Distribution: Normal with slight right skew

🏢 Department Breakdown:
- Engineering: 18 employees (36%)
- Sales: 12 employees (24%)
- Marketing: 8 employees (16%)
- Finance: 6 employees (12%)
- HR: 4 employees (8%)
- Operations: 2 employees (4%)

The dataset shows high quality with minimal missing values and realistic salary distributions.
```

## Advanced Filtering and Sorting

### Example 5: Complex Business Queries

**You:** From the sales data, show me:
- Sales over $10,000 from Q4 2024
- Only from North America and Europe
- Sorted by profit margin descending
- Group by sales rep performance

**Advanced Filtering Workflow:**

```
Claude: I'll apply multiple filters to analyze high-value Q4 sales from your key regions.

[Step 1: Apply date filter]
Filtering for Q4 2024 (Oct-Dec)...
✓ 32 records found

[Step 2: Revenue filter]  
Adding revenue filter > $10,000...
✓ 18 records remain

[Step 3: Regional filter]
Limiting to North America and Europe...
✓ 12 records in final dataset

[Step 4: Sort by profit margin]
Sorting by profit margin (highest first)...

Top Results:
1. John Smith - MacBook Pro sale: 45.2% margin, $15,750 revenue
2. Sarah Johnson - iPhone 15 bulk: 42.8% margin, $12,400 revenue  
3. Michael Chen - Surface Studio: 38.5% margin, $11,200 revenue

[Step 5: Rep Performance Summary]
Q4 High-Value Sales Leaders:
- John Smith: 4 sales, $47,300 total, 41.2% avg margin
- Sarah Johnson: 3 sales, $35,800 total, 39.8% avg margin
- Michael Chen: 2 sales, $23,900 total, 36.1% avg margin

Would you like me to export this filtered data or create additional analysis?
```

### Example 6: Financial Data Analysis

**You:** Analyze spending patterns from the financial transaction data:
- Monthly spending by category
- Identify unusual transactions
- Show cash flow trends

## Export and Reporting

### Example 7: Automated Reporting

**You:** Create a monthly sales report that includes:
- Summary statistics
- Regional breakdown
- Export as CSV
- Include executive summary

**Reporting Workflow:**

```
Claude: I'll generate a comprehensive monthly sales report for you.

[Step 1: Data Aggregation]
Analyzing current sales data...
- Time period: Last 30 days
- Total records: 47 sales

[Step 2: Summary Statistics]
📈 Monthly Performance:
- Total Revenue: $187,500
- Total Transactions: 47
- Average Deal Size: $3,989
- Growth vs Previous Month: +12.5%

[Step 3: Regional Performance]
🌍 Regional Breakdown:
- North America: $82,500 (44%) - Target: 40% ✓
- Europe: $56,250 (30%) - Target: 35% ⚠️
- Asia Pacific: $37,500 (20%) - Target: 20% ✓
- Other Regions: $11,250 (6%) - Target: 5% ✓

[Step 4: Export Generation]
Exporting detailed data as CSV...
✓ sales_report_2024_06.csv generated (2.3KB)

[Step 5: Executive Summary]
🎯 Key Insights:
- Strong month with above-target growth
- North America overperforming expectations
- Europe slightly underperforming - recommend focus
- Product mix healthy across all categories

The complete report is ready for download and contains all transaction details for further analysis.
```

## Dashboard Creation

### Example 8: Multi-Grid Dashboard

**You:** Create a comprehensive business dashboard with:
1. Sales performance grid
2. Employee metrics grid  
3. Financial overview grid

Connect them so I can analyze relationships between sales, staffing, and finances.

**Dashboard Creation Process:**

```
Claude: I'll create a comprehensive business dashboard with three interconnected grids.

[Grid 1: Sales Performance]
Creating sales performance grid...
✓ Sales Grid ID: grid_sales_001
- 100 sales records loaded
- Columns: Date, Product, Rep, Revenue, Profit
- Features: Real-time filtering, export ready

[Grid 2: Employee Metrics]  
Creating employee metrics grid...
✓ Employee Grid ID: grid_emp_001
- 50 employee records loaded
- Columns: Name, Department, Performance, Salary
- Features: Department filtering, performance analysis

[Grid 3: Financial Overview]
Creating financial overview grid...
✓ Financial Grid ID: grid_fin_001  
- 200 transaction records loaded
- Columns: Date, Category, Amount, Balance
- Features: Cash flow analysis, spending categories

🔗 Dashboard Connections:
- Sales reps linked to employee data
- Revenue tied to financial transactions
- Department performance correlations available

📊 Quick Insights:
- Sales team (12 people) generated $487K revenue
- Average revenue per sales employee: $40.5K
- Sales department salary cost: $1.2M (ROI: 40.6%)

Your dashboard is ready! You can now ask questions like:
- "Which sales reps are most cost-effective?"
- "How does department size correlate with revenue?"
- "Show me spending patterns during high sales months"
```

## Demo Scenarios

### Quick Demo Commands

These commands load pre-built scenarios for immediate testing:

```markdown
# Load Sales Dashboard
"Load the sales dashboard demo scenario"

# Load Employee Analysis  
"Set up the employee analysis demo"

# Load Financial Dashboard
"Create the financial analysis demo scenario"

# Load E-commerce Analytics
"Load the e-commerce demo with product performance data"

# Load Multi-Department Analysis
"Set up the complete business intelligence demo"
```

## Example Prompts for Testing

### Basic Functionality Tests

```markdown
1. "Test the AG Grid server connection"
2. "Show me what tools are available"
3. "Create a simple grid with sample data"
4. "List all active grids"
5. "Export a grid as CSV"
```

### Data Analysis Tests

```markdown
1. "Create a sales analysis with sample data and show me the top products"
2. "Filter the employee data to show only engineering department with salaries over $80k"
3. "Sort the financial transactions by amount and show the largest expenses"
4. "Calculate the total revenue by region and export as Excel"
5. "Show me data quality statistics for all datasets"
```

### Advanced Feature Tests

```markdown
1. "Create a dashboard with sales, employee, and financial data"
2. "Apply complex filters: sales over $5000 from Q4 in North America"
3. "Generate a monthly report with statistics and export options"
4. "Analyze the correlation between sales performance and employee metrics"
5. "Create a filtered view showing only high-performing sales reps and their deals"
```

### Error Handling Tests

```markdown
1. "Try to access a grid that doesn't exist"
2. "Apply an invalid filter to test error handling"
3. "Export data in an unsupported format"
4. "Create a grid with invalid column definitions"
5. "Test the server behavior with malformed data"
```

### Performance Tests

```markdown
1. "Create multiple grids simultaneously and test performance"
2. "Load large datasets and test filtering speed"
3. "Test export performance with different data sizes"
4. "Monitor memory usage during grid operations"
5. "Test concurrent operations on multiple grids"
```

## Real-World Scenarios

### Scenario 1: Sales Manager Daily Workflow

```markdown
User: "I'm a sales manager starting my day. Set up my daily dashboard."

Expected Claude Response:
1. Create sales performance grid for current month
2. Show team performance metrics
3. Highlight deals requiring attention
4. Provide quick export options for leadership reports
```

### Scenario 2: HR Analytics

```markdown
User: "I need to analyze our hiring and compensation data for the quarterly review."

Expected Claude Response:
1. Load employee data with hiring dates
2. Calculate department growth rates
3. Analyze salary equity across departments
4. Generate compensation benchmarking report
```

### Scenario 3: Financial Planning

```markdown
User: "Help me analyze our spending patterns to prepare the budget for next quarter."

Expected Claude Response:
1. Load financial transaction data
2. Categorize spending by department and type
3. Identify trends and anomalies
4. Create budget recommendations based on historical data
```

### Scenario 4: Product Performance Review

```markdown
User: "I need to present product performance data to the board. Show me what's working and what isn't."

Expected Claude Response:
1. Create product sales analysis grid
2. Calculate metrics: revenue, units sold, profit margins
3. Identify top and bottom performers
4. Generate executive summary with key insights
```

## Tips for Best Results

### 1. Be Specific About Your Needs
- **Good**: "Create a sales grid with Q4 data, sorted by revenue, showing only deals over $5000"
- **Better**: "Create a quarterly sales performance analysis with revenue filtering, regional breakdown, and export to Excel for board presentation"

### 2. Use Progressive Refinement
1. Start with basic grid creation
2. Add filters and sorting
3. Request analysis and insights
4. Export or create reports

### 3. Leverage Built-in Scenarios
- Use demo scenarios for quick starts
- Modify scenarios to match your data
- Combine multiple scenarios for comprehensive analysis

### 4. Take Advantage of Export Features
- CSV for spreadsheet analysis
- Excel for formatted reports
- Use exports to share with stakeholders

### 5. Ask for Insights
- Request data quality analysis
- Ask for trend identification
- Get recommendations based on data patterns

## Next Steps

After trying these examples:

1. **Explore Advanced Features**: Try custom filtering, complex sorting, statistical analysis
2. **Create Custom Scenarios**: Build your own demo scenarios for recurring analysis needs
3. **Integrate with Workflows**: Use exports in your existing reporting processes
4. **Scale Up**: Test with larger datasets and more complex requirements

Remember: The AG Grid MCP Server is designed to handle complex data analysis tasks. Don't hesitate to ask Claude for sophisticated analysis, multi-step workflows, or creative data visualization approaches!