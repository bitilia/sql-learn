import fs from "node:fs";
import initSqlJs from "sql.js";
import { allQuestions, collections, questionsFor, topics } from "../src/data/catalog";
import { getSchema } from "../src/data/schemas";
import { compareGrids, type Grid } from "../src/lib/compare";

const SQL = await initSqlJs({
  wasmBinary: fs.readFileSync("node_modules/sql.js/dist/sql-wasm.wasm"),
});

const failures: string[] = [];
const empty: string[] = [];

function toGrid(result: { columns: string[]; values: unknown[][] } | undefined): Grid {
  if (!result) return { columns: [], values: [] };
  return {
    columns: result.columns,
    values: result.values.map((row) =>
      row.map((cell) => (cell instanceof Uint8Array ? null : (cell as string | number | null))),
    ),
  };
}

function run(seedSql: string, sql: string, checkSql?: string): Grid {
  const db = new SQL.Database();
  try {
    db.exec(seedSql);
    const produced = db.exec(sql);
    const check = checkSql?.trim();
    const graded = check ? db.exec(check) : produced;
    return toGrid(graded[graded.length - 1]);
  } finally {
    db.close();
  }
}

function fail(message: string) {
  failures.push(message);
}

function cell(grid: Grid, row: number, column: string) {
  const index = grid.columns.indexOf(column);
  return grid.values[row]?.[index];
}

