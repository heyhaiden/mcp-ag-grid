/**
 * Dashboard JavaScript for AG Grid MCP Server
 */

class Dashboard {
    constructor() {
        this.socket = null;
        this.grids = new Map();
        this.events = [];
        this.maxEvents = 50;
        this.serverStartTime = null;
        
        this.init();
    }

    async init() {
        this.setupSocketConnection();
        this.setupEventHandlers();
        await this.loadInitialData();
        this.startUptimeTimer();
    }

    setupSocketConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            console.log('Disconnected from server');
        });

        this.socket.on('grid_event', (event) => {
            this.handleGridEvent(event);
        });

        this.socket.on('grid_state_updated', (gridState) => {
            this.updateGridState(gridState);
        });

        this.socket.on('grid_states', (gridStates) => {
            gridStates.forEach(state => this.updateGridState(state));
        });

        this.socket.on('grid_removed', (gridId) => {
            this.removeGrid(gridId);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus(false);
        });
    }

    setupEventHandlers() {
        // Global functions for grid actions
        window.viewGrid = (gridId) => {
            window.open(`/grid/${gridId}`, '_blank');
        };

        window.refreshGrid = async (gridId) => {
            try {
                const response = await fetch(`/api/grids/${gridId}`);
                const result = await response.json();
                if (result.success) {
                    this.updateGridFromAPI(result.grid);
                }
            } catch (error) {
                console.error('Error refreshing grid:', error);
            }
        };
    }

    async loadInitialData() {
        try {
            // Load server status
            const statusResponse = await fetch('/api/status');
            const status = await statusResponse.json();
            if (status.success) {
                this.serverStartTime = new Date(status.timestamp);
            }

            // Load existing grids
            const gridsResponse = await fetch('/api/grids');
            const gridsResult = await gridsResponse.json();
            if (gridsResult.success) {
                gridsResult.grids.forEach(grid => {
                    this.updateGridFromAPI(grid);
                });
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (connected) {
            statusDot.classList.add('connected');
            statusDot.classList.remove('disconnected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
        }
    }

    handleGridEvent(event) {
        this.addEvent(event);
        
        // Update grid state based on event
        if (event.type === 'grid_created') {
            // Grid state will be updated via grid_state_updated event
        } else if (event.type === 'grid_destroyed') {
            this.removeGrid(event.gridId);
        }
    }

    updateGridState(gridState) {
        this.grids.set(gridState.id, gridState);
        this.renderGrid(gridState);
        this.updateStats();
    }

    updateGridFromAPI(gridData) {
        const gridState = {
            id: gridData.id || gridData.gridId,
            config: gridData.info?.config || gridData.config,
            data: gridData.state?.data || gridData.webState?.data || [],
            createdAt: gridData.info?.createdAt || gridData.createdAt,
            lastUpdated: gridData.info?.lastUpdated || gridData.lastUpdated,
            filters: gridData.webState?.filters,
            sorting: gridData.webState?.sorting
        };
        
        this.updateGridState(gridState);
    }

    removeGrid(gridId) {
        this.grids.delete(gridId);
        const gridCard = document.querySelector(`[data-grid-id="${gridId}"]`);
        if (gridCard) {
            gridCard.remove();
        }
        this.updateStats();
    }

    renderGrid(gridState) {
        const container = document.getElementById('grids-container');
        const noGridsElement = document.getElementById('no-grids');
        
        // Hide "no grids" message
        if (noGridsElement) {
            noGridsElement.style.display = 'none';
        }

        // Check if grid card already exists
        let gridCard = document.querySelector(`[data-grid-id="${gridState.id}"]`);
        
        if (!gridCard) {
            // Create new grid card
            const template = document.getElementById('grid-card-template');
            gridCard = template.content.cloneNode(true);
            gridCard.querySelector('.grid-card').setAttribute('data-grid-id', gridState.id);
            container.appendChild(gridCard);
            gridCard = document.querySelector(`[data-grid-id="${gridState.id}"]`);
        }

        // Update grid card content
        this.updateGridCard(gridCard, gridState);
    }

    updateGridCard(gridCard, gridState) {
        const title = gridCard.querySelector('.grid-title');
        const columns = gridCard.querySelector('.grid-columns');
        const rows = gridCard.querySelector('.grid-rows');
        const created = gridCard.querySelector('.grid-created');
        const updated = gridCard.querySelector('.grid-updated');
        const filterIndicator = gridCard.querySelector('.filter-indicator');
        const sortIndicator = gridCard.querySelector('.sort-indicator');

        // Update content
        title.textContent = `Grid ${gridState.id.split('_')[1]}` || gridState.id;
        columns.textContent = gridState.config?.columnDefs?.length || '-';
        rows.textContent = gridState.data?.length || '-';
        created.textContent = this.formatDate(gridState.createdAt);
        updated.textContent = this.formatDate(gridState.lastUpdated);

        // Update action buttons
        const viewBtn = gridCard.querySelector('.btn-view');
        const refreshBtn = gridCard.querySelector('.btn-refresh');
        viewBtn.setAttribute('data-grid-id', gridState.id);
        refreshBtn.setAttribute('data-grid-id', gridState.id);

        // Update indicators
        if (gridState.filters && Object.keys(gridState.filters).length > 0) {
            filterIndicator.style.display = 'inline';
        } else {
            filterIndicator.style.display = 'none';
        }

        if (gridState.sorting && gridState.sorting.length > 0) {
            sortIndicator.style.display = 'inline';
        } else {
            sortIndicator.style.display = 'none';
        }
    }

    addEvent(event) {
        // Add to beginning of events array
        this.events.unshift(event);
        
        // Keep only last N events
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
        const eventGridId = eventElement.querySelector('.event-grid-id');
        const eventData = eventElement.querySelector('.event-data');

        // Add event type class for styling
        eventItem.classList.add(event.type);

        // Set content
        eventType.textContent = this.formatEventType(event.type);
        eventTime.textContent = this.formatTime(event.timestamp);
        eventGridId.textContent = event.gridId;
        eventData.textContent = this.formatEventData(event);

        return eventElement;
    }

    formatEventType(type) {
        return type.replace(/_/g, ' ');
    }

    formatEventData(event) {
        if (!event.data) return '';
        
        switch (event.type) {
            case 'grid_created':
                return `${event.data.rowCount} rows`;
            case 'grid_updated':
                return `Updated to ${event.data.rowCount} rows`;
            case 'grid_filtered':
                return `${event.data.displayedRows} rows shown`;
            case 'grid_exported':
                return `Exported as ${event.data.format}`;
            default:
                return JSON.stringify(event.data);
        }
    }

    updateStats() {
        const activeGridsCount = document.getElementById('active-grids-count');
        const totalRecordsCount = document.getElementById('total-records-count');
        
        const gridCount = this.grids.size;
        const totalRecords = Array.from(this.grids.values())
            .reduce((sum, grid) => sum + (grid.data?.length || 0), 0);
        
        activeGridsCount.textContent = gridCount;
        totalRecordsCount.textContent = totalRecords.toLocaleString();

        // Show/hide no grids message
        const noGridsElement = document.getElementById('no-grids');
        if (noGridsElement) {
            noGridsElement.style.display = gridCount === 0 ? 'block' : 'none';
        }
    }

    startUptimeTimer() {
        setInterval(() => {
            if (this.serverStartTime) {
                const uptime = Date.now() - this.serverStartTime.getTime();
                document.getElementById('server-uptime').textContent = this.formatUptime(uptime);
            }
        }, 1000);
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays}d ago`;
        } else if (diffHours > 0) {
            return `${diffHours}h ago`;
        } else if (diffMins > 0) {
            return `${diffMins}m ago`;
        } else {
            return 'Just now';
        }
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

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});