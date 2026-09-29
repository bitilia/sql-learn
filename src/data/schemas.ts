import type { SchemaDef } from "./types";

const harborSeed = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT
);
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  min_salary INTEGER,
  max_salary INTEGER
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  department_id INTEGER,
  job_id INTEGER,
  manager_id INTEGER,
  hire_date TEXT,
  salary INTEGER,
  bonus_pct REAL
);
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  budget INTEGER,
  start_date TEXT
);
CREATE TABLE employee_projects (
  employee_id INTEGER,
  project_id INTEGER,
  role TEXT,
  hours INTEGER,
  PRIMARY KEY (employee_id, project_id)
);
CREATE TABLE salaries_history (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  salary INTEGER,
  effective_date TEXT
);
CREATE TABLE teams (
  name TEXT PRIMARY KEY,
  region TEXT
);
CREATE TABLE team_metrics (
  team TEXT,
  period TEXT,
  revenue INTEGER,
  quality_score REAL
);
CREATE TABLE team_targets (
  team TEXT,
  year INTEGER,
  target_revenue INTEGER
);
CREATE TABLE team_roster (
  team TEXT,
  employee_id INTEGER
);

INSERT INTO departments (id, name, location) VALUES
  (1, 'People', 'London'),
  (2, 'Finance', 'Dublin'),
  (3, 'Product', 'Berlin'),
  (4, 'Operations', 'Lisbon'),
  (5, 'Research', NULL);

INSERT INTO jobs (id, title, min_salary, max_salary) VALUES
  (1, 'Analyst', 45000, 70000),
  (2, 'Engineer', 70000, 120000),
  (3, 'Manager', 90000, 150000),
  (4, 'Director', 130000, 200000);

INSERT INTO employees (id, first_name, last_name, email, department_id, job_id, manager_id, hire_date, salary, bonus_pct) VALUES
  (1, 'Ava', 'Shah', 'ava.shah@harbor.example', 1, 1, 4, '2015-03-12', 62000, 0.10),
  (2, 'Leo', 'Martins', 'leo.martins@harbor.example', 2, 1, 5, '2021-07-01', 58000, 0.05),
  (3, 'Mina', 'Cho', 'mina.cho@harbor.example', 3, 2, 6, '2020-01-15', 98000, NULL),
  (4, 'Jonah', 'Adeyemi', 'jonah.adeyemi@harbor.example', 1, 3, NULL, '2016-11-02', 112000, 0.15),
  (5, 'Priya', 'Nair', 'priya.nair@harbor.example', 2, 3, NULL, '2017-05-20', 125000, 0.12),
  (6, 'Elena', 'Vogel', 'elena.vogel@harbor.example', 3, 3, 8, '2018-09-09', 130000, 0.08),
  (7, 'Samir', 'Rahman', 'samir.rahman@harbor.example', 4, 2, 8, '2022-02-11', 88000, 0.00),
  (8, 'Chris', 'Dalton', 'chris.dalton@harbor.example', 4, 4, NULL, '2014-04-30', 160000, 0.20),
  (9, 'Noor', 'El-Sayed', 'noor.elsayed@harbor.example', 5, 2, 6, '2023-08-01', 91000, NULL),
  (10, 'Idris', 'Cole', 'idris.cole@harbor.example', 2, 1, 5, '2024-01-08', 54000, 0.05),
  (11, 'Maya', 'Shah', 'maya.shah@harbor.example', 3, 2, 6, '2021-11-11', 140000, 0.07),
  (12, 'Rowan', 'Blake', NULL, 4, 1, 8, '2020-06-06', 47000, NULL);

INSERT INTO projects (id, name, department_id, budget, start_date) VALUES
  (1, 'Onboarding refresh', 1, 80000, '2024-01-10'),
  (2, 'Ledger close', 2, 120000, '2024-02-01'),
  (3, 'Mobile rewrite', 3, 250000, '2023-06-01'),
  (4, 'Warehouse routing', 4, 90000, '2024-03-15'),
  (5, 'Lab notebook', 5, NULL, '2024-04-01'),
  (6, 'Archive migration', 2, 10000, '2024-09-01');

