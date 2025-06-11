/**
 * Pre-built demo scenarios for AG Grid MCP Server
 * 
 * These scenarios provide complete working examples with realistic data
 * and common business use cases. Each scenario includes sample questions
 * that Claude can answer using the data.
 */

import { generateSalesData, generateEmployeeData, generateFinancialData } from '../sample-data.js';
import type { GridConfig } from '../grid-manager.js';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'hr' | 'finance' | 'ecommerce' | 'analytics';
  gridConfig: GridConfig;
  sampleQuestions: string[];
  insights: string[];
  filters?: Record<string, any>;
  sorting?: Array<{ colId: string; sort: 'asc' | 'desc'; sortIndex?: number }>;
}

/**
 * Sales Performance Dashboard
 */
export function createSalesDashboardScenario(): DemoScenario {
  const salesData = generateSalesData(150);
  
  return {
    id: 'sales-dashboard',
    name: 'Sales Performance Dashboard',
    description: 'Comprehensive sales analytics with regional performance, product analysis, and rep tracking',
    category: 'sales',
    gridConfig: {
      columnDefs: [
        { field: 'id', headerName: 'Sale ID', width: 120, type: 'text' },
        { field: 'date', headerName: 'Date', width: 120, type: 'date' },
        { field: 'product', headerName: 'Product', width: 150, type: 'text' },
        { field: 'category', headerName: 'Category', width: 120, type: 'text' },
        { field: 'region', headerName: 'Region', width: 150, type: 'text' },
        { field: 'salesRep', headerName: 'Sales Rep', width: 140, type: 'text' },
        { field: 'quantity', headerName: 'Qty', width: 80, type: 'number' },
        { field: 'unitPrice', headerName: 'Unit Price', width: 120, type: 'number' },
        { field: 'revenue', headerName: 'Revenue', width: 120, type: 'number' },
        { field: 'profit', headerName: 'Profit', width: 120, type: 'number' },
        { field: 'profitMargin', headerName: 'Margin %', width: 100, type: 'number' },
        { field: 'customer', headerName: 'Customer', width: 150, type: 'text' },
        { field: 'status', headerName: 'Status', width: 120, type: 'text' },
      ],
      rowData: salesData,
      gridOptions: {
        rowSelection: 'multiple',
        enableRangeSelection: true,
        enableCharts: true,
        suppressMenuHide: true
      }
    },
    sampleQuestions: [
      "What are the top 5 products by revenue?",
      "Which sales rep has the highest profit margin?",
      "Show me all sales over $15,000 from Q4 2024",
      "What's the regional distribution of sales?",
      "Which customers generate the most revenue?",
      "Filter sales by North America and Europe only",
      "Sort by profit margin descending",
      "Show me pending deals that need attention",
      "Calculate average deal size by sales rep",
      "Export Q4 sales data for executive review"
    ],
    insights: [
      `Total revenue: $${salesData.reduce((sum, sale) => sum + sale.revenue, 0).toLocaleString()}`,
      `Average deal size: $${Math.round(salesData.reduce((sum, sale) => sum + sale.revenue, 0) / salesData.length).toLocaleString()}`,
      `Top performing region: ${getTopRegion(salesData)}`,
      `Highest margin product category: ${getTopCategory(salesData)}`,
      `Total deals: ${salesData.length}`,
      `Completed deals: ${salesData.filter(sale => sale.status === 'completed').length}`
    ],
    filters: {
      status: { filterType: 'set', values: ['completed'] }
    },
    sorting: [
      { colId: 'revenue', sort: 'desc', sortIndex: 0 }
    ]
  };
}

/**
 * Employee Analytics Dashboard
 */
