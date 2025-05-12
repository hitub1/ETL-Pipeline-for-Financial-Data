import React, { useEffect, useState } from 'react';
import { LineChart, RefreshCcw, Search } from 'lucide-react';
import { supabase } from './lib/supabase';
import { StockChart } from './components/StockChart';
import { MetricsCard } from './components/MetricsCard';

interface StockPrice {
  price: number;
  timestamp: string;
}

interface FinancialMetrics {
  pe_ratio: number;
  market_cap: number;
  fifty_day_ma: number;
}

function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockPrices, setStockPrices] = useState<StockPrice[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stock prices
      const { data: pricesData, error: pricesError } = await supabase
        .from('stock_prices')
        .select('price, timestamp')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: true })
        .limit(30);

      if (pricesError) throw pricesError;
      setStockPrices(pricesData || []);

      // Fetch latest metrics using maybeSingle() instead of single()
      const { data: metricsData, error: metricsError } = await supabase
        .from('financial_metrics')
        .select('pe_ratio, market_cap, fifty_day_ma')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (metricsError) throw metricsError;
      setMetrics(metricsData);

      // Trigger edge function to fetch new data
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-stock-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch new data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  const chartData = {
    labels: stockPrices.map(p => new Date(p.timestamp).toLocaleDateString()),
    prices: stockPrices.map(p => p.price),
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Data Pipeline</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter stock symbol..."
              />
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <RefreshCcw size={20} className={`${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricsCard
              title="P/E Ratio"
              value={metrics.pe_ratio.toFixed(2)}
            />
            <MetricsCard
              title="Market Cap"
              value={`$${(metrics.market_cap / 1e9).toFixed(2)}B`}
            />
            <MetricsCard
              title="50-Day MA"
              value={`$${metrics.fifty_day_ma.toFixed(2)}`}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <LineChart size={24} className="text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">Price History</h2>
          </div>
          <StockChart data={chartData} symbol={symbol} />
        </div>
      </div>
    </div>
  );
}

export default App;
