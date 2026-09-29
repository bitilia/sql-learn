import type { SchemaDef } from "../data/types";
import { KEYWORDS } from "./sqlText";

export type SuggestKind = "keyword" | "table" | "column" | "value";

export type Suggestion = {
  kind: SuggestKind;
  label: string;
  insert: string;
  detail: string;
  ghost: string;
};

export type Completion = {
  start: number;
  end: number;
  items: Suggestion[];
};

type ColumnLex = {
  table: string;
  name: string;
  type: string;
  values: string[];
};

type Ranked = Suggestion & { rank: number };

export type Lexicon = {
  tables: string[];
  columns: ColumnLex[];
};

type Token = {
  kind: "word" | "number" | "string" | "op";
  text: string;
  from: number;
  to: number;
  closed?: boolean;
};

type PartialToken = {
  kind: "word" | "number" | "string";
  start: number;
  end: number;
  closed?: boolean;
};

const CLAUSE_MODE: Record<string, "table" | "column" | "value"> = {
  FROM: "table",
  JOIN: "table",
  INTO: "table",
  UPDATE: "table",
  TABLE: "table",
  SELECT: "column",
  WHERE: "column",
  SET: "column",
  ON: "column",
  HAVING: "column",
  BY: "column",
  AND: "column",
  OR: "column",
  WHEN: "column",
  THEN: "column",
  ELSE: "column",
  VALUES: "value",
};

const VALUE_OPS = new Set(["=", "<", ">", "<=", ">=", "<>", "!=", "LIKE", "IN", "BETWEEN"]);
const LIMIT = 8;

export function lexiconFor(schema: SchemaDef, visibleTables: string[]): Lexicon {
  const allowed = new Set(visibleTables);
  const values = valuesFromSeed(schema.seedSql);
  const tables = schema.tables.filter((table) => allowed.has(table.name));
  return {
    tables: tables.map((table) => table.name),
    columns: tables.flatMap((table) =>
      table.columns.map((column) => ({
        table: table.name,
        name: column.name,
        type: column.type,
        values: values.get(`${table.name}.${column.name}`) ?? [],
      })),
    ),
  };
}

export function completeSql(sql: string, cursor: number, lexicon: Lexicon): Completion {
  const empty: Completion = { start: cursor, end: cursor, items: [] };
  const safeCursor = Math.max(0, Math.min(cursor, sql.length));
  if (insideComment(sql, safeCursor)) return empty;

  const tokens = tokenize(sql);
  const partial = partialAt(tokens, safeCursor);
  const cut = partial ? (partial.kind === "string" ? partial.start - 1 : partial.start) : safeCursor;
  const prior = tokens.filter((token) => token.to <= cut);
  const start = partial?.start ?? safeCursor;
  const end = partial?.end ?? safeCursor;
  const rawTyped = sql.slice(start, Math.min(safeCursor, end));
  const prefix = partial?.kind === "string" ? rawTyped.replace(/''/g, "'") : rawTyped;

  const mode = modeOf(prior, partial, lexicon);
  if (!shouldSuggest(prefix, prior, partial, lexicon)) return { start, end, items: [] };

  const bound = valueColumn(prior);
  const qualifier = dotQualifier(prior);
  const parenTable = parenTableName(prior, lexicon);
  const mentioned = mentionedTables(prior, lexicon);
  const items = rankItems(suggestionsFor(mode, prefix, lexicon, bound, qualifier, parenTable, partial, mentioned), prefix)
    .filter((item) => sql.slice(start, end).toLowerCase() !== item.insert.toLowerCase())
    .slice(0, LIMIT)
    .map((item) => ({
      kind: item.kind,
      label: item.label,
      insert: item.insert,
      detail: item.detail,
      ghost: safeCursor === end ? ghostFor(rawTyped, item.insert) : "",
    }));

  return { start, end, items };
}

