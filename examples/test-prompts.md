# Test Prompts for AG Grid MCP Server

This file contains example prompts you can use to test the AG Grid MCP Server functionality with Claude Desktop. Copy and paste these prompts directly into your conversation with Claude.

## Table of Contents

1. [Basic Functionality Tests](#basic-functionality-tests)
2. [Demo Scenario Tests](#demo-scenario-tests)
3. [Data Analysis Tests](#data-analysis-tests)
4. [Export and Filtering Tests](#export-and-filtering-tests)
5. [Advanced Feature Tests](#advanced-feature-tests)
6. [Error Handling Tests](#error-handling-tests)
7. [Performance Tests](#performance-tests)
8. [Help and Information Tests](#help-and-information-tests)

## Basic Functionality Tests

### Test 1: Server Connection and Help
```
Test if the AG Grid MCP server is working properly and show me what capabilities are available.
```

### Test 2: Server Information
```
Get detailed information about the AG Grid server including its capabilities and current status.
```

### Test 3: List Available Tools
```
Show me all the tools available in the AG Grid server and what each one does.
```

### Test 4: Basic Grid Creation
```
Create a simple grid with the following sample data:
- Product: iPhone 15, Price: 999, Stock: 50
- Product: MacBook Pro, Price: 1999, Stock: 25
- Product: iPad Air, Price: 599, Stock: 75

Include columns for product name, price, and stock quantity.
```

### Test 5: Check Active Grids
```
Show me information about all currently active grids.
```

## Demo Scenario Tests

### Test 6: List Demo Scenarios
```
Show me all available demo scenarios with their descriptions and sample questions.
```

### Test 7: Load Sales Dashboard
```
Load the sales dashboard demo scenario and show me what data is available.
```

### Test 8: Load Employee Analytics
```
Set up the employee analytics demo scenario and give me an overview of the data.
```

### Test 9: Load Financial Analysis
```
Create the financial analysis demo scenario and show me the key insights.
```

### Test 10: Load E-commerce Performance
```
Load the e-commerce performance demo scenario and explain what analysis I can do with it.
```

### Test 11: Load Business Intelligence Dashboard
```
Set up the comprehensive business intelligence demo scenario that combines multiple data types.
```

## Data Analysis Tests

### Test 12: Sales Analysis
```
Using the sales dashboard data, show me:
1. Top 5 products by revenue
2. Best performing sales region
3. Average deal size
4. Total profit margins
```

### Test 13: Employee Compensation Analysis
```
Using employee data, analyze:
1. Average salary by department
2. Highest paid employees
3. Salary distribution across locations
4. Performance ratings breakdown
```

### Test 14: Financial Spending Analysis
```
With financial transaction data, show me:
1. Spending by category
2. Largest transactions this month
3. Cash flow trends
4. Top merchants by spending
```

### Test 15: Regional Sales Comparison
```
Compare sales performance across different regions and identify which region has the best profit margins.
```

### Test 16: Product Category Performance
```
Analyze product performance by category and show me which categories generate the most revenue.
```

## Export and Filtering Tests

### Test 17: Basic Filtering
```
Filter the sales data to show only:
- Sales over $10,000
- From North America region
- Status is 'completed'
```

### Test 18: Date Range Filtering
```
Show me all sales from Q4 2024 (October-December) and sort them by revenue descending.
```

### Test 19: Employee Department Filtering
```
Filter employees to show only:
- Engineering department
- Salary over $80,000
- Active employees only
```

### Test 20: Export to CSV
```
Export the current grid data as a CSV file and show me the first few rows.
```

### Test 21: Complex Multi-Filter
```
Apply multiple filters to show:
- High-value sales (over $15,000)
- From excellent-performing sales reps
- In technology product categories
- Export the results
```

## Advanced Feature Tests

### Test 22: Grid Statistics
```
Get comprehensive statistics for the current grid including data quality metrics, filter status, and performance information.
```

### Test 23: Multiple Grid Management
```
Create two different grids - one with sales data and one with employee data. Show me information about both grids.
```

### Test 24: Grid Method Execution
```
Execute the 'selectAll' method on the current grid and then get the count of selected rows.
```

### Test 25: Data Quality Analysis
```
Analyze the data quality of the employee dataset and tell me about any missing values or inconsistencies.
```

### Test 26: Custom Data Grid
```
Create a custom grid with inventory data:
- Item: Laptop, Quantity: 150, Reorder Level: 25, Supplier: TechCorp
- Item: Mouse, Quantity: 300, Reorder Level: 50, Supplier: Peripherals Inc
- Item: Monitor, Quantity: 80, Reorder Level: 15, Supplier: DisplayTech

Add appropriate column types and formatting.
```

## Error Handling Tests

### Test 27: Invalid Scenario ID
```
Try to load a demo scenario with ID 'non-existent-scenario' and see how the error is handled.
```

### Test 28: Invalid Grid Operation
```
Try to get statistics for a grid with ID 'fake-grid-id' and show me the error response.
```

### Test 29: Invalid Filter
```
Apply an invalid filter format to test error handling and recovery.
```

### Test 30: Invalid Export Format
```
Try to export grid data in an unsupported format like 'pdf' and see the error message.
```

## Performance Tests

### Test 31: Large Dataset
```
Load the sales dashboard with the maximum amount of sample data and check the performance metrics.
```

### Test 32: Multiple Operations
```
Perform multiple operations in sequence:
1. Load sales demo
2. Apply filters
3. Get statistics
4. Export data
5. Clear filters
6. Get final statistics
```

### Test 33: Concurrent Grid Operations
```
Create multiple grids with different demo scenarios and perform operations on each one.
```

## Help and Information Tests

### Test 34: Comprehensive Help
```
Show me the complete help documentation for the AG Grid server including all tools and resources.
```

### Test 35: Quick Start Guide
```
I'm new to the AG Grid server. Give me a quick start guide with the first few things I should try.
```

### Test 36: Available Resources
```
Show me all the resources available through the grid:// protocol and how to use them.
```

### Test 37: Tool Descriptions
```
Explain each tool available in the AG Grid server and when I should use each one.
```

## Real-World Scenario Tests

### Test 38: Sales Manager Daily Workflow
```
I'm a sales manager starting my day. Set up a comprehensive dashboard that shows:
1. Current month's sales performance
2. Team member performance
3. Pipeline deals needing attention
4. Regional performance comparison
```

### Test 39: HR Analytics Workflow
```
I need to prepare for a quarterly HR review. Set up analytics to show:
1. Department growth and headcount
2. Compensation analysis by role
3. Performance distribution
4. Hiring trends over time
```

### Test 40: Financial Planning Workflow
```
Help me analyze spending patterns for budget planning:
1. Monthly spending by category
2. Identify unusual transactions
3. Spending trends over the last quarter
4. Budget variance analysis
```

### Test 41: Product Performance Review
```
I need to present product performance to the board. Create analysis showing:
1. Product revenue and profitability
2. Market performance by region
3. Inventory turnover
4. Top and bottom performers
```

### Test 42: Customer Analytics
```
Analyze customer data to understand:
1. Customer lifetime value distribution
2. Purchase patterns by customer segment
3. Revenue concentration
4. Customer retention metrics
```

## Integration and Workflow Tests

### Test 43: Multi-Step Analysis
```
Perform a complete analysis workflow:
1. Start with sales data
2. Filter for high-value customers
3. Cross-reference with employee performance
4. Generate insights about rep effectiveness
5. Export summary for management
```

### Test 44: Dashboard Creation
```
Create a comprehensive business dashboard that combines:
- Sales performance metrics
- Employee productivity data
- Financial health indicators
- Key performance insights
```

### Test 45: Report Generation
```
Generate a monthly business report that includes:
1. Executive summary with key metrics
2. Detailed performance breakdown
3. Trend analysis
4. Recommendations based on data
5. Exportable format for stakeholders
```

## Testing Best Practices

### How to Use These Prompts

1. **Start Simple**: Begin with basic functionality tests (Tests 1-5)
2. **Progress Gradually**: Move to demo scenarios (Tests 6-11) 
3. **Explore Features**: Try data analysis and filtering (Tests 12-21)
4. **Test Edge Cases**: Use error handling tests (Tests 27-30)
5. **Real-World Application**: End with workflow tests (Tests 38-45)

### What to Look For

- **Successful Connections**: Server responds to requests
- **Data Accuracy**: Results match expected patterns
- **Error Handling**: Graceful error messages and recovery
- **Performance**: Reasonable response times
- **Export Functionality**: Clean CSV/Excel output
- **Filter Accuracy**: Correct data filtering results

### Troubleshooting

If any test fails:
1. Check the troubleshooting guide: `docs/troubleshooting.md`
2. Verify server configuration in Claude Desktop
3. Ensure all dependencies are installed
4. Check for error messages in Claude Desktop console
5. Try simpler tests first to isolate issues

### Custom Test Creation

Feel free to create your own test prompts by:
1. Combining different tools and scenarios
2. Using your own data requirements
3. Testing specific business use cases
4. Exploring advanced AG Grid features

---

**Note**: These prompts are designed to thoroughly test the AG Grid MCP Server functionality. Some tests may take longer to complete depending on data size and complexity. Always start with basic tests before moving to advanced scenarios.