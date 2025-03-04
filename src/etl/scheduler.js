import cron from 'node-cron';
import dotenv from 'dotenv';
import { runETLPipeline } from './index.js';

// Load environment variables
dotenv.config();

// Get schedule from environment variables or default to daily at midnight
const ETL_SCHEDULE = process.env.ETL_SCHEDULE || '0 0 * * *';

/**
 * Validate cron expression
 * @param {string} cronExpression - Cron expression to validate
 * @returns {boolean} - Whether the expression is valid
 */
function isValidCronExpression(cronExpression) {
  return cron.validate(cronExpression);
}

/**
 * Start the ETL scheduler
 * @returns {Object} - The scheduled task
 */
function startScheduler() {
  // Validate cron expression
  if (!isValidCronExpression(ETL_SCHEDULE)) {
    console.error(`Invalid cron expression: ${ETL_SCHEDULE}`);
    process.exit(1);
  }
  
  console.log(`Starting ETL scheduler with schedule: ${ETL_SCHEDULE}`);
  
  // Schedule the ETL pipeline
  const task = cron.schedule(ETL_SCHEDULE, async () => {
    console.log(`Running scheduled ETL pipeline at ${new Date().toISOString()}`);
    
    try {
      const result = await runETLPipeline();
      
      if (result.success) {
        console.log('Scheduled ETL pipeline completed successfully');
      } else {
        console.error('Scheduled ETL pipeline failed:', result.error);
      }
    } catch (error) {
      console.error('Error in scheduled ETL pipeline:', error);
    }
  });
  
  // Run the ETL pipeline immediately on startup
  console.log('Running initial ETL pipeline...');
  runETLPipeline()
    .then(result => {
      if (result.success) {
        console.log('Initial ETL pipeline completed successfully');
      } else {
        console.error('Initial ETL pipeline failed:', result.error);
      }
    })
    .catch(err => {
      console.error('Error in initial ETL pipeline:', err);
    });
  
  return task;
}

// If this file is run directly (not imported), start the scheduler
if (import.meta.url === import.meta.main) {
  const task = startScheduler();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Stopping ETL scheduler...');
    task.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Stopping ETL scheduler...');
    task.stop();
    process.exit(0);
  });
}

export { startScheduler };