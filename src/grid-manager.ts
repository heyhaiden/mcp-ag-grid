import puppeteer, { Browser, Page } from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { z } from 'zod';
import type WebSocketManager from './web-server/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Zod schemas for validation
const ColumnDefSchema = z.object({
  field: z.string(),
  headerName: z.string().optional(),
  width: z.number().optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  sortable: z.boolean().optional(),
  filter: z.boolean().optional(),
  resizable: z.boolean().optional(),
  type: z.string().optional(),
}).passthrough(); // Allow additional properties

const GridConfigSchema = z.object({
  columnDefs: z.array(ColumnDefSchema),
  rowData: z.array(z.record(z.any())),
  gridOptions: z.record(z.any()).optional(),
});

const ExportFormatSchema = z.enum(['csv', 'excel']);

// TypeScript interfaces
export interface ColumnDef {
  field: string;
  headerName?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filter?: boolean;
  resizable?: boolean;
  type?: string;
  [key: string]: any; // Allow additional properties
}

export interface GridConfig {
  columnDefs: ColumnDef[];
  rowData: Record<string, any>[];
  gridOptions?: Record<string, any>;
}

export interface GridInstance {
  id: string;
  page: Page;
  config: GridConfig;
  createdAt: Date;
  lastUpdated: Date;
  isDestroyed: boolean;
}

export interface GridState {
  columnState: any[];
  filterState: Record<string, any>;
  sortState: any[];
  selectedRows: any[];
  rowCount: number;
  displayedRowCount: number;
}

export interface GridManagerOptions {
  headless?: boolean;
  devtools?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
}

export type ExportFormat = 'csv' | 'excel';

export interface ExportResult {
  data: string;
  format: ExportFormat;
  filename: string;
}

export class GridManagerError extends Error {
  constructor(
    message: string,
    public code: string,
    public gridId?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'GridManagerError';
  }
}

export class GridManager {
  private browser: Browser | null = null;
  private grids: Map<string, GridInstance> = new Map();
  private gridHtmlPath: string;
  private isInitialized = false;
  private options: GridManagerOptions;
  private webSocketManager: WebSocketManager | null = null;

  constructor(options: GridManagerOptions = {}) {
    this.options = {
      headless: true,
      devtools: false,
      viewport: { width: 1920, height: 1080 },
      ...options,
    };
    this.gridHtmlPath = join(__dirname, '..', 'web', 'grid.html');
  }

