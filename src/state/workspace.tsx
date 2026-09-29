import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SqlJsStatic } from "sql.js";
import { collections, questionsFor, runtimeName, topics } from "../data/catalog";
import { getSchema } from "../data/schemas";
import type { Question, Topic } from "../data/types";
import { compareGrids, type Grid } from "../lib/compare";
import { SITE } from "../content/about";
import { formatSql } from "../lib/sqlText";
import { loadSql, runExpected, runQuery } from "../lib/sqlRuntime";
import { shouldOfferGuide } from "../lib/visit";
import {
  emptyRecord,
  levelFor,
  loadProgress,
  saveProgress,
  type PanelState,
  type ProgressState,
  type QuestionRecord,
  type QuestionStatus,
} from "../lib/storage";

export type Source = "topics" | "company";
export type LayoutMode = "wide" | "medium" | "compact";
export type PaneId = "schema" | "editor" | "results" | "task";
export type MenuId = "topic" | "overflow" | null;
export type DialogId = "navigator" | "er" | "reset" | "solution" | "privacy" | "about" | null;

function readLayout(): LayoutMode {
  if (typeof window === "undefined") return "wide";
  if (window.matchMedia("(min-width: 1280px)").matches) return "wide";
  if (window.matchMedia("(min-width: 1024px)").matches) return "medium";
  return "compact";
}

function openingGuide() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  if (hash === "#about" || hash === "#privacy") {
    shouldOfferGuide();
    return false;
  }
  return shouldOfferGuide();
}

export type Route = {
  source: Source;
  topicId: string;
  index: number;
};

export type ResultState =
  | { kind: "idle" }
  | { kind: "error"; message: string; ms: number }
  | { kind: "grid"; grid: Grid; ms: number; match: boolean; diff?: string; awarded: boolean };

export type Snack = { tone: "info" | "success"; text: string } | null;

export type SamplePreview =
  | { ok: true; columns: string[]; rows: (string | number | null)[][]; truncated: boolean }
  | { ok: false; error: string };

type WorkspaceValue = {
  boot: "loading" | "ready" | "error";
  retryBoot: () => void;
  layout: LayoutMode;
  pane: PaneId;
  setPane: (pane: PaneId) => void;
  route: Route;
  topic: Topic;
  questions: Question[];
  question: Question;
  schemaName: string;
  databaseName: string;
  seedSql: string;
  progress: ProgressState;
  record: QuestionRecord;
  chip: "idle" | "progress" | "solved";
  sqlText: string;
  setSql: (text: string) => void;
  running: boolean;
  result: ResultState;
  expected: Grid | null;
  menu: MenuId;
  sampleTable: (tableName: string) => SamplePreview;
  setMenu: (menu: MenuId) => void;
  dialog: DialogId;
  setDialog: (dialog: DialogId) => void;
  sheet: boolean;
  setSheet: (open: boolean) => void;
  tour: number | null;
  setTour: (step: number | null) => void;
  snack: Snack;
  dismissSnack: () => void;
  live: string;
  level: number;
  celebrating: boolean;
  go: (route: Route) => void;
  setSource: (source: Source) => void;
  stepQuestion: (delta: number) => void;
  shareLink: () => void;
  run: () => void;
  format: () => void;
  revealHint: () => void;
  confirmSolution: () => void;
  copySolution: () => void;
  confirmReset: () => void;
  updatePanels: (partial: Partial<PanelState>, persist?: boolean) => void;
  registerInsert: (fn: ((text: string) => void) | null) => void;
  insertAtCursor: (text: string) => void;
  statusLine: string;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace is unavailable");
  return value;
}

function listFor(source: Source): Topic[] {
  return source === "company" ? collections : topics;
}

export function readRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const source: Source = params.get("source") === "company" ? "company" : "topics";
  const list = listFor(source);
  const key = source === "company" ? "collection" : "topic";
  const topic = list.find((item) => item.id === params.get(key)) ?? list[0];
  const questions = questionsFor(topic.id);
  const parsed = Number(params.get("q"));
  const index = Number.isInteger(parsed) && parsed >= 1 && parsed <= questions.length ? parsed - 1 : 0;
  return { source, topicId: topic.id, index };
}

