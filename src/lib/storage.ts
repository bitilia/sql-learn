export type QuestionStatus = "not-started" | "in-progress" | "attempted" | "skipped" | "solved";

export type QuestionRecord = {
  status: QuestionStatus;
  hintsUsed: number;
  lastSql: string | null;
  scored: boolean;
  solutionSeen: boolean;
};

export type PanelState = {
  left: number;
  right: number;
  editorRatio: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
};

export type ProgressState = {
  xp: number;
  streak: number;
  theme: "light" | "dark" | "system";
  panels: PanelState;
  questions: Record<string, QuestionRecord>;
};

export const STORAGE_KEY = "sql-practice-online-v1";

export const defaultPanels = (): PanelState => ({
  left: 240,
  right: 340,
  editorRatio: 0.58,
  leftCollapsed: false,
  rightCollapsed: false,
});

export function emptyRecord(): QuestionRecord {
  return {
    status: "not-started",
    hintsUsed: 0,
    lastSql: null,
    scored: false,
    solutionSeen: false,
  };
}

export function defaultProgress(): ProgressState {
  return {
    xp: 0,
    streak: 0,
    theme: "system",
    panels: defaultPanels(),
    questions: {},
  };
}

function normalizeQuestions(questions: ProgressState["questions"] | undefined): ProgressState["questions"] {
  if (!questions) return {};
  const next: ProgressState["questions"] = {};
  for (const [id, record] of Object.entries(questions)) {
    if (!record) continue;
    next[id] = record.status === "skipped" ? { ...record, status: "in-progress" } : record;
  }
  return next;
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const base = defaultProgress();
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      theme: parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system" ? parsed.theme : "system",
      panels: { ...base.panels, ...(parsed.panels ?? {}) },
      questions: normalizeQuestions(parsed.questions),
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function levelFor(xp: number) {
  return 1 + Math.floor(xp / 100);
}
