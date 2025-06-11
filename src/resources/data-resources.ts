import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GridManager, GridManagerError, type ColumnDef } from '../grid-manager.js';

/**
 * URI patterns for grid resources
 */
export const GRID_RESOURCE_URIS = {
  GRID_LIST: 'grid://list',
  GRID_SCHEMA: 'grid://schema/{gridId}',
  GRID_DATA_SAMPLE: 'grid://data/{gridId}',
  GRID_SUMMARY: 'grid://summary/{gridId}',
} as const;

/**
 * Resource content types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  TEXT: 'text/plain',
} as const;

/**
 * Statistical analysis helper functions
 */
interface ColumnStats {
  field: string;
  type: string;
  nullCount: number;
  uniqueCount: number;
  sampleValues: any[];
  // Numeric stats (if applicable)
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  // String stats (if applicable)
  avgLength?: number;
  maxLength?: number;
  minLength?: number;
}

interface GridSummaryStats {
  gridId: string;
  totalRows: number;
  totalColumns: number;
  columnStats: ColumnStats[];
  dataTypes: Record<string, number>;
  completeness: number; // Percentage of non-null values
  generatedAt: string;
}

/**
 * Analyze column data and generate statistics
 */
function analyzeColumnData(data: any[], field: string, columnDef: ColumnDef): ColumnStats {
  const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined);
  const nullCount = data.length - values.length;
  const uniqueValues = [...new Set(values)];
  
  const stats: ColumnStats = {
    field,
    type: columnDef.type || inferDataType(values),
    nullCount,
    uniqueCount: uniqueValues.length,
    sampleValues: uniqueValues.slice(0, 5), // First 5 unique values as sample
  };

  // Add numeric statistics if applicable
  if (stats.type === 'number' && values.length > 0) {
    const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
    if (numericValues.length > 0) {
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
      stats.mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      stats.median = sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
    }
  }

  // Add string statistics if applicable
  if (stats.type === 'text' && values.length > 0) {
    const stringValues = values.filter(val => typeof val === 'string');
    if (stringValues.length > 0) {
      const lengths = stringValues.map(str => str.length);
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
      stats.avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    }
  }

  return stats;
}

/**
 * Infer data type from sample values
 */
function inferDataType(values: any[]): string {
  if (values.length === 0) return 'unknown';
  
  const sample = values.slice(0, 10);
  let numberCount = 0;
  let stringCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  for (const value of sample) {
    if (typeof value === 'number' && !isNaN(value)) {
      numberCount++;
    } else if (typeof value === 'boolean') {
      booleanCount++;
    } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      dateCount++;
    } else if (typeof value === 'string') {
      stringCount++;
    }
  }

  const total = sample.length;
  if (numberCount / total > 0.8) return 'number';
  if (booleanCount / total > 0.8) return 'boolean';
  if (dateCount / total > 0.8) return 'date';
  return 'text';
}

/**
 * Generate comprehensive grid summary with statistics
 */