function questionById(id: string) {
  const question = allQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing question ${id}`);
  return question;
}

for (const topic of [...topics, ...collections]) {
  const questions = questionsFor(topic.id);
  const schema = getSchema(topic.schemaId);
  const last = questions[questions.length - 1];
  if (!last || last.difficulty !== "hard" || !/capstone/i.test(last.title)) {
    fail(`${topic.id} does not end with a hard capstone`);
  }
  console.log(`${topic.name}: ${questions.length}`);
  for (const question of questions) {
    try {
      const expected = run(schema.seedSql, question.solutionSql, question.checkSql);
      const graded = run(schema.seedSql, question.solutionSql, question.checkSql);
      const compared = compareGrids(graded, expected, {
        orderMatters: question.orderMatters,
        columnOrderMatters: question.columnOrderMatters,
      });
      if (!compared.ok) fail(`${question.id}: official solution does not match expected (${compared.message})`);
      if (expected.values.length === 0) empty.push(question.id);
    } catch (error) {
      fail(`${question.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const harbor = getSchema("harbor");
const dml = Object.fromEntries(
  ["dml-01", "dml-02", "dml-03", "dml-04", "dml-05", "dml-06", "dml-07", "dml-08", "dml-09", "dml-10"].map((id) => [
    id,
    questionById(id),
  ]),
);

for (const question of Object.values(dml)) {
  const after = run(harbor.seedSql, question.solutionSql, question.checkSql);
  const before = run(harbor.seedSql, question.checkSql ?? question.solutionSql);
  const compared = compareGrids(after, before, {
    orderMatters: question.orderMatters,
    columnOrderMatters: question.columnOrderMatters,
  });
  if (compared.ok) {
    fail(`${question.id}: expected grid ignores the solution mutation`);
  }
}

{
  const grid = run(harbor.seedSql, dml["dml-01"].solutionSql, dml["dml-01"].checkSql);
  if (grid.values.length !== 6) fail(`dml-01: expected 6 departments, got ${grid.values.length}`);
  const legal = grid.values.find((row) => row[grid.columns.indexOf("name")] === "Legal");
  if (!legal) fail("dml-01: Legal department missing");
  else if (legal[grid.columns.indexOf("location")] !== "Oslo") fail("dml-01: Legal is not in Oslo");
}

{
  const grid = run(harbor.seedSql, dml["dml-02"].solutionSql, dml["dml-02"].checkSql);
  if (grid.values.length !== 5) fail(`dml-02: expected 5 jobs, got ${grid.values.length}`);
  const coordinator = grid.values.find((row) => row[grid.columns.indexOf("title")] === "Coordinator");
  if (!coordinator) fail("dml-02: Coordinator job missing");
  else {
    if (coordinator[grid.columns.indexOf("min_salary")] !== 40000) fail("dml-02: Coordinator min_salary should be 40000");
    if (coordinator[grid.columns.indexOf("max_salary")] !== 60000) fail("dml-02: Coordinator max_salary should be 60000");
  }
}

{
  const grid = run(harbor.seedSql, dml["dml-03"].solutionSql, dml["dml-03"].checkSql);
  if (cell(grid, 0, "id") !== 12 || cell(grid, 0, "salary") !== 50000) {
    fail("dml-03: employee 12 salary should be 50000");
  }
}

{
  const grid = run(harbor.seedSql, dml["dml-04"].solutionSql, dml["dml-04"].checkSql);
  if (cell(grid, 0, "id") !== 12 || cell(grid, 0, "bonus_pct") !== 0) {
    fail("dml-04: employee 12 bonus_pct should be 0");
  }
}

{
  const grid = run(harbor.seedSql, dml["dml-05"].solutionSql, dml["dml-05"].checkSql);
  if (grid.values.length !== 5) fail(`dml-05: expected 5 projects, got ${grid.values.length}`);
  if (grid.values.some((row) => row[grid.columns.indexOf("id")] === 6)) fail("dml-05: unstaffed project id 6 still present");
}

{
  const grid = run(harbor.seedSql, dml["dml-06"].solutionSql, dml["dml-06"].checkSql);
  if (grid.values.length !== 7) fail(`dml-06: expected 7 projects, got ${grid.values.length}`);
  if (!grid.values.some((row) => row[grid.columns.indexOf("name")] === "Retention pilot")) {
    fail("dml-06: Retention pilot missing");
  }
}

{
  const grid = run(harbor.seedSql, dml["dml-07"].solutionSql, dml["dml-07"].checkSql);
  const lab = grid.values.find((row) => row[grid.columns.indexOf("name")] === "Lab notebook");
  if (!lab) fail("dml-07: Lab notebook missing");
  else if (lab[grid.columns.indexOf("budget")] !== 0) fail("dml-07: Lab notebook budget should be 0");
}

{
  const grid = run(harbor.seedSql, dml["dml-08"].solutionSql, dml["dml-08"].checkSql);
  if (grid.values.length !== 10) fail(`dml-08: expected 10 assignments, got ${grid.values.length}`);
  const hours = grid.values.map((row) => row[grid.columns.indexOf("hours")]);
  for (const dropped of [5, 8, 6]) {
    if (hours.includes(dropped)) fail(`dml-08: ${dropped}-hour assignment should be removed`);
  }
}

{
  const grid = run(harbor.seedSql, dml["dml-09"].solutionSql, dml["dml-09"].checkSql);
  const byId = new Map(grid.values.map((row) => [row[grid.columns.indexOf("id")], row[grid.columns.indexOf("bonus_pct")]]));
  if (byId.get(3) !== 0.1) fail("dml-09: employee 3 rate should be 0.1");
  if (byId.get(9) !== 0.1) fail("dml-09: employee 9 rate should be 0.1");
  if (byId.get(12) !== null) fail("dml-09: employee 12 rate should remain NULL");
}

{
  const grid = run(harbor.seedSql, dml["dml-10"].solutionSql, dml["dml-10"].checkSql);
  if (cell(grid, 0, "budget") !== 15000) fail("dml-10: Capstone archive budget should be 15000");
  if (cell(grid, 0, "employee_id") !== 12) fail("dml-10: staff_id should be 12");
  if (cell(grid, 0, "role") !== "Analyst") fail("dml-10: job/title should be Analyst");
  if (cell(grid, 0, "hours") !== 16) fail("dml-10: hours should be 16");
}

console.log(empty.length ? `EMPTY ${empty.join(", ")}` : "EMPTY none");
console.log(failures.length ? failures.join("\n") : "FAILURES none");
if (failures.length) process.exit(1);
