import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

// API keys from environment variables
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;

// Stocks to track from environment variables or default to a few major tech stocks
const STOCKS_TO_TRACK = process.env.STOCKS_TO_TRACK?.split(',') || ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];

/**
 * Extract stock data from Alpha Vantage API
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} - Stock data
 */
async function fetchStockData(symbol) {
  try {
    // Get daily time series data
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage API error for ${symbol}: ${response.data['Error Message']}`);
    }
    
    // Get company overview
    const overviewResponse = await axios.get(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    // Add a delay to avoid API rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      symbol,
      timeSeries: response.data['Time Series (Daily)'] || {},
      overview: overviewResponse.data || {},
      extractedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error.message);
    // Return a partial object with error information
    return {
      symbol,
      error: error.message,
      extractedAt: new Date().toISOString()
    };
  }
}

/**
 * Extract market index data (S&P 500)
 * @returns {Promise<Object>} - Market index data
 */
async function fetchMarketIndexData() {
  try {
    // Get S&P 500 data
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/historical-price-full/index/%5EGSPC?apikey=${FMP_API_KEY}`
    );
    
    if (!response.data || !response.data.historical) {
      throw new Error('Failed to fetch S&P 500 data');
    }
    
    return {
      index: 'S&P500',
      historical: response.data.historical,
      extractedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching market index data:', error.message);
    return {
      index: 'S&P500',
      error: error.message,
      extractedAt: new Date().toISOString()
    };
  }
}

/**
 * Save raw data to a local JSON file for backup/debugging
 * @param {Object} data - Data to save
 * @returns {Promise<string>} - Path to saved file
 */
async function saveRawData(data) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Create a timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dataDir, `raw_data_${timestamp}.json`);
    
    // Write data to file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return filePath;
  } catch (error) {
    console.error('Error saving raw data:', error.message);
    return null;
  }
}

/**
 * Main extract function that orchestrates data extraction from all sources
 * @returns {Promise<Object>} - Extracted data
 */
async function extract() {
  console.log('Starting data extraction process...');
  
  // Extract stock data for all tracked symbols
  const stockDataPromises = STOCKS_TO_TRACK.map(symbol => fetchStockData(symbol));
  const stockData = await Promise.all(stockDataPromises);
  
  // Extract market index data
  const marketData = await fetchMarketIndexData();
  
  // Combine all extracted data
  const extractedData = {
    stockData,
    marketData,
    extractionTimestamp: new Date().toISOString()
  };
  
  // Save raw data to file
  const savedFilePath = await saveRawData(extractedData);
  if (savedFilePath) {
    console.log(`Raw data saved to ${savedFilePath}`);
  }
  
  return extractedData;
}

// If this file is run directly (not imported), execute the extract function
if (import.meta.url === import.meta.main) {
  extract()
    .then(data => {
      console.log('Extraction completed successfully');
      console.log(`Extracted data for ${data.stockData.length} stocks`);
    })
    .catch(err => {
      console.error('Error in extraction process:', err);
      process.exit(1);
    });
}

export { extract };