function clipMeta(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  const cut = clean.slice(0, 157);
  const last = cut.lastIndexOf(" ");
  return `${(last > 80 ? cut.slice(0, last) : cut).trim()}...`;
}

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function writeUrl(route: Route, mode: "push" | "replace") {
  const params = new URLSearchParams();
  params.set("source", route.source);
  params.set(route.source === "company" ? "collection" : "topic", route.topicId);
  params.set("q", String(route.index + 1));
  const url = `${window.location.pathname}?${params.toString()}`;
  if (mode === "push") history.pushState({ route }, "", url);
  else history.replaceState({ route }, "", url);
}

function questionAt(route: Route): Question {
  const list = listFor(route.source);
  const topic = list.find((item) => item.id === route.topicId) ?? list[0];
  const questions = questionsFor(topic.id);
  return questions[Math.min(route.index, questions.length - 1)] ?? questions[0];
}

function recordOf(progress: ProgressState, id: string): QuestionRecord {
  return progress.questions[id] ?? emptyRecord();
}

function withRecord(progress: ProgressState, id: string, patch: Partial<QuestionRecord>): ProgressState {
  return {
    ...progress,
    questions: {
      ...progress.questions,
      [id]: { ...recordOf(progress, id), ...patch },
    },
  };
}

export function chipFor(status: QuestionStatus): "idle" | "progress" | "solved" {
  if (status === "solved") return "solved";
  if (status === "attempted" || status === "in-progress" || status === "skipped") return "progress";
  return "idle";
}

export function statusLabel(status: QuestionStatus) {
  if (status === "not-started") return "Not started";
  if (status === "in-progress") return "In progress";
  if (status === "attempted") return "Attempted";
  if (status === "skipped") return "Skipped";
  return "Solved";
}

export function chipLabel(chip: "idle" | "progress" | "solved") {
  if (chip === "solved") return "Solved";
  if (chip === "progress") return "In Progress";
  return "Not Started";
}

