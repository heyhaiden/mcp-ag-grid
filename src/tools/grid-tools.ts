import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GridManager, GridManagerError, type GridConfig, type ExportFormat } from '../grid-manager.js';
import { getAllDemoScenarios, getDemoScenarioById, type DemoScenario } from '../examples/demo-scenarios.js';
import type WebServer from '../web-server/server.js';

// Zod schemas for tool parameter validation
const ColumnDefSchema = z.object({
  field: z.string().describe('The field name/key in the data object'),
  headerName: z.string().optional().describe('Display name for the column header'),
  width: z.number().positive().optional().describe('Fixed width in pixels'),
  minWidth: z.number().positive().optional().describe('Minimum width in pixels'),
  maxWidth: z.number().positive().optional().describe('Maximum width in pixels'),
  sortable: z.boolean().optional().default(true).describe('Whether column is sortable'),
  filter: z.boolean().optional().default(true).describe('Whether column has filter'),
  resizable: z.boolean().optional().default(true).describe('Whether column is resizable'),
  // Note: Column types removed as they require custom columnTypes definition in AG Grid v33
}).describe('Column definition for AG Grid');

const CreateGridSchema = z.object({
  columnDefs: z.array(ColumnDefSchema).min(1).describe('Array of column definitions defining the grid structure'),
  rowData: z.array(z.record(z.any())).describe('Array of data objects to populate the grid'),
  gridOptions: z.record(z.any()).optional().describe('Additional AG Grid options (optional)'),
}).describe('Configuration for creating a new AG Grid');

const UpdateGridDataSchema = z.object({
  gridId: z.string().describe('Unique identifier of the grid to update'),
  rowData: z.array(z.record(z.any())).describe('New array of data objects to replace current grid data'),
}).describe('Parameters for updating grid data');

const ApplyFilterSchema = z.object({
  gridId: z.string().describe('Unique identifier of the grid to filter'),
  filterModel: z.record(z.any()).describe('AG Grid filter model object defining filters to apply'),
}).describe('Parameters for applying filters to a grid');

const ExportGridSchema = z.object({
  gridId: z.string().describe('Unique identifier of the grid to export'),
  format: z.enum(['csv', 'excel']).describe('Export format - csv for CSV files, excel for Excel files'),
  filename: z.string().optional().describe('Optional custom filename (without extension)'),
}).describe('Parameters for exporting grid data');

const GetGridStatsSchema = z.object({
  gridId: z.string().describe('Unique identifier of the grid to get statistics for'),
}).describe('Parameters for retrieving grid statistics');

const ExecuteGridMethodSchema = z.object({
  gridId: z.string().describe('Unique identifier of the grid to execute method on'),
  method: z.string().describe('Name of the AG Grid API method to execute (e.g., "selectAll", "clearSelection", "sizeColumnsToFit")'),
  params: z.array(z.any()).optional().describe('Optional array of parameters to pass to the method'),
}).describe('Parameters for executing AG Grid API methods');

const LoadDemoScenarioSchema = z.object({
  scenarioId: z.string().describe('ID of the demo scenario to load (e.g., "sales-dashboard", "employee-analytics", "financial-analysis", "ecommerce-performance", "business-intelligence")'),
  applyFilters: z.boolean().optional().default(true).describe('Whether to apply the scenario\'s default filters and sorting'),
}).describe('Parameters for loading a pre-built demo scenario');

// Response formatting helpers
interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

function formatSuccess(message: string, data?: any) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          message,
          data,
        }, null, 2)
      }
    ]
  };
}

function formatError(message: string, error?: Error | GridManagerError) {
  const errorDetails = error instanceof GridManagerError 
    ? { code: error.code, gridId: error.gridId, cause: error.cause?.message }
    : { message: error?.message };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          success: false,
          message,
          error: error?.message || 'Unknown error',
          data: errorDetails,
        }, null, 2)
      }
    ],
    isError: true
  };
}

/**
 * Set up all AG Grid MCP tools
 * @param server - The MCP server instance
 * @param gridManager - The GridManager instance
 * @param webServer - The web server instance (optional)
 */
