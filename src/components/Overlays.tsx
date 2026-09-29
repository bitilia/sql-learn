import { useLayoutEffect, useRef, useState } from "react";
import { aboutFaq, aboutLead, aboutSections } from "../content/about";
import { allQuestions, collections, topics } from "../data/catalog";
import { getSchema, relationshipsFor } from "../data/schemas";
import { emptyRecord, type QuestionStatus } from "../lib/storage";
import { statusLabel, useWorkspace, type LayoutMode } from "../state/workspace";
import { Icon, type IconName } from "./Icon";
import { useFocusTrap } from "./useFocusTrap";
import { ChallengeCard } from "./ChallengeCard";

const STEPS: { id: string; title: string; body: string | Record<LayoutMode, string> }[] = [
  {
    id: "challenge",
    title: "Read the brief",
    body: {
      wide: "This card is the task. It says what the query should return and the rules to follow. Read it before you write.",
      medium: "The task sits off this screen. The button at the lower right opens it. Read the card before you write the query.",
      compact: "The task is the Task tab at the bottom of the screen. Read the card before you write the query.",
    },
  },
  {
    id: "editor",
    title: "Write the query",
    body: "Write the statement in this box. Tables and columns appear as you type.",
  },
  {
    id: "run",
    title: "Run it",
    body: "Run checks your rows against the expected result. The first match on a question awards 10 XP.",
  },
  {
    id: "topics",
    title: "Other tasks",
    body: "Learn SQL and SQL Challenges are separate sets of questions. Open the list to pick a different task.",
  },
];

function statusIcon(status: QuestionStatus): IconName {
  if (status === "solved") return "check";
  if (status === "in-progress") return "bolt";
  if (status === "attempted") return "edit";
  if (status === "skipped") return "close";
  return "stop";
}

