import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { collections, questionsFor, topics } from "./data/catalog";
import { ChallengeCard } from "./components/ChallengeCard";
import { Icon, type IconName } from "./components/Icon";
import { Overlays } from "./components/Overlays";
import { ResultsPane } from "./components/ResultsPane";
import { SchemaExplorer } from "./components/SchemaExplorer";
import { SqlEditor } from "./components/SqlEditor";
import { useFocusTrap } from "./components/useFocusTrap";
import { shortcut } from "./lib/platform";
import { chipLabel, useWorkspace, type MenuId, type PaneId } from "./state/workspace";

const PANES: { id: PaneId; label: string; icon: IconName }[] = [
  { id: "schema", label: "Schema", icon: "folder" },
  { id: "editor", label: "Editor", icon: "terminal" },
  { id: "results", label: "Results", icon: "code" },
  { id: "task", label: "Task", icon: "click" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function App() {
  return <Shell />;
}

function Shell() {
  const workspace = useWorkspace();
  const {
    boot,
    layout,
    pane,
    setPane,
    route,
    topic,
    questions,
    question,
    progress,
    record,
    chip,
    running,
    menu,
    setMenu,
    setDialog,
    setSheet,
    setTour,
    sheet,
    level,
    setSource,
    go,
    stepQuestion,
    run,
    format,
    revealHint,
    copySolution,
    updatePanels,
    statusLine,
    live,
  } = workspace;

  const topicMenuRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [hintsHidden, setHintsHidden] = useState(false);
  const [hintCursor, setHintCursor] = useState(0);
  useFocusTrap(menu === "topic", topicMenuRef);
  useFocusTrap(menu === "overflow", overflowMenuRef);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#about") setDialog("about");
      if (window.location.hash === "#privacy") setDialog("privacy");
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [setDialog]);

  useEffect(() => {
    if (!menu) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest("[data-menu-root]")) return;
      setMenu(null);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [menu, setMenu]);

  useEffect(() => {
    setHintCursor(Math.max(0, record.hintsUsed - 1));
    setHintsHidden(false);
  }, [question.id, record.hintsUsed]);

  const panels = progress.panels;
  const catalog = route.source === "company" ? collections : topics;
  const showEditor = layout !== "compact" || pane === "editor";
  const showResults = layout !== "compact" || pane === "results";
  const chipIcon: IconName = chip === "solved" ? "check" : chip === "progress" ? "bolt" : "stop";

  function toggleMenu(id: Exclude<MenuId, null>) {
    setMenu(menu === id ? null : id);
  }

  function dragLeft(event: ReactPointerEvent) {
    if (panels.leftCollapsed) return;
    const origin = event.clientX;
    const start = panels.left;
    document.body.classList.add("is-dragging");
    const move = (ev: PointerEvent) => updatePanels({ left: clamp(start + ev.clientX - origin, 200, 480) }, false);
    const up = () => {
      document.body.classList.remove("is-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      updatePanels({}, true);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function dragRight(event: ReactPointerEvent) {
    if (panels.rightCollapsed) return;
    const origin = event.clientX;
    const start = panels.right;
    document.body.classList.add("is-dragging");
    const move = (ev: PointerEvent) => updatePanels({ right: clamp(start + origin - ev.clientX, 280, 520) }, false);
    const up = () => {
      document.body.classList.remove("is-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      updatePanels({}, true);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function dragSplit(event: ReactPointerEvent) {
    const origin = event.clientY;
    const start = panels.editorRatio;
    const height = mainRef.current?.getBoundingClientRect().height ?? 480;
    document.body.classList.add("is-dragging");
    const move = (ev: PointerEvent) => updatePanels({ editorRatio: clamp(start + (ev.clientY - origin) / height, 0.28, 0.75) }, false);
    const up = () => {
      document.body.classList.remove("is-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      updatePanels({}, true);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="app">
      <div className="blobs" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>
      <div className="wash" aria-hidden="true" />
      <a className="skip" href="#editor">
        Skip to editor
      </a>
      <header className="topbar">
        <h1 className="brand">
          <button
            className="brand-hit"
            type="button"
            aria-haspopup="dialog"
            aria-label="About SQL Learn"
            onClick={() => {
              const next = `${window.location.pathname}${window.location.search}#about`;
              window.history.replaceState(null, "", next);
              setDialog("about");
            }}
          >
            <img className="logo-mark" src="/favicon.webp" alt="" width={40} height={40} />
            <span className="wordmark">SQL Learn</span>
          </button>
        </h1>
        <div className="top-actions">
          <button className="btn btn-outlined" type="button" onClick={() => setDialog("reset")}>
            <Icon name="reset" size={16} />
            Reset
          </button>
        </div>
      </header>

      <div className="workspace">
        <div className="toolbar">
          <div className="segment" role="tablist" aria-label="Practice" data-tour="topics">
            <span className="segment-indicator" data-pos={route.source === "company" ? "1" : "0"} />
            <button type="button" role="tab" aria-selected={route.source === "topics"} onClick={() => setSource("topics")}>
              Learn SQL
            </button>
            <button type="button" role="tab" aria-selected={route.source === "company"} onClick={() => setSource("company")}>
              SQL Challenges
            </button>
          </div>
          <div className="menu-anchor" data-menu-root>
            <button className="topic-pill" type="button" data-tour="topics" aria-expanded={menu === "topic"} onClick={() => toggleMenu("topic")}>
              <Icon name="folder" size={16} />
              <span>
                {topic.name} · {questions.length} {questions.length === 1 ? "question" : "questions"}
              </span>
              <Icon name="chevron-down" size={16} />
            </button>
            {menu === "topic" ? (
              <div className="menu" role="menu" aria-label={route.source === "company" ? "Choose a SQL challenge" : "Choose a lesson"} ref={topicMenuRef}>
                <div className="menu-hd">{route.source === "company" ? `SQL Challenges · ${catalog.length}` : `Learn SQL · ${catalog.length}`}</div>
                {catalog.map((item) => (
                  <button
                    className="menu-item"
                    type="button"
                    role="menuitem"
                    key={item.id}
                    onClick={() => go({ source: route.source, topicId: item.id, index: 0 })}
                  >
                    <span className={item.id === topic.id ? "current-dot on" : "current-dot"} />
                    <span className="copy">
                      <strong>{item.name}</strong>
                      <span className="menu-desc">{item.description}</span>
                    </span>
                    <span className="count-badge">{questionsFor(item.id).length}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="cluster">
            <span className={`status-chip ${chip}`}>
              <Icon name={chipIcon} size={16} />
              {chipLabel(chip)}
            </span>
            <div className="pager">
              <button type="button" aria-label="Previous question" disabled={route.index === 0} onClick={() => stepQuestion(-1)}>
                <Icon name="chevron-left" />
              </button>
              <button className="count" type="button" aria-label="Open question navigator" onClick={() => setDialog("navigator")}>
                {chip === "solved" ? <Icon name="check" size={16} className="pop" /> : null}
                {route.index + 1} / {questions.length}
              </button>
              <button type="button" aria-label="Next question" disabled={route.index >= questions.length - 1} onClick={() => stepQuestion(1)}>
                <Icon name="chevron-right" />
              </button>
            </div>
            <button className="icon-btn secondary" type="button" aria-label="Start help tour" onClick={() => setTour(0)}>
              <Icon name="info" />
            </button>
            <div className="menu-anchor" data-menu-root>
              <button className="icon-btn overflow-btn" type="button" aria-label="More actions" aria-expanded={menu === "overflow"} onClick={() => toggleMenu("overflow")}>
                <Icon name="more" />
              </button>
              {menu === "overflow" ? (
                <div className="menu right" role="menu" aria-label="More actions" ref={overflowMenuRef}>
                  <button className="menu-item" type="button" role="menuitem" onClick={() => { setMenu(null); workspace.shareLink(); }}>
                    <span className="current-dot" />
                    <span className="copy">
                      <strong>Copy link</strong>
                      <span className="menu-desc">{workspace.databaseName} · {question.title}</span>
                    </span>
                    <Icon name="share" size={16} />
                  </button>
                  <button className="menu-item" type="button" role="menuitem" onClick={() => { setMenu(null); setTour(0); }}>
                    <span className="current-dot" />
                    <span className="copy">
                      <strong>Help tour</strong>
                      <span className="menu-desc">{question.concept}</span>
                    </span>
                    <Icon name="info" size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="panels">
          <aside
            className={pane === "schema" ? "panel panel-schema is-active" : "panel panel-schema"}
            style={{ width: panels.leftCollapsed ? 56 : panels.left }}
            aria-label="Database"
            data-tour="schema"
          >
            {panels.leftCollapsed ? null : (
              <div className="panel-hd">
                <div>
                  <h2 className="panel-title">Database</h2>
                  <p className="subtle">{workspace.databaseName}</p>
                </div>
                <div className="hd-actions">
                  <button className="icon-btn" type="button" aria-label="Copy link to this database and task" onClick={workspace.shareLink}>
                    <Icon name="share" />
                  </button>
                  <button className="icon-btn" type="button" aria-label="Open diagram" onClick={() => setDialog("er")}>
                    <Icon name="expand" />
                  </button>
                  <button className="icon-btn" type="button" aria-label="Collapse schema" onClick={() => updatePanels({ leftCollapsed: true })}>
                    <Icon name="chevrons-left" />
                  </button>
                </div>
              </div>
            )}
            <SchemaExplorer />
          </aside>
          <div
            className="handle handle-v"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize schema"
            aria-valuemin={200}
            aria-valuemax={480}
            aria-valuenow={Math.round(panels.left)}
            tabIndex={0}
            onPointerDown={dragLeft}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") updatePanels({ left: clamp(panels.left - 16, 200, 480) });
              if (event.key === "ArrowRight") updatePanels({ left: clamp(panels.left + 16, 200, 480) });
            }}
          >
            <span className="grip" />
          </div>
          <section
            className={pane === "editor" || pane === "results" ? "panel panel-main is-active" : "panel panel-main"}
            aria-label="Editor and results"
            ref={mainRef}
          >
            <div className="editor-wrap" id="editor" style={{ display: showEditor ? "flex" : "none", flex: layout === "compact" ? "1 1 auto" : `${panels.editorRatio} 1 0` }}>
              <div className="editor-toolbar">
                <span className="tab-label">SQL</span>
                <button
                  className="btn btn-filled"
                  type="button"
                  data-tour="run"
                  disabled={boot !== "ready" || running}
                  aria-label={running ? "Running" : "Run query"}
                  onClick={run}
                >
                  <Icon name="play" size={16} className={running ? "is-running" : undefined} />
                  {running ? "Running" : "Run"}
                  <span className="kbd">{shortcut.run}</span>
                </button>
                <button className="btn btn-outlined" type="button" aria-label="Format SQL" onClick={format}>
                  <Icon name="format" size={16} />
                  Format
                  <span className="kbd">{shortcut.format}</span>
                </button>
                <button
                  className="btn btn-tonal"
                  type="button"
                  disabled={record.hintsUsed >= question.hints.length}
                  onClick={revealHint}
                >
                  <Icon name="sparkles" size={16} />
                  {record.hintsUsed >= question.hints.length ? "Hints" : `Hint ${record.hintsUsed + 1}`}
                </button>
                <button
                  className="btn btn-tertiary push"
                  type="button"
                  disabled={record.solutionSeen}
                  onClick={() => setDialog("solution")}
                >
                  <Icon name="unlock" size={16} />
                  Solution
                </button>
              </div>
              {record.hintsUsed > 0 && hintsHidden ? (
                <div className="hint-stack">
                  <button className="btn btn-text" type="button" onClick={() => setHintsHidden(false)}>
                    <Icon name="comment" size={16} />
                    Show hints
                  </button>
                </div>
              ) : null}
              {record.hintsUsed > 0 && !hintsHidden ? (
                <div className="hint-stack">
                  <article className="hint-card">
                    <div className="hint-hd">
                      <Icon name="comment" size={16} />
                      <span>
                        Hint {Math.min(hintCursor, record.hintsUsed - 1) + 1}
                        {record.hintsUsed > 1 ? ` of ${record.hintsUsed}` : ""}
                      </span>
                      <span className="hint-actions">
                        {record.hintsUsed > 1 ? (
                          <>
                            <button
                              className="icon-btn"
                              type="button"
                              aria-label="Previous hint"
                              disabled={hintCursor <= 0}
                              onClick={() => setHintCursor((current) => Math.max(0, current - 1))}
                            >
                              <Icon name="chevron-left" size={16} />
                            </button>
                            <button
                              className="icon-btn"
                              type="button"
                              aria-label="Next hint"
                              disabled={hintCursor >= record.hintsUsed - 1}
                              onClick={() => setHintCursor((current) => Math.min(record.hintsUsed - 1, current + 1))}
                            >
                              <Icon name="chevron-right" size={16} />
                            </button>
                          </>
                        ) : null}
                        <button className="icon-btn" type="button" aria-label="Hide hints" onClick={() => setHintsHidden(true)}>
                          <Icon name="close" size={16} />
                        </button>
                      </span>
                    </div>
                    <p className="hint-body">{question.hints[Math.min(hintCursor, record.hintsUsed - 1)]}</p>
                  </article>
                </div>
              ) : null}
              {record.solutionSeen ? (
                <div className="hint-stack">
                  <article className="solution-card pop">
                    <p className="card-hd">
                      <Icon name="unlock" size={16} />
                      Reference solution
                    </p>
                    <pre>{question.solutionSql.trim()}</pre>
                    <button className="btn btn-tonal" type="button" onClick={copySolution}>
                      <Icon name="copy" size={16} />
                      Copy to editor
                    </button>
                  </article>
                </div>
              ) : null}
              <SqlEditor />
            </div>
            <div
              className="handle handle-h"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize editor and results"
              aria-valuemin={28}
              aria-valuemax={75}
              aria-valuenow={Math.round(panels.editorRatio * 100)}
              tabIndex={0}
              style={{ display: layout === "compact" ? "none" : undefined }}
              onPointerDown={dragSplit}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") updatePanels({ editorRatio: clamp(panels.editorRatio - 0.04, 0.28, 0.75) });
                if (event.key === "ArrowDown") updatePanels({ editorRatio: clamp(panels.editorRatio + 0.04, 0.28, 0.75) });
              }}
            >
              <span className="grip" />
            </div>
            <div className="results-wrap" style={{ display: showResults ? "flex" : "none", flex: layout === "compact" ? "1 1 auto" : `${1 - panels.editorRatio} 1 0` }}>
              <ResultsPane />
            </div>
          </section>
          <div
            className="handle handle-v handle-right"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize challenge"
            aria-valuemin={280}
            aria-valuemax={520}
            aria-valuenow={Math.round(panels.right)}
            tabIndex={0}
            onPointerDown={dragRight}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") updatePanels({ right: clamp(panels.right + 16, 280, 520) });
              if (event.key === "ArrowRight") updatePanels({ right: clamp(panels.right - 16, 280, 520) });
            }}
          >
            <span className="grip" />
          </div>
          <aside
            className={pane === "task" ? "panel panel-challenge is-active" : "panel panel-challenge"}
            style={{ width: panels.rightCollapsed ? 56 : panels.right }}
            aria-label="Challenge"
            data-tour="challenge"
          >
            {panels.rightCollapsed ? (
              <div className="rail">
                <button className="icon-btn" type="button" aria-label="Expand challenge" onClick={() => updatePanels({ rightCollapsed: false })}>
                  <Icon name="chevrons-left" />
                </button>
                <span className="icon-btn" aria-hidden="true">
                  <Icon name="click" />
                </span>
              </div>
            ) : (
              <>
                <div className="panel-hd">
                  <h2 className="panel-title">Challenge</h2>
                  <button className="icon-btn" type="button" aria-label="Collapse challenge" onClick={() => updatePanels({ rightCollapsed: true })}>
                    <Icon name="chevrons-right" />
                  </button>
                </div>
                <ChallengeCard />
              </>
            )}
          </aside>
        </div>
      </div>

      <footer className="statusbar">
        <div className="status-main">
          <span className={boot === "ready" ? "status-dot ready" : "status-dot"} />
          {boot === "error" ? <Icon name="wifi-off" size={16} /> : boot === "ready" ? <Icon name="wifi" size={16} /> : null}
          <span>{statusLine}</span>
          {boot === "error" ? (
            <button className="status-retry" type="button" onClick={workspace.retryBoot}>
              Retry
            </button>
          ) : null}
        </div>
        {progress.streak > 0 ? (
          <span className="xp-badge">
            <Icon name="fire" size={16} />
            {progress.streak}
          </span>
        ) : null}
        <span className="xp-badge">
          <Icon name="gem" size={16} />
          Lv {level} · {progress.xp} XP
        </span>
        <a
          className="privacy-link"
          href="#privacy"
          onClick={(event) => {
            event.preventDefault();
            const next = `${window.location.pathname}${window.location.search}#privacy`;
            window.history.replaceState(null, "", next);
            setDialog("privacy");
          }}
        >
          Privacy
        </a>
      </footer>

      <nav className="bottom-nav" aria-label="Workspace sections">
        {PANES.map((item) => (
          <button key={item.id} type="button" aria-current={pane === item.id ? "page" : undefined} onClick={() => setPane(item.id)}>
            <span className="nav-pill">
              <Icon name={item.icon} size={20} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {layout === "medium" && !sheet ? (
        <button className="fab" type="button" aria-label="Open challenge" onClick={() => setSheet(true)}>
          <Icon name="click" size={24} />
        </button>
      ) : null}

      <div className="live" aria-live="polite">
        {live}
      </div>
      <Overlays />
    </div>
  );
}
