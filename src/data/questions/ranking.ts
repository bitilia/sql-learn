import { q } from "../types";

const notNull = "WHERE revenue IS NOT NULL";

export const rankingQuestions = [
  q({
    id: "rnk-01", topicId: "ranking", difficulty: "easy", title: "Number every reported month",
    summary: "ROW_NUMBER across all teams.", role: "Finance analyst",
    context: "A flat list numbers reported months from the largest revenue down, with team and period breaking ties.",
    task: "Ignore null revenue. Return team, period, revenue, and rn. rn is ROW_NUMBER ordered by revenue DESC, team, period. Sort the same way.",
    requiredOutput: ["Columns: team, period, revenue, rn", "That sort"],
    rules: ["Include the tie-break columns in the window order"], success: "rn is 1 through the number of reported months.",
    orderMatters: true,
    hints: ["ROW_NUMBER() OVER (ORDER BY revenue DESC, team, period).", "SELECT team, period, revenue, ROW_NUMBER() OVER (ORDER BY revenue DESC, team, period) AS rn FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;"],
    solutionSql: `SELECT team, period, revenue, ROW_NUMBER() OVER (ORDER BY revenue DESC, team, period) AS rn
FROM team_metrics ${notNull} ORDER BY revenue DESC, team, period;`,
    tablesUsed: ["team_metrics"], concept: "row_number",
  }),
  q({
    id: "rnk-02", topicId: "ranking", difficulty: "easy", title: "Rank with gaps",
    summary: "RANK leaves gaps after ties.", role: "Finance analyst",
    context: "Equal revenues should share a rank, and the next distinct revenue should skip ahead.",
    task: "Ignore null revenue. Return team, period, revenue, and revenue_rank using RANK ordered by revenue descending. Sort by revenue DESC, team, period.",
    requiredOutput: ["Columns: team, period, revenue, revenue_rank", "Ties share a rank"],
    rules: ["Do not add a tie-break to the RANK order, or the ties disappear"], success: "Tied revenues share a rank and the next rank skips.",
    orderMatters: true,
    hints: ["RANK() OVER (ORDER BY revenue DESC).", "SELECT team, period, revenue, RANK() OVER (ORDER BY revenue DESC) AS revenue_rank FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;"],
    solutionSql: `SELECT team, period, revenue, RANK() OVER (ORDER BY revenue DESC) AS revenue_rank
FROM team_metrics ${notNull} ORDER BY revenue DESC, team, period;`,
    tablesUsed: ["team_metrics"], concept: "rank",
  }),
  q({
    id: "rnk-03", topicId: "ranking", difficulty: "easy", title: "Dense rank",
    summary: "DENSE_RANK does not leave gaps.", role: "Finance analyst",
    context: "The same tie should share a rank, and the next distinct revenue should be the next integer.",
    task: "Ignore null revenue. Return team, period, revenue, and dense_rank. Sort by revenue DESC, team, period.",
    requiredOutput: ["Columns: team, period, revenue, dense_rank"],
    rules: ["Order the window by revenue DESC only"], success: "The rank after a tie does not skip.",
    orderMatters: true,
    hints: ["DENSE_RANK() OVER (ORDER BY revenue DESC).", "SELECT team, period, revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) AS dense_rank FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;"],
    solutionSql: `SELECT team, period, revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) AS dense_rank
FROM team_metrics ${notNull} ORDER BY revenue DESC, team, period;`,
    tablesUsed: ["team_metrics"], concept: "dense_rank",
  }),
  q({
    id: "rnk-04", topicId: "ranking", difficulty: "medium", title: "Four revenue buckets",
    summary: "NTILE(4) over reported months.", role: "Finance analyst",
    context: "Reported months should be split into four buckets from the largest revenue downward.",
    task: "Ignore null revenue. Return team, period, revenue, and bucket. bucket is NTILE(4) ordered by revenue DESC, team, period. Sort the same way.",
    requiredOutput: ["Columns: team, period, revenue, bucket"],
    rules: ["The window order must be deterministic"], success: "bucket is 1 through 4.",
    orderMatters: true,
    hints: ["NTILE(4) OVER (ORDER BY revenue DESC, team, period).", "SELECT team, period, revenue, NTILE(4) OVER (ORDER BY revenue DESC, team, period) AS bucket FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;"],
    solutionSql: `SELECT team, period, revenue, NTILE(4) OVER (ORDER BY revenue DESC, team, period) AS bucket
FROM team_metrics ${notNull} ORDER BY revenue DESC, team, period;`,
    tablesUsed: ["team_metrics"], concept: "ntile",
  }),
  q({
    id: "rnk-05", topicId: "ranking", difficulty: "medium", title: "Month number inside the team",
    summary: "ROW_NUMBER partitioned by team.", role: "Operations director",
    context: "Each team wants its months numbered in calendar order, including a null revenue month.",
    task: "Return team, period, and month_no. month_no restarts at 1 for each team, ordered by period. Sort by team, period.",
    requiredOutput: ["Columns: team, period, month_no", "Sorted by team, period"],
    rules: ["PARTITION BY team"], success: "Each team starts again at 1.",
    orderMatters: true,
    hints: ["ROW_NUMBER() OVER (PARTITION BY team ORDER BY period).", "SELECT team, period, ROW_NUMBER() OVER (PARTITION BY team ORDER BY period) AS month_no FROM team_metrics ORDER BY team, period;"],
    solutionSql: `SELECT team, period, ROW_NUMBER() OVER (PARTITION BY team ORDER BY period) AS month_no
FROM team_metrics ORDER BY team, period;`,
    tablesUsed: ["team_metrics"], concept: "partitioned row_number",
  }),
  q({
    id: "rnk-06", topicId: "ranking", difficulty: "medium", title: "Top month per team",
    summary: "Keep row number 1 inside each team.", role: "Operations director",
    context: "Highlight the best revenue month per team. Ties break by quality_score descending, then the earlier period.",
    task: "Ignore null revenue. Return team, period, and revenue for rn = 1. Sort by team.",
    requiredOutput: ["Columns: team, period, revenue", "One row per team"],
    rules: ["Filter the row number outside the window"], success: "Each team appears once.",
    orderMatters: true,
    hints: ["Order by revenue DESC, quality_score DESC, period ASC.", "WITH ranked AS (SELECT team, period, revenue, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS rn FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue FROM ranked WHERE rn = 1 ORDER BY team;"],
    solutionSql: `WITH ranked AS (
  SELECT team, period, revenue, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS rn
  FROM team_metrics WHERE revenue IS NOT NULL
) SELECT team, period, revenue FROM ranked WHERE rn = 1 ORDER BY team;`,
    tablesUsed: ["team_metrics"], concept: "top row per group",
  }),
  q({
    id: "rnk-07", topicId: "ranking", difficulty: "medium", title: "Two best months per team",
    summary: "Keep the first two row numbers.", role: "Finance analyst",
    context: "Each team contributes its two strongest revenue months, with the same tie-break as the single highlight.",
    task: "Ignore null revenue. Return team, period, revenue, and rn for rn <= 2. Sort by team, rn.",
    requiredOutput: ["Columns: team, period, revenue, rn", "Sorted by team, rn"],
    rules: ["ROW_NUMBER, not RANK, so a team always contributes two rows when it has two reported months"], success: "Two months per team.",
    orderMatters: true,
    hints: ["Filter rn <= 2.", "WITH ranked AS (SELECT team, period, revenue, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS rn FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue, rn FROM ranked WHERE rn <= 2 ORDER BY team, rn;"],
    solutionSql: `WITH ranked AS (
  SELECT team, period, revenue, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS rn
  FROM team_metrics WHERE revenue IS NOT NULL
) SELECT team, period, revenue, rn FROM ranked WHERE rn <= 2 ORDER BY team, rn;`,
    tablesUsed: ["team_metrics"], concept: "top n per group",
  }),
  q({
    id: "rnk-08", topicId: "ranking", difficulty: "medium", title: "Second distinct revenue",
    summary: "DENSE_RANK equal to 2.", role: "Finance analyst",
    context: "The second distinct revenue overall may belong to more than one month. Use dense rank so a tie at the top does not skip 2.",
    task: "Ignore null revenue. Return team, period, and revenue where the dense rank of revenue descending is 2. Sort by team, period.",
    requiredOutput: ["Columns: team, period, revenue", "Sorted by team, period"],
    rules: ["DENSE_RANK, not RANK"], success: "Months at the second distinct revenue remain.",
    orderMatters: true,
    hints: ["WITH ranked AS (SELECT team, period, revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) AS rnk FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue FROM ranked WHERE rnk = 2 ORDER BY team, period;"],
    solutionSql: `WITH ranked AS (
  SELECT team, period, revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) AS rnk
  FROM team_metrics WHERE revenue IS NOT NULL
) SELECT team, period, revenue FROM ranked WHERE rnk = 2 ORDER BY team, period;`,
    tablesUsed: ["team_metrics"], concept: "nth distinct",
  }),
  q({
    id: "rnk-09", topicId: "ranking", difficulty: "medium", title: "Second month inside each team",
    summary: "Row number 2 by revenue.", role: "Operations director",
    context: "Each team should contribute the month that lands in position 2 by revenue, with period breaking ties.",
    task: "Ignore null revenue. Return team, period, and revenue where the row number is 2. Sort by team.",
    requiredOutput: ["Columns: team, period, revenue", "One row per team"],
    rules: ["ORDER BY revenue DESC, period ASC inside the window"], success: "Position 2 of each team.",
    orderMatters: true,
    hints: ["WITH ranked AS (SELECT team, period, revenue, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, period ASC) AS rn FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue FROM ranked WHERE rn = 2 ORDER BY team;"],
    solutionSql: `WITH ranked AS (
  SELECT team, period, revenue, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, period) AS rn
  FROM team_metrics WHERE revenue IS NOT NULL
) SELECT team, period, revenue FROM ranked WHERE rn = 2 ORDER BY team;`,
    tablesUsed: ["team_metrics"], concept: "nth per group",
  }),
  q({
    id: "rnk-10", topicId: "ranking", difficulty: "medium", title: "Percent rank of revenue",
    summary: "PERCENT_RANK over reported revenue.", role: "Data contract owner",
    context: "A distribution column uses PERCENT_RANK so the top revenue is 0 and the scale runs toward 1.",
    task: "Ignore null revenue. Return team, period, revenue, and pct_rank. Order the window by revenue DESC, team, period. Round pct_rank to 4 decimals. Sort the same way.",
    requiredOutput: ["Columns: team, period, revenue, pct_rank", "Rounded to 4 decimals"],
    rules: ["ROUND(PERCENT_RANK() OVER (...), 4)"], success: "The first row's percent rank is 0.",
    orderMatters: true,
    hints: ["SELECT team, period, revenue, ROUND(PERCENT_RANK() OVER (ORDER BY revenue DESC, team, period), 4) AS pct_rank FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;"],
    solutionSql: `SELECT team, period, revenue, ROUND(PERCENT_RANK() OVER (ORDER BY revenue DESC, team, period), 4) AS pct_rank
FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;`,
    tablesUsed: ["team_metrics"], concept: "percent_rank",
  }),
  q({
    id: "rnk-11", topicId: "ranking", difficulty: "medium", title: "Cumulative distribution",
    summary: "CUME_DIST of revenue.", role: "Data contract owner",
    context: "CUME_DIST shows the fraction of reported months at or above the current row in the chosen order.",
    task: "Ignore null revenue. Return team, period, revenue, and cume. Round cume to 4 decimals. Order by revenue DESC, team, period. Sort the same way.",
    requiredOutput: ["Columns: team, period, revenue, cume"],
    rules: ["Use CUME_DIST"], success: "The last row's cumulative distribution is 1.",
    orderMatters: true,
    hints: ["SELECT team, period, revenue, ROUND(CUME_DIST() OVER (ORDER BY revenue DESC, team, period), 4) AS cume FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;"],
    solutionSql: `SELECT team, period, revenue, ROUND(CUME_DIST() OVER (ORDER BY revenue DESC, team, period), 4) AS cume
FROM team_metrics WHERE revenue IS NOT NULL ORDER BY revenue DESC, team, period;`,
    tablesUsed: ["team_metrics"], concept: "cume_dist",
  }),
  q({
    id: "rnk-12", topicId: "ranking", difficulty: "hard", title: "Earliest revenue in the team",
    summary: "FIRST_VALUE by period.", role: "Finance analyst",
    context: "Every reported month should also show the team's earliest reported revenue.",
    task: "Ignore null revenue. Return team, period, revenue, and first_revenue. first_revenue is FIRST_VALUE(revenue) ordered by period within the team. Sort by team, period.",
    requiredOutput: ["Columns: team, period, revenue, first_revenue"],
    rules: ["Partition by team"], success: "first_revenue repeats inside the team.",
    orderMatters: true,
    hints: ["FIRST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period).", "SELECT team, period, revenue, FIRST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period) AS first_revenue FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, period;"],
    solutionSql: `SELECT team, period, revenue, FIRST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period) AS first_revenue
FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, period;`,
    tablesUsed: ["team_metrics"], concept: "first_value",
  }),
  q({
    id: "rnk-13", topicId: "ranking", difficulty: "hard", title: "Latest revenue needs the whole frame",
    summary: "LAST_VALUE with an explicit frame.", role: "Data contract owner",
    context: "The latest reported revenue must show on every month. The default frame stops too early.",
    task: "Ignore null revenue. Return team, period, revenue, and last_revenue. Use LAST_VALUE ordered by period with ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING. Sort by team, period.",
    requiredOutput: ["Columns: team, period, revenue, last_revenue", "Full-partition frame"],
    rules: ["Write the frame explicitly"], success: "last_revenue is the same on every row of a team.",
    orderMatters: true,
    hints: ["LAST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING).", "SELECT team, period, revenue, LAST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_revenue FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, period;"],
    solutionSql: `SELECT team, period, revenue,
  LAST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_revenue
FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, period;`,
    tablesUsed: ["team_metrics"], concept: "last_value frame",
  }),
  q({
    id: "rnk-14", topicId: "ranking", difficulty: "hard", title: "The second month's revenue",
    summary: "NTH_VALUE of revenue.", role: "Finance analyst",
    context: "Each row should also show the revenue from the second calendar month of reported data in that team.",
    task: "Ignore null revenue. Return team, period, revenue, and second_revenue. second_revenue is NTH_VALUE(revenue, 2) ordered by period over the whole team frame. Sort by team, period.",
    requiredOutput: ["Columns: team, period, revenue, second_revenue"],
    rules: ["Use the full frame so later rows still see the second month"], success: "second_revenue is constant inside each team.",
    orderMatters: true,
    hints: ["NTH_VALUE(revenue, 2) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING).", "SELECT team, period, revenue, NTH_VALUE(revenue, 2) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS second_revenue FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, period;"],
    solutionSql: `SELECT team, period, revenue,
  NTH_VALUE(revenue, 2) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS second_revenue
FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, period;`,
    tablesUsed: ["team_metrics"], concept: "nth_value",
  }),
  q({
    id: "rnk-15", topicId: "ranking", difficulty: "hard", title: "Quality rank inside the team",
    summary: "DENSE_RANK on quality_score.", role: "Operations director",
    context: "Inside each team, equal quality scores share a dense rank. Higher score is better. Period is not part of the rank.",
    task: "Return team, period, quality_score, and quality_rank for every month, including null revenue. Sort by team, quality_score DESC, period.",
    requiredOutput: ["Columns: team, period, quality_score, quality_rank", "That sort"],
    rules: ["DENSE_RANK partitioned by team, ordered by quality_score DESC"], success: "Ties in quality share a rank.",
    orderMatters: true,
    hints: ["SELECT team, period, quality_score, DENSE_RANK() OVER (PARTITION BY team ORDER BY quality_score DESC) AS quality_rank FROM team_metrics ORDER BY team, quality_score DESC, period;"],
    solutionSql: `SELECT team, period, quality_score, DENSE_RANK() OVER (PARTITION BY team ORDER BY quality_score DESC) AS quality_rank
FROM team_metrics ORDER BY team, quality_score DESC, period;`,
    tablesUsed: ["team_metrics"], concept: "dense_rank partition",
  }),
  q({
    id: "rnk-16", topicId: "ranking", difficulty: "hard", title: "Only the top salary in each department",
    summary: "Rank staff pay inside the department.", role: "HR analyst",
    context: "Each department contributes the person with the highest salary. Hire date breaks a tie, earlier first, then last name.",
    task: "Return department, last_name, and salary for rank 1. Sort by department.",
    requiredOutput: ["Columns: department, last_name, salary", "One person per department"],
    rules: ["ROW_NUMBER partitioned by department"], success: "Five departments, five people.",
    orderMatters: true,
    hints: ["WITH ranked AS (SELECT d.name AS department, e.last_name, e.salary, ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC, e.hire_date, e.last_name) AS rn FROM employees e JOIN departments d ON d.id = e.department_id) SELECT department, last_name, salary FROM ranked WHERE rn = 1 ORDER BY department;"],
    solutionSql: `WITH ranked AS (
  SELECT d.name AS department, e.last_name, e.salary,
    ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC, e.hire_date, e.last_name) AS rn
  FROM employees e JOIN departments d ON d.id = e.department_id
) SELECT department, last_name, salary FROM ranked WHERE rn = 1 ORDER BY department;`,
    tablesUsed: ["employees", "departments"], concept: "top per department",
  }),
  q({
    id: "rnk-17", topicId: "ranking", difficulty: "hard", title: "Capstone two-row team card",
    summary: "Row number, dense quality rank, and period endpoints.", role: "Data contract owner",
    context: "The team card keeps the two strongest revenue months and stamps the team's first and last reported period on both rows.",
    task: "Ignore null revenue. Return team, period, revenue, quality_score, revenue_row, quality_dense, first_period, and last_period for revenue_row <= 2. revenue_row breaks ties by quality_score DESC, then period ASC. quality_dense ranks quality_score descending inside the team. first_period and last_period use the full partition ordered by period. Sort by team, revenue_row.",
    requiredOutput: ["Those columns in order", "Two rows per team", "Sorted by team, revenue_row"],
    rules: ["FIRST_VALUE and LAST_VALUE need the full frame", "Filter to revenue_row <= 2 in the outer query"], success: "Each team has two card rows.",
    orderMatters: true,
    hints: ["Compute the windows in a CTE, then filter.", "WITH scored AS (SELECT team, period, revenue, quality_score, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS revenue_row, DENSE_RANK() OVER (PARTITION BY team ORDER BY quality_score DESC) AS quality_dense, FIRST_VALUE(period) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_period, LAST_VALUE(period) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_period FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue, quality_score, revenue_row, quality_dense, first_period, last_period FROM scored WHERE revenue_row <= 2 ORDER BY team, revenue_row;"],
    solutionSql: `WITH scored AS (
  SELECT team, period, revenue, quality_score,
    ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS revenue_row,
    DENSE_RANK() OVER (PARTITION BY team ORDER BY quality_score DESC) AS quality_dense,
    FIRST_VALUE(period) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_period,
    LAST_VALUE(period) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_period
  FROM team_metrics WHERE revenue IS NOT NULL
)
SELECT team, period, revenue, quality_score, revenue_row, quality_dense, first_period, last_period
FROM scored WHERE revenue_row <= 2 ORDER BY team, revenue_row;`,
    tablesUsed: ["team_metrics"], concept: "ranking capstone",
  }),
];