export function setupGridTools(server: McpServer, gridManager: GridManager, webServer?: WebServer): void {
  
  // Tool 1: Create Grid
  server.tool(
    'create_grid',
    'Create a new AG Grid instance with column definitions and data. Returns a unique grid ID for future operations.',
    {
      columnDefs: CreateGridSchema.shape.columnDefs,
      rowData: CreateGridSchema.shape.rowData,
      gridOptions: CreateGridSchema.shape.gridOptions,
    },
    async (params) => {
      try {
        const config: GridConfig = {
          columnDefs: params.columnDefs,
          rowData: params.rowData,
          gridOptions: params.gridOptions,
        };

        const gridId = await gridManager.createGrid(config);
        
        return formatSuccess(
          `Grid created successfully with ID: ${gridId}`,
          {
            gridId,
            columns: config.columnDefs.length,
            rows: config.rowData.length,
            columnFields: config.columnDefs.map(col => col.field),
          }
        );
      } catch (error) {
        return formatError(
          'Failed to create grid',
          error as Error
        );
      }
    }
  );

  // Tool 2: Update Grid Data
  server.tool(
    'update_grid_data',
    'Update the data in an existing AG Grid. Completely replaces the current data with new data.',
    {
      gridId: UpdateGridDataSchema.shape.gridId,
      rowData: UpdateGridDataSchema.shape.rowData,
    },
    async (params) => {
      try {
        await gridManager.updateGridData(params.gridId, params.rowData);
        
        return formatSuccess(
          `Grid data updated successfully for grid: ${params.gridId}`,
          {
            gridId: params.gridId,
            newRowCount: params.rowData.length,
            updatedAt: new Date().toISOString(),
          }
        );
      } catch (error) {
        return formatError(
          `Failed to update grid data for grid: ${params.gridId}`,
          error as Error
        );
      }
    }
  );

  // Tool 3: Apply Grid Filter
  server.tool(
    'apply_grid_filter',
    'Apply filters to an AG Grid using AG Grid\'s filter model format. Use this to filter data by specific criteria.',
    {
      gridId: ApplyFilterSchema.shape.gridId,
      filterModel: ApplyFilterSchema.shape.filterModel,
    },
    async (params) => {
      try {
        // Apply filter using the executeGridMethod
        await gridManager.executeGridMethod(
          params.gridId,
          'setFilterModel',
          [params.filterModel]
        );
        
        // Get updated stats after filtering
        const gridState = await gridManager.getGridState(params.gridId);
        
        return formatSuccess(
          `Filters applied successfully to grid: ${params.gridId}`,
          {
            gridId: params.gridId,
            filterModel: params.filterModel,
            displayedRows: gridState.displayedRowCount,
            totalRows: gridState.rowCount,
          }
        );
      } catch (error) {
        return formatError(
          `Failed to apply filters to grid: ${params.gridId}`,
          error as Error
        );
      }
    }
  );

  // Tool 4: Export Grid
  server.tool(
    'export_grid',
    'Export AG Grid data to CSV or Excel format. Returns the exported data as a string.',
    {
      gridId: ExportGridSchema.shape.gridId,
      format: ExportGridSchema.shape.format,
      filename: ExportGridSchema.shape.filename,
    },
    async (params) => {
      try {
        const exportResult = await gridManager.exportGridData(
          params.gridId,
          params.format as ExportFormat
        );
        
        return formatSuccess(
          `Grid exported successfully as ${params.format.toUpperCase()}`,
          {
            gridId: params.gridId,
            format: exportResult.format,
            filename: params.filename || exportResult.filename,
            dataLength: exportResult.data.length,
            exportedAt: new Date().toISOString(),
            // Note: In a real implementation, you might want to save the file
            // or return a download URL instead of raw data
            data: exportResult.data,
          }
        );
      } catch (error) {
        return formatError(
          `Failed to export grid: ${params.gridId}`,
          error as Error
        );
      }
    }
  );

  // Tool 5: Get Grid Stats
  server.tool(
    'get_grid_stats',
    'Get comprehensive statistics and current state of an AG Grid including filters, sorting, selection, and row counts.',
    {
      gridId: GetGridStatsSchema.shape.gridId,
    },
    async (params) => {
      try {
        const gridState = await gridManager.getGridState(params.gridId);
        const gridInfo = gridManager.getGridInfo(params.gridId);
        
        // Enhanced statistics
        const stats = {
          gridId: params.gridId,
          createdAt: gridInfo.createdAt,
          lastUpdated: gridInfo.lastUpdated,
          totalRows: gridState.rowCount,
          displayedRows: gridState.displayedRowCount,
          selectedRowsCount: gridState.selectedRows.length,
          hasFilters: Object.keys(gridState.filterState).length > 0,
          hasSorting: gridState.sortState.length > 0,
          columnCount: gridInfo.config.columnDefs.length,
          
          // Detailed state information
          filterState: gridState.filterState,
          sortState: gridState.sortState,
          columnState: gridState.columnState.map(col => ({
            colId: col.colId,
            width: col.width,
            sort: col.sort,
            sortIndex: col.sortIndex,
          })),
          selectedRows: gridState.selectedRows,
          
          // Grid configuration summary
          columnFields: gridInfo.config.columnDefs.map(col => col.field),
          gridOptions: Object.keys(gridInfo.config.gridOptions || {}),
        };
        
        return formatSuccess(
          `Grid statistics retrieved for grid: ${params.gridId}`,
          stats
        );
      } catch (error) {
        return formatError(
          `Failed to get grid statistics for grid: ${params.gridId}`,
          error as Error
        );
      }
    }
  );

  // Tool 6: Execute Grid Method
  server.tool(
    'execute_grid_method',
    'Execute any AG Grid API method on a grid. Useful for advanced operations like selectAll, clearSelection, sizeColumnsToFit, etc.',
    {
      gridId: ExecuteGridMethodSchema.shape.gridId,
      method: ExecuteGridMethodSchema.shape.method,
      params: ExecuteGridMethodSchema.shape.params,
    },
    async (params) => {
      try {
        const result = await gridManager.executeGridMethod(
          params.gridId,
          params.method,
          params.params
        );
        
        return formatSuccess(
          `Method '${params.method}' executed successfully on grid: ${params.gridId}`,
          {
            gridId: params.gridId,
            method: params.method,
            params: params.params,
            result: result,
            executedAt: new Date().toISOString(),
          }
        );
      } catch (error) {
        return formatError(
          `Failed to execute method '${params.method}' on grid: ${params.gridId}`,
          error as Error
        );
      }
    }
  );

  // Tool 7: Load Demo Scenario
  server.tool(
    'load_demo_scenario',
    'Load a pre-built demo scenario with realistic data and configurations. Perfect for testing, demonstrations, or getting started quickly.',
    {
      scenarioId: LoadDemoScenarioSchema.shape.scenarioId,
      applyFilters: LoadDemoScenarioSchema.shape.applyFilters,
    },
    async (params) => {
      try {
        const scenario = getDemoScenarioById(params.scenarioId);
        
        if (!scenario) {
          const availableScenarios = getAllDemoScenarios().map(s => ({ id: s.id, name: s.name, category: s.category }));
          return formatError(
            `Demo scenario '${params.scenarioId}' not found`,
            new Error(`Available scenarios: ${availableScenarios.map(s => s.id).join(', ')}`)
          );
        }

        // Create the grid with scenario configuration
        const gridId = await gridManager.createGrid(scenario.gridConfig);
        
        // Apply default filters and sorting if requested
        if (params.applyFilters) {
          try {
            // Apply filters if they exist
            if (scenario.filters && Object.keys(scenario.filters).length > 0) {
              await gridManager.executeGridMethod(gridId, 'setFilterModel', [scenario.filters]);
            }
            
            // Apply sorting if it exists
            if (scenario.sorting && scenario.sorting.length > 0) {
              // Convert our sorting format to AG Grid column state format
              const columnState = scenario.gridConfig.columnDefs.map(col => ({
                colId: col.field,
                sort: scenario.sorting?.find(s => s.colId === col.field)?.sort || null,
                sortIndex: scenario.sorting?.find(s => s.colId === col.field)?.sortIndex || null,
              }));
              
              await gridManager.executeGridMethod(gridId, 'applyColumnState', [{ state: columnState }]);
            }
          } catch (filterError) {
            console.warn('Warning: Could not apply scenario filters/sorting:', filterError);
          }
        }

        // Get final grid state for response
        const gridState = await gridManager.getGridState(gridId);
        
        return formatSuccess(
          `Demo scenario '${scenario.name}' loaded successfully`,
          {
            gridId,
            scenario: {
              id: scenario.id,
              name: scenario.name,
              description: scenario.description,
              category: scenario.category,
              insights: scenario.insights,
              sampleQuestions: scenario.sampleQuestions.slice(0, 5), // First 5 questions
            },
            grid: {
              totalRows: gridState.rowCount,
              displayedRows: gridState.displayedRowCount,
              columns: scenario.gridConfig.columnDefs.length,
              hasFilters: Object.keys(gridState.filterState).length > 0,
              hasSorting: gridState.sortState.length > 0,
            },
            nextSteps: [
              'Try asking one of the sample questions',
              'Apply additional filters using apply_grid_filter',
              'Export the data using export_grid',
              'Get detailed statistics using get_grid_stats',
            ],
          }
        );
      } catch (error) {
        return formatError(
          `Failed to load demo scenario: ${params.scenarioId}`,
          error as Error
        );
      }
    }
  );

  // Tool 8: Get Grid URL (if web server is available)
  if (webServer) {
    server.tool(
      'get_grid_url',
      'Get the web viewer URL for a specific grid. Use this to view grids in your browser in real-time.',
      {
        gridId: z.string().describe('Unique identifier of the grid to get URL for'),
      },
      async (params) => {
        try {
          // Verify grid exists
          gridManager.getGridInfo(params.gridId);
          
          const gridUrl = webServer.getGridUrl(params.gridId);
          const dashboardUrl = webServer.getUrl();
          
          return formatSuccess(
            `Grid viewer URL generated successfully`,
            {
              gridId: params.gridId,
              gridUrl: gridUrl,
              dashboardUrl: dashboardUrl,
              instructions: [
                `Open ${gridUrl} to view this specific grid`,
                `Open ${dashboardUrl} to view the main dashboard`,
                'The grid will update in real-time as you manipulate it through Claude'
              ]
            }
          );
        } catch (error) {
          return formatError(
            `Failed to get grid URL for grid: ${params.gridId}`,
            error as Error
          );
        }
      }
    );
  }

  const toolCount = webServer ? 8 : 7;
  console.error(`✅ AG Grid MCP tools registered successfully (${toolCount} tools total)`);
}

