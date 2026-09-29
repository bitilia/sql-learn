import { q } from "../types";

export const companyQuestions = [
  q({
    id: "shop-01", topicId: "ecommerce", difficulty: "easy", title: "Catalog list",
    summary: "List products.", role: "Merchandiser",
    context: "The shop team wants the catalog with category and price.",
    task: "Return name, category, and price from products.",
    requiredOutput: ["Columns: name, category, price"],
    rules: ["Use products"], success: "Every product appears.",
    hints: ["SELECT name, category, price FROM products;"],
    solutionSql: "SELECT name, category, price FROM products;",
    tablesUsed: ["products"], concept: "select",
  }),
  q({
    id: "shop-02", topicId: "ecommerce", difficulty: "easy", title: "Paid orders",
    summary: "Filter order status.", role: "Merchandiser",
    context: "Finance only wants orders whose status is paid.",
    task: "Return id, customer_id, and ordered_at for paid orders.",
    requiredOutput: ["Columns: id, customer_id, ordered_at"],
    rules: ["status = 'paid'"], success: "Refunded and pending orders are gone.",
    hints: ["SELECT id, customer_id, ordered_at FROM orders WHERE status = 'paid';"],
    solutionSql: "SELECT id, customer_id, ordered_at FROM orders WHERE status = 'paid';",
    tablesUsed: ["orders"], concept: "filter",
  }),
  q({
    id: "shop-03", topicId: "ecommerce", difficulty: "medium", title: "Who placed each order",
    summary: "Join customers to orders.", role: "Merchandiser",
    context: "Support wants the customer name on every order, whatever the status.",
    task: "Return customer, order_id, ordered_at, and status. Sort by ordered_at, order_id.",
    requiredOutput: ["Columns: customer, order_id, ordered_at, status", "That sort"],
    rules: ["Join orders to customers"], success: "Every order has a name.",
    orderMatters: true,
    hints: ["SELECT c.name AS customer, o.id AS order_id, o.ordered_at, o.status FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.ordered_at, order_id;"],
    solutionSql: `SELECT c.name AS customer, o.id AS order_id, o.ordered_at, o.status
FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.ordered_at, order_id;`,
    tablesUsed: ["orders", "customers"], concept: "join",
  }),
  q({
    id: "shop-04", topicId: "ecommerce", difficulty: "medium", title: "Paid revenue by category",
    summary: "Sum line totals for paid orders.", role: "Merchandiser",
    context: "Category revenue should include paid orders only. A refunded or pending line does not count.",
    task: "Return category and paid_revenue rounded to 2 decimals. Sort by category.",
    requiredOutput: ["Columns: category, paid_revenue", "Sorted by category"],
    rules: ["Line total is qty * unit_price", "Join items to orders and products"], success: "Only paid lines are summed.",
    orderMatters: true,
    hints: ["WHERE o.status = 'paid'.", "SELECT p.category, ROUND(SUM(oi.qty * oi.unit_price), 2) AS paid_revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status = 'paid' GROUP BY p.category ORDER BY category;"],
    solutionSql: `SELECT p.category, ROUND(SUM(oi.qty * oi.unit_price), 2) AS paid_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'paid'
GROUP BY p.category ORDER BY category;`,
    tablesUsed: ["order_items", "orders", "products"], concept: "conditional revenue",
  }),
  q({
    id: "shop-05", topicId: "ecommerce", difficulty: "medium", title: "Customers with no orders",
    summary: "Anti-join the order table.", role: "Merchandiser",
    context: "Growth wants customers who signed up and never ordered.",
    task: "Return name and city. Sort by name.",
    requiredOutput: ["Columns: name, city", "Sorted by name"],
    rules: ["LEFT JOIN and keep a null order id, or NOT EXISTS"], success: "Only customers without orders remain.",
    orderMatters: true,
    hints: ["SELECT c.name, c.city FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL ORDER BY c.name;"],
    solutionSql: `SELECT c.name, c.city FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL ORDER BY c.name;`,
    tablesUsed: ["customers", "orders"], concept: "anti-join",
  }),
  q({
    id: "shop-06", topicId: "ecommerce", difficulty: "hard", title: "Capstone customer value",
    summary: "Orders, paid spend, and last paid date.", role: "Merchandiser",
    context: "The value card keeps every customer. Spend counts paid lines only. Order count includes every status.",
    task: "Return customer, orders, paid_spend, and last_paid_on. orders is the number of distinct orders. paid_spend is the sum of qty * unit_price on paid orders, rounded to 2 decimals, or 0. last_paid_on is the latest paid ordered_at, or null. Sort by paid_spend descending, then customer.",
    requiredOutput: ["Columns in that order", "Customers with no orders show 0 and null", "That sort"],
    rules: ["Do not multiply the order count by line items", "COUNT(DISTINCT order id)"], success: "The value card matches the contract.",
    orderMatters: true,
    hints: ["Conditional SUM and MAX inside the customer group.", "SELECT c.name AS customer, COUNT(DISTINCT o.id) AS orders, ROUND(COALESCE(SUM(CASE WHEN o.status = 'paid' THEN oi.qty * oi.unit_price END), 0), 2) AS paid_spend, MAX(CASE WHEN o.status = 'paid' THEN o.ordered_at END) AS last_paid_on FROM customers c LEFT JOIN orders o ON o.customer_id = c.id LEFT JOIN order_items oi ON oi.order_id = o.id GROUP BY c.id, c.name ORDER BY paid_spend DESC, customer;"],
    solutionSql: `SELECT c.name AS customer, COUNT(DISTINCT o.id) AS orders,
  ROUND(COALESCE(SUM(CASE WHEN o.status = 'paid' THEN oi.qty * oi.unit_price END), 0), 2) AS paid_spend,
  MAX(CASE WHEN o.status = 'paid' THEN o.ordered_at END) AS last_paid_on
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.name
ORDER BY paid_spend DESC, customer;`,
    tablesUsed: ["customers", "orders", "order_items"], concept: "commerce capstone",
  }),
  q({
    id: "stream-01", topicId: "streaming", difficulty: "easy", title: "Title catalog",
    summary: "List titles.", role: "Member analyst",
    context: "Programming wants the title list with genre and release year.",
    task: "Return name, genre, and release_year.",
    requiredOutput: ["Columns: name, genre, release_year"],
    rules: ["Use titles"], success: "Every title appears, including one nobody has watched.",
    hints: ["SELECT name, genre, release_year FROM titles;"],
    solutionSql: "SELECT name, genre, release_year FROM titles;",
    tablesUsed: ["titles"], concept: "select",
  }),
  q({
    id: "stream-02", topicId: "streaming", difficulty: "easy", title: "Minutes by member",
    summary: "Sum watch minutes.", role: "Member analyst",
    context: "Engagement wants total minutes for members who have watched something.",
    task: "Return display_name and total_minutes. Sort by display_name.",
    requiredOutput: ["Columns: display_name, total_minutes", "Sorted by display_name"],
    rules: ["Join watches to members"], success: "Members with no watches are absent.",
    orderMatters: true,
    hints: ["SELECT m.display_name, SUM(w.minutes) AS total_minutes FROM watches w JOIN members m ON m.id = w.member_id GROUP BY m.id, m.display_name ORDER BY display_name;"],
    solutionSql: `SELECT m.display_name, SUM(w.minutes) AS total_minutes
FROM watches w JOIN members m ON m.id = w.member_id
GROUP BY m.id, m.display_name ORDER BY display_name;`,
    tablesUsed: ["watches", "members"], concept: "aggregate",
  }),
  q({
    id: "stream-03", topicId: "streaming", difficulty: "medium", title: "Titles nobody watched",
    summary: "Anti-join watches.", role: "Member analyst",
    context: "Programming wants titles that have no watch rows.",
    task: "Return name and genre. Sort by name.",
    requiredOutput: ["Columns: name, genre", "Sorted by name"],
    rules: ["LEFT JOIN or NOT EXISTS"], success: "Only unwatched titles remain.",
    orderMatters: true,
    hints: ["SELECT t.name, t.genre FROM titles t LEFT JOIN watches w ON w.title_id = t.id WHERE w.title_id IS NULL ORDER BY t.name;"],
    solutionSql: `SELECT t.name, t.genre FROM titles t
LEFT JOIN watches w ON w.title_id = t.id WHERE w.title_id IS NULL ORDER BY t.name;`,
    tablesUsed: ["titles", "watches"], concept: "anti-join",
  }),
  q({
    id: "stream-04", topicId: "streaming", difficulty: "medium", title: "Members who never pressed play",
    summary: "Members with no watches.", role: "Member analyst",
    context: "Lifecycle wants members with no watch rows.",
    task: "Return display_name and plan. Sort by display_name.",
    requiredOutput: ["Columns: display_name, plan", "Sorted by display_name"],
    rules: ["Keep the member when the watch key is null"], success: "Only inactive members remain.",
    orderMatters: true,
    hints: ["SELECT m.display_name, m.plan FROM members m LEFT JOIN watches w ON w.member_id = m.id WHERE w.member_id IS NULL ORDER BY m.display_name;"],
    solutionSql: `SELECT m.display_name, m.plan FROM members m
LEFT JOIN watches w ON w.member_id = m.id WHERE w.member_id IS NULL ORDER BY m.display_name;`,
    tablesUsed: ["members", "watches"], concept: "anti-join",
  }),
  q({
    id: "stream-05", topicId: "streaming", difficulty: "medium", title: "Average minutes by genre",
    summary: "Average watch length per genre.", role: "Member analyst",
    context: "Programming wants the average watch length by genre, rounded to 1 decimal.",
    task: "Return genre and avg_minutes. Sort by genre.",
    requiredOutput: ["Columns: genre, avg_minutes", "Rounded to 1 decimal"],
    rules: ["Join watches to titles"], success: "Each watched genre appears once.",
    orderMatters: true,
    hints: ["SELECT t.genre, ROUND(AVG(w.minutes), 1) AS avg_minutes FROM watches w JOIN titles t ON t.id = w.title_id GROUP BY t.genre ORDER BY genre;"],
    solutionSql: `SELECT t.genre, ROUND(AVG(w.minutes), 1) AS avg_minutes
FROM watches w JOIN titles t ON t.id = w.title_id GROUP BY t.genre ORDER BY genre;`,
    tablesUsed: ["watches", "titles"], concept: "grouped average",
  }),
  q({
    id: "stream-06", topicId: "streaming", difficulty: "hard", title: "Capstone member engagement",
    summary: "Minutes, titles, and last watch.", role: "Member analyst",
    context: "The engagement card keeps every member, including people who never watched.",
    task: "Return display_name, plan, watch_count, titles_watched, total_minutes, and last_watched_on. watch_count counts watch rows. titles_watched counts distinct titles. total_minutes is 0 when they never watched. last_watched_on is null in that case. Sort by total_minutes descending, then display_name.",
    requiredOutput: ["Those columns in order", "Zeros instead of null counts", "That sort"],
    rules: ["Left join watches", "COUNT of a watch column, not COUNT(*)"], success: "Inactive members show zeros and a null date.",
    orderMatters: true,
    hints: ["COUNT(w.member_id) and COUNT(DISTINCT w.title_id) ignore the null-padded row.", "SELECT m.display_name, m.plan, COUNT(w.title_id) AS watch_count, COUNT(DISTINCT w.title_id) AS titles_watched, COALESCE(SUM(w.minutes), 0) AS total_minutes, MAX(w.watched_on) AS last_watched_on FROM members m LEFT JOIN watches w ON w.member_id = m.id GROUP BY m.id, m.display_name, m.plan ORDER BY total_minutes DESC, m.display_name;"],
    solutionSql: `SELECT m.display_name, m.plan,
  COUNT(w.title_id) AS watch_count,
  COUNT(DISTINCT w.title_id) AS titles_watched,
  COALESCE(SUM(w.minutes), 0) AS total_minutes,
  MAX(w.watched_on) AS last_watched_on
FROM members m LEFT JOIN watches w ON w.member_id = m.id
GROUP BY m.id, m.display_name, m.plan
ORDER BY total_minutes DESC, m.display_name;`,
    tablesUsed: ["members", "watches"], concept: "streaming capstone",
  }),
  q({
    id: "social-01", topicId: "social", difficulty: "easy", title: "Recent notes",
    summary: "List posts.", role: "Community editor",
    context: "Moderation wants each post's author id, text, and date.",
    task: "Return id, member_id, body, and posted_on.",
    requiredOutput: ["Columns: id, member_id, body, posted_on"],
    rules: ["Use posts"], success: "Every post appears.",
    hints: ["SELECT id, member_id, body, posted_on FROM posts;"],
    solutionSql: "SELECT id, member_id, body, posted_on FROM posts;",
    tablesUsed: ["posts"], concept: "select",
  }),
  q({
    id: "social-02", topicId: "social", difficulty: "medium", title: "Posts per member",
    summary: "Count posts, including zero.", role: "Community editor",
    context: "The directory should show a post count for every member.",
    task: "Return handle and posts. Sort by handle.",
    requiredOutput: ["Columns: handle, posts", "Zero for members with no posts", "Sorted by handle"],
    rules: ["COUNT the post id after a left join"], success: "Silent members show 0.",
    orderMatters: true,
    hints: ["SELECT m.handle, COUNT(p.id) AS posts FROM members m LEFT JOIN posts p ON p.member_id = m.id GROUP BY m.id, m.handle ORDER BY handle;"],
    solutionSql: `SELECT m.handle, COUNT(p.id) AS posts FROM members m
LEFT JOIN posts p ON p.member_id = m.id GROUP BY m.id, m.handle ORDER BY handle;`,
    tablesUsed: ["members", "posts"], concept: "left count",
  }),
  q({
    id: "social-03", topicId: "social", difficulty: "easy", title: "Reactions by kind",
    summary: "Count each reaction kind.", role: "Community editor",
    context: "A small chart counts useful and spark reactions.",
    task: "Return kind and reactions. Sort by kind.",
    requiredOutput: ["Columns: kind, reactions", "Sorted by kind"],
    rules: ["GROUP BY kind"], success: "Each kind appears once.",
    orderMatters: true,
    hints: ["SELECT kind, COUNT(*) AS reactions FROM reactions GROUP BY kind ORDER BY kind;"],
    solutionSql: "SELECT kind, COUNT(*) AS reactions FROM reactions GROUP BY kind ORDER BY kind;",
    tablesUsed: ["reactions"], concept: "group by",
  }),
  q({
    id: "social-04", topicId: "social", difficulty: "medium", title: "Posts with no reactions",
    summary: "Anti-join reactions.", role: "Community editor",
    context: "Moderation looks for posts that received no reactions.",
    task: "Return post_id and body. Sort by post_id.",
    requiredOutput: ["Columns: post_id, body", "Sorted by post_id"],
    rules: ["Left join reactions and keep nulls"], success: "Only unanswered posts remain.",
    orderMatters: true,
    hints: ["SELECT p.id AS post_id, p.body FROM posts p LEFT JOIN reactions r ON r.post_id = p.id WHERE r.post_id IS NULL ORDER BY post_id;"],
    solutionSql: `SELECT p.id AS post_id, p.body FROM posts p
LEFT JOIN reactions r ON r.post_id = p.id WHERE r.post_id IS NULL ORDER BY post_id;`,
    tablesUsed: ["posts", "reactions"], concept: "anti-join",
  }),
  q({
    id: "social-05", topicId: "social", difficulty: "medium", title: "Self reactions",
    summary: "A member reacting to their own post.", role: "Community editor",
    context: "A self reaction is a reaction whose member also authored the post.",
    task: "Return handle, post_id, and kind. Sort by post_id.",
    requiredOutput: ["Columns: handle, post_id, kind", "Sorted by post_id"],
    rules: ["Join reactions to posts on post id and matching member id"], success: "Only self reactions remain.",
    orderMatters: true,
    hints: ["SELECT m.handle, p.id AS post_id, r.kind FROM reactions r JOIN posts p ON p.id = r.post_id AND p.member_id = r.member_id JOIN members m ON m.id = r.member_id ORDER BY post_id;"],
    solutionSql: `SELECT m.handle, p.id AS post_id, r.kind
FROM reactions r
JOIN posts p ON p.id = r.post_id AND p.member_id = r.member_id
JOIN members m ON m.id = r.member_id
ORDER BY post_id;`,
    tablesUsed: ["reactions", "posts", "members"], concept: "self match",
  }),
  q({
    id: "social-06", topicId: "social", difficulty: "hard", title: "Capstone member activity",
    summary: "Posts written and reactions received.", role: "Community editor",
    context: "The activity card counts posts a member wrote and reactions those posts received. A member with neither shows zeros.",
    task: "Return handle, posts_written, and reactions_received. Sort by handle.",
    requiredOutput: ["Columns: handle, posts_written, reactions_received", "Zeros allowed", "Sorted by handle"],
    rules: ["Aggregate posts and reactions separately so counts are not multiplied", "Left join both aggregates"], success: "Every member appears once.",
    orderMatters: true,
    hints: ["Pre-aggregate, then left join to members.", "SELECT m.handle, COALESCE(p.posts_written, 0) AS posts_written, COALESCE(r.reactions_received, 0) AS reactions_received FROM members m LEFT JOIN (SELECT member_id, COUNT(*) AS posts_written FROM posts GROUP BY member_id) p ON p.member_id = m.id LEFT JOIN (SELECT posts.member_id, COUNT(*) AS reactions_received FROM reactions JOIN posts ON posts.id = reactions.post_id GROUP BY posts.member_id) r ON r.member_id = m.id ORDER BY handle;"],
    solutionSql: `SELECT m.handle, COALESCE(p.posts_written, 0) AS posts_written, COALESCE(r.reactions_received, 0) AS reactions_received
FROM members m
LEFT JOIN (SELECT member_id, COUNT(*) AS posts_written FROM posts GROUP BY member_id) p ON p.member_id = m.id
LEFT JOIN (
  SELECT posts.member_id, COUNT(*) AS reactions_received
  FROM reactions JOIN posts ON posts.id = reactions.post_id
  GROUP BY posts.member_id
) r ON r.member_id = m.id
ORDER BY handle;`,
    tablesUsed: ["members", "posts", "reactions"], concept: "social capstone",
  }),
  q({
    id: "search-01", topicId: "search", difficulty: "easy", title: "Query log",
    summary: "List searches.", role: "Search analyst",
    context: "The log is every stored search and the day it ran.",
    task: "Return id, query_text, and searched_on.",
    requiredOutput: ["Columns: id, query_text, searched_on"],
    rules: ["Use queries"], success: "Every search appears, including one with no results.",
    hints: ["SELECT id, query_text, searched_on FROM queries;"],
    solutionSql: "SELECT id, query_text, searched_on FROM queries;",
    tablesUsed: ["queries"], concept: "select",
  }),
  q({
    id: "search-02", topicId: "search", difficulty: "easy", title: "Clicked results",
    summary: "Filter clicked = 1.", role: "Search analyst",
    context: "Clicks are stored as 1. Unclicked rows are 0.",
    task: "Return query_id, rank, and url for clicked results.",
    requiredOutput: ["Columns: query_id, rank, url"],
    rules: ["clicked = 1"], success: "Unclicked rows are gone.",
    hints: ["SELECT query_id, rank, url FROM results WHERE clicked = 1;"],
    solutionSql: "SELECT query_id, rank, url FROM results WHERE clicked = 1;",
    tablesUsed: ["results"], concept: "filter",
  }),
  q({
    id: "search-03", topicId: "search", difficulty: "medium", title: "Searches with no results",
    summary: "Anti-join the result table.", role: "Search analyst",
    context: "Quality wants searches that stored no result rows.",
    task: "Return query_text. Sort by query_text.",
    requiredOutput: ["Column: query_text", "Sorted by query_text"],
    rules: ["LEFT JOIN or NOT EXISTS"], success: "Only empty searches remain.",
    orderMatters: true,
    hints: ["SELECT q.query_text FROM queries q LEFT JOIN results r ON r.query_id = q.id WHERE r.query_id IS NULL ORDER BY q.query_text;"],
    solutionSql: `SELECT q.query_text FROM queries q
LEFT JOIN results r ON r.query_id = q.id WHERE r.query_id IS NULL ORDER BY q.query_text;`,
    tablesUsed: ["queries", "results"], concept: "anti-join",
  }),
  q({
    id: "search-04", topicId: "search", difficulty: "medium", title: "Clicks per search",
    summary: "Count clicks, including zero.", role: "Search analyst",
    context: "Every search should show how many of its results were clicked, including searches with no results.",
    task: "Return query_text and clicks. Sort by query_text.",
    requiredOutput: ["Columns: query_text, clicks", "Sorted by query_text"],
    rules: ["Sum clicked, which is 0 or 1, and COALESCE to 0"], success: "Empty searches show 0 clicks.",
    orderMatters: true,
    hints: ["SELECT q.query_text, COALESCE(SUM(r.clicked), 0) AS clicks FROM queries q LEFT JOIN results r ON r.query_id = q.id GROUP BY q.id, q.query_text ORDER BY query_text;"],
    solutionSql: `SELECT q.query_text, COALESCE(SUM(r.clicked), 0) AS clicks
FROM queries q LEFT JOIN results r ON r.query_id = q.id
GROUP BY q.id, q.query_text ORDER BY query_text;`,
    tablesUsed: ["queries", "results"], concept: "left aggregate",
  }),
  q({
    id: "search-05", topicId: "search", difficulty: "medium", title: "Most clicked address",
    summary: "Count clicks by url.", role: "Search analyst",
    context: "Which addresses were clicked, and how many times, from most clicked to least?",
    task: "Return url and clicks for addresses that were clicked at least once. Sort by clicks descending, then url.",
    requiredOutput: ["Columns: url, clicks", "That sort"],
    rules: ["WHERE clicked = 1 before counting, or HAVING SUM(clicked) > 0"], success: "Unclicked addresses are absent.",
    orderMatters: true,
    hints: ["SELECT url, COUNT(*) AS clicks FROM results WHERE clicked = 1 GROUP BY url ORDER BY clicks DESC, url;"],
    solutionSql: "SELECT url, COUNT(*) AS clicks FROM results WHERE clicked = 1 GROUP BY url ORDER BY clicks DESC, url;",
    tablesUsed: ["results"], concept: "group by",
  }),
  q({
    id: "search-06", topicId: "search", difficulty: "hard", title: "Capstone search quality",
    summary: "Result count, clicks, and top rank click.", role: "Search analyst",
    context: "The quality card shows, for every search, how many results it had, how many were clicked, and whether rank 1 was clicked.",
    task: "Return query_text, results, clicks, and top_clicked. results is the number of result rows. clicks sums the clicked flag. top_clicked is 1 when the rank 1 row was clicked, else 0. Searches with no results have 0, 0, 0. Sort by query_text.",
    requiredOutput: ["Columns: query_text, results, clicks, top_clicked", "Sorted by query_text"],
    rules: ["Left join results", "top_clicked uses a conditional max"], success: "Every search appears once.",
    orderMatters: true,
    hints: ["MAX(CASE WHEN r.rank = 1 AND r.clicked = 1 THEN 1 ELSE 0 END), then COALESCE.", "SELECT q.query_text, COUNT(r.rank) AS results, COALESCE(SUM(r.clicked), 0) AS clicks, COALESCE(MAX(CASE WHEN r.rank = 1 AND r.clicked = 1 THEN 1 ELSE 0 END), 0) AS top_clicked FROM queries q LEFT JOIN results r ON r.query_id = q.id GROUP BY q.id, q.query_text ORDER BY query_text;"],
    solutionSql: `SELECT q.query_text,
  COUNT(r.rank) AS results,
  COALESCE(SUM(r.clicked), 0) AS clicks,
  COALESCE(MAX(CASE WHEN r.rank = 1 AND r.clicked = 1 THEN 1 ELSE 0 END), 0) AS top_clicked
FROM queries q LEFT JOIN results r ON r.query_id = q.id
GROUP BY q.id, q.query_text
ORDER BY query_text;`,
    tablesUsed: ["queries", "results"], concept: "search capstone",
  }),
];
