export type Grid = {
  columns: string[];
  values: (string | number | null)[][];
};

export type CompareOptions = {
  orderMatters: boolean;
  columnOrderMatters: boolean;
};

export type CompareResult = { ok: true } | { ok: false; message: string };

function norm(value: string | number | null): string {
  if (value === null) return "\u0000";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    return String(Math.round(value * 1e6) / 1e6);
  }
  return value;
}

function key(row: string[]): string {
  return row.join("\u001f");
}

export function compareGrids(user: Grid, expected: Grid, options: CompareOptions): CompareResult {
  const userColumns = user.columns;
  const expectedColumns = expected.columns;
  const userSet = new Set(userColumns);
  const expectedSet = new Set(expectedColumns);

  for (const column of expectedColumns) {
    if (!userSet.has(column)) return { ok: false, message: `Column \`${column}\` missing` };
  }
  for (const column of userColumns) {
    if (!expectedSet.has(column)) return { ok: false, message: `Unexpected column \`${column}\`` };
  }
  if (options.columnOrderMatters && userColumns.join("\u0000") !== expectedColumns.join("\u0000")) {
    return { ok: false, message: "Column order differs" };
  }
  if (user.values.length !== expected.values.length) {
    return {
      ok: false,
      message: `Expected ${expected.values.length} rows, got ${user.values.length}`,
    };
  }

  const userIndex = new Map(userColumns.map((column, index) => [column, index]));
  const expectedRows = expected.values.map((row) => expectedColumns.map((_, index) => norm(row[index])));
  const userRows = user.values.map((row) =>
    expectedColumns.map((column) => norm(row[userIndex.get(column) ?? 0])),
  );

  const sameOrder = expectedRows.every((row, index) => key(row) === key(userRows[index]));
  if (sameOrder) return { ok: true };

  const sortedExpected = [...expectedRows].sort((a, b) => key(a).localeCompare(key(b)));
  const sortedUser = [...userRows].sort((a, b) => key(a).localeCompare(key(b)));
  const sameValues = sortedExpected.every((row, index) => key(row) === key(sortedUser[index]));
  if (sameValues && options.orderMatters) return { ok: false, message: "Row order differs" };
  if (sameValues) return { ok: true };

  const left = options.orderMatters ? expectedRows : sortedExpected;
  const right = options.orderMatters ? userRows : sortedUser;
  for (let rowIndex = 0; rowIndex < left.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < expectedColumns.length; columnIndex += 1) {
      if (left[rowIndex][columnIndex] !== right[rowIndex][columnIndex]) {
        return {
          ok: false,
          message: `Value mismatch in row ${rowIndex + 1}, column ${expectedColumns[columnIndex]}`,
        };
      }
    }
  }
  return { ok: false, message: "Result rows differ" };
}
