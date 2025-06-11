/**
 * Sample data generation utilities for AG Grid MCP Server testing
 * 
 * Provides realistic datasets for demonstrating and testing AG Grid functionality
 * including sales data, employee records, and financial transactions.
 */

// TypeScript interfaces for sample data types
export interface SalesRecord {
  id: string;
  date: string;
  product: string;
  category: string;
  region: string;
  salesRep: string;
  quantity: number;
  unitPrice: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  customer: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  bonus: number;
  totalCompensation: number;
  manager: string;
  location: string;
  experience: number;
  performance: 'excellent' | 'good' | 'average' | 'needs improvement';
  isActive: boolean;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  account: string;
  accountType: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
  type: 'credit' | 'debit';
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  merchant: string;
  location: string;
}

// Constants for generating realistic data
const PRODUCTS = [
  'MacBook Pro', 'iPhone 15', 'iPad Air', 'Apple Watch', 'AirPods Pro',
  'Surface Laptop', 'Surface Pro', 'Xbox Series X', 'Surface Studio',
  'Dell XPS 13', 'Dell Inspiron', 'Dell Monitor', 'ThinkPad X1',
  'Galaxy S24', 'Galaxy Tab', 'Galaxy Watch', 'Pixel 8', 'Pixel Buds'
];

const PRODUCT_CATEGORIES = {
  'MacBook Pro': 'Laptops',
  'iPhone 15': 'Smartphones',
  'iPad Air': 'Tablets',
  'Apple Watch': 'Wearables',
  'AirPods Pro': 'Audio',
  'Surface Laptop': 'Laptops',
  'Surface Pro': 'Tablets',
  'Xbox Series X': 'Gaming',
  'Surface Studio': 'Desktops',
  'Dell XPS 13': 'Laptops',
  'Dell Inspiron': 'Laptops',
  'Dell Monitor': 'Monitors',
  'ThinkPad X1': 'Laptops',
  'Galaxy S24': 'Smartphones',
  'Galaxy Tab': 'Tablets',
  'Galaxy Watch': 'Wearables',
  'Pixel 8': 'Smartphones',
  'Pixel Buds': 'Audio'
};

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];

const SALES_REPS = [
  'John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'David Rodriguez',
  'Lisa Thompson', 'James Wilson', 'Maria Garcia', 'Robert Taylor', 'Jennifer Lee'
];

const CUSTOMERS = [
  'TechCorp Inc', 'Global Systems', 'Innovation Labs', 'Digital Solutions',
  'Future Tech', 'Smart Devices', 'CloudFirst', 'DataSync Corp',
  'NextGen Solutions', 'Alpha Industries', 'Beta Systems', 'Gamma Corp'
];

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Product', 'Customer Success'];

const POSITIONS = {
  'Engineering': ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager', 'Principal Engineer'],
  'Sales': ['Sales Rep', 'Senior Sales Rep', 'Sales Manager', 'VP Sales', 'Account Manager'],
  'Marketing': ['Marketing Specialist', 'Marketing Manager', 'CMO', 'Product Marketing', 'Content Manager'],
  'Finance': ['Financial Analyst', 'Accountant', 'Finance Manager', 'CFO', 'Controller'],
  'HR': ['HR Specialist', 'HR Manager', 'Recruiter', 'CHRO', 'HR Business Partner'],
  'Operations': ['Operations Specialist', 'Operations Manager', 'COO', 'Program Manager'],
  'Product': ['Product Manager', 'Senior PM', 'VP Product', 'Product Owner', 'UX Designer'],
  'Customer Success': ['CS Manager', 'Customer Success Rep', 'VP Customer Success', 'Support Specialist']
};

const FIRST_NAMES = [
  'Alex', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Maria',
  'Robert', 'Jennifer', 'John', 'Michelle', 'Christopher', 'Amanda', 'Daniel',
  'Jessica', 'Matthew', 'Ashley', 'Anthony', 'Brittany', 'Mark', 'Samantha'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson'
];

const LOCATIONS = ['New York', 'San Francisco', 'London', 'Tokyo', 'Toronto', 'Sydney', 'Berlin', 'Singapore'];

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Investment', 'Business'];

const TRANSACTION_CATEGORIES = [
  'Groceries', 'Restaurants', 'Gas', 'Shopping', 'Entertainment', 'Utilities',
  'Healthcare', 'Travel', 'Education', 'Insurance', 'Investments', 'Transfer'
];

const MERCHANTS = [
  'Amazon', 'Walmart', 'Target', 'Starbucks', 'McDonalds', 'Shell', 'Exxon',
  'Netflix', 'Spotify', 'Uber', 'Lyft', 'Apple Store', 'Best Buy', 'Home Depot'
];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate sample sales data
 */
