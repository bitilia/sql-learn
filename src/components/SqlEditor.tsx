import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSchema } from "../data/schemas";
import { highlightSql, mapSqlOffset, sameSqlTokens } from "../lib/sqlText";
import { completeSql, lexiconFor, type Suggestion } from "../lib/suggest";
import { useWorkspace } from "../state/workspace";
import { Icon } from "./Icon";

function caretAfterLeadingComment(text: string) {
  const breakAt = text.indexOf("\n");
  if (breakAt < 0) return 0;
  const first = text.slice(0, breakAt).trimStart();
  if (!first.startsWith("--")) return 0;
  return breakAt + 1;
}

function lineIndexAt(text: string, index: number) {
  return text.slice(0, index).split("\n").length - 1;
}

export function SqlEditor() {
  const { sqlText, setSql, registerInsert, celebrating, topic, question } = useWorkspace();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(sqlText);
  textRef.current = sqlText;
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const placeOnQuestion = useRef<string | null>(null);
  const seenQuestion = useRef(question.id);
  const initialCaret = caretAfterLeadingComment(sqlText);
  const selectionRef = useRef({ text: sqlText, start: initialCaret, end: initialCaret });
  const [line, setLine] = useState(() => lineIndexAt(sqlText, caretAfterLeadingComment(sqlText)));
  const [caret, setCaret] = useState(() => caretAfterLeadingComment(sqlText));
  const [range, setRange] = useState(false);
  const [closed, setClosed] = useState(false);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  const lines = sqlText.length > 0 ? sqlText.split("\n") : [""];
  const lexicon = useMemo(
    () => lexiconFor(getSchema(topic.schemaId), topic.visibleTables),
    [topic.schemaId, topic.visibleTables],
  );
  const completion = useMemo(() => completeSql(sqlText, caret, lexicon), [sqlText, caret, lexicon]);
  const items = range || closed ? [] : completion.items;
  const selected = Math.min(active, Math.max(0, items.length - 1));
  const ghost = sqlText.slice(caret).trim() === "" ? (items[selected]?.ghost ?? "") : "";
  const typedKey = `${completion.start}:${sqlText.slice(completion.start, caret)}:${topic.id}`;

  useEffect(() => {
    setClosed(false);
    setActive(0);
  }, [typedKey]);

  useLayoutEffect(() => {
    const text = textRef.current;
    const pos = caretAfterLeadingComment(text);
    placeOnQuestion.current = question.id;
    setCaret(pos);
    setRange(false);
    setLine(lineIndexAt(text, pos));
  }, [question.id]);

  useLayoutEffect(() => {
    if (placeOnQuestion.current !== question.id) return;
    const pos = caretAfterLeadingComment(textRef.current);
    if (caret !== pos) return;
    const area = areaRef.current;
    if (!area) return;
    const blocked = document.querySelector(".scrim:not([hidden]), .tour-layer");
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!blocked && finePointer && area.getClientRects().length > 0) area.focus({ preventScroll: true });
    area.selectionStart = pos;
    area.selectionEnd = pos;
    selectionRef.current = { text: textRef.current, start: pos, end: pos };
    placeOnQuestion.current = null;
  }, [question.id, caret]);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (seenQuestion.current !== question.id) {
      seenQuestion.current = question.id;
      const pos = caretAfterLeadingComment(sqlText);
      selectionRef.current = { text: sqlText, start: pos, end: pos };
      return;
    }
    const saved = selectionRef.current;
    if (!area || saved.text === sqlText) return;
    if (!sameSqlTokens(saved.text, sqlText)) {
      selectionRef.current = { text: sqlText, start: area.selectionStart, end: area.selectionEnd };
      return;
    }
    const start = mapSqlOffset(saved.text, sqlText, saved.start);
    const end = mapSqlOffset(saved.text, sqlText, saved.end);
    const nextStart = Math.min(start, end);
    const nextEnd = Math.max(start, end);
    selectionRef.current = { text: sqlText, start: nextStart, end: nextEnd };
    area.selectionStart = nextStart;
    area.selectionEnd = nextEnd;
    setCaret(nextStart);
    setRange(nextStart !== nextEnd);
    setLine(lineIndexAt(sqlText, nextStart));
  }, [sqlText, question.id]);

  useEffect(() => {
    registerInsert((snippet) => {
      const current = textRef.current;
      const node = areaRef.current;
      const start = node?.selectionStart ?? current.length;
      const end = node?.selectionEnd ?? current.length;
      const before = current[start - 1] ?? "";
      const pad = snippet.length > 0 && /[A-Za-z0-9_*)]/.test(before) && /[A-Za-z0-9_]/.test(snippet[0]) ? " " : "";
      const next = `${current.slice(0, start)}${pad}${snippet}${current.slice(end)}`;
      const caretPos = start + pad.length + snippet.length;
      setSql(next);
      setCaret(caretPos);
      setRange(false);
      requestAnimationFrame(() => placeCaret(caretPos, next));
    });
    return () => registerInsert(null);
  }, [registerInsert, setSql]);

  useEffect(() => {
    const area = areaRef.current;
    if (!area || items.length === 0) return;
    const update = () => setBox(caretBox(area, caret));
    update();
    area.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      area.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length, caret, sqlText, ghost]);

  useEffect(() => {
    document.getElementById(`sql-suggest-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected, items.length]);

  function placeCaret(caretPos: number, text: string) {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.selectionStart = caretPos;
    area.selectionEnd = caretPos;
    selectionRef.current = { text, start: caretPos, end: caretPos };
    setLine(text.slice(0, caretPos).split("\n").length - 1);
  }

  function syncScroll() {
    const top = areaRef.current?.scrollTop ?? 0;
    const left = areaRef.current?.scrollLeft ?? 0;
    if (preRef.current) {
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = top;
  }

  function updateCaret() {
    const node = areaRef.current;
    if (!node) return;
    setCaret(node.selectionStart);
    setRange(node.selectionStart !== node.selectionEnd);
    setLine(node.value.slice(0, node.selectionStart).split("\n").length - 1);
    selectionRef.current = { text: node.value, start: node.selectionStart, end: node.selectionEnd };
  }

  function accept(item: Suggestion) {
    const next = `${sqlText.slice(0, completion.start)}${item.insert}${sqlText.slice(completion.end)}`;
    const caretPos = completion.start + item.insert.length;
    setSql(next);
    setCaret(caretPos);
    setRange(false);
    requestAnimationFrame(() => placeCaret(caretPos, next));
  }

  const menu =
    items.length > 0 && box
      ? createPortal(
          <div
            className="suggest"
            role="listbox"
            id="sql-suggest"
            aria-label="Suggestions from the tables"
            style={{ top: box.top, left: box.left }}
          >
            {items.map((item, index) => (
              <button
                id={`sql-suggest-${index}`}
                key={`${item.kind}:${item.insert}:${item.detail}`}
                type="button"
                role="option"
                aria-selected={index === selected}
                onMouseDown={(event) => {
                  event.preventDefault();
                  accept(item);
                }}
                onMouseEnter={() => setActive(index)}
              >
                <span className="suggest-label">{item.label}</span>
                <span className="suggest-detail">{item.detail}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={celebrating ? "editor-shell is-correct" : "editor-shell"} data-tour="editor" style={{ ["--active-index" as string]: String(line) }}>
      {celebrating ? (
        <div className="celebrate" aria-hidden="true">
          <span className="celebrate-tick">
            <Icon name="check" size={24} />
          </span>
        </div>
      ) : null}
      <div className="editor-gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, index) => (
          <span key={index} className={index === line ? "active" : undefined}>
            {index + 1}
          </span>
        ))}
      </div>
      <div className="editor-code">
        <div className="active-line" />
        <pre ref={preRef}>
          {ghost ? (
            <>
              <span dangerouslySetInnerHTML={{ __html: highlightSql(sqlText.slice(0, caret)) }} />
              <span className="tok-ghost">{ghost}</span>
              <span dangerouslySetInnerHTML={{ __html: highlightSql(sqlText.slice(caret)) }} />
              {"\n"}
            </>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: `${highlightSql(sqlText)}\n` }} />
          )}
        </pre>
        <textarea
          ref={areaRef}
          value={sqlText}
          spellCheck={false}
          aria-label="SQL editor"
          aria-autocomplete="list"
          aria-controls={items.length > 0 ? "sql-suggest" : undefined}
          aria-activedescendant={items.length > 0 ? `sql-suggest-${selected}` : undefined}
          onChange={(event) => {
            setSql(event.target.value);
            setCaret(event.target.selectionStart);
            setRange(false);
            selectionRef.current = {
              text: event.target.value,
              start: event.target.selectionStart,
              end: event.target.selectionEnd,
            };
          }}
          onScroll={syncScroll}
          onKeyUp={updateCaret}
          onClick={updateCaret}
          onSelect={updateCaret}
          onBlur={() => {
            window.setTimeout(() => {
              if (document.activeElement !== areaRef.current) setClosed(true);
            }, 0);
          }}
          onFocus={() => setClosed(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && items.length > 0) {
              event.preventDefault();
              event.stopPropagation();
              setClosed(true);
              return;
            }
            if (items.length > 0 && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              event.preventDefault();
              const delta = event.key === "ArrowDown" ? 1 : -1;
              setActive((current) => (current + delta + items.length) % items.length);
              return;
            }
            if (items.length > 0 && event.key === "ArrowRight" && ghost && event.currentTarget.selectionStart === caret) {
              event.preventDefault();
              accept(items[selected]);
              return;
            }
            if (event.key !== "Tab") return;
            event.preventDefault();
            if (items.length > 0) {
              accept(items[selected]);
              return;
            }
            const start = event.currentTarget.selectionStart;
            const end = event.currentTarget.selectionEnd;
            const next = `${sqlText.slice(0, start)}  ${sqlText.slice(end)}`;
            const caretPos = start + 2;
            setSql(next);
            setCaret(caretPos);
            requestAnimationFrame(() => placeCaret(caretPos, next));
          }}
        />
      </div>
      {menu}
    </div>
  );
}

function caretBox(area: HTMLTextAreaElement, index: number) {
  const style = getComputedStyle(area);
  const rect = area.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const before = area.value.slice(0, index);
  const lineBreak = before.lastIndexOf("\n");
  const lineIndex = before.split("\n").length - 1;
  const column = before.slice(lineBreak + 1).replace(/\t/g, "  ").length;
  const width = charWidth(style.font);
  const left = clamp(rect.left + padLeft + column * width - area.scrollLeft, 8, window.innerWidth - 280);
  const lineBottom = rect.top + padTop + (lineIndex + 1) * lineHeight - area.scrollTop;
  const menuHeight = 220;
  const top = lineBottom + menuHeight > window.innerHeight - 8
    ? Math.max(8, lineBottom - lineHeight - menuHeight)
    : lineBottom;
  return { top, left };
}

function charWidth(font: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 8;
  context.font = font;
  return context.measureText("0").width || 8;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
