/**
 * Grid Viewer JavaScript for individual grid display
 */

// Enable AG Grid ValidationModule in development for better error diagnosis
document.addEventListener('DOMContentLoaded', function() {
    if (typeof agGrid !== 'undefined' && agGrid.ModuleRegistry && agGrid.ValidationModule) {
        // Detect development mode from various indicators
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.search.includes('debug=true');
        
        if (isDevelopment) {
            if (agGrid.ValidationModule) {
                console.log('AG Grid: Enabling ValidationModule for enhanced error diagnosis');
                agGrid.ModuleRegistry.registerModules([agGrid.ValidationModule]);
            } else {
                console.log('AG Grid: ValidationModule not available in this build (community edition from CDN)');
            }
        }
    }
});

class GridViewer {
    constructor() {
        this.socket = null;
        this.gridApi = null;
        this.gridOptions = null;
        this.gridId = null;
        this.events = [];
        this.maxEvents = 20;
        
        this.init();
    }

    async init() {
        this.extractGridId();
        this.setupSocketConnection();
        this.setupEventHandlers();
        await this.loadGridData();
    }

    extractGridId() {
        const path = window.location.pathname;
        const matches = path.match(/\/grid\/(.+)$/);
        this.gridId = matches ? matches[1] : null;
        
        if (!this.gridId) {
            this.showError('Invalid grid URL');
            return;
        }

        document.getElementById('current-grid-id').textContent = this.gridId;
        document.getElementById('grid-title').textContent = `Grid ${this.gridId.split('_')[1] || this.gridId}`;
    }

    setupSocketConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            console.log('Connected to server');
            
