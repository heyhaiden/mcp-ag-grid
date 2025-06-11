#!/bin/bash
# Kill AG Grid MCP server and free port 3000

echo "Killing AG Grid MCP server processes..."

# Kill by port 3000
PORT_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_PIDS" ]; then
    echo "Killing processes on port 3000: $PORT_PIDS"
    kill -9 $PORT_PIDS 2>/dev/null
fi

# Kill by process name
SERVER_PIDS=$(pgrep -f "mcp-ag-grid.*server.js" 2>/dev/null)
if [ ! -z "$SERVER_PIDS" ]; then
    echo "Killing server processes: $SERVER_PIDS"
    kill -9 $SERVER_PIDS 2>/dev/null
fi

# Kill any remaining node processes with ag-grid in the path
AG_GRID_PIDS=$(pgrep -f "node.*ag-grid" 2>/dev/null)
if [ ! -z "$AG_GRID_PIDS" ]; then
    echo "Killing AG Grid node processes: $AG_GRID_PIDS"
    kill -9 $AG_GRID_PIDS 2>/dev/null
fi

echo "Server cleanup complete. Port 3000 should now be free."