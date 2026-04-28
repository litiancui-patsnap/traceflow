import type { TaskBreakdownDraftResponse } from "../types";

interface TaskDraftEditorProps {
  draft: TaskBreakdownDraftResponse | null;
  loading: boolean;
  onGenerate: () => void;
  onChange: (draft: TaskBreakdownDraftResponse | null) => void;
  onSaveAll: () => void;
}

export function TaskDraftEditor(props: TaskDraftEditorProps) {
  const { draft, loading, onGenerate, onChange, onSaveAll } = props;

  function removeItem(index: number) {
    if (!draft) return;
    const tasks = draft.tasks.filter((_, itemIndex) => itemIndex !== index);
    onChange(tasks.length ? { ...draft, tasks } : null);
  }

  return (
    <>
      <button type="button" onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Task Draft"}
      </button>
      {draft ? (
        <div className="stack compact">
          {draft.tasks.map((item, index) => (
            <div key={`${item.title}-${index}`} className="stack compact draft-item">
              <div className="inline-actions">
                <strong>Draft Task {index + 1}</strong>
                <button type="button" className="ghost-button" onClick={() => removeItem(index)}>
                  Remove
                </button>
              </div>
              <input
                aria-label={`Draft task title ${index + 1}`}
                value={item.title}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    tasks: draft.tasks.map((task, itemIndex) =>
                      itemIndex === index ? { ...task, title: event.target.value } : task,
                    ),
                  })
                }
              />
              <textarea
                aria-label={`Draft task description ${index + 1}`}
                value={item.description || ""}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    tasks: draft.tasks.map((task, itemIndex) =>
                      itemIndex === index ? { ...task, description: event.target.value } : task,
                    ),
                  })
                }
              />
              <input
                aria-label={`Draft task owner ${index + 1}`}
                value={item.owner_name || ""}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    tasks: draft.tasks.map((task, itemIndex) =>
                      itemIndex === index ? { ...task, owner_name: event.target.value } : task,
                    ),
                  })
                }
              />
              <select
                aria-label={`Draft task type ${index + 1}`}
                value={item.task_type}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    tasks: draft.tasks.map((task, itemIndex) =>
                      itemIndex === index ? { ...task, task_type: event.target.value } : task,
                    ),
                  })
                }
              >
                <option value="backend">backend</option>
                <option value="frontend">frontend</option>
                <option value="app">app</option>
                <option value="qa">qa</option>
                <option value="product">product</option>
              </select>
            </div>
          ))}
          {draft.tasks.length ? (
            <button type="button" onClick={onSaveAll}>
              Save All Draft Tasks
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
