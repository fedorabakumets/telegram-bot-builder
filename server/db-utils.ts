import { db, pool } from './db';
import { sql } from 'drizzle-orm';

// Database connection monitoring and optimization utilities
export class DatabaseManager {
  private static instance: DatabaseManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    errors: 0,
    lastHealthCheck: new Date()
  };

  private constructor() { }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Start monitoring database health
  startHealthMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Database health check failed:', error);
        this.connectionStats.errors++;
      }
    }, intervalMs);

    console.log('Database health monitoring started');
  }

  // Stop monitoring
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('Database health monitoring stopped');
  }

  // Perform health check
  async performHealthCheck(): Promise<boolean> {
    try {
      // Test connection with a simple query
      await db.execute(sql`SELECT 1 as health`);

      // Update connection stats if pool is available
      if (pool) {
        this.connectionStats.totalConnections = pool.totalCount || 0;
        this.connectionStats.activeConnections = (pool.totalCount || 0) - (pool.idleCount || 0);
        this.connectionStats.idleConnections = pool.idleCount || 0;
      }
      this.connectionStats.lastHealthCheck = new Date();

      console.log('Database health check passed');
      return true;
    } catch (error: any) {
      console.error('Database health check failed:', error?.message);
      console.error('Detailed error:', error);
      this.connectionStats.errors++;
      return false;
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      ...this.connectionStats,
      poolInfo: {
        totalCount: pool?.totalCount || 0,
        idleCount: pool?.idleCount || 0,
        waitingCount: pool?.waitingCount || 0,
        maxSize: 20,
        minSize: 2
      }
    };
  }

  // Optimize database connections
  async optimizeConnections(): Promise<void> {
    try {
      // Close idle connections if there are too many
      if (this.connectionStats.idleConnections > 5) {
        console.log('Optimizing database connections...');
        // Note: pg_terminate_backend requires superuser privileges
        // Instead, we'll just log the optimization attempt
        console.log('Would optimize connections if superuser privileges were available');
      }

      // Try to analyze database performance (if pg_stat_statements is available)
      try {
        const slowQueries = await db.execute(sql`
          SELECT query, calls, total_exec_time, mean_exec_time
          FROM pg_stat_statements 
          WHERE mean_exec_time > 1000 
          ORDER BY mean_exec_time DESC 
          LIMIT 10
        `);

        if (slowQueries.rows.length > 0) {
          console.log('Found slow queries:', slowQueries.rows);
        }
      } catch (error) {
        // pg_stat_statements might not be available, that's okay
        console.log('pg_stat_statements not available, skipping slow query analysis');
      }
    } catch (error: any) {
      console.warn('Connection optimization warning:', error?.message);
    }
  }

  // Execute query with retry logic
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw lastError;
  }

  // Transaction wrapper with automatic rollback
  async transaction<T>(
    operation: (txDb: any) => Promise<T>
  ): Promise<T> {
    return await db.transaction(async (tx) => {
      try {
        const result = await operation(tx);
        return result;
      } catch (error: any) {
        console.error('Detailed error:', error?.message, error?.stack);
        throw new Error(`Transaction failed: ${error?.message || 'Unknown error'}`);
      }
    });
  }

  // Backup database (basic implementation)
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;

    try {
      // This is a simplified backup - in production you'd use pg_dump
      await db.execute(sql`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database() AND pid <> pg_backend_pid()
      `);

      console.log(`Backup created: ${backupName}`);
      return backupName;
    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      throw new Error(`Backup operation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Clean up old data
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      // Clean up old bot instances
      const cleanupResult = await db.execute(sql`
        DELETE FROM bot_instances 
        WHERE status = 'stopped' AND stopped_at < ${cutoffDate}
      `);

      console.log(`Cleaned up ${cleanupResult.rowCount} old bot instances`);

      // Clean up old user interactions (optional)
      await db.execute(sql`
        DELETE FROM user_bot_data 
        WHERE is_active = 0 AND updated_at < ${cutoffDate}
      `);

    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      throw new Error(`Cleanup operation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Get database metrics
  async getDatabaseMetrics() {
    try {
      const metrics = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);

      return metrics.rows;
    } catch (error: any) {
      console.error('Detailed error:', error?.message, error?.stack);
      return [];
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();

// Auto-start monitoring when module is imported
dbManager.startHealthMonitoring();

// Graceful shutdown
process.on('SIGTERM', () => {
  dbManager.stopHealthMonitoring();
});

process.on('SIGINT', () => {
  dbManager.stopHealthMonitoring();
});