export function Overlays() {
  const workspace = useWorkspace();
  return (
    <>
      {workspace.dialog === "reset" ? <ResetDialog /> : null}
      {workspace.dialog === "solution" ? <SolutionDialog /> : null}
      {workspace.dialog === "navigator" ? <NavigatorDialog /> : null}
      {workspace.dialog === "er" ? <DiagramDialog /> : null}
      {workspace.dialog === "privacy" ? <PrivacyDialog /> : null}
      <AboutDialog open={workspace.dialog === "about"} />
      {workspace.sheet ? <ChallengeSheet /> : null}
      {workspace.tour !== null ? <Tour /> : null}
      {workspace.snack ? (
        <div className={workspace.snack.tone === "success" ? "snackbar success" : "snackbar"} role="status">
          <Icon name={workspace.snack.tone === "success" ? "check" : "info"} size={16} />
          <span>{workspace.snack.text}</span>
          <button className="icon-btn" type="button" aria-label="Dismiss message" onClick={workspace.dismissSnack}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : null}
    </>
  );
}

function ResetDialog() {
  const { setDialog, confirmReset } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  return (
    <div className="scrim" onMouseDown={() => setDialog(null)}>
      <div
        className="dialog narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-hd">
          <h2 id="reset-title">Reset progress</h2>
          <button className="icon-btn" type="button" aria-label="Close reset dialog" onClick={() => setDialog(null)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <p>Clear every exercise record, XP, and streak. Panel sizes stay as they are.</p>
          <div className="dialog-actions">
            <button className="btn btn-text" type="button" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button className="btn btn-filled" type="button" onClick={confirmReset}>
              Clear progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionDialog() {
  const { setDialog, confirmSolution } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  return (
    <div className="scrim" onMouseDown={() => setDialog(null)}>
      <div
        className="dialog narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-hd">
          <h2 id="solution-title">Show solution</h2>
          <button className="icon-btn" type="button" aria-label="Close solution dialog" onClick={() => setDialog(null)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <p>Reveal the reference solution for this exercise. You can copy it into the editor afterwards.</p>
          <div className="dialog-actions">
            <button className="btn btn-text" type="button" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button className="btn btn-tonal" type="button" onClick={confirmSolution}>
              Show solution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavigatorDialog() {
  const { topic, questions, route, progress, question, go, setDialog } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  const records = questions.map((item) => progress.questions[item.id] ?? emptyRecord());
  const solved = records.filter((item) => item.status === "solved").length;
  const skipped = records.filter((item) => item.status === "skipped").length;
  const attempted = records.filter((item) => item.status === "attempted").length;
  const remaining = questions.length - solved;
  const percent = questions.length === 0 ? 0 : Math.round((solved / questions.length) * 100);
  const sourceIds = new Set((route.source === "company" ? collections : topics).map((item) => item.id));
  const sourceQuestions = allQuestions.filter((item) => sourceIds.has(item.topicId));
  const overallSolved = sourceQuestions.filter((item) => progress.questions[item.id]?.status === "solved").length;
  const overallPercent = sourceQuestions.length === 0 ? 0 : Math.round((overallSolved / sourceQuestions.length) * 100);
  const weak = [...new Set(questions.filter((_, index) => records[index].status === "attempted").map((item) => item.concept))];
  const recommendedIndex = questions.findIndex((_, index) => index > route.index && records[index].status !== "solved");
  const fallbackIndex = questions.findIndex((_, index) => records[index].status !== "solved");
  const recommended = recommendedIndex >= 0 ? recommendedIndex : fallbackIndex;
  const groups = [
    ["easy", "Easy"],
    ["medium", "Medium"],
    ["hard", "Hard"],
  ] as const;

  return (
    <div className="scrim" onMouseDown={() => setDialog(null)}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-hd">
          <h2 id="nav-title">Questions Status</h2>
          <button className="icon-btn" type="button" aria-label="Close question navigator" onClick={() => setDialog(null)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <div className="stat-row">
            <span className="status-chip solved">Solved {solved}</span>
            <span className="status-chip progress">Skipped {skipped}</span>
            <span className="status-chip progress">Attempted {attempted}</span>
            <span className="status-chip idle">Streak {progress.streak}</span>
            <span className="status-chip idle">Remaining {remaining}</span>
            <div className="pct-block">
              <strong>
                {percent}% ({solved}/{questions.length})
              </strong>
              <div className="progress-track" aria-hidden="true">
                <div className="progress-bar" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
          <div className="insight-grid">
            <article className="nav-card">
              <p className="card-hd">Progress insights</p>
              <p>{percent < 50 ? "Needs reps" : "On track"}</p>
              <div className="tiles">
                <div className="tile">
                  <span>Overall %</span>
                  <strong>{overallPercent}</strong>
                </div>
                <div className="tile">
                  <span>Topic %</span>
                  <strong>{percent}</strong>
                </div>
              </div>
              <p className="subtle">Weakest concepts</p>
              {weak.length === 0 ? <p>No weak spots yet.</p> : <ul>{weak.slice(0, 3).map((concept) => <li key={concept}>{concept}</li>)}</ul>}
            </article>
            <article className="nav-card">
              <p className="card-hd">
                <Icon name="click" size={16} />
                Recommended next lab
              </p>
              {recommended < 0 ? (
                <p>Every question in {topic.name} is solved.</p>
              ) : (
                <>
                  <p>{questions[recommended].title}</p>
                  <p className="subtle">{questions[recommended].summary}</p>
                  <span className="assist">{questions[recommended].concept}</span>
                  <div className="dialog-actions">
                    <button className="btn btn-filled" type="button" onClick={() => go({ ...route, index: recommended })}>
                      Open recommended lab
                    </button>
                  </div>
                </>
              )}
            </article>
          </div>
          {groups.map(([difficulty, label]) => {
            const group = questions
              .map((item, index) => ({ item, index, record: records[index] }))
              .filter((entry) => entry.item.difficulty === difficulty);
            const done = group.filter((entry) => entry.record.status === "solved").length;
            return (
              <section className="q-group" key={difficulty}>
                <h3>
                  {label} · {group.length} questions · {done}/{group.length} completed
                </h3>
                {group.map(({ item, index, record }) => (
                  <button
                    className={item.id === question.id ? "q-row current" : "q-row"}
                    type="button"
                    key={item.id}
                    onClick={() => go({ ...route, index })}
                  >
                    <Icon name={statusIcon(record.status)} size={16} />
                    <span>
                      {item.title}
                      <small>{item.summary}</small>
                    </span>
                    <span className={`status-chip ${record.status === "solved" ? "solved" : record.status === "not-started" ? "idle" : "progress"}`}>
                      {statusLabel(record.status)}
                    </span>
                  </button>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AboutDialog({ open }: { open: boolean }) {
  const { setDialog } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);
  const close = () => closeHash("#about", setDialog);
  return (
    <div className="scrim" hidden={!open} onMouseDown={close}>
      <div
        className="dialog about-dialog"
        role="dialog"
        aria-modal={open}
        aria-labelledby="about-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-hd">
          <h2 id="about-title">About SQL Learn</h2>
          <button className="icon-btn" type="button" aria-label="Close about" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body about-copy">
          <p>{aboutLead}</p>
          {aboutSections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.steps ? (
                <ol>
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : null}
            </section>
          ))}
          <section>
            <h3>Questions about learning SQL</h3>
            {aboutFaq.map((item) => (
              <div className="faq-item" key={item.question}>
                <h4>{item.question}</h4>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function closeHash(hash: string, setDialog: (dialog: null) => void) {
  if (window.location.hash === hash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  setDialog(null);
}

function PrivacyDialog() {
  const { setDialog } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  return (
    <div className="scrim" onMouseDown={() => closeHash("#privacy", setDialog)}>
      <div
        className="dialog narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-hd">
          <h2 id="privacy-title">Privacy</h2>
          <button className="icon-btn" type="button" aria-label="Close privacy notice" onClick={() => closeHash("#privacy", setDialog)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <p>SQL Learn runs fully in browser and makes no external requests. We do not process any personal data.</p>
        </div>
      </div>
    </div>
  );
}

type DiagramCard = { x: number; y: number; height: number };

function linkPath(from: DiagramCard, to: DiagramCard, cardWidth: number, cards: DiagramCard[]) {
  const fromRight = from.x + cardWidth;
  const toRight = to.x + cardWidth;
  const fromBottom = from.y + from.height;
  const toBottom = to.y + to.height;
  const overlapY = Math.min(fromBottom, toBottom) - Math.max(from.y, to.y);
  const headerY = (card: DiagramCard) => card.y + 24;
  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;
  let horizontal = false;
  if (overlapY > 8 && to.x >= fromRight - 8) {
    horizontal = true;
    x1 = fromRight;
    y1 = headerY(from);
    x2 = to.x;
    y2 = headerY(to);
  } else if (overlapY > 8 && from.x >= toRight - 8) {
    horizontal = true;
    x1 = from.x;
    y1 = headerY(from);
    x2 = toRight;
    y2 = headerY(to);
  } else if (to.y >= from.y) {
    x1 = from.x + cardWidth / 2;
    y1 = fromBottom;
    x2 = to.x + cardWidth / 2;
    y2 = to.y;
  } else {
    x1 = from.x + cardWidth / 2;
    y1 = from.y;
    x2 = to.x + cardWidth / 2;
    y2 = toBottom;
  }
  if (horizontal && Math.abs(x1 - x2) > cardWidth) {
    const rowBottom = Math.max(...cards.filter((card) => card.y === from.y).map((card) => card.y + card.height));
    const yUnder = rowBottom + 18;
    return `M ${x1} ${y1} L ${x1} ${yUnder} L ${x2} ${yUnder} L ${x2} ${y2}`;
  }
  if (horizontal) {
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

function DiagramDialog() {
  const { topic, setDialog } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  const schema = getSchema(topic.schemaId);
  const tables = schema.tables.filter((table) => topic.visibleTables.includes(table.name));
  const links = relationshipsFor(schema, topic.visibleTables);
  const columns = Math.min(3, Math.max(1, tables.length));
  const cardWidth = 220;
  const gapX = 78;
  const gapY = 40;
  const placed: { name: string; x: number; y: number; height: number; table: (typeof tables)[number] }[] = [];
  let cursorY = 20;
  for (let index = 0; index < tables.length; index += columns) {
    const row = tables.slice(index, index + columns);
    const heights = row.map((table) => 46 + table.columns.length * 22);
    row.forEach((table, column) => {
      placed.push({
        name: table.name,
        table,
        x: 20 + column * (cardWidth + gapX),
        y: cursorY,
        height: heights[column],
      });
    });
    cursorY += Math.max(...heights) + gapY;
  }
  const boardWidth = 40 + columns * (cardWidth + gapX);
  const boardHeight = Math.max(cursorY, 240);

  return (
    <div className="scrim" onMouseDown={() => setDialog(null)}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="er-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-hd">
          <h2 id="er-title">{schema.databaseName} diagram</h2>
          <button className="icon-btn" type="button" aria-label="Close diagram" onClick={() => setDialog(null)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <div className="er-board">
            <div className="er-cards" style={{ width: boardWidth, height: boardHeight }}>
              <svg className="er-svg" viewBox={`0 0 ${boardWidth} ${boardHeight}`} aria-hidden="true">
                {links.map((link) => {
                  const from = placed.find((card) => card.name === link.from);
                  const to = placed.find((card) => card.name === link.to);
                  if (!from || !to) return null;
                  return (
                    <path
                      key={`${link.from}.${link.column}-${link.to}`}
                      d={linkPath(from, to, cardWidth, placed)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      opacity="0.55"
                    />
                  );
                })}
              </svg>
              {placed.map((card) => (
                <article className="er-card" key={card.name} style={{ left: card.x, top: card.y, width: cardWidth }}>
                  <header>{card.name}</header>
                  <ul>
                    {card.table.columns.map((column) => (
                      <li key={column.name}>
                        <span>
                          {column.pk ? "PK " : column.fk ? "FK " : ""}
                          {column.name}
                        </span>
                        <span>{column.type}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
          <ul className="rel-list">
            {links.length === 0 ? <li>No foreign keys among the visible tables.</li> : null}
            {links.map((link) => (
              <li key={`${link.from}.${link.column}`}>
                {link.from}.{link.column} references {link.to}.{link.toColumn}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ChallengeSheet() {
  const { setSheet, tour } = useWorkspace();
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(tour === null, ref);
  const close = () => {
    if (tour !== null) return;
    setSheet(false);
  };
  return (
    <div className="scrim" onMouseDown={close}>
      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Challenge"
        data-tour="challenge"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-hd">
          <h2>Challenge</h2>
          <button className="icon-btn" type="button" aria-label="Close challenge" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <ChallengeCard />
      </aside>
    </div>
  );
}

function visibleTourBox(id: string) {
  const rects = [...document.querySelectorAll(`[data-tour="${id}"]`)]
    .filter((node) => {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((node) => node.getBoundingClientRect());
  if (rects.length === 0) return null;
  const top = Math.min(...rects.map((rect) => rect.top));
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { top, left, width: right - left, height: bottom - top };
}

function Tour() {
  const { tour, setTour, layout, sheet, pane, setPane, setSheet, updatePanels, progress } = useWorkspace();
  const cardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ top: 76, left: 16, width: 280, height: 48 });
  const [place, setPlace] = useState({ top: 140, left: 16 });
  useFocusTrap(tour !== null, cardRef);
  const step = tour ?? 0;
  const current = STEPS[step];

  useLayoutEffect(() => {
    if (tour === null) return;
    const id = STEPS[tour].id;
    if (id === "challenge") {
      if (layout === "compact") setPane("task");
      if (layout === "medium") setSheet(true);
      if (layout === "wide" && progress.panels.rightCollapsed) updatePanels({ rightCollapsed: false });
      return;
    }
    if (layout === "compact") setPane("editor");
    if (layout === "medium") setSheet(false);
  }, [tour, layout, progress.panels.rightCollapsed, setPane, setSheet, updatePanels]);

  useLayoutEffect(() => {
    if (tour === null) return;
    const measure = () => {
      const rect = visibleTourBox(STEPS[tour].id);
      const next = rect
        ? { top: Math.max(8, rect.top - 8), left: Math.max(8, rect.left - 8), width: rect.width + 16, height: rect.height + 16 }
        : { top: 76, left: 16, width: Math.min(320, window.innerWidth - 32), height: 48 };
      setBox(next);
      const cardHeight = 220;
      let top = next.top + next.height + 12;
      if (top + cardHeight > window.innerHeight - 12) top = Math.max(12, next.top - cardHeight - 12);
      const left = Math.min(Math.max(12, next.left), Math.max(12, window.innerWidth - 352));
      setPlace({ top, left });
    };
    const frame = window.requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 340);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [tour, layout, sheet, pane, progress.panels.rightCollapsed]);

  const body = typeof current.body === "string" ? current.body : current.body[layout];
  return (
    <div className="tour-layer">
      <div
        className="tour-hole"
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          boxShadow: "0 0 0 200vmax var(--scrim)",
        }}
      />
      <div
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        ref={cardRef}
        style={{ top: place.top, left: place.left }}
      >
        <h2 id="tour-title">{current.title}</h2>
        <p>{body}</p>
        <div className="tour-nav">
          <span className="tour-dots" aria-hidden="true">
            {STEPS.map((item, index) => (
              <i key={item.id} className={index === step ? "on" : undefined} />
            ))}
          </span>
          <button className="btn btn-text" type="button" onClick={() => setTour(null)}>
            Skip
          </button>
          <button className="btn btn-text" type="button" disabled={step === 0} onClick={() => setTour(step - 1)}>
            Back
          </button>
          <button
            className="btn btn-filled"
            type="button"
            onClick={() => {
              if (step === STEPS.length - 1) setTour(null);
              else setTour(step + 1);
            }}
          >
            {step === STEPS.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