            // Request current grid data
            if (this.gridId) {
                this.socket.emit('request_grid_data', this.gridId);
            }
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            console.log('Disconnected from server');
        });

        this.socket.on('grid_event', (event) => {
            if (event.gridId === this.gridId) {
                this.handleGridEvent(event);
            }
        });

        this.socket.on('grid_state_updated', (gridState) => {
            if (gridState.id === this.gridId) {
                this.updateGrid(gridState);
            }
        });

        this.socket.on('grid_data', (gridState) => {
            if (gridState.id === this.gridId) {
                this.updateGrid(gridState);
            }
        });

        this.socket.on('grid_removed', (gridId) => {
            if (gridId === this.gridId) {
                this.showError('Grid has been removed');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus(false);
        });
    }

    setupEventHandlers() {
        // Refresh button
        document.getElementById('refresh-button').addEventListener('click', () => {
            this.loadGridData();
        });

        // Events panel toggle
        document.getElementById('toggle-events').addEventListener('click', () => {
            const panel = document.getElementById('events-panel');
            const button = document.getElementById('toggle-events');
            
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                button.textContent = 'Hide';
            } else {
                panel.classList.add('hidden');
                button.textContent = 'Show';
            }
        });

        // Clear filters button
        document.getElementById('clear-filters').addEventListener('click', () => {
            if (this.gridApi) {
                this.gridApi.setFilterModel(null);
            }
        });

        // Clear sorting button
        document.getElementById('clear-sorting').addEventListener('click', () => {
            if (this.gridApi) {
                this.gridApi.applyColumnState({
                    defaultState: { sort: null }
                });
            }
        });
    }

    async loadGridData() {
        try {
            this.showLoading();
            
            const response = await fetch(`/grid/${this.gridId}/data`);
            if (!response.ok) {
                throw new Error('Grid not found');
            }
            
            const gridData = await response.json();
            this.createGrid(gridData);
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading grid data:', error);
            this.showError(error.message);
        }
    }

    createGrid(gridData) {
        const container = document.getElementById('grid-container');
        
        // Clear existing grid
        if (this.gridApi) {
            this.gridApi.destroy();
            this.gridApi = null;
        }

        // Configure grid options
        this.gridOptions = {
            columnDefs: gridData.columnDefs,
            rowData: gridData.rowData,
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: true
            },
            cellSelection: true,
            rowSelection: { mode: 'multiRow' },
            suppressMenuHide: true,
            pagination: true,
            paginationPageSize: 100,
            animateRows: true,
            ...gridData.gridOptions,
            
            // Event handlers
            onGridReady: (params) => {
                this.gridApi = params.api;
                this.updateStats(gridData);
                params.api.sizeColumnsToFit();
            },
            
            onFilterChanged: () => {
                this.updateFilterDisplay();
                this.updateRowCount();
            },
            
            onSortChanged: () => {
                this.updateSortDisplay();
            },
            
            onSelectionChanged: () => {
                this.updateSelection();
            }
        };

        // Create grid
        this.gridApi = agGrid.createGrid(container, this.gridOptions);
    }

    updateGrid(gridState) {
        if (!this.gridApi) {
            // Grid not created yet, create it
            this.createGridFromState(gridState);
            return;
        }

        // Update existing grid
        this.gridApi.setRowData(gridState.data);
        
        // Apply filters if they exist
        if (gridState.filters) {
            this.gridApi.setFilterModel(gridState.filters);
        }
        
        // Apply sorting if it exists
        if (gridState.sorting && gridState.sorting.length > 0) {
            this.gridApi.applyColumnState({
                state: gridState.sorting.map(sort => ({
                    colId: sort.colId,
                    sort: sort.sort,
                    sortIndex: sort.sortIndex
                }))
            });
        }

        this.updateStats({ rowData: gridState.data });
    }

    createGridFromState(gridState) {
        const gridData = {
            columnDefs: gridState.config?.columnDefs || [],
            rowData: gridState.data || [],
            gridOptions: gridState.config?.gridOptions || {}
        };
        
        this.createGrid(gridData);
    }

    handleGridEvent(event) {
        this.addEvent(event);
        
        // Handle specific events
        switch (event.type) {
            case 'grid_updated':
                // Data will be updated via grid_state_updated event
                break;
                
            case 'grid_filtered':
                if (event.data && event.data.filterModel) {
                    this.gridApi?.setFilterModel(event.data.filterModel);
                }
                break;
                
            case 'grid_sorted':
                if (event.data && event.data.sortModel) {
                    this.gridApi?.applyColumnState({
                        state: event.data.sortModel
                    });
                }
                break;
        }
    }

    updateStats(gridData) {
        const rowCount = gridData.rowData?.length || 0;
        const columnCount = gridData.columnDefs?.length || 0;
        
        document.getElementById('row-count').textContent = `Rows: ${rowCount.toLocaleString()}`;
        document.getElementById('column-count').textContent = `Columns: ${columnCount}`;
        document.getElementById('last-updated').textContent = `Updated: ${this.formatTime(new Date())}`;
    }

    updateRowCount() {
        if (!this.gridApi) return;
        
        const displayedRows = this.gridApi.getDisplayedRowCount();
        const totalRows = this.gridApi.getModel().getRowCount();
        
        if (displayedRows !== totalRows) {
            document.getElementById('row-count').textContent = `Rows: ${displayedRows.toLocaleString()} of ${totalRows.toLocaleString()}`;
        } else {
            document.getElementById('row-count').textContent = `Rows: ${totalRows.toLocaleString()}`;
        }
    }

    updateFilterDisplay() {
        if (!this.gridApi) return;
        
        const filterModel = this.gridApi.getFilterModel();
        const filterBar = document.getElementById('filter-bar');
        const filterDetails = document.getElementById('filter-details');
        
        if (filterModel && Object.keys(filterModel).length > 0) {
            const filterText = Object.entries(filterModel)
                .map(([field, filter]) => {
                    if (filter.filter) {
                        return `${field}: "${filter.filter}"`;
                    } else if (filter.values) {
                        return `${field}: ${filter.values.length} selected`;
                    }
                    return `${field}: filtered`;
                })
                .join(', ');
            
            filterDetails.textContent = filterText;
            filterBar.style.display = 'block';
        } else {
            filterBar.style.display = 'none';
        }
    }

    updateSortDisplay() {
        if (!this.gridApi) return;
        
        const sortState = this.gridApi.getColumnState()
            .filter(col => col.sort !== null)
            .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
        
        const sortBar = document.getElementById('sort-bar');
        const sortDetails = document.getElementById('sort-details');
        
        if (sortState.length > 0) {
            const sortText = sortState
                .map(col => `${col.colId} (${col.sort})`)
                .join(', ');
            
            sortDetails.textContent = sortText;
            sortBar.style.display = 'block';
        } else {
            sortBar.style.display = 'none';
        }
    }

    updateSelection() {
        if (!this.gridApi) return;
        
        const selectedRows = this.gridApi.getSelectedRows();
        console.log(`${selectedRows.length} rows selected`);
    }

    addEvent(event) {
        this.events.unshift(event);
        
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(0, this.maxEvents);
        }
        
        this.renderEvents();
    }

    renderEvents() {
        const eventsList = document.getElementById('events-list');
        eventsList.innerHTML = '';

        this.events.forEach(event => {
            const eventElement = this.createEventElement(event);
            eventsList.appendChild(eventElement);
        });
    }

    createEventElement(event) {
        const template = document.getElementById('event-item-template');
        const eventElement = template.content.cloneNode(true);
        
        const eventItem = eventElement.querySelector('.event-item');
        const eventType = eventElement.querySelector('.event-type');
        const eventTime = eventElement.querySelector('.event-time');
        const eventDetails = eventElement.querySelector('.event-details');

        eventItem.classList.add(event.type);
        eventType.textContent = this.formatEventType(event.type);
        eventTime.textContent = this.formatTime(event.timestamp);
        eventDetails.textContent = this.formatEventData(event);

        return eventElement;
    }

    formatEventType(type) {
        return type.replace(/_/g, ' ');
    }

    formatEventData(event) {
        if (!event.data) return '';
        
        switch (event.type) {
            case 'grid_updated':
                return `Updated to ${event.data.rowCount} rows`;
            case 'grid_filtered':
                return `${event.data.displayedRows} rows visible`;
            case 'grid_exported':
                return `Exported as ${event.data.format}`;
            default:
                return JSON.stringify(event.data);
        }
    }

    updateConnectionStatus(connected) {
        const connectionDot = document.getElementById('connection-dot');
        const connectionText = document.getElementById('connection-text');
        
        if (connected) {
            connectionDot.classList.add('connected');
            connectionDot.classList.remove('disconnected');
            connectionText.textContent = 'Connected';
        } else {
            connectionDot.classList.remove('connected');
            connectionDot.classList.add('disconnected');
            connectionText.textContent = 'Disconnected';
        }
    }

    showLoading() {
        document.getElementById('loading-message').style.display = 'block';
        document.getElementById('error-message').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading-message').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-text').textContent = message;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }
}

// Initialize grid viewer when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GridViewer();
});