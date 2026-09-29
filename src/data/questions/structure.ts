import { q } from "../types";

export const selfJoinQuestions = [
  q({
    id: "self-01", topicId: "self-joins", difficulty: "easy", title: "Reports and their manager",
    summary: "Inner join employees to itself.", role: "HR analyst",
    context: "A short list needs each person who has a manager, with that manager's family name.",
    task: "Return employee and manager, both family names. Leave out people who have no manager.",
    requiredOutput: ["Columns: employee, manager"],
    rules: ["Join employees to itself on manager_id"], success: "Top-level people are absent.",
    hints: ["Alias the table twice.", "SELECT e.last_name AS employee, m.last_name AS manager FROM employees e JOIN employees m ON m.id = e.manager_id;"],
    solutionSql: "SELECT e.last_name AS employee, m.last_name AS manager FROM employees e JOIN employees m ON m.id = e.manager_id;",
    tablesUsed: ["employees"], concept: "self join",
  }),
  q({
    id: "self-02", topicId: "self-joins", difficulty: "easy", title: "Everyone, manager optional",
    summary: "Left join the manager.", role: "HR analyst",
    context: "The full roster should keep people who do not have a manager. Their manager cell stays empty.",
    task: "Return employee and manager for every employee. manager is null when manager_id is null.",
    requiredOutput: ["Columns: employee, manager", "Null manager kept as null"],
    rules: ["LEFT JOIN"], success: "All 12 people appear.",
    hints: ["SELECT e.last_name AS employee, m.last_name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id;"],
    solutionSql: "SELECT e.last_name AS employee, m.last_name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id;",
    tablesUsed: ["employees"], concept: "left self join",
  }),
  q({
    id: "self-03", topicId: "self-joins", difficulty: "easy", title: "People with no manager",
    summary: "Filter to null manager_id.", role: "People partner",
    context: "The top of the tree is everyone whose manager_id is null.",
    task: "Return last_name for employees with no manager. Sort by last_name.",
    requiredOutput: ["Column: last_name", "Sorted by last_name"],
    rules: ["IS NULL"], success: "Only the top of the tree remains.",
    orderMatters: true,
    hints: ["SELECT last_name FROM employees WHERE manager_id IS NULL ORDER BY last_name;"],
    solutionSql: "SELECT last_name FROM employees WHERE manager_id IS NULL ORDER BY last_name;",
    tablesUsed: ["employees"], concept: "root rows",
  }),
  q({
    id: "self-04", topicId: "self-joins", difficulty: "easy", title: "How many direct reports",
    summary: "Count reports per manager.", role: "Workforce analyst",
    context: "Span of control is the number of direct reports, labeled with the manager's family name.",
    task: "Return manager and reports. Sort by manager.",
    requiredOutput: ["Columns: manager, reports", "Sorted by manager"],
    rules: ["Only people who have at least one report"], success: "Each manager appears once.",
    orderMatters: true,
    hints: ["Join reports to managers, then GROUP BY the manager.", "SELECT m.last_name AS manager, COUNT(*) AS reports FROM employees e JOIN employees m ON m.id = e.manager_id GROUP BY m.id, m.last_name ORDER BY manager;"],
    solutionSql: `SELECT m.last_name AS manager, COUNT(*) AS reports
FROM employees e JOIN employees m ON m.id = e.manager_id
GROUP BY m.id, m.last_name ORDER BY manager;`,
    tablesUsed: ["employees"], concept: "aggregate self join",
  }),
  q({
    id: "self-05", topicId: "self-joins", difficulty: "medium", title: "Unique peer pairs",
    summary: "People who share a manager.", role: "People partner",
    context: "A pairing exercise wants each unordered pair of people who report to the same manager, once.",
    task: "Return employee, peer, and manager_id. Keep a pair only once by requiring the peer id to be greater than the employee id. Exclude people with no manager. Sort by manager_id, employee, peer.",
    requiredOutput: ["Columns: employee, peer, manager_id", "Each pair once", "That sort"],
    rules: ["Join employees to employees on manager_id", "p.id > e.id"], success: "No pair is repeated in reverse.",
    orderMatters: true,
    hints: ["SELECT e.last_name AS employee, p.last_name AS peer, e.manager_id FROM employees e JOIN employees p ON p.manager_id = e.manager_id AND p.id > e.id WHERE e.manager_id IS NOT NULL ORDER BY e.manager_id, employee, peer;"],
    solutionSql: `SELECT e.last_name AS employee, p.last_name AS peer, e.manager_id
FROM employees e
JOIN employees p ON p.manager_id = e.manager_id AND p.id > e.id
WHERE e.manager_id IS NOT NULL
ORDER BY e.manager_id, employee, peer;`,
    tablesUsed: ["employees"], concept: "peer join",
  }),
  q({
    id: "self-06", topicId: "self-joins", difficulty: "medium", title: "Paid more than the manager",
    summary: "Compare salaries across the self join.", role: "Payroll partner",
    context: "Compensation flags anyone whose salary is higher than their manager's salary.",
    task: "Return employee, employee_salary, manager, and manager_salary where the employee earns more. Sort by employee.",
    requiredOutput: ["Columns: employee, employee_salary, manager, manager_salary", "Sorted by employee"],
    rules: ["Inner join, because a missing manager cannot be compared"], success: "Only the inverted salaries remain.",
    orderMatters: true,
    hints: ["WHERE e.salary > m.salary.", "SELECT e.last_name AS employee, e.salary AS employee_salary, m.last_name AS manager, m.salary AS manager_salary FROM employees e JOIN employees m ON m.id = e.manager_id WHERE e.salary > m.salary ORDER BY employee;"],
    solutionSql: `SELECT e.last_name AS employee, e.salary AS employee_salary, m.last_name AS manager, m.salary AS manager_salary
FROM employees e JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary ORDER BY employee;`,
    tablesUsed: ["employees"], concept: "self comparison",
  }),
  q({
    id: "self-07", topicId: "self-joins", difficulty: "medium", title: "Hired after their manager",
    summary: "Compare hire dates up the tree.", role: "Workforce analyst",
    context: "A timeline check lists people who were hired after the person they report to.",
    task: "Return employee, employee_hire, manager, and manager_hire. Sort by employee_hire.",
    requiredOutput: ["Columns: employee, employee_hire, manager, manager_hire", "Sorted by employee_hire"],
    rules: ["hire_date text comparison matches calendar order"], success: "Only later hires remain.",
    orderMatters: true,
    hints: ["WHERE e.hire_date > m.hire_date.", "SELECT e.last_name AS employee, e.hire_date AS employee_hire, m.last_name AS manager, m.hire_date AS manager_hire FROM employees e JOIN employees m ON m.id = e.manager_id WHERE e.hire_date > m.hire_date ORDER BY employee_hire;"],
    solutionSql: `SELECT e.last_name AS employee, e.hire_date AS employee_hire, m.last_name AS manager, m.hire_date AS manager_hire
FROM employees e JOIN employees m ON m.id = e.manager_id
WHERE e.hire_date > m.hire_date ORDER BY employee_hire;`,
    tablesUsed: ["employees"], concept: "self comparison",
  }),
  q({
    id: "self-08", topicId: "self-joins", difficulty: "medium", title: "Manager in another department",
    summary: "Compare department ids up the tree.", role: "HR analyst",
    context: "Org design wants people whose manager sits in a different department.",
    task: "Return employee, employee_department, manager, and manager_department. Sort by employee.",
    requiredOutput: ["Columns: employee, employee_department, manager, manager_department", "Sorted by employee"],
    rules: ["Join departments twice, or compare ids and then look up names"], success: "Same-department pairs are excluded.",
    orderMatters: true,
    hints: ["Join two department aliases.", "SELECT e.last_name AS employee, ed.name AS employee_department, m.last_name AS manager, md.name AS manager_department FROM employees e JOIN employees m ON m.id = e.manager_id JOIN departments ed ON ed.id = e.department_id JOIN departments md ON md.id = m.department_id WHERE e.department_id <> m.department_id ORDER BY employee;"],
    solutionSql: `SELECT e.last_name AS employee, ed.name AS employee_department, m.last_name AS manager, md.name AS manager_department
FROM employees e
JOIN employees m ON m.id = e.manager_id
JOIN departments ed ON ed.id = e.department_id
JOIN departments md ON md.id = m.department_id
WHERE e.department_id <> m.department_id
ORDER BY employee;`,
    tablesUsed: ["employees", "departments"], concept: "self join plus lookup",
  }),
  q({
    id: "self-09", topicId: "self-joins", difficulty: "medium", title: "Skip-level manager",
    summary: "Join two levels up.", role: "People partner",
    context: "Skip-level conversations need the manager of the manager, and only where that person exists.",
    task: "Return employee, manager, and skip_level. Sort by employee.",
    requiredOutput: ["Columns: employee, manager, skip_level", "Only people who have a skip-level manager"],
    rules: ["Two self joins", "The second join is inner"], success: "People with no skip-level are absent.",
    orderMatters: true,
    hints: ["Join manager, then join the manager's manager.", "SELECT e.last_name AS employee, m.last_name AS manager, s.last_name AS skip_level FROM employees e JOIN employees m ON m.id = e.manager_id JOIN employees s ON s.id = m.manager_id ORDER BY employee;"],
    solutionSql: `SELECT e.last_name AS employee, m.last_name AS manager, s.last_name AS skip_level
FROM employees e
JOIN employees m ON m.id = e.manager_id
JOIN employees s ON s.id = m.manager_id
ORDER BY employee;`,
    tablesUsed: ["employees"], concept: "two-level join",
  }),
  q({
    id: "self-10", topicId: "self-joins", difficulty: "medium", title: "Same department as the manager",
    summary: "Keep matching department ids.", role: "HR analyst",
    context: "The local-team list is people who report to a manager in their own department.",
    task: "Return employee and manager. Sort by employee.",
    requiredOutput: ["Columns: employee, manager", "Sorted by employee"],
    rules: ["department_id values must be equal"], success: "Cross-department reporting lines are excluded.",
    orderMatters: true,
    hints: ["WHERE e.department_id = m.department_id.", "SELECT e.last_name AS employee, m.last_name AS manager FROM employees e JOIN employees m ON m.id = e.manager_id WHERE e.department_id = m.department_id ORDER BY employee;"],
    solutionSql: `SELECT e.last_name AS employee, m.last_name AS manager
FROM employees e JOIN employees m ON m.id = e.manager_id
WHERE e.department_id = m.department_id ORDER BY employee;`,
    tablesUsed: ["employees"], concept: "self comparison",
  }),
  q({
    id: "self-11", topicId: "self-joins", difficulty: "hard", title: "Two-level name chain",
    summary: "Show manager and skip-level, keeping blanks.", role: "People partner",
    context: "The chain export keeps everyone. Missing levels stay null.",
    task: "Return employee, manager, and skip_level for every employee. Sort by employee.",
    requiredOutput: ["Columns: employee, manager, skip_level", "Nulls stay null", "Sorted by employee"],
    rules: ["Left join both levels"], success: "All 12 employees appear.",
    orderMatters: true,
    hints: ["LEFT JOIN the manager, then LEFT JOIN the skip-level from the manager.", "SELECT e.last_name AS employee, m.last_name AS manager, s.last_name AS skip_level FROM employees e LEFT JOIN employees m ON m.id = e.manager_id LEFT JOIN employees s ON s.id = m.manager_id ORDER BY employee;"],
    solutionSql: `SELECT e.last_name AS employee, m.last_name AS manager, s.last_name AS skip_level
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
LEFT JOIN employees s ON s.id = m.manager_id
ORDER BY employee;`,
    tablesUsed: ["employees"], concept: "left self join",
  }),
  q({
    id: "self-12", topicId: "self-joins", difficulty: "hard", title: "Managers of managers",
    summary: "A manager whose report is also a manager.", role: "Workforce analyst",
    context: "Leadership depth is a person who manages someone that also has direct reports.",
    task: "Return manager, the family name, once for each such person. Sort by manager.",
    requiredOutput: ["Column: manager", "Distinct names", "Sorted by manager"],
    rules: ["The report's id appears as someone else's manager_id"], success: "Only managers of managers remain.",
    orderMatters: true,
    hints: ["Join the report to their boss, and require the report to be a manager.", "SELECT DISTINCT boss.last_name AS manager FROM employees report JOIN employees boss ON boss.id = report.manager_id WHERE report.id IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL) ORDER BY manager;"],
    solutionSql: `SELECT DISTINCT boss.last_name AS manager
FROM employees report
JOIN employees boss ON boss.id = report.manager_id
WHERE report.id IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL)
ORDER BY manager;`,
    tablesUsed: ["employees"], concept: "manager of managers",
  }),
  q({
    id: "self-13", topicId: "self-joins", difficulty: "hard", title: "Manager pay versus the team",
    summary: "Average report salary beside the manager.", role: "Finance analyst",
    context: "A fairness check places each manager's salary next to the average salary of their direct reports.",
    task: "Return manager, manager_salary, and avg_report_salary rounded to 2 decimals. Sort by manager.",
    requiredOutput: ["Columns: manager, manager_salary, avg_report_salary", "Sorted by manager"],
    rules: ["Group by the manager"], success: "Each manager appears once.",
    orderMatters: true,
    hints: ["SELECT m.last_name AS manager, m.salary AS manager_salary, ROUND(AVG(e.salary), 2) AS avg_report_salary FROM employees e JOIN employees m ON m.id = e.manager_id GROUP BY m.id, m.last_name, m.salary ORDER BY manager;"],
    solutionSql: `SELECT m.last_name AS manager, m.salary AS manager_salary, ROUND(AVG(e.salary), 2) AS avg_report_salary
FROM employees e JOIN employees m ON m.id = e.manager_id
GROUP BY m.id, m.last_name, m.salary ORDER BY manager;`,
    tablesUsed: ["employees"], concept: "aggregate self join",
  }),
  q({
    id: "self-14", topicId: "self-joins", difficulty: "hard", title: "Hired more than three years later",
    summary: "A date gap up the reporting line.", role: "Workforce analyst",
    context: "Treat a gap above 3 years, using 365.25 days, as a long gap between a person and their manager.",
    task: "Return employee, manager, and gap_days as a whole number of days. Keep gaps strictly greater than 3 * 365.25 days. Sort by gap_days descending.",
    requiredOutput: ["Columns: employee, manager, gap_days", "Sorted by gap_days DESC"],
    rules: ["Use julianday"], success: "Shorter gaps are excluded.",
    orderMatters: true,
    hints: ["julianday(employee) - julianday(manager).", "SELECT e.last_name AS employee, m.last_name AS manager, CAST(julianday(e.hire_date) - julianday(m.hire_date) AS INTEGER) AS gap_days FROM employees e JOIN employees m ON m.id = e.manager_id WHERE julianday(e.hire_date) - julianday(m.hire_date) > 365.25 * 3 ORDER BY gap_days DESC;"],
    solutionSql: `SELECT e.last_name AS employee, m.last_name AS manager,
  CAST(julianday(e.hire_date) - julianday(m.hire_date) AS INTEGER) AS gap_days
FROM employees e JOIN employees m ON m.id = e.manager_id
WHERE julianday(e.hire_date) - julianday(m.hire_date) > 365.25 * 3
ORDER BY gap_days DESC;`,
    tablesUsed: ["employees"], concept: "self join dates",
  }),
  q({
    id: "self-15", topicId: "self-joins", difficulty: "hard", title: "Depth in the tree",
    summary: "0, 1, or 2 based on managers above.", role: "People partner",
    context: "Depth 0 has no manager, depth 1 reports to a depth-0 manager, and depth 2 reports to someone who themselves has a manager.",
    task: "Return last_name and depth for every employee. Sort by depth, then last_name.",
    requiredOutput: ["Columns: last_name, depth", "Sorted by depth, last_name"],
    rules: ["Left join one level", "CASE on whether each manager id is null"], success: "Depths are only 0, 1, or 2.",
    orderMatters: true,
    hints: ["If the employee has no manager, depth is 0. If the manager has no manager, depth is 1. Otherwise 2.", "SELECT e.last_name, CASE WHEN e.manager_id IS NULL THEN 0 WHEN m.manager_id IS NULL THEN 1 ELSE 2 END AS depth FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ORDER BY depth, e.last_name;"],
    solutionSql: `SELECT e.last_name,
  CASE WHEN e.manager_id IS NULL THEN 0 WHEN m.manager_id IS NULL THEN 1 ELSE 2 END AS depth
FROM employees e LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY depth, e.last_name;`,
    tablesUsed: ["employees"], concept: "hierarchy depth",
  }),
  q({
    id: "self-16", topicId: "self-joins", difficulty: "hard", title: "Capstone org card",
    summary: "Department, manager, skip-level, and pay gap.", role: "Data contract owner",
    context: "The org card keeps every employee. Missing managers use a label, and the pay gap versus the manager is null when there is no manager.",
    task: "Return employee, department, manager, skip_level, salary, and delta_vs_manager. employee, manager, and skip_level are full names. manager is No manager when missing, and skip_level is No skip-level when missing. delta_vs_manager is salary minus the manager salary, or null when there is no manager. Sort by department, then employee.",
    requiredOutput: ["Columns in that order", "Labels exactly No manager and No skip-level", "Sorted by department, employee"],
    rules: ["Left join both manager levels", "Join departments for the name"], success: "All employees appear with the labels and sort.",
    orderMatters: true,
    hints: ["COALESCE the name expressions.", "delta is null when m.id is null, otherwise e.salary - m.salary.", "SELECT e.first_name || ' ' || e.last_name AS employee, d.name AS department, COALESCE(m.first_name || ' ' || m.last_name, 'No manager') AS manager, COALESCE(s.first_name || ' ' || s.last_name, 'No skip-level') AS skip_level, e.salary, CASE WHEN m.id IS NULL THEN NULL ELSE e.salary - m.salary END AS delta_vs_manager FROM employees e JOIN departments d ON d.id = e.department_id LEFT JOIN employees m ON m.id = e.manager_id LEFT JOIN employees s ON s.id = m.manager_id ORDER BY department, employee;"],
    solutionSql: `SELECT e.first_name || ' ' || e.last_name AS employee, d.name AS department,
  COALESCE(m.first_name || ' ' || m.last_name, 'No manager') AS manager,
  COALESCE(s.first_name || ' ' || s.last_name, 'No skip-level') AS skip_level,
  e.salary,
  CASE WHEN m.id IS NULL THEN NULL ELSE e.salary - m.salary END AS delta_vs_manager
FROM employees e
JOIN departments d ON d.id = e.department_id
LEFT JOIN employees m ON m.id = e.manager_id
LEFT JOIN employees s ON s.id = m.manager_id
ORDER BY department, employee;`,
    tablesUsed: ["employees", "departments"], concept: "self join capstone",
  }),
];