export function createEmployeeAnalyticsScenario(): DemoScenario {
  const employeeData = generateEmployeeData(75);
  
  return {
    id: 'employee-analytics',
    name: 'Employee Analytics Dashboard',
    description: 'HR analytics including compensation analysis, department insights, and performance tracking',
    category: 'hr',
    gridConfig: {
      columnDefs: [
        { field: 'id', headerName: 'Employee ID', width: 120, type: 'text' },
        { field: 'fullName', headerName: 'Full Name', width: 150, type: 'text' },
        { field: 'email', headerName: 'Email', width: 200, type: 'text' },
        { field: 'department', headerName: 'Department', width: 130, type: 'text' },
        { field: 'position', headerName: 'Position', width: 160, type: 'text' },
        { field: 'hireDate', headerName: 'Hire Date', width: 120, type: 'date' },
        { field: 'salary', headerName: 'Salary', width: 120, type: 'number' },
        { field: 'bonus', headerName: 'Bonus', width: 100, type: 'number' },
        { field: 'totalCompensation', headerName: 'Total Comp', width: 130, type: 'number' },
        { field: 'manager', headerName: 'Manager', width: 150, type: 'text' },
        { field: 'location', headerName: 'Location', width: 120, type: 'text' },
        { field: 'experience', headerName: 'Experience', width: 100, type: 'number' },
        { field: 'performance', headerName: 'Performance', width: 130, type: 'text' },
        { field: 'isActive', headerName: 'Active', width: 80, type: 'boolean' },
      ],
      rowData: employeeData,
      gridOptions: {
        rowSelection: 'multiple',
        enableRangeSelection: true,
        groupDisplayType: 'groupRows',
        suppressMenuHide: true
      }
    },
    sampleQuestions: [
      "What's the average salary by department?",
      "Show me all employees hired in the last 2 years",
      "Which department has the highest total compensation?",
      "Filter employees with 'excellent' performance ratings",
      "Who are the highest paid employees in Engineering?",
      "Show salary distribution across all locations",
      "Which managers have the most direct reports?",
      "Calculate compensation equity by department",
      "Show employees eligible for promotion (3+ years, good+ performance)",
      "Export employee directory for the leadership team"
    ],
    insights: [
      `Total employees: ${employeeData.length}`,
      `Average salary: $${Math.round(employeeData.reduce((sum, emp) => sum + emp.salary, 0) / employeeData.length).toLocaleString()}`,
      `Largest department: ${getDepartmentDistribution(employeeData)[0].department}`,
      `Average tenure: ${Math.round(employeeData.reduce((sum, emp) => sum + emp.experience, 0) / employeeData.length)} years`,
      `High performers: ${employeeData.filter(emp => emp.performance === 'excellent').length}`,
      `Active employees: ${employeeData.filter(emp => emp.isActive).length}`
    ],
    filters: {
      isActive: { filterType: 'set', values: [true] }
    },
    sorting: [
      { colId: 'totalCompensation', sort: 'desc', sortIndex: 0 }
    ]
  };
}

/**
 * Financial Transactions Analysis
 */
export function createFinancialAnalysisScenario(): DemoScenario {
  const financialData = generateFinancialData(300);
  
  return {
    id: 'financial-analysis',
    name: 'Financial Transactions Analysis',
    description: 'Financial transaction tracking with spending analysis, cash flow insights, and budget monitoring',
    category: 'finance',
    gridConfig: {
      columnDefs: [
        { field: 'id', headerName: 'Transaction ID', width: 140, type: 'text' },
        { field: 'date', headerName: 'Date', width: 120, type: 'date' },
        { field: 'account', headerName: 'Account', width: 120, type: 'text' },
        { field: 'accountType', headerName: 'Account Type', width: 130, type: 'text' },
        { field: 'description', headerName: 'Description', width: 200, type: 'text' },
        { field: 'category', headerName: 'Category', width: 120, type: 'text' },
        { field: 'amount', headerName: 'Amount', width: 120, type: 'number' },
        { field: 'balance', headerName: 'Balance', width: 120, type: 'number' },
        { field: 'type', headerName: 'Type', width: 80, type: 'text' },
        { field: 'reference', headerName: 'Reference', width: 120, type: 'text' },
        { field: 'status', headerName: 'Status', width: 100, type: 'text' },
        { field: 'merchant', headerName: 'Merchant', width: 130, type: 'text' },
        { field: 'location', headerName: 'Location', width: 120, type: 'text' },
      ],
      rowData: financialData,
      gridOptions: {
        rowSelection: 'multiple',
        enableRangeSelection: true,
        enableCharts: true,
        suppressMenuHide: true
      }
    },
    sampleQuestions: [
      "What are my largest expenses this month?",
      "Show me all transactions over $500",
      "What's my spending by category?",
      "Filter transactions by 'Restaurants' category",
      "Show me all failed transactions",
      "What's my cash flow trend over time?",
      "Which merchants do I spend the most with?",
      "Show me all credit transactions (deposits)",
      "Calculate monthly spending average",
      "Export transactions for tax preparation"
    ],
    insights: [
      `Total transactions: ${financialData.length}`,
      `Total debits: $${Math.abs(financialData.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}`,
      `Total credits: $${financialData.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`,
      `Current balance: $${financialData[0]?.balance.toLocaleString() || '0'}`,
      `Average transaction: $${Math.abs(Math.round(financialData.reduce((sum, t) => sum + Math.abs(t.amount), 0) / financialData.length)).toLocaleString()}`,
      `Top spending category: ${getTopSpendingCategory(financialData)}`
    ],
    filters: {
      status: { filterType: 'set', values: ['completed'] }
    },
    sorting: [
      { colId: 'date', sort: 'desc', sortIndex: 0 }
    ]
  };
}

/**
 * E-commerce Product Performance
 */