async function generateGridSummary(gridManager: GridManager, gridId: string): Promise<GridSummaryStats> {
  try {
    const gridInfo = gridManager.getGridInfo(gridId);
    const gridState = await gridManager.getGridState(gridId);
    
    // Get current data from the grid
    const currentData = await gridManager.executeGridMethod(gridId, 'getRenderedNodes');
    const rowData = currentData ? currentData.map((node: any) => node.data) : gridInfo.config.rowData;
    
    // Analyze each column
    const columnStats = gridInfo.config.columnDefs.map(colDef => 
      analyzeColumnData(rowData, colDef.field, colDef)
    );

    // Calculate data type distribution
    const dataTypes: Record<string, number> = {};
    columnStats.forEach(stat => {
      dataTypes[stat.type] = (dataTypes[stat.type] || 0) + 1;
    });

    // Calculate completeness (percentage of non-null values)
    const totalCells = rowData.length * columnStats.length;
    const nullCells = columnStats.reduce((sum, stat) => sum + stat.nullCount, 0);
    const completeness = totalCells > 0 ? ((totalCells - nullCells) / totalCells) * 100 : 0;

    return {
      gridId,
      totalRows: rowData.length,
      totalColumns: columnStats.length,
      columnStats,
      dataTypes,
      completeness: Math.round(completeness * 100) / 100,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new GridManagerError(
      'Failed to generate grid summary',
      'SUMMARY_GENERATION_FAILED',
      gridId,
      error as Error
    );
  }
}

/**
 * Set up all data resources for the MCP server
 */
export function setupDataResources(server: McpServer, gridManager: GridManager): void {

  // Resource 1: Grid List - List all active grids
  server.resource(
    'Active Grids List',
    GRID_RESOURCE_URIS.GRID_LIST,
    async () => {
      try {
        const activeGrids = gridManager.getActiveGrids();
        const gridList = activeGrids.map(gridId => {
          try {
            const info = gridManager.getGridInfo(gridId);
            return {
              gridId,
              createdAt: info.createdAt,
              lastUpdated: info.lastUpdated,
              columnCount: info.config.columnDefs.length,
              rowCount: info.config.rowData.length,
              columnFields: info.config.columnDefs.map(col => col.field),
              hasFilters: Object.keys(info.config.gridOptions || {}).some(key => key.includes('filter')),
            };
          } catch (error) {
            return {
              gridId,
              error: 'Failed to retrieve grid information',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        const response = {
          totalGrids: activeGrids.length,
          grids: gridList,
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: GRID_RESOURCE_URIS.GRID_LIST,
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(response, null, 2),
          }]
        };
      } catch (error) {
        const errorResponse = {
          error: 'Failed to retrieve grid list',
          message: error instanceof Error ? error.message : 'Unknown error',
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: GRID_RESOURCE_URIS.GRID_LIST,
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(errorResponse, null, 2),
          }]
        };
      }
    }
  );

  // Resource 2: Grid Schema - Column definitions and data types
  server.resource(
    'Grid Schema',
    GRID_RESOURCE_URIS.GRID_SCHEMA,
    async (uri) => {
      const gridId = uri.toString().replace('grid://schema/', '');
      
      try {
        const gridInfo = gridManager.getGridInfo(gridId);
        const gridState = await gridManager.getGridState(gridId);
        
        const schema = {
          gridId,
          columnDefinitions: gridInfo.config.columnDefs.map(colDef => ({
            field: colDef.field,
            headerName: colDef.headerName || colDef.field,
            type: colDef.type || 'text',
            width: colDef.width,
            minWidth: colDef.minWidth,
            maxWidth: colDef.maxWidth,
            sortable: colDef.sortable !== false,
            filter: colDef.filter !== false,
            resizable: colDef.resizable !== false,
            // Add any additional properties
            ...Object.fromEntries(
              Object.entries(colDef).filter(([key]) => 
                !['field', 'headerName', 'type', 'width', 'minWidth', 'maxWidth', 'sortable', 'filter', 'resizable'].includes(key)
              )
            ),
          })),
          columnCount: gridInfo.config.columnDefs.length,
          currentState: {
            hasFilters: Object.keys(gridState.filterState).length > 0,
            hasSorting: gridState.sortState.length > 0,
            filterModel: gridState.filterState,
            sortModel: gridState.sortState,
          },
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: uri.toString(),
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(schema, null, 2),
          }]
        };
      } catch (error) {
        const errorResponse = {
          gridId,
          error: 'Failed to retrieve grid schema',
          message: error instanceof Error ? error.message : 'Unknown error',
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: uri.toString(),
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(errorResponse, null, 2),
          }]
        };
      }
    }
  );

  // Resource 3: Grid Data Sample - First 10 rows of data
  server.resource(
    'Grid Data Sample',
    GRID_RESOURCE_URIS.GRID_DATA_SAMPLE,
    async (uri) => {
      const gridId = uri.toString().replace('grid://data/', '');
      
      try {
        const gridInfo = gridManager.getGridInfo(gridId);
        const gridState = await gridManager.getGridState(gridId);
        
        // Get current displayed data (respecting filters/sorting)
        let sampleData: any[];
        try {
          const displayedNodes = await gridManager.executeGridMethod(gridId, 'getRenderedNodes');
          sampleData = displayedNodes ? displayedNodes.slice(0, 10).map((node: any) => node.data) : [];
        } catch {
          // Fallback to original data if rendered nodes not available
          sampleData = gridInfo.config.rowData.slice(0, 10);
        }

        const response = {
          gridId,
          sampleSize: sampleData.length,
          totalRows: gridState.rowCount,
          displayedRows: gridState.displayedRowCount,
          isFiltered: Object.keys(gridState.filterState).length > 0,
          isSorted: gridState.sortState.length > 0,
          columnFields: gridInfo.config.columnDefs.map(col => col.field),
          sampleData,
          note: sampleData.length < 10 ? 'Showing all available data' : 'Showing first 10 rows of displayed data',
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: uri.toString(),
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(response, null, 2),
          }]
        };
      } catch (error) {
        const errorResponse = {
          gridId,
          error: 'Failed to retrieve grid data sample',
          message: error instanceof Error ? error.message : 'Unknown error',
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: uri.toString(),
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(errorResponse, null, 2),
          }]
        };
      }
    }
  );

  // Resource 4: Grid Summary - Statistical summary of grid data
  server.resource(
    'Grid Statistical Summary',
    GRID_RESOURCE_URIS.GRID_SUMMARY,
    async (uri) => {
      const gridId = uri.toString().replace('grid://summary/', '');
      
      try {
        const summary = await generateGridSummary(gridManager, gridId);

        return {
          contents: [{
            uri: uri.toString(),
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(summary, null, 2),
          }]
        };
      } catch (error) {
        const errorResponse = {
          gridId,
          error: 'Failed to generate grid summary',
          message: error instanceof Error ? error.message : 'Unknown error',
          generatedAt: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: uri.toString(),
            mimeType: CONTENT_TYPES.JSON,
            text: JSON.stringify(errorResponse, null, 2),
          }]
        };
      }
    }
  );

  console.error('✅ AG Grid data resources registered successfully');
}