function suggestionsFor(
  mode: "table" | "column" | "value" | "dot" | "mixed",
  prefix: string,
  lexicon: Lexicon,
  bound: { column: string; qualifier?: string } | null,
  qualifier: string | null,
  parenTable: string | null,
  partial: PartialToken | null,
  mentioned: string[],
): Ranked[] {
  const insideString = partial?.kind === "string";
  if (mode === "value") {
    return valueSuggestions(lexicon, prefix, bound, insideString, Boolean(partial?.closed), mentioned);
  }
  if (mode === "dot" || parenTable) {
    return columnSuggestions(lexicon, prefix, qualifier ?? parenTable);
  }

  const items: Ranked[] = [];
  if (mode === "table" || mode === "mixed") items.push(...tableSuggestions(lexicon, prefix));
  if (mode === "column" && prefix.length > 0) {
    items.push(...tableSuggestions(lexicon, prefix).map((item) => ({ ...item, rank: 4 })));
  }
  if (mode === "column" || mode === "mixed" || (mode === "table" && prefix.length > 0)) {
    items.push(...columnSuggestions(lexicon, prefix, null));
  }
  if (mode !== "table") items.push(...keywordSuggestions(prefix));
  if (prefix.length >= 2 && mode !== "table") items.push(...valueSuggestions(lexicon, prefix, null, false, true, mentioned));
  return items;
}

function tableSuggestions(lexicon: Lexicon, prefix: string): Ranked[] {
  return lexicon.tables.filter((name) => hit(prefix, name)).map((name) => ({
    kind: "table",
    label: name,
    insert: name,
    detail: "table",
    ghost: "",
    rank: 0,
  }));
}

function columnSuggestions(lexicon: Lexicon, prefix: string, table: string | null): Ranked[] {
  const known = table ? lexicon.tables.some((name) => name.toLowerCase() === table.toLowerCase()) : false;
  const columns = lexicon.columns.filter((column) => {
    if (known && column.table.toLowerCase() !== table?.toLowerCase()) return false;
    return hit(prefix, column.name);
  });
  const grouped = new Map<string, ColumnLex[]>();
  for (const column of columns) {
    const key = column.name.toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), column]);
  }
  return [...grouped.values()].map((group) => ({
    kind: "column",
    label: group[0].name,
    insert: group[0].name,
    detail: group.map((column) => column.table).join(", "),
    ghost: "",
    rank: 1,
  }));
}

function keywordSuggestions(prefix: string): Ranked[] {
  if (!prefix) return [];
  return KEYWORDS.filter((word) => hit(prefix, word) && word.toLowerCase() !== prefix.toLowerCase()).map((word) => ({
    kind: "keyword",
    label: word,
    insert: word,
    detail: "keyword",
    ghost: "",
    rank: 2,
  }));
}

