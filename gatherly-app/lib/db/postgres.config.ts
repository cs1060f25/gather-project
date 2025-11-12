/**
 * PostgreSQL Configuration
 * Linear Task: GATHER-27
 * 
 * Sets up PostgreSQL connection for analytics and preference profiles
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// PostgreSQL connection configuration
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'gatherly_dev',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Global pool instance (singleton)
let pool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export function initializePostgres(): Pool {
  if (!pool) {
    pool = new Pool(postgresConfig);
    
    pool.on('connect', () => {
      console.log('✓ PostgreSQL client connected');
    });
    
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
    
    console.log(`✓ PostgreSQL pool initialized: ${postgresConfig.database}`);
  }
  
  return pool;
}

/**
 * Get the PostgreSQL pool instance
 */
export function getPostgresPool(): Pool {
  if (!pool) {
    return initializePostgres();
  }
  return pool;
}

/**
 * Execute a query with the pool
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = await getPostgresPool().connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✓ PostgreSQL pool closed');
  }
}

// Table names as constants
export const TABLES = {
  PREFERENCE_PROFILES: 'preference_profiles',
  SCHEDULING_EVENTS: 'scheduling_events',
} as const;

// SQL Schema for initialization
export const SQL_SCHEMA = `
-- Create preference_profiles table
CREATE TABLE IF NOT EXISTS preference_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  day_of_week_patterns JSONB NOT NULL,
  time_of_day_patterns JSONB NOT NULL,
  duration_preferences JSONB NOT NULL,
  acceptance_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_response_time INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_id ON preference_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_last_updated ON preference_profiles(last_updated);

-- Create scheduling_events table
CREATE TABLE IF NOT EXISTS scheduling_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  host_user_id VARCHAR(255) NOT NULL,
  num_invitees INTEGER NOT NULL,
  proposed_slots JSONB,
  selected_slot JSONB,
  outcome VARCHAR(50) NOT NULL,
  time_to_schedule INTEGER,
  num_messages INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_id ON scheduling_events(session_id);
CREATE INDEX IF NOT EXISTS idx_host_user_id ON scheduling_events(host_user_id);
CREATE INDEX IF NOT EXISTS idx_outcome ON scheduling_events(outcome);
CREATE INDEX IF NOT EXISTS idx_created_at ON scheduling_events(created_at);
`;

/**
 * Initialize database schema
 */
export async function initializeSchema(): Promise<void> {
  try {
    await query(SQL_SCHEMA);
    console.log('✓ PostgreSQL schema initialized');
  } catch (error) {
    console.error('Error initializing PostgreSQL schema:', error);
    throw error;
  }
}

