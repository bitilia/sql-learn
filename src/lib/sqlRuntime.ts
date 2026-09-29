import initSqlJs, { type SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { Grid } from "./compare";

let loading: Promise<SqlJsStatic> | null = null;

export function loadSql(force = false) {
  if (force || !loading) {
    loading = initSqlJs({ locateFile: () => wasmUrl }).catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

function toGrid(result: { columns: string[]; values: (string | number | null | Uint8Array)[][] } | undefined): Grid {
  if (!result) return { columns: [], values: [] };
  return {
    columns: result.columns,
    values: result.values.map((row) =>
      row.map((cell) => (cell instanceof Uint8Array ? null : cell)),
    ),
  };
}

export type RunOutcome =
  | { ok: true; grid: Grid; ms: number }
  | { ok: false; error: string; ms: number };

export function runQuery(SQL: SqlJsStatic, seedSql: string, sql: string, checkSql?: string): RunOutcome {
  const started = performance.now();
  const db = new SQL.Database();
  try {
    const trimmed = sql.trim();
    if (!trimmed) {
      return { ok: false, error: "Write a query before running.", ms: 0 };
    }
    db.exec(seedSql);
    const produced = db.exec(trimmed);
    const check = checkSql?.trim();
    const graded = check ? db.exec(check) : produced;
    const grid = toGrid(graded[graded.length - 1]);
    return { ok: true, grid, ms: Math.max(1, Math.round(performance.now() - started)) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The statement could not run.";
    return { ok: false, error: message, ms: Math.max(1, Math.round(performance.now() - started)) };
  } finally {
    db.close();
  }
}

/** Apply the official solution, then the question's check query, so DML expected rows include the mutation. */
export function runExpected(
  SQL: SqlJsStatic,
  seedSql: string,
  solutionSql: string,
  checkSql?: string,
): RunOutcome {
  return runQuery(SQL, seedSql, solutionSql, checkSql);
}