export const subqueryQuestions = [
  q({
    id: "sub-01", topicId: "subqueries", difficulty: "easy", title: "Above the company average",
    summary: "Compare to a scalar subquery.", role: "Finance analyst",
    context: "A shortlist keeps people paid more than the average salary of the whole company.",
    task: "Return last_name and salary where salary is greater than the company average. Sort by salary descending.",
    requiredOutput: ["Columns: last_name, salary", "Sorted by salary DESC"],
    rules: ["The average is a subquery in WHERE"], success: "Only above-average salaries remain.",
    orderMatters: true,
    hints: ["WHERE salary > (SELECT AVG(salary) FROM employees).", "SELECT last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC;"],
    solutionSql: "SELECT last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC;",
    tablesUsed: ["employees"], concept: "scalar subquery",
  }),
  q({
    id: "sub-02", topicId: "subqueries", difficulty: "easy", title: "People in London",
    summary: "IN a subquery of department ids.", role: "HR analyst",
    context: "The London office list should come from the department location, not a hard-coded department id in the outer query.",
    task: "Return last_name for employees whose department_id is in the set of departments located in London. Sort by last_name.",
    requiredOutput: ["Column: last_name", "Sorted by last_name"],
    rules: ["The location filter lives in the subquery"], success: "Only the London department's people remain.",
    orderMatters: true,
    hints: ["SELECT last_name FROM employees WHERE department_id IN (SELECT id FROM departments WHERE location = 'London') ORDER BY last_name;"],
    solutionSql: "SELECT last_name FROM employees WHERE department_id IN (SELECT id FROM departments WHERE location = 'London') ORDER BY last_name;",
    tablesUsed: ["employees", "departments"], concept: "in subquery",
  }),
  q({
    id: "sub-03", topicId: "subqueries", difficulty: "easy", title: "Anyone with an assignment",
    summary: "EXISTS against the bridge table.", role: "Operations director",
    context: "Staffing wants people who appear at least once in employee_projects.",
    task: "Return last_name for employees who have an assignment. Sort by last_name.",
    requiredOutput: ["Column: last_name", "Sorted by last_name"],
    rules: ["Use EXISTS"], success: "Unassigned people are excluded.",
    orderMatters: true,
    hints: ["EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id).", "SELECT e.last_name FROM employees e WHERE EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id) ORDER BY e.last_name;"],
    solutionSql: `SELECT e.last_name FROM employees e
WHERE EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id)
ORDER BY e.last_name;`,
    tablesUsed: ["employees", "employee_projects"], concept: "exists",
  }),
  q({
    id: "sub-04", topicId: "subqueries", difficulty: "easy", title: "Anyone without an assignment",
    summary: "NOT EXISTS.", role: "People partner",
    context: "The bench list is people with no assignment row.",
    task: "Return last_name for employees with no employee_projects row. Sort by last_name.",
    requiredOutput: ["Column: last_name", "Sorted by last_name"],
    rules: ["Use NOT EXISTS"], success: "Only the bench remains.",
    orderMatters: true,
    hints: ["SELECT e.last_name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id) ORDER BY e.last_name;"],
    solutionSql: `SELECT e.last_name FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id)
ORDER BY e.last_name;`,
    tablesUsed: ["employees", "employee_projects"], concept: "not exists",
  }),
  q({
    id: "sub-05", topicId: "subqueries", difficulty: "medium", title: "Department name from a scalar lookup",
    summary: "Correlated subquery in the select list.", role: "HR analyst",
    context: "A style example looks up the department name with a scalar subquery instead of a join.",
    task: "Return last_name and department. department is a correlated subquery on departments. Sort by last_name.",
    requiredOutput: ["Columns: last_name, department", "Sorted by last_name"],
    rules: ["Do not use JOIN"], success: "Every employee has a department name.",
    orderMatters: true,
    hints: ["SELECT e.last_name, (SELECT d.name FROM departments d WHERE d.id = e.department_id) AS department FROM employees e ORDER BY e.last_name;"],
    solutionSql: `SELECT e.last_name, (SELECT d.name FROM departments d WHERE d.id = e.department_id) AS department
FROM employees e ORDER BY e.last_name;`,
    tablesUsed: ["employees", "departments"], concept: "scalar correlated",
  }),
  q({
    id: "sub-06", topicId: "subqueries", difficulty: "medium", title: "Above the department average",
    summary: "Correlated comparison.", role: "Finance analyst",
    context: "Inside each department, keep people paid more than that department's own average.",
    task: "Return last_name, department_id, and salary. Sort by department_id, salary descending.",
    requiredOutput: ["Columns: last_name, department_id, salary", "That sort"],
    rules: ["The subquery references the outer department_id"], success: "Each kept salary beats its own department average.",
    orderMatters: true,
    hints: ["WHERE e.salary > (SELECT AVG(salary) FROM employees i WHERE i.department_id = e.department_id).", "SELECT last_name, department_id, salary FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM employees i WHERE i.department_id = e.department_id) ORDER BY department_id, salary DESC;"],
    solutionSql: `SELECT last_name, department_id, salary FROM employees e
WHERE e.salary > (SELECT AVG(salary) FROM employees i WHERE i.department_id = e.department_id)
ORDER BY department_id, salary DESC;`,
    tablesUsed: ["employees"], concept: "correlated filter",
  }),
  q({
    id: "sub-07", topicId: "subqueries", difficulty: "medium", title: "Departments above the company average",
    summary: "Compare a grouped scalar to a company scalar.", role: "Workforce analyst",
    context: "Which departments have an average salary above the company average?",
    task: "Return department for those departments. Sort by department.",
    requiredOutput: ["Column: department", "Sorted by department"],
    rules: ["Two scalar subqueries, one of them correlated"], success: "Only hotter-than-average departments remain.",
    orderMatters: true,
    hints: ["SELECT d.name AS department FROM departments d WHERE (SELECT AVG(salary) FROM employees e WHERE e.department_id = d.id) > (SELECT AVG(salary) FROM employees) ORDER BY department;"],
    solutionSql: `SELECT d.name AS department FROM departments d
WHERE (SELECT AVG(salary) FROM employees e WHERE e.department_id = d.id) > (SELECT AVG(salary) FROM employees)
ORDER BY department;`,
    tablesUsed: ["departments", "employees"], concept: "nested scalars",
  }),
  q({
    id: "sub-08", topicId: "subqueries", difficulty: "medium", title: "Projects with nobody on them",
    summary: "NOT EXISTS from projects.", role: "Operations director",
    context: "Portfolio wants projects that have no assignment.",
    task: "Return project. Sort by project.",
    requiredOutput: ["Column: project", "Sorted by project"],
    rules: ["NOT EXISTS against employee_projects"], success: "Only unstaffed projects remain.",
    orderMatters: true,
    hints: ["SELECT p.name AS project FROM projects p WHERE NOT EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.project_id = p.id) ORDER BY project;"],
    solutionSql: `SELECT p.name AS project FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM employee_projects ep WHERE ep.project_id = p.id)
ORDER BY project;`,
    tablesUsed: ["projects", "employee_projects"], concept: "not exists",
  }),
  q({
    id: "sub-09", topicId: "subqueries", difficulty: "medium", title: "Helping another department",
    summary: "EXISTS a cross-department assignment.", role: "Operations director",
    context: "Name the people who have at least one assignment owned by a different department.",
    task: "Return last_name once for each such person. Sort by last_name.",
    requiredOutput: ["Column: last_name", "Distinct people", "Sorted by last_name"],
    rules: ["EXISTS, then DISTINCT or GROUP BY"], success: "Each loaned person appears once.",
    orderMatters: true,
    hints: ["SELECT DISTINCT e.last_name FROM employees e WHERE EXISTS (SELECT 1 FROM employee_projects ep JOIN projects p ON p.id = ep.project_id WHERE ep.employee_id = e.id AND p.department_id <> e.department_id) ORDER BY e.last_name;"],
    solutionSql: `SELECT DISTINCT e.last_name FROM employees e
WHERE EXISTS (
  SELECT 1 FROM employee_projects ep
  JOIN projects p ON p.id = ep.project_id
  WHERE ep.employee_id = e.id AND p.department_id <> e.department_id
) ORDER BY e.last_name;`,
    tablesUsed: ["employees", "employee_projects", "projects"], concept: "exists join",
  }),
  q({
    id: "sub-10", topicId: "subqueries", difficulty: "hard", title: "Second highest salary",
    summary: "Max below the max.", role: "Payroll partner",
    context: "Find the salary that is the maximum among salaries strictly below the maximum, and the people who earn it.",
    task: "Return last_name and salary for that second maximum. Sort by last_name.",
    requiredOutput: ["Columns: last_name, salary", "Sorted by last_name"],
    rules: ["Do not use LIMIT", "Use nested scalar subqueries"], success: "The top salary is excluded.",
    orderMatters: true,
    hints: ["WHERE salary = (SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)).", "SELECT last_name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)) ORDER BY last_name;"],
    solutionSql: `SELECT last_name, salary FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees))
ORDER BY last_name;`,
    tablesUsed: ["employees"], concept: "nested aggregate",
  }),
  q({
    id: "sub-11", topicId: "subqueries", difficulty: "hard", title: "Latest salary version",
    summary: "Match the max effective date per person.", role: "Payroll partner",
    context: "The current pay extract is the history row whose date is the latest for that employee.",
    task: "Return last_name, effective_date, and salary for those current rows. Sort by last_name.",
    requiredOutput: ["Columns: last_name, effective_date, salary", "Sorted by last_name"],
    rules: ["A correlated subquery finds MAX(effective_date)"], success: "Earlier versions are excluded.",
    orderMatters: true,
    hints: ["WHERE s.effective_date = (SELECT MAX(effective_date) FROM salaries_history h WHERE h.employee_id = s.employee_id).", "SELECT e.last_name, s.effective_date, s.salary FROM salaries_history s JOIN employees e ON e.id = s.employee_id WHERE s.effective_date = (SELECT MAX(h.effective_date) FROM salaries_history h WHERE h.employee_id = s.employee_id) ORDER BY e.last_name;"],
    solutionSql: `SELECT e.last_name, s.effective_date, s.salary
FROM salaries_history s
JOIN employees e ON e.id = s.employee_id
WHERE s.effective_date = (
  SELECT MAX(h.effective_date) FROM salaries_history h WHERE h.employee_id = s.employee_id
)
ORDER BY e.last_name;`,
    tablesUsed: ["salaries_history", "employees"], concept: "correlated max",
  }),
  q({
    id: "sub-12", topicId: "subqueries", difficulty: "hard", title: "Capstone above the department mean",
    summary: "Show the department average beside the person.", role: "Data contract owner",
    context: "The exception list shows people above their department average, with that average rounded to cents.",
    task: "Return last_name, department, salary, and dept_avg. dept_avg is the department average salary rounded to 2 decimals. Keep salary greater than the unrounded department average. Sort by department, then salary descending.",
    requiredOutput: ["Columns: last_name, department, salary, dept_avg", "That sort"],
    rules: ["The average can come from a derived table", "Do not round before the comparison"], success: "dept_avg repeats inside a department and only higher salaries remain.",
    orderMatters: true,
    hints: ["Join a grouped subquery of averages.", "SELECT e.last_name, d.name AS department, e.salary, ROUND(a.avg_salary, 2) AS dept_avg FROM employees e JOIN departments d ON d.id = e.department_id JOIN (SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id) a ON a.department_id = e.department_id WHERE e.salary > a.avg_salary ORDER BY department, e.salary DESC;"],
    solutionSql: `SELECT e.last_name, d.name AS department, e.salary, ROUND(a.avg_salary, 2) AS dept_avg
FROM employees e
JOIN departments d ON d.id = e.department_id
JOIN (
  SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id
) a ON a.department_id = e.department_id
WHERE e.salary > a.avg_salary
ORDER BY department, e.salary DESC;`,
    tablesUsed: ["employees", "departments"], concept: "subquery capstone",
  }),
];