INSERT INTO employee_projects (employee_id, project_id, role, hours) VALUES
  (1, 1, 'Lead', 40),
  (4, 1, 'Sponsor', 10),
  (3, 1, 'Advisor', 5),
  (2, 2, 'Analyst', 30),
  (5, 2, 'Reviewer', 20),
  (10, 2, 'Analyst', 12),
  (3, 3, 'Engineer', 80),
  (6, 3, 'Lead', 25),
  (11, 3, 'Engineer', 35),
  (7, 4, 'Engineer', 60),
  (8, 4, 'Sponsor', 8),
  (10, 4, 'Advisor', 6),
  (9, 5, 'Engineer', 15);

INSERT INTO salaries_history (id, employee_id, salary, effective_date) VALUES
  (1, 1, 50000, '2015-03-12'),
  (2, 1, 62000, '2023-03-12'),
  (3, 3, 80000, '2020-01-15'),
  (4, 3, 98000, '2023-01-15'),
  (5, 8, 140000, '2014-04-30'),
  (6, 8, 160000, '2022-04-30'),
  (7, 7, 88000, '2022-02-11'),
  (8, 12, 47000, '2020-06-06'),
  (9, 5, 110000, '2017-05-20'),
  (10, 5, 125000, '2023-05-20');

INSERT INTO teams (name, region) VALUES
  ('Alpha', 'EMEA'),
  ('Beta', 'EMEA'),
  ('Gamma', 'AMER'),
  ('Delta', 'AMER');

INSERT INTO team_metrics (team, period, revenue, quality_score) VALUES
  ('Alpha', '2024-01', 100, 80),
  ('Alpha', '2024-02', 120, 82),
  ('Alpha', '2024-03', 120, 79),
  ('Alpha', '2024-04', 90, 88),
  ('Beta', '2024-01', 80, 70),
  ('Beta', '2024-02', 110, 75),
  ('Beta', '2024-03', 140, 90),
  ('Beta', '2024-04', NULL, 85),
  ('Gamma', '2024-01', 200, 60),
  ('Gamma', '2024-02', 180, 66),
  ('Gamma', '2024-03', 210, 72),
  ('Gamma', '2024-04', 210, 71);

INSERT INTO team_targets (team, year, target_revenue) VALUES
  ('Alpha', 2024, 450),
  ('Beta', 2024, 400),
  ('Gamma', 2024, 800),
  ('Delta', 2024, 100);

INSERT INTO team_roster (team, employee_id) VALUES
  ('Alpha', 3),
  ('Alpha', 6),
  ('Beta', 2),
  ('Beta', 5),
  ('Beta', 10),
  ('Gamma', 9),
  ('Gamma', 11);
