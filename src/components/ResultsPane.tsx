import { useState } from "react";
import type { Grid } from "../lib/compare";
import { shortcut } from "../lib/platform";
import { Icon } from "./Icon";
import { useWorkspace } from "../state/workspace";

function cell(value: string | number | null) {
  if (value === null) return <span className="null-chip">NULL</span>;
  return String(value);
}

function GridTable({ grid, caption }: { grid: Grid; caption: string }) {
  if (grid.columns.length === 0) {
    return <div className="empty-state">The statement returned no columns.</div>;
  }
  return (
    <div className="grid-scroll">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {grid.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.values.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, columnIndex) => (
                <td key={`${grid.columns[columnIndex]}-${rowIndex}`}>{cell(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsPane() {
  const { result, expected, boot, retryBoot, question, questions, progress } = useWorkspace();
  const [tab, setTab] = useState<"yours" | "expected">("yours");

  if (boot === "loading") {
    return (
      <div className="results">
        <div className="skeleton sk-line" />
        <div className="skeleton sk-block" />
        <div className="skeleton sk-line" />
      </div>
    );
  }

  if (boot === "error") {
    return (
      <div className="results">
        <div className="error-card">
          <strong>Runtime failed</strong>
          <p>The in-browser SQLite runtime did not start.</p>
          <button className="btn btn-filled" type="button" onClick={retryBoot}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const yours = result.kind === "grid" ? result.grid : null;
  const solvedCount = questions.filter((item) => progress.questions[item.id]?.status === "solved").length;

  return (
    <div className="results">
      <div className="results-head">
        <div className="pane-tabs" role="tablist" aria-label="Result panes">
          <button className="btn btn-text" type="button" role="tab" aria-selected={tab === "yours"} onClick={() => setTab("yours")}>
            Data Output
          </button>
          <button className="btn btn-text" type="button" role="tab" aria-selected={tab === "expected"} onClick={() => setTab("expected")}>
            Expected Output
          </button>
        </div>
        {result.kind === "grid" ? (
          <span className={result.match ? "status-chip solved" : "status-chip progress"}>
            <Icon name={result.match ? "check" : "warning"} size={16} />
            {result.match ? (result.awarded ? "Match · +10 XP" : "Match") : "Not a match"}
          </span>
        ) : null}
      </div>
      <div className="results-split">
        <section className={tab === "yours" ? "pane is-active" : "pane"} aria-label="Your result">
          <div className="pane-title">
            <Icon name="play" size={16} />
            Data Output
          </div>
          {result.kind === "idle" ? (
            <div className="empty-state">
              <Icon name="play" size={24} />
              <strong>No results yet</strong>
              <span>Write a query and press {shortcut.run} to run.</span>
            </div>
          ) : null}
          {result.kind === "error" ? (
            <div className="error-card" role="alert">
              <span className="card-hd">
                <Icon name="bug" size={16} />
                Statement error
              </span>
              <p>{result.message}</p>
            </div>
          ) : null}
          {result.kind === "grid" && !result.match && result.diff ? <p className="diff-note">{result.diff}</p> : null}
          {result.kind === "grid" && result.match ? <p className="match-note">{question.success}</p> : null}
          {yours ? <GridTable grid={yours} caption="Your result" /> : null}
        </section>
        <section className={tab === "expected" ? "pane is-active" : "pane"} aria-label="Expected result">
          <div className="pane-title">
            <Icon name="check" size={16} />
            Expected Output
            <span className="count-badge">{expected ? `${expected.values.length} rows` : "0 rows"}</span>
            <span className="subtle">
              {solvedCount} / {questions.length} done
            </span>
          </div>
          {expected ? (
            <GridTable grid={expected} caption="Expected result" />
          ) : (
            <div className="empty-state">Expected rows are still loading.</div>
          )}
        </section>
      </div>
    </div>
  );
}