function valueSuggestions(
  lexicon: Lexicon,
  prefix: string,
  bound: { column: string; qualifier?: string } | null,
  insideString: boolean,
  closed: boolean,
  mentioned: string[],
): Ranked[] {
  const narrowed = preferMentioned(boundColumns(lexicon, bound), mentioned, bound);
  const matched = collectValues(narrowed, prefix);
  const chosen = matched.length > 0 || !bound ? matched : collectValues(lexicon.columns, prefix);
  const seen = new Set<string>();
  const items: Ranked[] = [];
  for (const { column, value } of chosen) {
    const insert = valueInsert(value, column.type, insideString, closed);
    if (seen.has(insert)) continue;
    seen.add(insert);
    const escaped = value.replace(/'/g, "''");
    const numeric = isNumericType(column.type);
    items.push({
      kind: "value",
      label: numeric && !insideString ? value : `'${escaped}'`,
      insert,
      detail: `${column.table}.${column.name}`,
      ghost: "",
      rank: 3,
    });
  }
  return items;
}

function mentionedTables(prior: Token[], lexicon: Lexicon) {
  const names: string[] = [];
  for (const token of prior) {
    if (token.kind !== "word") continue;
    const table = lexicon.tables.find((name) => name.toLowerCase() === token.text.toLowerCase());
    if (table && !names.includes(table)) names.push(table);
  }
  return names;
}

function preferMentioned(columns: ColumnLex[], mentioned: string[], bound: { column: string; qualifier?: string } | null) {
  if (bound?.qualifier || mentioned.length === 0) return columns;
  const preferred = columns.filter((column) => mentioned.some((table) => table.toLowerCase() === column.table.toLowerCase()));
  return preferred.length > 0 ? preferred : columns;
}

function boundColumns(lexicon: Lexicon, bound: { column: string; qualifier?: string } | null) {
  if (!bound) return lexicon.columns;
  let columns = lexicon.columns.filter((column) => column.name.toLowerCase() === bound.column.toLowerCase());
  if (bound.qualifier && columns.some((column) => column.table.toLowerCase() === bound.qualifier?.toLowerCase())) {
    columns = columns.filter((column) => column.table.toLowerCase() === bound.qualifier?.toLowerCase());
  }
  return columns;
}

function collectValues(columns: ColumnLex[], prefix: string) {
  return columns.flatMap((column) => column.values.filter((value) => hit(prefix, value)).map((value) => ({ column, value })));
}

function valueInsert(value: string, type: string, insideString: boolean, closed: boolean) {
  const escaped = value.replace(/'/g, "''");
  if (insideString) return closed ? escaped : `${escaped}'`;
  if (isNumericType(type)) return value;
  return `'${escaped}'`;
}

function rankItems(items: Ranked[], prefix: string) {
  const ranked = items.slice();
  if (!prefix) return ranked;
  ranked.sort((a, b) => a.rank - b.rank || a.label.length - b.label.length || a.label.localeCompare(b.label));
  return ranked;
}

function modeOf(prior: Token[], partial: PartialToken | null, lexicon: Lexicon): "table" | "column" | "value" | "dot" | "mixed" {
  if (partial?.kind === "string") return "value";
  if (prior.at(-1)?.text === ".") return "dot";
  if (valueColumn(prior)) return "value";
  if (parenTableName(prior, lexicon)) return "column";
  for (let i = prior.length - 1; i >= 0; i -= 1) {
    const mode = CLAUSE_MODE[prior[i].text.toUpperCase()];
    if (mode && prior[i].kind === "word") return mode;
  }
  return "mixed";
}

function shouldSuggest(prefix: string, prior: Token[], partial: PartialToken | null, lexicon: Lexicon) {
  if (prefix.length > 0) return true;
  if (partial?.kind === "string") return valueColumn(prior) !== null;
  const prev = prior.at(-1);
  if (!prev) return false;
  if (prev.text === ".") return true;
  if (prev.text === "(" && parenTableName(prior, lexicon)) return true;
  if (valueColumn(prior)) return true;
  return prev.kind === "word" && Boolean(CLAUSE_MODE[prev.text.toUpperCase()]);
}

function dotQualifier(prior: Token[]) {
  if (prior.at(-1)?.text !== ".") return null;
  const name = prior.at(-2);
  return name?.kind === "word" ? name.text : null;
}

function parenTableName(prior: Token[], lexicon: Lexicon) {
  if (prior.at(-1)?.text !== "(") return null;
  const name = prior.at(-2);
  if (name?.kind !== "word") return null;
  return lexicon.tables.some((table) => table.toLowerCase() === name.text.toLowerCase()) ? name.text : null;
}

function valueColumn(prior: Token[]): { column: string; qualifier?: string } | null {
  let i = prior.length - 1;
  while (i >= 0 && prior[i].text === "(") i -= 1;
  if (i < 0 || !VALUE_OPS.has(prior[i].text.toUpperCase())) return null;
  i -= 1;
  while (i >= 0 && prior[i].text === "(") i -= 1;
  if (i < 0 || prior[i].kind !== "word") return null;
  const column = prior[i].text;
  const qualifier = prior[i - 1]?.text === "." && prior[i - 2]?.kind === "word" ? prior[i - 2].text : undefined;
  return { column, qualifier };
}

function ghostFor(typed: string, insert: string) {
  if (insert.length <= typed.length) return "";
  if (insert.slice(0, typed.length).toLowerCase() !== typed.toLowerCase()) return "";
  return insert.slice(typed.length);
}

function hit(prefix: string, value: string) {
  if (!prefix) return true;
  return value.toLowerCase().startsWith(prefix.toLowerCase());
}

function isNumericType(type: string) {
  return /INT|REAL|NUM|DEC|FLOAT|DOUBLE/i.test(type);
}

function insideComment(sql: string, cursor: number) {
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      const to = end === -1 ? sql.length : end;
      if (cursor > i && (end === -1 ? cursor <= to : cursor < to)) return true;
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      const to = end === -1 ? sql.length : end + 2;
      if (cursor > i && cursor < to) return true;
      i = to;
      continue;
    }
    if (sql[i] === "'") {
      i = readString(sql, i).to;
      continue;
    }
    i += 1;
  }
  return false;
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    if (/\s/.test(sql[i])) {
      i += 1;
      continue;
    }
    if (sql[i] === "'") {
      const read = readString(sql, i);
      tokens.push({ kind: "string", text: sql.slice(i, read.to), from: i, to: read.to, closed: read.closed });
      i = read.to;
      continue;
    }
    if (/[0-9]/.test(sql[i])) {
      const match = /^[0-9]+(?:\.[0-9]+)?/.exec(sql.slice(i));
      const text = match?.[0] ?? sql[i];
      tokens.push({ kind: "number", text, from: i, to: i + text.length });
      i += text.length;
      continue;
    }
    if (/[A-Za-z_]/.test(sql[i])) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sql.slice(i));
      const text = match?.[0] ?? sql[i];
      tokens.push({ kind: "word", text, from: i, to: i + text.length });
      i += text.length;
      continue;
    }
    const two = sql.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>" || two === "!=" || two === "||") {
      tokens.push({ kind: "op", text: two, from: i, to: i + 2 });
      i += 2;
      continue;
    }
    tokens.push({ kind: "op", text: sql[i], from: i, to: i + 1 });
    i += 1;
  }
  return tokens;
}

