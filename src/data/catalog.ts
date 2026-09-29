import type { Question, Topic } from "./types";
import { selectQuestions } from "./questions/select";
import { joinQuestions } from "./questions/joins";
import { windowQuestions } from "./questions/windows";
import { whereQuestions, aggregationQuestions, orderQuestions, limitQuestions } from "./questions/core";
import { functionQuestions, caseQuestions, duplicateQuestions } from "./questions/functions";
import { rankingQuestions } from "./questions/ranking";
import { selfJoinQuestions, subqueryQuestions, dmlQuestions } from "./questions/structure";
import { dateQuestions } from "./questions/dates";
import { companyQuestions } from "./questions/company";
import { clinicQuestions } from "./questions/clinic";

export const topics: Topic[] = [
  { id: "select", name: "Select Statements", description: "Read columns, aliases, literals, and simple projections.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs"], kind: "topic" },
  { id: "where", name: "WHERE Clause & Filtering", description: "Keep the rows that match a condition.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs", "projects"], kind: "topic" },
  { id: "aggregations", name: "Aggregations", description: "Summarise groups with counts, sums, and filters on aggregates.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs", "projects", "employee_projects"], kind: "topic" },
  { id: "order-by", name: "ORDER BY & Sorting", description: "Control the sequence of the result, including nulls.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs", "projects"], kind: "topic" },
  { id: "limit-offset", name: "LIMIT & OFFSET", description: "Page through a sorted result.", schemaId: "harbor", visibleTables: ["employees", "projects", "salaries_history"], kind: "topic" },
  { id: "functions", name: "Basic Functions", description: "Shape text, numbers, and nulls with built-in functions.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs"], kind: "topic" },
  { id: "duplicates", name: "Finding Duplicates & Data Quality", description: "Spot repeated values and missing fields.", schemaId: "harbor", visibleTables: ["employees", "jobs", "projects", "salaries_history"], kind: "topic" },
  { id: "ranking", name: "Ranking & Nth Value Queries", description: "Number rows, break ties, and pick the nth row.", schemaId: "harbor", visibleTables: ["team_metrics", "teams", "employees", "departments"], kind: "topic" },
  { id: "case", name: "CASE & Conditional Logic", description: "Turn conditions into labels and calculated branches.", schemaId: "harbor", visibleTables: ["employees", "departments", "projects", "team_metrics"], kind: "topic" },
  { id: "joins", name: "Joins", description: "Combine related tables and keep unmatched rows when asked.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs", "projects", "employee_projects", "salaries_history"], kind: "topic" },
  { id: "self-joins", name: "Self Joins & Hierarchical Data", description: "Relate rows in the same table, including managers.", schemaId: "harbor", visibleTables: ["employees", "departments", "jobs"], kind: "topic" },
  { id: "subqueries", name: "Subqueries", description: "Nest a query inside a filter, a source, or a comparison.", schemaId: "harbor", visibleTables: ["employees", "departments", "projects", "employee_projects", "salaries_history"], kind: "topic" },
  { id: "windows", name: "CTEs/Window Functions", description: "Name intermediate results and calculate across related rows.", schemaId: "harbor", visibleTables: ["teams", "team_metrics", "team_targets", "team_roster"], kind: "topic" },
  { id: "dml", name: "Database Changes", description: "Insert, update, and delete, then check the table.", schemaId: "harbor", visibleTables: ["departments", "jobs", "projects", "employees", "employee_projects"], kind: "topic" },
  { id: "dates", name: "Date Operations & Time-Based Analytics", description: "Extract, shift, and group calendar values.", schemaId: "harbor", visibleTables: ["employees", "departments", "projects", "salaries_history"], kind: "topic" },
  { id: "clinic", name: "Clinic Visits", description: "Read a small clinic of clinicians, patients, and visits.", schemaId: "clinic", visibleTables: ["clinicians", "patients", "visits"], kind: "topic" },
];

export const collections: Topic[] = [
  { id: "ecommerce", name: "e-commerce", description: "Orders, catalog rows, and customer spend for a fictional shop.", schemaId: "shop", visibleTables: ["customers", "products", "orders", "order_items"], kind: "collection" },
  { id: "streaming", name: "streaming", description: "Watch time and a title catalog for a fictional studio.", schemaId: "studio", visibleTables: ["titles", "members", "watches"], kind: "collection" },
  { id: "social", name: "social", description: "Posts and reactions for a fictional community.", schemaId: "community", visibleTables: ["members", "posts", "reactions"], kind: "collection" },
  { id: "search", name: "search", description: "Searches and result clicks for a fictional finder.", schemaId: "finder", visibleTables: ["queries", "results", "devices"], kind: "collection" },
];

export const allQuestions: Question[] = [
  ...selectQuestions,
  ...whereQuestions,
  ...aggregationQuestions,
  ...orderQuestions,
  ...limitQuestions,
  ...functionQuestions,
  ...duplicateQuestions,
  ...rankingQuestions,
  ...caseQuestions,
  ...joinQuestions,
  ...selfJoinQuestions,
  ...subqueryQuestions,
  ...windowQuestions,
  ...dmlQuestions,
  ...dateQuestions,
  ...clinicQuestions,
  ...companyQuestions,
];

const seen = new Set<string>();
for (const question of allQuestions) {
  if (seen.has(question.id)) throw new Error(`Duplicate question id ${question.id}`);
  seen.add(question.id);
}

export function questionsFor(topicId: string) {
  return allQuestions.filter((question) => question.topicId === topicId);
}

export const runtimeName = "SQLite";
