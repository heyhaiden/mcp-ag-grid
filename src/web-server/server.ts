/**
 * Express web server for real-time grid visualization
 */

import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WebSocketManager from './websocket.js';
import { setupRoutes } from './routes.js';
import type { GridManager } from '../grid-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WebServerOptions {
  port?: number;
  host?: string;
  enableCors?: boolean;
}

export class WebServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private wsManager: WebSocketManager;
  private gridManager: GridManager;
  private port: number;
  private host: string;
  private isRunning = false;

  constructor(gridManager: GridManager, options: WebServerOptions = {}) {
    this.gridManager = gridManager;
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';

    // Create Express app
    this.app = express();
    this.httpServer = createServer(this.app);

    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager(this.httpServer);

    // Setup middleware and routes
    this.setupMiddleware();
    this.setupStaticFiles();
    setupRoutes(this.app, this.gridManager, this.wsManager);
  }

  private setupMiddleware(): void {
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.error(`[WebServer] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupStaticFiles(): void {
    // Serve static files from public directory
    const publicPath = join(__dirname, '../../public');
    console.error(`[WebServer] Static files path: ${publicPath}`);
    this.app.use(express.static(publicPath));

    // Serve AG Grid assets from node_modules
    this.app.use('/ag-grid', express.static(join(__dirname, '../../node_modules/ag-grid-community/styles')));
    this.app.use('/ag-grid-js', express.static(join(__dirname, '../../node_modules/ag-grid-community/dist')));
    
    console.error('[WebServer] ✅ Static file serving configured');
  }

  /**
   * Start the web server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.error('[WebServer] Server is already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, this.host, () => {
        this.isRunning = true;
        console.error(`[WebServer] 🌐 Web server started on http://${this.host}:${this.port}`);
        console.error(`[WebServer] 📊 Dashboard: http://${this.host}:${this.port}`);
        resolve();
      });

      this.httpServer.on('error', (error) => {
        console.error('[WebServer] Failed to start server:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the web server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Close WebSocket connections
      this.wsManager.close();

      // Close HTTP server
      this.httpServer.close((error) => {
        if (error) {
          console.error('[WebServer] Error stopping server:', error);
          reject(error);
        } else {
          this.isRunning = false;
          console.error('[WebServer] Server stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Get WebSocket manager for grid event handling
   */
  getWebSocketManager(): WebSocketManager {
    return this.wsManager;
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  /**
   * Get grid viewer URL
   */
  getGridUrl(gridId: string): string {
    return `${this.getUrl()}/grid/${gridId}`;
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}

export default WebServer;