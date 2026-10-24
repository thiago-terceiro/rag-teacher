import 'dotenv/config';
import { Pool, type QueryResult } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
});

export interface DbConnectionStatus {
  connected: boolean;
  error?: unknown;
}

export const checkDbConnection = async (): Promise<DbConnectionStatus> => {
  try {
    await pool.query('SELECT NOW()');
    return { connected: true };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { connected: false, error };
  }
};

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};
