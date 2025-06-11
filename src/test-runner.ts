#!/usr/bin/env node

/**
 * AG Grid MCP Server Test Runner
 * 
 * Comprehensive end-to-end testing of the AG Grid MCP server functionality.
 * Tests all tools, resources, and validates the complete workflow.
 */

import { GridManager, GridManagerError } from './grid-manager.js';
import { 
  generateTestDataset,
  type SalesRecord,
  type EmployeeRecord,
  type FinancialTransaction 
} from './sample-data.js';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  salesDataSize: 50,
  employeeDataSize: 25,
  financialDataSize: 100,
  timeout: 30000, // 30 seconds timeout for tests
} as const;

/**
 * Test result tracking
 */
interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class TestRunner {
  private gridManager: GridManager;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.gridManager = new GridManager({
      headless: true,
      devtools: false,
      viewport: { width: 1920, height: 1080 },
    });
  }

  /**
   * Log test messages with timestamps
   */
  private log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
    };
    const reset = '\x1b[0m';
    
    console.error(`${colors[level]}[${timestamp}] [${level}]${reset} ${message}`);
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    this.log(`Running test: ${name}`);
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.timeout)
        ),
      ]);
      
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        name,
        success: true,
        duration,
        details: result,
      };
      
      this.results.push(testResult);
      this.log(`✅ Test passed: ${name} (${duration}ms)`, 'SUCCESS');
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.results.push(testResult);
      this.log(`❌ Test failed: ${name} - ${testResult.error} (${duration}ms)`, 'ERROR');
      return testResult;
    }
  }

  /**
   * Test 1: Initialize GridManager
   */
  private async testInitialization(): Promise<void> {
    await this.gridManager.initialize();
    return;
  }

  /**
   * Test 2: Create Sales Grid
   */
  private async testCreateSalesGrid(): Promise<string> {
    const dataset = generateTestDataset(
      TEST_CONFIG.salesDataSize,
      TEST_CONFIG.employeeDataSize,
      TEST_CONFIG.financialDataSize
    );

    const gridId = await this.gridManager.createGrid({
      columnDefs: dataset.sales.columnDefs,
      rowData: dataset.sales.rowData,
      gridOptions: {
        enableRangeSelection: true,
        enableCharts: true,
      },
    });

    if (!gridId || typeof gridId !== 'string') {
      throw new Error('Failed to create sales grid - invalid grid ID returned');
    }

    return gridId;
  }

  /**
   * Test 3: Create Employee Grid
   */
  private async testCreateEmployeeGrid(): Promise<string> {
    const dataset = generateTestDataset(
      TEST_CONFIG.salesDataSize,
      TEST_CONFIG.employeeDataSize,
      TEST_CONFIG.financialDataSize
    );

    const gridId = await this.gridManager.createGrid({
      columnDefs: dataset.employees.columnDefs,
      rowData: dataset.employees.rowData,
    });

    if (!gridId || typeof gridId !== 'string') {
      throw new Error('Failed to create employee grid - invalid grid ID returned');
    }

    return gridId;
  }

  /**
   * Test 4: Create Financial Grid
   */
  private async testCreateFinancialGrid(): Promise<string> {
    const dataset = generateTestDataset(
      TEST_CONFIG.salesDataSize,
      TEST_CONFIG.employeeDataSize,
      TEST_CONFIG.financialDataSize
    );

    const gridId = await this.gridManager.createGrid({
      columnDefs: dataset.financial.columnDefs,
      rowData: dataset.financial.rowData,
    });

    if (!gridId || typeof gridId !== 'string') {
      throw new Error('Failed to create financial grid - invalid grid ID returned');
    }

    return gridId;
  }

  /**
   * Test 5: Update Grid Data
   */
  private async testUpdateGridData(gridId: string): Promise<void> {
    const newSalesData = generateTestDataset(10, 0, 0).sales.rowData;
    await this.gridManager.updateGridData(gridId, newSalesData);
    
    // Verify the update
    const gridState = await this.gridManager.getGridState(gridId);
    if (gridState.rowCount !== 10) {
      throw new Error(`Expected 10 rows after update, got ${gridState.rowCount}`);
    }
    
    return;
  }

  /**
   * Test 6: Apply Filters
   */
  private async testApplyFilters(gridId: string): Promise<void> {
    // Apply a text filter to the product column
    const filterModel = {
      product: {
        filterType: 'text',
        type: 'contains',
        filter: 'MacBook'
      }
    };

    await this.gridManager.executeGridMethod(gridId, 'setFilterModel', [filterModel]);
    
    // Get filtered state
    const gridState = await this.gridManager.getGridState(gridId);
    if (Object.keys(gridState.filterState).length === 0) {
      throw new Error('Filter was not applied - no filter state found');
    }
    
    return;
  }

  /**
   * Test 7: Apply Sorting
   */
  private async testApplySorting(gridId: string): Promise<void> {
    // Apply sorting to the revenue column using applyColumnState
    const columnState = [
      {
        colId: 'revenue',
        sort: 'desc'
      }
    ];

    await this.gridManager.executeGridMethod(gridId, 'applyColumnState', [{ state: columnState }]);
    
    // Verify sorting was applied
    const gridState = await this.gridManager.getGridState(gridId);
    if (gridState.sortState.length === 0) {
      throw new Error('Sort was not applied - no sort state found');
    }
    
    return;
  }

  /**
   * Test 8: Export Grid Data
   */
  private async testExportData(gridId: string): Promise<any> {
    // Test CSV export
    const csvExport = await this.gridManager.exportGridData(gridId, 'csv');
    if (!csvExport.data || csvExport.format !== 'csv') {
      throw new Error('CSV export failed or returned invalid data');
    }

    // Test Excel export
    const excelExport = await this.gridManager.exportGridData(gridId, 'excel');
    if (!excelExport.data || excelExport.format !== 'excel') {
      throw new Error('Excel export failed or returned invalid data');
    }

    return { csvExport, excelExport };
  }

  /**
   * Test 9: Execute Grid Methods
   */
  private async testGridMethods(gridId: string): Promise<any> {
    // Test select all
    await this.gridManager.executeGridMethod(gridId, 'selectAll');
    
    // Test get selected rows
    const selectedRows = await this.gridManager.executeGridMethod(gridId, 'getSelectedRows');
    if (!Array.isArray(selectedRows) || selectedRows.length === 0) {
      throw new Error('Select all method failed - no rows selected');
    }

    // Test clear selection
    await this.gridManager.executeGridMethod(gridId, 'deselectAll');
    
    // Test size columns to fit
    await this.gridManager.executeGridMethod(gridId, 'sizeColumnsToFit');
    
    return { selectedRowsCount: selectedRows.length };
  }

  /**
   * Test 10: Get Grid Statistics
   */
  private async testGetGridStats(gridId: string): Promise<any> {
    const gridState = await this.gridManager.getGridState(gridId);
    const gridInfo = this.gridManager.getGridInfo(gridId);
    
    if (!gridState || !gridInfo) {
      throw new Error('Failed to get grid statistics');
    }

    // Verify expected properties exist
    const requiredStateProps = ['rowCount', 'displayedRowCount', 'selectedRows', 'filterState', 'sortState'];
    for (const prop of requiredStateProps) {
      if (!(prop in gridState)) {
        throw new Error(`Missing required property in grid state: ${prop}`);
      }
    }

    const requiredInfoProps = ['id', 'config', 'createdAt', 'lastUpdated'];
    for (const prop of requiredInfoProps) {
      if (!(prop in gridInfo)) {
        throw new Error(`Missing required property in grid info: ${prop}`);
      }
    }

    return { gridState, gridInfo };
  }

  /**
   * Test 11: Multiple Grid Management
   */
  private async testMultipleGrids(): Promise<string[]> {
    const activeGrids = this.gridManager.getActiveGrids();
    if (activeGrids.length < 2) {
      throw new Error(`Expected at least 2 active grids, found ${activeGrids.length}`);
    }

    // Test that each grid has different data
    const gridInfos = activeGrids.map(gridId => this.gridManager.getGridInfo(gridId));
    const uniqueConfigs = new Set(gridInfos.map(info => JSON.stringify(info.config.columnDefs)));
    
    if (uniqueConfigs.size < 2) {
      throw new Error('Multiple grids do not have unique configurations');
    }

    return activeGrids;
  }

  /**
   * Test 12: Grid Cleanup
   */
  private async testGridCleanup(gridId: string): Promise<void> {
    await this.gridManager.destroyGrid(gridId);
    
    // Verify grid is no longer active
    const activeGrids = this.gridManager.getActiveGrids();
    if (activeGrids.includes(gridId)) {
      throw new Error(`Grid ${gridId} still active after destruction`);
    }
    
    // Verify we can't get info for destroyed grid
    try {
      this.gridManager.getGridInfo(gridId);
      throw new Error('Should not be able to get info for destroyed grid');
    } catch (error) {
      if (!(error instanceof GridManagerError) || error.code !== 'GRID_NOT_FOUND') {
        throw new Error('Expected GridManagerError with GRID_NOT_FOUND code');
      }
    }
    
    return;
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests(): Promise<void> {
    this.log('🚀 Starting AG Grid MCP Server Test Suite');
    this.startTime = Date.now();

    let salesGridId: string = '';
    let employeeGridId: string = '';
    let financialGridId: string = '';

    try {
      // Test 1: Initialize
      await this.runTest('GridManager Initialization', () => this.testInitialization());

      // Test 2-4: Create grids
      const salesResult = await this.runTest('Create Sales Grid', () => this.testCreateSalesGrid());
      if (salesResult.success && salesResult.details) {
        salesGridId = salesResult.details;
      }

      const employeeResult = await this.runTest('Create Employee Grid', () => this.testCreateEmployeeGrid());
      if (employeeResult.success && employeeResult.details) {
        employeeGridId = employeeResult.details;
      }

      const financialResult = await this.runTest('Create Financial Grid', () => this.testCreateFinancialGrid());
      if (financialResult.success && financialResult.details) {
        financialGridId = financialResult.details;
      }

      // Test 5-11: Grid operations (using sales grid)
      if (salesGridId) {
        await this.runTest('Update Grid Data', () => this.testUpdateGridData(salesGridId));
        await this.runTest('Apply Filters', () => this.testApplyFilters(salesGridId));
        await this.runTest('Apply Sorting', () => this.testApplySorting(salesGridId));
        await this.runTest('Export Data', () => this.testExportData(salesGridId));
        await this.runTest('Execute Grid Methods', () => this.testGridMethods(salesGridId));
        await this.runTest('Get Grid Statistics', () => this.testGetGridStats(salesGridId));
      }

      // Test multiple grids
      await this.runTest('Multiple Grid Management', () => this.testMultipleGrids());

      // Test cleanup
      if (financialGridId) {
        await this.runTest('Grid Cleanup', () => this.testGridCleanup(financialGridId));
      }

    } catch (error) {
      this.log(`💥 Test suite failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    } finally {
      // Always cleanup remaining resources
      try {
        await this.gridManager.cleanup();
      } catch (error) {
        this.log(`⚠️ Error during final cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WARN');
      }
    }

    this.printResults();
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;

    this.log('\n📊 Test Results Summary:');
    this.log('='.repeat(50));
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      this.log(`${status} ${result.name} (${duration})`);
      
      if (!result.success && result.error) {
        this.log(`   Error: ${result.error}`, 'ERROR');
      }
    });

    this.log('='.repeat(50));
    this.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Time: ${totalTime}ms`);
    
    if (failed === 0) {
      this.log('🎉 All tests passed! AG Grid MCP Server is working correctly.', 'SUCCESS');
    } else {
      this.log(`💥 ${failed} test(s) failed. Please check the errors above.`, 'ERROR');
    }

    // Exit with appropriate code
    process.exit(failed === 0 ? 0 : 1);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const runner = new TestRunner();
  await runner.runAllTests();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error in test runner:', error);
    process.exit(1);
  });
}

export { TestRunner, main };