export function generateSalesData(count: number = 100): SalesRecord[] {
  const salesData: SalesRecord[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');

  for (let i = 0; i < count; i++) {
    const product = randomElement(PRODUCTS);
    const category = PRODUCT_CATEGORIES[product as keyof typeof PRODUCT_CATEGORIES];
    const quantity = randomInt(1, 50);
    const unitPrice = randomFloat(99, 2999, 2);
    const revenue = Number((quantity * unitPrice).toFixed(2));
    const profitMargin = randomFloat(10, 45, 1);
    const profit = Number((revenue * profitMargin / 100).toFixed(2));

    const record: SalesRecord = {
      id: `SALE-${String(i + 1).padStart(4, '0')}`,
      date: formatDate(randomDate(startDate, endDate)),
      product,
      category,
      region: randomElement(REGIONS),
      salesRep: randomElement(SALES_REPS),
      quantity,
      unitPrice,
      revenue,
      profit,
      profitMargin,
      customer: randomElement(CUSTOMERS),
      status: randomElement(['completed', 'pending', 'cancelled'] as const),
    };

    salesData.push(record);
  }

  return salesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate sample employee data
 */
export function generateEmployeeData(count: number = 50): EmployeeRecord[] {
  const employeeData: EmployeeRecord[] = [];
  const startDate = new Date('2015-01-01');
  const endDate = new Date('2024-01-01');

  for (let i = 0; i < count; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const department = randomElement(DEPARTMENTS);
    const position = randomElement(POSITIONS[department as keyof typeof POSITIONS]);
    const hireDate = randomDate(startDate, endDate);
    const experience = Math.floor((new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    // Salary based on position and experience
    let baseSalary = 50000;
    if (position.includes('Senior') || position.includes('Manager')) baseSalary = 90000;
    if (position.includes('VP') || position.includes('Director')) baseSalary = 150000;
    if (position.includes('C') && position.length === 3) baseSalary = 250000; // CEO, CFO, etc.
    
    const salary = baseSalary + (experience * 2000) + randomInt(-10000, 20000);
    const bonus = Math.floor(salary * randomFloat(0, 0.25));

    const record: EmployeeRecord = {
      id: `EMP-${String(i + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department,
      position,
      hireDate: formatDate(hireDate),
      salary,
      bonus,
      totalCompensation: salary + bonus,
      manager: i > 0 ? employeeData[randomInt(0, Math.min(i - 1, 10))].fullName : 'CEO',
      location: randomElement(LOCATIONS),
      experience,
      performance: randomElement(['excellent', 'good', 'average', 'needs improvement'] as const),
      isActive: Math.random() > 0.05, // 95% active employees
    };

    employeeData.push(record);
  }

  return employeeData.sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/**
 * Generate sample financial transaction data
 */
export function generateFinancialData(count: number = 200): FinancialTransaction[] {
  const transactionData: FinancialTransaction[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  let runningBalance = 10000; // Starting balance

  for (let i = 0; i < count; i++) {
    const isCredit = Math.random() > 0.7; // 30% credits, 70% debits
    const amount = randomFloat(5, 2000, 2);
    
    if (isCredit) {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }

    const record: FinancialTransaction = {
      id: `TXN-${String(i + 1).padStart(6, '0')}`,
      date: formatDate(randomDate(startDate, endDate)),
      account: `****${randomInt(1000, 9999)}`,
      accountType: randomElement(ACCOUNT_TYPES),
      description: `${isCredit ? 'Deposit' : 'Purchase'} - ${randomElement(MERCHANTS)}`,
      category: randomElement(TRANSACTION_CATEGORIES),
      amount: isCredit ? amount : -amount,
      balance: Number(runningBalance.toFixed(2)),
      type: isCredit ? 'credit' : 'debit',
      reference: `REF${randomInt(100000, 999999)}`,
      status: randomElement(['completed', 'pending', 'failed'] as const),
      merchant: randomElement(MERCHANTS),
      location: randomElement(LOCATIONS),
    };

    transactionData.push(record);
  }

  return transactionData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get column definitions for sales data
 */
export function getSalesColumnDefs() {
  return [
    { field: 'id', headerName: 'Sale ID', width: 120, type: 'text' },
    { field: 'date', headerName: 'Date', width: 120, type: 'date' },
    { field: 'product', headerName: 'Product', width: 150, type: 'text' },
    { field: 'category', headerName: 'Category', width: 120, type: 'text' },
    { field: 'region', headerName: 'Region', width: 150, type: 'text' },
    { field: 'salesRep', headerName: 'Sales Rep', width: 140, type: 'text' },
    { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number' },
    { field: 'unitPrice', headerName: 'Unit Price', width: 120, type: 'number' },
    { field: 'revenue', headerName: 'Revenue', width: 120, type: 'number' },
    { field: 'profit', headerName: 'Profit', width: 120, type: 'number' },
    { field: 'profitMargin', headerName: 'Profit %', width: 100, type: 'number' },
    { field: 'customer', headerName: 'Customer', width: 150, type: 'text' },
    { field: 'status', headerName: 'Status', width: 120, type: 'text' },
  ];
}

/**
 * Get column definitions for employee data
 */
export function getEmployeeColumnDefs() {
  return [
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
    { field: 'experience', headerName: 'Experience (yrs)', width: 130, type: 'number' },
    { field: 'performance', headerName: 'Performance', width: 130, type: 'text' },
    { field: 'isActive', headerName: 'Active', width: 80, type: 'boolean' },
  ];
}

/**
 * Get column definitions for financial data
 */
export function getFinancialColumnDefs() {
  return [
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
  ];
}

/**
 * Generate a complete dataset for testing
 */
export interface TestDataset {
  sales: {
    columnDefs: any[];
    rowData: SalesRecord[];
  };
  employees: {
    columnDefs: any[];
    rowData: EmployeeRecord[];
  };
  financial: {
    columnDefs: any[];
    rowData: FinancialTransaction[];
  };
}

export function generateTestDataset(salesCount = 100, employeeCount = 50, financialCount = 200): TestDataset {
  return {
    sales: {
      columnDefs: getSalesColumnDefs(),
      rowData: generateSalesData(salesCount),
    },
    employees: {
      columnDefs: getEmployeeColumnDefs(),
      rowData: generateEmployeeData(employeeCount),
    },
    financial: {
      columnDefs: getFinancialColumnDefs(),
      rowData: generateFinancialData(financialCount),
    },
  };
}

/**
 * Export sample data as JSON for external use
 */
export function exportSampleDataAsJson(): string {
  const dataset = generateTestDataset();
  return JSON.stringify(dataset, null, 2);
}

/**
 * Main function for CLI usage
 */
export function main() {
  console.error('Generating sample data...\n');
  console.error(exportSampleDataAsJson());
}