function clampRoute(route: Route): Route {
  const list = listFor(route.source);
  const topic = list.find((item) => item.id === route.topicId) ?? list[0];
  const count = questionsFor(topic.id).length;
  const index = Math.max(0, Math.min(route.index, count - 1));
  return { source: route.source, topicId: topic.id, index };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const [route, setRoute] = useState<Route>(() => clampRoute(readRoute()));
  const routeRef = useRef(route);
  routeRef.current = route;

  const question = questionAt(route);
  const questions = questionsFor(
    (listFor(route.source).find((item) => item.id === route.topicId) ?? listFor(route.source)[0]).id,
  );
  const topic = listFor(route.source).find((item) => item.id === route.topicId) ?? listFor(route.source)[0];
  const schema = getSchema(topic.schemaId);

  const [sqlText, setSqlText] = useState(() => recordOf(progress, question.id).lastSql ?? question.starterSql);
  const sqlRef = useRef(sqlText);
  sqlRef.current = sqlText;

  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const [bootAttempt, setBootAttempt] = useState(0);
  const [sqlModule, setSqlModule] = useState<SqlJsStatic | null>(null);
  const sqlModuleRef = useRef<SqlJsStatic | null>(null);
  sqlModuleRef.current = sqlModule;

  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [expected, setExpected] = useState<Grid | null>(null);
  const [menu, setMenu] = useState<MenuId>(null);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [sheet, setSheet] = useState(() => openingGuide() && readLayout() === "medium");
  const [tour, setTour] = useState<number | null>(() => (openingGuide() ? 0 : null));
  const [snack, setSnack] = useState<Snack>(null);
  const [live, setLive] = useState("");
  const [layout, setLayout] = useState<LayoutMode>(readLayout);
  const [pane, setPane] = useState<PaneId>(() => (openingGuide() && readLayout() === "compact" ? "task" : "editor"));
  const [celebrating, setCelebrating] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const insertRef = useRef<((text: string) => void) | null>(null);
  const registerInsert = useCallback((fn: ((text: string) => void) | null) => {
    insertRef.current = fn;
  }, []);
  const insertAtCursor = useCallback((text: string) => {
    insertRef.current?.(text);
  }, []);

  const memory = useRef<Record<string, Route>>({
    topics: route.source === "topics" ? route : { source: "topics", topicId: topics[0].id, index: 0 },
    company: route.source === "company" ? route : { source: "company", topicId: collections[0].id, index: 0 },
  });

  const announce = useCallback((text: string) => {
    setLive("");
    window.setTimeout(() => setLive(text), 30);
  }, []);

  const showSnack = useCallback(
    (next: Snack) => {
      setSnack(next);
      if (next) announce(next.text);
    },
    [announce],
  );

  const commit = useCallback((next: ProgressState) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  const patch = useCallback(
    (updater: (current: ProgressState) => ProgressState) => {
      commit(updater(progressRef.current));
    },
    [commit],
  );

  const hydrate = useCallback((nextQuestion: Question, snapshot: ProgressState) => {
    const saved = recordOf(snapshot, nextQuestion.id);
    setSqlText(saved.lastSql ?? nextQuestion.starterSql);
    setResult({ kind: "idle" });
  }, []);

  const go = useCallback(
    (requested: Route, historyMode: "push" | "replace" | "none" = "push") => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
      setCelebrating(false);
      const next = clampRoute(requested);
      const current = routeRef.current;
      const same = current.source === next.source && current.topicId === next.topicId && current.index === next.index;
      if (same) {
        setMenu(null);
        return;
      }
      memory.current[current.source] = current;
      memory.current[next.source] = next;
      hydrate(questionAt(next), progressRef.current);
      routeRef.current = next;
      setRoute(next);
      if (historyMode !== "none") writeUrl(next, historyMode === "replace" ? "replace" : "push");
      setMenu(null);
      setDialog(null);
      if (layoutRef.current === "compact") setPane("editor");
    },
    [hydrate],
  );

  const setSql = useCallback(
    (text: string) => {
      setSqlText(text);
      const currentQuestion = questionAt(routeRef.current);
      patch((current) => {
        const rec = recordOf(current, currentQuestion.id);
        let status = rec.status;
        if (status !== "solved" && status !== "attempted") {
          const pristine = text === currentQuestion.starterSql && rec.hintsUsed === 0 && !rec.solutionSeen;
          status = pristine ? "not-started" : "in-progress";
        }
        return withRecord(current, currentQuestion.id, { lastSql: text, status });
      });
    },
    [patch],
  );

  useEffect(() => {
    writeUrl(routeRef.current, "replace");
    const onPop = () => {
      go(readRoute(), "none");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [go]);

  useEffect(() => {
    let cancel = false;
    setBoot("loading");
    loadSql(bootAttempt > 0)
      .then((mod) => {
        if (cancel) return;
        setSqlModule(mod);
        setBoot("ready");
      })
      .catch(() => {
        if (!cancel) setBoot("error");
      });
    return () => {
      cancel = true;
    };
  }, [bootAttempt]);

  useEffect(() => {
    if (!sqlModule) return;
    const outcome = runExpected(sqlModule, schema.seedSql, question.solutionSql, question.checkSql);
    setExpected(outcome.ok ? outcome.grid : null);
  }, [sqlModule, schema.seedSql, question.id, question.checkSql, question.solutionSql]);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1280px)");
    const medium = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      const next = wide.matches ? "wide" : medium.matches ? "medium" : "compact";
      setLayout(next);
      if (next !== "medium") setSheet(false);
    };
    apply();
    wide.addEventListener("change", apply);
    medium.addEventListener("change", apply);
    return () => {
      wide.removeEventListener("change", apply);
      medium.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    const color = getComputedStyle(document.body).backgroundColor;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("source", route.source);
    params.set(route.source === "company" ? "collection" : "topic", route.topicId);
    params.set("q", String(route.index + 1));
    const url = `${SITE}/?${params.toString()}`;
    document.title = `Learn SQL: ${question.title} · ${topic.name} · SQL Learn`;
    const summary = question.summary.replace(/\.$/, "");
    const body = question.task.includes(summary) ? question.task : `${question.summary} ${question.task}`;
    const description = clipMeta(`${body} Practice this SQL exercise in the browser.`);
    setMeta("description", description);
    setMeta("og:title", document.title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", url);
  }, [question.summary, question.task, question.title, route.index, route.source, route.topicId, topic.name]);

  useEffect(() => {
    if (!snack) return;
    const timer = window.setTimeout(() => setSnack(null), snack.tone === "success" ? 3200 : 4200);
    return () => window.clearTimeout(timer);
  }, [snack]);

  const run = useCallback(() => {
    const SQL = sqlModuleRef.current;
    if (!SQL || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    const currentQuestion = questionAt(routeRef.current);
    const currentSchema = getSchema(
      (listFor(routeRef.current.source).find((item) => item.id === routeRef.current.topicId) ?? topics[0]).schemaId,
    );
    const text = sqlRef.current;
    window.setTimeout(() => {
      const started = performance.now();
      const outcome = runQuery(SQL, currentSchema.seedSql, text, currentQuestion.checkSql);
      const expectedOutcome = runExpected(
        SQL,
        currentSchema.seedSql,
        currentQuestion.solutionSql,
        currentQuestion.checkSql,
      );
      const wait = Math.max(0, 120 - (performance.now() - started));
      window.setTimeout(() => {
        runningRef.current = false;
        setRunning(false);
        let showResults = true;
        const rec = recordOf(progressRef.current, currentQuestion.id);
        if (!outcome.ok) {
          setResult({ kind: "error", message: outcome.error, ms: outcome.ms });
          announce(outcome.error);
          if (rec.status !== "solved") {
            patch((current) => ({
              ...withRecord(current, currentQuestion.id, { status: "attempted" }),
              streak: 0,
            }));
          }
        } else if (!expectedOutcome.ok) {
          setResult({ kind: "error", message: expectedOutcome.error, ms: outcome.ms });
          announce(expectedOutcome.error);
        } else {
          const compared = compareGrids(outcome.grid, expectedOutcome.grid, {
            orderMatters: currentQuestion.orderMatters,
            columnOrderMatters: currentQuestion.columnOrderMatters,
          });
          if (compared.ok) {
            const awarded = !rec.scored;
            patch((current) => ({
              ...withRecord(current, currentQuestion.id, { status: "solved", scored: true }),
              xp: current.xp + (awarded ? 10 : 0),
              streak: awarded ? current.streak + 1 : current.streak,
            }));
            setResult({
              kind: "grid",
              grid: outcome.grid,
              ms: outcome.ms,
              match: true,
              awarded,
            });
            showSnack({
              tone: "success",
              text: awarded ? "Correct · +10 XP" : "Correct · already scored",
            });
            showResults = false;
            if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
            setCelebrating(true);
            const from = { ...routeRef.current };
            const total = questionsFor(from.topicId).length;
            advanceTimer.current = window.setTimeout(() => {
              advanceTimer.current = null;
              const still = routeRef.current;
              const samePlace = still.source === from.source && still.topicId === from.topicId && still.index === from.index;
              if (samePlace && from.index < total - 1) go({ ...from, index: from.index + 1 });
              else setCelebrating(false);
            }, 2000);
          } else {
            if (rec.status !== "solved") {
              patch((current) => ({
                ...withRecord(current, currentQuestion.id, { status: "attempted" }),
                streak: 0,
              }));
            }
            setResult({
              kind: "grid",
              grid: outcome.grid,
              ms: outcome.ms,
              match: false,
              diff: compared.message,
              awarded: false,
            });
            announce(compared.message);
          }
        }
        if (layoutRef.current === "compact") setPane(showResults ? "results" : "editor");
      }, wait);
    }, 16);
  }, [announce, go, patch, showSnack]);

  const format = useCallback(() => {
    setSql(formatSql(sqlRef.current));
  }, [setSql]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key === "Enter") {
        event.preventDefault();
        run();
        return;
      }
      if (meta && event.shiftKey && (event.key === "F" || event.key === "f")) {
        event.preventDefault();
        format();
        return;
      }
      if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const current = routeRef.current;
        const count = questionsFor(current.topicId).length;
        const index = current.index + (event.key === "ArrowRight" ? 1 : -1);
        if (index >= 0 && index < count) go({ ...current, index });
        return;
      }
      if (event.key !== "Escape") return;
      if (tour !== null) {
        setTour(null);
        return;
      }
      if (menu) {
        setMenu(null);
        return;
      }
      if (dialog === "about" || dialog === "privacy") {
        const hash = dialog === "about" ? "#about" : "#privacy";
        if (window.location.hash === hash) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }
      }
      if (dialog === "solution" || dialog === "reset" || dialog === "navigator" || dialog === "er" || dialog === "privacy" || dialog === "about") {
        setDialog(null);
        return;
      }
      if (sheet) setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [format, go, menu, dialog, sheet, tour, run]);

  const sampleTable = useCallback(
    (tableName: string): SamplePreview => {
      const SQL = sqlModuleRef.current;
      if (!SQL) {
        return { ok: false, error: boot === "error" ? "The database runtime did not start." : "The database is still starting." };
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) return { ok: false, error: "That table is not available." };
      const outcome = runQuery(SQL, schema.seedSql, `SELECT * FROM "${tableName}" LIMIT 4`);
      if (!outcome.ok) return { ok: false, error: outcome.error };
      return {
        ok: true,
        columns: outcome.grid.columns,
        rows: outcome.grid.values.slice(0, 3),
        truncated: outcome.grid.values.length > 3,
      };
    },
    [boot, schema.seedSql],
  );

  const value = useMemo<WorkspaceValue>(() => {
    const rec = recordOf(progress, question.id);
    let last = "No query executed";
    if (result.kind === "error") last = "Error";
    if (result.kind === "grid") last = `${result.grid.values.length} rows · ${result.ms} ms`;
    const runtime =
      boot === "ready" ? "Runtime ready" : boot === "error" ? "Runtime failed" : "Starting runtime";
    return {
      boot,
      retryBoot: () => setBootAttempt((attempt) => attempt + 1),
      layout,
      pane,
      setPane,
      route,
      topic,
      questions,
      question,
      schemaName: schema.id,
      databaseName: schema.databaseName,
      seedSql: schema.seedSql,
      progress,
      record: rec,
      chip: chipFor(rec.status),
      sqlText,
      setSql,
      running,
      result,
      expected,
      menu,
      sampleTable,
      setMenu,
      dialog,
      setDialog,
      sheet,
      setSheet,
      tour,
      setTour,
      snack,
      dismissSnack: () => setSnack(null),
      live,
      level: levelFor(progress.xp),
      celebrating,
      go: (next) => go(next),
      setSource: (source) => {
        const remembered = memory.current[source] ?? {
          source,
          topicId: listFor(source)[0].id,
          index: 0,
        };
        go({ ...remembered, source });
      },
      stepQuestion: (delta) => {
        const next = route.index + delta;
        if (next < 0 || next >= questions.length) return;
        go({ ...route, index: next });
      },
      shareLink: () => {
        const params = new URLSearchParams();
        params.set("source", route.source);
        params.set(route.source === "company" ? "collection" : "topic", route.topicId);
        params.set("q", String(route.index + 1));
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        const label = `${schema.databaseName} · ${question.title}`;
        void navigator.clipboard.writeText(url).then(
          () => showSnack({ tone: "info", text: `Link copied · ${label}` }),
          () => showSnack({ tone: "info", text: url }),
        );
      },
      run,
      format,
      revealHint: () => {
        const recNow = recordOf(progressRef.current, question.id);
        if (recNow.hintsUsed >= question.hints.length) return;
        patch((current) => {
          const currentRecord = recordOf(current, question.id);
          const status =
            currentRecord.status === "solved" || currentRecord.status === "attempted"
              ? currentRecord.status
              : "in-progress";
          return withRecord(current, question.id, { hintsUsed: currentRecord.hintsUsed + 1, status });
        });
      },
      confirmSolution: () => {
        patch((current) => {
          const currentRecord = recordOf(current, question.id);
          const status =
            currentRecord.status === "solved" || currentRecord.status === "attempted"
              ? currentRecord.status
              : "in-progress";
          return withRecord(current, question.id, { solutionSeen: true, status });
        });
        setDialog(null);
      },
      copySolution: () => setSql(question.solutionSql.endsWith("\n") ? question.solutionSql : `${question.solutionSql}\n`),
      confirmReset: () => {
        const next: ProgressState = {
          ...progressRef.current,
          xp: 0,
          streak: 0,
          questions: {},
        };
        commit(next);
        setSqlText(question.starterSql);
        setResult({ kind: "idle" });
        setDialog(null);
        announce("Progress cleared");
      },
      registerInsert,
      insertAtCursor,
      updatePanels: (partial, persist = true) => {
        const next = { ...progressRef.current, panels: { ...progressRef.current.panels, ...partial } };
        progressRef.current = next;
        setProgress(next);
        if (persist) saveProgress(next);
      },
      statusLine: `${runtime} · ${runtimeName} · ${schema.databaseName} · ${last}`,
    };
  }, [
    boot,
    layout,
    pane,
    route,
    topic,
    questions,
    question,
    schema,
    progress,
    sqlText,
    setSql,
    running,
    result,
    expected,
    menu,
    sampleTable,
    dialog,
    sheet,
    tour,
    snack,
    live,
    celebrating,
    announce,
    showSnack,
    patch,
    go,
    run,
    format,
    commit,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
