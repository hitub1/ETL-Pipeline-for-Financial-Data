import dotenv from 'dotenv';
import { extract } from './extract.js';
import { transform } from './transform.js';
import { load } from './load.js';

// Load environment variables
dotenv.config();

/**
 * Main ETL pipeline function that orchestrates the extract, transform, and load processes
 */
async function runETLPipeline() {
  console.log('Starting ETL pipeline...');
  
  try {
    // Step 1: Extract data from sources
    console.log('Extracting data...');
    const rawData = await extract();
    console.log(`Extracted data for ${rawData.stockData.length} stocks and ${rawData.marketData ? 1 : 0} market indices`);
    
    // Step 2: Transform the data
    console.log('Transforming data...');
    const transformedData = await transform(rawData);
    console.log(`Transformed ${transformedData.stockMetrics.length} stock metrics and ${transformedData.marketIndicators ? 1 : 0} market indicators`);
    
    // Step 3: Load data into the database
    console.log('Loading data into database...');
    const result = await load(transformedData);
    console.log(`Successfully loaded data: ${result.stocksLoaded} stocks, ${result.indicatorsLoaded} indicators`);
    
    console.log('ETL pipeline completed successfully!');
    return { success: true, message: 'ETL pipeline completed successfully' };
  } catch (error) {
    console.error('Error in ETL pipeline:', error);
    return { success: false, error: error.message };
  }
}

// If this file is run directly (not imported), execute the ETL pipeline
if (import.meta.url === import.meta.main) {
  runETLPipeline()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error in ETL pipeline:', err);
      process.exit(1);
    });
}

export { runETLPipeline };