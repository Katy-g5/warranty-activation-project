/**
 * This script is meant to be used with cron (Linux/Mac) or Task Scheduler (Windows)
 * to periodically run the invoice processor.
 * 
 * Example cron entry (run every hour):
 * 0 * * * * node /path/to/scheduleInvoiceProcessor.js
 * 
 * For Windows Task Scheduler:
 * - Program/script: node
 * - Arguments: C:\path\to\scheduleInvoiceProcessor.js
 * - Start in: C:\path\to\project
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..', '..');

// Create logs directory if it doesn't exist
const logsDir = path.join(projectRoot, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file for scheduler
const schedulerLogFile = path.join(logsDir, 'scheduler.log');

// Append to log
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  // Log to file
  fs.appendFileSync(schedulerLogFile, logMessage);
  
  // Also log to console
  console.log(message);
}

// Run the invoice processor
function runInvoiceProcessor() {
  log('Starting scheduled invoice processor job');
  
  try {
    // Run ts-node with the processor script
    const tsNodePath = path.join(projectRoot, 'node_modules', '.bin', 'ts-node');
    const scriptPath = path.join(projectRoot, 'src', 'workers', 'invoiceProcessor.ts');
    
    // Execute the process
    const result = spawnSync(tsNodePath, [scriptPath], {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    if (result.error) {
      log(`Error executing invoice processor: ${result.error.message}`);
      return;
    }
    
    if (result.status !== 0) {
      log(`Invoice processor exited with code ${result.status}`);
      log(`Stderr: ${result.stderr}`);
      return;
    }
    
    log('Invoice processor completed successfully');
    log(`Output: ${result.stdout.substring(0, 500)}...`); // Log first 500 chars of output
  } catch (error) {
    log(`Exception running invoice processor: ${error.message}`);
  }
}

// Run the processor
runInvoiceProcessor(); 