`;

const shopSeed = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  city TEXT,
  signup_date TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  price REAL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  ordered_at TEXT,
  status TEXT
);
CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  qty INTEGER,
  unit_price REAL,
  PRIMARY KEY (order_id, product_id)
);
INSERT INTO customers (id, name, city, signup_date) VALUES
  (1, 'Nora Hale', 'Bristol', '2023-02-02'),
  (2, 'Amir Qureshi', 'Leeds', '2023-11-19'),
  (3, 'Sofia Berg', 'Bristol', '2024-01-04'),
  (4, 'Kenji Sato', 'Glasgow', '2022-08-14'),
  (5, 'Lila Ortiz', 'Leeds', '2024-06-01'),
  (6, 'Tess Okonkwo', 'Cardiff', '2024-08-08');
INSERT INTO products (id, name, category, price) VALUES
  (1, 'Ceramic mug', 'Home', 12.5),
  (2, 'Desk lamp', 'Home', 34),
  (3, 'Notebook', 'Stationery', 6),
  (4, 'Ink pen', 'Stationery', 9.5),
  (5, 'Cotton tote', 'Accessories', 15),
  (6, 'Wool scarf', 'Accessories', 28);
INSERT INTO orders (id, customer_id, ordered_at, status) VALUES
  (1, 1, '2024-03-02', 'paid'),
  (2, 1, '2024-05-16', 'paid'),
  (3, 2, '2024-04-09', 'refunded'),
  (4, 3, '2024-06-21', 'paid'),
  (5, 4, '2024-01-11', 'paid'),
  (6, 5, '2024-07-02', 'pending'),
  (7, 2, '2024-02-02', 'paid');
INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES
  (1, 1, 2, 12.5),
  (1, 3, 1, 6),
  (2, 2, 1, 34),
  (3, 6, 1, 28),
  (4, 5, 2, 15),
  (4, 4, 3, 9.5),
  (5, 3, 4, 6),
  (5, 1, 1, 12.5),
  (6, 2, 1, 34),
  (7, 5, 1, 15),
  (7, 6, 2, 28);
`;

const studioSeed = `
CREATE TABLE titles (
  id INTEGER PRIMARY KEY,
  name TEXT,
  genre TEXT,
  release_year INTEGER
);
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  display_name TEXT,
  plan TEXT,
  country TEXT
);
CREATE TABLE watches (
  member_id INTEGER,
  title_id INTEGER,
  watched_on TEXT,
  minutes INTEGER
);
INSERT INTO titles (id, name, genre, release_year) VALUES
  (1, 'Paper boats', 'Drama', 2019),
  (2, 'Night market', 'Documentary', 2021),
  (3, 'Glass orbit', 'Science', 2022),
  (4, 'Salt road', 'Drama', 2018),
  (5, 'Quiet engines', 'Documentary', 2023),
  (6, 'Kitchen choruses', 'Drama', 2020);
INSERT INTO members (id, display_name, plan, country) VALUES
  (1, 'Nora Hale', 'plus', 'UK'),
  (2, 'Amir Qureshi', 'basic', 'UK'),
  (3, 'Sofia Berg', 'plus', 'SE'),
  (4, 'Kenji Sato', 'basic', 'JP'),
  (5, 'Lila Ortiz', 'free', 'ES'),
  (6, 'Tess Okonkwo', 'free', 'NG');
INSERT INTO watches (member_id, title_id, watched_on, minutes) VALUES
  (1, 1, '2024-05-01', 48),
  (1, 2, '2024-05-03', 30),
  (1, 1, '2024-06-01', 12),
  (2, 3, '2024-04-11', 90),
  (2, 5, '2024-04-12', 20),
  (3, 1, '2024-07-02', 55),
  (3, 4, '2024-07-09', 40),
  (4, 3, '2024-03-03', 15),
  (5, 2, '2024-08-01', 10);
`;

const communitySeed = `
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  handle TEXT,
  joined_on TEXT
);
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  member_id INTEGER,
  body TEXT,
  posted_on TEXT
);
CREATE TABLE reactions (
  post_id INTEGER,
  member_id INTEGER,
  kind TEXT
);
INSERT INTO members (id, handle, joined_on) VALUES
  (1, 'northstar', '2022-01-04'),
  (2, 'fieldnote', '2023-03-18'),
  (3, 'lowtide', '2023-11-02'),
  (4, 'copperline', '2024-02-14'),
  (5, 'marshlight', '2024-05-30');
INSERT INTO posts (id, member_id, body, posted_on) VALUES
  (1, 1, 'First shift notes', '2024-06-01'),
  (2, 1, 'Follow-up on routing', '2024-06-04'),
  (3, 2, 'A quieter dashboard', '2024-06-02'),
  (4, 3, 'Map of the harbor', '2024-06-08'),
  (5, 2, 'Nulls in the export', '2024-06-11'),
  (6, 4, 'Unanswered note', '2024-06-12');
INSERT INTO reactions (post_id, member_id, kind) VALUES
  (1, 2, 'useful'),
  (1, 3, 'useful'),
  (2, 3, 'spark'),
  (3, 1, 'useful'),
  (3, 2, 'spark'),
  (3, 4, 'spark'),
  (4, 1, 'useful'),
  (5, 3, 'spark'),
  (5, 1, 'useful');
`;