// Additional utility functions that might be useful

/**
 * Get all active grids - utility function for debugging/management
 */
export function getActiveGridsInfo(gridManager: GridManager) {
  const activeGrids = gridManager.getActiveGrids();
  return activeGrids.map(gridId => {
    try {
      const info = gridManager.getGridInfo(gridId);
      return {
        gridId,
        createdAt: info.createdAt,
        lastUpdated: info.lastUpdated,
        columnCount: info.config.columnDefs.length,
        rowCount: info.config.rowData.length,
        columnFields: info.config.columnDefs.map(col => col.field),
      };
    } catch (error) {
      return {
        gridId,
        error: 'Failed to get grid info',
      };
    }
  });
}

/**
 * Common AG Grid filter model examples for documentation
 */
export const FILTER_EXAMPLES = {
  textContains: {
    columnField: {
      filterType: 'text',
      type: 'contains',
      filter: 'searchTerm'
    }
  },
  numberGreaterThan: {
    columnField: {
      filterType: 'number',
      type: 'greaterThan',
      filter: 100
    }
  },
  dateRange: {
    columnField: {
      filterType: 'date',
      type: 'inRange',
      dateFrom: '2023-01-01',
      dateTo: '2023-12-31'
    }
  },
  multipleConditions: {
    columnField: {
      filterType: 'text',
      operator: 'AND',
      condition1: {
        type: 'contains',
        filter: 'term1'
      },
      condition2: {
        type: 'notContains',
        filter: 'term2'
      }
    }
  }
};

/**
 * Common AG Grid API methods for reference
 */
export const COMMON_GRID_METHODS = [
  'selectAll',
  'deselectAll',
  'clearSelection',
  'sizeColumnsToFit',
  'autoSizeAllColumns',
  'resetColumnState',
  'clearFilter',
  'clearSorting',
  'refreshCells',
  'redrawRows',
  'getDisplayedRowCount',
  'getSelectedRows',
  'exportDataAsCsv',
  'setFilterModel',
  'setSortModel',
  'setColumnState'
];

/**
 * Get available demo scenarios for reference
 */
export function getAvailableDemoScenarios() {
  return getAllDemoScenarios().map(scenario => ({
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    category: scenario.category,
    sampleQuestions: scenario.sampleQuestions.slice(0, 3), // First 3 questions as preview
    insights: scenario.insights.slice(0, 3), // First 3 insights as preview
  }));
}