export const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "ON", "AS", "DISTINCT",
  "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "UNION", "ALL", "INSERT", "INTO",
  "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "WITH", "CASE", "WHEN", "THEN",
  "ELSE", "END", "OVER", "PARTITION", "ROWS", "RANGE", "UNBOUNDED", "PRECEDING", "FOLLOWING",
  "CURRENT", "ROW", "ASC", "DESC", "CAST", "EXISTS", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "INTEGER", "TEXT", "REAL", "RECURSIVE", "USING", "EXCEPT", "INTERSECT", "RETURNING",
  "FILTER", "WINDOW", "NULLS", "FIRST", "LAST",
];

const KEYWORD_SET = new Set(KEYWORDS);

const BREAKS = [
  "UNION ALL",
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "FULL OUTER JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "CROSS JOIN",
  "FULL JOIN",
  "GROUP BY",
  "ORDER BY",
  "PARTITION BY",
  "INSERT INTO",
  "DELETE FROM",
  "INTERSECT",
  "EXCEPT",
  "UNION",
  "SELECT",
  "FROM",
  "WHERE",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "VALUES",
  "JOIN",
  "WITH",
];

function mask(input: string) {
  const slots: string[] = [];
  let text = "";
  for (let i = 0; i < input.length; i += 1) {
    const c = input[i];
    const next = input[i + 1];
    if (c === "-" && next === "-") {
      const end = input.indexOf("\n", i);
      const chunk = end === -1 ? input.slice(i) : input.slice(i, end);
      slots.push(chunk);
      text += `\u00ab${slots.length - 1}\u00bb`;
      i += chunk.length - 1;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = input.indexOf("*/", i + 2);
      const chunk = end === -1 ? input.slice(i) : input.slice(i, end + 2);
      slots.push(chunk);
      text += `\u00ab${slots.length - 1}\u00bb`;
      i += chunk.length - 1;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      while (j < input.length) {
        if (input[j] === "'" && input[j + 1] === "'") {
          j += 2;
          continue;
        }
        if (input[j] === "'") {
          j += 1;
          break;
        }
        j += 1;
      }
      slots.push(input.slice(i, j));
      text += `\u00ab${slots.length - 1}\u00bb`;
      i = j - 1;
      continue;
    }
    text += c;
  }
  return { text, slots };
}

function unmask(text: string, slots: string[]) {
  return text.replace(/\u00ab(\d+)\u00bb/g, (_, n: string) => slots[Number(n)] ?? "");
}

function uppercaseKeywords(text: string) {
  let out = "";
  const re = /\u00ab\d+\u00bb|[A-Za-z_][A-Za-z0-9_]*/g;
  let last = 0;
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    out += text.slice(last, index);
    const word = match[0];
    out += word.startsWith("\u00ab") || !KEYWORD_SET.has(word.toUpperCase()) ? word : word.toUpperCase();
    last = index + word.length;
  }
  return out + text.slice(last);
}

function isSqlSpace(ch: string) {
  return ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
}

export function sameSqlTokens(before: string, after: string) {
  return before.replace(/\s+/g, "").toLowerCase() === after.replace(/\s+/g, "").toLowerCase();
}

export function mapSqlOffset(before: string, after: string, offset: number) {
  const clamped = Math.max(0, Math.min(offset, before.length));
  let target = 0;
  for (let i = 0; i < clamped; i += 1) {
    if (!isSqlSpace(before[i])) target += 1;
  }
  if (target === 0) {
    if (clamped === 0) return 0;
    for (let i = 0; i < after.length; i += 1) {
      if (!isSqlSpace(after[i])) return i;
    }
    return 0;
  }
  let seen = 0;
  for (let i = 0; i < after.length; i += 1) {
    if (isSqlSpace(after[i])) continue;
    seen += 1;
    if (seen !== target) continue;
    for (let j = clamped; j < before.length; j += 1) {
      if (!isSqlSpace(before[j])) return i + 1;
    }
    return after.length;
  }
  return after.length;
}

export function formatSql(input: string) {
  const masked = mask(input.trim());
  let code = uppercaseKeywords(masked.text);
  for (const clause of BREAKS) {
    const pattern = clause.replace(/ /g, "\\s+");
    code = code.replace(new RegExp(`\\s+(${pattern})\\b`, "gi"), "\n$1");
  }
  const lines = code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const major = /^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|WITH|INSERT|UPDATE|DELETE|VALUES|UNION|INTERSECT|EXCEPT|RETURNING)\b/.test(line);
      const join = /^(LEFT|RIGHT|INNER|FULL|CROSS|JOIN)\b/.test(line);
      return major || join ? line : `  ${line}`;
    });
  const formatted = unmask(lines.join("\n"), masked.slots).trim();
  return formatted.length > 0 ? `${formatted}\n` : "";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightSql(sql: string) {
  let html = "";
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      const chunk = end === -1 ? sql.slice(i) : sql.slice(i, end);
      html += `<span class="tok-comment">${escapeHtml(chunk)}</span>`;
      i += chunk.length;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      const chunk = end === -1 ? sql.slice(i) : sql.slice(i, end + 2);
      html += `<span class="tok-comment">${escapeHtml(chunk)}</span>`;
      i += chunk.length;
      continue;
    }
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") {
          j += 2;
          continue;
        }
        if (sql[j] === "'") {
          j += 1;
          break;
        }
        j += 1;
      }
      html += `<span class="tok-string">${escapeHtml(sql.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[0-9]/.test(sql[i]) && (i === 0 || /[^A-Za-z0-9_]/.test(sql[i - 1]))) {
      const match = /^[0-9]+(?:\.[0-9]+)?/.exec(sql.slice(i));
      if (match) {
        html += `<span class="tok-number">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      }
    }
    if (/[A-Za-z_]/.test(sql[i])) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sql.slice(i));
      const word = match?.[0] ?? sql[i];
      html += KEYWORD_SET.has(word.toUpperCase()) ? `<span class="tok-key">${escapeHtml(word)}</span>` : escapeHtml(word);
      i += word.length;
      continue;
    }
    html += escapeHtml(sql[i]);
    i += 1;
  }
  return html;
}