  /**
   * Set WebSocket manager for real-time updates
   */
  setWebSocketManager(wsManager: WebSocketManager): void {
    this.webSocketManager = wsManager;
  }

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless ?? true,
        devtools: this.options.devtools ?? false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      this.isInitialized = true;
      console.error('GridManager: Browser initialized successfully');
    } catch (error) {
      throw new GridManagerError(
        'Failed to initialize browser',
        'BROWSER_INIT_FAILED',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Create a new grid instance
   */
  async createGrid(config: GridConfig): Promise<string> {
    if (!this.isInitialized || !this.browser) {
      throw new GridManagerError(
        'GridManager not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }

    // Validate configuration
    try {
      GridConfigSchema.parse(config);
    } catch (error) {
      throw new GridManagerError(
        'Invalid grid configuration',
        'INVALID_CONFIG',
        undefined,
        error as Error
      );
    }

    const gridId = this.generateGridId();

    try {
      // Create new page
      const page = await this.browser.newPage();
      
      // Set viewport
      await page.setViewport(this.options.viewport!);

      // Load the grid HTML file
      const htmlContent = await this.loadGridHtml();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Wait for AG Grid system to be ready
      await page.waitForFunction(() => window.createAGGrid !== undefined, {
        timeout: 10000,
      });

      // Create the grid
      const result = await page.evaluate((config) => {
        return window.createAGGrid(config);
      }, config);

      if (!result.success) {
        throw new Error(result.error || 'Unknown error creating grid');
      }

      // Store grid instance
      const gridInstance: GridInstance = {
        id: gridId,
        page,
        config,
        createdAt: new Date(),
        lastUpdated: new Date(),
        isDestroyed: false,
      };

      this.grids.set(gridId, gridInstance);

      // Emit WebSocket event for grid creation
      if (this.webSocketManager) {
        this.webSocketManager.onGridCreated(gridId, config, config.rowData);
      }

      console.error(`GridManager: Grid created successfully with ID: ${gridId}`);
      return gridId;
    } catch (error) {
      throw new GridManagerError(
        'Failed to create grid',
        'GRID_CREATION_FAILED',
        gridId,
        error as Error
      );
    }
  }

  /**
   * Update grid data for an existing grid
   */
  async updateGridData(gridId: string, rowData: Record<string, any>[]): Promise<void> {
    const grid = this.getGridInstance(gridId);

    try {
      await grid.page.evaluate((newData) => {
        if (typeof window.updateGridData === 'function') {
          window.updateGridData(newData);
        } else {
          throw new Error('updateGridData function not available');
        }
      }, rowData);

      // Update stored config
      grid.config.rowData = rowData;
      grid.lastUpdated = new Date();

      // Emit WebSocket event for data update
      if (this.webSocketManager) {
        this.webSocketManager.onGridDataUpdated(gridId, rowData);
      }

      console.error(`GridManager: Updated data for grid ${gridId}`);
    } catch (error) {
      throw new GridManagerError(
        'Failed to update grid data',
        'UPDATE_DATA_FAILED',
        gridId,
        error as Error
      );
    }
  }

  /**
   * Execute any AG Grid API method
   */
  async executeGridMethod(
    gridId: string,
    method: string,
    params?: any[]
  ): Promise<any> {
    const grid = this.getGridInstance(gridId);

    try {
      const result = await grid.page.evaluate(
        (methodName, methodParams) => {
          if (!window.gridApi) {
            throw new Error('Grid API not available');
          }

          const apiMethod = window.gridApi[methodName];
          if (typeof apiMethod !== 'function') {
            throw new Error(`Method '${methodName}' not found on grid API`);
          }

          return apiMethod.apply(window.gridApi, methodParams || []);
        },
        method,
        params
      );

      // Emit WebSocket events for specific methods
      if (this.webSocketManager) {
        if (method === 'setFilterModel' && params && params[0]) {
          // Get current displayed row count for filter event
          const displayedRows = await grid.page.evaluate(() => {
            return window.gridApi ? window.gridApi.getDisplayedRowCount() : 0;
          });
          this.webSocketManager.onGridFiltered(gridId, params[0], displayedRows);
        } else if (method === 'applyColumnState' && params && params[0]) {
          this.webSocketManager.onGridSorted(gridId, params[0]);
        }
      }

      console.error(`GridManager: Executed method ${method} on grid ${gridId}`);
      return result;
    } catch (error) {
      throw new GridManagerError(
        `Failed to execute grid method: ${method}`,
        'METHOD_EXECUTION_FAILED',
        gridId,
        error as Error
      );
    }
  }

  /**
   * Export grid data in specified format
   */
  async exportGridData(gridId: string, format: ExportFormat): Promise<ExportResult> {
    const grid = this.getGridInstance(gridId);

    // Validate format
    try {
      ExportFormatSchema.parse(format);
    } catch (error) {
      throw new GridManagerError(
        'Invalid export format',
        'INVALID_EXPORT_FORMAT',
        gridId,
        error as Error
      );
    }

    try {
      let data: string;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `grid-export-${gridId}-${timestamp}.${format}`;

      if (format === 'csv') {
        data = await grid.page.evaluate(() => {
          if (!window.gridApi) {
            throw new Error('Grid API not available');
          }

          // Get CSV data using AG Grid's built-in export
          return window.gridApi.getDataAsCsv();
        });
      } else if (format === 'excel') {
        // For Excel format, we'll export as CSV for now
        // In a real implementation, you might want to use a library like ExcelJS
        data = await grid.page.evaluate(() => {
          if (!window.gridApi) {
            throw new Error('Grid API not available');
          }

          return window.gridApi.getDataAsCsv();
        });
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      // Emit WebSocket event for export
      if (this.webSocketManager) {
        this.webSocketManager.onGridExported(gridId, format, filename);
      }

      console.error(`GridManager: Exported grid ${gridId} as ${format}`);
      return { data, format, filename };
    } catch (error) {
      throw new GridManagerError(
        `Failed to export grid data as ${format}`,
        'EXPORT_FAILED',
        gridId,
        error as Error
      );
    }
  }

  /**
   * Get current grid state (filters, sort, selection, etc.)
   */
  async getGridState(gridId: string): Promise<GridState> {
    const grid = this.getGridInstance(gridId);

    try {
      const state = await grid.page.evaluate(() => {
        if (!window.gridApi) {
          throw new Error('Grid API not available');
        }

        const columnState = window.gridApi.getColumnState();
        const filterState = window.gridApi.getFilterModel();
        const selectedRows = window.gridApi.getSelectedRows();
        const displayedRowCount = window.gridApi.getDisplayedRowCount();
        
        // Extract sort state from column state
        const sortState = columnState
          .filter((col: any) => col.sort !== null)
          .map((col: any) => ({
            colId: col.colId,
            sort: col.sort,
            sortIndex: col.sortIndex
          }))
          .sort((a: any, b: any) => (a.sortIndex || 0) - (b.sortIndex || 0));

        return {
          columnState: columnState,
          filterState: filterState,
          sortState: sortState,
          selectedRows: selectedRows,
          rowCount: displayedRowCount,
          displayedRowCount: displayedRowCount,
        };
      });

      console.error(`GridManager: Retrieved state for grid ${gridId}`);
      return state;
    } catch (error) {
      throw new GridManagerError(
        'Failed to get grid state',
        'GET_STATE_FAILED',
        gridId,
        error as Error
      );
    }
  }

  /**
   * Destroy a specific grid instance
   */
  async destroyGrid(gridId: string): Promise<void> {
    const grid = this.grids.get(gridId);
    if (!grid) {
      throw new GridManagerError(
        `Grid with ID ${gridId} not found`,
        'GRID_NOT_FOUND',
        gridId
      );
    }

    try {
      if (!grid.isDestroyed) {
        // Destroy the grid in the page
        await grid.page.evaluate(() => {
          if (window.gridApi) {
            window.gridApi.destroy();
          }
        });

        // Close the page
        await grid.page.close();
        grid.isDestroyed = true;
      }

      // Remove from map
      this.grids.delete(gridId);

      // Emit WebSocket event for grid destruction
      if (this.webSocketManager) {
        this.webSocketManager.removeGrid(gridId);
      }

      console.error(`GridManager: Destroyed grid ${gridId}`);
    } catch (error) {
      throw new GridManagerError(
        'Failed to destroy grid',
        'DESTROY_FAILED',
        gridId,
        error as Error
      );
    }
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    console.error('GridManager: Starting cleanup...');

    // Destroy all grids
    const gridIds = Array.from(this.grids.keys());
    for (const gridId of gridIds) {
      try {
        await this.destroyGrid(gridId);
      } catch (error) {
        console.error(`Error destroying grid ${gridId}:`, error);
      }
    }

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }

    this.isInitialized = false;
    console.error('GridManager: Cleanup completed');
  }

  /**
   * Get list of active grids
   */
  getActiveGrids(): string[] {
    return Array.from(this.grids.keys()).filter(
      (id) => !this.grids.get(id)?.isDestroyed
    );
  }

  /**
   * Get grid information
   */
  getGridInfo(gridId: string): Omit<GridInstance, 'page'> {
    const grid = this.getGridInstance(gridId);
    
    return {
      id: grid.id,
      config: grid.config,
      createdAt: grid.createdAt,
      lastUpdated: grid.lastUpdated,
      isDestroyed: grid.isDestroyed,
    };
  }

  // Private helper methods

  private getGridInstance(gridId: string): GridInstance {
    const grid = this.grids.get(gridId);
    if (!grid) {
      throw new GridManagerError(
        `Grid with ID ${gridId} not found`,
        'GRID_NOT_FOUND',
        gridId
      );
    }

    if (grid.isDestroyed) {
      throw new GridManagerError(
        `Grid with ID ${gridId} has been destroyed`,
        'GRID_DESTROYED',
        gridId
      );
    }

    return grid;
  }

  private generateGridId(): string {
    return `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadGridHtml(): Promise<string> {
    try {
      return await readFile(this.gridHtmlPath, 'utf-8');
    } catch (error) {
      throw new GridManagerError(
        `Failed to load grid HTML file: ${this.gridHtmlPath}`,
        'HTML_LOAD_FAILED',
        undefined,
        error as Error
      );
    }
  }
}

// Global type declarations for browser window
declare global {
  interface Window {
    createAGGrid: (config: any) => { success: boolean; error?: string };
    updateGridData: (data: any[]) => void;
    getGridData: () => any[];
    getSelectedRows: () => any[];
    gridApi: any;
    columnApi: any;
  }
}