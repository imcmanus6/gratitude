import { db as sqlite } from "./sqlite-legacy";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool, PoolClient, types } from "pg";
// Application numeric columns are bounded counters or epoch milliseconds, within JS safe integers.
types.setTypeParser(20, (value) => Number(value));
const testing =
  process.env.NODE_ENV === "test" && process.env.GRATITUDE_TEST_SQLITE === "1";
let pool: Pool | undefined;
const transactionClient = new AsyncLocalStorage<PoolClient>();
function connection() {
  if (!process.env.SUPABASE_DATABASE_URL)
    throw new Error("Supabase database is not configured.");
  if (!pool)
    pool = new Pool({
      connectionString: process.env.SUPABASE_DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
        ca: readFileSync(
          path.join(process.cwd(), "config/supabase-ca.crt"),
          "utf8",
        ),
      },
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      options: "-c search_path=gratitude -c statement_timeout=20000",
    });
  return transactionClient.getStore() || pool;
}
export function bindQuery(sql: string, args: unknown[]) {
  const named =
    args.length === 1 &&
    args[0] !== null &&
    typeof args[0] === "object" &&
    !Buffer.isBuffer(args[0]);
  const values: unknown[] = [];
  let pos = 0;
  // Skip quoted SQL literals; substitute only actual parameter tokens.
  let text = sql.replace(/'(?:''|[^'])*'|\?|@[a-zA-Z_]\w*/g, (token) => {
    if (token.startsWith("'")) return token;
    values.push(
      named
        ? (args[0] as Record<string, unknown>)[token.slice(1)]
        : args[pos++],
    );
    return `$${values.length}`;
  });
  if (/^\s*INSERT OR IGNORE /i.test(text))
    text = text
      .replace(/INSERT OR IGNORE /i, "INSERT ")
      .replace(/;?\s*$/, " ON CONFLICT DO NOTHING");
  return { text, values };
}
export const db = {
  prepare(sql: string) {
    const query = async (args: unknown[]) => {
      if (testing) {
        const stmt = sqlite.prepare(sql);
        if (stmt.reader) {
          const rows = stmt.all(...args);
          return { rows, rowCount: rows.length };
        }
        const result = stmt.run(...args);
        return { rows: [], rowCount: result.changes };
      }
      return connection().query(bindQuery(sql, args));
    };
    return {
      async get(...args: any[]): Promise<any> {
        return (await query(args)).rows[0];
      },
      async all(...args: any[]): Promise<any[]> {
        return (await query(args)).rows;
      },
      async run(...args: any[]) {
        const r = await query(args);
        return { changes: r.rowCount || 0 };
      },
    };
  },
  async exec(sql: string) {
    if (testing) {
      sqlite.exec(sql);
      return;
    }
    await connection().query(bindQuery(sql, []));
  },
  transaction<T extends (...args: any[]) => any>(fn: T) {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      if (testing) {
        sqlite.exec("BEGIN");
        try {
          const result = await fn(...args);
          sqlite.exec("COMMIT");
          return result;
        } catch (e) {
          sqlite.exec("ROLLBACK");
          throw e;
        }
      }
      if (transactionClient.getStore()) return fn(...args);
      connection();
      const client = await pool!.connect();
      try {
        await client.query("BEGIN");
        const result = await transactionClient.run(client, () => fn(...args));
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    };
  },
  pragma(sql: string) {
    if (!testing) throw new Error("SQLite checks are test-only");
    return sqlite.pragma(sql);
  },
  async close() {
    if (testing) {
      sqlite.close();
      return;
    }
    await pool?.end();
    pool = undefined;
  },
};
