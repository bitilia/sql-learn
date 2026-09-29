export const SITE = "https://sqllearn.bitilia.com";

export const siteTitle = "Learn SQL in the browser · SQL Learn";

export const siteDescription =
  "Learn SQL by writing queries in the browser. Free SQL practice for SELECT, WHERE, JOIN, GROUP BY, and more. No account, no install, and no personal data.";

export const aboutLead =
  "SQL Learn is a free way to learn SQL by writing it. Each exercise gives you tables and a task. You write a query, run it in the browser, and see whether the result matches. There is no account, no install, and nothing is sent to a server.";

export const aboutSections: { heading: string; paragraphs?: string[]; steps?: string[] }[] = [
  {
    heading: "How to learn SQL",
    paragraphs: [
      "Learning SQL sticks when you write a query and check the result, not when you only read one. Start with a select statement, then filtering, joins, and grouping.",
    ],
    steps: [
      "Choose a topic. Select Statements is the right start if you are new to SQL.",
      "Read the tables and the task.",
      "Write the query and run it. A matching result means it is right.",
      "Open a hint if you stall, then go on to the next exercise.",
    ],
  },
  {
    heading: "How to write a SQL query",
    paragraphs: [
      "A SQL query asks a table for rows. Start with SELECT and the columns you want, then FROM and the table name. Add WHERE to keep certain rows, JOIN to bring in a related table, GROUP BY to summarise, and ORDER BY to sort. LIMIT pages through the result.",
      "A first query looks like this: SELECT last_name, salary FROM employees WHERE salary >= 100000 ORDER BY salary DESC.",
    ],
  },
  {
    heading: "What you can practice",
    paragraphs: [
      "Work through SELECT, WHERE, aggregations, ORDER BY, LIMIT and OFFSET, functions, duplicates, ranking, CASE, joins, self joins, subqueries, common table expressions, window functions, dates, and changes with INSERT, UPDATE, and DELETE.",
      "Other sets use a clinic, a shop, a streaming catalog, a community, and a search log, so you can practice SQL on more than one database.",
    ],
  },
];

export const aboutFaq: { question: string; answer: string }[] = [
  {
    question: "How do I learn SQL?",
    answer:
      "Write a short query, run it, and check the result. Begin with Select Statements, then WHERE, then joins. SQL Learn is a set of exercises for that practice.",
  },
  {
    question: "How do I write SQL if I have never written a query?",
    answer:
      "Name the columns and the table, then run it: SELECT last_name, salary FROM employees. Change the columns and add a WHERE filter until the result matches the task.",
  },
  {
    question: "Is this SQL tutorial free?",
    answer:
      "Yes. SQL Learn runs fully in the browser and makes no external requests. We do not process any personal data.",
  },
  {
    question: "Do I need to install a database to practice SQL?",
    answer:
      "No. The exercises run on SQLite in the browser.",
  },
  {
    question: "What SQL should a beginner learn first?",
    answer: "SELECT, WHERE, JOIN, GROUP BY, and ORDER BY. Those cover most questions people ask of a table.",
  },
];