const finderSeed = `
CREATE TABLE queries (
  id INTEGER PRIMARY KEY,
  query_text TEXT,
  searched_on TEXT
);
CREATE TABLE devices (
  name TEXT PRIMARY KEY,
  form TEXT
);
CREATE TABLE results (
  query_id INTEGER,
  rank INTEGER,
  url TEXT,
  clicked INTEGER
);
INSERT INTO queries (id, query_text, searched_on) VALUES
  (1, 'wool scarf', '2024-07-01'),
  (2, 'desk lamp', '2024-07-01'),
  (3, 'quiet engines', '2024-07-02'),
  (4, 'harbor map', '2024-07-03'),
  (5, 'unused phrase', '2024-07-04');
INSERT INTO devices (name, form) VALUES
  ('phone', 'handheld'),
  ('desktop', 'desk');
INSERT INTO results (query_id, rank, url, clicked) VALUES
  (1, 1, 'https://example.test/scarf', 1),
  (1, 2, 'https://example.test/wool', 0),
  (1, 3, 'https://example.test/winter', 0),
  (2, 1, 'https://example.test/lamp', 1),
  (2, 2, 'https://example.test/light', 1),
  (3, 1, 'https://example.test/engines', 0),
  (3, 2, 'https://example.test/film', 1),
  (4, 1, 'https://example.test/harbor', 0);
`;

const clinicSeed = `
CREATE TABLE clinicians (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  room TEXT
);
CREATE TABLE patients (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  born_on TEXT,
  clinician_id INTEGER
);
CREATE TABLE visits (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  clinician_id INTEGER,
  visited_on TEXT,
  reason TEXT,
  minutes INTEGER,
  fee INTEGER
);
INSERT INTO clinicians (id, name, specialty, room) VALUES
  (1, 'Ada Okonkwo', 'General', 'A1'),
  (2, 'Ben Cho', 'Cardiology', 'B2'),
  (3, 'Cora Diaz', 'Pediatrics', NULL),
  (4, 'Drew Hale', 'Dermatology', 'C3'),
  (5, 'Noor El-Sayed', 'Neurology', 'D4');
INSERT INTO patients (id, first_name, last_name, born_on, clinician_id) VALUES
  (1, 'Noah', 'Patel', '1990-04-12', 1),
  (2, 'Milo', 'Berg', '2016-11-02', 3),
  (3, 'Omar', 'Haddad', '1984-01-30', 2),
  (4, 'Lena', 'Berg', '1972-08-19', 1),
  (5, 'Maya', 'Shah', '2018-06-06', 3),
  (6, 'Jonah', 'Adeyemi', NULL, NULL),
  (7, 'Priya', 'Nair', '1995-02-14', 4),
  (8, 'Samir', 'Rahman', '2001-12-01', 2),
  (9, 'Tess', 'Quinn', '1988-09-09', 5);
INSERT INTO visits (id, patient_id, clinician_id, visited_on, reason, minutes, fee) VALUES
  (1, 1, 1, '2024-01-08', 'Checkup', 20, 80),
  (2, 1, 2, '2024-03-02', 'Chest pain', 40, 180),
  (3, 4, 1, '2024-01-08', 'Checkup', 25, 80),
  (4, 4, 1, '2024-06-01', 'Follow-up', 15, NULL),
  (5, 3, 2, '2024-02-14', 'Review', 30, 150),
  (6, 5, 3, '2024-04-20', 'Vaccine', 10, 40),
  (7, 6, 4, '2024-05-05', 'Rash', 15, 90),
  (8, 2, 3, '2024-04-20', 'Vaccine', 10, 0),
  (9, 8, 2, '2024-07-19', 'Labs', NULL, 60);
`;

