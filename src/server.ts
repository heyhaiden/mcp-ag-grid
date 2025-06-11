#!/usr/bin/env node

/**
 * AG Grid MCP Server
 * 
 * A Model Context Protocol server that provides AG Grid functionality
 * for data visualization and manipulation through headless browser automation.
 * 
 * This server exposes tools for creating, managing, and exporting AG Grid instances,
 * along with resources for accessing grid data and metadata.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GridManager, GridManagerError } from './grid-manager.js';
import { setupGridTools, getAvailableDemoScenarios } from './tools/grid-tools.js';
import { setupDataResources } from './resources/data-resources.js';
import { getAllDemoScenarios } from './examples/demo-scenarios.js';
import WebServer from './web-server/server.js';

/**
 * Server configuration
 */
const SERVER_CONFIG = {
  name: 'ag-grid-server',
  version: '1.0.0',
  description: 'MCP server for AG Grid data visualization and manipulation',
} as const;

/**
 * Global server and grid manager instances
 */
let mcpServer: McpServer;
let gridManager: GridManager;
let webServer: WebServer;
let isShuttingDown = false;

/**
 * Log messages to stderr to avoid interfering with MCP protocol on stdout
 */
function logToStderr(message: string, level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' = 'INFO'): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${SERVER_CONFIG.name}]`;
  
  // Only log DEBUG messages if DEBUG environment variable is set
  if (level === 'DEBUG' && !process.env.DEBUG) {
    return;
  }
  
  console.error(`${prefix} ${message}`);
}

/**
 * Debug logging helper
 */
function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    if (data) {
      logToStderr(`${message}: ${JSON.stringify(data, null, 2)}`, 'DEBUG');
    } else {
      logToStderr(message, 'DEBUG');
    }
  }
}

/**
 * Performance timing helper
 */
function timeOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  return operation().then(
    (result) => {
      const duration = Date.now() - startTime;
      debugLog(`${operationName} completed in ${duration}ms`);
      return result;
    },
    (error) => {
      const duration = Date.now() - startTime;
      logToStderr(`${operationName} failed after ${duration}ms: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  );
}

/**
 * Initialize the GridManager with optimal settings for MCP usage
 */
async function initializeGridManager(): Promise<GridManager> {
  return timeOperation('GridManager initialization', async () => {
    logToStderr('Initializing GridManager...');
    debugLog('GridManager configuration', {
      headless: true,
      devtools: process.env.NODE_ENV === 'development',
      viewport: { width: 1920, height: 1080 },
      nodeEnv: process.env.NODE_ENV,
      debugEnabled: !!process.env.DEBUG,
    });
    
    const manager = new GridManager({
      headless: process.env.NODE_ENV !== 'development' || !process.env.PUPPETEER_HEADLESS_DISABLE,
      devtools: process.env.NODE_ENV === 'development',
      viewport: {
        width: 1920,
        height: 1080,
      },
    });

    await manager.initialize();
    logToStderr('GridManager initialized successfully');
    return manager;
  });
}

/**
 * Initialize the WebServer with optimal settings for MCP usage
 */
async function initializeWebServer(): Promise<WebServer> {
  return timeOperation('WebServer initialization', async () => {
    logToStderr('Initializing WebServer...');
    
    const port = parseInt(process.env.WEB_SERVER_PORT || '3000');
    const host = process.env.WEB_SERVER_HOST || 'localhost';
    
    debugLog('WebServer configuration', {
      port,
      host,
      enableCors: true,
    });
    
    const server = new WebServer(gridManager, {
      port,
      host,
      enableCors: true,
    });

    // Connect GridManager to WebSocket events if WebSocket manager exists
    if (server.getWebSocketManager()) {
      gridManager.setWebSocketManager(server.getWebSocketManager());
    }

    // Start the web server
    await server.start();
    
    logToStderr(`WebServer initialized successfully on http://${host}:${port}`);
    return server;
  });
}

/**
 * Set up help and information tools
 */
