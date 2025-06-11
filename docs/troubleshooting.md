# Troubleshooting Guide - AG Grid MCP Server

This guide covers common issues you might encounter when using the AG Grid MCP Server and their solutions.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Claude Desktop Integration](#claude-desktop-integration)
3. [Server Connection Problems](#server-connection-problems)
4. [Grid Creation Issues](#grid-creation-issues)
5. [Data Export Problems](#data-export-problems)
6. [Performance Issues](#performance-issues)
7. [Browser/Puppeteer Issues](#browserpuppeteer-issues)
8. [Common Error Messages](#common-error-messages)
9. [Debug Mode](#debug-mode)
10. [Getting Help](#getting-help)

## Installation Issues

### Node.js Version Incompatibility

**Problem:** Build fails with module resolution errors
```
Error: Cannot resolve module '@modelcontextprotocol/sdk'
```

**Solution:**
1. Ensure you're using Node.js 18.x or later:
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```
2. Clear npm cache and reinstall:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### TypeScript Compilation Errors

**Problem:** Build fails with TypeScript errors
```
error TS2307: Cannot find module or its corresponding type declarations
```

**Solution:**
1. Rebuild the project:
   ```bash
   npm run build
   ```
2. If errors persist, check TypeScript version:
   ```bash
   npx tsc --version  # Should be 5.x
   ```

### Puppeteer Installation Issues

**Problem:** Puppeteer fails to install or download Chromium
```
Error: Failed to launch the browser process
```

**Solution:**
1. Install Puppeteer manually:
   ```bash
   npm install puppeteer --force
   ```
2. For system-specific issues, install system dependencies:
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt-get install -y chromium-browser
   ```
   
   **macOS:**
   ```bash
   brew install chromium
   ```

## Claude Desktop Integration

### Server Not Appearing in Claude Desktop

**Problem:** AG Grid server doesn't show up in Claude Desktop tools

**Solution:**
1. Check Claude Desktop configuration:
   ```bash
   # macOS
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   type %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Verify the configuration format:
   ```json
   {
     "mcpServers": {
       "ag-grid-server": {
         "command": "node",
         "args": ["/absolute/path/to/ag-grid-mcp-server/build/server.js"],
         "env": {
           "GRID_DEBUG": "false"
         }
       }
     }
   }
   ```

3. **Important:** Use absolute paths, not relative paths
4. Restart Claude Desktop completely
5. Check for JSON syntax errors using a JSON validator

### Permission Denied Errors

**Problem:** 
```
Error: spawn EACCES
```

**Solution:**
1. Make server executable:
   ```bash
   chmod +x build/server.js
   ```
2. Verify Node.js path in configuration:
   ```bash
   which node
   ```

### Tools Not Loading

**Problem:** Claude says "I don't have access to AG Grid tools"

**Solution:**
1. Check server logs in Claude Desktop console (View → Developer → Open Console)
2. Verify server is running:
   ```bash
   node build/server.js
   # Should show: AG Grid MCP Server starting...
   ```
3. Test server manually:
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node build/server.js
   ```

## Server Connection Problems

### Server Startup Failures

**Problem:** Server fails to start with various errors

**Common Solutions:**

1. **Port conflicts:** Check if port is already in use
2. **Memory issues:** Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 build/server.js
   ```
3. **File permissions:** Ensure read/write access to project directory

### Browser Initialization Failures

**Problem:**
```
GridManagerError: Failed to initialize browser
```

**Solution:**
1. Check available memory and disk space
2. Try headless mode (default):
   ```json
   {
     "env": {
       "GRID_HEADLESS": "true"
     }
   }
   ```
3. For Docker/containers, add browser flags:
   ```json
   {
     "env": {
       "GRID_BROWSER_ARGS": "--no-sandbox,--disable-setuid-sandbox"
     }
   }
   ```

## Grid Creation Issues

### Invalid Column Definitions

**Problem:**
```
GridManagerError: Invalid grid configuration
```

**Solution:**
1. Ensure all required fields are present:
   ```javascript
   {
     "columnDefs": [
       {
         "field": "id",        // Required
         "headerName": "ID",   // Optional but recommended
         "type": "text"        // Optional
       }
     ],
     "rowData": [...]         // Required
   }
   ```

2. Check data-column alignment:
   ```javascript
   // Column definition
   { "field": "firstName" }
   
   // Data must have matching property
   { "firstName": "John", "lastName": "Doe" }
   ```

### Grid HTML Not Loading

**Problem:**
```
Error: createAGGrid is not defined
```

**Solution:**
1. Verify `web/grid.html` exists and is readable
2. Check AG Grid CDN availability
3. Test HTML file directly in browser

### Memory Issues with Large Datasets

**Problem:** Browser crashes or becomes unresponsive with large datasets

**Solution:**
1. Limit data size:
   ```javascript
   // Use pagination or virtual scrolling
   const pageSize = 1000;
   const pagedData = largeDataset.slice(0, pageSize);
   ```

2. Use server-side pagination in AG Grid options:
   ```javascript
   {
     "gridOptions": {
       "pagination": true,
       "paginationPageSize": 100
     }
   }
   ```

## Data Export Problems

### Export Timeouts

**Problem:** Export operations timeout for large datasets

**Solution:**
1. Increase operation timeout in grid manager
2. Export in smaller chunks
3. Use server-side export for very large datasets

### CSV Format Issues

**Problem:** Exported CSV has formatting problems

**Solution:**
1. Check data for special characters (commas, quotes, newlines)
2. Use proper escaping in AG Grid export options
3. Validate date and number formats

### File Save Permissions

**Problem:** Cannot save exported files

**Solution:**
1. Check directory permissions
2. Use absolute file paths
3. Ensure sufficient disk space

## Performance Issues

### Slow Grid Rendering

**Problem:** Grids take a long time to render

**Solutions:**
1. Enable AG Grid's virtual scrolling:
   ```javascript
   {
     "gridOptions": {
       "rowBuffer": 10,
       "rowSelection": "multiple",
       "rowModelType": "infinite"  // For very large datasets
     }
   }
   ```

2. Optimize column definitions:
   ```javascript
   {
     "field": "data",
     "cellRenderer": "agTextCellRenderer",  // Use built-in renderers
     "width": 100  // Set fixed widths when possible
   }
   ```

3. Reduce data size or use pagination

### High Memory Usage

**Problem:** Server uses excessive memory

**Solutions:**
1. Destroy unused grids:
   ```javascript
   // In your usage, clean up when done
   await gridManager.destroyGrid(gridId);
   ```

2. Limit concurrent grids
3. Monitor memory usage:
   ```bash
   node --inspect build/server.js
   ```

### Slow Filter Operations

**Problem:** Filtering large datasets is slow

**Solutions:**
1. Use server-side filtering
2. Add indexes to your data structure
3. Implement debounced filtering

## Browser/Puppeteer Issues

### Chromium Download Failures

**Problem:** Puppeteer cannot download Chromium

**Solution:**
1. Set custom Chromium path:
   ```bash
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
   ```

2. Use system Chrome:
   ```json
   {
     "env": {
       "GRID_BROWSER_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
     }
   }
   ```

### Headless Mode Issues

**Problem:** Grid rendering fails in headless mode

**Solution:**
1. Try non-headless mode temporarily:
   ```json
   {
     "env": {
       "GRID_HEADLESS": "false"
     }
   }
   ```

2. Check display server (Linux):
   ```bash
   export DISPLAY=:99
   Xvfb :99 -screen 0 1920x1080x24 &
   ```

### Page Load Timeouts

**Problem:**
```
TimeoutError: Navigation timeout of 30000 ms exceeded
```

**Solution:**
1. Increase timeout in grid manager configuration
2. Check network connectivity
3. Verify AG Grid CDN accessibility

## Common Error Messages

### `GRID_NOT_FOUND`

```
GridManagerError: Grid with ID grid_123 not found
```

**Cause:** Trying to operate on a non-existent or destroyed grid

**Solution:** 
1. Check grid ID spelling
2. Verify grid was created successfully
3. Ensure grid wasn't destroyed

### `INVALID_CONFIG`

```
GridManagerError: Invalid grid configuration
```

**Cause:** Malformed column definitions or row data

**Solution:**
1. Validate JSON structure
2. Check required fields
3. Ensure data types match expectations

### `METHOD_EXECUTION_FAILED`

```
GridManagerError: Failed to execute grid method: unknownMethod
```

**Cause:** Calling non-existent AG Grid API method

**Solution:**
1. Check AG Grid API documentation
2. Verify method name spelling
3. Use `get_grid_stats` to see available methods

### `EXPORT_FAILED`

```
GridManagerError: Failed to export grid data as csv
```

**Cause:** Export operation failed

**Solution:**
1. Check data integrity
2. Verify export format support
3. Ensure sufficient system resources

## Debug Mode

### Enable Debug Logging

Add to Claude Desktop configuration:
```json
{
  "env": {
    "GRID_DEBUG": "true",
    "GRID_LOG_LEVEL": "debug"
  }
}
```

### Manual Testing

Test server functionality directly:
```bash
# Test server startup
node build/server.js

# Test with sample data
node build/test-runner.js

# Debug grid API
node build/debug-grid.js
```

### Browser DevTools

For non-headless debugging:
```json
{
  "env": {
    "GRID_HEADLESS": "false",
    "GRID_DEVTOOLS": "true"
  }
}
```

## Log Analysis

### Server Logs

Look for these key log messages:
- `✅ AG Grid MCP tools registered successfully`
- `GridManager: Browser initialized successfully`
- `Grid created successfully with ID: grid_xxx`

### Error Patterns

Common error patterns to watch for:
- `ECONNREFUSED`: Network connectivity issues
- `EACCES`: Permission problems
- `ENOMEM`: Memory exhaustion
- `TimeoutError`: Operation timeouts

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Review the main README.md
3. Check [usage examples](../examples/usage-examples.md)
4. Enable debug logging and review logs
5. Test with minimal data first

### Information to Include

When reporting issues, include:

1. **Environment:**
   - Node.js version (`node --version`)
   - Operating system
   - Claude Desktop version

2. **Configuration:**
   - Your `claude_desktop_config.json` (remove sensitive data)
   - Environment variables
   - Project directory structure

3. **Error Details:**
   - Complete error messages
   - Steps to reproduce
   - Expected vs actual behavior
   - Debug logs (if available)

4. **Sample Data:**
   - Minimal example that reproduces the issue
   - Grid configuration used
   - Data sample (anonymized if needed)

### Where to Get Help

1. **GitHub Issues:** [ag-grid-mcp-server/issues](https://github.com/username/ag-grid-mcp-server/issues)
2. **Claude Desktop Support:** [Claude Documentation](https://docs.anthropic.com/claude/docs)
3. **AG Grid Documentation:** [AG Grid Community Docs](https://ag-grid.com/documentation/)

## Quick Diagnostic Checklist

Use this checklist to quickly identify common issues:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Project built successfully (`npm run build`)
- [ ] Server executable (`ls -la build/server.js`)
- [ ] Claude Desktop config has absolute paths
- [ ] Claude Desktop config is valid JSON
- [ ] Claude Desktop restarted after config changes
- [ ] Sufficient system memory and disk space
- [ ] Network connectivity for CDN resources
- [ ] No antivirus blocking browser processes
- [ ] Project directory has read/write permissions

## Performance Optimization Tips

1. **Batch Operations:** Group multiple grid operations together
2. **Limit Data Size:** Use pagination for large datasets
3. **Cleanup Resources:** Destroy grids when no longer needed
4. **Monitor Memory:** Watch for memory leaks in long-running sessions
5. **Use Built-in Features:** Leverage AG Grid's optimization features

## Best Practices

1. **Error Handling:** Always wrap grid operations in try-catch
2. **Resource Management:** Clean up grids when done
3. **Data Validation:** Validate data before creating grids
4. **Configuration Management:** Use environment variables for settings
5. **Testing:** Test with sample data before using production data

---

For more detailed information, see:
- [README.md](../README.md) - Setup and basic usage
- [Usage Examples](../examples/usage-examples.md) - Step-by-step guides
- [AG Grid Documentation](https://ag-grid.com/documentation/) - AG Grid API reference