import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSchema, relationshipsFor } from "../data/schemas";
import { Icon } from "./Icon";
import { useFocusTrap } from "./useFocusTrap";
import { useWorkspace } from "../state/workspace";

export function SchemaExplorer({ collapsed = false }: { collapsed?: boolean }) {
  const { topic, question, setDialog, updatePanels, progress, insertAtCursor, shareLink } = useWorkspace();
  const schema = getSchema(topic.schemaId);
  const tables = schema.tables.filter((table) => topic.visibleTables.includes(table.name));
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sample, setSample] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const name of topic.visibleTables) next[name] = question.tablesUsed.includes(name);
    setOpen(next);
  }, [topic.id, question.id, topic.visibleTables, question.tablesUsed]);

  useEffect(() => {
    setSample(null);
  }, [topic.id, question.id]);

  const sampleName = sample && topic.visibleTables.includes(sample) ? sample : null;

  if (collapsed || progress.panels.leftCollapsed) {
    return (
      <>
        <div className="rail">
          <button className="icon-btn" type="button" aria-label="Expand schema" onClick={() => updatePanels({ leftCollapsed: false })}>
            <Icon name="chevrons-right" />
          </button>
          <button className="icon-btn" type="button" aria-label="Copy link to this database and task" onClick={shareLink}>
            <Icon name="share" />
          </button>
          <button className="icon-btn" type="button" aria-label="Open diagram" onClick={() => setDialog("er")}>
            <Icon name="expand" />
          </button>
          <span className="icon-btn" aria-hidden="true">
            <Icon name="folder" />
          </span>
        </div>
        {sampleName ? <SampleDialog tableName={sampleName} onClose={() => setSample(null)} /> : null}
      </>
    );
  }

  return (
    <>
    <div className="scroll">
      <div className="section-label">
        TABLES
        <span className="count-badge">{tables.length}</span>
      </div>
      {tables.map((table) => {
        const used = question.tablesUsed.includes(table.name);
        const expanded = open[table.name] ?? false;
        return (
          <div className="table-block" key={table.name}>
            <div className="table-head">
              <button
                className="table-toggle"
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen((current) => ({ ...current, [table.name]: !expanded }))}
              >
                <Icon name={expanded ? "chevron-down" : "chevron-right"} size={16} />
                <Icon name="code" size={16} />
                <span className="name">{table.name}</span>
                {used ? <span className="used-dot" title="Used in this exercise" /> : null}
              </button>
              <button className="sample-btn" type="button" aria-haspopup="dialog" aria-label={`Sample rows from ${table.name}`} onClick={() => setSample(table.name)}>
                Sample rows
              </button>
            </div>
            {expanded
              ? table.columns.map((column) => (
                  <button
                    className="col-row"
                    type="button"
                    key={column.name}
                    aria-label={`Insert ${column.name}`}
                    onClick={() => insertAtCursor(column.name)}
                  >
                    {column.pk ? <Icon name="key" size={16} /> : column.fk ? <Icon name="link" size={16} /> : <Icon name="bookmark" size={16} />}
                    <span className="name">{column.name}</span>
                    <span className="type-badge">{column.type}</span>
                  </button>
                ))
              : null}
          </div>
        );
      })}
      <p className="subtle" style={{ padding: "12px 16px 16px" }}>
        {relationshipsFor(schema, topic.visibleTables).length} links among the visible tables.
      </p>
    </div>
    {sampleName ? <SampleDialog tableName={sampleName} onClose={() => setSample(null)} /> : null}
    </>
  );
}

function SampleDialog({ tableName, onClose }: { tableName: string; onClose: () => void }) {
  const { sampleTable } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  const preview = useMemo(() => sampleTable(tableName), [sampleTable, tableName]);
  const caption = !preview.ok
    ? preview.error
    : preview.rows.length === 0
      ? "This table has no rows."
      : preview.truncated
        ? "First 3 rows"
        : preview.rows.length === 1
          ? "1 row"
          : `All ${preview.rows.length} rows`;

  return createPortal(
    <div className="scrim" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sample-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          onClose();
        }}
      >
        <div className="dialog-hd">
          <h2 id="sample-title">{tableName}</h2>
          <button className="icon-btn" type="button" aria-label="Close sample rows" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          {preview.ok ? <p className="subtle">{caption}</p> : null}
          {preview.ok && preview.columns.length > 0 ? (
            <div className="sample-grid">
              <table>
                <caption className="sr-only">
                  {caption} from {tableName}
                </caption>
                <thead>
                  <tr>
                    {preview.columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((value, columnIndex) => (
                        <td key={`${preview.columns[columnIndex]}-${rowIndex}`}>
                          {value === null ? <span className="null-chip">NULL</span> : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {!preview.ok ? <div className="error-card">{preview.error}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
