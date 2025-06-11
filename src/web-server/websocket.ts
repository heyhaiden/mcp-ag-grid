/**
 * WebSocket event handling for real-time grid updates
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import type { GridInstance } from '../grid-manager.js';

export interface GridEvent {
  type: 'grid_created' | 'grid_updated' | 'grid_filtered' | 'grid_sorted' | 'grid_exported' | 'grid_destroyed';
  gridId: string;
  timestamp: string;
  data?: any;
}

export interface GridState {
  id: string;
  config: any;
  data: any[];
  filters?: any;
  sorting?: any;
  stats?: any;
  createdAt: string;
  lastUpdated: string;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private gridStates = new Map<string, GridState>();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.error(`[WebSocket] Client connected: ${socket.id}`);

      // Send current grid states to new client
      socket.emit('grid_states', Array.from(this.gridStates.values()));

      // Handle client requests for specific grid data
      socket.on('request_grid_data', (gridId: string) => {
        const gridState = this.gridStates.get(gridId);
        if (gridState) {
          socket.emit('grid_data', gridState);
        }
      });

      socket.on('disconnect', () => {
        console.error(`[WebSocket] Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit a grid event to all connected clients
   */
  emitGridEvent(event: GridEvent): void {
    console.error(`[WebSocket] Emitting event: ${event.type} for grid ${event.gridId}`);
    this.io.emit('grid_event', event);
  }

  /**
   * Update and broadcast grid state
   */
  updateGridState(gridId: string, updates: Partial<GridState>): void {
    const existingState = this.gridStates.get(gridId);
    const gridState: GridState = {
      id: gridId,
      config: {},
      data: [],
      createdAt: new Date().toISOString(),
      ...existingState,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    this.gridStates.set(gridId, gridState);
    
    // Broadcast updated state
    this.io.emit('grid_state_updated', gridState);
  }

  /**
   * Remove grid state and notify clients
   */
  removeGrid(gridId: string): void {
    this.gridStates.delete(gridId);
    this.io.emit('grid_removed', gridId);
    
    this.emitGridEvent({
      type: 'grid_destroyed',
      gridId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get all current grid states
   */
  getAllGridStates(): GridState[] {
    return Array.from(this.gridStates.values());
  }

  /**
   * Get specific grid state
   */
  getGridState(gridId: string): GridState | undefined {
    return this.gridStates.get(gridId);
  }

  /**
   * Notify clients of grid creation
   */
  onGridCreated(gridId: string, config: any, data: any[]): void {
    const gridState: GridState = {
      id: gridId,
      config,
      data,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.gridStates.set(gridId, gridState);

    this.emitGridEvent({
      type: 'grid_created',
      gridId,
      timestamp: new Date().toISOString(),
      data: { config, rowCount: data.length }
    });

    this.io.emit('grid_state_updated', gridState);
  }

  /**
   * Notify clients of data updates
   */
  onGridDataUpdated(gridId: string, newData: any[]): void {
    this.updateGridState(gridId, { data: newData });

    this.emitGridEvent({
      type: 'grid_updated',
      gridId,
      timestamp: new Date().toISOString(),
      data: { rowCount: newData.length }
    });
  }

  /**
   * Notify clients of filter changes
   */
  onGridFiltered(gridId: string, filterModel: any, displayedRows: number): void {
    this.updateGridState(gridId, { filters: filterModel });

    this.emitGridEvent({
      type: 'grid_filtered',
      gridId,
      timestamp: new Date().toISOString(),
      data: { filterModel, displayedRows }
    });
  }

  /**
   * Notify clients of sorting changes
   */
  onGridSorted(gridId: string, sortModel: any): void {
    this.updateGridState(gridId, { sorting: sortModel });

    this.emitGridEvent({
      type: 'grid_sorted',
      gridId,
      timestamp: new Date().toISOString(),
      data: { sortModel }
    });
  }

  /**
   * Notify clients of export operations
   */
  onGridExported(gridId: string, format: string, filename: string): void {
    this.emitGridEvent({
      type: 'grid_exported',
      gridId,
      timestamp: new Date().toISOString(),
      data: { format, filename }
    });
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    this.io.close();
  }
}

export default WebSocketManager;