function partialAt(tokens: Token[], cursor: number): PartialToken | null {
  for (const token of tokens) {
    if (token.kind === "string") {
      const contentEnd = token.closed ? token.to - 1 : token.to;
      if (cursor > token.from && cursor <= contentEnd) {
        return { kind: "string", start: token.from + 1, end: contentEnd, closed: token.closed };
      }
    }
    if ((token.kind === "word" || token.kind === "number") && cursor > token.from && cursor <= token.to) {
      return { kind: token.kind, start: token.from, end: token.to };
    }
  }
  return null;
}

function readString(sql: string, i: number) {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] === "'" && sql[j + 1] === "'") {
      j += 2;
      continue;
    }
    if (sql[j] === "'") return { to: j + 1, closed: true };
    j += 1;
  }
  return { to: sql.length, closed: false };
}

function valuesFromSeed(sql: string) {
  const map = new Map<string, string[]>();
  const header = /INSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*VALUES/gi;
  for (const match of sql.matchAll(header)) {
    const table = match[1];
    const columns = match[2].split(",").map((column) => column.trim()).filter(Boolean);
    const index = (match.index ?? 0) + match[0].length;
    const rows = parseRows(sql, index);
    for (const row of rows) {
      if (row.length !== columns.length) continue;
      columns.forEach((column, columnIndex) => {
        const value = row[columnIndex];
        if (value === null) return;
        const key = `${table}.${column}`;
        const list = map.get(key) ?? [];
        if (!list.includes(value)) list.push(value);
        map.set(key, list);
      });
    }
  }
  return map;
}

function parseRows(sql: string, start: number) {
  const rows: (string | null)[][] = [];
  let i = start;
  while (i < sql.length) {
    i = skipSpace(sql, i);
    if (sql[i] === ";" || sql[i] === undefined) break;
    if (sql[i] !== "(") break;
    const row = parseRow(sql, i);
    if (!row) break;
    rows.push(row.values);
    i = skipSpace(sql, row.to);
    if (sql[i] === ",") {
      i += 1;
      continue;
    }
    break;
  }
  return rows;
}

function parseRow(sql: string, start: number): { values: (string | null)[]; to: number } | null {
  let i = start + 1;
  const values: (string | null)[] = [];
  while (i < sql.length) {
    i = skipSpace(sql, i);
    if (sql[i] === ")") return { values, to: i + 1 };
    const value = parseLiteral(sql, i);
    if (!value) return null;
    values.push(value.raw);
    i = skipSpace(sql, value.to);
    if (sql[i] === ",") {
      i += 1;
      continue;
    }
    if (sql[i] === ")") return { values, to: i + 1 };
    return null;
  }
  return null;
}

function parseLiteral(sql: string, i: number): { raw: string | null; to: number } | null {
  if (sql[i] === "'") {
    const read = readString(sql, i);
    if (!read.closed) return null;
    return { raw: sql.slice(i + 1, read.to - 1).replace(/''/g, "'"), to: read.to };
  }
  if (/[0-9]/.test(sql[i])) {
    const match = /^[0-9]+(?:\.[0-9]+)?/.exec(sql.slice(i));
    if (!match) return null;
    return { raw: match[0], to: i + match[0].length };
  }
  if (/^null\b/i.test(sql.slice(i))) return { raw: null, to: i + 4 };
  return null;
}

function skipSpace(sql: string, i: number) {
  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    if (/\s/.test(sql[i])) {
      i += 1;
      continue;
    }
    break;
  }
  return i;
}
