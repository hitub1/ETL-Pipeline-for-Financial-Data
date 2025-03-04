import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Load stock metrics into the database
 * @param {Array} stockMetrics - Transformed stock metrics
 * @returns {Promise<Object>} - Result of the load operation
 */
async function loadStockMetrics(stockMetrics) {
  const results = {
    success: [],
    errors: []
  };
  
  for (const stock of stockMetrics) {
    try {
      // Skip stocks with errors
      if (stock.error) {
        results.errors.push({
          symbol: stock.symbol,
          error: stock.error
        });
        continue;
      }
      
      // Insert into stock_metrics table
      const { data, error } = await supabase
        .from('stock_metrics')
        .insert([
          {
            symbol: stock.symbol,
            date: stock.date,
            price_open: stock.price.open,
            price_high: stock.price.high,
            price_low: stock.price.low,
            price_close: stock.price.close,
            volume: stock.price.volume,
            price_change_7d: stock.priceChanges.change7d,
            price_change_30d: stock.priceChanges.change30d,
            price_change_90d: stock.priceChanges.change90d,
            percent_change_7d: stock.priceChanges.percentChange7d,
            percent_change_30d: stock.priceChanges.percentChange30d,
            percent_change_90d: stock.priceChanges.percentChange90d,
            volatility_30d: stock.volatility.volatility30d,
            market_cap: stock.fundamentals.marketCap,
            pe_ratio: stock.fundamentals.peRatio,
            dividend_yield: stock.fundamentals.dividendYield,
            eps: stock.fundamentals.eps,
            revenue: stock.fundamentals.revenue,
            gross_profit: stock.fundamentals.grossProfit,
            profit_margin: stock.fundamentals.profitMargin,
            operating_margin: stock.fundamentals.operatingMargin,
            roa: stock.fundamentals.roa,
            roe: stock.fundamentals.roe,
            diluted_eps: stock.fundamentals.dilutedEPS,
            processed_at: stock.transformedAt
          }
        ]);
      
      if (error) {
        throw error;
      }
      
      results.success.push({
        symbol: stock.symbol,
        date: stock.date
      });
    } catch (error) {
      console.error(`Error loading data for ${stock.symbol}:`, error.message);
      results.errors.push({
        symbol: stock.symbol,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Load market indicators into the database
 * @param {Object} marketIndicators - Transformed market indicators
 * @returns {Promise<Object>} - Result of the load operation
 */
async function loadMarketIndicators(marketIndicators) {
  // If there are no market indicators or there was an error, return early
  if (!marketIndicators || marketIndicators.error) {
    return {
      success: false,
      error: marketIndicators ? marketIndicators.error : 'No market indicators provided'
    };
  }
  
  try {
    // Insert into market_indicators table
    const { data, error } = await supabase
      .from('market_indicators')
      .insert([
        {
          index_name: marketIndicators.index,
          date: marketIndicators.date,
          price_open: marketIndicators.price.open,
          price_high: marketIndicators.price.high,
          price_low: marketIndicators.price.low,
          price_close: marketIndicators.price.close,
          volume: marketIndicators.price.volume,
          price_change_7d: marketIndicators.priceChanges.change7d,
          price_change_30d: marketIndicators.priceChanges.change30d,
          price_change_90d: marketIndicators.priceChanges.change90d,
          percent_change_7d: marketIndicators.priceChanges.percentChange7d,
          percent_change_30d: marketIndicators.priceChanges.percentChange30d,
          percent_change_90d: marketIndicators.priceChanges.percentChange90d,
          volatility_30d: marketIndicators.volatility.volatility30d,
          processed_at: marketIndicators.transformedAt
        }
      ]);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      index: marketIndicators.index,
      date: marketIndicators.date
    };
  } catch (error) {
    console.error(`Error loading market indicators for ${marketIndicators.index}:`, error.message);
    return {
      success: false,
      index: marketIndicators.index,
      error: error.message
    };
  }
}

/**
 * Main load function that loads all transformed data into the database
 * @param {Object} transformedData - Data from the transform step
 * @returns {Promise<Object>} - Result of the load operation
 */
async function load(transformedData) {
  console.log('Starting data loading process...');
  
  const { stockMetrics, marketIndicators } = transformedData;
  
  // Load stock metrics
  const stockResults = await loadStockMetrics(stockMetrics);
  
  // Load market indicators
  const marketResult = marketIndicators 
    ? await loadMarketIndicators(marketIndicators)
    : { success: false, error: 'No market indicators provided' };
  
  // Return load results
  return {
    stocksLoaded: stockResults.success.length,
    stockErrors: stockResults.errors.length,
    indicatorsLoaded: marketResult.success ? 1 : 0,
    indicatorErrors: marketResult.success ? 0 : 1,
    timestamp: new Date().toISOString()
  };
}

// If this file is run directly (not imported), execute with sample data
if (import.meta.url === import.meta.main) {
  // Check if Supabase credentials are available
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
    process.exit(1);
  }
  
  console.log('This script requires a Supabase database with the appropriate schema.');
  console.log('Please run the migrations first to create the required tables.');
  
  // Sample data for testing
  const sampleData = {
    stockMetrics: [
      {
        symbol: 'SAMPLE',
        date: '2023-01-01',
        price: {
          open: 100,
          high: 105,
          low: 99,
          close: 102,
          volume: 1000000
        },
        priceChanges: {
          change7d: 2,
          change30d: 5,
          change90d: 10,
          percentChange7d: 2,
          percentChange30d: 5,
          percentChange90d: 10
        },
        volatility: {
          volatility30d: 15
        },
        fundamentals: {
          marketCap: 1000000000,
          peRatio: 20,
          dividendYield: 2,
          eps: 5,
          revenue: 10000000,
          grossProfit: 5000000,
          profitMargin: 20,
          operatingMargin: 25,
          roa: 10,
          roe: 15,
          dilutedEPS: 4.8
        },
        transformedAt: new Date().toISOString()
      }
    ],
    marketIndicators: {
      index: 'SAMPLE_INDEX',
      date: '2023-01-01',
      price: {
        open: 4000,
        high: 4100,
        low: 3950,
        close: 4050,
        volume: 10000000
      },
      priceChanges: {
        change7d: 50,
        change30d: 100,
        change90d: 200,
        percentChange7d: 1.25,
        percentChange30d: 2.5,
        percentChange90d: 5
      },
      volatility: {
        volatility30d: 12
      },
      transformedAt: new Date().toISOString()
    }
  };
  
  load(sampleData)
    .then(result => {
      console.log('Load operation completed with the following results:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.error('Error in load process:', err);
      process.exit(1);
    });
}

export { load };