function setupHelpTools(server: McpServer, gridManager: GridManager): void {
  // Help tool
  server.tool(
    'help',
    'Get comprehensive help information about the AG Grid MCP Server, including available tools, resources, and usage examples.',
    {},
    async () => {
      const availableScenarios = getAllDemoScenarios().map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description
      }));

      const helpInfo = {
        server: {
          name: SERVER_CONFIG.name,
          version: SERVER_CONFIG.version,
          description: SERVER_CONFIG.description,
        },
        capabilities: {
          description: "This MCP server provides comprehensive AG Grid functionality for data visualization and analysis.",
          features: [
            "Create interactive data grids with sorting, filtering, and selection",
            "Export grid data to CSV and Excel formats", 
            "Access pre-built demo scenarios for quick testing",
            "Manage multiple grids simultaneously",
            "Get detailed grid statistics and state information",
            "Execute AG Grid API methods for advanced operations"
          ]
        },
        tools: [
          {
            name: "create_grid",
            description: "Create a new AG Grid with column definitions and data",
            usage: "Perfect for displaying tabular data with interactive features"
          },
          {
            name: "update_grid_data", 
            description: "Update existing grid data",
            usage: "Use when you need to refresh grid with new data"
          },
          {
            name: "apply_grid_filter",
            description: "Apply filters to grid data",
            usage: "Filter data by specific criteria using AG Grid filter model"
          },
          {
            name: "export_grid",
            description: "Export grid data to CSV or Excel",
            usage: "Generate reports or share data in standard formats"
          },
          {
            name: "get_grid_stats",
            description: "Get comprehensive grid statistics and state",
            usage: "Analyze grid performance, filters, sorting, and data quality"
          },
          {
            name: "execute_grid_method",
            description: "Execute any AG Grid API method",
            usage: "Advanced operations like selectAll, clearSelection, etc."
          },
          {
            name: "load_demo_scenario",
            description: "Load pre-built demo scenarios with realistic data",
            usage: "Quick start with sales, employee, financial, or ecommerce data"
          }
        ],
        resources: [
          {
            name: "grid://list",
            description: "List all active grids with basic information"
          },
          {
            name: "grid://schema/{gridId}",
            description: "Get column schema and configuration for a specific grid"
          },
          {
            name: "grid://data/{gridId}",
            description: "Access raw grid data and statistics"
          },
          {
            name: "grid://summary/{gridId}",
            description: "Get data quality analysis and summary statistics"
          }
        ],
        demoScenarios: availableScenarios,
        quickStart: [
          "1. Try: load_demo_scenario with scenarioId 'sales-dashboard'",
          "2. Explore the data with get_grid_stats",
          "3. Apply filters with apply_grid_filter",
          "4. Export results with export_grid",
          "5. See usage examples at: examples/usage-examples.md"
        ],
        documentation: [
          "README.md - Setup and basic usage",
          "examples/usage-examples.md - Comprehensive usage examples", 
          "docs/troubleshooting.md - Common issues and solutions"
        ],
        support: {
          issues: "Report issues on GitHub",
          examples: "See examples/ directory for detailed usage patterns",
          troubleshooting: "Check docs/troubleshooting.md for common problems"
        }
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(helpInfo, null, 2)
          }
        ]
      };
    }
  );

  // List available demo scenarios
  server.tool(
    'list_demo_scenarios',
    'List all available demo scenarios with descriptions and sample questions.',
    {},
    async () => {
      const scenarios = getAllDemoScenarios().map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        category: scenario.category,
        insights: scenario.insights.slice(0, 3), // First 3 insights
        sampleQuestions: scenario.sampleQuestions.slice(0, 5), // First 5 questions
        dataSize: {
          rows: scenario.gridConfig.rowData.length,
          columns: scenario.gridConfig.columnDefs.length
        }
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              totalScenarios: scenarios.length,
              categories: [...new Set(scenarios.map(s => s.category))],
              scenarios: scenarios,
              usage: "Use load_demo_scenario tool with any scenario ID to get started"
            }, null, 2)
          }
        ]
      };
    }
  );

  // Server capabilities and status
  server.tool(
    'server_info',
    'Get detailed information about server capabilities, status, and environment.',
    {},
    async () => {
      const activeGrids = gridManager.getActiveGrids();
      const serverInfo = {
        server: {
          name: SERVER_CONFIG.name,
          version: SERVER_CONFIG.version,
          description: SERVER_CONFIG.description,
          startTime: new Date().toISOString(),
          uptime: process.uptime(),
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memoryUsage: process.memoryUsage(),
        },
        gridManager: {
          isInitialized: !!gridManager,
          activeGrids: activeGrids.length,
          gridIds: activeGrids
        },
        webServer: {
          isRunning: webServer?.isServerRunning() || false,
          url: webServer?.getUrl() || 'Not available',
          dashboardUrl: webServer?.getUrl() || 'Not available',
        },
        capabilities: {
          tools: 11, // Total number of tools
          resources: 4, // Total number of resource patterns
          demoScenarios: getAllDemoScenarios().length,
          browserAutomation: true,
          dataExport: true,
          filtering: true,
          sorting: true,
          realTimeVisualization: !!webServer
        },
        usage: {
          quickCommands: [
            "help - Show this help information",
            "list_demo_scenarios - See available demo data",
            "load_demo_scenario with scenarioId 'sales-dashboard' - Quick start",
            "get_grid_url with gridId - Get web viewer URL for real-time visualization"
          ],
          webVisualization: webServer ? [
            `Dashboard: ${webServer.getUrl()}`,
            `Individual grid viewer: ${webServer.getUrl()}/grid/{gridId}`,
            "Real-time updates as you manipulate grids through Claude"
          ] : ["Web visualization not available"]
        }
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(serverInfo, null, 2)
          }
        ]
      };
    }
  );

  logToStderr('✅ Help tools registered successfully');
}

/**
 * Set up the MCP server with all tools and resources
 */
