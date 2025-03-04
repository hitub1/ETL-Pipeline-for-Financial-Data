import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Calculate key financial metrics for a stock
 * @param {Object} stockData - Raw stock data
 * @returns {Object} - Calculated metrics
 */
function calculateStockMetrics(stockData) {
  // If there was an error fetching the stock data, return early
  if (stockData.error) {
    return {
      symbol: stockData.symbol,
      error: stockData.error,
      transformedAt: new Date().toISOString()
    };
  }
  
  const { symbol, timeSeries, overview } = stockData;
  
  // Get dates in descending order (most recent first)
  const dates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
  
  // If no time series data is available, return basic info
  if (dates.length === 0) {
    return {
      symbol,
      error: 'No time series data available',
      transformedAt: new Date().toISOString()
    };
  }
  
  // Get the most recent trading day data
  const latestDate = dates[0];
  const latestData = timeSeries[latestDate];
  
  // Get data from 7 days ago, 30 days ago, and 90 days ago for comparison
  const day7Data = dates.length > 7 ? timeSeries[dates[7]] : null;
  const day30Data = dates.length > 30 ? timeSeries[dates[30]] : null;
  const day90Data = dates.length > 90 ? timeSeries[dates[90]] : null;
  
  // Calculate metrics
  const latestClose = parseFloat(latestData['4. close']);
  
  // Calculate price changes and volatility
  const priceChange7d = day7Data ? latestClose - parseFloat(day7Data['4. close']) : null;
  const priceChange30d = day30Data ? latestClose - parseFloat(day30Data['4. close']) : null;
  const priceChange90d = day90Data ? latestClose - parseFloat(day90Data['4. close']) : null;
  
  const percentChange7d = day7Data ? (priceChange7d / parseFloat(day7Data['4. close'])) * 100 : null;
  const percentChange30d = day30Data ? (priceChange30d / parseFloat(day30Data['4. close'])) * 100 : null;
  const percentChange90d = day90Data ? (priceChange90d / parseFloat(day90Data['4. close'])) * 100 : null;
  
  // Calculate volatility (standard deviation of daily returns over the last 30 days)
  let volatility30d = null;
  if (dates.length > 30) {
    const returns = [];
    for (let i = 0; i < 30; i++) {
      if (i + 1 < dates.length) {
        const currentClose = parseFloat(timeSeries[dates[i]]['4. close']);
        const previousClose = parseFloat(timeSeries[dates[i + 1]]['4. close']);
        const dailyReturn = (currentClose - previousClose) / previousClose;
        returns.push(dailyReturn);
      }
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const squaredDiffs = returns.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / returns.length;
    volatility30d = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in percentage
  }
  
  // Extract key metrics from company overview
  const {
    MarketCapitalization,
    PERatio,
    DividendYield,
    EPS,
    RevenueTTM,
    GrossProfitTTM,
    ProfitMargin,
    OperatingMarginTTM,
    ReturnOnAssetsTTM,
    ReturnOnEquityTTM,
    DilutedEPSTTM
  } = overview;
  
  // Return transformed data
  return {
    symbol,
    date: latestDate,
    price: {
      open: parseFloat(latestData['1. open']),
      high: parseFloat(latestData['2. high']),
      low: parseFloat(latestData['3. low']),
      close: latestClose,
      volume: parseInt(latestData['5. volume'], 10)
    },
    priceChanges: {
      change7d: priceChange7d,
      change30d: priceChange30d,
      change90d: priceChange90d,
      percentChange7d,
      percentChange30d,
      percentChange90d
    },
    volatility: {
      volatility30d
    },
    fundamentals: {
      marketCap: MarketCapitalization ? parseFloat(MarketCapitalization) : null,
      peRatio: PERatio ? parseFloat(PERatio) : null,
      dividendYield: DividendYield ? parseFloat(DividendYield) * 100 : null, // Convert to percentage
      eps: EPS ? parseFloat(EPS) : null,
      revenue: RevenueTTM ? parseFloat(RevenueTTM) : null,
      grossProfit: GrossProfitTTM ? parseFloat(GrossProfitTTM) : null,
      profitMargin: ProfitMargin ? parseFloat(ProfitMargin) * 100 : null, // Convert to percentage
      operatingMargin: OperatingMarginTTM ? parseFloat(OperatingMarginTTM) * 100 : null, // Convert to percentage
      roa: ReturnOnAssetsTTM ? parseFloat(ReturnOnAssetsTTM) * 100 : null, // Convert to percentage
      roe: ReturnOnEquityTTM ? parseFloat(ReturnOnEquityTTM) * 100 : null, // Convert to percentage
      dilutedEPS: DilutedEPSTTM ? parseFloat(DilutedEPSTTM) : null
    },
    transformedAt: new Date().toISOString()
  };
}

/**
 * Transform market index data
 * @param {Object} marketData - Raw market index data
 * @returns {Object} - Transformed market indicators
 */
function calculateMarketIndicators(marketData) {
  // If there was an error fetching the market data, return early
  if (marketData.error) {
    return {
      index: marketData.index,
      error: marketData.error,
      transformedAt: new Date().toISOString()
    };
  }
  
  const { index, historical } = marketData;
  
  // Sort historical data by date (most recent first)
  const sortedData = [...historical].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // If no historical data is available, return basic info
  if (sortedData.length === 0) {
    return {
      index,
      error: 'No historical data available',
      transformedAt: new Date().toISOString()
    };
  }
  
  // Get the most recent data
  const latestData = sortedData[0];
  
  // Get data from 7 days ago, 30 days ago, and 90 days ago for comparison
  const day7Data = sortedData.length > 7 ? sortedData[7] : null;
  const day30Data = sortedData.length > 30 ? sortedData[30] : null;
  const day90Data = sortedData.length > 90 ? sortedData[90] : null;
  
  // Calculate metrics
  const latestClose = latestData.close;
  
  // Calculate price changes
  const priceChange7d = day7Data ? latestClose - day7Data.close : null;
  const priceChange30d = day30Data ? latestClose - day30Data.close : null;
  const priceChange90d = day90Data ? latestClose - day90Data.close : null;
  
  const percentChange7d = day7Data ? (priceChange7d / day7Data.close) * 100 : null;
  const percentChange30d = day30Data ? (priceChange30d / day30Data.close) * 100 : null;
  const percentChange90d = day90Data ? (priceChange90d / day90Data.close) * 100 : null;
  
  // Calculate volatility (standard deviation of daily returns over the last 30 days)
  let volatility30d = null;
  if (sortedData.length > 30) {
    const returns = [];
    for (let i = 0; i < 30; i++) {
      if (i + 1 < sortedData.length) {
        const currentClose = sortedData[i].close;
        const previousClose = sortedData[i + 1].close;
        const dailyReturn = (currentClose - previousClose) / previousClose;
        returns.push(dailyReturn);
      }
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const squaredDiffs = returns.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / returns.length;
    volatility30d = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in percentage
  }
  
  // Return transformed data
  return {
    index,
    date: latestData.date,
    price: {
      open: latestData.open,
      high: latestData.high,
      low: latestData.low,
      close: latestData.close,
      volume: latestData.volume
    },
    priceChanges: {
      change7d: priceChange7d,
      change30d: priceChange30d,
      change90d: priceChange90d,
      percentChange7d,
      percentChange30d,
      percentChange90d
    },
    volatility: {
      volatility30d
    },
    transformedAt: new Date().toISOString()
  };
}

/**
 * Main transform function that processes all extracted data
 * @param {Object} extractedData - Data from the extract step
 * @returns {Promise<Object>} - Transformed data
 */
async function transform(extractedData) {
  console.log('Starting data transformation process...');
  
  const { stockData, marketData } = extractedData;
  
  // Transform stock data
  const stockMetrics = stockData.map(stock => calculateStockMetrics(stock));
  
  // Transform market index data
  const marketIndicators = marketData ? calculateMarketIndicators(marketData) : null;
  
  // Return transformed data
  return {
    stockMetrics,
    marketIndicators,
    transformationTimestamp: new Date().toISOString()
  };
}

// If this file is run directly (not imported), execute the transform function with sample data
if (import.meta.url === import.meta.main) {
  // Sample data for testing
  const sampleData = {
    stockData: [
      {
        symbol: 'SAMPLE',
        timeSeries: {
          '2023-01-01': {
            '1. open': '100',
            '2. high': '105',
            '3. low': '99',
            '4. close': '102',
            '5. volume': '1000000'
          }
        },
        overview: {
          MarketCapitalization: '1000000000',
          PERatio: '20',
          DividendYield: '0.02'
        }
      }
    ],
    marketData: {
      index: 'SAMPLE_INDEX',
      historical: [
        {
          date: '2023-01-01',
          open: 4000,
          high: 4100,
          low: 3950,
          close: 4050,
          volume: 10000000
        }
      ]
    }
  };
  
  transform(sampleData)
    .then(data => {
      console.log('Transformation completed successfully');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      console.error('Error in transformation process:', err);
      process.exit(1);
    });
}

export { transform };