import fs from "fs";
import path from "path";

const dir = "icons-repo";
const map = {
  "triangle-exclamation-svgrepo-com (1).svg": "warning.svg",
  "arrow-down-to-line-svgrepo-com.svg": "download.svg",
  "maximize-svgrepo-com.svg": "expand.svg",
  "cursor-svgrepo-com.svg": "cursor.svg",
  "angles-right-svgrepo-com.svg": "chevrons-right.svg",
  "circle-user-svgrepo-com.svg": "user.svg",
  "circle-3-dots-horizontal-svgrepo-com (1).svg": "more.svg",
  "gem-svgrepo-com.svg": "gem.svg",
  "pencil-square-svgrepo-com (1).svg": "edit.svg",
  "circle-stop-svgrepo-com.svg": "stop.svg",
  "lock-closed-svgrepo-com.svg": "lock.svg",
  "sparkles-svgrepo-com.svg": "sparkles.svg",
  "wifi-slash-svgrepo-com.svg": "wifi-off.svg",
  "angle-left-svgrepo-com.svg": "chevron-left.svg",
  "lock-open-svgrepo-com.svg": "unlock.svg",
  "bishop-svgrepo-com.svg": "bishop.svg",
  "checkmark-svgrepo-com (1).svg": "check.svg",
  "share-nodes-svgrepo-com (1).svg": "diagram.svg",
  "angle-down-svgrepo-com.svg": "chevron-down.svg",
  "wifi-svgrepo-com.svg": "wifi.svg",
  "bomb-svgrepo-com.svg": "bomb.svg",
  "angle-right-svgrepo-com (1).svg": "chevron-right.svg",
  "copy-svgrepo-com (1).svg": "copy.svg",
  "shuffle-svgrepo-com.svg": "shuffle.svg",
  "bolt-svgrepo-com (1).svg": "bolt.svg",
  "square-x-svgrepo-com.svg": "close-square.svg",
  "link-svgrepo-com.svg": "link.svg",
  "funnel-svgrepo-com.svg": "filter.svg",
  "cursor-click-svgrepo-com.svg": "click.svg",
  "terminal-svgrepo-com.svg": "terminal.svg",
  "bookmark-svgrepo-com.svg": "bookmark.svg",
  "key-skeleton-svgrepo-com.svg": "key.svg",
  "font-case-svgrepo-com.svg": "format.svg",
  "bell-svgrepo-com.svg": "bell.svg",
  "accessibility-svgrepo-com.svg": "accessibility.svg",
  "code-block-svgrepo-com (1).svg": "code.svg",
  "circle-play-svgrepo-com.svg": "play.svg",
  "bullhorn-svgrepo-com (1).svg": "megaphone.svg",
  "square-checkmark-svgrepo-com.svg": "check-square.svg",
  "cog-svgrepo-com.svg": "settings.svg",
  "bug-svgrepo-com.svg": "bug.svg",
  "angles-left-svgrepo-com.svg": "chevrons-left.svg",
  "arrow-rotate-right-svgrepo-com.svg": "reset.svg",
  "angle-up-svgrepo-com.svg": "chevron-up.svg",
  "floppy-disk-svgrepo-com.svg": "save.svg",
  "x-1-svgrepo-com.svg": "close.svg",
  "folder-open-svgrepo-com.svg": "folder.svg",
  "comment-dots-svgrepo-com (1).svg": "comment.svg",
  "circle-info-svgrepo-com.svg": "info.svg",
  "fire-svgrepo-com.svg": "fire.svg",
};

const files = fs.readdirSync(dir);
const already = files.every((f) => f.endsWith(".svg") && !f.includes("svgrepo"));
if (!already) {
  const missing = Object.keys(map).filter((k) => !files.includes(k));
  const extra = files.filter((f) => !map[f]);
  if (missing.length || extra.length) {
    console.log("MISSING", missing);
    console.log("EXTRA", extra);
    process.exit(1);
  }
  for (const [from, to] of Object.entries(map)) {
    fs.renameSync(path.join(dir, from), path.join(dir, to));
  }
}

const icons = {};
const odd = [];
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const vb = raw.match(/viewBox="([^"]+)"/);
  const bodyMatch = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!vb || !bodyMatch) {
    odd.push(`${file} parse`);
    continue;
  }
  let body = bodyMatch[1].replace(/<!--[\s\S]*?-->/g, "").trim();
  const colors = [...body.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]);
  const weird = colors.filter((c) => !["#000", "#000000", "none", "currentColor"].includes(c));
  if (weird.length) odd.push(`${file} ${weird.join(",")}`);
  body = body
    .replaceAll('fill="#000000"', 'fill="currentColor"')
    .replaceAll('fill="#000"', 'fill="currentColor"')
    .replaceAll('stroke="#000000"', 'stroke="currentColor"')
    .replaceAll('stroke="#000"', 'stroke="currentColor"');
  icons[file.replace(/\.svg$/, "")] = { viewBox: vb[1], body };
}

fs.mkdirSync("src/icons", { recursive: true });
const source = `/* Generated from icons-repo. Paths inherit currentColor. */\nexport const ICONS = ${JSON.stringify(icons, null, 2)} as const;\n\nexport type IconName = keyof typeof ICONS;\n`;
fs.writeFileSync("src/icons/icons.ts", source);
console.log(`icons ${Object.keys(icons).length}`);
console.log(`odd ${odd.join(" | ") || "none"}`);
console.log(Object.keys(icons).join(", "));