async function setupMcpServer(): Promise<McpServer> {
  return timeOperation('MCP server setup', async () => {
    logToStderr('Setting up MCP server...');
    debugLog('Server configuration', SERVER_CONFIG);

    const server = new McpServer(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Initialize GridManager
    gridManager = await initializeGridManager();

    // Initialize WebServer (optional, skip if disabled)
    if (process.env.DISABLE_WEB_SERVER !== 'true') {
      try {
        webServer = await initializeWebServer();
      } catch (error) {
        logToStderr(`WebServer initialization failed, continuing without web interface: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WARN');
      }
    } else {
      logToStderr('WebServer disabled by DISABLE_WEB_SERVER environment variable');
    }

    // Register tools and resources
    logToStderr('Registering tools and resources...');
    debugLog('Registering AG Grid tools and data resources');
    
    setupGridTools(server, gridManager, webServer);
    setupDataResources(server, gridManager);
    setupHelpTools(server, gridManager);

    logToStderr('MCP server setup completed successfully');
    debugLog('Server capabilities', {
      toolsRegistered: true,
      resourcesRegistered: true,
      helpToolsRegistered: true,
      gridManagerReady: true,
      webServerReady: true,
      webServerUrl: webServer.getUrl(),
      totalTools: 11, // 8 grid tools + 3 help tools
      totalResources: 4,
    });
    
    return server;
  });
}

/**
 * Clean shutdown handler
 */
async function handleShutdown(signal?: string): Promise<void> {
  if (isShuttingDown) {
    logToStderr('Shutdown already in progress, forcing exit...');
    process.exit(1);
  }

  isShuttingDown = true;
  logToStderr(`Received ${signal || 'shutdown signal'}, cleaning up...`);

  try {
    // Stop WebServer
    if (webServer) {
      logToStderr('Stopping WebServer...');
      await webServer.stop();
      logToStderr('WebServer stopped');
    }

    // Clean up GridManager
    if (gridManager) {
      logToStderr('Cleaning up GridManager...');
      await gridManager.cleanup();
      logToStderr('GridManager cleanup completed');
    }

    // Close MCP server
    if (mcpServer) {
      logToStderr('Closing MCP server...');
      await mcpServer.close();
      logToStderr('MCP server closed');
    }

    logToStderr('Shutdown completed successfully');
  } catch (error) {
    logToStderr(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
  }

  process.exit(0);
}

/**
 * Set up process signal handlers for clean shutdown
 */
function setupSignalHandlers(): void {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logToStderr('Received SIGINT');
    handleShutdown('SIGINT').catch((error) => {
      logToStderr(`Error in SIGINT handler: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      process.exit(1);
    });
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logToStderr('Received SIGTERM');
    handleShutdown('SIGTERM').catch((error) => {
      logToStderr(`Error in SIGTERM handler: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logToStderr(`Uncaught exception: ${error.message}`, 'ERROR');
    logToStderr(`Stack trace: ${error.stack}`, 'ERROR');
    handleShutdown('uncaughtException').catch(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logToStderr(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'ERROR');
    handleShutdown('unhandledRejection').catch(() => {
      process.exit(1);
    });
  });

  // Handle process exit
  process.on('exit', (code) => {
    if (!isShuttingDown) {
      logToStderr(`Process exiting with code: ${code}`);
    }
  });

  // Handle parent process death (when Claude Desktop closes)
  process.on('disconnect', () => {
    logToStderr('Parent process disconnected (Claude Desktop closed)');
    handleShutdown('disconnect').catch(() => {
      process.exit(1);
    });
  });

  // Additional cleanup on various exit scenarios
  ['SIGHUP', 'SIGQUIT', 'SIGABRT'].forEach(signal => {
    process.on(signal, () => {
      logToStderr(`Received ${signal}`);
      handleShutdown(signal).catch(() => {
        process.exit(1);
      });
    });
  });
}

/**
 * Main server function
 */
async function main(): Promise<void> {
  try {
    logToStderr(`Starting ${SERVER_CONFIG.name} v${SERVER_CONFIG.version}...`);
    
    // Log environment information
    debugLog('Environment information', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV || 'production',
      debugEnabled: !!process.env.DEBUG,
      puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      argv: process.argv,
    });

    // Set up signal handlers for clean shutdown
    setupSignalHandlers();

    // Set up the MCP server
    mcpServer = await setupMcpServer();

    // Connect to stdio transport
    logToStderr('Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);

    logToStderr(`🚀 ${SERVER_CONFIG.name} started successfully and ready for connections`);
    logToStderr('Server is running and connected to stdio transport');
    debugLog('Server startup completed', {
      serverName: SERVER_CONFIG.name,
      version: SERVER_CONFIG.version,
      transportType: 'stdio',
      gridManagerInitialized: !!gridManager,
    });

  } catch (error) {
    logToStderr(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    
    if (error instanceof Error && error.stack) {
      debugLog('Startup error stack trace', error.stack);
    }

    // Attempt cleanup before exit
    await handleShutdown('startup-error');
    process.exit(1);
  }
}

/**
 * Handle module execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  // This script is being run directly
  main().catch((error) => {
    logToStderr(`Fatal error in main(): ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    process.exit(1);
  });
}

// Export for potential testing or programmatic usage
export { main, SERVER_CONFIG, setupMcpServer, handleShutdown };