/**
 * Helper function to construct resource URIs
 */
export function buildResourceUri(type: keyof typeof GRID_RESOURCE_URIS, gridId?: string): string {
  const template = GRID_RESOURCE_URIS[type];
  if (gridId && template.includes('{gridId}')) {
    return template.replace('{gridId}', gridId);
  }
  return template;
}

/**
 * Utility function to get all available resource URIs for a grid
 */
export function getGridResourceUris(gridId: string): Record<string, string> {
  return {
    list: GRID_RESOURCE_URIS.GRID_LIST,
    schema: buildResourceUri('GRID_SCHEMA', gridId),
    data: buildResourceUri('GRID_DATA_SAMPLE', gridId),
    summary: buildResourceUri('GRID_SUMMARY', gridId),
  };
}

/**
 * Resource metadata for documentation
 */
export const RESOURCE_METADATA = {
  [GRID_RESOURCE_URIS.GRID_LIST]: {
    description: 'Lists all active grids with basic metadata',
    example: 'grid://list',
    parameters: 'None',
  },
  [GRID_RESOURCE_URIS.GRID_SCHEMA]: {
    description: 'Returns column definitions and current grid state',
    example: 'grid://schema/grid_123456',
    parameters: 'gridId - The unique identifier of the grid',
  },
  [GRID_RESOURCE_URIS.GRID_DATA_SAMPLE]: {
    description: 'Returns first 10 rows of grid data (respects current filters/sorting)',
    example: 'grid://data/grid_123456',
    parameters: 'gridId - The unique identifier of the grid',
  },
  [GRID_RESOURCE_URIS.GRID_SUMMARY]: {
    description: 'Returns comprehensive statistical analysis of grid data',
    example: 'grid://summary/grid_123456',
    parameters: 'gridId - The unique identifier of the grid',
  },
};