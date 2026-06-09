import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'rook.db');

let db: SqlJsDatabase | null = null;
let SQL: SqlJsStatic | null = null;

// Wrapper to make sql.js work like better-sqlite3's API
class StatementWrapper {
  private stmt: any;
  private sql: string;

  constructor(stmt: any, sql: string) {
    this.stmt = stmt;
    this.sql = sql;
  }

  /** Get a single row */
  get(...params: any[]): any {
    this.stmt.reset();
    if (params.length > 0) {
      this.stmt.bind(params);
    }
    if (this.stmt.step()) {
      return this.stmt.getAsObject();
    }
    this.stmt.free();
    return undefined;
  }

  /** Get all rows */
  all(...params: any[]): any[] {
    this.stmt.reset();
    if (params.length > 0) {
      this.stmt.bind(params);
    }
    const results: any[] = [];
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject());
    }
    this.stmt.free();
    return results;
  }

  /** Run the statement */
  run(...params: any[]): { changes: number } {
    this.stmt.reset();
    if (params.length > 0) {
      this.stmt.bind(params);
    }
    this.stmt.step();
    this.stmt.free();
    // sql.js doesn't expose changes count easily, return a placeholder
    return { changes: 1 };
  }
}

export async function initDb(): Promise<void> {
  if (db) return;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  SQL = await initSqlJs();

  // Try to load existing database
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
}

export function getDb(): any {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  return {
    /** Execute multiple SQL statements (no parameters) */
    exec(sql: string) {
      return db!.exec(sql);
    },

    /** Run a single SQL statement (no return data) */
    run(sql: string, ...params: any[]) {
      if (params.length > 0) {
        const stmt = db!.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
      } else {
        db!.run(sql);
      }
    },

    /** Prepare a statement for chained get/all/run */
    prepare(sql: string): StatementWrapper {
      const stmt = db!.prepare(sql);
      return new StatementWrapper(stmt, sql);
    },

    /** Transaction helper */
    transaction<T>(fn: () => T): () => T {
      return () => {
        db!.run('BEGIN TRANSACTION');
        try {
          const result = fn();
          db!.run('COMMIT');
          return result;
        } catch (e) {
          db!.run('ROLLBACK');
          throw e;
        }
      };
    },

    /** Export and save to disk */
    save() {
      const data = db!.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    },
  };
}

export { DB_PATH };