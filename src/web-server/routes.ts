/**
 * Express routes for grid API and web interface
 */

import { Router, type Application, type Request, type Response } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { GridManager } from '../grid-manager.js';
import type WebSocketManager from './websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupRoutes(
  app: Application, 
  gridManager: GridManager, 
  wsManager: WebSocketManager
): void {
  const router = Router();

  // API Routes
  
  /**
   * Get all active grids
   */
  router.get('/api/grids', (req: Request, res: Response) => {
    try {
      const activeGrids = gridManager.getActiveGrids();
      const gridStates = wsManager.getAllGridStates();
      
      res.json({
        success: true,
        grids: activeGrids.map(gridId => {
          const state = wsManager.getGridState(gridId);
          const info = gridManager.getGridInfo(gridId);
          return {
            gridId,
            ...info,
            state,
            url: `/grid/${gridId}`
          };
        })
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get specific grid data
   */
  router.get('/api/grids/:gridId', async (req: Request, res: Response) => {
    try {
      const { gridId } = req.params;
      const gridInfo = gridManager.getGridInfo(gridId);
      const gridState = await gridManager.getGridState(gridId);
      const webState = wsManager.getGridState(gridId);

      return res.json({
        success: true,
        grid: {
          id: gridId,
          info: gridInfo,
          state: gridState,
          webState: webState
        }
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Grid not found'
      });
    }
  });

  /**
   * Get grid data for visualization
   */
  router.get('/api/grids/:gridId/data', async (req: Request, res: Response) => {
    try {
      const { gridId } = req.params;
      const gridInfo = gridManager.getGridInfo(gridId);
      const webState = wsManager.getGridState(gridId);

      if (!webState) {
        return res.status(404).json({
          success: false,
          error: 'Grid data not found'
        });
      }

      return res.json({
        success: true,
        data: {
          columnDefs: gridInfo.config.columnDefs,
          rowData: webState.data,
          gridOptions: gridInfo.config.gridOptions || {}
        }
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Grid not found'
      });
    }
  });

  /**
   * Get server status
   */
  router.get('/api/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'running',
      timestamp: new Date().toISOString(),
      activeGrids: gridManager.getActiveGrids().length,
      gridStates: wsManager.getAllGridStates().length
    });
  });

  // Web Interface Routes

  /**
   * Dashboard home page
   */
  app.get('/', (req: Request, res: Response) => {
    const publicPath = join(__dirname, '../../public');
    res.sendFile('index.html', { root: publicPath });
  });

  /**
   * Individual grid viewer
   */
  app.get('/grid/:gridId', (req: Request, res: Response) => {
    const publicPath = join(__dirname, '../../public');
    res.sendFile('grid.html', { root: publicPath });
  });

  /**
   * Grid data endpoint for web interface
   */
  app.get('/grid/:gridId/data', async (req: Request, res: Response) => {
    try {
      const { gridId } = req.params;
      const gridInfo = gridManager.getGridInfo(gridId);
      const webState = wsManager.getGridState(gridId);

      if (!webState) {
        return res.status(404).json({
          error: 'Grid not found'
        });
      }

      return res.json({
        gridId,
        columnDefs: gridInfo.config.columnDefs,
        rowData: webState.data,
        gridOptions: gridInfo.config.gridOptions || {},
        createdAt: webState.createdAt,
        lastUpdated: webState.lastUpdated
      });
    } catch (error) {
      return res.status(404).json({
        error: error instanceof Error ? error.message : 'Grid not found'
      });
    }
  });

  // Mount API routes
  app.use(router);

  console.error('[WebServer] ✅ Routes configured');
}

export default setupRoutes;