export function createEcommerceScenario(): DemoScenario {
  // Generate e-commerce specific data based on sales data
  const salesData = generateSalesData(200);
  const ecommerceData = salesData.map(sale => ({
    ...sale,
    views: Math.floor(Math.random() * 1000) + 100,
    clicks: Math.floor(Math.random() * 100) + 10,
    conversionRate: ((sale.quantity / (Math.floor(Math.random() * 100) + 50)) * 100).toFixed(2),
    inventoryLevel: Math.floor(Math.random() * 500) + 50,
    reorderPoint: Math.floor(Math.random() * 100) + 25,
    supplierCost: (sale.unitPrice * 0.6).toFixed(2),
    shippingCost: (Math.random() * 20 + 5).toFixed(2)
  }));
  
  return {
    id: 'ecommerce-performance',
    name: 'E-commerce Product Performance',
    description: 'Online store analytics with product performance, inventory tracking, and conversion analysis',
    category: 'ecommerce',
    gridConfig: {
      columnDefs: [
        { field: 'id', headerName: 'Product ID', width: 120, type: 'text' },
        { field: 'product', headerName: 'Product', width: 150, type: 'text' },
        { field: 'category', headerName: 'Category', width: 120, type: 'text' },
        { field: 'unitPrice', headerName: 'Price', width: 100, type: 'number' },
        { field: 'supplierCost', headerName: 'Cost', width: 100, type: 'number' },
        { field: 'quantity', headerName: 'Sold', width: 80, type: 'number' },
        { field: 'revenue', headerName: 'Revenue', width: 120, type: 'number' },
        { field: 'views', headerName: 'Views', width: 100, type: 'number' },
        { field: 'clicks', headerName: 'Clicks', width: 100, type: 'number' },
        { field: 'conversionRate', headerName: 'Conv Rate %', width: 110, type: 'number' },
        { field: 'inventoryLevel', headerName: 'Stock', width: 100, type: 'number' },
        { field: 'reorderPoint', headerName: 'Reorder', width: 100, type: 'number' },
        { field: 'shippingCost', headerName: 'Shipping', width: 100, type: 'number' },
      ],
      rowData: ecommerceData,
      gridOptions: {
        rowSelection: 'multiple',
        enableRangeSelection: true,
        enableCharts: true,
        suppressMenuHide: true
      }
    },
    sampleQuestions: [
      "Which products have the highest conversion rates?",
      "Show me products that need reordering (stock below reorder point)",
      "What are the best performing products by revenue?",
      "Filter products with low inventory levels",
      "Which categories have the highest profit margins?",
      "Show me products with high views but low conversions",
      "Calculate average shipping cost by category",
      "Which products are most viewed but not selling?",
      "Show inventory turnover analysis",
      "Export product performance report for marketing team"
    ],
    insights: [
      `Total products: ${ecommerceData.length}`,
      `Total revenue: $${ecommerceData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}`,
      `Average conversion rate: ${(ecommerceData.reduce((sum, item) => sum + parseFloat(item.conversionRate), 0) / ecommerceData.length).toFixed(2)}%`,
      `Products needing reorder: ${ecommerceData.filter(item => item.inventoryLevel <= item.reorderPoint).length}`,
      `Top performing category: ${getTopCategory(ecommerceData)}`,
      `Total inventory value: $${ecommerceData.reduce((sum, item) => sum + (item.inventoryLevel * item.unitPrice), 0).toLocaleString()}`
    ],
    filters: {
      inventoryLevel: { filterType: 'number', type: 'greaterThan', filter: 0 }
    },
    sorting: [
      { colId: 'revenue', sort: 'desc', sortIndex: 0 }
    ]
  };
}

/**
 * Business Intelligence Dashboard
 */
