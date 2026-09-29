import { q } from "../types";

export const windowQuestions = [
  q({
    id: "win-01",
    topicId: "windows",
    difficulty: "easy",
    title: "Average revenue by team",
    summary: "Aggregate inside a named CTE.",
    role: "Finance analyst",
    context: "Planning wants a named intermediate result for average monthly revenue, one row per team that has metrics.",
    task: "Using a CTE named team_avg, return team and avg_revenue. avg_revenue is the average of revenue rounded to 2 decimals. Sort by team. Ignore teams that have no metric rows.",
    requiredOutput: ["Columns: team, avg_revenue", "One row per team present in team_metrics", "Sorted by team"],
    rules: ["The CTE must be named team_avg", "AVG ignores null revenue", "Select from the CTE"],
    success: "Alpha, Beta, and Gamma each have one rounded average.",
    orderMatters: true,
    hints: [
      "WITH name AS ( ... ) wraps the aggregate before the final select.",
      "ROUND(AVG(revenue), 2) and GROUP BY team.",
      "WITH team_avg AS (SELECT team, ROUND(AVG(revenue), 2) AS avg_revenue FROM team_metrics GROUP BY team) SELECT team, avg_revenue FROM team_avg ORDER BY team;",
    ],
    solutionSql: `WITH team_avg AS (
  SELECT team, ROUND(AVG(revenue), 2) AS avg_revenue
  FROM team_metrics
  GROUP BY team
)
SELECT team, avg_revenue
FROM team_avg
ORDER BY team;`,
    tablesUsed: ["team_metrics"],
    concept: "cte aggregate",
  }),
  q({
    id: "win-02",
    topicId: "windows",
    difficulty: "easy",
    title: "Running revenue",
    summary: "A simple running total by team.",
    role: "Finance analyst",
    context: "Each team wants a year-to-date revenue figure that grows month by month, in calendar order.",
    task: "Return team, period, revenue, and running_revenue. running_revenue is the sum of revenue so far within the team, ordered by period. Keep months with null revenue. Sort by team, then period.",
    requiredOutput: ["Columns: team, period, revenue, running_revenue", "The window is partitioned by team and ordered by period", "Sorted by team, period"],
    rules: ["Use SUM() OVER (...)", "Do not collapse the months with GROUP BY"],
    success: "Each month remains, with a total that accumulates inside the team.",
    orderMatters: true,
    hints: [
      "A window aggregate keeps the detail rows.",
      "PARTITION BY team ORDER BY period resets the total for each team.",
      "SELECT team, period, revenue, SUM(revenue) OVER (PARTITION BY team ORDER BY period) AS running_revenue FROM team_metrics ORDER BY team, period;",
    ],
    solutionSql: `SELECT team, period, revenue,
  SUM(revenue) OVER (PARTITION BY team ORDER BY period) AS running_revenue
FROM team_metrics
ORDER BY team, period;`,
    tablesUsed: ["team_metrics"],
    concept: "running total",
  }),
  q({
    id: "win-03",
    topicId: "windows",
    difficulty: "medium",
    title: "Previous month",
    summary: "Compare each month with LAG.",
    role: "Finance analyst",
    context: "The monthly pack should show this month's revenue next to the prior month in the same team.",
    task: "Return team, period, revenue, and prev_revenue. prev_revenue is the previous period's revenue inside the team. The first month of each team stays null. Sort by team, then period.",
    requiredOutput: ["Columns: team, period, revenue, prev_revenue", "Sorted by team, period"],
    rules: ["Use LAG", "Partition by team and order by period"],
    success: "The first month of each team has a null previous revenue.",
    orderMatters: true,
    hints: [
      "LAG reads a value from the prior row in the window.",
      "Without a partition, January of Beta would see December of Alpha.",
      "SELECT team, period, revenue, LAG(revenue) OVER (PARTITION BY team ORDER BY period) AS prev_revenue FROM team_metrics ORDER BY team, period;",
    ],
    solutionSql: `SELECT team, period, revenue,
  LAG(revenue) OVER (PARTITION BY team ORDER BY period) AS prev_revenue
FROM team_metrics
ORDER BY team, period;`,
    tablesUsed: ["team_metrics"],
    concept: "lag",
  }),
  q({
    id: "win-04",
    topicId: "windows",
    difficulty: "medium",
    title: "Change in absolute and percent",
    summary: "Period-over-period delta and rate.",
    role: "Finance analyst",
    context: "Leadership wants both the point change and the percent change versus the previous month.",
    task: "For months with a non-null revenue, return team, period, revenue, abs_change, and pct_change. abs_change is the absolute difference from the previous revenue in the team. pct_change is that difference divided by the previous revenue, times 100, rounded to 2 decimals. When there is no previous revenue, both change columns are null. Sort by team, then period.",
    requiredOutput: [
      "Columns: team, period, revenue, abs_change, pct_change",
      "Null revenue months are excluded",
      "pct_change rounded to 2 decimals",
      "Sorted by team, period",
    ],
    rules: ["Use ABS for the absolute change", "Guard the percent so a missing previous month stays null", "Divide by the lagged revenue"],
    success: "Opening months are null, and later months have both a magnitude and a rate.",
    orderMatters: true,
    hints: [
      "Compute LAG once in a CTE if repeating it is hard to read. Repeating it is also valid.",
      "ABS(revenue - prev) is the magnitude. The percent uses the signed difference.",
      "WITH base AS (SELECT team, period, revenue, LAG(revenue) OVER (PARTITION BY team ORDER BY period) AS prev_revenue FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue, ABS(revenue - prev_revenue) AS abs_change, CASE WHEN prev_revenue IS NULL OR prev_revenue = 0 THEN NULL ELSE ROUND(100.0 * (revenue - prev_revenue) / prev_revenue, 2) END AS pct_change FROM base ORDER BY team, period;",
    ],
    solutionSql: `WITH base AS (
  SELECT team, period, revenue,
    LAG(revenue) OVER (PARTITION BY team ORDER BY period) AS prev_revenue
  FROM team_metrics
  WHERE revenue IS NOT NULL
)
SELECT team, period, revenue,
  ABS(revenue - prev_revenue) AS abs_change,
  CASE
    WHEN prev_revenue IS NULL OR prev_revenue = 0 THEN NULL
    ELSE ROUND(100.0 * (revenue - prev_revenue) / prev_revenue, 2)
  END AS pct_change
FROM base
ORDER BY team, period;`,
    tablesUsed: ["team_metrics"],
    concept: "period change",
  }),
  q({
    id: "win-05",
    topicId: "windows",
    difficulty: "medium",
    title: "Best month in each team",
    summary: "Row number with a deterministic tie-break.",
    role: "Operations director",
    context: "Each team gets one highlight month: highest revenue, then highest quality score, then the earlier period if those still tie.",
    task: "Return team, period, revenue, and quality_score for the single winning month per team. Ignore null revenue. Sort by team.",
    requiredOutput: ["Columns: team, period, revenue, quality_score", "Exactly one row per team", "Sorted by team"],
    rules: [
      "Use a CTE and ROW_NUMBER",
      "Order the window by revenue DESC, quality_score DESC, period ASC",
      "Keep rn = 1",
    ],
    success: "Each team contributes its winning month only.",
    orderMatters: true,
    hints: [
      "ROW_NUMBER never ties, so the ORDER BY must include the tie-breakers.",
      "Filter to rn = 1 outside the window.",
      "WITH ranked AS (SELECT team, period, revenue, quality_score, ROW_NUMBER() OVER (PARTITION BY team ORDER BY revenue DESC, quality_score DESC, period ASC) AS rn FROM team_metrics WHERE revenue IS NOT NULL) SELECT team, period, revenue, quality_score FROM ranked WHERE rn = 1 ORDER BY team;",
    ],
    solutionSql: `WITH ranked AS (
  SELECT team, period, revenue, quality_score,
    ROW_NUMBER() OVER (
      PARTITION BY team
      ORDER BY revenue DESC, quality_score DESC, period ASC
    ) AS rn
  FROM team_metrics
  WHERE revenue IS NOT NULL
)
SELECT team, period, revenue, quality_score
FROM ranked
WHERE rn = 1
ORDER BY team;`,
    tablesUsed: ["team_metrics"],
    concept: "row_number filter",
  }),
  q({
    id: "win-06",
    topicId: "windows",
    difficulty: "medium",
    title: "Look one month ahead",
    summary: "LEAD the next revenue.",
    role: "Finance analyst",
    context: "A forecast note places next month's actual revenue beside this month, so the last month of each team is blank.",
    task: "Return team, period, revenue, and next_revenue using LEAD within the team ordered by period. Keep null revenues. Sort by team, then period.",
    requiredOutput: ["Columns: team, period, revenue, next_revenue", "Sorted by team, period"],
    rules: ["Use LEAD", "Partition by team"],
    success: "The final month of each team has a null next_revenue.",
    orderMatters: true,
    hints: [
      "LEAD is the forward version of LAG.",
      "Order by period so 'next' means the following month.",
      "SELECT team, period, revenue, LEAD(revenue) OVER (PARTITION BY team ORDER BY period) AS next_revenue FROM team_metrics ORDER BY team, period;",
    ],
    solutionSql: `SELECT team, period, revenue,
  LEAD(revenue) OVER (PARTITION BY team ORDER BY period) AS next_revenue
FROM team_metrics
ORDER BY team, period;`,
    tablesUsed: ["team_metrics"],
    concept: "lead",
  }),
  q({
    id: "win-07",
    topicId: "windows",
    difficulty: "hard",
    title: "First and last, with the full frame",
    summary: "FIRST_VALUE and LAST_VALUE over the whole partition.",
    role: "Data contract owner",
    context: "Every month should also show the team's earliest and latest revenue in calendar order. The latest value is wrong if the frame stops at the current row.",
    task: "Return team, period, revenue, first_revenue, and last_revenue. Both window values use the full partition ordered by period, with ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING. Keep every month, including null revenue. Sort by team, then period.",
    requiredOutput: [
      "Columns: team, period, revenue, first_revenue, last_revenue",
      "The frame is the entire partition",
      "Sorted by team, period",
    ],
    rules: ["Do not rely on the default frame", "LAST_VALUE must see the final month, even on earlier rows"],
    success: "first_revenue and last_revenue are constant inside each team.",
    orderMatters: true,
    hints: [
      "The default frame ends at the current row, so LAST_VALUE repeats the current revenue.",
      "Name the frame on both windows.",
      "SELECT team, period, revenue, FIRST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_revenue, LAST_VALUE(revenue) OVER (PARTITION BY team ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_revenue FROM team_metrics ORDER BY team, period;",
    ],
    solutionSql: `SELECT team, period, revenue,
  FIRST_VALUE(revenue) OVER (
    PARTITION BY team ORDER BY period
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS first_revenue,
  LAST_VALUE(revenue) OVER (
    PARTITION BY team ORDER BY period
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS last_revenue
FROM team_metrics
ORDER BY team, period;`,
    tablesUsed: ["team_metrics"],
    concept: "full partition frame",
  }),
  q({
    id: "win-08",
    topicId: "windows",
    difficulty: "hard",
    title: "Rows versus range when revenue ties",
    summary: "Show how tied sort keys change a running sum.",
    role: "Data contract owner",
    context: "Two teams have repeated revenue figures. Finance wants to see a running sum that steps row by row, and one that jumps for every tied revenue.",
    task: "Ignore null revenue. Return team, period, revenue, rows_running, and range_running. rows_running sums revenue within the team ordered by revenue, then period, using ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. range_running sums revenue within the team ordered by revenue only, using RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. Sort by team, revenue, period.",
    requiredOutput: [
      "Columns: team, period, revenue, rows_running, range_running",
      "Tied revenues differ between the two running columns",
      "Sorted by team, revenue, period",
    ],
    rules: ["Keep both frames explicit", "Do not add period to the RANGE order"],
    success: "Tied revenues share a range total and have different row totals.",
    orderMatters: true,
    hints: [
      "ROWS walks physical peers one at a time. RANGE treats equal ORDER BY values as one peer group.",
      "The ROWS window needs period so the tie order is stable. The RANGE window must order by revenue alone.",
      "SELECT team, period, revenue, SUM(revenue) OVER (PARTITION BY team ORDER BY revenue, period ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rows_running, SUM(revenue) OVER (PARTITION BY team ORDER BY revenue RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS range_running FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, revenue, period;",
    ],
    solutionSql: `SELECT team, period, revenue,
  SUM(revenue) OVER (
    PARTITION BY team
    ORDER BY revenue, period
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS rows_running,
  SUM(revenue) OVER (
    PARTITION BY team
    ORDER BY revenue
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS range_running
FROM team_metrics
WHERE revenue IS NOT NULL
ORDER BY team, revenue, period;`,
    tablesUsed: ["team_metrics"],
    concept: "rows vs range",
  }),
  q({
    id: "win-09",
    topicId: "windows",
    difficulty: "hard",
    title: "Quality streaks",
    summary: "Find islands of months at or above 80.",
    role: "Operations director",
    context: "A quality streak is a run of consecutive months with quality_score at least 80. A dip ends the streak.",
    task: "Return team, streak_start, streak_end, and months for each island where quality_score is at least 80. months is how many months are in that island. Sort by team, then streak_start.",
    requiredOutput: [
      "Columns: team, streak_start, streak_end, months",
      "Only stretches with quality_score >= 80",
      "Sorted by team, streak_start",
    ],
    rules: ["Treat a low month as a break", "Do not merge streaks across a dip"],
    success: "Alpha has two streaks and Beta has one. Gamma has none.",
    orderMatters: true,
    hints: [
      "Flag high months, then a running count of low months gives each island an id.",
      "Group the high rows by team and that id.",
      "WITH flagged AS (SELECT team, period, CASE WHEN quality_score >= 80 THEN 1 ELSE 0 END AS high FROM team_metrics), islands AS (SELECT team, period, high, SUM(CASE WHEN high = 0 THEN 1 ELSE 0 END) OVER (PARTITION BY team ORDER BY period) AS grp FROM flagged) SELECT team, MIN(period) AS streak_start, MAX(period) AS streak_end, COUNT(*) AS months FROM islands WHERE high = 1 GROUP BY team, grp ORDER BY team, streak_start;",
    ],
    solutionSql: `WITH flagged AS (
  SELECT team, period,
    CASE WHEN quality_score >= 80 THEN 1 ELSE 0 END AS high
  FROM team_metrics
),
islands AS (
  SELECT team, period, high,
    SUM(CASE WHEN high = 0 THEN 1 ELSE 0 END) OVER (
      PARTITION BY team ORDER BY period
    ) AS grp
  FROM flagged
)
SELECT team, MIN(period) AS streak_start, MAX(period) AS streak_end, COUNT(*) AS months
FROM islands
WHERE high = 1
GROUP BY team, grp
ORDER BY team, streak_start;`,
    tablesUsed: ["team_metrics"],
    concept: "gaps and islands",
  }),
  q({
    id: "win-10",
    topicId: "windows",
    difficulty: "hard",
    title: "Cumulative share of team revenue",
    summary: "Running total divided by the team total.",
    role: "Finance analyst",
    context: "Starting from the largest month, what share of the team's revenue is covered as you walk down?",
    task: "Ignore null revenue. Return team, period, revenue, and cumulative_share_pct. The share is the running sum within the team, ordered by revenue descending then period, divided by the team's total revenue, times 100, rounded to 2 decimals. Use ROWS up to the current row for the running sum. Sort by team, revenue descending, period.",
    requiredOutput: [
      "Columns: team, period, revenue, cumulative_share_pct",
      "Share rounded to 2 decimals",
      "Sorted by team, revenue DESC, period",
    ],
    rules: ["The team total uses a separate window with no order", "Do not include null revenue"],
    success: "The smallest month in each team reaches 100.",
    orderMatters: true,
    hints: [
      "You can use two SUM windows: one ordered, one over the whole partition.",
      "Multiply by 100.0 before dividing so the rate keeps its fraction.",
      "SELECT team, period, revenue, ROUND(100.0 * SUM(revenue) OVER (PARTITION BY team ORDER BY revenue DESC, period ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / SUM(revenue) OVER (PARTITION BY team), 2) AS cumulative_share_pct FROM team_metrics WHERE revenue IS NOT NULL ORDER BY team, revenue DESC, period;",
    ],
    solutionSql: `SELECT team, period, revenue,
  ROUND(
    100.0 * SUM(revenue) OVER (
      PARTITION BY team
      ORDER BY revenue DESC, period
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) / SUM(revenue) OVER (PARTITION BY team),
    2
  ) AS cumulative_share_pct
FROM team_metrics
WHERE revenue IS NOT NULL
ORDER BY team, revenue DESC, period;`,
    tablesUsed: ["team_metrics"],
    concept: "cumulative share",
  }),
  q({
    id: "win-11",
    topicId: "windows",
    difficulty: "hard",
    title: "Capstone monthly bridge",
    summary: "Running total, share, and period change together.",
    role: "Data contract owner",
    context: "The monthly bridge is the contract for the metrics review. Every month stays, including a null revenue, and the derived columns have fixed names.",
    task: "Return team, period, revenue, running_revenue, share_pct, change_abs, and change_pct. running_revenue sums revenue within the team ordered by period using ROWS UNBOUNDED PRECEDING. share_pct is that running total divided by the team total, times 100, rounded to 2 decimals. change_abs is revenue minus the previous period's revenue. change_pct is that change divided by the previous revenue, times 100, rounded to 2 decimals, and null when the previous revenue is missing or zero. Sort by team, then period.",
    requiredOutput: [
      "Columns in order: team, period, revenue, running_revenue, share_pct, change_abs, change_pct",
      "Null revenue months remain",
      "share_pct and change_pct rounded to 2 decimals",
      "Sorted by team, period",
    ],
    rules: [
      "Use one CTE for the window columns",
      "The running sum frame is ROWS, not the default RANGE",
      "Do not drop Beta's null-revenue month",
    ],
    success: "The bridge matches the column contract and the calendar order.",
    orderMatters: true,
    hints: [
      "Calculate lag, the running sum, and the team total in the CTE, then round in the outer query.",
      "SUM ignores null, so a null month does not move the running total.",
      "WITH base AS (SELECT team, period, revenue, LAG(revenue) OVER (PARTITION BY team ORDER BY period) AS prev_revenue, SUM(revenue) OVER (PARTITION BY team ORDER BY period ROWS UNBOUNDED PRECEDING) AS running_revenue, SUM(revenue) OVER (PARTITION BY team) AS team_total FROM team_metrics) SELECT team, period, revenue, running_revenue, ROUND(100.0 * running_revenue / team_total, 2) AS share_pct, revenue - prev_revenue AS change_abs, CASE WHEN prev_revenue IS NULL OR prev_revenue = 0 THEN NULL ELSE ROUND(100.0 * (revenue - prev_revenue) / prev_revenue, 2) END AS change_pct FROM base ORDER BY team, period;",
    ],
    solutionSql: `WITH base AS (
  SELECT team, period, revenue,
    LAG(revenue) OVER (PARTITION BY team ORDER BY period) AS prev_revenue,
    SUM(revenue) OVER (
      PARTITION BY team ORDER BY period
      ROWS UNBOUNDED PRECEDING
    ) AS running_revenue,
    SUM(revenue) OVER (PARTITION BY team) AS team_total
  FROM team_metrics
)
SELECT team, period, revenue, running_revenue,
  ROUND(100.0 * running_revenue / team_total, 2) AS share_pct,
  revenue - prev_revenue AS change_abs,
  CASE
    WHEN prev_revenue IS NULL OR prev_revenue = 0 THEN NULL
    ELSE ROUND(100.0 * (revenue - prev_revenue) / prev_revenue, 2)
  END AS change_pct
FROM base
ORDER BY team, period;`,
    tablesUsed: ["team_metrics"],
    concept: "window capstone",
  }),
];