export const schemas: SchemaDef[] = [
  {
    id: "harbor",
    databaseName: "harbor",
    seedSql: harborSeed,
    tables: [
      {
        name: "departments",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "location", type: "TEXT" },
        ],
      },
      {
        name: "jobs",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "title", type: "TEXT" },
          { name: "min_salary", type: "INTEGER" },
          { name: "max_salary", type: "INTEGER" },
        ],
      },
      {
        name: "employees",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "first_name", type: "TEXT" },
          { name: "last_name", type: "TEXT" },
          { name: "email", type: "TEXT" },
          { name: "department_id", type: "INTEGER", fk: { table: "departments", column: "id" } },
          { name: "job_id", type: "INTEGER", fk: { table: "jobs", column: "id" } },
          { name: "manager_id", type: "INTEGER", fk: { table: "employees", column: "id" } },
          { name: "hire_date", type: "TEXT" },
          { name: "salary", type: "INTEGER" },
          { name: "bonus_pct", type: "REAL" },
        ],
      },
      {
        name: "projects",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "department_id", type: "INTEGER", fk: { table: "departments", column: "id" } },
          { name: "budget", type: "INTEGER" },
          { name: "start_date", type: "TEXT" },
        ],
      },
      {
        name: "employee_projects",
        columns: [
          { name: "employee_id", type: "INTEGER", pk: true, fk: { table: "employees", column: "id" } },
          { name: "project_id", type: "INTEGER", pk: true, fk: { table: "projects", column: "id" } },
          { name: "role", type: "TEXT" },
          { name: "hours", type: "INTEGER" },
        ],
      },
      {
        name: "salaries_history",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "employee_id", type: "INTEGER", fk: { table: "employees", column: "id" } },
          { name: "salary", type: "INTEGER" },
          { name: "effective_date", type: "TEXT" },
        ],
      },
      {
        name: "teams",
        columns: [
          { name: "name", type: "TEXT", pk: true },
          { name: "region", type: "TEXT" },
        ],
      },
      {
        name: "team_metrics",
        columns: [
          { name: "team", type: "TEXT", fk: { table: "teams", column: "name" } },
          { name: "period", type: "TEXT" },
          { name: "revenue", type: "INTEGER" },
          { name: "quality_score", type: "REAL" },
        ],
      },
      {
        name: "team_targets",
        columns: [
          { name: "team", type: "TEXT", fk: { table: "teams", column: "name" } },
          { name: "year", type: "INTEGER" },
          { name: "target_revenue", type: "INTEGER" },
        ],
      },
      {
        name: "team_roster",
        columns: [
          { name: "team", type: "TEXT", fk: { table: "teams", column: "name" } },
          { name: "employee_id", type: "INTEGER" },
        ],
      },
    ],
  },
  {
    id: "shop",
    databaseName: "shop",
    seedSql: shopSeed,
    tables: [
      {
        name: "customers",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "city", type: "TEXT" },
          { name: "signup_date", type: "TEXT" },
        ],
      },
      {
        name: "products",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "category", type: "TEXT" },
          { name: "price", type: "REAL" },
        ],
      },
      {
        name: "orders",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "customer_id", type: "INTEGER", fk: { table: "customers", column: "id" } },
          { name: "ordered_at", type: "TEXT" },
          { name: "status", type: "TEXT" },
        ],
      },
      {
        name: "order_items",
        columns: [
          { name: "order_id", type: "INTEGER", pk: true, fk: { table: "orders", column: "id" } },
          { name: "product_id", type: "INTEGER", pk: true, fk: { table: "products", column: "id" } },
          { name: "qty", type: "INTEGER" },
          { name: "unit_price", type: "REAL" },
        ],
      },
    ],
  },
  {
    id: "studio",
    databaseName: "studio",
    seedSql: studioSeed,
    tables: [
      {
        name: "titles",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "genre", type: "TEXT" },
          { name: "release_year", type: "INTEGER" },
        ],
      },
      {
        name: "members",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "display_name", type: "TEXT" },
          { name: "plan", type: "TEXT" },
          { name: "country", type: "TEXT" },
        ],
      },
      {
        name: "watches",
        columns: [
          { name: "member_id", type: "INTEGER", fk: { table: "members", column: "id" } },
          { name: "title_id", type: "INTEGER", fk: { table: "titles", column: "id" } },
          { name: "watched_on", type: "TEXT" },
          { name: "minutes", type: "INTEGER" },
        ],
      },
    ],
  },
  {
    id: "community",
    databaseName: "community",
    seedSql: communitySeed,
    tables: [
      {
        name: "members",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "handle", type: "TEXT" },
          { name: "joined_on", type: "TEXT" },
        ],
      },
      {
        name: "posts",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "member_id", type: "INTEGER", fk: { table: "members", column: "id" } },
          { name: "body", type: "TEXT" },
          { name: "posted_on", type: "TEXT" },
        ],
      },
      {
        name: "reactions",
        columns: [
          { name: "post_id", type: "INTEGER", fk: { table: "posts", column: "id" } },
          { name: "member_id", type: "INTEGER", fk: { table: "members", column: "id" } },
          { name: "kind", type: "TEXT" },
        ],
      },
    ],
  },
  {
    id: "finder",
    databaseName: "finder",
    seedSql: finderSeed,
    tables: [
      {
        name: "devices",
        columns: [
          { name: "name", type: "TEXT", pk: true },
          { name: "form", type: "TEXT" },
        ],
      },
      {
        name: "queries",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "query_text", type: "TEXT" },
          { name: "searched_on", type: "TEXT" },
        ],
      },
      {
        name: "results",
        columns: [
          { name: "query_id", type: "INTEGER", fk: { table: "queries", column: "id" } },
          { name: "rank", type: "INTEGER" },
          { name: "url", type: "TEXT" },
          { name: "clicked", type: "INTEGER" },
        ],
      },
    ],
  },
  {
    id: "clinic",
    databaseName: "clinic",
    seedSql: clinicSeed,
    tables: [
      {
        name: "clinicians",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "specialty", type: "TEXT" },
          { name: "room", type: "TEXT" },
        ],
      },
      {
        name: "patients",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "first_name", type: "TEXT" },
          { name: "last_name", type: "TEXT" },
          { name: "born_on", type: "TEXT" },
          { name: "clinician_id", type: "INTEGER", fk: { table: "clinicians", column: "id" } },
        ],
      },
      {
        name: "visits",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "patient_id", type: "INTEGER", fk: { table: "patients", column: "id" } },
          { name: "clinician_id", type: "INTEGER", fk: { table: "clinicians", column: "id" } },
          { name: "visited_on", type: "TEXT" },
          { name: "reason", type: "TEXT" },
          { name: "minutes", type: "INTEGER" },
          { name: "fee", type: "INTEGER" },
        ],
      },
    ],
  },
];

export function getSchema(id: string): SchemaDef {
  const schema = schemas.find((item) => item.id === id);
  if (!schema) throw new Error(`Unknown schema ${id}`);
  return schema;
}

export function relationshipsFor(schema: SchemaDef, visible: string[]) {
  const allowed = new Set(visible);
  const links: { from: string; column: string; to: string; toColumn: string }[] = [];
  for (const table of schema.tables) {
    if (!allowed.has(table.name)) continue;
    for (const column of table.columns) {
      if (column.fk && allowed.has(column.fk.table)) {
        links.push({
          from: table.name,
          column: column.name,
          to: column.fk.table,
          toColumn: column.fk.column,
        });
      }
    }
  }
  return links;
}
