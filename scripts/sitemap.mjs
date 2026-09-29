import fs from "fs";

function sliceExport(source, name) {
  const start = source.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`missing ${name}`);
  const next = source.indexOf("\nexport const ", start + 10);
  const body = source.slice(start, next === -1 ? source.length : next);
  return [...body.matchAll(/topicId:\s*"([^"]+)"/g)].map((match) => match[1]);
}

const read = (file) => fs.readFileSync(file, "utf8");
const order = [
  ["src/data/questions/select.ts", "selectQuestions"],
  ["src/data/questions/core.ts", "whereQuestions"],
  ["src/data/questions/core.ts", "aggregationQuestions"],
  ["src/data/questions/core.ts", "orderQuestions"],
  ["src/data/questions/core.ts", "limitQuestions"],
  ["src/data/questions/functions.ts", "functionQuestions"],
  ["src/data/questions/functions.ts", "duplicateQuestions"],
  ["src/data/questions/ranking.ts", "rankingQuestions"],
  ["src/data/questions/functions.ts", "caseQuestions"],
  ["src/data/questions/joins.ts", "joinQuestions"],
  ["src/data/questions/structure.ts", "selfJoinQuestions"],
  ["src/data/questions/structure.ts", "subqueryQuestions"],
  ["src/data/questions/windows.ts", "windowQuestions"],
  ["src/data/questions/structure.ts", "dmlQuestions"],
  ["src/data/questions/dates.ts", "dateQuestions"],
  ["src/data/questions/clinic.ts", "clinicQuestions"],
  ["src/data/questions/company.ts", "companyQuestions"],
];

const counts = {};
for (const [file, name] of order) {
  for (const topic of sliceExport(read(file), name)) counts[topic] = (counts[topic] ?? 0) + 1;
}

const topics = [
  "select",
  "where",
  "aggregations",
  "order-by",
  "limit-offset",
  "functions",
  "duplicates",
  "ranking",
  "case",
  "joins",
  "self-joins",
  "subqueries",
  "windows",
  "dml",
  "dates",
  "clinic",
];
const collections = ["ecommerce", "streaming", "social", "search"];
const origin = "https://sqllearn.bitilia.com";
const urls = [`${origin}/`];

for (const id of topics) {
  const count = counts[id] ?? 0;
  if (!count) throw new Error(`no count ${id}`);
  for (let q = 1; q <= count; q += 1) urls.push(`${origin}/?source=topics&topic=${id}&q=${q}`);
}
for (const id of collections) {
  const count = counts[id] ?? 0;
  if (!count) throw new Error(`no count ${id}`);
  for (let q = 1; q <= count; q += 1) urls.push(`${origin}/?source=company&collection=${id}&q=${q}`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc.replaceAll("&", "&amp;")}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync("public/sitemap.xml", xml);
console.log(JSON.stringify({ urls: urls.length, counts }));
