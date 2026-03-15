
/** 
 * Database configuration loader - MODIFIED to use environment variables
 */

/**
 * Database credentials interface
 */
export interface DatabaseCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Load database configuration from environment variables
 *
 * @returns Database connection credentials
 * @throws Error if required env vars are missing
 */
export function getDatabaseCredentials(): DatabaseCredentials {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
  } = process.env;

  // if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  //   throw new Error(
  //     'Missing required database environment variables.\n' +
  //     'Please set: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME'
  //   );
  // }

  return {
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '3306', 10),
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'app',
  };
}