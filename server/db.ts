import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Construct DATABASE_URL from individual environment variables if not set
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const {
    PGHOST = 'localhost',
    PGDATABASE = 'database',
    PGUSER = 'user',
    PGPASSWORD = '',
    PGPORT = '5432'
  } = process.env;

  if (PGHOST && PGDATABASE && PGUSER) {
    databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
    console.log('Constructed DATABASE_URL from environment variables');
  } else {
    throw new Error(
      "DATABASE_URL must be set or database environment variables (PGHOST, PGDATABASE, PGUSER) must be available. Did you forget to provision a database?",
    );
  }
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
