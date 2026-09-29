export type Difficulty = "easy" | "medium" | "hard";

export type ColumnDef = {
  name: string;
  type: string;
  pk?: boolean;
  fk?: { table: string; column: string };
};

export type TableDef = {
  name: string;
  columns: ColumnDef[];
};

export type SchemaDef = {
  id: string;
  databaseName: string;
  tables: TableDef[];
  seedSql: string;
};

export type Question = {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  title: string;
  summary: string;
  role: string;
  context: string;
  task: string;
  requiredOutput: string[];
  rules: string[];
  success: string;
  starterSql: string;
  hints: string[];
  solutionSql: string;
  checkSql?: string;
  orderMatters: boolean;
  columnOrderMatters: boolean;
  tablesUsed: string[];
  concept: string;
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  schemaId: string;
  visibleTables: string[];
  kind: "topic" | "collection";
};

export type Draft = {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  title: string;
  summary: string;
  role: string;
  context: string;
  task: string;
  requiredOutput: string[];
  rules: string[];
  success: string;
  starterSql?: string;
  hints: string[];
  solutionSql: string;
  checkSql?: string;
  orderMatters?: boolean;
  columnOrderMatters?: boolean;
  tablesUsed: string[];
  concept: string;
};

export function q(draft: Draft): Question {
  return {
    id: draft.id,
    topicId: draft.topicId,
    difficulty: draft.difficulty,
    title: draft.title,
    summary: draft.summary,
    role: draft.role,
    context: draft.context,
    task: draft.task,
    requiredOutput: draft.requiredOutput,
    rules: draft.rules,
    success: draft.success,
    starterSql: draft.starterSql ?? `-- ${draft.title}\n`,
    hints: draft.hints,
    solutionSql: draft.solutionSql,
    checkSql: draft.checkSql,
    orderMatters: draft.orderMatters ?? false,
    columnOrderMatters: draft.columnOrderMatters ?? true,
    tablesUsed: draft.tablesUsed,
    concept: draft.concept,
  };
}