export function createBusinessIntelligenceScenario(): DemoScenario {
  // This scenario combines multiple datasets for comprehensive analysis
  const salesData = generateSalesData(100);
  const employeeData = generateEmployeeData(50);
  const combinedData = salesData.map(sale => {
    const salesRep = employeeData.find(emp => emp.fullName === sale.salesRep);
    return {
      ...sale,
      repDepartment: salesRep?.department || 'Sales',
      repSalary: salesRep?.salary || 75000,
      repTenure: salesRep?.experience || 2,
      repPerformance: salesRep?.performance || 'good',
      costOfSale: sale.revenue * 0.3, // Estimated cost
      customerLifetimeValue: sale.revenue * (Math.random() * 3 + 1), // Estimated CLV
      leadSource: ['Website', 'Referral', 'Cold Call', 'Trade Show', 'Social Media'][Math.floor(Math.random() * 5)]
    };
  });
  
  return {
    id: 'business-intelligence',
    name: 'Business Intelligence Dashboard',
    description: 'Comprehensive business analytics combining sales, employee, and operational data',
    category: 'analytics',
    gridConfig: {
      columnDefs: [
        { field: 'id', headerName: 'Sale ID', width: 120, type: 'text' },
        { field: 'date', headerName: 'Date', width: 120, type: 'date' },
        { field: 'product', headerName: 'Product', width: 150, type: 'text' },
        { field: 'revenue', headerName: 'Revenue', width: 120, type: 'number' },
        { field: 'profit', headerName: 'Profit', width: 120, type: 'number' },
        { field: 'costOfSale', headerName: 'Cost', width: 100, type: 'number' },
        { field: 'salesRep', headerName: 'Sales Rep', width: 140, type: 'text' },
        { field: 'repSalary', headerName: 'Rep Salary', width: 120, type: 'number' },
        { field: 'repTenure', headerName: 'Rep Tenure', width: 100, type: 'number' },
        { field: 'repPerformance', headerName: 'Rep Performance', width: 130, type: 'text' },
        { field: 'customerLifetimeValue', headerName: 'CLV', width: 120, type: 'number' },
        { field: 'leadSource', headerName: 'Lead Source', width: 120, type: 'text' },
        { field: 'region', headerName: 'Region', width: 150, type: 'text' },
      ],
      rowData: combinedData,
      gridOptions: {
        rowSelection: 'multiple',
        enableRangeSelection: true,
        enableCharts: true,
        groupDisplayType: 'groupRows',
        suppressMenuHide: true
      }
    },
    sampleQuestions: [
      "What's the ROI of our sales team (revenue vs salary costs)?",
      "Which lead sources generate the highest value customers?",
      "How does sales rep tenure correlate with deal size?",
      "Show me high-performing reps with deals over $10k",
      "What's the customer lifetime value by product category?",
      "Which regions have the best cost-to-revenue ratios?",
      "Filter deals by excellent-performing sales reps",
      "Calculate average deal size by lead source",
      "Show profitability analysis by rep performance level",
      "Export comprehensive business intelligence report"
    ],
    insights: [
      `Total revenue: $${combinedData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}`,
      `Sales team ROI: ${((combinedData.reduce((sum, item) => sum + item.revenue, 0) / combinedData.reduce((sum, item) => sum + item.repSalary / 12, 0)) * 100).toFixed(0)}%`,
      `Best lead source: ${getBestLeadSource(combinedData)}`,
      `Average CLV: $${Math.round(combinedData.reduce((sum, item) => sum + item.customerLifetimeValue, 0) / combinedData.length).toLocaleString()}`,
      `High performers: ${combinedData.filter(item => item.repPerformance === 'excellent').length} deals`,
      `Total cost of sales: $${combinedData.reduce((sum, item) => sum + item.costOfSale, 0).toLocaleString()}`
    ],
    filters: {
      repPerformance: { filterType: 'set', values: ['excellent', 'good'] }
    },
    sorting: [
      { colId: 'customerLifetimeValue', sort: 'desc', sortIndex: 0 }
    ]
  };
}

/**
 * Get all available demo scenarios
 */
export function getAllDemoScenarios(): DemoScenario[] {
  return [
    createSalesDashboardScenario(),
    createEmployeeAnalyticsScenario(),
    createFinancialAnalysisScenario(),
    createEcommerceScenario(),
    createBusinessIntelligenceScenario()
  ];
}

/**
 * Get scenario by ID
 */
export function getDemoScenarioById(id: string): DemoScenario | undefined {
  return getAllDemoScenarios().find(scenario => scenario.id === id);
}

/**
 * Get scenarios by category
 */
export function getDemoScenariosByCategory(category: DemoScenario['category']): DemoScenario[] {
  return getAllDemoScenarios().filter(scenario => scenario.category === category);
}

// Helper functions for data analysis
function getTopRegion(salesData: any[]): string {
  const regionTotals = salesData.reduce((acc, sale) => {
    acc[sale.region] = (acc[sale.region] || 0) + sale.revenue;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(regionTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
}

function getTopCategory(data: any[]): string {
  const categoryTotals = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.revenue;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
}

function getDepartmentDistribution(employeeData: any[]): Array<{department: string, count: number}> {
  const deptCounts = employeeData.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(deptCounts)
    .map(([department, count]) => ({ department, count: count as number }))
    .sort((a, b) => (b.count as number) - (a.count as number));
}

function getTopSpendingCategory(financialData: any[]): string {
  const categoryTotals = financialData
    .filter(t => t.amount < 0)
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);
  
  return Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Unknown';
}

function getBestLeadSource(data: any[]): string {
  const sourceTotals = data.reduce((acc, item) => {
    acc[item.leadSource] = (acc[item.leadSource] || 0) + item.customerLifetimeValue;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(sourceTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
}