export const dmlQuestions = [
  q({
    id: "dml-01", topicId: "dml", difficulty: "easy", title: "Open a Legal department",
    summary: "Insert one department.", role: "HR analyst",
    context: "Legal is opening in Oslo as department 6. The checker reads departments after your statement.",
    task: "Insert a departments row: id 6, name Legal, location Oslo.",
    requiredOutput: ["The departments table afterwards, ordered by id", "The new row is present and existing rows are unchanged"],
    rules: ["One INSERT", "Name the columns"], success: "Legal appears as id 6.",
    hints: ["INSERT INTO departments (id, name, location) VALUES (6, 'Legal', 'Oslo');"],
    solutionSql: "INSERT INTO departments (id, name, location) VALUES (6, 'Legal', 'Oslo');",
    checkSql: "SELECT id, name, location FROM departments ORDER BY id;",
    orderMatters: true, tablesUsed: ["departments"], concept: "insert",
  }),
  q({
    id: "dml-02", topicId: "dml", difficulty: "easy", title: "Add a coordinator title",
    summary: "Insert one job.", role: "People partner",
    context: "A coordinator band is being added. The checker reads jobs ordered by id.",
    task: "Insert jobs id 5, title Coordinator, min_salary 40000, max_salary 60000.",
    requiredOutput: ["jobs afterwards, ordered by id"],
    rules: ["One INSERT"], success: "Coordinator is id 5.",
    hints: ["INSERT INTO jobs (id, title, min_salary, max_salary) VALUES (5, 'Coordinator', 40000, 60000);"],
    solutionSql: "INSERT INTO jobs (id, title, min_salary, max_salary) VALUES (5, 'Coordinator', 40000, 60000);",
    checkSql: "SELECT id, title, min_salary, max_salary FROM jobs ORDER BY id;",
    orderMatters: true, tablesUsed: ["jobs"], concept: "insert",
  }),
  q({
    id: "dml-03", topicId: "dml", difficulty: "easy", title: "Correct one salary",
    summary: "Update a single employee.", role: "Payroll partner",
    context: "Rowan Blake's salary should be 50000. The checker reads that one id.",
    task: "Set salary to 50000 where id is 12.",
    requiredOutput: ["id and salary for employee 12"],
    rules: ["WHERE must target id 12"], success: "Only that salary changes.",
    hints: ["UPDATE employees SET salary = 50000 WHERE id = 12;"],
    solutionSql: "UPDATE employees SET salary = 50000 WHERE id = 12;",
    checkSql: "SELECT id, salary FROM employees WHERE id = 12;",
    tablesUsed: ["employees"], concept: "update",
  }),
  q({
    id: "dml-04", topicId: "dml", difficulty: "easy", title: "Set a missing rate to zero",
    summary: "Update one null bonus.", role: "Payroll partner",
    context: "Rowan Blake's missing bonus rate should be stored as 0. The checker reads that row.",
    task: "Set bonus_pct to 0 where id is 12.",
    requiredOutput: ["id and bonus_pct for employee 12"],
    rules: ["Do not update other people"], success: "The rate is 0.",
    hints: ["UPDATE employees SET bonus_pct = 0 WHERE id = 12;"],
    solutionSql: "UPDATE employees SET bonus_pct = 0 WHERE id = 12;",
    checkSql: "SELECT id, bonus_pct FROM employees WHERE id = 12;",
    tablesUsed: ["employees"], concept: "update",
  }),
  q({
    id: "dml-05", topicId: "dml", difficulty: "medium", title: "Remove the unstaffed project",
    summary: "Delete one project.", role: "Operations director",
    context: "Archive migration, project 6, has no staff and should leave the portfolio. The checker reads the remaining projects.",
    task: "Delete the projects row whose id is 6.",
    requiredOutput: ["Remaining projects ordered by id", "Id 6 is gone"],
    rules: ["Do not delete any other project"], success: "Five projects remain.",
    hints: ["DELETE FROM projects WHERE id = 6;"],
    solutionSql: "DELETE FROM projects WHERE id = 6;",
    checkSql: "SELECT id, name FROM projects ORDER BY id;",
    orderMatters: true, tablesUsed: ["projects"], concept: "delete",
  }),
  q({
    id: "dml-06", topicId: "dml", difficulty: "medium", title: "Open the retention pilot",
    summary: "Insert a project.", role: "Operations director",
    context: "People is starting Retention pilot on 15 January 2025 with a 45000 budget. The checker reads projects ordered by id.",
    task: "Insert projects id 7, name Retention pilot, department_id 1, budget 45000, start_date 2025-01-15.",
    requiredOutput: ["projects afterwards, ordered by id"],
    rules: ["One INSERT"], success: "Id 7 is the new project.",
    hints: ["INSERT INTO projects (id, name, department_id, budget, start_date) VALUES (7, 'Retention pilot', 1, 45000, '2025-01-15');"],
    solutionSql: "INSERT INTO projects (id, name, department_id, budget, start_date) VALUES (7, 'Retention pilot', 1, 45000, '2025-01-15');",
    checkSql: "SELECT id, name, department_id, budget, start_date FROM projects ORDER BY id;",
    orderMatters: true, tablesUsed: ["projects"], concept: "insert",
  }),
  q({
    id: "dml-07", topicId: "dml", difficulty: "medium", title: "Fill a missing budget with zero",
    summary: "Update null budgets.", role: "Finance analyst",
    context: "Any project that still has a null budget should store 0. The checker reads every project budget.",
    task: "Set budget to 0 where budget is null.",
    requiredOutput: ["id, name, and budget for every project, ordered by id", "No null budgets remain"],
    rules: ["Only null budgets change"], success: "Lab notebook's budget is 0.",
    hints: ["UPDATE projects SET budget = 0 WHERE budget IS NULL;"],
    solutionSql: "UPDATE projects SET budget = 0 WHERE budget IS NULL;",
    checkSql: "SELECT id, name, budget FROM projects ORDER BY id;",
    orderMatters: true, tablesUsed: ["projects"], concept: "update nulls",
  }),
  q({
    id: "dml-08", topicId: "dml", difficulty: "medium", title: "Drop tiny assignments",
    summary: "Delete hours under 10.", role: "Operations director",
    context: "Assignments under 10 hours are being cleared. The checker reads the bridge table.",
    task: "Delete employee_projects rows where hours is less than 10.",
    requiredOutput: ["employee_id, project_id, and hours for the rows that remain, ordered by employee_id, project_id"],
    rules: ["Do not delete hours of 10 or more"], success: "Only the short assignments disappear.",
    hints: ["DELETE FROM employee_projects WHERE hours < 10;"],
    solutionSql: "DELETE FROM employee_projects WHERE hours < 10;",
    checkSql: "SELECT employee_id, project_id, hours FROM employee_projects ORDER BY employee_id, project_id;",
    orderMatters: true, tablesUsed: ["employee_projects"], concept: "delete",
  }),
  q({
    id: "dml-09", topicId: "dml", difficulty: "hard", title: "Give engineers a default rate",
    summary: "Update a filtered set of null bonuses.", role: "Payroll partner",
    context: "Engineers, job_id 2, who have no bonus rate should receive 0.10. Other missing rates stay missing. The checker reads every id and rate.",
    task: "Set bonus_pct to 0.10 where bonus_pct is null and job_id is 2.",
    requiredOutput: ["id and bonus_pct for every employee, ordered by id"],
    rules: ["Do not change rates that are already stored", "Do not change non-engineers"], success: "Only the targeted nulls become 0.10.",
    hints: ["UPDATE employees SET bonus_pct = 0.10 WHERE bonus_pct IS NULL AND job_id = 2;"],
    solutionSql: "UPDATE employees SET bonus_pct = 0.10 WHERE bonus_pct IS NULL AND job_id = 2;",
    checkSql: "SELECT id, bonus_pct FROM employees ORDER BY id;",
    orderMatters: true, tablesUsed: ["employees"], concept: "filtered update",
  }),
  q({
    id: "dml-10", topicId: "dml", difficulty: "hard", title: "Capstone staff the archive",
    summary: "Insert an assignment and raise the budget.", role: "Data contract owner",
    context: "Rowan Blake joins Archive migration, project 6, as Analyst for 16 hours, and that project's budget increases by 5000. The checker reads project 6 afterwards.",
    task: "Insert employee_projects (employee_id 12, project_id 6, role Analyst, hours 16). Then add 5000 to the budget of project 6, treating a null budget as 0 before adding.",
    requiredOutput: ["id, name, budget, employee_id, role, and hours for project 6 after both changes"],
    rules: ["Both statements are required", "Do not change other projects"], success: "Project 6 shows the new budget and Rowan's assignment.",
    hints: ["INSERT first, then UPDATE.", "INSERT INTO employee_projects (employee_id, project_id, role, hours) VALUES (12, 6, 'Analyst', 16); UPDATE projects SET budget = COALESCE(budget, 0) + 5000 WHERE id = 6;"],
    solutionSql: `INSERT INTO employee_projects (employee_id, project_id, role, hours) VALUES (12, 6, 'Analyst', 16);
UPDATE projects SET budget = COALESCE(budget, 0) + 5000 WHERE id = 6;`,
    checkSql: `SELECT p.id, p.name, p.budget, ep.employee_id, ep.role, ep.hours
FROM projects p
LEFT JOIN employee_projects ep ON ep.project_id = p.id AND ep.employee_id = 12
WHERE p.id = 6;`,
    tablesUsed: ["projects", "employee_projects"], concept: "dml capstone",
  }),
];
