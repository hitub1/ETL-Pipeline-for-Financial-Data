/*
  # Financial Data ETL Schema

  1. New Tables
    - `stock_metrics`
      - Stores processed stock data including price, changes, and fundamental metrics
    - `market_indicators`
      - Stores processed market index data including price and volatility metrics
    - `etl_logs`
      - Tracks ETL job runs and their status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
    - Add policies for service role to insert data
*/

-- Create stock_metrics table
CREATE TABLE IF NOT EXISTS stock_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  date date NOT NULL,
  price_open numeric,
  price_high numeric,
  price_low numeric,
  price_close numeric,
  volume bigint,
  price_change_7d numeric,
  price_change_30d numeric,
  price_change_90d numeric,
  percent_change_7d numeric,
  percent_change_30d numeric,
  percent_change_90d numeric,
  volatility_30d numeric,
  market_cap numeric,
  pe_ratio numeric,
  dividend_yield numeric,
  eps numeric,
  revenue numeric,
  gross_profit numeric,
  profit_margin numeric,
  operating_margin numeric,
  roa numeric,
  roe numeric,
  diluted_eps numeric,
  processed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Add a unique constraint to prevent duplicate entries
  UNIQUE(symbol, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_metrics_symbol_date ON stock_metrics(symbol, date);

-- Create market_indicators table
CREATE TABLE IF NOT EXISTS market_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_name text NOT NULL,
  date date NOT NULL,
  price_open numeric,
  price_high numeric,
  price_low numeric,
  price_close numeric,
  volume bigint,
  price_change_7d numeric,
  price_change_30d numeric,
  price_change_90d numeric,
  percent_change_7d numeric,
  percent_change_30d numeric,
  percent_change_90d numeric,
  volatility_30d numeric,
  processed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Add a unique constraint to prevent duplicate entries
  UNIQUE(index_name, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_market_indicators_index_date ON market_indicators(index_name, date);

-- Create etl_logs table to track ETL job runs
CREATE TABLE IF NOT EXISTS etl_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text NOT NULL,
  records_processed integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_etl_logs_job_name_start_time ON etl_logs(job_name, start_time);

-- Enable Row Level Security
ALTER TABLE stock_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read data
CREATE POLICY "Allow authenticated users to read stock metrics"
  ON stock_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read market indicators"
  ON market_indicators
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read ETL logs"
  ON etl_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for service role to insert data
CREATE POLICY "Allow service role to insert stock metrics"
  ON stock_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert market indicators"
  ON market_indicators
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert ETL logs"
  ON etl_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policies for service role to update data
CREATE POLICY "Allow service role to update stock metrics"
  ON stock_metrics
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to update market indicators"
  ON market_indicators
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to update ETL logs"
  ON etl_logs
  FOR UPDATE
  TO service_role
  USING (true);