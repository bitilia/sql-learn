import { q } from "../types";

export const joinQuestions = [
  q({
    id: "join-01",
    topicId: "joins",
    difficulty: "easy",
    title: "Who sits in which team",
    summary: "Join employees to departments.",
    role: "HR analyst",
    context: "A welcome pack needs each person's family name next to their department name.",
    task: "Return last_name and department (the departments.name) for every employee.",
    requiredOutput: ["Columns: last_name, department", "One row per employee"],
    rules: ["Join employees to departments on department_id", "Do not drop unmatched names. Everyone has a department."],
    success: "Every employee appears with a department name.",
    hints: [
      "The shared key is employees.department_id and departments.id.",
      "Alias departments.name so it does not collide with a person name.",
      "SELECT e.last_name, d.name AS department FROM employees e JOIN departments d ON d.id = e.department_id;",
    ],
    solutionSql: `SELECT e.last_name, d.name AS department
FROM employees e
JOIN departments d ON d.id = e.department_id;`,
    tablesUsed: ["employees", "departments"],
    concept: "inner join",
  }),
  q({
    id: "join-02",
    topicId: "joins",
    difficulty: "easy",
    title: "Titles beside names",
    summary: "Join employees to jobs.",
    role: "People partner",
    context: "Recruiting wants family names with the job title, not the numeric job id.",
    task: "Return last_name and job_title from the jobs table.",
    requiredOutput: ["Columns: last_name, job_title"],
    rules: ["Join on job_id", "Use the title, not the id, in the output"],
    success: "Each employee has a readable job title.",
    hints: [
      "jobs.id matches employees.job_id.",
      "Alias jobs.title as job_title.",
      "SELECT e.last_name, j.title AS job_title FROM employees e JOIN jobs j ON j.id = e.job_id;",
    ],
    solutionSql: `SELECT e.last_name, j.title AS job_title
FROM employees e
JOIN jobs j ON j.id = e.job_id;`,
    tablesUsed: ["employees", "jobs"],
    concept: "inner join",
  }),
  q({
    id: "join-03",
    topicId: "joins",
    difficulty: "easy",
    title: "Department and title",
    summary: "Join employees to two lookup tables.",
    role: "HR analyst",
    context: "The org chart export needs both the department name and the job title on the same row.",
    task: "Return last_name, department, and job_title.",
    requiredOutput: ["Columns: last_name, department, job_title"],
    rules: ["Use two joins", "Do not filter"],
    success: "Each person has both labels.",
    hints: [
      "Join departments and jobs separately. Both start from employees.",
      "Alias both name-like columns.",
      "SELECT e.last_name, d.name AS department, j.title AS job_title FROM employees e JOIN departments d ON d.id = e.department_id JOIN jobs j ON j.id = e.job_id;",
    ],
    solutionSql: `SELECT e.last_name, d.name AS department, j.title AS job_title
FROM employees e
JOIN departments d ON d.id = e.department_id
JOIN jobs j ON j.id = e.job_id;`,
    tablesUsed: ["employees", "departments", "jobs"],
    concept: "multi-join",
  }),
  q({
    id: "join-04",
    topicId: "joins",
    difficulty: "easy",
    title: "Which team owns the work",
    summary: "Join projects to departments.",
    role: "Operations director",
    context: "Portfolio review lists projects by the department that owns them.",
    task: "Return project and department for every project.",
    requiredOutput: ["Columns: project, department", "All six projects"],
    rules: ["projects.department_id references departments.id"],
    success: "Every project shows its owning department.",
    hints: [
      "Start from projects if the project is the subject.",
      "Alias projects.name as project.",
      "SELECT p.name AS project, d.name AS department FROM projects p JOIN departments d ON d.id = p.department_id;",
    ],
    solutionSql: `SELECT p.name AS project, d.name AS department
FROM projects p
JOIN departments d ON d.id = p.department_id;`,
    tablesUsed: ["projects", "departments"],
    concept: "inner join",
  }),
  q({
    id: "join-05",
    topicId: "joins",
    difficulty: "easy",
    title: "Hours on each assignment",
    summary: "Join the assignment bridge to both parents.",
    role: "Operations director",
    context: "Staffing wants a flat list of who spent hours on which project.",
    task: "Return last_name, project, and hours for every assignment.",
    requiredOutput: ["Columns: last_name, project, hours", "One row per assignment"],
    rules: ["Go through employee_projects", "Do not total the hours"],
    success: "Each assignment is its own row.",
    hints: [
      "employee_projects is the bridge between people and projects.",
      "Join it to both parent tables.",
      "SELECT e.last_name, p.name AS project, ep.hours FROM employee_projects ep JOIN employees e ON e.id = ep.employee_id JOIN projects p ON p.id = ep.project_id;",
    ],
    solutionSql: `SELECT e.last_name, p.name AS project, ep.hours
FROM employee_projects ep
JOIN employees e ON e.id = ep.employee_id
JOIN projects p ON p.id = ep.project_id;`,
    tablesUsed: ["employee_projects", "employees", "projects"],
    concept: "bridge table",
  }),
  q({
    id: "join-06",
    topicId: "joins",
    difficulty: "medium",
    title: "Keep people without a project",
    summary: "Left join assignments.",
    role: "People partner",
    context: "A coverage report must still list people who have not been staffed. Their project cell will be empty.",
    task: "Return last_name and project for every employee. If someone has several projects, show each one. If someone has none, keep them with a null project.",
    requiredOutput: ["Columns: last_name, project", "Unassigned people appear once with a null project", "People with several projects appear once per project"],
    rules: ["Use LEFT JOIN from employees", "Do not turn the null into a word"],
    success: "Rowan Blake appears with a null project, and multi-project people repeat.",
    hints: [
      "An inner join drops employees who have no assignment.",
      "Left join employees to the bridge, then to projects.",
      "SELECT e.last_name, p.name AS project FROM employees e LEFT JOIN employee_projects ep ON ep.employee_id = e.id LEFT JOIN projects p ON p.id = ep.project_id;",
    ],
    solutionSql: `SELECT e.last_name, p.name AS project
FROM employees e
LEFT JOIN employee_projects ep ON ep.employee_id = e.id
LEFT JOIN projects p ON p.id = ep.project_id;`,
    tablesUsed: ["employees", "employee_projects", "projects"],
    concept: "left join",
  }),
  q({
    id: "join-07",
    topicId: "joins",
    difficulty: "medium",
    title: "Unassigned people",
    summary: "Filter a left join to the misses.",
    role: "People partner",
    context: "Staffing only wants the people who are not on any project yet.",
    task: "Return last_name for employees with no row in employee_projects.",
    requiredOutput: ["Column: last_name", "Only people who have no assignment"],
    rules: ["Left join, then keep rows where the assignment key is null", "Do not use a subquery"],
    success: "Only unassigned employees remain.",
    hints: [
      "After a left join, unmatched rows have nulls on the right side.",
      "Test the bridge key, not the person's id.",
      "SELECT e.last_name FROM employees e LEFT JOIN employee_projects ep ON ep.employee_id = e.id WHERE ep.employee_id IS NULL;",
    ],
    solutionSql: `SELECT e.last_name
FROM employees e
LEFT JOIN employee_projects ep ON ep.employee_id = e.id
WHERE ep.employee_id IS NULL;`,
    tablesUsed: ["employees", "employee_projects"],
    concept: "anti-join",
  }),
  q({
    id: "join-08",
    topicId: "joins",
    difficulty: "medium",
    title: "Projects nobody joined",
    summary: "Find projects with no assignments.",
    role: "Operations director",
    context: "Portfolio review flags work that has a record but no staff.",
    task: "Return project for projects that have no employee_projects rows.",
    requiredOutput: ["Column: project", "Only unstaffed projects"],
    rules: ["Left join from projects", "Keep null matches"],
    success: "Archive migration is the unstaffed project.",
    hints: [
      "Start from projects so unstaffed work is not dropped.",
      "WHERE the assignment's project_id IS NULL.",
      "SELECT p.name AS project FROM projects p LEFT JOIN employee_projects ep ON ep.project_id = p.id WHERE ep.project_id IS NULL;",
    ],
    solutionSql: `SELECT p.name AS project
FROM projects p
LEFT JOIN employee_projects ep ON ep.project_id = p.id
WHERE ep.project_id IS NULL;`,
    tablesUsed: ["projects", "employee_projects"],
    concept: "anti-join",
  }),
  q({
    id: "join-09",
    topicId: "joins",
    difficulty: "medium",
    title: "Headcount by department",
    summary: "Count employees after a left join.",
    role: "Workforce analyst",
    context: "Planning wants a headcount for every department, including any that might have nobody in them.",
    task: "Return department and headcount. Departments with no employees would show 0. Sort by department.",
    requiredOutput: ["Columns: department, headcount", "Sorted by department name", "COUNT must ignore the null side of a left join"],
    rules: ["Left join departments to employees", "COUNT(e.id), not COUNT(*)"],
    success: "Each department appears once with its headcount.",
    orderMatters: true,
    hints: [
      "COUNT(*) would count the empty department row as a person.",
      "COUNT(employee id) skips the null-padded row.",
      "SELECT d.name AS department, COUNT(e.id) AS headcount FROM departments d LEFT JOIN employees e ON e.department_id = d.id GROUP BY d.id, d.name ORDER BY department;",
    ],
    solutionSql: `SELECT d.name AS department, COUNT(e.id) AS headcount
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name
ORDER BY department;`,
    tablesUsed: ["departments", "employees"],
    concept: "left join aggregate",
  }),
  q({
    id: "join-10",
    topicId: "joins",
    difficulty: "medium",
    title: "Pay history with names",
    summary: "Attach history rows to people.",
    role: "Payroll partner",
    context: "Audit wants every stored salary change labeled with a family name.",
    task: "Return last_name, effective_date, and salary from salaries_history.",
    requiredOutput: ["Columns: last_name, effective_date, salary", "One row per history record"],
    rules: ["Join salaries_history to employees", "Do not collapse multiple changes"],
    success: "Every history row is readable by name.",
    hints: [
      "salaries_history.employee_id points at employees.id.",
      "People with two changes appear twice.",
      "SELECT e.last_name, s.effective_date, s.salary FROM salaries_history s JOIN employees e ON e.id = s.employee_id;",
    ],
    solutionSql: `SELECT e.last_name, s.effective_date, s.salary
FROM salaries_history s
JOIN employees e ON e.id = s.employee_id;`,
    tablesUsed: ["salaries_history", "employees"],
    concept: "inner join",
  }),
  q({
    id: "join-11",
    topicId: "joins",
    difficulty: "medium",
    title: "Hours booked on each project",
    summary: "Sum hours and keep empty projects.",
    role: "Operations director",
    context: "Delivery wants total hours per project, and projects with no time booked should show zero.",
    task: "Return project and total_hours. Sort by project name.",
    requiredOutput: ["Columns: project, total_hours", "Unstaffed projects show 0", "Sorted by project"],
    rules: ["Left join so empty projects remain", "COALESCE the sum"],
    success: "Archive migration shows 0 hours and the others show their totals.",
    orderMatters: true,
    hints: [
      "SUM of a null group is null. Wrap it.",
      "Group by the project, not by the assignment.",
      "SELECT p.name AS project, COALESCE(SUM(ep.hours), 0) AS total_hours FROM projects p LEFT JOIN employee_projects ep ON ep.project_id = p.id GROUP BY p.id, p.name ORDER BY project;",
    ],
    solutionSql: `SELECT p.name AS project, COALESCE(SUM(ep.hours), 0) AS total_hours
FROM projects p
LEFT JOIN employee_projects ep ON ep.project_id = p.id
GROUP BY p.id, p.name
ORDER BY project;`,
    tablesUsed: ["projects", "employee_projects"],
    concept: "left join aggregate",
  }),
  q({
    id: "join-12",
    topicId: "joins",
    difficulty: "medium",
    title: "Cities, including a blank",
    summary: "Keep a null location from the parent row.",
    role: "HR analyst",
    context: "Research has a department row but no city. Those people still belong on the location list.",
    task: "Return last_name and location for every employee. Leave location null when the department has none.",
    requiredOutput: ["Columns: last_name, location", "Null locations stay null"],
    rules: ["Join employees to departments", "Do not filter out null locations"],
    success: "Research staff appear with a null location.",
    hints: [
      "The department row exists, so an inner join still keeps the person.",
      "Do not add WHERE location IS NOT NULL.",
      "SELECT e.last_name, d.location FROM employees e JOIN departments d ON d.id = e.department_id;",
    ],
    solutionSql: `SELECT e.last_name, d.location
FROM employees e
JOIN departments d ON d.id = e.department_id;`,
    tablesUsed: ["employees", "departments"],
    concept: "nulls in a join",
  }),
  q({
    id: "join-13",
    topicId: "joins",
    difficulty: "hard",
    title: "Loaned across departments",
    summary: "Compare a person's department with the project's.",
    role: "Operations director",
    context: "Finance wants the assignments where someone is helping a project owned by another department.",
    task: "Return last_name, home_department, project, and project_department for assignments where those two departments differ. Sort by last_name, then project.",
    requiredOutput: [
      "Columns: last_name, home_department, project, project_department",
      "Only cross-department assignments",
      "Sorted by last_name, then project",
    ],
    rules: ["Join employees, both department rows, projects, and the bridge", "Compare department ids, not names"],
    success: "Only cross-staffed assignments remain, in the requested order.",
    orderMatters: true,
    hints: [
      "You need the employee's department and the project's department as two joins to departments.",
      "Give the departments aliases so both names can appear.",
      "SELECT e.last_name, d.name AS home_department, p.name AS project, pd.name AS project_department FROM employees e JOIN departments d ON d.id = e.department_id JOIN employee_projects ep ON ep.employee_id = e.id JOIN projects p ON p.id = ep.project_id JOIN departments pd ON pd.id = p.department_id WHERE p.department_id <> e.department_id ORDER BY e.last_name, project;",
    ],
    solutionSql: `SELECT e.last_name, d.name AS home_department, p.name AS project, pd.name AS project_department
FROM employees e
JOIN departments d ON d.id = e.department_id
JOIN employee_projects ep ON ep.employee_id = e.id
JOIN projects p ON p.id = ep.project_id
JOIN departments pd ON pd.id = p.department_id
WHERE p.department_id <> e.department_id
ORDER BY e.last_name, project;`,
    tablesUsed: ["employees", "departments", "employee_projects", "projects"],
    concept: "join with a mismatch filter",
  }),
  q({
    id: "join-14",
    topicId: "joins",
    difficulty: "hard",
    title: "Hours charged to each department",
    summary: "Roll assignment hours up to the owning department.",
    role: "Finance analyst",
    context: "Finance charges hours to the department that owns the project, not the person's home team.",
    task: "Return department and hours for every department. Departments with no project hours show 0. Sort by department.",
    requiredOutput: ["Columns: department, hours", "Zero when a department has no booked hours", "Sorted by department"],
    rules: ["Sum assignment hours through projects", "Do not multiply hours by joining employees as well"],
    success: "Each department has a single hours total.",
    orderMatters: true,
    hints: [
      "Path: departments to projects to employee_projects.",
      "COALESCE(SUM(hours), 0) turns an empty group into zero.",
      "SELECT d.name AS department, COALESCE(SUM(ep.hours), 0) AS hours FROM departments d LEFT JOIN projects p ON p.department_id = d.id LEFT JOIN employee_projects ep ON ep.project_id = p.id GROUP BY d.id, d.name ORDER BY department;",
    ],
    solutionSql: `SELECT d.name AS department, COALESCE(SUM(ep.hours), 0) AS hours
FROM departments d
LEFT JOIN projects p ON p.department_id = d.id
LEFT JOIN employee_projects ep ON ep.project_id = p.id
GROUP BY d.id, d.name
ORDER BY department;`,
    tablesUsed: ["departments", "projects", "employee_projects"],
    concept: "aggregate across joins",
  }),
  q({
    id: "join-15",
    topicId: "joins",
    difficulty: "hard",
    title: "Payroll by title",
    summary: "Count people and sum salary per job.",
    role: "Payroll partner",
    context: "Compensation wants one row per job title, even if a title had nobody in it.",
    task: "Return job_title, people, and payroll. Sort by job_title.",
    requiredOutput: ["Columns: job_title, people, payroll", "people is a count of employees", "payroll is the sum of salary", "Sorted by job_title"],
    rules: ["Start from jobs so empty titles would remain", "COUNT(e.id)"],
    success: "Each title appears once with its headcount and payroll.",
    orderMatters: true,
    hints: [
      "Left join jobs to employees on job_id.",
      "SUM(salary) is fine here because each employee joins at most once.",
      "SELECT j.title AS job_title, COUNT(e.id) AS people, COALESCE(SUM(e.salary), 0) AS payroll FROM jobs j LEFT JOIN employees e ON e.job_id = j.id GROUP BY j.id, j.title ORDER BY job_title;",
    ],
    solutionSql: `SELECT j.title AS job_title, COUNT(e.id) AS people, COALESCE(SUM(e.salary), 0) AS payroll
FROM jobs j
LEFT JOIN employees e ON e.job_id = j.id
GROUP BY j.id, j.title
ORDER BY job_title;`,
    tablesUsed: ["jobs", "employees"],
    concept: "grouped join",
  }),
  q({
    id: "join-16",
    topicId: "joins",
    difficulty: "hard",
    title: "Capstone staffing card",
    summary: "Combine department, job, manager, and project count.",
    role: "Data contract owner",
    context: "The staffing card is the feed for Monday's review. Column names, the manager fallback, and the sort are all part of the contract.",
    task: "For every employee return last_name, department, job_title, manager_last_name, project_count, and monthly_salary. manager_last_name is the manager's last name, or the word none when there is no manager. project_count is how many assignments they have, including zero. monthly_salary is salary / 12.0 rounded to 2 decimals. Sort by department, then last_name.",
    requiredOutput: [
      "Columns in order: last_name, department, job_title, manager_last_name, project_count, monthly_salary",
      "Unassigned people have project_count 0",
      "People without a manager show none",
      "Sorted by department, then last_name",
    ],
    rules: [
      "Left join the manager and the assignments so nobody is dropped",
      "Count assignment rows, not a multiplied join",
      "Group by the employee attributes you select",
    ],
    success: "The card matches the contract, including zeros, the none label, and sort order.",
    orderMatters: true,
    hints: [
      "Join departments and jobs with inner joins. Left join employees again for the manager.",
      "Left join employee_projects and COUNT the project id so a null assignment counts as zero.",
      "SELECT e.last_name, d.name AS department, j.title AS job_title, COALESCE(m.last_name, 'none') AS manager_last_name, COUNT(ep.project_id) AS project_count, ROUND(e.salary / 12.0, 2) AS monthly_salary FROM employees e JOIN departments d ON d.id = e.department_id JOIN jobs j ON j.id = e.job_id LEFT JOIN employees m ON m.id = e.manager_id LEFT JOIN employee_projects ep ON ep.employee_id = e.id GROUP BY e.id, e.last_name, d.name, j.title, m.last_name, e.salary ORDER BY department, e.last_name;",
    ],
    solutionSql: `SELECT
  e.last_name,
  d.name AS department,
  j.title AS job_title,
  COALESCE(m.last_name, 'none') AS manager_last_name,
  COUNT(ep.project_id) AS project_count,
  ROUND(e.salary / 12.0, 2) AS monthly_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
JOIN jobs j ON j.id = e.job_id
LEFT JOIN employees m ON m.id = e.manager_id
LEFT JOIN employee_projects ep ON ep.employee_id = e.id
GROUP BY e.id, e.last_name, d.name, j.title, m.last_name, e.salary
ORDER BY department, e.last_name;`,
    tablesUsed: ["employees", "departments", "jobs", "employee_projects"],
    concept: "join capstone",
  }),
];
