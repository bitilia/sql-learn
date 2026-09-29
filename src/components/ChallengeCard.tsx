import { runtimeName } from "../data/catalog";
import { Icon } from "./Icon";
import { useWorkspace } from "../state/workspace";

const difficultyLabel = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

export function ChallengeCard() {
  const { question, topic } = useWorkspace();
  const exercise = topic.kind === "collection" ? "SQL CHALLENGE" : "LEARN SQL";

  return (
    <div className="challenge scroll">
      <p className="overline">
        {difficultyLabel[question.difficulty].toUpperCase()} · {exercise}
      </p>
      <h2 className="challenge-title">{question.title}</h2>
      <span className={`chip chip-${question.difficulty}`}>{difficultyLabel[question.difficulty]}</span>
      <span className="chip role-chip">
        <Icon name="user" size={16} />
        {question.role}
      </span>
      <p>{question.context}</p>
      <article className="task-card">
        <p className="card-hd">Task</p>
        <p>{question.task}</p>
      </article>
      <article className="info-card">
        <p className="card-hd">
          <span className="dot" />
          Required output
        </p>
        <ul>
          {question.requiredOutput.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
      <article className="info-card">
        <p className="card-hd">
          <span className="dot" style={{ ["--dot" as string]: "var(--warning)" }} />
          Rules
        </p>
        <ul>
          {question.rules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
      <article className="info-card">
        <p className="card-hd">
          <span className="dot" style={{ ["--dot" as string]: "var(--success)" }} />
          Success
        </p>
        <p>{question.success}</p>
      </article>
      <p className="meta-line">
        {runtimeName}
      </p>
    </div>
  );
}
