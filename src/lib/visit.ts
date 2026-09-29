const COOKIE = "sql_learn_seen";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

let decided: boolean | null = null;

export function guideIsDue(lastSeen: number | null, now: number) {
  if (lastSeen === null) return true;
  return now - lastSeen > WEEK_MS;
}

function readSeen() {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  if (!row) return null;
  const value = Number(row.slice(COOKIE.length + 1));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function writeSeen(now: number) {
  document.cookie = `${COOKIE}=${Math.trunc(now)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function shouldOfferGuide(now = Date.now()) {
  if (decided !== null) return decided;
  decided = guideIsDue(readSeen(), now);
  writeSeen(now);
  return decided;
}
